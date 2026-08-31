package com.hrms.service;

import com.hrms.dto.AuthDTOs;
import com.hrms.entity.Employee;
import com.hrms.enums.Role;
import com.hrms.exception.OtpLoginRequiredException;
import com.hrms.repository.EmployeeRepository;
import com.hrms.security.JwtUtil;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

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
@Slf4j
public class AuthService {

        private final AuthenticationManager authenticationManager;
        private final EmployeeRepository employeeRepository;
        private final UserCacheService userCacheService;
        private final JwtUtil jwtUtil;
        private final SessionActivityService sessionActivityService;
        private final LoginAttemptService loginAttemptService;

        // ============================================================
        // NORMAL PASSWORD LOGIN
        // ============================================================

        @Transactional
        public AuthDTOs.AuthResponse login(
                        AuthDTOs.LoginRequest request) {

                String email = normalizeEmail(request.getEmail());

                if (email.isEmpty()) {
                        throw new BadCredentialsException(
                                        "Invalid email or password");
                }

                // --------------------------------------------------------
                // FIND EMPLOYEE
                // --------------------------------------------------------

                Employee employee;

                try {
                        employee = employeeRepository
                                        .findByEmail(email)
                                        .orElseThrow(() -> new BadCredentialsException(
                                                        "Invalid email or password"));
                } catch (BadCredentialsException ex) {
                        throw ex;
                } catch (Exception ex) {
                        log.error(
                                        "Failed to load employee during login",
                                        ex);

                        throw new BadCredentialsException(
                                        "Invalid email or password");
                }

                // --------------------------------------------------------
                // ACTIVE CHECK
                // --------------------------------------------------------

                if (!employee.isActive()) {
                        throw new BadCredentialsException(
                                        "Your account is inactive. Please contact HR/Admin.");
                }

                // --------------------------------------------------------
                // OTP LOGIN REQUIRED
                // --------------------------------------------------------

                /*
                 * After the configured number of lockouts, password login
                 * is disabled and the employee must use OTP verification.
                 */
                if (employee.isOtpLoginRequired()) {
                        throw new OtpLoginRequiredException(
                                        "OTP verification required");
                }

                // --------------------------------------------------------
                // EXPIRED TEMPORARY LOCK
                // --------------------------------------------------------

                if (employee.getLockTime() != null
                                && employee.isAccountNonLocked()) {

                        loginAttemptService.clearExpiredLock(email);

                        employee = employeeRepository
                                        .findByEmail(email)
                                        .orElseThrow(() -> new BadCredentialsException(
                                                        "Invalid email or password"));
                }

                // --------------------------------------------------------
                // CURRENTLY LOCKED
                // --------------------------------------------------------

                if (!employee.isAccountNonLocked()) {

                        throw buildLockedException(
                                        employee.getLockTime());
                }

                // --------------------------------------------------------
                // LOGIN TYPE VALIDATION
                // --------------------------------------------------------

                validateLoginType(
                                employee,
                                request.getLoginType());

                // --------------------------------------------------------
                // PASSWORD AUTHENTICATION
                // --------------------------------------------------------

                Authentication authentication;

                try {

                        authentication = authenticationManager.authenticate(
                                        new UsernamePasswordAuthenticationToken(
                                                        email,
                                                        request.getPassword()));

                } catch (BadCredentialsException ex) {

                        /*
                         * Failed login must be recorded in a separate transaction
                         * so the failed-attempt state is persisted even though
                         * authentication fails.
                         */
                        loginAttemptService.handleFailedLogin(email);

                        /*
                         * Always reload the employee from the database.
                         */
                        Employee latestEmployee = employeeRepository
                                        .findByEmail(email)
                                        .orElse(null);

                        if (latestEmployee == null) {
                                throw new BadCredentialsException(
                                                "Invalid email or password");
                        }

                        // ----------------------------------------------------
                        // OTP NOW REQUIRED
                        // ----------------------------------------------------

                        if (latestEmployee.isOtpLoginRequired()) {

                                throw new OtpLoginRequiredException(
                                                "OTP verification required");
                        }

                        // ----------------------------------------------------
                        // TEMPORARY LOCK CREATED
                        // ----------------------------------------------------

                        if (latestEmployee.getLockTime() != null
                                        && !latestEmployee.isAccountNonLocked()) {

                                throw buildLockedException(
                                                latestEmployee.getLockTime());
                        }

                        // ----------------------------------------------------
                        // NORMAL INVALID PASSWORD
                        // ----------------------------------------------------

                        throw new BadCredentialsException(
                                        "Invalid email or password");
                }

                // ========================================================
                // SUCCESSFUL PASSWORD LOGIN
                // ========================================================

                Employee authenticatedEmployee = (Employee) authentication.getPrincipal();

                // --------------------------------------------------------
                // RESET CURRENT FAILED ATTEMPTS
                // --------------------------------------------------------

                loginAttemptService.resetFailedAttempts(
                                authenticatedEmployee.getEmail());

                // --------------------------------------------------------
                // START / UPDATE SESSION ACTIVITY
                // --------------------------------------------------------

                sessionActivityService.recordActivity(
                                authenticatedEmployee.getEmail());

                // --------------------------------------------------------
                // RELOAD AFTER SECURITY STATE UPDATE
                // --------------------------------------------------------

                Employee latestEmployee = employeeRepository
                                .findByEmail(
                                                authenticatedEmployee.getEmail())
                                .orElseThrow(() -> new BadCredentialsException(
                                                "User account not found"));

                // --------------------------------------------------------
                // CLEAR CACHE
                // --------------------------------------------------------

                userCacheService.evict(
                                latestEmployee.getEmail());

                // --------------------------------------------------------
                // BUILD JWT RESPONSE
                // --------------------------------------------------------

                return buildAuthResponse(
                                latestEmployee);
        }

