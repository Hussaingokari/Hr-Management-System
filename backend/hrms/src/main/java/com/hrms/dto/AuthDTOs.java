package com.hrms.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

public class AuthDTOs {

    // ============================================================
    // NORMAL LOGIN
    // ============================================================

    @Data
    public static class LoginRequest {

        @NotBlank(message = "Email is required")
        @Email(message = "Please enter a valid email")
        private String email;

        @NotBlank(message = "Password is required")
        @Size(min = 6, message = "Password must be at least 6 characters")
        private String password;

        /**
         * EMPLOYEE or ADMIN
         */
        private String loginType;
    }

    // ============================================================
    // AUTH RESPONSE
    // ============================================================

    @Data
    public static class AuthResponse {

        private String accessToken;

        private String refreshToken;

        private String tokenType = "Bearer";

        private String role;

        private Long employeeId;

        private String employeeCode;

        private String name;

        private String email;

        private Long expiresIn;

        /**
         * True when frontend needs OTP verification.
         */
        private boolean requiresOtp;
    }

    // ============================================================
    // REFRESH TOKEN
    // ============================================================

    @Data
    public static class RefreshTokenRequest {

        @NotBlank(message = "Refresh token is required")
        private String refreshToken;
    }

    // ============================================================
    // LOGIN OTP - SEND
    // ============================================================

    @Data
    public static class LoginOtpRequest {

        @NotBlank(message = "Email is required")
        @Email(message = "Please enter a valid email")
        private String email;
    }

    // ============================================================
    // LOGIN OTP - VERIFY
    // ============================================================

    @Data
    public static class LoginOtpVerifyRequest {

        @NotBlank(message = "Email is required")
        @Email(message = "Please enter a valid email")
        private String email;

        @NotBlank(message = "OTP is required")
        @Size(min = 6, max = 6, message = "OTP must be exactly 6 digits")
        private String otp;

        /**
         * EMPLOYEE or ADMIN
         */
        private String loginType;
    }
}