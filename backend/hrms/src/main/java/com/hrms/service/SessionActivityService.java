package com.hrms.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class SessionActivityService {

    private final Map<String, Long> lastActivity = new ConcurrentHashMap<>();

    @Value("${app.session.inactivity-timeout:300000}")
    private long inactivityTimeout;

    /**
     * Starts or resets the activity timer for a user.
     */
    public void recordActivity(String email) {
        if (email == null || email.isBlank()) {
            return;
        }

        lastActivity.put(normalizeEmail(email), System.currentTimeMillis());
    }

    /**
     * Checks whether the user has been inactive for longer
     * than the configured timeout.
     */
    public boolean isSessionExpired(String email) {
        if (email == null || email.isBlank()) {
            return true;
        }

        String key = normalizeEmail(email);
        Long lastActiveTime = lastActivity.get(key);

        // No activity record means the session has not been initialized.
        if (lastActiveTime == null) {
            return true;
        }

        long inactiveTime = System.currentTimeMillis() - lastActiveTime;

        return inactiveTime >= inactivityTimeout;
    }

    /**
     * Returns the remaining inactivity time in milliseconds.
     */
    public long getRemainingTime(String email) {
        if (email == null || email.isBlank()) {
            return 0;
        }

        Long lastActiveTime = lastActivity.get(normalizeEmail(email));

        if (lastActiveTime == null) {
            return 0;
        }

        long remaining = inactivityTimeout
                - (System.currentTimeMillis() - lastActiveTime);

        return Math.max(remaining, 0);
    }

    /**
     * Removes the user's activity information.
     */
    public void removeActivity(String email) {
        if (email == null || email.isBlank()) {
            return;
        }

        lastActivity.remove(normalizeEmail(email));
    }

    /**
     * Clears all tracked activity.
     */
    public void clearAll() {
        lastActivity.clear();
    }

    private String normalizeEmail(String email) {
        return email.toLowerCase().trim();
    }
}