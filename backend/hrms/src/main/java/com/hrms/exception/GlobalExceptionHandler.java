package com.hrms.exception;

import com.hrms.dto.ApiResponse;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import org.springframework.dao.DataIntegrityViolationException;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.LockedException;

import org.springframework.validation.FieldError;

import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import org.springframework.web.multipart.MaxUploadSizeExceededException;

import java.util.HashMap;
import java.util.Map;
import java.util.NoSuchElementException;

@RestControllerAdvice
public class GlobalExceptionHandler {

        private static final Logger logger = LoggerFactory.getLogger(GlobalExceptionHandler.class);

        // ============================================================
        // VALIDATION ERRORS
        // ============================================================

        @ExceptionHandler(MethodArgumentNotValidException.class)
        public ResponseEntity<ApiResponse<Map<String, String>>> handleValidation(
                        MethodArgumentNotValidException ex) {

                Map<String, String> errors = new HashMap<>();

                ex.getBindingResult()
                                .getAllErrors()
                                .forEach(error -> {

                                        String field = ((FieldError) error).getField();

                                        errors.put(
                                                        field,
                                                        error.getDefaultMessage());
                                });

                return ResponseEntity
                                .badRequest()
                                .body(
                                                ApiResponse.error(
                                                                "Validation failed: " + errors));
        }

        // ============================================================
        // ACCOUNT LOCKED
        // ============================================================
        //
        // Too many failed login attempts.
        //
        // HTTP 423 LOCKED is intentionally returned because
        // the frontend uses this status to display the countdown.
        // ============================================================

        @ExceptionHandler(LockedException.class)
        public ResponseEntity<ApiResponse<Void>> handleAccountLocked(
                        LockedException ex) {

                return ResponseEntity
                                .status(HttpStatus.LOCKED)
                                .body(
                                                ApiResponse.error(
                                                                ex.getMessage()));
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
                                                                ex.getMessage()));
        }

        // ============================================================
        // EMPLOYEE ALREADY EXISTS
        // ============================================================

        @ExceptionHandler(EmployeeAlreadyExists.class)
        public ResponseEntity<ApiResponse<Void>> handleEmployeeAlreadyExist(
                        EmployeeAlreadyExists ex) {

                return ResponseEntity
                                .status(HttpStatus.CONFLICT)
                                .body(
                                                ApiResponse.error(
                                                                ex.getMessage()));
        }

        // ============================================================
        // ATTENDANCE RECORD NOT FOUND
        // ============================================================

        @ExceptionHandler(AttendanceRecordNotFound.class)
        public ResponseEntity<ApiResponse<Void>> handleNoFoundAttendanceRecord(
                        AttendanceRecordNotFound ex) {

                return ResponseEntity
                                .status(HttpStatus.NOT_FOUND)
                                .body(
                                                ApiResponse.error(
                                                                ex.getMessage()));
        }

        // ============================================================
        // NO RECORDS FOUND
        // ============================================================

        @ExceptionHandler(NoRecordsFoundException.class)
        public ResponseEntity<ApiResponse<Void>> handleOnBoardingNotFound(
                        NoRecordsFoundException ex) {

                return ResponseEntity
                                .status(HttpStatus.NOT_FOUND)
                                .body(
                                                ApiResponse.error(
                                                                ex.getMessage()));
        }

        // ============================================================
        // NO SUCH ELEMENT
        // ============================================================

        @ExceptionHandler(NoSuchElementException.class)
        public ResponseEntity<ApiResponse<Void>> handleNotFound(
                        NoSuchElementException ex) {

                return ResponseEntity
                                .status(HttpStatus.NOT_FOUND)
                                .body(
                                                ApiResponse.error(
                                                                ex.getMessage()));
        }

        // ============================================================
        // ILLEGAL ARGUMENT
        // ============================================================

        @ExceptionHandler(IllegalArgumentException.class)
        public ResponseEntity<ApiResponse<Void>> handleBadRequest(
                        IllegalArgumentException ex) {

                return ResponseEntity
                                .badRequest()
                                .body(
                                                ApiResponse.error(
                                                                ex.getMessage()));
        }

        // ============================================================
        // ILLEGAL STATE
        // ============================================================

        @ExceptionHandler(IllegalStateException.class)
        public ResponseEntity<ApiResponse<Void>> handleConflict(
                        IllegalStateException ex) {

                return ResponseEntity
                                .status(HttpStatus.CONFLICT)
                                .body(
                                                ApiResponse.error(
                                                                ex.getMessage()));
        }

        // ============================================================
        // DATABASE CONSTRAINT VIOLATION
        // ============================================================

        @ExceptionHandler(DataIntegrityViolationException.class)
        public ResponseEntity<ApiResponse<Void>> handleDbConstraint(
                        DataIntegrityViolationException ex) {

                String msg;

                if (ex.getMessage() != null
                                && ex.getMessage().contains("email")) {

                        msg = "Employee with this email already exists";

                } else {

                        msg = "Duplicate entry — record already exists";
                }

                return ResponseEntity
                                .status(HttpStatus.CONFLICT)
                                .body(
                                                ApiResponse.error(msg));
        }

        // ============================================================
        // FILE TOO LARGE
        // ============================================================

        @ExceptionHandler(MaxUploadSizeExceededException.class)
        public ResponseEntity<ApiResponse<Void>> handleFileTooLarge(
                        MaxUploadSizeExceededException ex) {

                return ResponseEntity
                                .status(HttpStatus.PAYLOAD_TOO_LARGE)
                                .body(
                                                ApiResponse.error(
                                                                "File too large — maximum allowed size is 10MB"));
        }

        // ============================================================
        // BAD CREDENTIALS
        // ============================================================

        @ExceptionHandler(BadCredentialsException.class)
        public ResponseEntity<ApiResponse<Void>> handleAuth(
                        BadCredentialsException ex) {

                return ResponseEntity
                                .status(HttpStatus.UNAUTHORIZED)
                                .body(
                                                ApiResponse.error(
                                                                "Invalid email or password"));
        }

        // ============================================================
        // ACCESS DENIED
        // ============================================================

        @ExceptionHandler(AccessDeniedException.class)
        public ResponseEntity<ApiResponse<Void>> handleForbidden(
                        AccessDeniedException ex) {

                return ResponseEntity
                                .status(HttpStatus.FORBIDDEN)
                                .body(
                                                ApiResponse.error(
                                                                "Access denied — you do not have permission for this action"));
        }

        // ============================================================
        // GENERIC / UNEXPECTED ERROR
        // ============================================================

        @ExceptionHandler(Exception.class)
        public ResponseEntity<ApiResponse<Void>> handleGeneric(
                        Exception ex) {

                logger.error(
                                "Unhandled exception caught in GlobalExceptionHandler",
                                ex);

                return ResponseEntity
                                .status(HttpStatus.INTERNAL_SERVER_ERROR)
                                .body(
                                                ApiResponse.error(
                                                                "An unexpected internal error occurred. Please contact support."));
        }
}