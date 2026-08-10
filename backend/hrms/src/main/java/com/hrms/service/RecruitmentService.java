package com.hrms.service;

import com.hrms.dto.RecruitmentDTOs;
import com.hrms.entity.Employee;
import com.hrms.entity.JobApplication;
import com.hrms.entity.JobApplication.ApplicationStatus;
import com.hrms.entity.JobPosting;
import com.hrms.entity.JobPosting.PostingStatus;
import com.hrms.repository.JobApplicationRepository;
import com.hrms.repository.JobPostingRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.NoSuchElementException;

@Service
@RequiredArgsConstructor
public class RecruitmentService {

    private final JobPostingRepository jobPostingRepo;
    private final JobApplicationRepository applicationRepo;
    private final EmployeeService employeeService;

    @Transactional
    public RecruitmentDTOs.JobResponse createJob(Long creatorId, RecruitmentDTOs.CreateJobRequest req) {
        Employee creator = employeeService.findById(creatorId);
        JobPosting job = JobPosting.builder()
                .title(req.getTitle())
                .department(req.getDepartment())
                .location(req.getLocation())
                .employmentType(req.getEmploymentType())
                .description(req.getDescription())
                .requirements(req.getRequirements())
                .experienceRequired(req.getExperienceRequired())
                .salaryRange(req.getSalaryRange())
                .applicationDeadline(req.getApplicationDeadline())
                .status(PostingStatus.OPEN)
                .createdBy(creator)
                .build();
        return toJobResponse(jobPostingRepo.save(job));
    }

    @Transactional
    public RecruitmentDTOs.JobResponse updateJob(Long jobId, RecruitmentDTOs.UpdateJobRequest req) {
        JobPosting job = findJobById(jobId);
        if (req.getTitle() != null)
            job.setTitle(req.getTitle());
        if (req.getDescription() != null)
            job.setDescription(req.getDescription());
        if (req.getRequirements() != null)
            job.setRequirements(req.getRequirements());
        if (req.getSalaryRange() != null)
            job.setSalaryRange(req.getSalaryRange());
        if (req.getApplicationDeadline() != null)
            job.setApplicationDeadline(req.getApplicationDeadline());
        if (req.getStatus() != null)
            job.setStatus(req.getStatus());
        return toJobResponse(jobPostingRepo.save(job));
    }

    @Transactional(readOnly = true)
    public Page<RecruitmentDTOs.JobResponse> getAllJobs(Pageable pageable) {
        return jobPostingRepo.findAll(pageable).map(this::toJobResponse);
    }

    @Transactional(readOnly = true)
    public Page<RecruitmentDTOs.JobResponse> getOpenJobs(Pageable pageable) {
        return jobPostingRepo.findByStatus(PostingStatus.OPEN, pageable).map(this::toJobResponse);
    }

    @Transactional(readOnly = true)
    public RecruitmentDTOs.JobResponse getJobById(Long id) {
        JobPosting job = findJobById(id);
        return toJobResponse(job);
    }

    @Transactional
    public RecruitmentDTOs.ApplicationResponse applyForJob(Long jobId,
            RecruitmentDTOs.ApplyRequest req) {
        JobPosting job = findJobById(jobId);
        if (job.getStatus() != PostingStatus.OPEN) {
            throw new IllegalStateException("This job is not accepting applications");
        }

        JobApplication app = JobApplication.builder()
                .jobPosting(job)
                .candidateName(req.getCandidateName())
                .candidateEmail(req.getCandidateEmail())
                .candidatePhone(req.getCandidatePhone())
                .resumeUrl(req.getResumeUrl())
                .coverLetter(req.getCoverLetter())
                .experienceYears(req.getExperienceYears())
                .experienceMonths(req.getExperienceMonths())
                .currentCompany(req.getCurrentCompany())
                .currentDesignation(req.getCurrentDesignation())
                .status(ApplicationStatus.APPLIED)
                .build();

        return toApplicationResponse(applicationRepo.save(app));
    }

    @Transactional
    public RecruitmentDTOs.ApplicationResponse referCandidate(
            Long jobId,
            Long employeeId,
            RecruitmentDTOs.ReferralRequest req) {

        JobPosting job = findJobById(jobId);

        if (job.getStatus() != PostingStatus.OPEN) {
            throw new IllegalStateException("This job is not accepting referrals");
        }

        Employee employee = employeeService.findById(employeeId);

        JobApplication app = JobApplication.builder()
                .jobPosting(job)
                .candidateName(req.getCandidateName())
                .candidateEmail(req.getCandidateEmail())
                .candidatePhone(req.getCandidatePhone())
                .resumeUrl(req.getResumeUrl())
                .experienceYears(req.getExperienceYears())
                .experienceMonths(req.getExperienceMonths())
                .referredBy(employee)
                .status(ApplicationStatus.APPLIED)
                .build();

        return toApplicationResponse(applicationRepo.save(app));
    }

