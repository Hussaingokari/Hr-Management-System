package com.hrms.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "leave_balance", uniqueConstraints = @UniqueConstraint(columnNames = {
        "employee_id",
        "leave_type",
        "\"year\""
}))
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LeaveBalance {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Version
    private Long version;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "employee_id", nullable = false)
    private Employee employee;

    @Column(nullable = false)
    private String leaveType;

    @Column(name = "\"year\"")
    private int year;

    private double totalAllotted;

    private double used;

    private double remaining;

    private LocalDateTime updatedAt;

    @PreUpdate
    @PrePersist
    protected void onUpdate() {

        updatedAt = LocalDateTime.now();

        /*
         * Unpaid leave is unlimited.
         * Its display is handled by the frontend.
         */
        if ("UNPAID".equalsIgnoreCase(leaveType)) {
            remaining = 0;
        } else {
            remaining = Math.max(
                    0,
                    totalAllotted - used);
        }
    }
}