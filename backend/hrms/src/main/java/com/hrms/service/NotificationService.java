package com.hrms.service;

import com.hrms.dto.NotificationDTOs;
import com.hrms.entity.Employee;
import com.hrms.entity.Notification;
import com.hrms.entity.Notification.NotificationType;
import com.hrms.enums.Role;
import com.hrms.repository.EmployeeRepository;
import com.hrms.repository.NotificationRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import com.hrms.dto.SendNotificationRequest;
import org.springframework.security.access.AccessDeniedException;

import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Service
@RequiredArgsConstructor
@Slf4j
public class NotificationService {

    private final NotificationRepository notificationRepo;
    private final JavaMailSender mailSender;
    private final EmployeeRepository employeeRepository;

    @Transactional
    public Notification createAndSend(
            Employee recipient,
            String title,
            String message,
            NotificationType type,
            String refType,
            Long refId) {

        Notification notification = Notification.builder()
                .recipient(recipient)
                .title(title)
                .message(message)
                .type(type)
                .referenceType(refType)
                .referenceId(refId)
                .isRead(false)
                .build();

        Notification saved = notificationRepo.save(notification);

        java.util.concurrent.CompletableFuture.runAsync(() -> {
            sendEmailSafe(
                    recipient.getEmail(),
                    title,
                    message
            );
        });

        return saved;
    }

    // Notify all active ADMIN + HR employees
    @Transactional
    public void notifyAllAdmins(
            String title,
            String message,
            NotificationType type,
            String entityType,
            Long entityId,
            Long excludeId) {

        employeeRepository.findAll()
                .stream()
                .filter(e ->
                        e.isActive()
                                &&
                        (e.getRole() == Role.ADMIN
                                || e.getRole() == Role.HR)
                                &&
                        (excludeId == null
                                || !e.getId().equals(excludeId))
                )
                .forEach(admin ->
                        createAndSend(
                                admin,
                                title,
                                message,
                                type,
                                entityType,
                                entityId
                        )
                );
    }

    // Overload without excludeId
    @Transactional
    public void notifyAllAdmins(
            String title,
            String message,
            NotificationType type,
            String entityType,
            Long entityId) {

        notifyAllAdmins(
                title,
                message,
                type,
                entityType,
                entityId,
                null
        );
    }

    // ✅ NEW — Notify every active employee (used when a new job is posted,
    // so the whole company sees the opening in their notifications).
    @Transactional
    public void notifyAllEmployees(
            String title,
            String message,
            NotificationType type,
            String entityType,
            Long entityId) {

        employeeRepository.findAll()
                .stream()
                .filter(Employee::isActive)
                .forEach(emp ->
                        createAndSend(
                                emp,
                                title,
                                message,
                                type,
                                entityType,
                                entityId
                        )
                );
    }

    private void sendEmailSafe(
            String toEmail,
            String subject,
            String body) {

        try {
            SimpleMailMessage mail =
                    new SimpleMailMessage();

            mail.setTo(toEmail);
            mail.setSubject(subject);
            mail.setText(body);

            mailSender.send(mail);

        } catch (Exception e) {

            log.warn(
                    "Email notification failed for {}: {}",
                    toEmail,
                    e.getMessage()
            );
        }
    }

    @Transactional(readOnly = true)
    public Page<NotificationDTOs.Response> getMyNotifications(
            Employee employee,
            Pageable pageable) {

        return notificationRepo
                .findByRecipient(employee, pageable)
                .map(this::toResponse);
    }

    @Transactional(readOnly = true)
    public Page<NotificationDTOs.Response> getUnread(
            Employee employee,
            Pageable pageable) {

        return notificationRepo
                .findByRecipientAndIsReadFalse(
                        employee,
                        pageable
                )
                .map(this::toResponse);
    }

    public long getUnreadCount(Employee employee) {

        return notificationRepo
                .countByRecipientAndIsReadFalse(employee);
    }

    /*
     * Mark one notification as read.
     *
     * Ownership is checked so one user cannot
     * modify another user's notification.
     */
    @Transactional
    public void markAsRead(
            Long notificationId,
            Employee employee) {

        Notification notification =
                notificationRepo.findById(notificationId)
                        .orElseThrow(() ->
                                new IllegalArgumentException(
                                        "Notification not found"
                                )
                        );

        verifyOwnership(notification, employee);

        notification.setRead(true);

        notificationRepo.save(notification);
    }

    /*
     * Mark all notifications belonging to the
     * logged-in employee as read.
     */
    @Transactional
    public void markAllAsRead(Employee employee) {

        notificationRepo.markAllAsReadByRecipient(employee);
    }

    /*
     * Delete ONE notification.
     *
     * Only the owner can delete it.
     */
    @Transactional
    public void deleteNotification(
            Long notificationId,
            Employee employee) {

        Notification notification =
                notificationRepo.findById(notificationId)
                        .orElseThrow(() ->
                                new IllegalArgumentException(
                                        "Notification not found"
                                )
                        );

        verifyOwnership(notification, employee);

        notificationRepo.delete(notification);
    }

    /*
     * Delete ALL notifications belonging to
     * the currently logged-in user.
     *
     * This works for:
     * ADMIN
     * HR
     * EMPLOYEE
     */
    @Transactional
    public void clearAllNotifications(Employee employee) {

        notificationRepo.deleteByRecipient(employee);
    }

    /*
     * Security check.
     *
     * Prevents Employee A from deleting or modifying
     * Employee B's notification.
     */
    private void verifyOwnership(
            Notification notification,
            Employee employee) {

        if (notification.getRecipient() == null
                || employee == null
                || !notification.getRecipient()
                        .getId()
                        .equals(employee.getId())) {

            throw new org.springframework.security.access.AccessDeniedException(
                    "You do not have permission to modify this notification"
            );
        }
    }

