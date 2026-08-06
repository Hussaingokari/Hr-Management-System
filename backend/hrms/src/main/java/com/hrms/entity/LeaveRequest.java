package com.hrms.entity;

import com.hrms.enums.LeaveStatus;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * A single leave request.
 *
 * Approval model (real-world, no "Manager" role):
 * Employee applies -> status = PENDING
 * ANY Admin or HR user can Approve or Reject it (first one wins).
 * -> status = APPROVED or REJECTED
 *
 * There is no forwarding step. Whoever from Admin/HR opens the
 * queue first and acts on it settles the request; the row simply
 * disappears from everyone else's pending queue.
 */
@Entity
@Table(name = "leave_requests")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LeaveRequest {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

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

    // File attachment (e.g. medical certificate)
    private String attachmentUrl;
    private String attachmentFileName;

    @Enumerated(EnumType.STRING)
    @Builder.Default
    private LeaveStatus status = LeaveStatus.PENDING;

    // Whoever (Admin or HR) approved/rejected it
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "reviewed_by")
    private Employee reviewedBy;

    private String remarks; // reviewer's note on approve/reject
    private LocalDateTime appliedAt;
    private LocalDateTime actionAt;

    // Cancellation request for already-approved leaves
    private String cancellationReason;
    private LocalDateTime cancellationRequestedAt;
    private String cancellationRemarks; // reviewer's note when confirming/denying
    private LocalDateTime cancellationActionAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "cancellation_reviewed_by")
    private Employee cancellationReviewedBy;

    @PrePersist
    protected void onCreate() {
        appliedAt = LocalDateTime.now();
        if (status == null) {
            status = LeaveStatus.PENDING;
        }
    }
}