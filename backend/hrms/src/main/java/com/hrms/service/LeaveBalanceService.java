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

    // Default annual quotas — adjust per company policy
    private static final Map<String, Double> DEFAULT_QUOTA = Map.of(
            "ANNUAL", 18.0,
            "SICK", 12.0,
            "CASUAL", 7.0,
            "MATERNITY", 180.0,
            "PATERNITY", 15.0,
            "UNPAID", 15.0);

    // Every leave type an employee should see a balance card for, in display order
    private static final List<String> ALL_LEAVE_TYPES = List.of(
            "ANNUAL", "SICK", "CASUAL", "PATERNITY", "MATERNITY", "UNPAID");

    @Transactional
    public LeaveBalance getOrCreateBalance(Employee employee, String leaveType) {
        int year = Year.now().getValue();
        return balanceRepo.findByEmployeeAndLeaveTypeAndYear(employee, leaveType, year)
                .orElseGet(() -> {
                    LeaveBalance lb = LeaveBalance.builder()
                            .employee(employee)
                            .leaveType(leaveType)
                            .year(year)
                            .totalAllotted(DEFAULT_QUOTA.getOrDefault(leaveType, 12.0))
                            .used(0)
                            .remaining(DEFAULT_QUOTA.getOrDefault(leaveType, 12.0))
                            .build();
                    return balanceRepo.save(lb);
                });
    }

    public boolean hasSufficientBalance(Employee employee, String leaveType, int requestedDays) {
        LeaveBalance balance = getOrCreateBalance(employee, leaveType);
        return balance.getRemaining() >= requestedDays;
    }

    @Transactional
    public void deductBalance(Employee employee, String leaveType, int days) {
        LeaveBalance balance = getOrCreateBalance(employee, leaveType);
        balance.setUsed(balance.getUsed() + days);
        balanceRepo.save(balance); // remaining auto-recalculated via @PreUpdate
    }

    @Transactional
    public void restoreBalance(Employee employee, String leaveType, int days) {
        LeaveBalance balance = getOrCreateBalance(employee, leaveType);
        balance.setUsed(Math.max(0, balance.getUsed() - days));
        balanceRepo.save(balance);
    }

    /**
     * Returns a balance card for every leave type — ANNUAL, SICK, CASUAL,
     * PATERNITY, MATERNITY, UNPAID — creating any that don't exist yet for
     * this employee/year so the frontend always gets all 6, not just the
     * ones the employee has already applied for.
     */
    @Transactional
    public List<LeaveDTOs.BalanceResponse> getAllBalances(Employee employee) {
        return ALL_LEAVE_TYPES.stream()
                .map(type -> getOrCreateBalance(employee, type))
                .map(this::toResponse)
                .toList();
    }

    private LeaveDTOs.BalanceResponse toResponse(LeaveBalance lb) {
        LeaveDTOs.BalanceResponse r = new LeaveDTOs.BalanceResponse();
        r.setLeaveType(lb.getLeaveType());
        r.setYear(lb.getYear());
        r.setTotalAllotted(lb.getTotalAllotted());
        r.setUsed(lb.getUsed());
        r.setRemaining(lb.getRemaining());
        return r;
    }
}