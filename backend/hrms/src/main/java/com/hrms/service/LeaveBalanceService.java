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
import java.util.Set;

@Service
@RequiredArgsConstructor
public class LeaveBalanceService {

    private final LeaveBalanceRepository balanceRepo;

    // ============================================================
    // LEAVE QUOTAS
    // ============================================================

    private static final Map<String, Double> DEFAULT_QUOTA = Map.of(
            "ANNUAL", 14.0,
            "SICK", 7.0,
            "CASUAL", 7.0,
            "PATERNITY", 30.0,
            "MATERNITY", 180.0);

    // ============================================================
    // ALL LEAVE TYPES
    // ============================================================

    private static final List<String> ALL_LEAVE_TYPES = List.of(
            "ANNUAL",
            "SICK",
            "CASUAL",
            "PATERNITY",
            "MATERNITY",
            "UNPAID");

    // ============================================================
    // ANNUAL LINKED LEAVE TYPES
    // Sick + Casual both consume Annual balance
    // ============================================================

    private static final Set<String> ANNUAL_LINKED_TYPES = Set.of("SICK", "CASUAL");

    private static final String ANNUAL = "ANNUAL";

    // ============================================================
    // GET OR CREATE BALANCE
    // ============================================================

    @Transactional
    public LeaveBalance getOrCreateBalance(
            Employee employee,
            String leaveType) {

        int year = Year.now().getValue();

        String type = leaveType.toUpperCase();

        return balanceRepo
                .findByEmployeeAndLeaveTypeAndYear(
                        employee,
                        type,
                        year)
                .orElseGet(() -> {

                    double quota;

                    /*
                     * UNPAID leave is unlimited.
                     *
                     * We store:
                     * totalAllotted = 0
                     * remaining = 0
                     *
                     * The frontend displays the limit as ∞.
                     */
                    if ("UNPAID".equals(type)) {
                        quota = 0.0;
                    } else {
                        quota = DEFAULT_QUOTA.getOrDefault(
                                type,
                                0.0);
                    }

                    LeaveBalance lb = LeaveBalance.builder()
                            .employee(employee)
                            .leaveType(type)
                            .year(year)
                            .totalAllotted(quota)
                            .used(0)
                            .remaining(quota)
                            .build();

                    return balanceRepo.save(lb);
                });
    }

    // ============================================================
    // CHECK SUFFICIENT BALANCE
    // ============================================================

    @Transactional
    public boolean hasSufficientBalance(
            Employee employee,
            String leaveType,
            int requestedDays) {

        String type = leaveType.toUpperCase();

        /*
         * UNPAID leave is unlimited.
         *
         * Therefore, don't check remaining balance.
         */
        if ("UNPAID".equals(type)) {
            return true;
        }

        // Check the selected leave balance
        LeaveBalance balance = getOrCreateBalance(employee, type);

        if (balance.getRemaining() < requestedDays) {
            return false;
        }

        /*
         * Sick and Casual also consume Annual balance.
         *
         * Example:
         *
         * Annual = 14
         * Sick = 7
         *
         * Employee requests 2 Sick days.
         *
         * We need:
         *
         * Sick remaining >= 2
         * Annual remaining >= 2
         */
        if (ANNUAL_LINKED_TYPES.contains(type)) {

            LeaveBalance annual = getOrCreateBalance(employee, ANNUAL);

            if (annual.getRemaining() < requestedDays) {
                return false;
            }
        }

        return true;
    }

    // ============================================================
    // DEDUCT BALANCE WHEN LEAVE IS APPROVED
    // ============================================================

