package com.hrms.service;

import com.hrms.entity.Employee;
import com.hrms.enums.Role;
import com.hrms.repository.EmployeeRepository;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
@Slf4j
public class LoginAttemptService {

    private final EmployeeRepository employeeRepository;
    private final UserCacheService userCacheService;

    // ============================================================
    // HANDLE FAILED PASSWORD LOGIN
    // ============================================================

    /**
     * Handles one failed password login attempt.
     *
     * EMPLOYEE FLOW:
     *
     * 1st wrong password
     * -> failedAttempts = 1
     *
     * 2nd wrong password
     * -> failedAttempts = 2
     * -> lockoutCount = 1
     * -> temporary 2-minute lock
     *
     * After first lock expires:
     *
     * 1st wrong password
     * -> failedAttempts = 1
     *
     * 2nd wrong password
     * -> failedAttempts = 2
     * -> lockoutCount = 2
     * -> temporary lock
     * -> OTP required
     *
     * After successful OTP:
     * -> security state completely resets.
     *
     * IMPORTANT:
     * OTP requirement is ONLY enabled for EMPLOYEE accounts.
     *
     * ADMIN/HR:
     * -> can be temporarily locked
     * -> never receive otpLoginRequired=true from this service
     */

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void handleFailedLogin(String email) {

        String normalizedEmail = normalizeEmail(email);

        if (normalizedEmail.isEmpty()) {
            return;
        }

        employeeRepository.findByEmail(normalizedEmail)
                .ifPresent(employee -> {

                    // ====================================================
                    // OTP ALREADY REQUIRED
                    // ====================================================

                    /*
                     * Once an employee reaches the second lockout,
                     * password login should not increase the attempts.
                     *
                     * The employee must complete OTP verification.
                     */

                    if (employee.getRole() == Role.EMPLOYEE
                            && employee.isOtpLoginRequired()) {

                        log.debug(
                                "OTP already required for employee: {}",
                                normalizedEmail);

                        return;
                    }

                    // ====================================================
                    // CURRENTLY LOCKED
                    // ====================================================

                    /*
                     * Do not increase failed attempts while the
                     * account is already temporarily locked.
                     */

                    if (!employee.isAccountNonLocked()) {

                        log.debug(
                                "Account is already temporarily locked: {}",
                                normalizedEmail);

                        return;
                    }

                    // ====================================================
                    // INCREMENT FAILED ATTEMPTS
                    // ====================================================

                    int currentAttempts = employee.getFailedAttempts();

                    int attempts = currentAttempts + 1;

                    employee.setFailedAttempts(attempts);

                    log.debug(
                            "Failed login attempt {} for {}",
                            attempts,
                            normalizedEmail);

                    // ====================================================
                    // MAX FAILED ATTEMPTS REACHED
                    // ====================================================

                    if (attempts >= Employee.MAX_FAILED_ATTEMPTS) {

                        // ------------------------------------------------
                        // INCREMENT LOCKOUT COUNT
                        // ------------------------------------------------

                        int currentLockoutCount = employee.getLockoutCount();

                        int lockoutCount = currentLockoutCount + 1;

                        employee.setLockoutCount(
                                lockoutCount);

                        // ------------------------------------------------
                        // START TEMPORARY LOCK
                        // ------------------------------------------------

                        employee.setLockTime(
                                LocalDateTime.now());

                        // ------------------------------------------------
                        // RESET CURRENT ATTEMPTS
                        // ------------------------------------------------

                        employee.setFailedAttempts(0);

                        log.info(
                                "Temporary lockout #{} created for {}",
                                lockoutCount,
                                normalizedEmail);

                        // ------------------------------------------------
                        // SECOND LOCKOUT -> OTP ONLY FOR EMPLOYEE
                        // ------------------------------------------------

                        if (employee.getRole() == Role.EMPLOYEE
                                && lockoutCount >= 2) {

                            employee.setOtpLoginRequired(true);

                            log.info(
                                    "OTP login required for employee after second lockout: {}",
                                    normalizedEmail);
                        }
                    }

                    // ====================================================
                    // SAVE DATABASE STATE
                    // ====================================================

                    employeeRepository.saveAndFlush(
                            employee);

                    // ====================================================
                    // CLEAR CACHE
                    // ====================================================

                    userCacheService.evict(
                            normalizedEmail);
                });
    }

    // ============================================================
    // CLEAR EXPIRED TEMPORARY LOCK
    // ============================================================

