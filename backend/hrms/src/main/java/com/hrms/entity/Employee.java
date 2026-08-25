package com.hrms.entity;

import com.hrms.enums.Role;
import jakarta.persistence.*;
import lombok.*;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.math.BigDecimal;
import java.time.Duration;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Collection;
import java.util.List;

@Entity
@Table(name = "employees")
@org.hibernate.annotations.DynamicUpdate
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Employee implements UserDetails {

    // ============================================================
    // LOGIN LOCKOUT CONFIGURATION
    // ============================================================

    /**
     * Account remains locked for this many minutes.
     */
    public static final int LOCK_DURATION_MINUTES = 2;

    // ============================================================
    // BASIC EMPLOYEE INFORMATION
    // ============================================================

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false)
    private String employeeId;

    @Column(nullable = false)
    private String firstName;

    @Column(nullable = false)
    private String lastName;

    @Column(unique = true, nullable = false)
    private String email;

    @Column(nullable = false)
    private String password;

    private String phone;

    private String department;

    private String designation;

    private String profilePicture;

    @Column(precision = 12, scale = 2)
    private BigDecimal basicSalary;

    private LocalDate dateOfJoining;

    private LocalDate dateOfBirth;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Role role;

    // ============================================================
    // ACCOUNT STATUS
    // ============================================================

    @Builder.Default
    @Column(nullable = false)
    private boolean active = true;

    private String azureOid;

    // ============================================================
    // LOGIN LOCKOUT TRACKING
    // ============================================================

    @Builder.Default
    @Column(name = "failed_attempts", nullable = false)
    private int failedAttempts = 0;

    @Column(name = "lock_time")
    private LocalDateTime lockTime;

    // ============================================================
    // AUDIT
    // ============================================================

    @Column(updatable = false)
    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {

        LocalDateTime now = LocalDateTime.now();

        createdAt = now;
        updatedAt = now;
    }

    @PreUpdate
    protected void onUpdate() {

        updatedAt = LocalDateTime.now();
    }

    // ============================================================
    // SPRING SECURITY
    // ============================================================

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {

        return List.of(
                new SimpleGrantedAuthority(
                        "ROLE_" + role.name()));
    }

    @Override
    public String getPassword() {

        return password;
    }

    @Override
    public String getUsername() {

        return email;
    }

    @Override
    public boolean isAccountNonExpired() {

        return true;
    }

    /**
     * IMPORTANT:
     *
     * Spring Security expects:
     *
     * true = account is NOT locked
     * false = account IS locked
     *
     * If lock_time is NULL:
     * account is unlocked.
     *
     * If lock_time exists but the lock duration has expired:
     * account is unlocked.
     *
     * Otherwise:
     * account is locked.
     */
    @Override
    public boolean isAccountNonLocked() {

        if (lockTime == null) {
            return true;
        }

        long elapsedSeconds = Duration.between(
                lockTime,
                LocalDateTime.now()).getSeconds();

        long lockDurationSeconds = LOCK_DURATION_MINUTES * 60L;

        return elapsedSeconds >= lockDurationSeconds;
    }

    @Override
    public boolean isCredentialsNonExpired() {

        return true;
    }

    @Override
    public boolean isEnabled() {

        return active;
    }
}