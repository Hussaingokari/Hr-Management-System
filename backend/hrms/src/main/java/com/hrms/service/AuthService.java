package com.hrms.service;

import com.hrms.dto.AuthDTOs;
import com.hrms.entity.Employee;
import com.hrms.enums.Role;
import com.hrms.repository.EmployeeRepository;
import com.hrms.security.JwtUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final AuthenticationManager authenticationManager;
    private final EmployeeRepository employeeRepository;
    private final UserCacheService userCacheService;
    private final JwtUtil jwtUtil;
    private final SessionActivityService sessionActivityService;

    public AuthDTOs.AuthResponse login(AuthDTOs.LoginRequest request) {

        Employee emp;
        try {
            emp = userCacheService.getByEmail(request.getEmail());
        } catch (Exception e) {
            throw new BadCredentialsException("Invalid email or password");
        }

        // Enforce correct portal based on UI login type
        // Employee portal = EMPLOYEE
        // Admin portal = ADMIN / HR
        if ("EMPLOYEE".equalsIgnoreCase(request.getLoginType())) {

            if (emp.getRole() != Role.EMPLOYEE) {
                throw new BadCredentialsException(
                        "This account belongs to Admin/HR. Please use the Admin/HR login portal.");
            }

        } else if ("ADMIN".equalsIgnoreCase(request.getLoginType())) {

            if (emp.getRole() == Role.EMPLOYEE) {
                throw new BadCredentialsException(
                        "This account is an Employee account. Please use the Employee login portal.");
            }
        }

        Authentication auth = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                        request.getEmail(),
                        request.getPassword()
                )
        );

        Employee authenticated = (Employee) auth.getPrincipal();

        /*
         * Start the 5-minute inactivity timer after successful login.
         *
         * This applies to:
         * ADMIN
         * HR
         * EMPLOYEE
         */
        sessionActivityService.recordActivity(authenticated.getEmail());

        AuthDTOs.AuthResponse response = new AuthDTOs.AuthResponse();

        response.setAccessToken(
                jwtUtil.generateToken(authenticated)
        );

        response.setRefreshToken(
                jwtUtil.generateRefreshToken(authenticated)
        );

        response.setRole(
                authenticated.getRole().name()
        );

        response.setEmployeeId(
                authenticated.getId()
        );

        response.setEmployeeCode(
                authenticated.getEmployeeId()
        );

        response.setName(
                authenticated.getFirstName() + " " + authenticated.getLastName()
        );

        response.setEmail(
                authenticated.getEmail()
        );

        response.setExpiresIn(
                jwtUtil.getExpiration()
        );

        return response;
    }

    public AuthDTOs.AuthResponse refresh(
            AuthDTOs.RefreshTokenRequest request) {

        if (!jwtUtil.validateToken(request.getRefreshToken())) {
            throw new BadCredentialsException(
                    "Invalid or expired refresh token"
            );
        }

        String email = jwtUtil.extractEmail(
                request.getRefreshToken()
        );

        Employee emp;

        try {
            emp = userCacheService.getByEmail(email);
        } catch (Exception e) {
            throw new BadCredentialsException(
                    "User not found"
            );
        }

        /*
         * Refreshing a JWT should not automatically reset the
         * inactivity timer.
         *
         * The inactivity timer represents actual HRMS usage,
         * not simply token renewal.
         */
        AuthDTOs.AuthResponse response = new AuthDTOs.AuthResponse();

        response.setAccessToken(
                jwtUtil.generateToken(emp)
        );

        response.setRefreshToken(
                jwtUtil.generateRefreshToken(emp)
        );

        response.setRole(
                emp.getRole().name()
        );

        response.setEmployeeId(
                emp.getId()
        );

        response.setEmployeeCode(
                emp.getEmployeeId()
        );

        response.setName(
                emp.getFirstName() + " " + emp.getLastName()
        );

        response.setEmail(
                emp.getEmail()
        );

        response.setExpiresIn(
                jwtUtil.getExpiration()
        );

        return response;
    }
}