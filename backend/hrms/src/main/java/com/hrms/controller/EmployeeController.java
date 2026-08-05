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

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN','HR')")
    @Operation(summary = "Create new employee")
    public ResponseEntity<ApiResponse<EmployeeDTOs.Response>> create(
            @Valid @RequestBody EmployeeDTOs.CreateRequest req) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Employee created", employeeService.createEmployee(req)));
    }

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
                Sort.by(Sort.Direction.ASC, "employeeId"));

        if (department != null &&
                !department.trim().isEmpty() &&
                !department.equalsIgnoreCase("All Departments")) {

            return ResponseEntity.ok(
                    ApiResponse.success(
                            "Employees fetched",
                            employeeService.getByDepartment(department, pageable)));
        }

        return ResponseEntity.ok(
                ApiResponse.success(
                        "Employees fetched",
                        employeeService.getAllEmployees(pageable)));
    }

    // page=0&size=10 → employees 1-10 (first page)
    // page=1&size=10 → employees 11-20 (second page)
    // page=2&size=10 → employees 21-30 (third page)

    @GetMapping("/{id}")
    @Operation(summary = "Get employee by ID")
    public ResponseEntity<ApiResponse<EmployeeDTOs.Response>> getById(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success("Employee found", employeeService.getById(id)));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','HR','EMPLOYEE')")
    @Operation(summary = "Update employee")
    public ResponseEntity<ApiResponse<EmployeeDTOs.Response>> update(
            @PathVariable Long id, @RequestBody EmployeeDTOs.UpdateRequest req) {
        return ResponseEntity.ok(ApiResponse.success("Employee updated", employeeService.updateEmployee(id, req)));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','HR')")
    @Operation(summary = "Delete employee")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable Long id) {
        employeeService.deleteEmployee(id);
        return ResponseEntity.ok(ApiResponse.success("Employee deleted successfully"));
    }

    @GetMapping("/search")
    @Operation(summary = "Search employees")
    public ResponseEntity<ApiResponse<Page<EmployeeDTOs.Response>>> search(
            @RequestParam String q,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        return ResponseEntity.ok(ApiResponse.success("Search results",
employeeService.search(
        q,
        PageRequest.of(
                page,
                size,
                Sort.by(Sort.Direction.ASC, "employeeId")))));
        

    }

    @GetMapping("/managers")
    @Operation(summary = "Get all managers and HR employees")
    public ResponseEntity<ApiResponse<java.util.List<EmployeeDTOs.Response>>> getManagers() {
        return ResponseEntity.ok(ApiResponse.success("Managers fetched",
                employeeService.getManagers()));
    }

}