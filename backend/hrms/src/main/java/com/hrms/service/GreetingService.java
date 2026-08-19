package com.hrms.service;

import com.hrms.dto.*;
import com.hrms.entity.EmailHistory;
import com.hrms.entity.EmailTemplate;
import com.hrms.enums.EmailStatus;
import com.hrms.repository.EmailHistoryRepository;
import com.hrms.repository.EmailTemplateRepository;
import com.hrms.service.EmailService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Slf4j
public class GreetingService {

    @Autowired
    private EmailService emailService;

    @Autowired
    private EmailTemplateRepository emailTemplateRepository;

    @Autowired
    private EmailHistoryRepository emailHistoryRepository;

    /**
     * Send greeting to candidate
     */
    public SendGreetingResponse sendGreeting(SendGreetingRequest request) {
        try {
            if (request.getCandidateName() == null
                    || request.getCandidateName().trim().isEmpty()) {

                return new SendGreetingResponse(
                        false,
                        "Candidate name is required");
            }

            if (request.getRecipientEmail() == null
                    || request.getRecipientEmail().trim().isEmpty()) {

                return new SendGreetingResponse(
                        false,
                        "Email address is required");
            }

            EmailTemplate template;

            if (request.getTemplateId() != null) {

                template = emailTemplateRepository
                        .findById(request.getTemplateId())
                        .orElseThrow(() -> new RuntimeException("Template not found"));

            } else {

                template = emailTemplateRepository
                        .findByTemplateName("Admission Greeting")
                        .orElseThrow(() -> new RuntimeException(
                                "Admission Greeting template not found"));
            }

            boolean emailSent = false;
            String errorMessage = null;

            try {

                String emailBody = template.getTemplateBody()
                        .replace(
                                "{CANDIDATE_NAME}",
                                request.getCandidateName());

                String styledHtmlBody = wrapWithHtmlStyling(
                        request.getCandidateName(),
                        emailBody);

                emailService.sendEmail(
                        request.getRecipientEmail(),
                        template.getTemplateSubject(),
                        styledHtmlBody);

                emailSent = true;

                log.info(
                        "Greeting email sent successfully to: {}",
                        request.getRecipientEmail());

            } catch (Exception e) {

                emailSent = false;
                errorMessage = e.getMessage();

                log.error(
                        "Email sending failed: {}",
                        e.getMessage());
            }

            saveEmailHistory(
                    request,
                    template,
                    emailSent,
                    errorMessage);

            if (emailSent) {

                return new SendGreetingResponse(
                        true,
                        "Email sent successfully to "
                                + request.getRecipientEmail());

            } else {

                return new SendGreetingResponse(
                        false,
                        "Failed to send email: "
                                + errorMessage);
            }

        } catch (Exception e) {

            log.error(
                    "Error in sendGreeting: {}",
                    e.getMessage());

            return new SendGreetingResponse(
                    false,
                    "Error: " + e.getMessage());
        }
    }

    /**
     * Save email history - separate transaction for safety
     */
    @Transactional
    private void saveEmailHistory(
            SendGreetingRequest request,
            EmailTemplate template,
            boolean emailSent,
            String errorMessage) {

        try {

            EmailHistory history = new EmailHistory();

            history.setCandidateName(
                    request.getCandidateName());

            history.setRecipientEmail(
                    request.getRecipientEmail());

            history.setSentByAdminId(
                    request.getAdminId());

            history.setSentByAdminName(
                    request.getAdminName());

            history.setEmailTemplate(
                    template);

            history.setStatus(
                    emailSent
                            ? EmailStatus.SENT
                            : EmailStatus.FAILED);

            history.setErrorMessage(
                    errorMessage);

            history.setIsRead(false);

            emailHistoryRepository.save(history);

            log.info(
                    "Email history saved - Status: {}",
                    emailSent ? "SENT" : "FAILED");

        } catch (Exception e) {

            log.error(
                    "Error saving email history: {}",
                    e.getMessage());
        }
    }

    /**
     * Get all email templates
     */
    public List<EmailTemplate> getAllTemplates() {

        return emailTemplateRepository
                .findByIsActiveTrue();
    }

    /**
     * Get email history for admin
     */
    public List<EmailHistory> getEmailHistory(Integer adminId) {

        if (adminId != null) {

            return emailHistoryRepository
                    .findBySentByAdminId(adminId);
        }

        return emailHistoryRepository.findAll();
    }

    /**
     * Get email history by status
     */
    public List<EmailHistory> getEmailHistoryByStatus(
            String status) {

        return emailHistoryRepository
                .findByStatus(status);
    }