    private NotificationDTOs.Response toResponse(
            Notification n) {

        NotificationDTOs.Response r =
                new NotificationDTOs.Response();

        r.setId(n.getId());
        r.setTitle(n.getTitle());
        r.setMessage(n.getMessage());
        r.setType(n.getType());
        r.setReferenceType(n.getReferenceType());
        r.setReferenceId(n.getReferenceId());
        r.setRead(n.isRead());
        r.setCreatedAt(n.getCreatedAt());

        return r;
    }
    // ============================================================
// ADMIN / CEO MANUAL NOTIFICATION
// ============================================================

@Transactional
public int sendManualNotification(
        Employee sender,
        SendNotificationRequest request) {

    // ------------------------------------------------------------
    // SECURITY
    // ------------------------------------------------------------

    if (sender == null) {
        throw new AccessDeniedException(
                "Authenticated user is required"
        );
    }

    /*
     * Your current application has ADMIN, HR and EMPLOYEE roles.
     *
     * For this new feature, we are allowing ADMIN only.
     *
     * If later your application introduces a separate CEO role,
     * we can add that role here.
     */

    if (sender.getRole() != Role.ADMIN) {
        throw new AccessDeniedException(
                "Only Admin can send manual notifications"
        );
    }

    // ------------------------------------------------------------
    // VALIDATE REQUEST
    // ------------------------------------------------------------

    if (request == null) {
        throw new IllegalArgumentException(
                "Notification request is required"
        );
    }

    if (request.getType() == null) {
        throw new IllegalArgumentException(
                "Notification type is required"
        );
    }

    if (request.getSendTo() == null) {
        throw new IllegalArgumentException(
                "Recipient type is required"
        );
    }

    if (request.getTitle() == null
            || request.getTitle().trim().isEmpty()) {

        throw new IllegalArgumentException(
                "Notification title is required"
        );
    }

    if (request.getMessage() == null
            || request.getMessage().trim().isEmpty()) {

        throw new IllegalArgumentException(
                "Notification message is required"
        );
    }

    // ------------------------------------------------------------
    // DETERMINE RECIPIENTS
    // ------------------------------------------------------------

    List<Employee> recipients;

    switch (request.getSendTo()) {

        case ALL -> {

            /*
             * Get only active employees.
             */
            recipients =
                    employeeRepository.findByActiveTrue();

            if (recipients.isEmpty()) {
                throw new IllegalArgumentException(
                        "No active employees found"
                );
            }
        }

        case INDIVIDUAL -> {

            validateEmployeeIds(
                    request.getEmployeeIds(),
                    1
            );

            if (request.getEmployeeIds().size() != 1) {
                throw new IllegalArgumentException(
                        "Individual notification requires exactly one employee"
                );
            }

            Long employeeId =
                    request.getEmployeeIds().get(0);

            Employee employee =
                    employeeRepository.findById(employeeId)
                            .orElseThrow(() ->
                                    new IllegalArgumentException(
                                            "Employee not found: "
                                                    + employeeId
                                    )
                            );

            if (!employee.isActive()) {
                throw new IllegalArgumentException(
                        "Selected employee is inactive: "
                                + employee.getEmployeeId()
                );
            }

            recipients =
                    List.of(employee);
        }

        case MULTIPLE -> {

            validateEmployeeIds(
                    request.getEmployeeIds(),
                    2
            );

            /*
             * Remove duplicate employee IDs.
             */
            Set<Long> uniqueIds =
                    new HashSet<>(
                            request.getEmployeeIds()
                    );

            recipients =
                    employeeRepository
                            .findAllById(uniqueIds);

            if (recipients.isEmpty()) {
                throw new IllegalArgumentException(
                        "No valid employees found"
                );
            }

            /*
             * Make sure every requested employee exists.
             */
            if (recipients.size()
                    != uniqueIds.size()) {

                throw new IllegalArgumentException(
                        "One or more selected employees were not found"
                );
            }

            /*
             * Do not send to inactive employees.
             */
            List<Employee> inactiveEmployees =
                    recipients.stream()
                            .filter(employee ->
                                    !employee.isActive())
                            .toList();

            if (!inactiveEmployees.isEmpty()) {

                String inactiveIds =
                        inactiveEmployees.stream()
                                .map(Employee::getEmployeeId)
                                .reduce(
                                        (a, b) ->
                                                a + ", " + b
                                )
                                .orElse("");

                throw new IllegalArgumentException(
                        "Selected employee(s) are inactive: "
                                + inactiveIds
                );
            }
        }

        default -> throw new IllegalArgumentException(
                "Invalid recipient type"
        );
    }

    // ------------------------------------------------------------
    // CREATE NOTIFICATION FOR EACH RECIPIENT
    // ------------------------------------------------------------

    String title =
            request.getTitle().trim();

    String message =
            request.getMessage().trim();

    int sentCount = 0;

    for (Employee recipient : recipients) {

        createAndSend(
                recipient,
                title,
                message,
                request.getType(),
                "MANUAL_NOTIFICATION",
                null
        );

        sentCount++;
    }

    return sentCount;
}
// ============================================================
// VALIDATE EMPLOYEE IDS
// ============================================================

private void validateEmployeeIds(
        List<Long> employeeIds,
        int minimumRequired) {

    if (employeeIds == null
            || employeeIds.isEmpty()) {

        throw new IllegalArgumentException(
                "At least "
                        + minimumRequired
                        + " employee ID(s) must be selected"
        );
    }

    if (employeeIds.stream()
            .anyMatch(id -> id == null || id <= 0)) {

        throw new IllegalArgumentException(
                "Employee IDs must be valid"
        );
    }
}
}