package com.hrms.service;

import com.hrms.dto.LeaveDTOs;
import com.hrms.entity.Employee;
import com.hrms.entity.LeaveRequest;
import com.hrms.entity.LeaveRequest.ApprovalStage;
import com.hrms.entity.Notification.NotificationType;
import com.hrms.enums.LeaveStatus;
import com.hrms.enums.Role;
import com.hrms.repository.EmployeeRepository;
import com.hrms.repository.LeaveRequestRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.NoSuchElementException;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class LeaveService {

    private final LeaveRequestRepository leaveRepo;
    private final EmployeeService employeeService;
    private final LeaveBalanceService leaveBalanceService;
    private final NotificationService notificationService;
    private final EmployeeRepository employeeRepository;

    // ── Helper: notify all active ADMIN + HR ──
    private void notifyAllAdmins(
            String title, String message,
            NotificationType type,
            String entityType, Long entityId,
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
                        notificationService.createAndSend(
                                admin, title, message,
                                type, entityType, entityId
                        )
                );
    }

    @Transactional
    @CacheEvict(value = "dashboardData", allEntries = true)
    public LeaveDTOs.Response applyLeave(
            Long employeeId,
            LeaveDTOs.CreateRequest req) {

        Employee emp = employeeService.findById(employeeId);

        if (req.getEndDate().isBefore(req.getStartDate())) {
            throw new IllegalArgumentException(
                    "End date must be after start date");
        }

        int days = calculateWorkingDays(
                req.getStartDate(), req.getEndDate());

        int pendingDays = leaveRepo.sumPendingDaysByEmployeeAndLeaveType(emp, req.getLeaveType());

        if (!leaveBalanceService.hasSufficientBalance(
                emp, req.getLeaveType(), days + pendingDays)) {
            throw new IllegalStateException(
                    "Insufficient leave balance for "
                            + req.getLeaveType()
                            + ". Requested: " + days + " days, Pending: " + pendingDays + " days.");
        }

        Employee manager = req.getManagerId() != null
                ? employeeService.findById(req.getManagerId())
                : null;

        LeaveRequest leave = LeaveRequest.builder()
                .employee(emp)
                .leaveType(req.getLeaveType())
                .startDate(req.getStartDate())
                .endDate(req.getEndDate())
                .totalDays(days)
                .reason(req.getReason())
                .attachmentUrl(req.getAttachmentUrl())
                .attachmentFileName(req.getAttachmentFileName())
                .manager(manager)
                .status(LeaveStatus.PENDING)
                .approvalStage(manager != null
                        ? ApprovalStage.MANAGER_PENDING
                        : ApprovalStage.HR_PENDING)
                .build();

        LeaveRequest saved = leaveRepo.save(leave);

        String notifMsg = emp.getFirstName() + " "
                + emp.getLastName() + " applied for "
                + days + " day(s) of "
                + req.getLeaveType() + " leave from "
                + req.getStartDate() + " to "
                + req.getEndDate() + ".";

        // Notify manager if selected
        if (manager != null) {
            notificationService.createAndSend(
                    manager,
                    "New Leave Request",
                    notifMsg,
                    NotificationType.LEAVE_APPLIED,
                    "LEAVE_REQUEST",
                    saved.getId()
            );
        }

        // Notify ALL admins and HR
        notifyAllAdmins(
                "New Leave Request",
                notifMsg,
                NotificationType.LEAVE_APPLIED,
                "LEAVE_REQUEST",
                saved.getId(),
                manager != null ? manager.getId() : null
        );

        return toResponse(saved);
    }

    @Transactional
    @CacheEvict(value = "dashboardData", allEntries = true)
    public LeaveDTOs.Response managerAction(
            Long leaveId, Long managerId,
            LeaveDTOs.ActionRequest req) {

        LeaveRequest leave = findById(leaveId);

        if (leave.getApprovalStage() != ApprovalStage.MANAGER_PENDING) {
            throw new IllegalStateException(
                    "Leave is not awaiting manager approval");
        }
        
        if (leave.getManager() == null || !leave.getManager().getId().equals(managerId)) {
            throw new org.springframework.security.access.AccessDeniedException(
                    "You are not the assigned manager for this leave request.");
        }

        Employee manager = employeeService.findById(managerId);
        leave.setManagerRemarks(req.getRemarks());
        leave.setManagerActionAt(LocalDateTime.now());

        if (req.getAction() == LeaveStatus.APPROVED) {
            leave.setApprovalStage(ApprovalStage.HR_PENDING);

            // Notify employee
            notificationService.createAndSend(
                    leave.getEmployee(),
                    "Leave Forwarded to HR",
                    "Your leave request was approved by manager "
                            + "and is now pending HR verification.",
                    NotificationType.LEAVE_APPLIED,
                    "LEAVE_REQUEST", leave.getId());

            // Notify all admins/HR
            notifyAllAdmins(
                    "Leave Pending HR Verification",
                    leave.getEmployee().getFirstName() + " "
                            + leave.getEmployee().getLastName()
                            + "'s " + leave.getLeaveType()
                            + " leave is pending HR verification.",
                    NotificationType.LEAVE_APPLIED,
                    "LEAVE_REQUEST", leave.getId(),
                    managerId
            );

        } else {
            leave.setApprovalStage(ApprovalStage.REJECTED);
            leave.setStatus(LeaveStatus.REJECTED);
            leave.setActionAt(LocalDateTime.now());

            // Notify employee
            notificationService.createAndSend(
                    leave.getEmployee(),
                    "Leave Rejected",
                    "Your leave request was rejected by your manager. "
                            + "Reason: " + req.getRemarks(),
                    NotificationType.LEAVE_REJECTED,
                    "LEAVE_REQUEST", leave.getId());
        }

        return toResponse(leaveRepo.save(leave));
    }

    @Transactional
    @CacheEvict(value = "dashboardData", allEntries = true)
    public LeaveDTOs.Response hrAction(
            Long leaveId, Long hrId,
            LeaveDTOs.ActionRequest req) {

        LeaveRequest leave = findById(leaveId);

        if (leave.getApprovalStage() != ApprovalStage.HR_PENDING) {
            throw new IllegalStateException(
                    "Leave is not awaiting HR verification");
        }

        Employee hr = employeeService.findById(hrId);
        leave.setApprovedBy(hr);
        leave.setRemarks(req.getRemarks());
        leave.setActionAt(LocalDateTime.now());

        if (req.getAction() == LeaveStatus.APPROVED) {
            leave.setApprovalStage(ApprovalStage.HR_APPROVED);
            leave.setStatus(LeaveStatus.APPROVED);

            leaveBalanceService.deductBalance(
                    leave.getEmployee(),
                    leave.getLeaveType(),
                    leave.getTotalDays());

            // Notify employee
            notificationService.createAndSend(
                    leave.getEmployee(),
                    "Leave Approved",
                    "Your " + leave.getLeaveType()
                            + " leave from " + leave.getStartDate()
                            + " to " + leave.getEndDate()
                            + " has been approved.",
                    NotificationType.LEAVE_APPROVED,
                    "LEAVE_REQUEST", leave.getId());

            // Notify all admins/HR
            notifyAllAdmins(
                    "Leave Approved",
                    leave.getEmployee().getFirstName() + " "
                            + leave.getEmployee().getLastName()
                            + "'s " + leave.getLeaveType()
                            + " leave has been approved.",
                    NotificationType.LEAVE_APPROVED,
                    "LEAVE_REQUEST", leave.getId(),
                    hrId
            );

        } else {
            leave.setApprovalStage(ApprovalStage.REJECTED);
            leave.setStatus(LeaveStatus.REJECTED);

            // Notify employee
            notificationService.createAndSend(
                    leave.getEmployee(),
                    "Leave Rejected",
                    "Your leave request was rejected by HR. "
                            + "Reason: " + req.getRemarks(),
                    NotificationType.LEAVE_REJECTED,
                    "LEAVE_REQUEST", leave.getId());

            // Notify all admins/HR
            notifyAllAdmins(
                    "Leave Rejected",
                    leave.getEmployee().getFirstName() + " "
                            + leave.getEmployee().getLastName()
                            + "'s " + leave.getLeaveType()
                            + " leave has been rejected.",
                    NotificationType.LEAVE_REJECTED,
                    "LEAVE_REQUEST", leave.getId(),
                    hrId
            );
        }

        return toResponse(leaveRepo.save(leave));
    }

    @Transactional
    @CacheEvict(value = "dashboardData", allEntries = true)
    public LeaveDTOs.Response requestCancellation(
            Long leaveId, Long employeeId,
            LeaveDTOs.CancelRequest req) {

        LeaveRequest leave = findById(leaveId);
        Employee emp = leave.getEmployee();

        if (!emp.getId().equals(employeeId)) {
            throw new IllegalStateException(
                    "You can only cancel your own leaves");
        }

        if (leave.getStatus() == LeaveStatus.CANCELLED
                || leave.getStatus() == LeaveStatus.REJECTED
                || leave.getStatus() == LeaveStatus.CANCELLATION_PENDING) {
            throw new IllegalStateException(
                    "Leave already " + leave.getStatus());
        }

        if (leave.getStatus() == LeaveStatus.APPROVED) {
            leave.setStatus(LeaveStatus.CANCELLATION_PENDING);
            leave.setCancellationReason(
                    req != null ? req.getReason() : null);
            leave.setCancellationRequestedAt(LocalDateTime.now());

            // Notify employee
            notificationService.createAndSend(
                    emp,
                    "Cancellation Requested",
                    "Your cancellation request for "
                            + leave.getLeaveType()
                            + " leave is pending HR confirmation.",
                    NotificationType.LEAVE_CANCELLED,
                    "LEAVE_REQUEST", leave.getId());

            // Notify all admins/HR
            notifyAllAdmins(
                    "Leave Cancellation Request",
                    emp.getFirstName() + " " + emp.getLastName()
                            + " requested cancellation of "
                            + leave.getLeaveType() + " leave ("
                            + leave.getStartDate() + " to "
                            + leave.getEndDate() + ").",
                    NotificationType.LEAVE_CANCELLED,
                    "LEAVE_REQUEST", leave.getId(),
                    null
            );

            return toResponse(leaveRepo.save(leave));

        } else {
            leave.setStatus(LeaveStatus.CANCELLED);
            leave.setCancellationReason(
                    req != null ? req.getReason() : null);
            leave.setCancellationRequestedAt(LocalDateTime.now());
            leave.setCancellationActionAt(LocalDateTime.now());

            // Notify employee
            notificationService.createAndSend(
                    emp,
                    "Leave Cancelled",
                    "Your leave request has been cancelled.",
                    NotificationType.LEAVE_CANCELLED,
                    "LEAVE_REQUEST", leave.getId());

            // Notify all admins/HR
            notifyAllAdmins(
                    "Leave Cancelled",
                    emp.getFirstName() + " " + emp.getLastName()
                            + " cancelled their "
                            + leave.getLeaveType() + " leave request.",
                    NotificationType.LEAVE_CANCELLED,
                    "LEAVE_REQUEST", leave.getId(),
                    null
            );

            return toResponse(leaveRepo.save(leave));
        }
    }

    @Transactional
    @CacheEvict(value = "dashboardData", allEntries = true)
    public LeaveDTOs.Response cancelAction(
            Long leaveId, Long hrId,
            LeaveDTOs.CancelActionRequest req) {

        LeaveRequest leave = findById(leaveId);

        if (leave.getStatus() != LeaveStatus.CANCELLATION_PENDING) {
            throw new IllegalStateException(
                    "Leave is not awaiting cancellation confirmation");
        }

        Employee hr = employeeService.findById(hrId);
        leave.setCancellationRemarks(req.getRemarks());
        leave.setCancellationActionAt(LocalDateTime.now());

        if (Boolean.TRUE.equals(req.getApprove())) {
            leave.setStatus(LeaveStatus.CANCELLED);
            leaveBalanceService.restoreBalance(
                    leave.getEmployee(),
                    leave.getLeaveType(),
                    leave.getTotalDays());

            notificationService.createAndSend(
                    leave.getEmployee(),
                    "Cancellation Confirmed",
                    "HR confirmed your cancellation. "
                            + leave.getTotalDays()
                            + " day(s) restored to your balance.",
                    NotificationType.LEAVE_CANCELLED,
                    "LEAVE_REQUEST", leave.getId());

        } else {
            leave.setStatus(LeaveStatus.APPROVED);

            notificationService.createAndSend(
                    leave.getEmployee(),
                    "Cancellation Denied",
                    "HR denied your cancellation request. "
                            + "Reason: " + req.getRemarks(),
                    NotificationType.GENERAL,
                    "LEAVE_REQUEST", leave.getId());
        }

        return toResponse(leaveRepo.save(leave));
    }

    @Transactional(readOnly = true)
    public Page<LeaveDTOs.Response> getMyLeaves(
            Long employeeId, Pageable pageable) {
        Employee emp = employeeService.findById(employeeId);
        return leaveRepo.findByEmployee(emp, pageable)
                .map(this::toResponse);
    }

    @Transactional(readOnly = true)
    public Page<LeaveDTOs.Response> getAllLeaves(Pageable pageable) {
        return leaveRepo.findAll(pageable).map(this::toResponse);
    }

    @Transactional(readOnly = true)
    @Cacheable("dashboardData")
    public Page<LeaveDTOs.Response> getPendingLeaves(Pageable pageable) {
        return leaveRepo.findByApprovalStageIn(
                java.util.List.of(
                        ApprovalStage.MANAGER_PENDING,
                        ApprovalStage.HR_PENDING
                ), pageable
        ).map(this::toResponse);
    }

    @Transactional(readOnly = true)
    public Page<LeaveDTOs.Response> getPendingCancellations(
            Pageable pageable) {
        return leaveRepo.findByStatus(
                        LeaveStatus.CANCELLATION_PENDING, pageable)
                .map(this::toResponse);
    }

    private int calculateWorkingDays(
            LocalDate start, LocalDate end) {
        int days = 0;
        LocalDate date = start;
        while (!date.isAfter(end)) {
            if (date.getDayOfWeek() != DayOfWeek.SATURDAY
                    && date.getDayOfWeek() != DayOfWeek.SUNDAY) {
                days++;
            }
            date = date.plusDays(1);
        }
        return days;
    }

    private LeaveRequest findById(Long id) {
        return leaveRepo.findById(id)
                .orElseThrow(() ->
                        new NoSuchElementException("Leave not found: " + id));
    }

    private LeaveDTOs.Response toResponse(LeaveRequest l) {
        LeaveDTOs.Response r = new LeaveDTOs.Response();
        r.setId(l.getId());
        r.setEmployeeDbId(l.getEmployee().getId());
        r.setEmployeeName(l.getEmployee().getFirstName()
                + " " + l.getEmployee().getLastName());
        r.setEmployeeCode(l.getEmployee().getEmployeeId());
        r.setLeaveType(l.getLeaveType());
        r.setStartDate(l.getStartDate());
        r.setEndDate(l.getEndDate());
        r.setTotalDays(l.getTotalDays());
        r.setReason(l.getReason());
        r.setAttachmentUrl(l.getAttachmentUrl());
        r.setAttachmentFileName(l.getAttachmentFileName());
        r.setStatus(l.getStatus());
        r.setApprovalStage(l.getApprovalStage());
        if (l.getManager() != null) {
            r.setManagerName(l.getManager().getFirstName()
                    + " " + l.getManager().getLastName());
        }
        r.setManagerRemarks(l.getManagerRemarks());
        r.setManagerActionAt(l.getManagerActionAt());
        if (l.getApprovedBy() != null) {
            r.setApprovedByName(l.getApprovedBy().getFirstName()
                    + " " + l.getApprovedBy().getLastName());
        }
        r.setRemarks(l.getRemarks());
        r.setAppliedAt(l.getAppliedAt());
        r.setCancellationReason(l.getCancellationReason());
        r.setCancellationRequestedAt(l.getCancellationRequestedAt());
        r.setCancellationRemarks(l.getCancellationRemarks());
        r.setCancellationActionAt(l.getCancellationActionAt());
        return r;
    }
}