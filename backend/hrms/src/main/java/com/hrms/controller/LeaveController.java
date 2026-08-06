package com.hrms.controller;

import com.hrms.dto.ApiResponse;
import com.hrms.dto.LeaveDTOs;
import com.hrms.entity.Employee;
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

        @PostMapping("/apply")
        @Operation(summary = "Apply for leave — goes straight into the shared Admin/HR queue")
        public ResponseEntity<ApiResponse<LeaveDTOs.Response>> apply(
                        @AuthenticationPrincipal Employee emp,
                        @Valid @RequestBody LeaveDTOs.CreateRequest req) {
                return ResponseEntity.status(HttpStatus.CREATED)
                                .body(ApiResponse.success("Leave applied", leaveService.applyLeave(emp.getId(), req)));
        }

        @GetMapping("/my")
        @Operation(summary = "Get my leave history")
        public ResponseEntity<ApiResponse<Page<LeaveDTOs.Response>>> myLeaves(
                        @AuthenticationPrincipal Employee emp,
                        @RequestParam(defaultValue = "0") int page,
                        @RequestParam(defaultValue = "10") int size) {
                return ResponseEntity.ok(ApiResponse.success("Leave history",
                                leaveService.getMyLeaves(emp.getId(),
                                                PageRequest.of(page, size, Sort.by("appliedAt").descending()))));
        }

        @GetMapping
        @PreAuthorize("hasAnyRole('ADMIN','HR')")
        @Operation(summary = "Get all leave requests")
        public ResponseEntity<ApiResponse<Page<LeaveDTOs.Response>>> all(
                        @RequestParam(defaultValue = "0") int page,
                        @RequestParam(defaultValue = "10") int size) {
                return ResponseEntity.ok(ApiResponse.success("All leaves",
                                leaveService.getAllLeaves(
                                                PageRequest.of(page, size, Sort.by("appliedAt").descending()))));
        }

        @GetMapping("/pending")
        @PreAuthorize("hasAnyRole('ADMIN','HR')")
        @Operation(summary = "Get leaves awaiting approval — shared queue for Admin and HR")
        public ResponseEntity<ApiResponse<Page<LeaveDTOs.Response>>> pending(
                        @RequestParam(defaultValue = "0") int page,
                        @RequestParam(defaultValue = "10") int size) {
                return ResponseEntity.ok(ApiResponse.success("Pending leaves",
                                leaveService.getPendingLeaves(PageRequest.of(page, size))));
        }

        @PutMapping("/{id}/action")
        @PreAuthorize("hasAnyRole('ADMIN','HR')")
        @Operation(summary = "Approve or reject a pending leave. Either Admin or HR can act — first one wins.")
        public ResponseEntity<ApiResponse<LeaveDTOs.Response>> action(
                        @PathVariable Long id,
                        @AuthenticationPrincipal Employee reviewer,
                        @Valid @RequestBody LeaveDTOs.ActionRequest req) {
                return ResponseEntity.ok(ApiResponse.success("Leave request updated",
                                leaveService.action(id, reviewer.getId(), req)));
        }

        // Cancellation workflow

        @PutMapping("/{id}/cancel")
        @Operation(summary = "Request to cancel own leave. Auto-cancels if still pending; " +
                        "requires Admin/HR confirmation if already approved.")
        public ResponseEntity<ApiResponse<LeaveDTOs.Response>> cancel(
                        @PathVariable Long id,
                        @AuthenticationPrincipal Employee emp,
                        @RequestBody(required = false) LeaveDTOs.CancelRequest req) {
                return ResponseEntity.ok(ApiResponse.success("Cancellation processed",
                                leaveService.requestCancellation(id, emp.getId(), req)));
        }

        @PutMapping("/{id}/cancel-action")
        @PreAuthorize("hasAnyRole('ADMIN','HR')")
        @Operation(summary = "Confirm or deny a pending cancellation. Either Admin or HR can act.")
        public ResponseEntity<ApiResponse<LeaveDTOs.Response>> cancelAction(
                        @PathVariable Long id,
                        @AuthenticationPrincipal Employee reviewer,
                        @Valid @RequestBody LeaveDTOs.CancelActionRequest req) {
                return ResponseEntity.ok(ApiResponse.success("Cancellation decision recorded",
                                leaveService.cancelAction(id, reviewer.getId(), req)));
        }

        @GetMapping("/pending-cancellations")
        @PreAuthorize("hasAnyRole('ADMIN','HR')")
        @Operation(summary = "Get leaves awaiting cancellation confirmation")
        public ResponseEntity<ApiResponse<Page<LeaveDTOs.Response>>> pendingCancellations(
                        @RequestParam(defaultValue = "0") int page,
                        @RequestParam(defaultValue = "10") int size) {
                return ResponseEntity.ok(ApiResponse.success("Pending cancellations",
                                leaveService.getPendingCancellations(PageRequest.of(page, size))));
        }

        // Leave Balance
        @GetMapping("/balance")
        @Operation(summary = "Get my leave balances for current year")
        public ResponseEntity<ApiResponse<List<LeaveDTOs.BalanceResponse>>> myBalance(
                        @AuthenticationPrincipal Employee emp) {
                return ResponseEntity.ok(ApiResponse.success("Leave balance",
                                leaveBalanceService.getAllBalances(emp)));
        }
}