    @Transactional
    public void deductBalance(
            Employee employee,
            String leaveType,
            int days) {

        String type = leaveType.toUpperCase();

        if (days <= 0) {
            throw new IllegalArgumentException(
                    "Leave days must be greater than zero.");
        }

        // ========================================================
        // UNPAID LEAVE
        // ========================================================

        /*
         * UNPAID has unlimited availability.
         *
         * Therefore:
         *
         * used -> INCREASE
         * remaining -> stays 0
         * total -> stays 0
         *
         * Example:
         *
         * Before:
         * used = 1
         *
         * Approve 3 more days:
         *
         * used = 4
         *
         * remaining = 0
         */

        if ("UNPAID".equals(type)) {

            LeaveBalance unpaid = getOrCreateBalance(
                    employee,
                    "UNPAID");

            unpaid.setUsed(
                    unpaid.getUsed() + days);

            // Unlimited leave has no remaining limit.
            unpaid.setRemaining(0);

            unpaid.setTotalAllotted(0);

            balanceRepo.save(unpaid);

            return;
        }

        // ========================================================
        // NORMAL LEAVE TYPES
        // ========================================================

        LeaveBalance balance = getOrCreateBalance(employee, type);

        if (balance.getRemaining() < days) {

            throw new IllegalStateException(
                    "Insufficient " +
                            type +
                            " leave balance.");
        }

        // Increase used days
        balance.setUsed(
                balance.getUsed() + days);

        // Decrease remaining days
        balance.setRemaining(
                Math.max(
                        0,
                        balance.getTotalAllotted()
                                - balance.getUsed()));

        balanceRepo.save(balance);

        // ========================================================
        // SICK / CASUAL -> ANNUAL
        // ========================================================

        /*
         * Sick and Casual leave also consume Annual.
         *
         * Example:
         *
         * Before:
         *
         * Annual = 14 / 14
         * Sick = 7 / 7
         *
         * Approve 1 Sick:
         *
         * Annual = 13 / 14
         * Sick = 6 / 7
         */

        if (ANNUAL_LINKED_TYPES.contains(type)) {

            LeaveBalance annual = getOrCreateBalance(
                    employee,
                    ANNUAL);

            if (annual.getRemaining() < days) {

                throw new IllegalStateException(
                        "Insufficient Annual leave balance.");
            }

            // Increase Annual used
            annual.setUsed(
                    annual.getUsed() + days);

            // Decrease Annual remaining
            annual.setRemaining(
                    Math.max(
                            0,
                            annual.getTotalAllotted()
                                    - annual.getUsed()));

            balanceRepo.save(annual);
        }
    }

    // ============================================================
    // RESTORE BALANCE WHEN APPROVED LEAVE IS CANCELLED
    // ============================================================

    @Transactional
    public void restoreBalance(
            Employee employee,
            String leaveType,
            int days) {

        String type = leaveType.toUpperCase();

        if (days <= 0) {
            return;
        }

        // ========================================================
        // UNPAID
        // ========================================================

        /*
         * For Unpaid:
         *
         * used must decrease when cancellation is approved.
         *
         * remaining stays 0.
         */

        if ("UNPAID".equals(type)) {

            LeaveBalance unpaid = getOrCreateBalance(
                    employee,
                    "UNPAID");

            unpaid.setUsed(
                    Math.max(
                            0,
                            unpaid.getUsed() - days));

            unpaid.setRemaining(0);
            unpaid.setTotalAllotted(0);

            balanceRepo.save(unpaid);

            return;
        }

        // ========================================================
        // NORMAL LEAVE
        // ========================================================

        LeaveBalance balance = getOrCreateBalance(
                employee,
                type);

        // Reduce used days
        balance.setUsed(
                Math.max(
                        0,
                        balance.getUsed() - days));

        // Increase remaining days
        balance.setRemaining(
                Math.min(
                        balance.getTotalAllotted(),
                        balance.getTotalAllotted()
                                - balance.getUsed()));

        balanceRepo.save(balance);

        // ========================================================
        // SICK / CASUAL -> RESTORE ANNUAL
        // ========================================================

        if (ANNUAL_LINKED_TYPES.contains(type)) {

            LeaveBalance annual = getOrCreateBalance(
                    employee,
                    ANNUAL);

            annual.setUsed(
                    Math.max(
                            0,
                            annual.getUsed() - days));

            annual.setRemaining(
                    Math.min(
                            annual.getTotalAllotted(),
                            annual.getTotalAllotted()
                                    - annual.getUsed()));

            balanceRepo.save(annual);
        }
    }

    // ============================================================
    // GET ALL BALANCES
    // ============================================================

    @Transactional
    public List<LeaveDTOs.BalanceResponse> getAllBalances(
            Employee employee) {

        return ALL_LEAVE_TYPES
                .stream()
                .map(type -> getOrCreateBalance(
                        employee,
                        type))
                .map(this::toResponse)
                .toList();
    }

    // ============================================================
    // ENTITY -> RESPONSE
    // ============================================================

    private LeaveDTOs.BalanceResponse toResponse(
            LeaveBalance lb) {

        LeaveDTOs.BalanceResponse r = new LeaveDTOs.BalanceResponse();

        r.setLeaveType(
                lb.getLeaveType());

        r.setYear(
                lb.getYear());

        r.setTotalAllotted(
                lb.getTotalAllotted());

        /*
         * IMPORTANT:
         *
         * For UNPAID:
         *
         * used = actual number of unpaid days taken
         * remaining = 0 internally
         *
         * Frontend displays:
         *
         * 1 / ∞
         * 2 / ∞
         * 5 / ∞
         */
        r.setUsed(
                lb.getUsed());

        if ("UNPAID".equalsIgnoreCase(
                lb.getLeaveType())) {

            r.setRemaining(0);

        } else {

            r.setRemaining(
                    lb.getRemaining());
        }

        return r;
    }
}