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
import lombok.extern.slf4j.Slf4j;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Authentication", description = "Login, OTP and token management")
public class AuthController {

        private final AuthService authService;
        private final EmailService emailService;
        private final OtpService otpService;
        private final EmployeeRepository employeeRepository;
        private final PasswordEncoder passwordEncoder;

        // ============================================================
        // NORMAL LOGIN
        // ============================================================

        @PostMapping("/login")
        @Operation(summary = "Login", description = "Employee or Admin/HR login")
        public ResponseEntity<ApiResponse<AuthDTOs.AuthResponse>> login(
                        @Valid @RequestBody AuthDTOs.LoginRequest request) {

                AuthDTOs.AuthResponse response = authService.login(request);

                return ResponseEntity.ok(
                                ApiResponse.success(
                                                "Login successful",
                                                response));
        }

        // ============================================================
        // REFRESH TOKEN
        // ============================================================

        @PostMapping("/refresh")
        @Operation(summary = "Refresh access token")
        public ResponseEntity<ApiResponse<AuthDTOs.AuthResponse>> refresh(
                        @Valid @RequestBody AuthDTOs.RefreshTokenRequest request) {

                AuthDTOs.AuthResponse response = authService.refresh(request);

                return ResponseEntity.ok(
                                ApiResponse.success(
                                                "Token refreshed",
                                                response));
        }

        // ============================================================
        // LOGIN OTP - SEND
        // ============================================================

        @PostMapping("/login/send-otp")
        @Operation(summary = "Send OTP for login", description = "Sends login OTP when OTP verification is required")
        public ResponseEntity<?> sendLoginOtp(
                        @Valid @RequestBody AuthDTOs.LoginOtpRequest request) {

                String email = normalizeEmail(request.getEmail());

                try {

                        // --------------------------------------------------------
                        // FIND EMPLOYEE
                        // --------------------------------------------------------

                        Employee employee = employeeRepository.findByEmail(email)
                                        .orElse(null);

                        if (employee == null) {

                                return ResponseEntity
                                                .status(HttpStatus.UNAUTHORIZED)
                                                .body(
                                                                ApiResponse.error(
                                                                                "Invalid email or password"));
                        }

                        // --------------------------------------------------------
                        // ACTIVE CHECK
                        // --------------------------------------------------------

                        if (!employee.isActive()) {

                                return ResponseEntity
                                                .status(HttpStatus.FORBIDDEN)
                                                .body(
                                                                ApiResponse.error(
                                                                                "Your account is inactive. Please contact HR/Admin."));
                        }

                        // --------------------------------------------------------
                        // OTP REQUIRED CHECK
                        // --------------------------------------------------------

                        if (!employee.isOtpLoginRequired()) {

                                return ResponseEntity
                                                .badRequest()
                                                .body(
                                                                ApiResponse.error(
                                                                                "OTP login is not required for this account."));
                        }

                        // --------------------------------------------------------
                        // GENERATE OTP
                        // --------------------------------------------------------

                        String otp = otpService.generateLoginOtp(email);

                        // --------------------------------------------------------
                        // SEND OTP
                        // --------------------------------------------------------

                        String employeeName = buildEmployeeName(employee);

                        emailService.sendLoginOtpEmail(
                                        email,
                                        otp,
                                        employeeName);

                        log.info(
                                        "Login OTP sent successfully");

                        return ResponseEntity.ok(
                                        ApiResponse.success(
                                                        "Login OTP sent successfully to your registered email.",
                                                        null));

                } catch (Exception e) {

                        log.error(
                                        "Failed to send login OTP",
                                        e);

                        return ResponseEntity
                                        .status(HttpStatus.INTERNAL_SERVER_ERROR)
                                        .body(
                                                        ApiResponse.error(
                                                                        "Unable to send login OTP email. Please try again later."));
                }
        }

        // ============================================================
        // LOGIN OTP - VERIFY
        // ============================================================

