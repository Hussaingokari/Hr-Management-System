package com.hrms.service;

import lombok.RequiredArgsConstructor;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;
import jakarta.mail.internet.MimeMessage;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.core.io.ByteArrayResource;

@Service
@RequiredArgsConstructor
public class EmailService {

    private final JavaMailSender mailSender;
    private static final Logger log = LoggerFactory.getLogger(EmailService.class);
    private static final DateTimeFormatter DEADLINE_FORMAT = DateTimeFormatter.ofPattern("dd/MM/yyyy");

    /**
     * Send OTP email
     */
    public void sendOtpEmail(String toEmail, String otp, String employeeName) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setTo(toEmail);
            helper.setSubject("HRMS — Password Reset OTP");
            helper.setText(buildOtpEmailHtml(employeeName, otp), true);

            mailSender.send(message);
            log.info("OTP email sent to: {}", toEmail);

        } catch (Exception e) {
            log.error("Failed to send OTP email to {}: {}", toEmail, e.getMessage());
            throw new RuntimeException("Failed to send email: " + e.getMessage());
        }
    }

    /**
     * Send greeting email with template
     */
    public void sendGreetingEmail(String toEmail, String candidateName, String templateBody, String templateSubject) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            String emailBody = templateBody.replace("{CANDIDATE_NAME}", candidateName);
            String styledHtmlBody = wrapWithHtmlStyling(candidateName, emailBody);

            helper.setTo(toEmail);
            helper.setSubject(templateSubject);
            helper.setText(styledHtmlBody, true);

            mailSender.send(message);
            log.info("Greeting email sent to: {} for candidate: {}", toEmail, candidateName);

        } catch (Exception e) {
            log.error("Failed to send greeting email to {}: {}", toEmail, e.getMessage());
            throw new RuntimeException("Failed to send email: " + e.getMessage());
        }
    }

    /**
     * Send document request email
     */
    public void sendDocumentRequestEmail(
            String toEmail,
            String candidateName,
            String jobTitle,
            LocalDate interviewDate,
            LocalDate deadline,
            String hrEmail) {

        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setTo(toEmail);
            helper.setSubject("Submission of Required Documents – SAITEJA INFOTECH PVT LTD");

            String formattedInterviewDate = interviewDate != null ? interviewDate.format(DEADLINE_FORMAT) : "N/A";
            String formattedDeadline = deadline != null ? deadline.format(DEADLINE_FORMAT) : "N/A";

            String styledHtml = wrapWithHtmlStyling(
                    candidateName,
                    buildDocumentRequestBody(candidateName, jobTitle, formattedInterviewDate, formattedDeadline,
                            hrEmail));

            helper.setText(styledHtml, true);
            mailSender.send(message);

            log.info("Document request email sent to {}", toEmail);

        } catch (Exception e) {
            log.error("Failed to send document request email : {}", e.getMessage());
            throw new RuntimeException("Failed to send document request email", e);
        }
    }

    /**
     * Generic send email method
     */
    public void sendEmail(String toEmail, String subject, String emailBody) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setTo(toEmail);
            helper.setSubject(subject);
            helper.setText(emailBody, true);

            mailSender.send(message);
            log.info("Email sent to: {}", toEmail);

        } catch (Exception e) {
            log.error("Failed to send email to {}: {}", toEmail, e.getMessage());
            throw new RuntimeException("Failed to send email: " + e.getMessage());
        }
    }

    /**
     * Send email with PDF attachment
     */
    public void sendEmailWithAttachment(String toEmail, String subject, String emailBody, MultipartFile pdfFile, String attachmentFileName) {
    try {
        MimeMessage message = mailSender.createMimeMessage();
        MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

        helper.setTo(toEmail);
        helper.setSubject(subject);
        helper.setText(emailBody, true);

        // Add attachment if file is present
        if (pdfFile != null && !pdfFile.isEmpty()) {
            String fileName = (attachmentFileName != null && !attachmentFileName.isBlank())
                    ? attachmentFileName
                    : pdfFile.getOriginalFilename();
            byte[] fileBytes = pdfFile.getBytes();
            ByteArrayResource resource = new ByteArrayResource(fileBytes);
            helper.addAttachment(fileName, resource);
            log.info("Attachment added: {} ({} bytes)", fileName, fileBytes.length);
        }

        mailSender.send(message);
        log.info("Email with attachment sent to: {}", toEmail);

    } catch (Exception e) {
        log.error("Failed to send email with attachment to {}: {}", toEmail, e.getMessage());
        throw new RuntimeException("Failed to send email: " + e.getMessage());
    }
}

    /**
     * Build HTML for OTP email
     */
    private String buildOtpEmailHtml(String name, String otp) {
        return """
                <!DOCTYPE html>
                <html>
                <head>
                    <meta charset="UTF-8">
                    <style>
                        body { font-family: 'Segoe UI', Arial, sans-serif; background: #f5f7fa; margin: 0; padding: 20px; }
                        .container { max-width: 500px; margin: 0 auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.1); }
                        .header { background: linear-gradient(135deg, #1e3a5f, #2563eb); padding: 30px; text-align: center; }
                        .header h1 { color: white; margin: 0; font-size: 24px; }
                        .header p { color: rgba(255,255,255,0.8); margin: 8px 0 0; font-size: 14px; }
                        .body { padding: 32px; }
                        .greeting { font-size: 16px; color: #1e293b; margin-bottom: 16px; }
                        .otp-box { background: #f0f7ff; border: 2px dashed #3b82f6; border-radius: 12px; padding: 24px; text-align: center; margin: 24px 0; }
                        .otp-label { font-size: 13px; color: #64748b; margin-bottom: 8px; }
                        .otp-code { font-size: 40px; font-weight: 900; color: #1e3a5f; letter-spacing: 8px; }
                        .expiry { font-size: 12px; color: #94a3b8; margin-top: 8px; }
                        .warning { background: #fff7ed; border-left: 4px solid #f59e0b; padding: 12px 16px; border-radius: 4px; font-size: 13px; color: #92400e; margin: 16px 0; }
                        .footer { background: #f8fafc; padding: 20px 32px; text-align: center; font-size: 12px; color: #94a3b8; }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <div class="header">
                            <h1>🏢 HRMS</h1>
                            <p>HR Management System</p>
                        </div>
                        <div class="body">
                            <div class="greeting">Hello <strong>%s</strong>,</div>
                            <p style="color: #64748b; font-size: 14px;">We received a request to reset your HRMS account password. Use the OTP below:</p>
                            <div class="otp-box">
                                <div class="otp-label">Your One-Time Password</div>
                                <div class="otp-code">%s</div>
                                <div class="expiry">⏱ Valid for 10 minutes only</div>
                            </div>
                            <div class="warning">
                                ⚠️ Never share this OTP with anyone. HRMS team will never ask for your OTP.
                            </div>
                            <p style="color: #94a3b8; font-size: 13px;">If you didn't request this, please ignore this email or contact your HR Admin immediately.</p>
                        </div>
                        <div class="footer">
                            © 2025 HR Management System · SAITEJA INFOTECH PVT LTD
                        </div>
                    </div>
                </body>
                </html>
                """
                .formatted(name, otp);
    }

    /**
     * Build document request email body (plain text)
     */
    private String buildDocumentRequestBody(
            String candidateName,
            String jobTitle,
            String interviewDate,
            String deadline,
            String hrEmail) {

        return "Dear " + candidateName + ",\n\n" +
                "Greetings from SAITEJA INFOTECH PVT LTD.\n\n" +
                "We would like to thank you for attending the interview held on " + interviewDate + " " +
                "for the position of " + jobTitle + ". Following the interview, we request you to " +
                "submit the necessary documents for verification and further processing of your application.\n\n" +
                "Documents Required:\n" +
                "1. Updated Resume / CV\n" +
                "2. Educational Certificates (10th, 12th, Graduation, etc.)\n" +
                "3. Experience / Relieving Letters from previous employers (if applicable)\n" +
                "4. Government-issued ID proof (Aadhar, Passport, Driving License, etc.)\n" +
                "5. Any other certificates relevant to the position\n\n" +
                "Submission Guidelines:\n" +
                "• Kindly send scanned copies of all documents in PDF format to " + hrEmail + "\n" +
                "• Ensure that all documents are clear and legible.\n" +
                "• Please submit the documents by " + deadline + "\n\n" +
                "Please note that submission of these documents is mandatory for the continuation " +
                "of the selection process. Failure to provide the required documents within the " +
                "stipulated timeframe may affect your application.\n\n" +
                "Should you have any questions or require assistance in submitting your documents, " +
                "please feel free to reach out to us.\n\n" +
                "We appreciate your prompt cooperation and look forward to receiving your documents.\n\n" +
                "Yours faithfully,\n" +
                "Human Resources Department\n" +
                "SAITEJA INFOTECH PVT LTD";
    }

    /**
     * Wrap email body with HTML styling
     */
    private String wrapWithHtmlStyling(String candidateName, String emailBody) {
        return "<div style=\"font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f5f5f5; padding: 20px;\">"
                +
                "<div style=\"background: linear-gradient(135deg, #1e3c72 0%, #2a5298 100%); padding: 30px; text-align: center; border-radius: 8px 8px 0 0;\">"
                +
                "<h1 style=\"color: white; margin: 0; font-size: 28px; font-weight: bold;\">🏢 SAITEJA INFOTECH PRIVATE LIMITED </h1>"
                +

                "<p style=\"color: #e0e0e0; margin: 8px 0 0 0; font-size: 14px;\">HR Management System</p>" +
                "</div>" +
                "<div style=\"background-color: white; padding: 40px; border-radius: 0 0 8px 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);\">"
                +
                "<div style=\"white-space: pre-wrap; color: #555; font-size: 14px; line-height: 1.8;\">" +
                emailBody +
                "</div>" +
                "<div style=\"margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0;\">" +
                "<p style=\"color: #2a5298; font-size: 13px; margin: 5px 0 0 0;\">© 2025 SAITEJA INFOTECH PVT LTD. All rights reserved.</p>"
                +
                "</div>" +
                "</div>" +
                "</div>";
    }
}