package com.hrms.service;

import com.hrms.entity.OtpStore;
import com.hrms.repository.OtpStoreRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
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

        @Value("${app.otp.expiry:10}")
        private long otpExpiryMinutes;

        public static final String LOGIN_OTP = "LOGIN";

        public static final String PASSWORD_RESET_OTP = "PASSWORD_RESET";

        // ============================================================
        // LOGIN OTP
        // ============================================================

        @Transactional
        public String generateLoginOtp(String email) {

                return generateAndSaveOtp(
                                email,
                                LOGIN_OTP);
        }

        // ============================================================
        // PASSWORD RESET OTP
        // ============================================================

        @Transactional
        public String generatePasswordResetOtp(String email) {

                return generateAndSaveOtp(
                                email,
                                PASSWORD_RESET_OTP);
        }

        // ============================================================
        // COMMON GENERATION
        // ============================================================

        private String generateAndSaveOtp(
                        String email,
                        String otpType) {

                String normalizedEmail = normalizeEmail(email);

                otpStoreRepository.deleteByEmailAndOtpType(
                                normalizedEmail,
                                otpType);

                String otp = String.format(
                                "%06d",
                                secureRandom.nextInt(1_000_000));

                OtpStore otpStore = new OtpStore(
                                normalizedEmail,
                                otp,
                                LocalDateTime.now()
                                                .plusMinutes(otpExpiryMinutes),
                                otpType);

                otpStoreRepository.saveAndFlush(otpStore);

                log.info(
                                "{} OTP generated successfully",
                                otpType);

                return otp;
        }

        // ============================================================
        // VALIDATE LOGIN OTP
        // ============================================================

        @Transactional
        public boolean validateLoginOtp(
                        String email,
                        String otp) {

                return validateOtp(
                                email,
                                otp,
                                LOGIN_OTP);
        }

        // ============================================================
        // VALIDATE PASSWORD RESET OTP
        // ============================================================

        @Transactional
        public boolean validatePasswordResetOtp(
                        String email,
                        String otp) {

                return validateOtp(
                                email,
                                otp,
                                PASSWORD_RESET_OTP);
        }

        // ============================================================
        // COMMON VALIDATION
        // ============================================================

        private boolean validateOtp(
                        String email,
                        String otp,
                        String otpType) {

                String normalizedEmail = normalizeEmail(email);

                if (otp == null || otp.isBlank()) {
                        return false;
                }

                String normalizedOtp = otp.trim();

                if (!normalizedOtp.matches("\\d{6}")) {
                        return false;
                }

                Optional<OtpStore> otpStore = otpStoreRepository.findLatestActiveOtp(
                                normalizedEmail,
                                otpType,
                                LocalDateTime.now());

                if (otpStore.isEmpty()) {
                        log.warn(
                                        "No active {} OTP found",
                                        otpType);

                        return false;
                }

                OtpStore store = otpStore.get();

                if (store.isExpired()) {
                        return false;
                }

                if (!store.getOtp().equals(normalizedOtp)) {
                        log.warn(
                                        "Invalid {} OTP",
                                        otpType);

                        return false;
                }

                // One-time use
                store.setUsed(true);

                otpStoreRepository.saveAndFlush(store);

                log.info(
                                "{} OTP verified successfully",
                                otpType);

                return true;
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