        @PostMapping("/login/verify-otp")
        @Operation(summary = "Login using OTP", description = "Authenticates an employee using login OTP")
        public ResponseEntity<?> verifyLoginOtp(
                        @Valid @RequestBody AuthDTOs.LoginOtpVerifyRequest request) {

                String email = normalizeEmail(request.getEmail());

                try {

                        // --------------------------------------------------------
                        // FIND EMPLOYEE
                        // --------------------------------------------------------

                        Employee employee = employeeRepository.findByEmail(email)
                                        .orElse(null);

                        if (employee == null) {

                                return ResponseEntity
                                                .status(HttpStatus.UNAUTHORIZED)
                                                .body(
                                                                ApiResponse.error(
                                                                                "Invalid email or OTP"));
                        }

                        // --------------------------------------------------------
                        // ACTIVE CHECK
                        // --------------------------------------------------------

                        if (!employee.isActive()) {

                                return ResponseEntity
                                                .status(HttpStatus.FORBIDDEN)
                                                .body(
                                                                ApiResponse.error(
                                                                                "Your account is inactive. Please contact HR/Admin."));
                        }

                        // --------------------------------------------------------
                        // OTP REQUIRED CHECK
                        // --------------------------------------------------------

                        if (!employee.isOtpLoginRequired()) {

                                return ResponseEntity
                                                .badRequest()
                                                .body(
                                                                ApiResponse.error(
                                                                                "OTP login is not required for this account."));
                        }

                        // --------------------------------------------------------
                        // LOGIN TYPE VALIDATION
                        // --------------------------------------------------------

                        if (!isValidLoginType(
                                        request.getLoginType(),
                                        employee)) {

                                return ResponseEntity
                                                .status(HttpStatus.FORBIDDEN)
                                                .body(
                                                                ApiResponse.error(
                                                                                "Invalid login type for this account."));
                        }

                        // --------------------------------------------------------
                        // VALIDATE OTP
                        // --------------------------------------------------------

                        boolean validOtp = otpService.validateLoginOtp(
                                        email,
                                        request.getOtp().trim());

                        if (!validOtp) {

                                return ResponseEntity
                                                .badRequest()
                                                .body(
                                                                ApiResponse.error(
                                                                                "Invalid or expired login OTP"));
                        }

                        // --------------------------------------------------------
                        // SUCCESSFUL OTP LOGIN
                        // --------------------------------------------------------

                        AuthDTOs.AuthResponse authResponse = authService.loginWithOtp(employee);

                        log.info(
                                        "OTP login successful");

                        return ResponseEntity.ok(
                                        ApiResponse.success(
                                                        "OTP login successful",
                                                        authResponse));

                } catch (Exception e) {

                        log.error(
                                        "Login OTP verification failed",
                                        e);

                        return ResponseEntity
                                        .status(HttpStatus.INTERNAL_SERVER_ERROR)
                                        .body(
                                                        ApiResponse.error(
                                                                        "Unable to verify login OTP. Please try again."));
                }
        }

        // ============================================================
        // FORGOT PASSWORD - SEND OTP
        // ============================================================

        @PostMapping("/forgot-password")
        @Operation(summary = "Send OTP to email for password reset")
        public ResponseEntity<?> forgotPassword(
                        @Valid @RequestBody ForgotPasswordRequest request) {

                String email = normalizeEmail(request.getEmail());

                try {

                        // --------------------------------------------------------
                        // FIND EMPLOYEE
                        // --------------------------------------------------------

                        Employee employee = employeeRepository.findByEmail(email)
                                        .orElse(null);

                        /*
                         * For production, do not reveal whether an email
                         * exists in the HRMS database.
                         */
                        if (employee == null) {

                                return ResponseEntity.ok(
                                                ApiResponse.success(
                                                                "If an account exists for this email, "
                                                                                + "a password reset OTP has been sent.",
                                                                null));
                        }

                        // --------------------------------------------------------
                        // ACTIVE CHECK
                        // --------------------------------------------------------

                        if (!employee.isActive()) {

                                /*
                                 * Do not reveal account state.
                                 */
                                return ResponseEntity.ok(
                                                ApiResponse.success(
                                                                "If an account exists for this email, "
                                                                                + "a password reset OTP has been sent.",
                                                                null));
                        }

                        // --------------------------------------------------------
                        // GENERATE PASSWORD RESET OTP
                        // --------------------------------------------------------

                        String otp = otpService.generatePasswordResetOtp(email);

                        // --------------------------------------------------------
                        // SEND PASSWORD RESET OTP
                        // --------------------------------------------------------

                        emailService.sendPasswordResetOtpEmail(
                                        email,
                                        otp,
                                        buildEmployeeName(employee));

                        log.info(
                                        "Password reset OTP requested");

                        return ResponseEntity.ok(
                                        ApiResponse.success(
                                                        "If an account exists for this email, "
                                                                        + "a password reset OTP has been sent.",
                                                        null));

                } catch (Exception e) {

                        /*
                         * Do not expose SMTP/database details to the client.
                         */
                        log.error(
                                        "Password reset OTP processing failed",
                                        e);

                        return ResponseEntity.ok(
                                        ApiResponse.success(
                                                        "If an account exists for this email, "
                                                                        + "a password reset OTP has been sent.",
                                                        null));
                }
        }

