package com.hrms.dto;

import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

public class PayslipDTOs {

    @Data
    public static class Response {
        private Long id;
        private String payslipNumber;
        private Long employeeDbId;
        private String employeeName;
        private String employeeCode;
        private String department;
        private String designation;
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
        private LocalDateTime generatedAt;
    }
}