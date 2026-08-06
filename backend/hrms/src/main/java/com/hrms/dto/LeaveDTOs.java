package com.hrms.dto;

import com.hrms.entity.LeaveRequest.ApprovalStage;
import com.hrms.enums.LeaveStatus;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.time.LocalDate;
import java.time.LocalDateTime;

public class LeaveDTOs {

    @Data
    public static class CreateRequest {
        @NotBlank private String leaveType;
        @NotNull  private LocalDate startDate;
        @NotNull  private LocalDate endDate;
        @NotBlank 
        @jakarta.validation.constraints.Size(max = 255, message = "Reason cannot exceed 255 characters")
        private String reason;
        private String attachmentUrl;
        private String attachmentFileName;
        private Long managerId;       // optional — for two-step approval
    }

    @Data
    public static class ActionRequest {
        @NotNull private LeaveStatus action;  // APPROVED or REJECTED
        private String remarks;
    }

    @Data
    public static class CancelRequest {
        private String reason;   // why the employee wants to cancel (optional)
    }

    @Data
    public static class CancelActionRequest {
        @NotNull private Boolean approve;   // true = confirm cancellation, false = deny
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
        private ApprovalStage approvalStage;
        private String managerName;
        private String managerRemarks;
        private LocalDateTime managerActionAt;
        private String approvedByName;
        private String remarks;
        private LocalDateTime appliedAt;
        // Cancellation tracking
        private String cancellationReason;
        private LocalDateTime cancellationRequestedAt;
        private String cancellationRemarks;
        private LocalDateTime cancellationActionAt;
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