    /**
     * Clears the temporary lock after the lock duration expires.
     *
     * IMPORTANT:
     *
     * lockoutCount is NOT reset.
     *
     * Example:
     *
     * First lock:
     * lockoutCount = 1
     *
     * Lock expires:
     * lockoutCount remains 1
     *
     * Second lock:
     * lockoutCount = 2
     *
     * Employee:
     * otpLoginRequired = true
     */

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void clearExpiredLock(String email) {

        String normalizedEmail = normalizeEmail(email);

        if (normalizedEmail.isEmpty()) {
            return;
        }

        employeeRepository.findByEmail(normalizedEmail)
                .ifPresent(employee -> {

                    // ====================================================
                    // NO LOCK EXISTS
                    // ====================================================

                    if (employee.getLockTime() == null) {
                        return;
                    }

                    // ====================================================
                    // LOCK STILL ACTIVE
                    // ====================================================

                    if (!employee.isAccountNonLocked()) {

                        return;
                    }

                    // ====================================================
                    // LOCK EXPIRED
                    // ====================================================

                    employee.setLockTime(null);

                    employee.setFailedAttempts(0);

                    /*
                     * IMPORTANT:
                     *
                     * Do NOT reset lockoutCount.
                     *
                     * First lock = 1
                     * Second lock = 2
                     */

                    employeeRepository.saveAndFlush(
                            employee);

                    userCacheService.evict(
                            normalizedEmail);

                    log.info(
                            "Temporary lock expired for: {}",
                            normalizedEmail);
                });
    }

    // ============================================================
    // SUCCESSFUL PASSWORD LOGIN
    // ============================================================

    /**
     * Called after successful password authentication.
     *
     * Resets:
     * failedAttempts
     * lockTime
     *
     * Does NOT reset:
     * lockoutCount
     * otpLoginRequired
     */

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void resetFailedAttempts(String email) {

        String normalizedEmail = normalizeEmail(email);

        if (normalizedEmail.isEmpty()) {
            return;
        }

        employeeRepository.findByEmail(normalizedEmail)
                .ifPresent(employee -> {

                    // ====================================================
                    // RESET CURRENT FAILED ATTEMPTS
                    // ====================================================

                    employee.setFailedAttempts(0);

                    // ====================================================
                    // REMOVE TEMPORARY LOCK
                    // ====================================================

                    employee.setLockTime(null);

                    /*
                     * IMPORTANT:
                     *
                     * lockoutCount is intentionally NOT reset.
                     *
                     * Example:
                     *
                     * First lock = 1
                     *
                     * Successful normal login
                     * lockoutCount = 1
                     *
                     * Next lock = 2
                     *
                     * Employee then requires OTP.
                     */

                    employeeRepository.saveAndFlush(
                            employee);

                    userCacheService.evict(
                            normalizedEmail);

                    log.debug(
                            "Failed-attempt state reset after successful password login: {}",
                            normalizedEmail);
                });
    }

    // ============================================================
    // SUCCESSFUL OTP LOGIN
    // ============================================================

    /**
     * Called after successful login OTP verification.
     *
     * This completely resets the login security state.
     *
     * Resets:
     *
     * failedAttempts = 0
     * lockoutCount = 0
     * lockTime = null
     * otpLoginRequired = false
     */

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void resetAfterOtpLogin(String email) {

        String normalizedEmail = normalizeEmail(email);

        if (normalizedEmail.isEmpty()) {
            return;
        }

        employeeRepository.findByEmail(normalizedEmail)
                .ifPresent(employee -> {

                    // ====================================================
                    // RESET FAILED ATTEMPTS
                    // ====================================================

                    employee.setFailedAttempts(0);

                    // ====================================================
                    // RESET LOCKOUT HISTORY
                    // ====================================================

                    employee.setLockoutCount(0);

                    // ====================================================
                    // REMOVE TEMPORARY LOCK
                    // ====================================================

                    employee.setLockTime(null);

                    // ====================================================
                    // REMOVE OTP REQUIREMENT
                    // ====================================================

                    employee.setOtpLoginRequired(false);

                    // ====================================================
                    // SAVE
                    // ====================================================

                    employeeRepository.saveAndFlush(
                            employee);

                    // ====================================================
                    // CLEAR CACHE
                    // ====================================================

                    userCacheService.evict(
                            normalizedEmail);

                    log.info(
                            "Login security state completely reset after successful OTP login: {}",
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

        return email
                .trim()
                .toLowerCase();
    }
}