    @Transactional
    public RecruitmentDTOs.ApplicationResponse updateApplication(Long appId,
            RecruitmentDTOs.UpdateApplicationRequest req) {
        JobApplication app = findAppById(appId);
        if (req.getStatus() != null)
            app.setStatus(req.getStatus());
        if (req.getInterviewDate() != null)
            app.setInterviewDate(req.getInterviewDate());
        if (req.getInterviewMode() != null)
            app.setInterviewMode(req.getInterviewMode());
        if (req.getInterviewNotes() != null)
            app.setInterviewNotes(req.getInterviewNotes());
        if (req.getInterviewScore() != null)
            app.setInterviewScore(req.getInterviewScore());
        if (req.getRejectionReason() != null)
            app.setRejectionReason(req.getRejectionReason());
        if (req.getInterviewerId() != null) {
            app.setInterviewer(employeeService.findById(req.getInterviewerId()));
        }
        return toApplicationResponse(applicationRepo.save(app));
    }

    @Transactional(readOnly = true)
    public Page<RecruitmentDTOs.ApplicationResponse> getApplicationsForJob(Long jobId, Pageable pageable) {
        JobPosting job = findJobById(jobId);
        return applicationRepo.findByJobPosting(job, pageable).map(this::toApplicationResponse);
    }

    @Transactional(readOnly = true)
    public Page<RecruitmentDTOs.ApplicationResponse> getMyReferrals(
            Long employeeId, Pageable pageable) {

        Employee employee = employeeService.findById(employeeId);

        return applicationRepo
                .findByReferredBy(employee, pageable)
                .map(this::toApplicationResponse);
    }

    private JobPosting findJobById(Long id) {
        return jobPostingRepo.findById(id)
                .orElseThrow(() -> new NoSuchElementException("Job posting not found: " + id));
    }

    private JobApplication findAppById(Long id) {
        return applicationRepo.findById(id)
                .orElseThrow(() -> new NoSuchElementException("Application not found: " + id));
    }

    private RecruitmentDTOs.JobResponse toJobResponse(JobPosting j) {
        RecruitmentDTOs.JobResponse r = new RecruitmentDTOs.JobResponse();
        r.setId(j.getId());
        r.setTitle(j.getTitle());
        r.setDepartment(j.getDepartment());
        r.setLocation(j.getLocation());
        r.setEmploymentType(j.getEmploymentType());
        r.setDescription(j.getDescription());
        r.setRequirements(j.getRequirements());
        r.setExperienceRequired(j.getExperienceRequired());
        r.setSalaryRange(j.getSalaryRange());
        r.setApplicationDeadline(j.getApplicationDeadline());
        r.setStatus(j.getStatus());
        r.setApplicationCount((int) applicationRepo.countByJobPosting(j));
        r.setCreatedAt(j.getCreatedAt());
        return r;
    }

    private RecruitmentDTOs.ApplicationResponse toApplicationResponse(JobApplication a) {
        RecruitmentDTOs.ApplicationResponse r = new RecruitmentDTOs.ApplicationResponse();
        r.setId(a.getId());
        r.setJobPostingId(a.getJobPosting().getId());
        r.setJobTitle(a.getJobPosting().getTitle());
        r.setDepartment(a.getJobPosting().getDepartment());
        r.setCandidateName(a.getCandidateName());
        r.setCandidateEmail(a.getCandidateEmail());
        if (a.getReferredBy() != null) {
            r.setReferredByName(
                    a.getReferredBy().getFirstName() + " " + a.getReferredBy().getLastName());
        }
        r.setCandidatePhone(a.getCandidatePhone());
        r.setResumeUrl(a.getResumeUrl());
        r.setExperienceYears(a.getExperienceYears());
        r.setExperienceMonths(a.getExperienceMonths()); // <-- ADDED: was never mapped
        r.setCurrentCompany(a.getCurrentCompany());
        r.setStatus(a.getStatus());
        r.setInterviewDate(a.getInterviewDate());
        r.setInterviewMode(a.getInterviewMode());
        r.setInterviewScore(a.getInterviewScore());
        if (a.getInterviewer() != null) {
            r.setInterviewerName(a.getInterviewer().getFirstName() + " " + a.getInterviewer().getLastName());
        }
        r.setRejectionReason(a.getRejectionReason());
        r.setAppliedAt(a.getAppliedAt());
        return r;
    }
}