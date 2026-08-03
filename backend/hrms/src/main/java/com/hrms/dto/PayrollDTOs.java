package com.hrms.dto;

import jakarta.validation.constraints.*;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;

public class PayrollDTOs {

    @Data
    public static class GenerateRequest {
        @NotNull
        private Long employeeId;
        @Min(1)
        @Max(12)
        private int month;
        @Min(2020)
        private int year;
    }

    @Data
    public static class Response {
        private Long id;
        private Long employeeDbId;
        private String employeeName;
        private String employeeCode;
        private int month;
        private int year;
        private BigDecimal basicSalary;
        private BigDecimal hra;
        private BigDecimal da;
        private BigDecimal specialAllowance;
        private BigDecimal grossSalary;
        private BigDecimal esi;
        private BigDecimal tds;
        private BigDecimal totalDeductions;
        private BigDecimal netSalary;
        private int presentDays;
        private int lopDays;
        private boolean paid;
        private LocalDate payDate;
    }
}