package com.hrms.exception;

import com.hrms.dto.ApiResponse;

import jakarta.servlet.http.HttpServletRequest;

import lombok.extern.slf4j.Slf4j;

import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.AuthenticationServiceException;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.LockedException;
import org.springframework.security.core.AuthenticationException;
import org.springframework.validation.FieldError;
import org.springframework.web.HttpRequestMethodNotSupportedException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.MissingServletRequestParameterException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;
import org.springframework.web.multipart.MaxUploadSizeExceededException;

import java.util.LinkedHashMap;
import java.util.Map;
import java.util.NoSuchElementException;

@RestControllerAdvice
@Slf4j
public class GlobalExceptionHandler {

    // ============================================================
    // VALIDATION ERRORS
    // ============================================================

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ApiResponse<Map<String, String>>> handleValidation(
            MethodArgumentNotValidException ex) {

        Map<String, String> errors = new LinkedHashMap<>();

        for (FieldError fieldError :
                ex.getBindingResult().getFieldErrors()) {

            errors.put(
                    fieldError.getField(),
                    fieldError.getDefaultMessage() != null
                            ? fieldError.getDefaultMessage()
                            : "Invalid value"
            );
        }

        return ResponseEntity
                .status(HttpStatus.BAD_REQUEST)
                .body(
                        ApiResponse.success(
                                "Validation failed",
                                errors
                        )
                );
    }

    // ============================================================
    // MALFORMED JSON / INVALID REQUEST BODY
    // ============================================================

    @ExceptionHandler(HttpMessageNotReadableException.class)
    public ResponseEntity<ApiResponse<Void>> handleInvalidRequestBody(
            HttpMessageNotReadableException ex) {

        log.warn(
                "Invalid request body received: {}",
                ex.getMostSpecificCause() != null
                        ? ex.getMostSpecificCause().getMessage()
                        : "Unknown parsing error"
        );

        return ResponseEntity
                .status(HttpStatus.BAD_REQUEST)
                .body(
                        ApiResponse.error(
                                "Invalid request data"
                        )
                );
    }

    // ============================================================
    // MISSING REQUEST PARAMETER
    // ============================================================

    @ExceptionHandler(MissingServletRequestParameterException.class)
    public ResponseEntity<ApiResponse<Void>> handleMissingParameter(
            MissingServletRequestParameterException ex) {

        return ResponseEntity
                .status(HttpStatus.BAD_REQUEST)
                .body(
                        ApiResponse.error(
                                "Required parameter is missing: "
                                        + ex.getParameterName()
                        )
                );
    }

    // ============================================================
    // INVALID PARAMETER TYPE
    // ============================================================

    @ExceptionHandler(MethodArgumentTypeMismatchException.class)
    public ResponseEntity<ApiResponse<Void>> handleTypeMismatch(
            MethodArgumentTypeMismatchException ex) {

        return ResponseEntity
                .status(HttpStatus.BAD_REQUEST)
                .body(
                        ApiResponse.error(
                                "Invalid value for parameter: "
                                        + ex.getName()
                        )
                );
    }

    // ============================================================
    // ACCOUNT LOCKED
    // ============================================================

    @ExceptionHandler(LockedException.class)
    public ResponseEntity<ApiResponse<Void>> handleAccountLocked(
            LockedException ex) {

        /*
         * HTTP 423 = Locked
         *
         * Used when Spring Security reports a locked account.
         */

        return ResponseEntity
                .status(HttpStatus.LOCKED)
                .body(
                        ApiResponse.error(
                                "Your account is temporarily locked. "
                                        + "Please try again later."
                        )
                );
    }

    // ============================================================
    // OTP LOGIN REQUIRED
    // ============================================================

    @ExceptionHandler(OtpLoginRequiredException.class)
    public ResponseEntity<ApiResponse<Map<String, Object>>>
    handleOtpLoginRequired(
            OtpLoginRequiredException ex) {

        Map<String, Object> data =
                new LinkedHashMap<>();

        data.put("otpRequired", true);

        return ResponseEntity
                .status(HttpStatus.PRECONDITION_REQUIRED)
                .body(
                        ApiResponse.success(
                                "OTP verification is required.",
                                data
                        )
                );
    }

    // ============================================================
    // RESOURCE NOT FOUND
    // ============================================================

