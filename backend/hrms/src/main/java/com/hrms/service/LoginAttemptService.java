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

    // ============================================================
    // LOGIN LOCKOUT CONFIGURATION
    // ============================================================

    // Account will be locked after 5 consecutive failed attempts.
    private static final int MAX_FAILED_ATTEMPTS = 2;

    private final EmployeeRepository employeeRepository;
    private final UserCacheService userCacheService;

    // ============================================================
    // HANDLE FAILED LOGIN
    // ============================================================

    /**
     * Records one failed login attempt.
     *
     * REQUIRES_NEW ensures that this database update is committed
     * independently of the login transaction.
     */
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void handleFailedLogin(String email) {

        employeeRepository.findByEmail(email).ifPresent(employee -> {

            // --------------------------------------------------------
            // Increment failed attempts
            // --------------------------------------------------------

            int attempts = employee.getFailedAttempts() + 1;

            employee.setFailedAttempts(attempts);

            // --------------------------------------------------------
            // Lock account after maximum attempts
            // --------------------------------------------------------

            if (attempts >= MAX_FAILED_ATTEMPTS) {

                employee.setLockTime(LocalDateTime.now());
            }

            // --------------------------------------------------------
            // Force database update immediately
            // --------------------------------------------------------

            employeeRepository.saveAndFlush(employee);

            // --------------------------------------------------------
            // Remove stale cached employee
            // --------------------------------------------------------

            userCacheService.evict(employee.getEmail());
        });
    }

    // ============================================================
    // RESET FAILED LOGIN ATTEMPTS
    // ============================================================

    /**
     * Resets the failed-attempt counter after a successful login.
     */
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void resetFailedAttempts(String email) {

        employeeRepository.findByEmail(email).ifPresent(employee -> {

            // Nothing to reset
            if (employee.getFailedAttempts() == 0
                    && employee.getLockTime() == null) {

                return;
            }

            // --------------------------------------------------------
            // Reset lockout information
            // --------------------------------------------------------

            employee.setFailedAttempts(0);
            employee.setLockTime(null);

            // --------------------------------------------------------
            // Save immediately
            // --------------------------------------------------------

            employeeRepository.saveAndFlush(employee);

            // --------------------------------------------------------
            // Remove stale cache
            // --------------------------------------------------------

            userCacheService.evict(employee.getEmail());
        });
    }
}