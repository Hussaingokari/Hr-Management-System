package com.hrms.controller;

import com.hrms.dto.ApiResponse;
import com.hrms.dto.AuthDTOs;
import com.hrms.dto.ForgotPasswordRequest;
import com.hrms.dto.ResetPasswordRequest;
import com.hrms.dto.UpdatePasswordRequest;
import com.hrms.entity.Employee;
import com.hrms.repository.EmployeeRepository;
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

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
@Tag(
        name = "Authentication",
        description = "Login & token management"
)
public class AuthController {

    private final AuthService authService;
    private final EmailService emailService;
    private final OtpService otpService;
    private final EmployeeRepository employeeRepository;
    private final PasswordEncoder passwordEncoder;


    // ============================================================
    // LOGIN
    // ============================================================

    @PostMapping("/login")
    @Operation(
            summary = "Login (Employee or Admin/HR)",
            description = "Pass loginType as EMPLOYEE or ADMIN"
    )
    public ResponseEntity<ApiResponse<AuthDTOs.AuthResponse>> login(
            @Valid @RequestBody AuthDTOs.LoginRequest request) {

        return ResponseEntity.ok(
                ApiResponse.success(
                        "Login successful",
                        authService.login(request)
                )
        );
    }


    // ============================================================
    // REFRESH TOKEN
    // ============================================================

    @PostMapping("/refresh")
    @Operation(summary = "Refresh access token")
    public ResponseEntity<ApiResponse<AuthDTOs.AuthResponse>> refresh(
            @Valid @RequestBody AuthDTOs.RefreshTokenRequest request) {

        return ResponseEntity.ok(
                ApiResponse.success(
                        "Token refreshed",
                        authService.refresh(request)
                )
        );
    }


    // ============================================================
    // FORGOT PASSWORD - SEND OTP
    // ============================================================

    @PostMapping("/forgot-password")
    @Operation(
            summary = "Send OTP to email for password reset"
    )
    public ResponseEntity<?> forgotPassword(
            @RequestBody ForgotPasswordRequest request) {

        try {

            Employee employee = employeeRepository
                    .findByEmail(request.getEmail())
                    .orElseThrow(() ->
                            new RuntimeException(
                                    "No account found with email: "
                                            + request.getEmail()
                            )
                    );


            // Generate and save OTP
            String otp = otpService.generateAndSaveOtp(
                    request.getEmail()
            );


            // Send OTP to employee email
            emailService.sendOtpEmail(
                    request.getEmail(),
                    otp,
                    employee.getFirstName()
                            + " "
                            + employee.getLastName()
            );


            return ResponseEntity.ok(
                    ApiResponse.success(
                            "OTP sent successfully to "
                                    + request.getEmail(),
                            null
                    )
            );

        } catch (Exception e) {

            return ResponseEntity.badRequest()
                    .body(
                            ApiResponse.error(
                                    e.getMessage()
                            )
                    );
        }
    }


    // ============================================================
    // FORGOT PASSWORD - RESET PASSWORD USING OTP
    // ============================================================

    @PostMapping("/reset-password")
    @Operation(
            summary = "Reset password using OTP",
            description =
                    "Forgot Password flow: Email + OTP + New Password"
    )
    public ResponseEntity<?> resetPassword(
            @Valid @RequestBody ResetPasswordRequest request) {

        try {

            // ----------------------------------------------------
            // 1. OTP IS REQUIRED
            // ----------------------------------------------------

            if (request.getOtp() == null
                    || request.getOtp().isBlank()) {

                return ResponseEntity.badRequest()
                        .body(
                                ApiResponse.error(
                                        "OTP is required"
                                )
                        );
            }


            // ----------------------------------------------------
            // 2. VALIDATE PASSWORD
            // ----------------------------------------------------

            if (!PasswordValidator.isValidPassword(
                    request.getNewPassword())) {

                return ResponseEntity.badRequest()
                        .body(
                                ApiResponse.error(
                                        PasswordValidator
                                                .getPasswordRequirements()
                                )
                        );
            }


            // ----------------------------------------------------
            // 3. VALIDATE OTP
            // ----------------------------------------------------

            boolean validOtp =
                    otpService.validateOtp(
                            request.getEmail(),
                            request.getOtp()
                    );

            if (!validOtp) {

                return ResponseEntity.badRequest()
                        .body(
                                ApiResponse.error(
                                        "Invalid or expired OTP"
                                )
                        );
            }


            // ----------------------------------------------------
            // 4. FIND EMPLOYEE
            // ----------------------------------------------------

            Employee employee = employeeRepository
                    .findByEmail(request.getEmail())
                    .orElseThrow(() ->
                            new RuntimeException(
                                    "Employee not found"
                            )
                    );


            // ----------------------------------------------------
            // 5. UPDATE PASSWORD
            // ----------------------------------------------------

            employee.setPassword(
                    passwordEncoder.encode(
                            request.getNewPassword()
                    )
            );

            employeeRepository.save(employee);


            // ----------------------------------------------------
            // 6. SUCCESS
            // ----------------------------------------------------

            return ResponseEntity.ok(
                    ApiResponse.success(
                            "Password reset successfully!",
                            null
                    )
            );

        } catch (Exception e) {

            return ResponseEntity.badRequest()
                    .body(
                            ApiResponse.error(
                                    e.getMessage()
                            )
                    );
        }
    }


    // ============================================================
    // CHANGE PASSWORD - LOGGED-IN USER
    // ============================================================

    @PostMapping("/update-password")
    @Operation(
            summary = "Update password for logged-in employee",
            description =
                    "Change Password flow: Current Password + New Password"
    )
    public ResponseEntity<?> updatePassword(
            @Valid @RequestBody UpdatePasswordRequest request) {

        try {

            // ----------------------------------------------------
            // 1. FIND EMPLOYEE
            // ----------------------------------------------------

            Employee employee = employeeRepository
                    .findByEmail(request.getEmail())
                    .orElseThrow(() ->
                            new RuntimeException(
                                    "Employee not found"
                            )
                    );


            // ----------------------------------------------------
            // 2. VERIFY CURRENT PASSWORD
            // ----------------------------------------------------

            if (!passwordEncoder.matches(
                    request.getCurrentPassword(),
                    employee.getPassword())) {

                return ResponseEntity.badRequest()
                        .body(
                                ApiResponse.error(
                                        "Current password is incorrect"
                                )
                        );
            }


            // ----------------------------------------------------
            // 3. PREVENT SAME PASSWORD
            // ----------------------------------------------------

            if (request.getCurrentPassword()
                    .equals(request.getNewPassword())) {

                return ResponseEntity.badRequest()
                        .body(
                                ApiResponse.error(
                                        "New password cannot be same as current password"
                                )
                        );
            }


            // ----------------------------------------------------
            // 4. SAVE NEW PASSWORD
            // ----------------------------------------------------

            employee.setPassword(
                    passwordEncoder.encode(
                            request.getNewPassword()
                    )
            );

            employeeRepository.save(employee);


            // ----------------------------------------------------
            // 5. SUCCESS
            // ----------------------------------------------------

            return ResponseEntity.ok(
                    ApiResponse.success(
                            "Password changed successfully!",
                            null
                    )
            );

        } catch (Exception e) {

            return ResponseEntity.badRequest()
                    .body(
                            ApiResponse.error(
                                    e.getMessage()
                            )
                    );
        }
    }
}