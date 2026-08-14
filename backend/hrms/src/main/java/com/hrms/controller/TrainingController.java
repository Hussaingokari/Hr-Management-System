package com.hrms.controller;

import com.hrms.dto.ApiResponse;
import com.hrms.dto.TrainingDTOs;
import com.hrms.entity.Employee;
import com.hrms.service.TrainingService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/trainings")
@RequiredArgsConstructor
@Tag(name = "Trainings")
public class TrainingController {

        private final TrainingService trainingService;

        @PostMapping
        @PreAuthorize("hasAnyRole('ADMIN','HR')")
        @Operation(summary = "Create training program")
        public ResponseEntity<ApiResponse<TrainingDTOs.Response>> create(
                        @Valid @RequestBody TrainingDTOs.CreateRequest req) {
                return ResponseEntity.status(HttpStatus.CREATED)
                                .body(ApiResponse.success("Training created", trainingService.createTraining(req)));
        }

        @PutMapping("/{id}")
        @PreAuthorize("hasAnyRole('ADMIN','HR')")
        @Operation(summary = "Update training")
        public ResponseEntity<ApiResponse<TrainingDTOs.Response>> update(
                        @PathVariable Long id, @RequestBody TrainingDTOs.UpdateRequest req) {
                return ResponseEntity.ok(ApiResponse.success("Training updated",
                                trainingService.updateTraining(id, req)));
        }

        @GetMapping
        @Operation(summary = "Get all trainings")
        public ResponseEntity<ApiResponse<Page<TrainingDTOs.Response>>> all(
                        @RequestParam(defaultValue = "0") int page,
                        @RequestParam(defaultValue = "10") int size) {
                return ResponseEntity.ok(ApiResponse.success("Trainings",
                                trainingService.getAllTrainings(PageRequest.of(page, size,
                                                Sort.by("startDate").descending()))));
        }

        @GetMapping("/{id}")
        @Operation(summary = "Get training by ID")
        public ResponseEntity<ApiResponse<TrainingDTOs.Response>> getById(@PathVariable Long id) {
                return ResponseEntity.ok(ApiResponse.success("Training found", trainingService.getById(id)));
        }

        @GetMapping("/{id}/enrollments")
        @PreAuthorize("hasAnyRole('ADMIN','HR')")
        @Operation(summary = "Get enrollments for a training")
        public ResponseEntity<ApiResponse<List<TrainingDTOs.EnrollmentResponse>>> getEnrollments(
                        @PathVariable Long id) {
                return ResponseEntity.ok(ApiResponse.success("Enrollments",
                                trainingService.getEnrollmentsForTraining(id)));
        }

        @PostMapping("/{id}/enroll")
        @Operation(summary = "Enroll employee in training")
        public ResponseEntity<ApiResponse<TrainingDTOs.EnrollmentResponse>> enroll(
                        @PathVariable Long id,
                        @RequestBody TrainingDTOs.EnrollRequest req) {
                return ResponseEntity.status(HttpStatus.CREATED)
                                .body(ApiResponse.success("Enrolled successfully",
                                                trainingService.enroll(id, req.getEmployeeId())));
        }

        @PutMapping("/enrollments/{enrollmentId}/complete")
        @PreAuthorize("hasAnyRole('ADMIN','HR')")
        @Operation(summary = "Mark enrollment as complete")
        public ResponseEntity<ApiResponse<TrainingDTOs.EnrollmentResponse>> complete(
                        @PathVariable Long enrollmentId,
                        @RequestBody TrainingDTOs.CompleteRequest req) {
                return ResponseEntity.ok(ApiResponse.success("Marked complete",
                                trainingService.markComplete(enrollmentId, req)));
        }

        @GetMapping("/my")
        @Operation(summary = "Get my training enrollments")
        public ResponseEntity<ApiResponse<Page<TrainingDTOs.EnrollmentResponse>>> myTrainings(
                        @AuthenticationPrincipal Employee emp,
                        @RequestParam(defaultValue = "0") int page,
                        @RequestParam(defaultValue = "10") int size) {
                return ResponseEntity.ok(ApiResponse.success("My trainings",
                                trainingService.getMyTrainings(emp.getId(), PageRequest.of(page, size))));
        }
}