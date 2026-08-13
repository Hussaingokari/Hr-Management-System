package com.hrms.repository;

import com.hrms.entity.Employee;
import com.hrms.entity.LeaveRequest;
import com.hrms.enums.LeaveStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface LeaveRequestRepository
                extends JpaRepository<LeaveRequest, Long> {

        /*
         * Employee leave history
         */
        @EntityGraph(attributePaths = {
                        "employee",
                        "reviewedBy",
                        "cancellationReviewedBy"
        })
        Page<LeaveRequest> findByEmployee(
                        Employee emp,
                        Pageable pageable);

        /*
         * Admin / HR - pending leaves
         */
        @EntityGraph(attributePaths = {
                        "employee",
                        "reviewedBy",
                        "cancellationReviewedBy"
        })
        Page<LeaveRequest> findByStatus(
                        LeaveStatus status,
                        Pageable pageable);

        /*
         * Find leaves by multiple statuses
         */
        @EntityGraph(attributePaths = {
                        "employee",
                        "reviewedBy",
                        "cancellationReviewedBy"
        })
        Page<LeaveRequest> findByStatusIn(
                        List<LeaveStatus> statuses,
                        Pageable pageable);

        /*
         * Get all leaves belonging to an employee
         */
        @Query("""
                        SELECT l
                        FROM LeaveRequest l
                        WHERE l.employee = :employee
                        """)
        List<LeaveRequest> findAllByEmployee(
                        Employee employee);

        /*
         * Calculate pending leave days for an employee and leave type.
         */
        @Query("""
                        SELECT COALESCE(SUM(l.totalDays), 0)
                        FROM LeaveRequest l
                        WHERE l.employee = :employee
                        AND l.leaveType = :leaveType
                        AND l.status = 'PENDING'
                        """)
        int sumPendingDaysByEmployeeAndLeaveType(
                        Employee employee,
                        String leaveType);

        /*
         * Dedicated query for APPROVE / REJECT.
         */
        @Query("""
                        SELECT l
                        FROM LeaveRequest l
                        JOIN FETCH l.employee
                        WHERE l.id = :id
                        """)
        Optional<LeaveRequest> findByIdForAction(
                        @Param("id") Long id);

        /*
         * ============================================================
         * CHECK FOR OVERLAPPING LEAVE DATES
         * ============================================================
         *
         * Returns true when the employee already has a leave request
         * whose dates overlap with the newly requested dates.
         *
         * Rejected and cancelled leaves are ignored because those
         * dates become available again.
         */
        @Query("""
                        SELECT COUNT(l) > 0
                        FROM LeaveRequest l
                        WHERE l.employee = :employee
                        AND l.startDate <= :endDate
                        AND l.endDate >= :startDate
                        AND l.status NOT IN (
                            com.hrms.enums.LeaveStatus.REJECTED,
                            com.hrms.enums.LeaveStatus.CANCELLED
                        )
                        """)
        boolean existsOverlappingLeave(
                        @Param("employee") Employee employee,
                        @Param("startDate") LocalDate startDate,
                        @Param("endDate") LocalDate endDate);
}