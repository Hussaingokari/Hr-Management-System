package com.hrms.controller;

import com.hrms.dto.DocumentUploadRequest;
import com.hrms.entity.OnboardingDocument;
import com.hrms.service.OnboardingDocumentService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.security.core.Authentication;

@RestController
@RequestMapping("/api/onboarding-documents")
@RequiredArgsConstructor
public class OnboardingDocumentController {

    private final OnboardingDocumentService documentService;

    @PostMapping
    public ResponseEntity<OnboardingDocument> registerDocument(
            @RequestBody DocumentUploadRequest request) {
        OnboardingDocument saved = documentService.registerDocument(request);
        return ResponseEntity.ok(saved);
    }

    @PutMapping("/{id}/reupload")
    public ResponseEntity<OnboardingDocument> requestReupload(
            @PathVariable Long id,
            Authentication authentication) {

        OnboardingDocument updated = documentService.requestReupload(
                id,
                authentication.getName());

        return ResponseEntity.ok(updated);
    }
}