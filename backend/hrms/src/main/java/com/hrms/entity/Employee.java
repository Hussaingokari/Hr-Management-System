package com.hrms.entity;

import com.hrms.enums.Role;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.DynamicUpdate;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Collection;
import java.util.List;

@Entity
@Table(name = "employees")
@DynamicUpdate
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Employee implements UserDetails {

    // ============================================================
    // LOGIN LOCK CONFIGURATION
    // ============================================================

    /**
     * Each temporary lock lasts for 2 minutes.
     */
    public static final int LOCK_DURATION_MINUTES = 2;

    /**
     * Two incorrect passwords cause a temporary lock.
     */
    public static final int MAX_FAILED_ATTEMPTS = 2;

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
    // LOGIN SECURITY
    // ============================================================

    /**
     * Number of consecutive failed password attempts
     *
     * 0 = no failed attempts
     * 1 = one failed attempt
     * 2 = temporary lock is created
     */
    @Builder.Default
    @Column(name = "failed_attempts", nullable = false)
    private int failedAttempts = 0;

    /**
     * Number of temporary lockouts.
     *
     * 0 = never locked
     * 1 = first lock
     * 2 = second lock -> OTP required
     */
    @Builder.Default
    @Column(name = "lockout_count", nullable = false)
    private int lockoutCount = 0;

    /**
     * Time at which the current temporary lock started.
     */
    @Column(name = "lock_time")
    private LocalDateTime lockTime;

    /**
     * True after the second temporary lockout.
     *
     * When true, normal password login is disabled
     * and OTP login is required.
     */
    @Builder.Default
    @Column(name = "otp_login_required", nullable = false)
    private boolean otpLoginRequired = false;

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
     * true = account is NOT currently temporarily locked
     * false = account IS currently temporarily locked
     */
    @Override
    public boolean isAccountNonLocked() {

        if (lockTime == null) {
            return true;
        }

        return !LocalDateTime.now()
                .isBefore(
                        lockTime.plusMinutes(
                                LOCK_DURATION_MINUTES));
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