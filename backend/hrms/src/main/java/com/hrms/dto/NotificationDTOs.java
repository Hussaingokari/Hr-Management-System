package com.hrms.dto;

import com.hrms.entity.Notification.NotificationType;
import lombok.Data;

import java.time.LocalDateTime;

public class NotificationDTOs {

    @Data
    public static class Response {
        private Long id;
        private String title;
        private String message;
        private NotificationType type;
        private String referenceType;
        private Long referenceId;
        @com.fasterxml.jackson.annotation.JsonProperty("isRead")
        private boolean isRead;
        private LocalDateTime createdAt;
    }
}