    @ExceptionHandler(ResourceNotFoundException.class)
    public ResponseEntity<ApiResponse<Void>> handleResourceNotFound(
            ResourceNotFoundException ex) {

        return ResponseEntity
                .status(HttpStatus.NOT_FOUND)
                .body(
                        ApiResponse.error(
                                safeMessage(
                                        ex.getMessage(),
                                        "Requested resource was not found"
                                )
                        )
                );
    }

    // ============================================================
    // EMPLOYEE ALREADY EXISTS
    // ============================================================

    @ExceptionHandler(EmployeeAlreadyExists.class)
    public ResponseEntity<ApiResponse<Void>> handleEmployeeAlreadyExists(
            EmployeeAlreadyExists ex) {

        return ResponseEntity
                .status(HttpStatus.CONFLICT)
                .body(
                        ApiResponse.error(
                                safeMessage(
                                        ex.getMessage(),
                                        "Employee already exists"
                                )
                        )
                );
    }

    // ============================================================
    // ATTENDANCE RECORD NOT FOUND
    // ============================================================

    @ExceptionHandler(AttendanceRecordNotFound.class)
    public ResponseEntity<ApiResponse<Void>> handleAttendanceNotFound(
            AttendanceRecordNotFound ex) {

        return ResponseEntity
                .status(HttpStatus.NOT_FOUND)
                .body(
                        ApiResponse.error(
                                safeMessage(
                                        ex.getMessage(),
                                        "Attendance record was not found"
                                )
                        )
                );
    }

    // ============================================================
    // NO RECORDS FOUND
    // ============================================================

    @ExceptionHandler(NoRecordsFoundException.class)
    public ResponseEntity<ApiResponse<Void>> handleNoRecordsFound(
            NoRecordsFoundException ex) {

        return ResponseEntity
                .status(HttpStatus.NOT_FOUND)
                .body(
                        ApiResponse.error(
                                safeMessage(
                                        ex.getMessage(),
                                        "No records found"
                                )
                        )
                );
    }

    // ============================================================
    // NO SUCH ELEMENT
    // ============================================================

    @ExceptionHandler(NoSuchElementException.class)
    public ResponseEntity<ApiResponse<Void>> handleNoSuchElement(
            NoSuchElementException ex) {

        return ResponseEntity
                .status(HttpStatus.NOT_FOUND)
                .body(
                        ApiResponse.error(
                                "Requested resource was not found"
                        )
                );
    }

    // ============================================================
    // ILLEGAL ARGUMENT
    // ============================================================

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<ApiResponse<Void>> handleIllegalArgument(
            IllegalArgumentException ex) {

        return ResponseEntity
                .status(HttpStatus.BAD_REQUEST)
                .body(
                        ApiResponse.error(
                                safeMessage(
                                        ex.getMessage(),
                                        "Invalid request"
                                )
                        )
                );
    }

    // ============================================================
    // ILLEGAL STATE
    // ============================================================

    @ExceptionHandler(IllegalStateException.class)
    public ResponseEntity<ApiResponse<Void>> handleIllegalState(
            IllegalStateException ex) {

        return ResponseEntity
                .status(HttpStatus.CONFLICT)
                .body(
                        ApiResponse.error(
                                safeMessage(
                                        ex.getMessage(),
                                        "The requested operation cannot be completed"
                                )
                        )
                );
    }

    // ============================================================
    // DATABASE CONSTRAINT VIOLATION
    // ============================================================

    @ExceptionHandler(DataIntegrityViolationException.class)
    public ResponseEntity<ApiResponse<Void>> handleDatabaseConstraint(
            DataIntegrityViolationException ex) {

        /*
         * Always log the complete database exception internally.
         * Never send the database message to the frontend.
         */

        log.error(
                "Database constraint violation",
                ex
        );

        String message =
                "The requested record conflicts with existing data.";

        String exceptionMessage =
                ex.getMostSpecificCause() != null
                        ? ex.getMostSpecificCause()
                        .getMessage()
                        : null;

        if (exceptionMessage != null) {

            String lowerCaseMessage =
                    exceptionMessage.toLowerCase();

            if (lowerCaseMessage.contains("email")) {

                message =
                        "An employee with this email already exists.";

            } else if (lowerCaseMessage.contains("employeeid")
                    || lowerCaseMessage.contains("employee_id")) {

                message =
                        "An employee with this employee ID already exists.";
            }
        }

        return ResponseEntity
                .status(HttpStatus.CONFLICT)
                .body(
                        ApiResponse.error(
                                message
                        )
                );
    }

