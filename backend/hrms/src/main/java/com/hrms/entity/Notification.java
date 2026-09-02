package com.hrms.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "notifications", indexes = {
        @Index(name = "idx_recipient_read", columnList = "recipient_id, is_read")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Notification {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "recipient_id", nullable = false)
    private Employee recipient;

    private String title;

    @Column(columnDefinition = "TEXT")
    private String message;

    @Enumerated(EnumType.STRING)
    @Column(columnDefinition = "VARCHAR(50)")
    private NotificationType type;

    private String referenceType;

    private Long referenceId;

    @Column(name = "is_read")
    @Builder.Default
    private boolean isRead = false;

    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }

    public enum NotificationType {

        // Leave
        LEAVE_APPLIED,
        LEAVE_APPROVED,
        LEAVE_REJECTED,
        LEAVE_CANCELLED,

        // Attendance
        ATTENDANCE_REMINDER,

        // Payroll
        PAYROLL_GENERATED,

        // Performance
        PERFORMANCE_REVIEWED,

        // Training
        TRAINING_ENROLLED,
        TRAINING_COMPLETED,

        // Onboarding
        ONBOARDING_INITIATED,

        // Recruitment
        JOB_APPLICATION,
        JOB_POSTED,

        // Documents
        DOCUMENT_UPLOADED,
        DOCUMENT_APPROVED,
        DOCUMENT_REJECTED,
        DOCUMENT_REUPLOAD_REQUIRED,

        // Checklist
        CHECKLIST_COMPLETED,

        // General
        GENERAL,
        // ✅ NEW — Manual Admin Notifications
    GREETING,
    FESTIVAL,
    ANNOUNCEMENT,
    IMPORTANT_CIRCULAR
    }
}