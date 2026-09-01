package com.hrms.service;

import com.hrms.dto.DocumentUploadRequest;
import com.hrms.dto.OnboardingDocumentAdminResponse;
import com.hrms.entity.Employee;
import com.hrms.entity.Notification.NotificationType;
import com.hrms.entity.Onboarding;
import com.hrms.entity.OnboardingDocument;
import com.hrms.enums.DocumentStatus;
import com.hrms.repository.EmployeeRepository;
import com.hrms.repository.OnboardingDocumentRepository;
import com.hrms.repository.OnboardingRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class OnboardingDocumentService {

        private final OnboardingDocumentRepository documentRepository;
        private final OnboardingRepository onboardingRepository;
        private final EmployeeRepository employeeRepository;
        private final NotificationService notificationService;

        // ========================================================================
        // EMPLOYEE UPLOAD / RE-UPLOAD DOCUMENT
        // ========================================================================

        @Transactional
        public OnboardingDocument registerDocument(
                        DocumentUploadRequest request) {

                Onboarding onboarding = onboardingRepository.findById(
                                request.getOnboardingId()).orElseThrow(
                                                () -> new IllegalArgumentException(
                                                                "Onboarding not found: "
                                                                                + request.getOnboardingId()));

                /*
                 * IMPORTANT:
                 *
                 * We intentionally find the existing document using:
                 *
                 * onboardingId + documentKey
                 *
                 * This means a re-upload updates the existing document
                 * instead of creating another document record.
                 */

                OnboardingDocument document = documentRepository
                                .findFirstByOnboardingIdAndDocumentKey(
                                                request.getOnboardingId(),
                                                request.getDocumentKey())
                                .orElse(
                                                OnboardingDocument.builder()
                                                                .onboarding(onboarding)
                                                                .documentKey(
                                                                                request.getDocumentKey())
                                                                .build());

                // ------------------------------------------------------------
                // Replace file with the newly uploaded document
                // ------------------------------------------------------------

                document.setFileName(
                                request.getFileName());

                document.setFileUrl(
                                request.getFileUrl());

                /*
                 * Every new upload, including a re-upload,
                 * must go back to HR review.
                 */

                document.setStatus(
                                DocumentStatus.UNDER_REVIEW);

                document.setUploadedAt(
                                LocalDateTime.now());

                /*
                 * Clear previous review information because this is
                 * now a new version waiting for HR review.
                 */

                document.setRejectionRemarks(
                                null);

                document.setReviewedAt(
                                null);

                document.setReviewedByHr(
                                null);

                OnboardingDocument saved = documentRepository.save(document);

                // ------------------------------------------------------------
                // Notify Admins / HR
                // ------------------------------------------------------------

                Employee employee = onboarding.getEmployee();

                String employeeName = employee.getFirstName()
                                + " "
                                + employee.getLastName();

                notificationService.notifyAllAdmins(
                                "New Document Uploaded",

                                employeeName
                                                + " uploaded "
                                                + request.getDocumentKey()
                                                                .replace("_", " ")
                                                + ". Please review.",

                                NotificationType.DOCUMENT_UPLOADED,

                                "OnboardingDocument",

                                saved.getId());

                return saved;
        }

        // ========================================================================
        // GET DOCUMENTS BY STATUS
        // ========================================================================

        @Transactional(readOnly = true)
        public List<OnboardingDocumentAdminResponse> getByStatus(
                        DocumentStatus status) {

                return documentRepository
                                .findByStatusOrderByUploadedAtDesc(status)
                                .stream()
                                .map(OnboardingDocumentAdminResponse::from)
                                .toList();
        }

        // ========================================================================
        // STATUS COUNTS
        // ========================================================================

        @Transactional(readOnly = true)
        public Map<String, Long> getStatusCounts() {

                return Map.of(
                                "pending",
                                documentRepository.countByStatus(
                                                DocumentStatus.UNDER_REVIEW),

                                "approved",
                                documentRepository.countByStatus(
                                                DocumentStatus.APPROVED),

                                "rejected",
                                documentRepository.countByStatus(
                                                DocumentStatus.REJECTED),

                                "reuploadRequired",
                                documentRepository.countByStatus(
                                                DocumentStatus.REUPLOAD_REQUIRED));
        }

        // ========================================================================
        // APPROVE DOCUMENT
        // ========================================================================

        @Transactional
        public OnboardingDocument approveDocument(
                        Long documentId,
                        String hrEmail) {

                OnboardingDocument doc = documentRepository.findById(
                                documentId).orElseThrow(
                                                () -> new IllegalArgumentException(
                                                                "Document not found: "
                                                                                + documentId));

                Employee hr = employeeRepository.findByEmail(
                                hrEmail).orElseThrow(
                                                () -> new IllegalArgumentException(
                                                                "HR user not found: "
                                                                                + hrEmail));

                /*
                 * Only documents waiting for review should be approved.
                 */

                if (doc.getStatus() != DocumentStatus.UNDER_REVIEW) {

                        throw new IllegalStateException(
                                        "Only documents under review can be approved.");
                }

                doc.setStatus(
                                DocumentStatus.APPROVED);

                doc.setReviewedAt(
                                LocalDateTime.now());

                doc.setReviewedByHr(
                                hr);

                doc.setRejectionRemarks(
                                null);

                OnboardingDocument saved = documentRepository.save(doc);

                // ------------------------------------------------------------
                // Notify employee
                // ------------------------------------------------------------

                Employee employee = doc.getOnboarding()
                                .getEmployee();

                notificationService.createAndSend(

                                employee,

                                "Document Approved",

                                "Your "
                                                + doc.getDocumentKey()
                                                                .replace("_", " ")
                                                + " has been approved.",

                                NotificationType.DOCUMENT_APPROVED,

                                "OnboardingDocument",

                                saved.getId());

                return saved;
        }

        // ========================================================================
        // REJECT DOCUMENT
        // ========================================================================

        @Transactional
        public OnboardingDocument rejectDocument(
                        Long documentId,
                        String hrEmail,
                        String remarks) {

                OnboardingDocument doc = documentRepository.findById(
                                documentId).orElseThrow(
                                                () -> new IllegalArgumentException(
                                                                "Document not found: "
                                                                                + documentId));

                Employee hr = employeeRepository.findByEmail(
                                hrEmail).orElseThrow(
                                                () -> new IllegalArgumentException(
                                                                "HR user not found: "
                                                                                + hrEmail));

                /*
                 * Only documents under review can be rejected.
                 */

                if (doc.getStatus() != DocumentStatus.UNDER_REVIEW) {

                        throw new IllegalStateException(
                                        "Only documents under review can be rejected.");
                }

                doc.setStatus(
                                DocumentStatus.REJECTED);

                doc.setReviewedAt(
                                LocalDateTime.now());

                doc.setReviewedByHr(
                                hr);

                doc.setRejectionRemarks(
                                remarks);

                OnboardingDocument saved = documentRepository.save(doc);

                // ------------------------------------------------------------
                // Notify employee
                // ------------------------------------------------------------

                Employee employee = doc.getOnboarding()
                                .getEmployee();

                notificationService.createAndSend(

                                employee,

                                "Document Rejected",

                                "Your "
                                                + doc.getDocumentKey()
                                                                .replace("_", " ")
                                                + " was rejected: "
                                                + (remarks == null
                                                                ? "Please upload a corrected document."
                                                                : remarks),

                                NotificationType.DOCUMENT_REJECTED,

                                "OnboardingDocument",

                                saved.getId());

                return saved;
        }

        // ========================================================================
        // REQUEST RE-UPLOAD
        // ========================================================================

        @Transactional
        public OnboardingDocument requestReupload(
                        Long documentId,
                        String hrEmail) {

                OnboardingDocument doc = documentRepository.findById(
                                documentId).orElseThrow(
                                                () -> new IllegalArgumentException(
                                                                "Document not found: "
                                                                                + documentId));

                Employee hr = employeeRepository.findByEmail(
                                hrEmail).orElseThrow(
                                                () -> new IllegalArgumentException(
                                                                "HR user not found: "
                                                                                + hrEmail));

                /*
                 * Re-upload should normally be requested only for an
                 * already approved document.
                 */

                if (doc.getStatus() != DocumentStatus.APPROVED) {

                        throw new IllegalStateException(
                                        "Only an approved document can be requested for re-upload.");
                }

                // ------------------------------------------------------------
                // Change status
                // ------------------------------------------------------------

                doc.setStatus(
                                DocumentStatus.REUPLOAD_REQUIRED);

                doc.setReviewedAt(
                                LocalDateTime.now());

                doc.setReviewedByHr(
                                hr);

                /*
                 * Clear previous remarks.
                 *
                 * This is not a rejection. It is a request for an updated
                 * document.
                 */

                doc.setRejectionRemarks(
                                null);

                OnboardingDocument saved = documentRepository.save(doc);

                // ------------------------------------------------------------
                // Notify employee
                // ------------------------------------------------------------

                Employee employee = doc.getOnboarding()
                                .getEmployee();

                notificationService.createAndSend(

                                employee,

                                "Document Update Required",

                                "HR has requested an updated "
                                                + doc.getDocumentKey()
                                                                .replace("_", " ")
                                                + ". Please upload the updated document.",

                                NotificationType.DOCUMENT_REUPLOAD_REQUIRED,

                                "OnboardingDocument",

                                saved.getId());

                return saved;
        }
}