    // ============================================================
    // FILE TOO LARGE
    // ============================================================

    @ExceptionHandler(MaxUploadSizeExceededException.class)
    public ResponseEntity<ApiResponse<Void>> handleFileTooLarge(
            MaxUploadSizeExceededException ex) {

        log.warn(
                "File upload exceeded configured maximum size"
        );

        return ResponseEntity
                .status(HttpStatus.PAYLOAD_TOO_LARGE)
                .body(
                        ApiResponse.error(
                                "File too large. "
                                        + "Maximum allowed size is 10MB."
                        )
                );
    }

    // ============================================================
    // BAD CREDENTIALS
    // ============================================================

    @ExceptionHandler(BadCredentialsException.class)
    public ResponseEntity<ApiResponse<Void>> handleBadCredentials(
            BadCredentialsException ex) {

        return ResponseEntity
                .status(HttpStatus.UNAUTHORIZED)
                .body(
                        ApiResponse.error(
                                "Invalid email or password"
                        )
                );
    }

    // ============================================================
    // GENERAL AUTHENTICATION FAILURE
    // ============================================================

    @ExceptionHandler(AuthenticationServiceException.class)
    public ResponseEntity<ApiResponse<Void>> handleAuthenticationService(
            AuthenticationServiceException ex) {

        log.error(
                "Authentication service error",
                ex
        );

        return ResponseEntity
                .status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(
                        ApiResponse.error(
                                "Authentication service is temporarily unavailable."
                        )
                );
    }

    // ============================================================
    // OTHER SPRING SECURITY AUTHENTICATION ERRORS
    // ============================================================

    @ExceptionHandler(AuthenticationException.class)
    public ResponseEntity<ApiResponse<Void>> handleAuthentication(
            AuthenticationException ex) {

        log.warn(
                "Authentication failed: {}",
                ex.getClass().getSimpleName()
        );

        return ResponseEntity
                .status(HttpStatus.UNAUTHORIZED)
                .body(
                        ApiResponse.error(
                                "Authentication failed."
                        )
                );
    }

    // ============================================================
    // ACCESS DENIED
    // ============================================================

    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<ApiResponse<Void>> handleAccessDenied(
            AccessDeniedException ex) {

        log.warn(
                "Access denied for authenticated user"
        );

        return ResponseEntity
                .status(HttpStatus.FORBIDDEN)
                .body(
                        ApiResponse.error(
                                "Access denied. You do not have permission for this action."
                        )
                );
    }

    // ============================================================
    // HTTP METHOD NOT SUPPORTED
    // ============================================================

    @ExceptionHandler(HttpRequestMethodNotSupportedException.class)
    public ResponseEntity<ApiResponse<Void>> handleMethodNotSupported(
            HttpRequestMethodNotSupportedException ex) {

        return ResponseEntity
                .status(HttpStatus.METHOD_NOT_ALLOWED)
                .body(
                        ApiResponse.error(
                                "HTTP method is not supported for this endpoint."
                        )
                );
    }

    // ============================================================
    // GENERIC / UNEXPECTED ERROR
    // ============================================================

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiResponse<Void>> handleGeneric(
            Exception ex,
            HttpServletRequest request) {

        /*
         * Complete stack trace stays in server logs.
         *
         * Never expose:
         * - SQL errors
         * - stack traces
         * - file paths
         * - SMTP configuration
         * - JWT details
         * - database details
         * - internal class names
         */

        log.error(
                "Unhandled exception for {} {}",
                request.getMethod(),
                request.getRequestURI(),
                ex
        );

        return ResponseEntity
                .status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(
                        ApiResponse.error(
                                "An unexpected internal error occurred. "
                                        + "Please try again later."
                        )
                );
    }

    // ============================================================
    // SAFE MESSAGE HELPER
    // ============================================================

    private String safeMessage(
            String message,
            String defaultMessage) {

        if (message == null
                || message.isBlank()) {

            return defaultMessage;
        }

        /*
         * Custom application exceptions are allowed to provide
         * controlled messages.
         *
         * Do not use this helper for arbitrary infrastructure
         * exceptions such as SQL, Hibernate, SMTP, etc.
         */

        return message;
    }
}