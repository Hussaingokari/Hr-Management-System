package com.hrms.repository;

import com.hrms.entity.Employee;
import com.hrms.entity.JobApplication;
import com.hrms.entity.JobApplication.ApplicationStatus;
import com.hrms.entity.JobPosting;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface JobApplicationRepository extends JpaRepository<JobApplication, Long> {

    Page<JobApplication> findByJobPosting(
            JobPosting jobPosting,
            Pageable pageable);

    Page<JobApplication> findByStatus(
            ApplicationStatus status,
            Pageable pageable);

    Page<JobApplication> findByReferredBy(
            Employee referredBy,
            Pageable pageable);

    long countByJobPosting(JobPosting jobPosting);

    // Delete all applications belonging to a job
    void deleteByJobPosting(JobPosting jobPosting);
}