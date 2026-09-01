package com.hrms.controller;

import com.hrms.dto.ApiResponse;
import com.hrms.dto.LeaveDTOs;
import com.hrms.entity.Employee;
import com.hrms.enums.LeaveStatus;
import com.hrms.service.LeaveBalanceService;
import com.hrms.service.LeaveService;

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
@RequestMapping("/api/leaves")
@RequiredArgsConstructor
@Tag(name = "Leave Management")
public class LeaveController {

    private final LeaveService leaveService;

    private final LeaveBalanceService leaveBalanceService;


    /*
     * ============================================================
     * APPLY LEAVE
     * ============================================================
     */
    @PostMapping("/apply")
    @Operation(
            summary = "Apply for leave — goes straight into the shared Admin/HR queue"
    )
    public ResponseEntity<ApiResponse<LeaveDTOs.Response>> apply(
            @AuthenticationPrincipal Employee emp,
            @Valid @RequestBody LeaveDTOs.CreateRequest req
    ) {

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(
                        ApiResponse.success(
                                "Leave applied",
                                leaveService.applyLeave(
                                        emp.getId(),
                                        req
                                )
                        )
                );
    }


    /*
     * ============================================================
     * EMPLOYEE - MY LEAVES
     * ============================================================
     */
    @GetMapping("/my")
    @Operation(summary = "Get my leave history")
    public ResponseEntity<ApiResponse<Page<LeaveDTOs.Response>>> myLeaves(
            @AuthenticationPrincipal Employee emp,

            @RequestParam(defaultValue = "0")
            int page,

            @RequestParam(defaultValue = "10")
            int size
    ) {

        return ResponseEntity.ok(
                ApiResponse.success(
                        "Leave history",

                        leaveService.getMyLeaves(
                                emp.getId(),

                                PageRequest.of(
                                        page,
                                        size,
                                        Sort.by("appliedAt").descending()
                                )
                        )
                )
        );
    }


    /*
     * ============================================================
     * EMPLOYEE - DELETE ONE OWN LEAVE
     * ============================================================
     *
     * DELETE:
     *
     * /api/leaves/my/{id}
     *
     * Employee can delete ONLY their own leave.
     */
    @DeleteMapping("/my/{id}")
    @Operation(summary = "Delete one of my leave requests")
    public ResponseEntity<ApiResponse<Void>> deleteMyLeave(
            @PathVariable Long id,
            @AuthenticationPrincipal Employee emp
    ) {

        leaveService.deleteMyLeave(
                id,
                emp.getId()
        );

        return ResponseEntity.ok(
                ApiResponse.success(
                        "Leave deleted successfully",
                        null
                )
        );
    }


    /*
     * ============================================================
     * EMPLOYEE - CLEAR ALL OWN LEAVES
     * ============================================================
     *
     * DELETE:
     *
     * /api/leaves/my
     *
     * IMPORTANT:
     * Only the logged-in employee's leaves are deleted.
     */
    @DeleteMapping("/my")
    @Operation(summary = "Delete all of my leave requests")
    public ResponseEntity<ApiResponse<Void>> deleteAllMyLeaves(
            @AuthenticationPrincipal Employee emp
    ) {

        leaveService.deleteAllMyLeaves(
                emp.getId()
        );

        return ResponseEntity.ok(
                ApiResponse.success(
                        "All your leave requests deleted successfully",
                        null
                )
        );
    }


    /*
     * ============================================================
     * ADMIN / HR - GET ALL LEAVES
     * ============================================================
     */
    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN','HR')")
    @Operation(summary = "Get all leave requests")
    public ResponseEntity<ApiResponse<Page<LeaveDTOs.Response>>> all(
            @RequestParam(defaultValue = "0")
            int page,

            @RequestParam(defaultValue = "10")
            int size
    ) {

        return ResponseEntity.ok(
                ApiResponse.success(
                        "All leaves",

                        leaveService.getAllLeaves(
                                PageRequest.of(
                                        page,
                                        size,
                                        Sort.by("appliedAt").descending()
                                )
                        )
                )
        );
    }


    /*
     * ============================================================
     * ADMIN / HR - PENDING
     * ============================================================
     */
    @GetMapping("/pending")
    @PreAuthorize("hasAnyRole('ADMIN','HR')")
    @Operation(
            summary = "Get leaves awaiting approval — shared queue for Admin and HR"
    )
    public ResponseEntity<ApiResponse<Page<LeaveDTOs.Response>>> pending(
            @RequestParam(defaultValue = "0")
            int page,

            @RequestParam(defaultValue = "10")
            int size
    ) {

        return ResponseEntity.ok(
                ApiResponse.success(
                        "Pending leaves",

                        leaveService.getPendingLeaves(
                                PageRequest.of(page, size)
                        )
                )
        );
    }


