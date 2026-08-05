package com.hrms.repository;

import com.hrms.entity.LeaveRequest;
import com.hrms.entity.LeaveRequest.ApprovalStage;
import com.hrms.entity.Employee;
import com.hrms.enums.LeaveStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;

public interface LeaveRequestRepository
        extends JpaRepository<LeaveRequest, Long> {

    @org.springframework.data.jpa.repository.EntityGraph(attributePaths = {"employee", "manager", "approvedBy"})
    java.util.Optional<LeaveRequest> findById(Long id);
    @org.springframework.data.jpa.repository.EntityGraph(attributePaths = {"employee", "manager", "approvedBy"})
    Page<LeaveRequest> findByEmployee(
            Employee emp, Pageable pageable);

    @org.springframework.data.jpa.repository.EntityGraph(attributePaths = {"employee", "manager", "approvedBy"})
    Page<LeaveRequest> findByStatus(
            LeaveStatus status, Pageable pageable);

    @org.springframework.data.jpa.repository.EntityGraph(attributePaths = {"employee", "manager", "approvedBy"})
    Page<LeaveRequest> findByStatusIn(
            List<LeaveStatus> statuses, Pageable pageable);


    @org.springframework.data.jpa.repository.EntityGraph(attributePaths = {"employee", "manager", "approvedBy"})
    Page<LeaveRequest> findByApprovalStageIn(
            List<ApprovalStage> stages, Pageable pageable);

    @Query("SELECT l FROM LeaveRequest l WHERE " +
            "l.employee = :employee")
    List<LeaveRequest> findAllByEmployee(
            Employee employee);

    @Query("SELECT COALESCE(SUM(l.totalDays), 0) FROM LeaveRequest l WHERE l.employee = :employee AND l.leaveType = :leaveType AND l.status = 'PENDING'")
    int sumPendingDaysByEmployeeAndLeaveType(Employee employee, String leaveType);
}