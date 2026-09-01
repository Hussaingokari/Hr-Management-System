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
     * ============================================================
     * EMPLOYEE LEAVE HISTORY
     * ============================================================
     */
    @EntityGraph(attributePaths = {
            "employee",
            "reviewedBy",
            "cancellationReviewedBy"
    })
    Page<LeaveRequest> findByEmployee(
            Employee employee,
            Pageable pageable
    );


    /*
     * ============================================================
     * GET ALL LEAVES OF ONE EMPLOYEE
     * ============================================================
     *
     * Used by Employee "Clear All".
     *
     * IMPORTANT:
     * This returns only the logged-in employee's leaves.
     */
    @EntityGraph(attributePaths = {
            "employee",
            "reviewedBy",
            "cancellationReviewedBy"
    })
    List<LeaveRequest> findAllByEmployee(
            Employee employee
    );


    /*
     * ============================================================
     * ADMIN / HR - LEAVES BY STATUS
     * ============================================================
     */
    @EntityGraph(attributePaths = {
            "employee",
            "reviewedBy",
            "cancellationReviewedBy"
    })
    Page<LeaveRequest> findByStatus(
            LeaveStatus status,
            Pageable pageable
    );


    /*
     * ============================================================
     * FIND LEAVES BY MULTIPLE STATUSES
     * ============================================================
     */
    @EntityGraph(attributePaths = {
            "employee",
            "reviewedBy",
            "cancellationReviewedBy"
    })
    Page<LeaveRequest> findByStatusIn(
            List<LeaveStatus> statuses,
            Pageable pageable
    );


    /*
     * ============================================================
     * FIND ALL LEAVES BY STATUS
     * ============================================================
     *
     * Used by Admin/HR "Clear All" for a particular tab.
     *
     * Example:
     *
     * PENDING
     * APPROVED
     * REJECTED
     * CANCELLATION_PENDING
     */
    @EntityGraph(attributePaths = {
            "employee",
            "reviewedBy",
            "cancellationReviewedBy"
    })
    List<LeaveRequest> findAllByStatus(
            LeaveStatus status
    );


    /*
     * ============================================================
     * GET ALL LEAVES BELONGING TO AN EMPLOYEE
     * ============================================================
     */
    @Query("""
            SELECT l
            FROM LeaveRequest l
            WHERE l.employee = :employee
            """)
    List<LeaveRequest> findAllLeavesByEmployee(
            @Param("employee") Employee employee
    );


    /*
     * ============================================================
     * CALCULATE PENDING LEAVE DAYS
     * ============================================================
     */
    @Query("""
            SELECT COALESCE(SUM(l.totalDays), 0)
            FROM LeaveRequest l
            WHERE l.employee = :employee
            AND l.leaveType = :leaveType
            AND l.status = 'PENDING'
            """)
    int sumPendingDaysByEmployeeAndLeaveType(
            @Param("employee") Employee employee,
            @Param("leaveType") String leaveType
    );


    /*
     * ============================================================
     * FIND LEAVE FOR APPROVE / REJECT ACTION
     * ============================================================
     */
    @Query("""
            SELECT l
            FROM LeaveRequest l
            JOIN FETCH l.employee
            WHERE l.id = :id
            """)
    Optional<LeaveRequest> findByIdForAction(
            @Param("id") Long id
    );


    /*
     * ============================================================
     * CHECK FOR OVERLAPPING LEAVE DATES
     * ============================================================
     *
     * Rejected and cancelled leaves are ignored.
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
            @Param("endDate") LocalDate endDate
    );
}