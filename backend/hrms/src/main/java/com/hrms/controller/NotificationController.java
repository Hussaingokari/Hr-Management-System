package com.hrms.controller;

import com.hrms.dto.ApiResponse;
import com.hrms.dto.NotificationDTOs;
import com.hrms.entity.Employee;
import com.hrms.service.NotificationService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import com.hrms.dto.SendNotificationRequest;
import jakarta.validation.Valid;
import org.springframework.security.access.prepost.PreAuthorize;

@RestController
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
@Tag(name = "Notifications")
public class NotificationController {

    private final NotificationService notificationService;

    @GetMapping
    @Operation(summary = "Get my notifications")
    public ResponseEntity<ApiResponse<Page<NotificationDTOs.Response>>> myNotifications(
            @AuthenticationPrincipal Employee emp,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {

        return ResponseEntity.ok(
                ApiResponse.success(
                        "Notifications",
                        notificationService.getMyNotifications(
                                emp,
                                PageRequest.of(
                                        page,
                                        size,
                                        Sort.by("createdAt").descending()
                                )
                        )
                )
        );
    }

    @GetMapping("/unread")
    @Operation(summary = "Get unread notifications")
    public ResponseEntity<ApiResponse<Page<NotificationDTOs.Response>>> unread(
            @AuthenticationPrincipal Employee emp,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {

        return ResponseEntity.ok(
                ApiResponse.success(
                        "Unread notifications",
                        notificationService.getUnread(
                                emp,
                                PageRequest.of(page, size)
                        )
                )
        );
    }

    @GetMapping("/unread-count")
    @Operation(summary = "Get unread notification count")
    public ResponseEntity<ApiResponse<Long>> unreadCount(
            @AuthenticationPrincipal Employee emp) {

        return ResponseEntity.ok(
                ApiResponse.success(
                        "Unread count",
                        notificationService.getUnreadCount(emp)
                )
        );
    }

    @PutMapping("/{id}/read")
    @Operation(summary = "Mark notification as read")
    public ResponseEntity<ApiResponse<Void>> markRead(
            @AuthenticationPrincipal Employee emp,
            @PathVariable Long id) {

        notificationService.markAsRead(id, emp);

        return ResponseEntity.ok(
                ApiResponse.success("Marked as read")
        );
    }

    @PutMapping("/mark-all-read")
    @Operation(summary = "Mark all my notifications as read")
    public ResponseEntity<ApiResponse<Void>> markAllRead(
            @AuthenticationPrincipal Employee emp) {

        notificationService.markAllAsRead(emp);

        return ResponseEntity.ok(
                ApiResponse.success("All marked as read")
        );
    }

    /*
     * Delete one notification
     */
    @DeleteMapping("/{id}")
    @Operation(summary = "Delete one of my notifications")
    public ResponseEntity<ApiResponse<Void>> deleteNotification(
            @AuthenticationPrincipal Employee emp,
            @PathVariable Long id) {

        notificationService.deleteNotification(id, emp);

        return ResponseEntity.ok(
                ApiResponse.success("Notification deleted")
        );
    }

    /*
     * Delete all notifications belonging to the
     * currently logged-in employee/admin/HR.
     */
    @DeleteMapping("/clear-all")
    @Operation(summary = "Delete all my notifications")
    public ResponseEntity<ApiResponse<Void>> clearAllNotifications(
            @AuthenticationPrincipal Employee emp) {

        notificationService.clearAllNotifications(emp);

        return ResponseEntity.ok(
                ApiResponse.success("All notifications deleted")
        );
    }
    // ============================================================
// SEND MANUAL NOTIFICATION
// ADMIN ONLY
// ============================================================

@PostMapping("/send")
@PreAuthorize("hasRole('ADMIN')")
@Operation(
        summary = "Send notification to employees"
)
public ResponseEntity<ApiResponse<Integer>> sendNotification(
        @AuthenticationPrincipal Employee emp,
        @Valid @RequestBody SendNotificationRequest request) {

    int sentCount =
            notificationService.sendManualNotification(
                    emp,
                    request
            );

    return ResponseEntity.ok(
            ApiResponse.success(
                    "Notification sent successfully to "
                            + sentCount
                            + " employee(s)",
                    sentCount
            )
    );
}
}