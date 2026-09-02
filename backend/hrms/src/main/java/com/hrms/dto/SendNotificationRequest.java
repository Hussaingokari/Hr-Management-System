package com.hrms.dto;

import com.hrms.entity.Notification.NotificationType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.util.List;

@Data
public class SendNotificationRequest {

    // ============================================================
    // NOTIFICATION TYPE
    // ============================================================

    @NotNull(message = "Notification type is required")
    private NotificationType type;

    // ============================================================
    // RECIPIENT MODE
    // ============================================================

    @NotNull(message = "Recipient type is required")
    private RecipientType sendTo;

    // ============================================================
    // EMPLOYEE IDS
    // ============================================================
    /*
     * Required only when:
     *
     * INDIVIDUAL
     * MULTIPLE
     *
     * For ALL, this can be null or empty.
     */

    private List<Long> employeeIds;

    // ============================================================
    // TITLE
    // ============================================================

    @NotBlank(message = "Title is required")
    @Size(
            max = 150,
            message = "Title cannot exceed 150 characters"
    )
    private String title;

    // ============================================================
    // MESSAGE
    // ============================================================

    @NotBlank(message = "Message is required")
    private String message;

    // ============================================================
    // RECIPIENT TYPE
    // ============================================================

    public enum RecipientType {

        /**
         * Send notification to every active employee.
         */
        ALL,

        /**
         * Send notification to exactly one employee.
         */
        INDIVIDUAL,

        /**
         * Send notification to multiple selected employees.
         */
        MULTIPLE
    }
}