package com.hrms.dto;

import com.hrms.enums.LeaveStatus;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.time.LocalDate;
import java.time.LocalDateTime;

public class LeaveDTOs {

    @Data
    public static class CreateRequest {
        @NotBlank
        private String leaveType;
        @NotNull
        private LocalDate startDate;
        @NotNull
        private LocalDate endDate;
        @NotBlank
        private String reason;
        private String attachmentUrl;
        private String attachmentFileName;
        // no managerId — every request goes straight into the shared Admin/HR queue
    }

    @Data
    public static class ActionRequest {
        @NotNull
        private LeaveStatus action; // APPROVED or REJECTED
        private String remarks;
    }

    @Data
    public static class CancelRequest {
        private String reason; // why the employee wants to cancel (optional)
    }

    @Data
    public static class CancelActionRequest {
        @NotNull
        private Boolean approve; // true = confirm cancellation, false = deny
        private String remarks;
    }

    @Data
    public static class Response {
        private Long id;
        private Long employeeDbId;
        private String employeeName;
        private String employeeCode;
        private String leaveType;
        private LocalDate startDate;
        private LocalDate endDate;
        private int totalDays;
        private String reason;
        private String attachmentUrl;
        private String attachmentFileName;
        private LeaveStatus status;
        private String reviewedByName; // whichever Admin/HR actioned it
        private String remarks;
        private LocalDateTime appliedAt;
        private LocalDateTime actionAt;
        // Cancellation tracking
        private String cancellationReason;
        private LocalDateTime cancellationRequestedAt;
        private String cancellationRemarks;
        private LocalDateTime cancellationActionAt;
        private String cancellationReviewedByName;
    }

    @Data
    public static class BalanceResponse {
        private String leaveType;
        private int year;
        private double totalAllotted;
        private double used;
        private double remaining;
    }
}