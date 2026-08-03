package com.hrms.entity;

import com.hrms.enums.LeaveStatus;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "leave_requests")
@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class LeaveRequest {

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

    @Column(nullable = false)
    private LocalDate startDate;

    @Column(nullable = false)
    private LocalDate endDate;

    private int totalDays;
    private String reason;

    // File attachment (ex medical certificate)
    private String attachmentUrl;
    private String attachmentFileName;

    @Enumerated(EnumType.STRING)
    @Builder.Default
    private LeaveStatus status = LeaveStatus.PENDING;

    // Two-step approval: Manager  HR

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "manager_id")
    private Employee manager;

    @Enumerated(EnumType.STRING)
    private ApprovalStage approvalStage;   //managerpending,managerapproved,hrpending,hr approved, rejected

    private String managerRemarks;
    private LocalDateTime managerActionAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "approved_by")
    private Employee approvedBy;          // Final hr approver

    private String remarks;
    private LocalDateTime appliedAt;
    private LocalDateTime actionAt;

    //  Cancellation request for already-approved leaves
    private String cancellationReason;
    private LocalDateTime cancellationRequestedAt;
    private String cancellationRemarks;     // HR's note when confirming/denying
    private LocalDateTime cancellationActionAt;

    @PrePersist
    protected void onCreate() {
        appliedAt = LocalDateTime.now();
        if (approvalStage == null) {
            approvalStage = ApprovalStage.MANAGER_PENDING;
        }
    }

    public enum ApprovalStage {
        MANAGER_PENDING, MANAGER_APPROVED, HR_PENDING, HR_APPROVED, REJECTED
    }
}