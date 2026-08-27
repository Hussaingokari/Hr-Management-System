package com.hrms.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "otp_store")
@Data
@NoArgsConstructor
public class OtpStore {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 255)
    private String email;

    @Column(nullable = false, length = 6)
    private String otp;

    @Column(nullable = false)
    private LocalDateTime expiresAt;

    @Column(nullable = false)
    private boolean used = false;

    /**
     * LOGIN
     * PASSWORD_RESET
     */
    @Column(nullable = false, length = 30)
    private String otpType;

    public OtpStore(
            String email,
            String otp,
            LocalDateTime expiresAt,
            String otpType) {

        this.email = email;
        this.otp = otp;
        this.expiresAt = expiresAt;
        this.otpType = otpType;
        this.used = false;
    }

    public boolean isExpired() {
        return LocalDateTime.now().isAfter(expiresAt);
    }
}