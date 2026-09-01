package com.hrms.controller;

import com.hrms.dto.ApiResponse;
import com.hrms.dto.DocumentUploadRequest;
import com.hrms.dto.OnboardingDTOs;
import com.hrms.dto.OnboardingDashboardResponse;
import com.hrms.dto.OnboardingDocumentAdminResponse;
import com.hrms.dto.OnboardingDocumentResponse;
import com.hrms.dto.OnboardingReportsResponse;
import com.hrms.dto.RejectDocumentRequest;
import com.hrms.entity.Employee;
import com.hrms.entity.OnboardingDocument;
import com.hrms.enums.DocumentStatus;
import com.hrms.repository.EmployeeRepository;
import com.hrms.repository.OnboardingDocumentRepository;
import com.hrms.service.OnboardingDashboardService;
import com.hrms.service.OnboardingDocumentService;
import com.hrms.service.OnboardingService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/onboarding")
@RequiredArgsConstructor
@Tag(name = "Onboarding Management")
public class OnboardingController {

    private final OnboardingDashboardService dashboardService;

    private final OnboardingService onboardingService;

    private final EmployeeRepository employeeRepository;

    private final OnboardingDocumentService documentService;

    private final OnboardingDocumentRepository documentRepository;


    // ========================================================================
    // DASHBOARD
    // ========================================================================

    @GetMapping("/dashboard-summary")
    @PreAuthorize("hasAnyRole('ADMIN','HR')")
    @Operation(summary = "Get onboarding module dashboard summary")
    public ResponseEntity<ApiResponse<OnboardingDashboardResponse>>
    getDashboardSummary() {

        return ResponseEntity.ok(
                ApiResponse.success(
                        "Dashboard fetched",
                        dashboardService.getDashboard()
                )
        );
    }


    // ========================================================================
    // GET SINGLE ONBOARDING
    // ========================================================================

    @GetMapping("/{onboardingId}")
    @PreAuthorize("hasAnyRole('ADMIN','HR')")
    @Operation(summary = "Get a single onboarding record by its ID")
    public ResponseEntity<ApiResponse<OnboardingDTOs.Response>>
    getOnboardingById(
            @PathVariable Long onboardingId) {

        return ResponseEntity.ok(
                ApiResponse.success(
                        "Onboarding found",
                        onboardingService.getById(onboardingId)
                )
        );
    }


    // ========================================================================
    // INITIALIZE ONBOARDING
    // ========================================================================

    @PostMapping("/init/{employeeId}")
    @PreAuthorize("hasAnyRole('ADMIN','HR')")
    @Operation(summary = "Initialize onboarding for an employee")
    public ResponseEntity<ApiResponse<OnboardingDTOs.Response>>
    init(
            @PathVariable Long employeeId,
            Authentication authentication) {

        Employee hr =
                employeeRepository.findByEmail(
                        authentication.getName()
                ).orElseThrow(() ->
                        new RuntimeException(
                                "Logged-in HR user not found: "
                                        + authentication.getName()
                        )
                );

        return ResponseEntity.ok(
                ApiResponse.success(
                        "Onboarding initialized",
                        onboardingService.initOnboarding(
                                employeeId,
                                hr.getId()
                        )
                )
        );
    }


    // ========================================================================
    // REPORTS
    // ========================================================================

    @GetMapping("/reports")
    @PreAuthorize("hasAnyRole('ADMIN','HR')")
    @Operation(summary = "Get onboarding reports and analytics")
    public ResponseEntity<ApiResponse<OnboardingReportsResponse>>
    getReports() {

        return ResponseEntity.ok(
                ApiResponse.success(
                        "Reports fetched",
                        dashboardService.getReports()
                )
        );
    }


