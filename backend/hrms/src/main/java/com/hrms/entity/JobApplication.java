package com.hrms.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "job_applications")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class JobApplication {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "job_posting_id", nullable = false)
    private JobPosting jobPosting;

    // Candidate details
    @Column(nullable = false)
    private String candidateName;
    private String candidateEmail;
    private String candidatePhone;
    private String resumeUrl;
    private String coverLetter;
    private Integer experienceYears;
    private Integer experienceMonths; // <-- ADDED: was missing, caused build/runtime mismatch
    private String currentCompany;
    private String currentDesignation;

    @Enumerated(EnumType.STRING)
    private ApplicationStatus status;

    // Interview details
    private LocalDate interviewDate;
    private String interviewMode; // in person,video,phone/in
    private String interviewNotes;
    private Integer interviewScore; // out of 100

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "interviewer_id")
    private Employee interviewer;

    // Referral tracking
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "referred_by_id")
    private Employee referredBy;

    private String rejectionReason;

    private LocalDateTime appliedAt;
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        appliedAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }

    public enum ApplicationStatus {
        APPLIED, SHORTLISTED, INTERVIEW_SCHEDULED, INTERVIEWED,
        OFFER_SENT, OFFER_ACCEPTED, OFFER_REJECTED, REJECTED, WITHDRAWN
    }
}