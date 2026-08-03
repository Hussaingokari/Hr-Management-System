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
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

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
        sendEmailSafe(recipient.getEmail(), title, message);
        return saved;
    }

    // ✅ NEW — Notify all active ADMIN + HR employees
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
                .filter(e -> e.isActive() &&
                        (e.getRole() == Role.ADMIN ||
                                e.getRole() == Role.HR) &&
                        (excludeId == null ||
                                !e.getId().equals(excludeId))
                )
                .forEach(admin ->
                        createAndSend(
                                admin, title, message,
                                type, entityType, entityId
                        )
                );
    }

    // ✅ NEW — Overload without excludeId
    @Transactional
    public void notifyAllAdmins(
            String title,
            String message,
            NotificationType type,
            String entityType,
            Long entityId) {
        notifyAllAdmins(
                title, message, type,
                entityType, entityId, null
        );
    }

    private void sendEmailSafe(
            String toEmail,
            String subject,
            String body) {
        try {
            SimpleMailMessage mail = new SimpleMailMessage();
            mail.setTo(toEmail);
            mail.setSubject(subject);
            mail.setText(body);
            mailSender.send(mail);
        } catch (Exception e) {
            log.warn("Email notification failed for {}: {}",
                    toEmail, e.getMessage());
        }
    }

    @Transactional(readOnly = true)
    public Page<NotificationDTOs.Response> getMyNotifications(
            Employee employee, Pageable pageable) {
        return notificationRepo
                .findByRecipient(employee, pageable)
                .map(this::toResponse);
    }

    @Transactional(readOnly = true)
    public Page<NotificationDTOs.Response> getUnread(
            Employee employee, Pageable pageable) {
        return notificationRepo
                .findByRecipientAndIsReadFalse(employee, pageable)
                .map(this::toResponse);
    }

    public long getUnreadCount(Employee employee) {
        return notificationRepo
                .countByRecipientAndIsReadFalse(employee);
    }

    @Transactional
    public void markAsRead(Long notificationId) {
        notificationRepo.findById(notificationId)
                .ifPresent(n -> {
                    n.setRead(true);
                    notificationRepo.save(n);
                });
    }

    @Transactional
    public void markAllAsRead(Employee employee) {
        notificationRepo
                .findByRecipientAndIsReadFalse(employee,
                        Pageable.unpaged())
                .forEach(n -> {
                    n.setRead(true);
                    notificationRepo.save(n);
                });
    }

    private NotificationDTOs.Response toResponse(Notification n) {
        NotificationDTOs.Response r = new NotificationDTOs.Response();
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
}