    // ========================================================================
    // GET ALL ONBOARDING RECORDS
    // ========================================================================

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN','HR')")
    @Operation(summary = "Get all onboarding records (paged)")
    public ResponseEntity<ApiResponse<Page<OnboardingDTOs.Response>>>
    getAll(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "100") int size) {

        return ResponseEntity.ok(
                ApiResponse.success(
                        "Onboarding records fetched",
                        onboardingService.getAll(
                                PageRequest.of(page, size)
                        )
                )
        );
    }


    // ========================================================================
    // GET MY ONBOARDING
    // ========================================================================

    @GetMapping("/my")
    @Operation(summary = "Get the logged-in employee's own onboarding record")
    public ResponseEntity<ApiResponse<OnboardingDTOs.Response>>
    getMyOnboarding(
            Authentication authentication) {

        Employee employee =
                employeeRepository.findByEmail(
                        authentication.getName()
                ).orElseThrow(() ->
                        new RuntimeException(
                                "Logged-in employee not found: "
                                        + authentication.getName()
                        )
                );

        return ResponseEntity.ok(
                ApiResponse.success(
                        "Onboarding found",
                        onboardingService.getByEmployeeId(
                                employee.getId()
                        )
                )
        );
    }


    // ========================================================================
    // GET ONBOARDING BY EMPLOYEE ID
    // ========================================================================

    @GetMapping("/employee/{employeeId}")
    @Operation(summary = "Get onboarding by employee ID")
    public ResponseEntity<ApiResponse<OnboardingDTOs.Response>>
    getByEmployeeId(
            @PathVariable Long employeeId) {

        return ResponseEntity.ok(
                ApiResponse.success(
                        "Onboarding found",
                        onboardingService.getByEmployeeId(
                                employeeId
                        )
                )
        );
    }


    // ========================================================================
    // UPDATE ONBOARDING CHECKLIST
    // ========================================================================

    @PutMapping("/{onboardingId}")
    @PreAuthorize("hasAnyRole('ADMIN','HR')")
    @Operation(summary = "Update onboarding checklist")
    public ResponseEntity<ApiResponse<OnboardingDTOs.Response>>
    update(
            @PathVariable Long onboardingId,
            @RequestBody OnboardingDTOs.UpdateRequest req) {

        return ResponseEntity.ok(
                ApiResponse.success(
                        "Onboarding updated",
                        onboardingService.updateOnboarding(
                                onboardingId,
                                req
                        )
                )
        );
    }


    // ========================================================================
    // GET EMPLOYEE DOCUMENTS
    // ========================================================================

    @GetMapping("/documents/{onboardingId}")
    @Operation(summary = "Get all documents for an onboarding record")
    public ResponseEntity<ApiResponse<List<OnboardingDocumentResponse>>>
    getDocuments(
            @PathVariable Long onboardingId) {

        List<OnboardingDocumentResponse> documents =
                documentRepository
                        .findByOnboardingId(onboardingId)
                        .stream()
                        .map(OnboardingDocumentResponse::from)
                        .toList();

        return ResponseEntity.ok(
                ApiResponse.success(
                        "Documents fetched",
                        documents
                )
        );
    }


    // ========================================================================
    // EMPLOYEE UPLOAD / RE-UPLOAD DOCUMENT
    // ========================================================================

    @PostMapping(
            "/documents/{onboardingId}/{documentKey}/upload"
    )
    @Operation(
            summary = "Upload or re-upload an onboarding document"
    )
    public ResponseEntity<ApiResponse<OnboardingDocumentResponse>>
    uploadDocument(
            @PathVariable Long onboardingId,
            @PathVariable String documentKey,
            @RequestBody DocumentUploadRequest req) {

        req.setOnboardingId(onboardingId);

        req.setDocumentKey(documentKey);

        OnboardingDocument saved =
                documentService.registerDocument(req);

        return ResponseEntity.ok(
                ApiResponse.success(
                        "Document uploaded successfully",
                        OnboardingDocumentResponse.from(saved)
                )
        );
    }


    // ========================================================================
    // GET DOCUMENTS BY STATUS
    // ========================================================================

    @GetMapping("/documents")
    @PreAuthorize("hasAnyRole('ADMIN','HR')")
    @Operation(
            summary = "Get documents filtered by status"
    )
    public ResponseEntity<
            ApiResponse<List<OnboardingDocumentAdminResponse>>>
    getDocumentsByStatus(
            @RequestParam String status) {

        DocumentStatus dbStatus;

        /*
         * Keep compatibility with the frontend where
         * PENDING means UNDER_REVIEW.
         */

        if ("PENDING".equalsIgnoreCase(status)) {

            dbStatus = DocumentStatus.UNDER_REVIEW;

        } else {

            try {

                dbStatus =
                        DocumentStatus.valueOf(
                                status.toUpperCase()
                        );

            } catch (IllegalArgumentException ex) {

                throw new IllegalArgumentException(
                        "Invalid document status: " + status
                );
            }
        }

        List<OnboardingDocumentAdminResponse> docs =
                documentService.getByStatus(dbStatus);

        return ResponseEntity.ok(
                ApiResponse.success(
                        "Documents fetched",
                        docs
                )
        );
    }


    // ========================================================================
    // DOCUMENT COUNTS
    // ========================================================================

    @GetMapping("/documents/counts")
    @PreAuthorize("hasAnyRole('ADMIN','HR')")
    @Operation(
            summary = "Get document counts by status for dashboard"
    )
    public ResponseEntity<ApiResponse<Map<String, Long>>>
    getDocumentCounts() {

        return ResponseEntity.ok(
                ApiResponse.success(
                        "Counts fetched",
                        documentService.getStatusCounts()
                )
        );
    }


    // ========================================================================
    // APPROVE DOCUMENT
    // ========================================================================

    @PutMapping("/documents/{documentId}/approve")
    @PreAuthorize("hasAnyRole('ADMIN','HR')")
    @Operation(summary = "Approve a document")
    public ResponseEntity<ApiResponse<OnboardingDocumentResponse>>
    approveDocument(
            @PathVariable Long documentId,
            Authentication authentication) {

        OnboardingDocument doc =
                documentService.approveDocument(
                        documentId,
                        authentication.getName()
                );

        return ResponseEntity.ok(
                ApiResponse.success(
                        "Document approved",
                        OnboardingDocumentResponse.from(doc)
                )
        );
    }


    // ========================================================================
    // REJECT DOCUMENT
    // ========================================================================

    @PutMapping("/documents/{documentId}/reject")
    @PreAuthorize("hasAnyRole('ADMIN','HR')")
    @Operation(summary = "Reject a document")
    public ResponseEntity<ApiResponse<OnboardingDocumentResponse>>
    rejectDocument(
            @PathVariable Long documentId,
            @RequestBody RejectDocumentRequest req,
            Authentication authentication) {

        OnboardingDocument doc =
                documentService.rejectDocument(
                        documentId,
                        authentication.getName(),
                        req.getRemarks()
                );

        return ResponseEntity.ok(
                ApiResponse.success(
                        "Document rejected",
                        OnboardingDocumentResponse.from(doc)
                )
        );
    }


    // ========================================================================
    // REQUEST RE-UPLOAD
    // ========================================================================

    @PutMapping("/documents/{documentId}/reupload")
    @PreAuthorize("hasAnyRole('ADMIN','HR')")
    @Operation(
            summary = "Request an updated document from employee"
    )
    public ResponseEntity<ApiResponse<OnboardingDocumentResponse>>
    requestReupload(
            @PathVariable Long documentId,
            Authentication authentication) {

        OnboardingDocument doc =
                documentService.requestReupload(
                        documentId,
                        authentication.getName()
                );

        return ResponseEntity.ok(
                ApiResponse.success(
                        "Document re-upload requested",
                        OnboardingDocumentResponse.from(doc)
                )
        );
    }
}