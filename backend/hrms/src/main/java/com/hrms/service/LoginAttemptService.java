package com.hrms.service;

import com.hrms.entity.Employee;
import com.hrms.repository.EmployeeRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class LoginAttemptService {

    private final EmployeeRepository employeeRepository;
    private final UserCacheService userCacheService;

    // ============================================================
    // HANDLE FAILED PASSWORD LOGIN
    // ============================================================

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void handleFailedLogin(String email) {

        String normalizedEmail = normalizeEmail(email);

        employeeRepository.findByEmail(normalizedEmail)
                .ifPresent(employee -> {

                    // ------------------------------------------------
                    // OTP ALREADY REQUIRED
                    // ------------------------------------------------

                    if (employee.isOtpLoginRequired()) {
                        return;
                    }

                    // ------------------------------------------------
                    // CURRENTLY LOCKED
                    // ------------------------------------------------

                    if (!employee.isAccountNonLocked()) {
                        return;
                    }

                    // ------------------------------------------------
                    // INCREMENT FAILED ATTEMPTS
                    // ------------------------------------------------

                    int attempts = employee.getFailedAttempts() + 1;

                    employee.setFailedAttempts(attempts);

                    // ------------------------------------------------
                    // MAX FAILED ATTEMPTS REACHED
                    // ------------------------------------------------

                    if (attempts >= Employee.MAX_FAILED_ATTEMPTS) {

                        int lockoutCount = employee.getLockoutCount() + 1;

                        employee.setLockoutCount(
                                lockoutCount);

                        // Start temporary lock
                        employee.setLockTime(
                                LocalDateTime.now());

                        // Start fresh attempt count
                        employee.setFailedAttempts(0);

                        // ------------------------------------------------
                        // SECOND LOCKOUT
                        // ------------------------------------------------

                        if (lockoutCount >= 2) {

                            employee.setOtpLoginRequired(true);
                        }
                    }

                    // ------------------------------------------------
                    // SAVE
                    // ------------------------------------------------

                    employeeRepository.saveAndFlush(employee);

                    // ------------------------------------------------
                    // CLEAR CACHE
                    // ------------------------------------------------

                    userCacheService.evict(
                            normalizedEmail);
                });
    }

    // ============================================================
    // CLEAR EXPIRED TEMPORARY LOCK
    // ============================================================

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void clearExpiredLock(String email) {

        String normalizedEmail = normalizeEmail(email);

        employeeRepository.findByEmail(normalizedEmail)
                .ifPresent(employee -> {

                    if (employee.getLockTime() == null) {
                        return;
                    }

                    // Lock is still active
                    if (!employee.isAccountNonLocked()) {
                        return;
                    }

                    // Lock expired
                    employee.setLockTime(null);

                    employee.setFailedAttempts(0);

                    /*
                     * IMPORTANT:
                     *
                     * Do NOT reset lockoutCount here.
                     */
                    employeeRepository.saveAndFlush(
                            employee);

                    userCacheService.evict(
                            normalizedEmail);
                });
    }

    // ============================================================
    // SUCCESSFUL PASSWORD LOGIN
    // ============================================================

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void resetFailedAttempts(String email) {

        String normalizedEmail = normalizeEmail(email);

        employeeRepository.findByEmail(normalizedEmail)
                .ifPresent(employee -> {

                    employee.setFailedAttempts(0);

                    employee.setLockTime(null);

                    /*
                     * IMPORTANT:
                     *
                     * lockoutCount is NOT reset.
                     *
                     * Example:
                     *
                     * first lock = 1
                     *
                     * successful password login
                     * still = 1
                     *
                     * next lock = 2
                     * OTP becomes required.
                     */

                    employeeRepository.saveAndFlush(
                            employee);

                    userCacheService.evict(
                            normalizedEmail);
                });
    }

    // ============================================================
    // SUCCESSFUL OTP LOGIN
    // ============================================================

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void resetAfterOtpLogin(String email) {

        String normalizedEmail = normalizeEmail(email);

        employeeRepository.findByEmail(normalizedEmail)
                .ifPresent(employee -> {

                    employee.setFailedAttempts(0);

                    employee.setLockoutCount(0);

                    employee.setLockTime(null);

                    employee.setOtpLoginRequired(false);

                    employeeRepository.saveAndFlush(
                            employee);

                    userCacheService.evict(
                            normalizedEmail);
                });
    }

    // ============================================================
    // NORMALIZE EMAIL
    // ============================================================

    private String normalizeEmail(String email) {

        if (email == null) {
            return "";
        }

        return email.trim().toLowerCase();
    }
}