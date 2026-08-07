package com.hrms.controller;

import com.hrms.dto.*;
import com.hrms.entity.EmailHistory;
import com.hrms.entity.EmailTemplate;
import com.hrms.service.GreetingService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/greeting")
@CrossOrigin(origins = "http://localhost:3000")
@Slf4j
public class GreetingController {

    @Autowired
    private GreetingService greetingService;

    /**
     * POST /api/greeting/send
     * Send greeting to candidate
     * Access: ADMIN, HR only
     */
    @PostMapping("/send")
    @PreAuthorize("hasAnyRole('ADMIN', 'HR')")
    public ResponseEntity<?> sendGreeting(@RequestBody SendGreetingRequest request) {
        try {
            log.info("Sending greeting to: {}", request.getRecipientEmail());
            SendGreetingResponse response = greetingService.sendGreeting(request);

            if (response.getSuccess()) {
                return ResponseEntity.ok(response);
            } else {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
            }
        } catch (Exception e) {
            log.error("Error in sendGreeting: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new SendGreetingResponse(false, "Server error: " + e.getMessage()));
        }
    }

    /**
     * GET /api/greeting/templates
     * Get all available email templates
     * Access: ADMIN, HR only
     */
    @GetMapping("/templates")
    @PreAuthorize("hasAnyRole('ADMIN', 'HR')")
    public ResponseEntity<?> getAllTemplates() {
        try {
            List<EmailTemplate> templates = greetingService.getAllTemplates();
            return ResponseEntity.ok(templates);
        } catch (Exception e) {
            log.error("Error fetching templates: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new HashMap<String, String>() {
                        {
                            put("error", "Failed to fetch templates");
                        }
                    });
        }
    }

    /**
     * GET /api/greeting/templates/{id}
     * Get specific template by ID
     * Access: ADMIN, HR only
     */
    @GetMapping("/templates/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'HR')")
    public ResponseEntity<?> getTemplateById(@PathVariable Integer id) {
        try {
            List<EmailTemplate> templates = greetingService.getAllTemplates();
            EmailTemplate template = templates.stream()
                    .filter(t -> t.getId().equals(id))
                    .findFirst()
                    .orElse(null);

            if (template != null) {
                return ResponseEntity.ok(template);
            } else {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(new HashMap<String, String>() {
                            {
                                put("error", "Template not found");
                            }
                        });
            }
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new HashMap<String, String>() {
                        {
                            put("error", e.getMessage());
                        }
                    });
        }
    }

    /**
     * GET /api/greeting/history
     * Get email sending history
     * Access: ADMIN, HR only
     */
    @GetMapping("/history")
    @PreAuthorize("hasAnyRole('ADMIN', 'HR')")
    public ResponseEntity<?> getEmailHistory(@RequestParam(required = false) Integer adminId) {
        try {
            List<EmailHistory> history = greetingService.getEmailHistory(adminId);
            return ResponseEntity.ok(history);
        } catch (Exception e) {
            log.error("Error fetching history: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new HashMap<String, String>() {
                        {
                            put("error", "Failed to fetch history");
                        }
                    });
        }
    }

    /**
     * GET /api/greeting/history/status/{status}
     * Get emails by status (SENT, FAILED)
     * Access: ADMIN, HR only
     */
    @GetMapping("/history/status/{status}")
    @PreAuthorize("hasAnyRole('ADMIN', 'HR')")
    public ResponseEntity<?> getEmailHistoryByStatus(@PathVariable String status) {
        try {
            List<EmailHistory> history = greetingService.getEmailHistoryByStatus(status);
            return ResponseEntity.ok(history);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new HashMap<String, String>() {
                        {
                            put("error", e.getMessage());
                        }
                    });
        }
    }

    /**
     * GET /api/greeting/history/recent
     * Get recent emails (last 10)
     * Access: ADMIN, HR only
     */
    @GetMapping("/history/recent")
    @PreAuthorize("hasAnyRole('ADMIN', 'HR')")
    public ResponseEntity<?> getRecentEmails() {
        try {
            List<EmailHistory> recentEmails = greetingService.getRecentEmails();
            return ResponseEntity.ok(recentEmails);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new HashMap<String, String>() {
                        {
                            put("error", e.getMessage());
                        }
                    });
        }
    }

    /**
     * GET /api/greeting/status
     * Check if greeting service is running
     * Access: PUBLIC (no authentication required)
     */
    @GetMapping("/status")
    public ResponseEntity<?> status() {
        Map<String, String> response = new HashMap<>();
        response.put("status", "Greeting service is running");
        response.put("timestamp", java.time.LocalDateTime.now().toString());
        return ResponseEntity.ok(response);
    }

    @PostMapping("/send-online-interview")
    @PreAuthorize("hasAnyRole('ADMIN', 'HR')")
    public ResponseEntity<?> sendOnlineInterviewEmail(@RequestBody InterviewEmailRequest request) {
        try {
            InterviewEmailResponse response = greetingService.sendOnlineInterviewEmail(request);
            if (response.getSuccess()) {
                return ResponseEntity.ok(response);
            } else {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
            }
        } catch (Exception e) {
            log.error("Error in sendOnlineInterviewEmail: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new InterviewEmailResponse(false, "Server error: " + e.getMessage()));
        }
    }

    @PostMapping("/send-offline-interview")
    @PreAuthorize("hasAnyRole('ADMIN', 'HR')")
    public ResponseEntity<?> sendOfflineInterviewEmail(@RequestBody InterviewEmailRequest request) {
        try {
            InterviewEmailResponse response = greetingService.sendOfflineInterviewEmail(request);
            if (response.getSuccess()) {
                return ResponseEntity.ok(response);
            } else {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
            }
        } catch (Exception e) {
            log.error("Error in sendOfflineInterviewEmail: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new InterviewEmailResponse(false, "Server error: " + e.getMessage()));
        }
    }

    /**
     * POST /api/greeting/send-offer-letter
     * Send offer letter with a PDF attachment (multipart/form-data)
     * Access: ADMIN, HR only
     *
     * NOTE ON 400 ERRORS: @ModelAttribute binds multipart form fields by
     * NAME. Every form field name from the frontend must match a field name
     * in OfferLetterRequest exactly (candidateName, recipientEmail,
     * jobTitle, salary, joiningDate, reportingTo, acceptanceDeadline,
     * pdfFile). Also make sure the frontend does NOT manually set the
     * "Content-Type" header on the request - let the browser/axios/fetch
     * set it automatically so the multipart boundary is included, otherwise
     * Spring's multipart resolver itself will reject the request with a 400
     * before this method is even entered.
     */
    @PostMapping("/send-offer-letter")
    @PreAuthorize("hasAnyRole('ADMIN', 'HR')")
    public ResponseEntity<?> sendOfferLetter(@ModelAttribute OfferLetterRequest request) {
        try {
            log.info("Sending offer letter to: {}", request.getRecipientEmail());
            OfferLetterResponse response = greetingService.sendOfferLetter(request);

            if (response.getSuccess()) {
                return ResponseEntity.ok(response);
            } else {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
            }
        } catch (Exception e) {
            log.error("Error in sendOfferLetter: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new OfferLetterResponse(false, "Server error: " + e.getMessage()));
        }
    }
}