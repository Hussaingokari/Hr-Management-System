package com.hrms.entity;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "payroll")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Payroll {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "employee_id", nullable = false)
    private Employee employee;

    private int month; // 1-12
    private int year;

    // Earnings
    @Column(precision = 12, scale = 2)
    private BigDecimal basicSalary;

    @Column(precision = 12, scale = 2)
    private BigDecimal hra; // House Rent Allowance

    @Column(precision = 12, scale = 2)
    private BigDecimal da; // Dearness Allowance

    @Column(precision = 12, scale = 2)
    private BigDecimal specialAllowance;

    @Column(precision = 12, scale = 2)
    private BigDecimal grossSalary;

    // Deductions
    @Column(precision = 12, scale = 2)
    private BigDecimal esi; // ESI (0.75% of gross if <= 21000)

    @Column(precision = 12, scale = 2)
    private BigDecimal tds; // Tax Deducted at Source

    @Column(precision = 12, scale = 2)
    private BigDecimal totalDeductions;

    @Column(precision = 12, scale = 2)
    private BigDecimal netSalary;

    private int presentDays;
    private int lopDays; // Loss of Pay

    private boolean paid = false;
    private LocalDate payDate;

    private LocalDateTime generatedAt;

    @PrePersist
    protected void onCreate() {
        generatedAt = LocalDateTime.now();
    }
}