        // ============================================================
        // LOGIN USING OTP
        // ============================================================

        @Transactional
        public AuthDTOs.AuthResponse loginWithOtp(
                        Employee employee) {

                if (employee == null) {
                        throw new BadCredentialsException(
                                        "Invalid OTP login request");
                }

                String email = normalizeEmail(
                                employee.getEmail());

                if (email.isEmpty()) {
                        throw new BadCredentialsException(
                                        "Invalid OTP login request");
                }

                // --------------------------------------------------------
                // ALWAYS LOAD FRESH EMPLOYEE
                // --------------------------------------------------------

                Employee currentEmployee = employeeRepository
                                .findByEmail(email)
                                .orElseThrow(() -> new BadCredentialsException(
                                                "User account not found"));

                // --------------------------------------------------------
                // ACTIVE CHECK
                // --------------------------------------------------------

                if (!currentEmployee.isActive()) {
                        throw new BadCredentialsException(
                                        "Your account is inactive. Please contact HR/Admin.");
                }

                // --------------------------------------------------------
                // OTP REQUIRED CHECK
                // --------------------------------------------------------

                if (!currentEmployee.isOtpLoginRequired()) {
                        throw new BadCredentialsException(
                                        "OTP login is not required for this account.");
                }

                // --------------------------------------------------------
                // RESET LOGIN LOCK STATE
                // --------------------------------------------------------

                loginAttemptService.resetAfterOtpLogin(
                                email);

                // --------------------------------------------------------
                // RELOAD AFTER RESET
                // --------------------------------------------------------

                Employee authenticatedEmployee = employeeRepository
                                .findByEmail(email)
                                .orElseThrow(() -> new BadCredentialsException(
                                                "User account not found"));

                // --------------------------------------------------------
                // CLEAR CACHE
                // --------------------------------------------------------

                userCacheService.evict(email);

                // --------------------------------------------------------
                // RECORD SESSION ACTIVITY
                // --------------------------------------------------------

                sessionActivityService.recordActivity(email);

                // --------------------------------------------------------
                // BUILD JWT
                // --------------------------------------------------------

                return buildAuthResponse(
                                authenticatedEmployee);
        }

        // ============================================================
        // BUILD AUTH RESPONSE
        // ============================================================

        private AuthDTOs.AuthResponse buildAuthResponse(
                        Employee employee) {

                if (employee == null
                                || employee.getRole() == null) {

                        throw new BadCredentialsException(
                                        "Invalid employee account");
                }

                AuthDTOs.AuthResponse response = new AuthDTOs.AuthResponse();

                // --------------------------------------------------------
                // ACCESS TOKEN
                // --------------------------------------------------------

                response.setAccessToken(
                                jwtUtil.generateToken(employee));

                // --------------------------------------------------------
                // REFRESH TOKEN
                // --------------------------------------------------------

                response.setRefreshToken(
                                jwtUtil.generateRefreshToken(employee));

                response.setTokenType("Bearer");

                // --------------------------------------------------------
                // USER INFORMATION
                // --------------------------------------------------------

                response.setRole(
                                employee.getRole().name());

                response.setEmployeeId(
                                employee.getId());

                response.setEmployeeCode(
                                employee.getEmployeeId());

                response.setName(
                                buildEmployeeName(employee));

                response.setEmail(
                                employee.getEmail());

                // --------------------------------------------------------
                // TOKEN EXPIRATION
                // --------------------------------------------------------

                response.setExpiresIn(
                                jwtUtil.getExpiration());

                response.setRequiresOtp(false);

                return response;
        }

        // ============================================================
        // REFRESH TOKEN
        // ============================================================