    /**
     * Get recent emails (last 10)
     */
    public List<EmailHistory> getRecentEmails() {

        return emailHistoryRepository
                .findRecentEmails(10);
    }

    /**
     * Send online interview email
     */
    public InterviewEmailResponse sendOnlineInterviewEmail(
            InterviewEmailRequest request) {

        try {

            EmailTemplate template = emailTemplateRepository
                    .findByTemplateName(
                            "Online Interview Invitation")
                    .orElseThrow(() -> new RuntimeException(
                            "Online Interview template not found"));

            String emailBody = template.getTemplateBody()
                    .replace(
                            "{CANDIDATE_NAME}",
                            orEmpty(request.getCandidateName()))
                    .replace(
                            "{JOB_TITLE}",
                            orEmpty(request.getJobTitle()))
                    .replace(
                            "{INTERVIEW_DATE}",
                            orEmpty(request.getInterviewDate()))
                    .replace(
                            "{INTERVIEW_TIME}",
                            orEmpty(request.getInterviewTime()))
                    .replace(
                            "{PLATFORM}",
                            orEmpty(request.getPlatform()))
                    .replace(
                            "{MEETING_LINK}",
                            orEmpty(request.getMeetingLink()))
                    .replace(
                            "{MEETING_ID}",
                            orEmpty(request.getMeetingId()))
                    .replace(
                            "{PASSCODE}",
                            orEmpty(request.getPasscode()));

            String styledHtmlBody = wrapWithHtmlStyling(
                    request.getCandidateName(),
                    emailBody);

            emailService.sendEmail(
                    request.getRecipientEmail(),
                    template.getTemplateSubject(),
                    styledHtmlBody);

            return new InterviewEmailResponse(
                    true,
                    "Online interview email sent successfully");

        } catch (Exception e) {

            log.error(
                    "Error in sendOnlineInterviewEmail: {}",
                    e.getMessage());

            return new InterviewEmailResponse(
                    false,
                    "Error: " + e.getMessage());
        }
    }

    /**
     * Send offline interview email
     */
    public InterviewEmailResponse sendOfflineInterviewEmail(
            InterviewEmailRequest request) {

        try {

            EmailTemplate template = emailTemplateRepository
                    .findByTemplateName(
                            "Offline Interview Invitation")
                    .orElseThrow(() -> new RuntimeException(
                            "Offline Interview template not found"));

            String emailBody = template.getTemplateBody()
                    .replace(
                            "{CANDIDATE_NAME}",
                            orEmpty(request.getCandidateName()))
                    .replace(
                            "{JOB_TITLE}",
                            orEmpty(request.getJobTitle()))
                    .replace(
                            "{INTERVIEW_DATE}",
                            orEmpty(request.getInterviewDate()))
                    .replace(
                            "{INTERVIEW_TIME}",
                            orEmpty(request.getInterviewTime()))
                    .replace(
                            "{VENUE_ADDRESS}",
                            orEmpty(request.getVenueAddress()));

            String styledHtmlBody = wrapWithHtmlStyling(
                    request.getCandidateName(),
                    emailBody);

            emailService.sendEmail(
                    request.getRecipientEmail(),
                    template.getTemplateSubject(),
                    styledHtmlBody);

            return new InterviewEmailResponse(
                    true,
                    "Offline interview email sent successfully");

        } catch (Exception e) {

            log.error(
                    "Error in sendOfflineInterviewEmail: {}",
                    e.getMessage());

            return new InterviewEmailResponse(
                    false,
                    "Error: " + e.getMessage());
        }
    }

