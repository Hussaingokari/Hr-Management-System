package com.hrms.repository;

import com.hrms.entity.OtpStore;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Optional;

public interface OtpStoreRepository extends JpaRepository<OtpStore, Long> {

    @Query("""
        SELECT o
        FROM OtpStore o
        WHERE o.email = :email
          AND o.used = false
          AND o.expiresAt > :now
        ORDER BY o.id DESC
        """)
    Optional<OtpStore> findLatestActiveOtp(
            String email,
            LocalDateTime now);

    @Modifying
    @Transactional
    @Query("DELETE FROM OtpStore o WHERE o.email = :email")
    void deleteByEmail(String email);
}