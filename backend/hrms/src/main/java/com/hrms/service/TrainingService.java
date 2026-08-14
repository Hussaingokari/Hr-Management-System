package com.hrms.service;

import com.hrms.dto.TrainingDTOs;
import com.hrms.entity.Employee;
import com.hrms.entity.Notification.NotificationType;
import com.hrms.entity.Training;
import com.hrms.entity.Training.TrainingStatus;
import com.hrms.entity.TrainingEnrollment;
import com.hrms.entity.TrainingEnrollment.EnrollmentStatus;
import com.hrms.repository.TrainingEnrollmentRepository;
import com.hrms.repository.TrainingRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.NoSuchElementException;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class TrainingService {

        private final TrainingRepository trainingRepo;
        private final TrainingEnrollmentRepository enrollmentRepo;
        private final EmployeeService employeeService;
        private final NotificationService notificationService;

        @Transactional
        public TrainingDTOs.Response createTraining(
                        TrainingDTOs.CreateRequest req) {
                Training training = Training.builder()
                                .title(req.getTitle())
                                .description(req.getDescription())
                                .category(req.getCategory())
                                .trainer(req.getTrainer())
                                .mode(req.getMode())
                                .startDate(req.getStartDate())
                                .endDate(req.getEndDate())
                                .durationHours(req.getDurationHours())
                                .maxParticipants(req.getMaxParticipants())
                                .venue(req.getVenue())
                                .meetingLink(req.getMeetingLink())
                                .status(TrainingStatus.UPCOMING)
                                .build();
                return toResponse(trainingRepo.save(training));
        }

        @Transactional
        public TrainingDTOs.Response updateTraining(
                        Long id, TrainingDTOs.UpdateRequest req) {
                Training t = findById(id);
                if (req.getTitle() != null)
                        t.setTitle(req.getTitle());
                if (req.getDescription() != null)
                        t.setDescription(req.getDescription());
                if (req.getTrainer() != null)
                        t.setTrainer(req.getTrainer());
                if (req.getMode() != null)
                        t.setMode(req.getMode());
                if (req.getStartDate() != null)
                        t.setStartDate(req.getStartDate());
                if (req.getEndDate() != null)
                        t.setEndDate(req.getEndDate());
                if (req.getDurationHours() != null)
                        t.setDurationHours(req.getDurationHours());
                if (req.getMaxParticipants() != null)
                        t.setMaxParticipants(req.getMaxParticipants());
                if (req.getVenue() != null)
                        t.setVenue(req.getVenue());
                if (req.getMeetingLink() != null)
                        t.setMeetingLink(req.getMeetingLink());
                if (req.getStatus() != null)
                        t.setStatus(req.getStatus());
                return toResponse(trainingRepo.save(t));
        }

        @Transactional(readOnly = true)
        public Page<TrainingDTOs.Response> getAllTrainings(
                        Pageable pageable) {
                return trainingRepo.findAll(pageable)
                                .map(this::toResponse);
        }

        @Transactional(readOnly = true)
        public TrainingDTOs.Response getById(Long id) {
                return toResponse(findById(id));
        }

        @Transactional(readOnly = true)
        public List<TrainingDTOs.EnrollmentResponse> getEnrollmentsForTraining(Long trainingId) {
                Training training = findById(trainingId);
                return enrollmentRepo.findByTraining(training).stream()
                                .map(this::toEnrollmentResponse)
                                .collect(Collectors.toList());
        }

        @Transactional
        public TrainingDTOs.EnrollmentResponse enroll(
                        Long trainingId, Long employeeId) {

                Training training = findById(trainingId);
                Employee employee = employeeService.findById(employeeId);

                if (enrollmentRepo.existsByTrainingAndEmployee(
                                training, employee)) {
                        throw new IllegalStateException(
                                        "Employee already enrolled in this training");
                }
                if (training.getMaxParticipants() != null &&
                                enrollmentRepo.findByTraining(training).size() >= training.getMaxParticipants()) {
                        throw new IllegalStateException("Training is full");
                }

                TrainingEnrollment enrollment = TrainingEnrollment.builder()
                                .training(training)
                                .employee(employee)
                                .status(EnrollmentStatus.ENROLLED)
                                .completed(false)
                                .build();

                TrainingEnrollment saved = enrollmentRepo.save(enrollment);

                // ✅ Notify employee
                notificationService.createAndSend(
                                employee,
                                "Training Enrollment Confirmed",
                                "You have been enrolled in "
                                                + training.getTitle()
                                                + " starting " + training.getStartDate() + ".",
                                NotificationType.TRAINING_ENROLLED,
                                "TRAINING",
                                training.getId());

                // ✅ Notify all admins/HR
                notificationService.notifyAllAdmins(
                                "New Training Enrollment",
                                employee.getFirstName() + " "
                                                + employee.getLastName()
                                                + " enrolled in " + training.getTitle() + ".",
                                NotificationType.TRAINING_ENROLLED,
                                "TRAINING",
                                training.getId());

                return toEnrollmentResponse(saved);
        }

        @Transactional
        public TrainingDTOs.EnrollmentResponse markComplete(
                        Long enrollmentId,
                        TrainingDTOs.CompleteRequest req) {

                TrainingEnrollment enrollment = enrollmentRepo
                                .findById(enrollmentId)
                                .orElseThrow(() -> new NoSuchElementException(
                                                "Enrollment not found: " + enrollmentId));

                enrollment.setCompleted(true);
                enrollment.setStatus(EnrollmentStatus.COMPLETED);
                enrollment.setScore(req.getScore());
                enrollment.setCertificateUrl(req.getCertificateUrl());
                enrollment.setFeedback(req.getFeedback());
                enrollment.setCompletedAt(LocalDateTime.now());

                TrainingEnrollment saved = enrollmentRepo.save(enrollment);

                // ✅ Notify employee
                notificationService.createAndSend(
                                enrollment.getEmployee(),
                                "Training Completed",
                                "Congratulations! You have completed "
                                                + enrollment.getTraining().getTitle()
                                                + ". Score: " + req.getScore() + "/100.",
                                NotificationType.TRAINING_COMPLETED,
                                "TRAINING",
                                enrollment.getTraining().getId());

                // ✅ Notify all admins/HR
                notificationService.notifyAllAdmins(
                                "Training Completed",
                                enrollment.getEmployee().getFirstName() + " "
                                                + enrollment.getEmployee().getLastName()
                                                + " completed "
                                                + enrollment.getTraining().getTitle()
                                                + " with score " + req.getScore() + "/100.",
                                NotificationType.TRAINING_COMPLETED,
                                "TRAINING",
                                enrollment.getTraining().getId());

                return toEnrollmentResponse(saved);
        }

        @Transactional(readOnly = true)
        public Page<TrainingDTOs.EnrollmentResponse> getMyTrainings(
                        Long employeeId, Pageable pageable) {
                Employee emp = employeeService.findById(employeeId);
                return enrollmentRepo.findByEmployee(emp, pageable)
                                .map(this::toEnrollmentResponse);
        }

        private Training findById(Long id) {
                return trainingRepo.findById(id)
                                .orElseThrow(() -> new NoSuchElementException(
                                                "Training not found: " + id));
        }

        private TrainingDTOs.Response toResponse(Training t) {
                TrainingDTOs.Response r = new TrainingDTOs.Response();
                r.setId(t.getId());
                r.setTitle(t.getTitle());
                r.setDescription(t.getDescription());
                r.setCategory(t.getCategory());
                r.setTrainer(t.getTrainer());
                r.setMode(t.getMode());
                r.setStartDate(t.getStartDate());
                r.setEndDate(t.getEndDate());
                r.setDurationHours(t.getDurationHours());
                r.setMaxParticipants(t.getMaxParticipants());
                r.setEnrolledCount(t.getEnrollments().size());
                r.setVenue(t.getVenue());
                r.setMeetingLink(t.getMeetingLink());
                r.setStatus(t.getStatus());
                r.setCreatedAt(t.getCreatedAt());
                return r;
        }

        private TrainingDTOs.EnrollmentResponse toEnrollmentResponse(
                        TrainingEnrollment e) {
                TrainingDTOs.EnrollmentResponse r = new TrainingDTOs.EnrollmentResponse();
                r.setId(e.getId());
                r.setTrainingId(e.getTraining().getId());
                r.setTrainingTitle(e.getTraining().getTitle());
                r.setEmployeeId(e.getEmployee().getId());
                r.setEmployeeName(e.getEmployee().getFirstName()
                                + " " + e.getEmployee().getLastName());
                r.setStatus(e.getStatus());
                r.setCompleted(e.getCompleted());
                r.setScore(e.getScore());
                r.setFeedback(e.getFeedback());
                r.setEnrolledAt(e.getEnrolledAt());
                r.setCompletedAt(e.getCompletedAt());
                return r;
        }
}