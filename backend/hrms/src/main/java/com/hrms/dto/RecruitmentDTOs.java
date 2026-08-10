package com.hrms.dto;

import com.hrms.entity.JobApplication.ApplicationStatus;
import com.hrms.entity.JobPosting.PostingStatus;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.time.LocalDate;
import java.time.LocalDateTime;

public class RecruitmentDTOs {

    // ---- Job Posting ----
    @Data
    public static class CreateJobRequest {
        @NotBlank
        private String title;
        @NotBlank
        private String department;
        private String location;
        private String employmentType;
        private String description;
        private String requirements;
        private String experienceRequired;
        private String salaryRange;
        private LocalDate applicationDeadline;
    }

    @Data
    public static class UpdateJobRequest {
        private String title;
        private String description;
        private String requirements;
        private String salaryRange;
        private LocalDate applicationDeadline;
        private PostingStatus status;
    }

    @Data
    public static class JobResponse {
        private Long id;
        private String title;
        private String department;
        private String location;
        private String employmentType;
        private String description;
        private String requirements;
        private String experienceRequired;
        private String salaryRange;
        private LocalDate applicationDeadline;
        private PostingStatus status;
        private int applicationCount;
        private LocalDateTime createdAt;
    }

    // ---- Job Application ----
    @Data
    public static class ApplyRequest {
        @NotBlank
        private String candidateName;
        @NotBlank
        private String candidateEmail;
        private String candidatePhone;
        private String resumeUrl;
        private String coverLetter;
        private Integer experienceYears;
        private Integer experienceMonths;
        private String currentCompany;
        private String currentDesignation;
    }

    @Data
    public static class ReferralRequest {
        @NotBlank
        private String candidateName;

        @NotBlank
        private String candidateEmail;

        private String candidatePhone;

        private Integer experienceYears;
        private Integer experienceMonths;

        private String resumeUrl;
    }

    @Data
    public static class UpdateApplicationRequest {
        private ApplicationStatus status;
        private LocalDate interviewDate;
        private String interviewMode;
        private String interviewNotes;
        private Integer interviewScore;
        private Long interviewerId;
        private String rejectionReason;
    }

    @Data
    public static class ApplicationResponse {
        private Long id;
        private Long jobPostingId;
        private String jobTitle;
        private String department;
        private String candidateName;
        private String candidateEmail;
        private String candidatePhone;
        private String resumeUrl;
        private String referredByName;
        private Integer experienceYears;
        private Integer experienceMonths;
        private String currentCompany;
        private ApplicationStatus status;
        private LocalDate interviewDate;
        private String interviewMode;
        private Integer interviewScore;
        private String interviewerName;
        private String rejectionReason;
        private LocalDateTime appliedAt;
    }
}