        // ============================================================
        // RESET PASSWORD
        // ============================================================

        @PostMapping("/reset-password")
        @Operation(summary = "Reset password using OTP", description = "Email + OTP + New Password")
        public ResponseEntity<?> resetPassword(
                        @Valid @RequestBody ResetPasswordRequest request) {

                try {

                        // --------------------------------------------------------
                        // NORMALIZE EMAIL
                        // --------------------------------------------------------

                        String email = normalizeEmail(request.getEmail());

                        // --------------------------------------------------------
                        // OTP CHECK
                        // --------------------------------------------------------

                        if (request.getOtp() == null
                                        || request.getOtp().isBlank()) {

                                return ResponseEntity
                                                .badRequest()
                                                .body(
                                                                ApiResponse.error(
                                                                                "OTP is required"));
                        }

                        // --------------------------------------------------------
                        // PASSWORD CHECK
                        // --------------------------------------------------------

                        String newPassword = request.getNewPassword();

                        if (!PasswordValidator.isValidPassword(
                                        newPassword)) {

                                return ResponseEntity
                                                .badRequest()
                                                .body(
                                                                ApiResponse.error(
                                                                                PasswordValidator
                                                                                                .getPasswordRequirements()));
                        }

                        // --------------------------------------------------------
                        // FIND EMPLOYEE BEFORE CHANGING PASSWORD
                        // --------------------------------------------------------

                        Employee employee = employeeRepository.findByEmail(email)
                                        .orElse(null);

                        /*
                         * Do not reveal whether the email exists.
                         */
                        if (employee == null || !employee.isActive()) {

                                return ResponseEntity
                                                .badRequest()
                                                .body(
                                                                ApiResponse.error(
                                                                                "Invalid or expired password reset OTP"));
                        }

                        // --------------------------------------------------------
                        // VALIDATE PASSWORD RESET OTP
                        // --------------------------------------------------------

                        boolean validOtp = otpService.validatePasswordResetOtp(
                                        email,
                                        request.getOtp().trim());

                        if (!validOtp) {

                                return ResponseEntity
                                                .badRequest()
                                                .body(
                                                                ApiResponse.error(
                                                                                "Invalid or expired password reset OTP"));
                        }

                        // --------------------------------------------------------
                        // UPDATE PASSWORD
                        // --------------------------------------------------------

                        employee.setPassword(
                                        passwordEncoder.encode(
                                                        newPassword));

                        // --------------------------------------------------------
                        // CLEAR LOGIN SECURITY STATE
                        // --------------------------------------------------------

                        employee.setFailedAttempts(0);
                        employee.setLockTime(null);
                        employee.setOtpLoginRequired(false);
                        employee.setLockoutCount(0);

                        employeeRepository.saveAndFlush(employee);

                        log.info(
                                        "Password reset completed successfully");

                        return ResponseEntity.ok(
                                        ApiResponse.success(
                                                        "Password reset successfully!",
                                                        null));

                } catch (Exception e) {

                        log.error(
                                        "Password reset failed",
                                        e);

                        return ResponseEntity
                                        .status(HttpStatus.INTERNAL_SERVER_ERROR)
                                        .body(
                                                        ApiResponse.error(
                                                                        "Unable to reset password. Please try again later."));
                }
        }

        // ============================================================
        // CHANGE PASSWORD
        // ============================================================

