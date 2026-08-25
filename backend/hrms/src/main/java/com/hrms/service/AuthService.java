package com.hrms.service;

import com.hrms.dto.AuthDTOs;
import com.hrms.entity.Employee;
import com.hrms.enums.Role;
import com.hrms.repository.EmployeeRepository;
import com.hrms.security.JwtUtil;

import lombok.RequiredArgsConstructor;

import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.LockedException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class AuthService {

        private final AuthenticationManager authenticationManager;
        private final EmployeeRepository employeeRepository;
        private final UserCacheService userCacheService;
        private final JwtUtil jwtUtil;
        private final SessionActivityService sessionActivityService;
        private final LoginAttemptService loginAttemptService;

        // ============================================================
        // LOGIN
        // ============================================================

        public AuthDTOs.AuthResponse login(AuthDTOs.LoginRequest request) {

                final String email = request.getEmail();

                Employee emp;

                // --------------------------------------------------------
                // FIND USER
                // --------------------------------------------------------

                try {

                        emp = userCacheService.getByEmail(email);

                } catch (Exception e) {

                        throw new BadCredentialsException(
                                        "Invalid email or password");
                }

                // --------------------------------------------------------
                // CHECK EXPIRED LOCK
                // --------------------------------------------------------

                emp = clearExpiredLock(emp);

                // --------------------------------------------------------
                // CHECK ACTIVE LOCK
                // --------------------------------------------------------

                if (!emp.isAccountNonLocked()) {

                        long minutesLeft = minutesRemaining(
                                        emp.getLockTime());

                        throw new LockedException(
                                        "Account is locked due to multiple failed login attempts. "
                                                        + "Try again in "
                                                        + minutesLeft
                                                        + " minute(s).");
                }

                // --------------------------------------------------------
                // PORTAL VALIDATION
                // --------------------------------------------------------

                if ("EMPLOYEE".equalsIgnoreCase(request.getLoginType())) {

                        if (emp.getRole() != Role.EMPLOYEE) {

                                throw new BadCredentialsException(
                                                "This account belongs to Admin/HR. "
                                                                + "Please use the Admin/HR login portal.");
                        }

                } else if ("ADMIN".equalsIgnoreCase(request.getLoginType())) {

                        if (emp.getRole() == Role.EMPLOYEE) {

                                throw new BadCredentialsException(
                                                "This account is an Employee account. "
                                                                + "Please use the Employee login portal.");
                        }
                }

                // --------------------------------------------------------
                // PASSWORD AUTHENTICATION
                // --------------------------------------------------------

                Authentication auth;

                try {

                        auth = authenticationManager.authenticate(
                                        new UsernamePasswordAuthenticationToken(
                                                        email,
                                                        request.getPassword()));

                } catch (BadCredentialsException ex) {

                        // IMPORTANT:
                        // Save the failed attempt in an independent transaction.
                        loginAttemptService.handleFailedLogin(email);

                        // Return the normal authentication error.
                        throw ex;
                }

                // --------------------------------------------------------
                // SUCCESSFUL LOGIN
                // --------------------------------------------------------

                Employee authenticated = (Employee) auth.getPrincipal();

                // --------------------------------------------------------
                // RESET FAILED LOGIN COUNTER
                // --------------------------------------------------------

                loginAttemptService.resetFailedAttempts(
                                authenticated.getEmail());

                // --------------------------------------------------------
                // START SESSION ACTIVITY
                // --------------------------------------------------------

                sessionActivityService.recordActivity(
                                authenticated.getEmail());

                // --------------------------------------------------------
                // CREATE RESPONSE
                // --------------------------------------------------------

                AuthDTOs.AuthResponse response = new AuthDTOs.AuthResponse();

                response.setAccessToken(
                                jwtUtil.generateToken(authenticated));

                response.setRefreshToken(
                                jwtUtil.generateRefreshToken(authenticated));

                response.setRole(
                                authenticated.getRole().name());

                response.setEmployeeId(
                                authenticated.getId());

                response.setEmployeeCode(
                                authenticated.getEmployeeId());

                response.setName(
                                authenticated.getFirstName()
                                                + " "
                                                + authenticated.getLastName());

                response.setEmail(
                                authenticated.getEmail());

                response.setExpiresIn(
                                jwtUtil.getExpiration());

                return response;
        }

        // ============================================================
        // REFRESH TOKEN
        // ============================================================

        @Transactional(readOnly = true)
        public AuthDTOs.AuthResponse refresh(
                        AuthDTOs.RefreshTokenRequest request) {

                // --------------------------------------------------------
                // VALIDATE REFRESH TOKEN
                // --------------------------------------------------------

                if (!jwtUtil.validateToken(
                                request.getRefreshToken())) {

                        throw new BadCredentialsException(
                                        "Invalid or expired refresh token");
                }

                // --------------------------------------------------------
                // EXTRACT EMAIL
                // --------------------------------------------------------

                String email = jwtUtil.extractEmail(
                                request.getRefreshToken());

                Employee emp;

                // --------------------------------------------------------
                // FIND USER
                // --------------------------------------------------------

                try {

                        emp = userCacheService.getByEmail(email);

                } catch (Exception e) {

                        throw new BadCredentialsException(
                                        "User not found");
                }

                // --------------------------------------------------------
                // CREATE NEW TOKENS
                //
                // Do not reset inactivity timer here.
                // --------------------------------------------------------

                AuthDTOs.AuthResponse response = new AuthDTOs.AuthResponse();

                response.setAccessToken(
                                jwtUtil.generateToken(emp));

                response.setRefreshToken(
                                jwtUtil.generateRefreshToken(emp));

                response.setRole(
                                emp.getRole().name());

                response.setEmployeeId(
                                emp.getId());

                response.setEmployeeCode(
                                emp.getEmployeeId());

                response.setName(
                                emp.getFirstName()
                                                + " "
                                                + emp.getLastName());

                response.setEmail(
                                emp.getEmail());

                response.setExpiresIn(
                                jwtUtil.getExpiration());

                return response;
        }

        // ============================================================
        // CLEAR EXPIRED LOCK
        // ============================================================

        private Employee clearExpiredLock(Employee emp) {

                // No lock exists
                if (emp.getLockTime() == null) {
                        return emp;
                }

                // --------------------------------------------------------
                // CHECK LOCK EXPIRATION
                // --------------------------------------------------------

                long elapsedMinutes = Duration.between(
                                emp.getLockTime(),
                                LocalDateTime.now()).toMinutes();

                boolean expired = elapsedMinutes >= Employee.LOCK_DURATION_MINUTES;

                if (!expired) {
                        return emp;
                }

                // --------------------------------------------------------
                // LOAD FRESH EMPLOYEE FROM DATABASE
                // --------------------------------------------------------

                Employee managed = employeeRepository.findByEmail(
                                emp.getEmail()).orElse(emp);

                // --------------------------------------------------------
                // RESET LOCK
                // --------------------------------------------------------

                managed.setFailedAttempts(0);
                managed.setLockTime(null);

                Employee saved = employeeRepository.saveAndFlush(managed);

                // --------------------------------------------------------
                // CLEAR CACHE
                // --------------------------------------------------------

                userCacheService.evict(
                                saved.getEmail());

                return saved;
        }

        // ============================================================
        // CALCULATE REMAINING LOCK TIME
        // ============================================================

        private long minutesRemaining(
                        LocalDateTime lockTime) {

                if (lockTime == null) {
                        return 0;
                }

                long elapsed = Duration.between(
                                lockTime,
                                LocalDateTime.now()).toMinutes();

                long remaining = Employee.LOCK_DURATION_MINUTES
                                - elapsed;

                // Never show 0 while account is still locked
                return Math.max(remaining, 1);
        }
}