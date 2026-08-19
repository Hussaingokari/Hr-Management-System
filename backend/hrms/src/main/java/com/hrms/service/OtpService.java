package com.hrms.service;

import com.hrms.entity.OtpStore;
import com.hrms.repository.OtpStoreRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Slf4j
public class OtpService {

    private final OtpStoreRepository otpStoreRepository;

    private final SecureRandom secureRandom = new SecureRandom();

    @Transactional
    public String generateAndSaveOtp(String email) {

        // Delete previous OTP for this email
        otpStoreRepository.deleteByEmail(email);

        // Generate a secure 6-digit OTP
        String otp = String.format(
                "%06d",
                secureRandom.nextInt(1_000_000)
        );

        // OTP expires after 10 minutes
        OtpStore otpStore = new OtpStore(
                email,
                otp,
                LocalDateTime.now().plusMinutes(10)
        );

        otpStoreRepository.save(otpStore);

        // Do not log the actual OTP
        log.info("OTP generated for email: {}", email);

        return otp;
    }

    @Transactional
    public boolean validateOtp(String email, String otp) {

        Optional<OtpStore> otpStore =
                otpStoreRepository.findLatestActiveOtp(
                        email,
                        LocalDateTime.now()
                );

        if (otpStore.isEmpty()) {

            log.warn(
                    "No active OTP found for email: {}",
                    email
            );

            return false;
        }

        OtpStore store = otpStore.get();

        // Additional expiration check
        if (store.isExpired()) {

            log.warn(
                    "OTP expired for email: {}",
                    email
            );

            return false;
        }

        // Check OTP value
        if (!store.getOtp().equals(otp)) {

            log.warn(
                    "Invalid OTP for email: {}",
                    email
            );

            return false;
        }

        // Mark OTP as used
        store.setUsed(true);

        otpStoreRepository.save(store);

        return true;
    }
}