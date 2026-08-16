package com.hrms.controller;

import com.hrms.dto.ApiResponse;
import com.hrms.dto.AuthDTOs;
import com.hrms.dto.ForgotPasswordRequest;
import com.hrms.dto.ResetPasswordRequest;
import com.hrms.entity.Employee;
import com.hrms.repository.EmployeeRepository;
import com.hrms.security.JwtUtil;
import com.hrms.service.AuthService;
import com.hrms.service.EmailService;
import com.hrms.service.OtpService;
import com.hrms.util.PasswordValidator;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;
import com.hrms.dto.UpdatePasswordRequest;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
@Tag(name = "Authentication", description = "Login & token management")
public class AuthController {

    private final AuthService authService;
    private final EmailService emailService;
    private final OtpService otpService;
    private final EmployeeRepository employeeRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;

    @PostMapping("/login")
    @Operation(summary = "Login (Employee or Admin/HR)",
            description = "Pass loginType as EMPLOYEE or ADMIN")
    public ResponseEntity<ApiResponse<AuthDTOs.AuthResponse>> login(
            @Valid @RequestBody AuthDTOs.LoginRequest request) {
        return ResponseEntity.ok(
                ApiResponse.success("Login successful",
                        authService.login(request)));
    }

    @PostMapping("/refresh")
    @Operation(summary = "Refresh access token")
    public ResponseEntity<ApiResponse<AuthDTOs.AuthResponse>> refresh(
            @Valid @RequestBody AuthDTOs.RefreshTokenRequest request) {
        return ResponseEntity.ok(
                ApiResponse.success("Token refreshed",
                        authService.refresh(request)));
    }

    @PostMapping("/forgot-password")
    @Operation(summary = "Send OTP to email for password reset")
    public ResponseEntity<?> forgotPassword(
            @RequestBody ForgotPasswordRequest request) {
        try {
            Employee employee = employeeRepository
                    .findByEmail(request.getEmail())
                    .orElseThrow(() -> new RuntimeException(
                            "No account found with email: " + request.getEmail()));

            String otp = otpService.generateAndSaveOtp(request.getEmail());

            emailService.sendOtpEmail(
                    request.getEmail(),
                    otp,
                    employee.getFirstName() + " " + employee.getLastName()
            );

            return ResponseEntity.ok(
                    ApiResponse.success(
                            "OTP sent to " + request.getEmail(), null));

        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error(e.getMessage()));
        }
    }

    @PostMapping("/reset-password")
    @Operation(summary = "Reset password using OTP (with password validation)")
    public ResponseEntity<?> resetPassword(
            @Valid @RequestBody ResetPasswordRequest request) {
        try {
            // Validate password format first
            if (!PasswordValidator.isValidPassword(request.getNewPassword())) {
                return ResponseEntity.badRequest()
                        .body(ApiResponse.error(PasswordValidator.getPasswordRequirements()));
            }

            // Validate OTP only if provided (not empty/null)
            if (request.getOtp() != null && !request.getOtp().isEmpty()) {
                boolean valid = otpService.validateOtp(
                        request.getEmail(), request.getOtp());

                if (!valid) {
                    return ResponseEntity.badRequest()
                            .body(ApiResponse.error("Invalid or expired OTP"));
                }
            }

            Employee employee = employeeRepository
                    .findByEmail(request.getEmail())
                    .orElseThrow(() -> new RuntimeException(
                            "Employee not found"));

            employee.setPassword(
                    passwordEncoder.encode(request.getNewPassword()));
            employeeRepository.save(employee);

            return ResponseEntity.ok(
                    ApiResponse.success(
                            "Password changed successfully!", null));

        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error(e.getMessage()));
        }
    }
    @PostMapping("/update-password")
@Operation(summary = "Update password for logged-in employee")
public ResponseEntity<?> updatePassword(
        @Valid @RequestBody UpdatePasswordRequest request) {

    try {
        Employee employee = employeeRepository
                .findByEmail(request.getEmail())
                .orElseThrow(() ->
                        new RuntimeException("Employee not found"));

        // Verify current password
        if (!passwordEncoder.matches(
                request.getCurrentPassword(),
                employee.getPassword())) {

            return ResponseEntity.badRequest()
                    .body(ApiResponse.error(
                            "Current password is incorrect"));
        }

        // Prevent using the same password
        if (request.getCurrentPassword()
                .equals(request.getNewPassword())) {

            return ResponseEntity.badRequest()
                    .body(ApiResponse.error(
                            "New password cannot be same as current password"));
        }

        // Encode and save new password
        employee.setPassword(
                passwordEncoder.encode(request.getNewPassword()));

        employeeRepository.save(employee);

        return ResponseEntity.ok(
                ApiResponse.success(
                        "Password changed successfully!", null));

    } catch (Exception e) {
        return ResponseEntity.badRequest()
                .body(ApiResponse.error(e.getMessage()));
    }
}

}