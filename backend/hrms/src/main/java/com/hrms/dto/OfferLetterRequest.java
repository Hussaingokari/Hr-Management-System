package com.hrms.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.web.multipart.MultipartFile;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class OfferLetterRequest {
    private String candidateName;
    private String recipientEmail;
    private String jobTitle;
    private String salary;
    private String joiningDate;
    private String reportingTo;
    private String acceptanceDeadline;
    private MultipartFile pdfFile;
}