package com.hrms.controller;

import com.hrms.dto.ApiResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.apache.tika.Tika;

import java.io.InputStream;
import java.util.List;
import java.util.Arrays;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/files")
@Tag(name = "File Upload", description = "Attachments for leave requests, documents, etc.")
@Slf4j
public class FileUploadController { // here file will be uploaded for the leave attachments

    // Local disk storage — swap this with Azure Blob Storage SDK calls when ready
    private static final String UPLOAD_DIR = "uploads/";
    private final Tika tika = new Tika();
    private static final List<String> ALLOWED_MIME_TYPES = Arrays.asList(
            "application/pdf",
            "image/jpeg",
            "image/png",
            "application/msword",
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    );

    @PostMapping(value = "/upload", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @Operation(summary = "Upload a file attachment (e.g. medical certificate for leave)")
    public ResponseEntity<ApiResponse<Map<String, String>>> upload(
            @RequestParam("file") MultipartFile file) {

        try {
            // Validate MIME type strictly using Apache Tika
            try (InputStream is = file.getInputStream()) {
                String detectedType = tika.detect(is);
                if (!ALLOWED_MIME_TYPES.contains(detectedType)) {
                    log.warn("Blocked upload of invalid file type: {}", detectedType);
                    return ResponseEntity.badRequest()
                            .body(ApiResponse.error("Invalid file type. Allowed: PDF, JPG, PNG, DOC/DOCX."));
                }
            }

            Path uploadPath = Paths.get(UPLOAD_DIR);
            if (!Files.exists(uploadPath)) {
                Files.createDirectories(uploadPath);
            }

            String originalName = file.getOriginalFilename();
            String extension = originalName != null && originalName.contains(".")
                    ? originalName.substring(originalName.lastIndexOf("."))
                    : "";
            String storedName = UUID.randomUUID() + extension;

            Path filePath = uploadPath.resolve(storedName);
            Files.copy(file.getInputStream(), filePath);

            Map<String, String> result = new HashMap<>();
            result.put("fileName", originalName);
            result.put("storedName", storedName);
            result.put("url", "/api/files/download/" + storedName);
            result.put("size", String.valueOf(file.getSize()));

            return ResponseEntity.ok(ApiResponse.success("File uploaded successfully", result));

        } catch (IOException e) {
            log.error("File upload failed", e);
            return ResponseEntity.internalServerError()
                    .body(ApiResponse.error("File upload failed: " + e.getMessage()));
        }
    }

    @GetMapping("/download/{storedName}")
    @Operation(summary = "View/download an uploaded file")
    public ResponseEntity<Resource> download(@PathVariable String storedName) {
        try {
            Path filePath = Paths.get(UPLOAD_DIR).resolve(storedName);
            Resource resource = new UrlResource(filePath.toUri());

            if (!resource.exists()) {
                return ResponseEntity.notFound().build();
            }

            String contentType = Files.probeContentType(filePath);
            if (contentType == null) {
                contentType = "application/octet-stream";
            }

            return ResponseEntity.ok()
                    .contentType(MediaType.parseMediaType(contentType))
                    .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + storedName + "\"")
                    .body(resource);

        } catch (IOException e) {
            return ResponseEntity.badRequest().build();
        }
    }
}