        @PostMapping("/update-password")
        @Operation(summary = "Update password for logged-in employee")
        public ResponseEntity<?> updatePassword(
                        @Valid @RequestBody UpdatePasswordRequest request) {

                try {

                        // --------------------------------------------------------
                        // GET AUTHENTICATED USER FROM JWT
                        // --------------------------------------------------------

                        Authentication authentication = SecurityContextHolder
                                        .getContext()
                                        .getAuthentication();

                        if (authentication == null
                                        || !authentication.isAuthenticated()
                                        || authentication.getName() == null) {

                                return ResponseEntity
                                                .status(HttpStatus.UNAUTHORIZED)
                                                .body(
                                                                ApiResponse.error(
                                                                                "Authentication is required"));
                        }

                        String authenticatedEmail = normalizeEmail(
                                        authentication.getName());

                        String requestedEmail = normalizeEmail(
                                        request.getEmail());

                        // --------------------------------------------------------
                        // PREVENT CHANGING ANOTHER USER'S PASSWORD
                        // --------------------------------------------------------

                        if (!authenticatedEmail.equals(requestedEmail)) {

                                log.warn(
                                                "Unauthorized password change attempt");

                                return ResponseEntity
                                                .status(HttpStatus.FORBIDDEN)
                                                .body(
                                                                ApiResponse.error(
                                                                                "You can only change your own password."));
                        }

                        // --------------------------------------------------------
                        // FIND EMPLOYEE
                        // --------------------------------------------------------

                        Employee employee = employeeRepository.findByEmail(
                                        authenticatedEmail).orElse(null);

                        if (employee == null) {

                                return ResponseEntity
                                                .status(HttpStatus.UNAUTHORIZED)
                                                .body(
                                                                ApiResponse.error(
                                                                                "Authenticated employee not found"));
                        }

                        // --------------------------------------------------------
                        // ACTIVE CHECK
                        // --------------------------------------------------------

                        if (!employee.isActive()) {

                                return ResponseEntity
                                                .status(HttpStatus.FORBIDDEN)
                                                .body(
                                                                ApiResponse.error(
                                                                                "Your account is inactive. Please contact HR/Admin."));
                        }

                        // --------------------------------------------------------
                        // VERIFY CURRENT PASSWORD
                        // --------------------------------------------------------

                        if (!passwordEncoder.matches(
                                        request.getCurrentPassword(),
                                        employee.getPassword())) {

                                return ResponseEntity
                                                .badRequest()
                                                .body(
                                                                ApiResponse.error(
                                                                                "Current password is incorrect"));
                        }

                        // --------------------------------------------------------
                        // PREVENT SAME PASSWORD
                        // --------------------------------------------------------

                        if (passwordEncoder.matches(
                                        request.getNewPassword(),
                                        employee.getPassword())) {

                                return ResponseEntity
                                                .badRequest()
                                                .body(
                                                                ApiResponse.error(
                                                                                "New password cannot be same as current password"));
                        }

                        // --------------------------------------------------------
                        // PASSWORD POLICY VALIDATION
                        // --------------------------------------------------------

                        if (!PasswordValidator.isValidPassword(
                                        request.getNewPassword())) {

                                return ResponseEntity
                                                .badRequest()
                                                .body(
                                                                ApiResponse.error(
                                                                                PasswordValidator
                                                                                                .getPasswordRequirements()));
                        }

                        // --------------------------------------------------------
                        // SAVE NEW PASSWORD
                        // --------------------------------------------------------

                        employee.setPassword(
                                        passwordEncoder.encode(
                                                        request.getNewPassword()));

                        employeeRepository.saveAndFlush(employee);

                        log.info(
                                        "Password changed successfully");

                        return ResponseEntity.ok(
                                        ApiResponse.success(
                                                        "Password changed successfully!",
                                                        null));

                } catch (Exception e) {

                        log.error(
                                        "Unable to change password",
                                        e);

                        return ResponseEntity
                                        .status(HttpStatus.INTERNAL_SERVER_ERROR)
                                        .body(
                                                        ApiResponse.error(
                                                                        "Unable to change password. Please try again later."));
                }
        }

        // ============================================================
        // HELPER METHODS
        // ============================================================

        private String normalizeEmail(String email) {

                if (email == null) {
                        return "";
                }

                return email.trim().toLowerCase();
        }

        private String buildEmployeeName(Employee employee) {

                String firstName = employee.getFirstName() == null
                                ? ""
                                : employee.getFirstName().trim();

                String lastName = employee.getLastName() == null
                                ? ""
                                : employee.getLastName().trim();

                String fullName = (firstName + " " + lastName).trim();

                return fullName.isBlank()
                                ? "Employee"
                                : fullName;
        }

        private boolean isValidLoginType(
                        String loginType,
                        Employee employee) {

                /*
                 * If frontend does not send loginType,
                 * allow the account's normal authentication flow.
                 */
                if (loginType == null
                                || loginType.isBlank()) {

                        return true;
                }

                String type = loginType.trim().toUpperCase();

                if ("EMPLOYEE".equals(type)) {

                        return employee.getRole() != null
                                        && "EMPLOYEE".equals(
                                                        employee.getRole().name());
                }

                if ("ADMIN".equals(type)) {

                        return employee.getRole() != null
                                        && ("ADMIN".equals(
                                                        employee.getRole().name())
                                                        || "HR".equals(
                                                                        employee.getRole().name()));
                }

                return false;
        }
}