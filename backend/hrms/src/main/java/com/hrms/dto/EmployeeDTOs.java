package com.hrms.dto;

import com.hrms.enums.Role;
import jakarta.validation.constraints.*;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

public class EmployeeDTOs {

    // ============================================================
    // CREATE EMPLOYEE REQUEST
    // ============================================================

    @Data
    public static class CreateRequest {

        @NotBlank
        private String employeeId;

        @NotBlank
        private String firstName;

        @NotBlank
        private String lastName;

        @NotBlank
        @Email
        private String email;

        @NotBlank
        @Size(min = 6)
        private String password;

        private String phone;

        @NotBlank
        private String department;

        @NotBlank
        private String designation;

        @NotNull
        private BigDecimal basicSalary;

        private LocalDate dateOfJoining;

        private LocalDate dateOfBirth;

        @NotNull
        private Role role;
    }

    // ============================================================
    // UPDATE EMPLOYEE REQUEST
    // ============================================================

    @Data
    public static class UpdateRequest {

        private String employeeId;

        private String firstName;

        private String lastName;

        @Email
        private String email;

        private String phone;

        private String department;

        private String designation;

        private BigDecimal basicSalary;

        private LocalDate dateOfJoining;

        private LocalDate dateOfBirth;

        private Role role;

        private Boolean active;

        private String password;
    }

    // ============================================================
    // EMPLOYEE RESPONSE
    // ============================================================

    @Data
    public static class Response {

        private Long id;

        private String employeeId;

        private String firstName;

        private String lastName;

        private String fullName;

        private String email;

        private String phone;

        private String department;

        private String designation;

        private BigDecimal basicSalary;

        private LocalDate dateOfJoining;

        private LocalDate dateOfBirth;

        private Role role;

        private boolean active;

        private LocalDateTime createdAt;
    }
}