        public AuthDTOs.AuthResponse refresh(
                        AuthDTOs.RefreshTokenRequest request) {

                if (request == null
                                || request.getRefreshToken() == null
                                || request.getRefreshToken().isBlank()) {

                        throw new BadCredentialsException(
                                        "Invalid refresh token");
                }

                String refreshToken = request.getRefreshToken().trim();

                // --------------------------------------------------------
                // VALIDATE TOKEN
                // --------------------------------------------------------

                try {

                        if (!jwtUtil.validateToken(refreshToken)) {

                                throw new BadCredentialsException(
                                                "Invalid or expired refresh token");
                        }

                } catch (BadCredentialsException ex) {

                        throw ex;

                } catch (Exception ex) {

                        log.warn(
                                        "Refresh token validation failed",
                                        ex);

                        throw new BadCredentialsException(
                                        "Invalid or expired refresh token");
                }

                // --------------------------------------------------------
                // EXTRACT EMAIL
                // --------------------------------------------------------

                String email;

                try {

                        email = normalizeEmail(
                                        jwtUtil.extractEmail(refreshToken));

                } catch (Exception ex) {

                        log.warn(
                                        "Unable to extract identity from refresh token",
                                        ex);

                        throw new BadCredentialsException(
                                        "Invalid or expired refresh token");
                }

                if (email.isEmpty()) {

                        throw new BadCredentialsException(
                                        "Invalid or expired refresh token");
                }

                // --------------------------------------------------------
                // FIND CURRENT EMPLOYEE
                // --------------------------------------------------------

                Employee employee;

                try {

                        employee = employeeRepository
                                        .findByEmail(email)
                                        .orElseThrow(() -> new BadCredentialsException(
                                                        "Invalid or expired refresh token"));

                } catch (BadCredentialsException ex) {

                        throw ex;

                } catch (Exception ex) {

                        log.error(
                                        "Failed to load employee during token refresh",
                                        ex);

                        throw new BadCredentialsException(
                                        "Unable to refresh authentication token");
                }

                // --------------------------------------------------------
                // ACTIVE CHECK
                // --------------------------------------------------------

                if (!employee.isActive()) {

                        throw new BadCredentialsException(
                                        "Account is inactive");
                }

                // --------------------------------------------------------
                // OTP REQUIRED CHECK
                // --------------------------------------------------------

                /*
                 * If an account has entered the OTP-required state,
                 * do not allow an old refresh token to bypass that state.
                 */
                if (employee.isOtpLoginRequired()) {

                        throw new OtpLoginRequiredException(
                                        "OTP verification required");
                }

                // --------------------------------------------------------
                // TEMPORARY LOCK CHECK
                // --------------------------------------------------------

                if (!employee.isAccountNonLocked()) {

                        throw buildLockedException(
                                        employee.getLockTime());
                }

                // --------------------------------------------------------
                // BUILD NEW ACCESS + REFRESH TOKENS
                // --------------------------------------------------------

                return buildAuthResponse(employee);
        }

        // ============================================================
        // LOGIN TYPE VALIDATION
        // ============================================================

        private void validateLoginType(
                        Employee employee,
                        String loginType) {

                if (employee == null
                                || employee.getRole() == null) {

                        throw new BadCredentialsException(
                                        "Invalid employee account");
                }

                if (loginType == null
                                || loginType.isBlank()) {

                        return;
                }

                String normalizedLoginType = loginType.trim().toUpperCase();

                // --------------------------------------------------------
                // EMPLOYEE LOGIN
                // --------------------------------------------------------

                if ("EMPLOYEE".equals(normalizedLoginType)) {

                        if (employee.getRole() != Role.EMPLOYEE) {

                                throw new BadCredentialsException(
                                                "This account belongs to Admin/HR. " +
                                                                "Please use the Admin/HR login portal.");
                        }

                        return;
                }

                // --------------------------------------------------------
                // ADMIN / HR LOGIN
                // --------------------------------------------------------

                if ("ADMIN".equals(normalizedLoginType)) {

                        if (employee.getRole() == Role.EMPLOYEE) {

                                throw new BadCredentialsException(
                                                "This account is an Employee account. " +
                                                                "Please use the Employee login portal.");
                        }

                        return;
                }

                // --------------------------------------------------------
                // INVALID LOGIN TYPE
                // --------------------------------------------------------

                throw new BadCredentialsException(
                                "Invalid login type");
        }

        // ============================================================
        // BUILD LOCKED EXCEPTION
        // ============================================================

        private LockedException buildLockedException(
                        LocalDateTime lockTime) {

                if (lockTime == null) {

                        return new LockedException(
                                        "Account temporarily locked. " +
                                                        "Please try again later.");
                }

                LocalDateTime unlockTime = lockTime.plusMinutes(
                                Employee.LOCK_DURATION_MINUTES);

                long remainingSeconds = Duration.between(
                                LocalDateTime.now(),
                                unlockTime)
                                .getSeconds();

                long remainingMinutes = (Math.max(0, remainingSeconds) + 59) / 60;

                return new LockedException(
                                "Account temporarily locked. " +
                                                "Please try again in " +
                                                Math.max(1, remainingMinutes) +
                                                " minute(s).");
        }

        // ============================================================
        // BUILD EMPLOYEE NAME
        // ============================================================

        private String buildEmployeeName(
                        Employee employee) {

                String firstName = employee.getFirstName() == null
                                ? ""
                                : employee.getFirstName().trim();

                String lastName = employee.getLastName() == null
                                ? ""
                                : employee.getLastName().trim();

                String fullName = (firstName + " " + lastName).trim();

                return fullName.isEmpty()
                                ? "Employee"
                                : fullName;
        }

        // ============================================================
        // NORMALIZE EMAIL
        // ============================================================

        private String normalizeEmail(
                        String email) {

                if (email == null) {
                        return "";
                }

                return email.trim().toLowerCase();
        }
}