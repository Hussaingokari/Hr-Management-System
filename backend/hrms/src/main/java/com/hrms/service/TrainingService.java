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

        // ============================================================
        // CREATE TRAINING
        // ============================================================

        @Transactional
        public TrainingDTOs.Response createTraining(
                        TrainingDTOs.CreateRequest req) {

                validateDates(
                                req.getStartDate(),
                                req.getEndDate());

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

        // ============================================================
        // UPDATE / EDIT TRAINING
        // ============================================================

        @Transactional
        public TrainingDTOs.Response updateTraining(
                        Long id,
                        TrainingDTOs.UpdateRequest req) {

                Training training = findById(id);

                updateTrainingFields(training, req);

                /*
                 * Do not allow normal editing to accidentally change
                 * a cancelled training back to active.
                 *
                 * Re-opening is handled separately.
                 */
                if (training.getStatus() == TrainingStatus.CANCELLED) {
                        throw new IllegalStateException(
                                        "Cancelled training must be re-opened using the Re-open action");
                }

                return toResponse(
                                trainingRepo.save(training));
        }

        // ============================================================
        // UPDATE STATUS
        // ============================================================

        @Transactional
        public TrainingDTOs.Response updateStatus(
                        Long id,
                        String statusStr) {

                Training training = findById(id);

                if (statusStr == null || statusStr.isBlank()) {
                        throw new IllegalArgumentException(
                                        "Training status is required");
                }

                TrainingStatus status;

                try {
                        status = TrainingStatus.valueOf(
                                        statusStr.toUpperCase());
                } catch (IllegalArgumentException e) {
                        throw new IllegalArgumentException(
                                        "Invalid training status: " + statusStr);
                }

                // --------------------------------------------------------
                // Cancellation
                // --------------------------------------------------------

                if (status == TrainingStatus.CANCELLED) {

                        if (training.getStatus() == TrainingStatus.COMPLETED) {
                                throw new IllegalStateException(
                                                "Completed training cannot be cancelled");
                        }

                        training.setStatus(TrainingStatus.CANCELLED);
                }

                // --------------------------------------------------------
                // Prevent using status API to re-open
                // --------------------------------------------------------

                else if (status == TrainingStatus.UPCOMING) {

                        if (training.getStatus() == TrainingStatus.CANCELLED) {
                                throw new IllegalStateException(
                                                "Use the Re-open action to re-open a cancelled training");
                        }

                        training.setStatus(TrainingStatus.UPCOMING);
                }

                else {
                        training.setStatus(status);
                }

                return toResponse(
                                trainingRepo.save(training));
        }

        // ============================================================
        // RE-OPEN TRAINING
        // ============================================================

        @Transactional
        public TrainingDTOs.Response reopenTraining(
                        Long id,
                        TrainingDTOs.UpdateRequest req) {

                Training training = findById(id);

                if (training.getStatus() != TrainingStatus.CANCELLED) {
                        throw new IllegalStateException(
                                        "Only cancelled trainings can be re-opened");
                }

                updateTrainingFields(training, req);

                validateDates(
                                training.getStartDate(),
                                training.getEndDate());

                /*
                 * Re-opening means:
                 *
                 * CANCELLED
                 * ↓
                 * UPCOMING
                 */
                training.setStatus(
                                TrainingStatus.UPCOMING);

                return toResponse(
                                trainingRepo.save(training));
        }

        // ============================================================
        // DELETE TRAINING PERMANENTLY
        // ============================================================

        @Transactional
        public void deleteTraining(Long id) {

                Training training = findById(id);

                /*
                 * Delete is intentionally allowed only for CANCELLED
                 * trainings.
                 *
                 * This prevents accidental deletion of active,
                 * ongoing or completed training records.
                 */
                if (training.getStatus() != TrainingStatus.CANCELLED) {
                        throw new IllegalStateException(
                                        "Only cancelled trainings can be permanently deleted");
                }

                trainingRepo.delete(training);
        }

        // ============================================================
        // GET ALL TRAININGS
        // ============================================================

        @Transactional(readOnly = true)
        public Page<TrainingDTOs.Response> getAllTrainings(
                        Pageable pageable) {

                return trainingRepo
                                .findAll(pageable)
                                .map(this::toResponse);
        }

        // ============================================================
        // GET TRAINING BY ID
        // ============================================================

        @Transactional(readOnly = true)
        public TrainingDTOs.Response getById(Long id) {

                return toResponse(
                                findById(id));
        }

        // ============================================================
        // GET ENROLLMENTS
        // ============================================================

        @Transactional(readOnly = true)
        public List<TrainingDTOs.EnrollmentResponse> getEnrollmentsForTraining(Long trainingId) {

                Training training = findById(trainingId);

                return enrollmentRepo
                                .findByTraining(training)
                                .stream()
                                .map(this::toEnrollmentResponse)
                                .collect(Collectors.toList());
        }

        // ============================================================
        // ENROLL EMPLOYEE
        // ============================================================

        @Transactional
        public TrainingDTOs.EnrollmentResponse enroll(
                        Long trainingId,
                        Long employeeId) {

                Training training = findById(trainingId);

                // --------------------------------------------------------
                // Do not allow enrollment in cancelled training
                // --------------------------------------------------------

                if (training.getStatus() == TrainingStatus.CANCELLED) {
                        throw new IllegalStateException(
                                        "Cannot enroll in a cancelled training");
                }

                // --------------------------------------------------------
                // Do not allow enrollment in completed training
                // --------------------------------------------------------

                if (training.getStatus() == TrainingStatus.COMPLETED) {
                        throw new IllegalStateException(
                                        "Cannot enroll in a completed training");
                }

                Employee employee = employeeService.findById(employeeId);

                // --------------------------------------------------------
                // Duplicate enrollment
                // --------------------------------------------------------

                if (enrollmentRepo.existsByTrainingAndEmployee(
                                training,
                                employee)) {

                        throw new IllegalStateException(
                                        "Employee already enrolled in this training");
                }

                // --------------------------------------------------------
                // Maximum participants
                // --------------------------------------------------------

                if (training.getMaxParticipants() != null &&
                                enrollmentRepo.findByTraining(training).size() >= training.getMaxParticipants()) {

                        throw new IllegalStateException(
                                        "Training is full");
                }

                TrainingEnrollment enrollment = TrainingEnrollment.builder()
                                .training(training)
                                .employee(employee)
                                .status(EnrollmentStatus.ENROLLED)
                                .completed(false)
                                .build();

                TrainingEnrollment saved = enrollmentRepo.save(enrollment);

                // --------------------------------------------------------
                // Notify employee
                // --------------------------------------------------------

                notificationService.createAndSend(
                                employee,
                                "Training Enrollment Confirmed",
                                "You have been enrolled in "
                                                + training.getTitle()
                                                + " starting "
                                                + training.getStartDate()
                                                + ".",
                                NotificationType.TRAINING_ENROLLED,
                                "TRAINING",
                                training.getId());

                // --------------------------------------------------------
                // Notify admins / HR
                // --------------------------------------------------------

                notificationService.notifyAllAdmins(
                                "New Training Enrollment",
                                employee.getFirstName()
                                                + " "
                                                + employee.getLastName()
                                                + " enrolled in "
                                                + training.getTitle()
                                                + ".",
                                NotificationType.TRAINING_ENROLLED,
                                "TRAINING",
                                training.getId());

                return toEnrollmentResponse(saved);
        }

        // ============================================================
        // MARK ENROLLMENT COMPLETE
        // ============================================================

        @Transactional
        public TrainingDTOs.EnrollmentResponse markComplete(
                        Long enrollmentId,
                        TrainingDTOs.CompleteRequest req) {

                TrainingEnrollment enrollment = enrollmentRepo
                                .findById(enrollmentId)
                                .orElseThrow(
                                                () -> new NoSuchElementException(
                                                                "Enrollment not found: "
                                                                                + enrollmentId));

                enrollment.setCompleted(true);
                enrollment.setStatus(
                                EnrollmentStatus.COMPLETED);
                enrollment.setScore(req.getScore());
                enrollment.setCertificateUrl(
                                req.getCertificateUrl());
                enrollment.setFeedback(
                                req.getFeedback());
                enrollment.setCompletedAt(
                                LocalDateTime.now());

                TrainingEnrollment saved = enrollmentRepo.save(enrollment);

                // --------------------------------------------------------
                // Notify employee
                // --------------------------------------------------------

                notificationService.createAndSend(
                                enrollment.getEmployee(),
                                "Training Completed",
                                "Congratulations! You have completed "
                                                + enrollment.getTraining().getTitle()
                                                + ". Score: "
                                                + req.getScore()
                                                + "/100.",
                                NotificationType.TRAINING_COMPLETED,
                                "TRAINING",
                                enrollment.getTraining().getId());

                // --------------------------------------------------------
                // Notify admins / HR
                // --------------------------------------------------------

                notificationService.notifyAllAdmins(
                                "Training Completed",
                                enrollment.getEmployee().getFirstName()
                                                + " "
                                                + enrollment.getEmployee().getLastName()
                                                + " completed "
                                                + enrollment.getTraining().getTitle()
                                                + " with score "
                                                + req.getScore()
                                                + "/100.",
                                NotificationType.TRAINING_COMPLETED,
                                "TRAINING",
                                enrollment.getTraining().getId());

                return toEnrollmentResponse(saved);
        }

        // ============================================================
        // MY TRAININGS
        // ============================================================

        @Transactional(readOnly = true)
        public Page<TrainingDTOs.EnrollmentResponse> getMyTrainings(
                        Long employeeId,
                        Pageable pageable) {

                Employee emp = employeeService.findById(employeeId);

                return enrollmentRepo
                                .findByEmployee(emp, pageable)
                                .map(this::toEnrollmentResponse);
        }

        // ============================================================
        // HELPER: UPDATE TRAINING FIELDS
        // ============================================================

        private void updateTrainingFields(
                        Training training,
                        TrainingDTOs.UpdateRequest req) {

                if (req.getTitle() != null)
                        training.setTitle(req.getTitle());

                if (req.getDescription() != null)
                        training.setDescription(req.getDescription());

                if (req.getTrainer() != null)
                        training.setTrainer(req.getTrainer());

                if (req.getMode() != null)
                        training.setMode(req.getMode());

                if (req.getStartDate() != null)
                        training.setStartDate(req.getStartDate());

                if (req.getEndDate() != null)
                        training.setEndDate(req.getEndDate());

                if (req.getDurationHours() != null)
                        training.setDurationHours(
                                        req.getDurationHours());

                if (req.getMaxParticipants() != null)
                        training.setMaxParticipants(
                                        req.getMaxParticipants());

                if (req.getVenue() != null)
                        training.setVenue(req.getVenue());

                if (req.getMeetingLink() != null)
                        training.setMeetingLink(
                                        req.getMeetingLink());
        }

        // ============================================================
        // VALIDATE DATES
        // ============================================================

        private void validateDates(
                        java.time.LocalDate startDate,
                        java.time.LocalDate endDate) {

                if (startDate == null || endDate == null) {
                        throw new IllegalArgumentException(
                                        "Start date and end date are required");
                }

                if (endDate.isBefore(startDate)) {
                        throw new IllegalArgumentException(
                                        "End date cannot be before start date");
                }
        }

        // ============================================================
        // FIND BY ID
        // ============================================================

        private Training findById(Long id) {

                return trainingRepo
                                .findById(id)
                                .orElseThrow(
                                                () -> new NoSuchElementException(
                                                                "Training not found: " + id));
        }

        // ============================================================
        // TRAINING RESPONSE
        // ============================================================

        private TrainingDTOs.Response toResponse(
                        Training t) {

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
                r.setMaxParticipants(
                                t.getMaxParticipants());

                r.setEnrolledCount(
                                t.getEnrollments() != null
                                                ? t.getEnrollments().size()
                                                : 0);

                r.setVenue(t.getVenue());
                r.setMeetingLink(t.getMeetingLink());
                r.setStatus(t.getStatus());
                r.setCreatedAt(t.getCreatedAt());

                return r;
        }

        // ============================================================
        // ENROLLMENT RESPONSE
        // ============================================================

        private TrainingDTOs.EnrollmentResponse toEnrollmentResponse(
                        TrainingEnrollment e) {

                TrainingDTOs.EnrollmentResponse r = new TrainingDTOs.EnrollmentResponse();

                r.setId(e.getId());

                r.setTrainingId(
                                e.getTraining().getId());

                r.setTrainingTitle(
                                e.getTraining().getTitle());

                r.setEmployeeId(
                                e.getEmployee().getId());

                r.setEmployeeName(
                                e.getEmployee().getFirstName()
                                                + " "
                                                + e.getEmployee().getLastName());

                r.setStatus(e.getStatus());
                r.setCompleted(e.getCompleted());
                r.setScore(e.getScore());
                r.setFeedback(e.getFeedback());
                r.setEnrolledAt(e.getEnrolledAt());
                r.setCompletedAt(e.getCompletedAt());

                return r;
        }
}