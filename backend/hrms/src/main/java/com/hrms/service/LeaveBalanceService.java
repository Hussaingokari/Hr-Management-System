package com.hrms.service;

import com.hrms.dto.LeaveDTOs;
import com.hrms.entity.Employee;
import com.hrms.entity.LeaveBalance;
import com.hrms.repository.LeaveBalanceRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Year;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class LeaveBalanceService {

    private final LeaveBalanceRepository balanceRepo;

    // Leave quotas as per company policy
    private static final Map<String, Double> DEFAULT_QUOTA = Map.of(
            "ANNUAL", 14.0,
            "SICK", 7.0,
            "CASUAL", 7.0,
            "PATERNITY", 30.0,
            "MATERNITY", 180.0);

    // Leave types shown to employees
    private static final List<String> ALL_LEAVE_TYPES = List.of(
            "ANNUAL",
            "SICK",
            "CASUAL",
            "PATERNITY",
            "MATERNITY",
            "UNPAID");

    /**
     * Get existing balance or create a new balance.
     */
    @Transactional
    public LeaveBalance getOrCreateBalance(
            Employee employee,
            String leaveType) {

        int year = Year.now().getValue();

        return balanceRepo
                .findByEmployeeAndLeaveTypeAndYear(
                        employee,
                        leaveType.toUpperCase(),
                        year)
                .orElseGet(() -> {

                    double quota;

                    /*
                     * Unpaid leave is unlimited.
                     * We don't need a real quota for it because
                     * hasSufficientBalance() handles it separately.
                     */
                    if ("UNPAID".equalsIgnoreCase(leaveType)) {
                        quota = 0.0;
                    } else {
                        quota = DEFAULT_QUOTA.getOrDefault(
                                leaveType.toUpperCase(),
                                0.0);
                    }

                    LeaveBalance lb = LeaveBalance.builder()
                            .employee(employee)
                            .leaveType(leaveType.toUpperCase())
                            .year(year)
                            .totalAllotted(quota)
                            .used(0)
                            .remaining(quota)
                            .build();

                    return balanceRepo.save(lb);
                });
    }

    /**
     * Check whether employee has enough balance.
     */
    @Transactional
    public boolean hasSufficientBalance(
            Employee employee,
            String leaveType,
            int requestedDays) {

        /*
         * UNPAID leave is unlimited.
         */
        if ("UNPAID".equalsIgnoreCase(leaveType)) {
            return true;
        }

        LeaveBalance balance = getOrCreateBalance(employee, leaveType);

        return balance.getRemaining() >= requestedDays;
    }

    /**
     * Deduct balance when leave is approved.
     */
    @Transactional
    public void deductBalance(
            Employee employee,
            String leaveType,
            int days) {

        /*
         * Unpaid leave does not consume a balance.
         */
        if ("UNPAID".equalsIgnoreCase(leaveType)) {
            return;
        }

        LeaveBalance balance = getOrCreateBalance(employee, leaveType);

        if (balance.getRemaining() < days) {
            throw new IllegalStateException(
                    "Insufficient " + leaveType +
                            " leave balance.");
        }

        balance.setUsed(
                balance.getUsed() + days);

        balanceRepo.save(balance);
    }

    /**
     * Restore balance when an approved leave is cancelled.
     */
    @Transactional
    public void restoreBalance(
            Employee employee,
            String leaveType,
            int days) {

        /*
         * Unpaid leave has no balance to restore.
         */
        if ("UNPAID".equalsIgnoreCase(leaveType)) {
            return;
        }

        LeaveBalance balance = getOrCreateBalance(employee, leaveType);

        balance.setUsed(
                Math.max(
                        0,
                        balance.getUsed() - days));

        balanceRepo.save(balance);
    }

    /**
     * Return all leave balances.
     */
    @Transactional
    public List<LeaveDTOs.BalanceResponse> getAllBalances(
            Employee employee) {

        return ALL_LEAVE_TYPES.stream()
                .map(type -> getOrCreateBalance(employee, type))
                .map(this::toResponse)
                .toList();
    }

    /**
     * Convert entity to response.
     */
    private LeaveDTOs.BalanceResponse toResponse(
            LeaveBalance lb) {

        LeaveDTOs.BalanceResponse r = new LeaveDTOs.BalanceResponse();

        r.setLeaveType(lb.getLeaveType());
        r.setYear(lb.getYear());
        r.setTotalAllotted(lb.getTotalAllotted());
        r.setUsed(lb.getUsed());

        /*
         * For unpaid leave, frontend handles the
         * unlimited balance as ∞.
         */
        if ("UNPAID".equalsIgnoreCase(lb.getLeaveType())) {
            r.setRemaining(0);
        } else {
            r.setRemaining(lb.getRemaining());
        }

        return r;
    }
}