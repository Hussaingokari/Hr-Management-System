package com.hrms.repository;

import com.hrms.entity.LeaveRequest;
import com.hrms.entity.Employee;
import com.hrms.enums.LeaveStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;

public interface LeaveRequestRepository
                extends JpaRepository<LeaveRequest, Long> {

        @EntityGraph(attributePaths = { "employee", "reviewedBy", "cancellationReviewedBy" })
        Page<LeaveRequest> findByEmployee(
                        Employee emp, Pageable pageable);

        @EntityGraph(attributePaths = { "employee", "reviewedBy", "cancellationReviewedBy" })
        Page<LeaveRequest> findByStatus(
                        LeaveStatus status, Pageable pageable);

        @EntityGraph(attributePaths = { "employee", "reviewedBy", "cancellationReviewedBy" })
        Page<LeaveRequest> findByStatusIn(
                        List<LeaveStatus> statuses, Pageable pageable);

        @Query("SELECT l FROM LeaveRequest l WHERE l.employee = :employee")
        List<LeaveRequest> findAllByEmployee(Employee employee);

        @Query("SELECT COALESCE(SUM(l.totalDays), 0) FROM LeaveRequest l " +
                        "WHERE l.employee = :employee AND l.leaveType = :leaveType AND l.status = 'PENDING'")
        int sumPendingDaysByEmployeeAndLeaveType(Employee employee, String leaveType);
}