    /*
     * ============================================================
     * ADMIN / HR - APPROVE / REJECT
     * ============================================================
     */
    @PutMapping("/{id}/action")
    @PreAuthorize("hasAnyRole('ADMIN','HR')")
    @Operation(
            summary = "Approve or reject a pending leave"
    )
    public ResponseEntity<ApiResponse<LeaveDTOs.Response>> action(
            @PathVariable Long id,

            @AuthenticationPrincipal Employee reviewer,

            @Valid
            @RequestBody LeaveDTOs.ActionRequest req
    ) {

        return ResponseEntity.ok(
                ApiResponse.success(
                        "Leave request updated",

                        leaveService.action(
                                id,
                                reviewer.getId(),
                                req
                        )
                )
        );
    }


    /*
     * ============================================================
     * ADMIN / HR - DELETE ONE LEAVE
     * ============================================================
     *
     * DELETE:
     *
     * /api/leaves/{id}
     *
     * Used for the delete icon in:
     *
     * Pending
     * Approved
     * Rejected
     * Cancellation
     */
    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','HR')")
    @Operation(summary = "Delete one leave request")
    public ResponseEntity<ApiResponse<Void>> deleteLeave(
            @PathVariable Long id
    ) {

        leaveService.deleteLeave(id);

        return ResponseEntity.ok(
                ApiResponse.success(
                        "Leave deleted successfully",
                        null
                )
        );
    }


    /*
     * ============================================================
     * ADMIN / HR - CLEAR ONE STATUS
     * ============================================================
     *
     * DELETE:
     *
     * /api/leaves/clear/{status}
     *
     * Examples:
     *
     * /api/leaves/clear/PENDING
     * /api/leaves/clear/APPROVED
     * /api/leaves/clear/REJECTED
     * /api/leaves/clear/CANCELLATION_PENDING
     */
    @DeleteMapping("/clear/{status}")
    @PreAuthorize("hasAnyRole('ADMIN','HR')")
    @Operation(
            summary = "Clear all leave requests belonging to one status"
    )
    public ResponseEntity<ApiResponse<Void>> clearAllLeaves(
            @PathVariable LeaveStatus status
    ) {

        leaveService.clearAllLeaves(status);

        return ResponseEntity.ok(
                ApiResponse.success(
                        "All " + status + " leaves deleted successfully",
                        null
                )
        );
    }


    /*
     * ============================================================
     * EMPLOYEE - REQUEST CANCELLATION
     * ============================================================
     */
    @PutMapping("/{id}/cancel")
    @Operation(
            summary = "Request to cancel own leave"
    )
    public ResponseEntity<ApiResponse<LeaveDTOs.Response>> cancel(
            @PathVariable Long id,

            @AuthenticationPrincipal Employee emp,

            @RequestBody(required = false)
            LeaveDTOs.CancelRequest req
    ) {

        return ResponseEntity.ok(
                ApiResponse.success(
                        "Cancellation processed",

                        leaveService.requestCancellation(
                                id,
                                emp.getId(),
                                req
                        )
                )
        );
    }


    /*
     * ============================================================
     * ADMIN / HR - CONFIRM / DENY CANCELLATION
     * ============================================================
     */
    @PutMapping("/{id}/cancel-action")
    @PreAuthorize("hasAnyRole('ADMIN','HR')")
    @Operation(
            summary = "Confirm or deny a pending cancellation"
    )
    public ResponseEntity<ApiResponse<LeaveDTOs.Response>> cancelAction(
            @PathVariable Long id,

            @AuthenticationPrincipal Employee reviewer,

            @Valid
            @RequestBody LeaveDTOs.CancelActionRequest req
    ) {

        return ResponseEntity.ok(
                ApiResponse.success(
                        "Cancellation decision recorded",

                        leaveService.cancelAction(
                                id,
                                reviewer.getId(),
                                req
                        )
                )
        );
    }


    /*
     * ============================================================
     * ADMIN / HR - PENDING CANCELLATIONS
     * ============================================================
     */
    @GetMapping("/pending-cancellations")
    @PreAuthorize("hasAnyRole('ADMIN','HR')")
    @Operation(
            summary = "Get leaves awaiting cancellation confirmation"
    )
    public ResponseEntity<ApiResponse<Page<LeaveDTOs.Response>>> pendingCancellations(
            @RequestParam(defaultValue = "0")
            int page,

            @RequestParam(defaultValue = "10")
            int size
    ) {

        return ResponseEntity.ok(
                ApiResponse.success(
                        "Pending cancellations",

                        leaveService.getPendingCancellations(
                                PageRequest.of(page, size)
                        )
                )
        );
    }


    /*
     * ============================================================
     * EMPLOYEE - LEAVE BALANCE
     * ============================================================
     */
    @GetMapping("/balance")
    @Operation(
            summary = "Get my leave balances for current year"
    )
    public ResponseEntity<ApiResponse<List<LeaveDTOs.BalanceResponse>>> myBalance(
            @AuthenticationPrincipal Employee emp
    ) {

        return ResponseEntity.ok(
                ApiResponse.success(
                        "Leave balance",

                        leaveBalanceService.getAllBalances(emp)
                )
        );
    }
}