    /**
     * Send offer letter email with PDF attachment
     *
     * CC SUPPORT:
     * The OfferLetterRequest now contains a List<String> ccEmails.
     * Those email addresses are passed to EmailService so that
     * the offer letter is sent to the candidate with the selected
     * recipients in CC.
     */
    public OfferLetterResponse sendOfferLetter(
            OfferLetterRequest request) {

        try {

            // -----------------------------------------
            // Validate required fields
            // -----------------------------------------

            if (request.getCandidateName() == null
                    || request.getCandidateName().trim().isEmpty()) {

                return new OfferLetterResponse(
                        false,
                        "Candidate name is required");
            }

            if (request.getRecipientEmail() == null
                    || request.getRecipientEmail().trim().isEmpty()) {

                return new OfferLetterResponse(
                        false,
                        "Email address is required");
            }

            if (request.getPdfFile() == null
                    || request.getPdfFile().isEmpty()) {

                return new OfferLetterResponse(
                        false,
                        "PDF file is required");
            }

            if (request.getJobTitle() == null
                    || request.getJobTitle().trim().isEmpty()) {

                return new OfferLetterResponse(
                        false,
                        "Job title is required");
            }

            if (request.getSalary() == null
                    || request.getSalary().trim().isEmpty()) {

                return new OfferLetterResponse(
                        false,
                        "Salary is required");
            }

            if (request.getJoiningDate() == null
                    || request.getJoiningDate().trim().isEmpty()) {

                return new OfferLetterResponse(
                        false,
                        "Joining date is required");
            }

            // -----------------------------------------
            // Fetch Offer Letter template
            // -----------------------------------------

            EmailTemplate template = emailTemplateRepository
                    .findByTemplateName("Offer Letter")
                    .orElseThrow(() -> new RuntimeException(
                            "Offer Letter template not found"));

            // -----------------------------------------
            // Replace template placeholders
            // -----------------------------------------

            String emailBody = template.getTemplateBody()
                    .replace(
                            "{CANDIDATE_NAME}",
                            request.getCandidateName())
                    .replace(
                            "{JOB_TITLE}",
                            orEmpty(request.getJobTitle()))
                    .replace(
                            "{SALARY}",
                            orEmpty(request.getSalary()))
                    .replace(
                            "{JOINING_DATE}",
                            orEmpty(request.getJoiningDate()))
                    .replace(
                            "{REPORTING_PERSON}",
                            orEmpty(request.getReportingTo()))
                    .replace(
                            "{ACCEPTANCE_DEADLINE}",
                            orEmpty(request.getAcceptanceDeadline()));

            String styledHtmlBody = wrapWithHtmlStyling(
                    request.getCandidateName(),
                    emailBody);

            // -----------------------------------------
            // Create attachment file name
            // -----------------------------------------

            String cleanFileName = request.getCandidateName()
                    .replaceAll("\\s+", "_")
                    + "_Offer_Letter.pdf";

            // -----------------------------------------
            // Send Offer Letter
            // TO = Candidate
            // CC = HR / Manager / Team Lead / etc.
            // PDF = Offer Letter
            // -----------------------------------------

            emailService.sendEmailWithAttachment(
                    request.getRecipientEmail(),
                    request.getCcEmails(),
                    template.getTemplateSubject(),
                    styledHtmlBody,
                    request.getPdfFile(),
                    cleanFileName);

            // -----------------------------------------
            // Log CC information
            // -----------------------------------------

            if (request.getCcEmails() != null
                    && !request.getCcEmails().isEmpty()) {

                log.info(
                        "Offer letter email sent to: {} with CC: {}",
                        request.getRecipientEmail(),
                        request.getCcEmails());

            } else {

                log.info(
                        "Offer letter email with attachment sent to: {}",
                        request.getRecipientEmail());
            }

            return new OfferLetterResponse(
                    true,
                    "Offer letter sent successfully");

        } catch (Exception e) {

            log.error(
                    "Error in sendOfferLetter: {}",
                    e.getMessage(),
                    e);

            return new OfferLetterResponse(
                    false,
                    "Error: " + e.getMessage());
        }
    }

    /**
     * Null-safety helper - returns "" instead of null so
     * String.replace() never throws a NullPointerException
     * on an optional field.
     */
    private String orEmpty(String value) {

        return value == null ? "" : value;
    }

    /**
     * Wrap email body with HTML styling
     */
    private String wrapWithHtmlStyling(
            String candidateName,
            String emailBody) {

        return "<div style=\"font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f5f5f5; padding: 20px;\">"
                +

                "<div style=\"background: linear-gradient(135deg, #1e3c72 0%, #2a5298 100%); padding: 30px; text-align: center; border-radius: 8px 8px 0 0;\">"
                +

                "<h1 style=\"color: white; margin: 0; font-size: 28px; font-weight: bold;\">🏢 SAITEJA INFOTECH PRIVATE LIMITED</h1>"
                +

                "<p style=\"color: #e0e0e0; margin: 8px 0 0 0; font-size: 14px;\">HR Management System</p>"
                +

                "</div>" +

                "<div style=\"background-color: white; padding: 40px; border-radius: 0 0 8px 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);\">"
                +

                "<div style=\"white-space: pre-wrap; color: #555; font-size: 14px; line-height: 1.8;\">"
                +
                emailBody
                +
                "</div>" +

                "<div style=\"margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0;\">"
                +

                "<p style=\"color: #2a5298; font-size: 13px; margin: 5px 0 0 0;\">© 2025 SAITEJA INFOTECH PVT LTD. All rights reserved.</p>"
                +

                "</div>" +

                "</div>" +

                "</div>";
    }
}