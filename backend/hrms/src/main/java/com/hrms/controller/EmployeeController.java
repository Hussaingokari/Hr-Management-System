package com.hrms.controller;

import com.hrms.dto.ApiResponse;
import com.hrms.dto.EmployeeDTOs;
import com.hrms.service.EmployeeService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/employees")
@RequiredArgsConstructor
@Tag(name = "Employee Management")
public class EmployeeController {

        private final EmployeeService employeeService;

        // ============================================================
        // CREATE EMPLOYEE
        // ============================================================

        @PostMapping
        @PreAuthorize("hasAnyRole('ADMIN','HR')")
        @Operation(summary = "Create new employee")
        public ResponseEntity<ApiResponse<EmployeeDTOs.Response>> create(
                        @Valid @RequestBody EmployeeDTOs.CreateRequest req) {

                EmployeeDTOs.Response employee = employeeService.createEmployee(req);

                return ResponseEntity
                                .status(HttpStatus.CREATED)
                                .body(
                                                ApiResponse.success(
                                                                "Employee created successfully",
                                                                employee));
        }

        // ============================================================
        // GET ALL EMPLOYEES
        // ============================================================

        @GetMapping
        @PreAuthorize("hasAnyRole('ADMIN','HR')")
        @Operation(summary = "Get all employees (paged)")
        public ResponseEntity<ApiResponse<Page<EmployeeDTOs.Response>>> getAll(
                        @RequestParam(required = false) String department,
                        @RequestParam(defaultValue = "0") int page,
                        @RequestParam(defaultValue = "10") int size) {

                Pageable pageable = PageRequest.of(
                                page,
                                size,
                                Sort.by(
                                                Sort.Direction.ASC,
                                                "employeeId"));

                if (department != null
                                && !department.trim().isEmpty()
                                && !department.equalsIgnoreCase(
                                                "All Departments")) {

                        Page<EmployeeDTOs.Response> employees = employeeService.getByDepartment(
                                        department,
                                        pageable);

                        return ResponseEntity.ok(
                                        ApiResponse.success(
                                                        "Employees fetched",
                                                        employees));
                }

                Page<EmployeeDTOs.Response> employees = employeeService.getAllEmployees(pageable);

                return ResponseEntity.ok(
                                ApiResponse.success(
                                                "Employees fetched",
                                                employees));
        }

        // ============================================================
        // GET EMPLOYEE BY ID
        // ============================================================

        @GetMapping("/{id}")
        @Operation(summary = "Get employee by ID")
        public ResponseEntity<ApiResponse<EmployeeDTOs.Response>> getById(
                        @PathVariable Long id) {

                EmployeeDTOs.Response employee = employeeService.getById(id);

                return ResponseEntity.ok(
                                ApiResponse.success(
                                                "Employee found",
                                                employee));
        }

        // ============================================================
        // UPDATE EMPLOYEE
        // ADMIN + HR ONLY
        // ============================================================

        @PutMapping("/{id}")
        @PreAuthorize("hasAnyRole('ADMIN','HR')")
        @Operation(summary = "Update employee")
        public ResponseEntity<ApiResponse<EmployeeDTOs.Response>> update(
                        @PathVariable Long id,
                        @Valid @RequestBody EmployeeDTOs.UpdateRequest req) {

                EmployeeDTOs.Response updatedEmployee = employeeService.updateEmployee(id, req);

                return ResponseEntity.ok(
                                ApiResponse.success(
                                                "Employee updated successfully",
                                                updatedEmployee));
        }

        // ============================================================
        // DELETE EMPLOYEE
        // ADMIN ONLY
        // ============================================================

        @DeleteMapping("/{id}")
        @PreAuthorize("hasRole('ADMIN')")
        @Operation(summary = "Delete employee - Admin only")
        public ResponseEntity<ApiResponse<Void>> delete(
                        @PathVariable Long id) {

                employeeService.deleteEmployee(id);

                return ResponseEntity.ok(
                                ApiResponse.success(
                                                "Employee deleted successfully"));
        }

        // ============================================================
        // SEARCH EMPLOYEES
        // ============================================================

        @GetMapping("/search")
        @Operation(summary = "Search employees")
        public ResponseEntity<ApiResponse<Page<EmployeeDTOs.Response>>> search(
                        @RequestParam String q,
                        @RequestParam(defaultValue = "0") int page,
                        @RequestParam(defaultValue = "10") int size) {

                Pageable pageable = PageRequest.of(
                                page,
                                size,
                                Sort.by(
                                                Sort.Direction.ASC,
                                                "employeeId"));

                Page<EmployeeDTOs.Response> results = employeeService.search(
                                q,
                                pageable);

                return ResponseEntity.ok(
                                ApiResponse.success(
                                                "Search results",
                                                results));
        }

        // ============================================================
        // GET MANAGERS
        // ============================================================

        @GetMapping("/managers")
        @Operation(summary = "Get all managers and HR employees")
        public ResponseEntity<ApiResponse<java.util.List<EmployeeDTOs.Response>>> getManagers() {

                return ResponseEntity.ok(
                                ApiResponse.success(
                                                "Managers fetched",
                                                employeeService.getManagers()));
        }
}