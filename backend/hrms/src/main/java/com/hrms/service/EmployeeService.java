package com.hrms.service;

import com.hrms.dto.EmployeeDTOs;
import com.hrms.entity.Employee;
import com.hrms.enums.Role;
import com.hrms.exception.EmployeeAlreadyExists;
import com.hrms.repository.EmployeeRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.NoSuchElementException;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class EmployeeService {

    private final EmployeeRepository employeeRepository;
    private final PasswordEncoder passwordEncoder;

    @jakarta.persistence.PersistenceContext
    private jakarta.persistence.EntityManager entityManager;

    @org.springframework.context.annotation.Lazy
    @org.springframework.beans.factory.annotation.Autowired(required = false)
    private UserCacheService userCacheService;

    // ============================================================
    // CREATE EMPLOYEE
    // ============================================================

    @Transactional
    @CacheEvict(value = "dashboardData", allEntries = true)
    public EmployeeDTOs.Response createEmployee(
            EmployeeDTOs.CreateRequest req) {

        if (req.getEmail() == null
                || req.getEmail().trim().isBlank()) {

            throw new IllegalArgumentException(
                    "Email is required");
        }

        String email = req.getEmail()
                .trim()
                .toLowerCase();

        req.setEmail(email);

        if (req.getEmployeeId() == null
                || req.getEmployeeId().trim().isBlank()) {

            throw new IllegalArgumentException(
                    "Employee ID is required");
        }

        if (req.getPassword() == null
                || req.getPassword().isBlank()) {

            throw new IllegalArgumentException(
                    "Password is required");
        }

        String employeeId = req.getEmployeeId()
                .trim()
                .toUpperCase();

        if (employeeRepository
                .findByEmployeeId(employeeId)
                .isPresent()) {

            throw new IllegalArgumentException(
                    "Employee ID already exists");
        }

        Optional<Employee> existingOpt = employeeRepository.findByEmail(email);

        if (existingOpt.isPresent()) {

            Employee existing = existingOpt.get();

            if (existing.isActive()) {

                throw new EmployeeAlreadyExists(email);
            }

            if (req.getFirstName() != null) {

                existing.setFirstName(
                        req.getFirstName().trim());
            }

            if (req.getLastName() != null) {

                existing.setLastName(
                        req.getLastName().trim());
            }

            existing.setEmail(email);

            existing.setEmployeeId(employeeId);

            if (req.getPassword() != null
                    && !req.getPassword().isBlank()) {

                existing.setPassword(
                        passwordEncoder.encode(
                                req.getPassword()));
            }

            if (req.getPhone() != null) {

                existing.setPhone(
                        req.getPhone().trim());
            }

            if (req.getDepartment() != null) {

                existing.setDepartment(
                        req.getDepartment().trim());
            }

            if (req.getDesignation() != null) {

                existing.setDesignation(
                        req.getDesignation().trim());
            }

            if (req.getBasicSalary() != null) {

                existing.setBasicSalary(
                        req.getBasicSalary());
            }

            existing.setDateOfJoining(
                    req.getDateOfJoining() != null
                            ? req.getDateOfJoining()
                            : LocalDate.now());

            if (req.getDateOfBirth() != null) {

                existing.setDateOfBirth(
                        req.getDateOfBirth());
            }

            if (req.getRole() != null) {

                existing.setRole(
                        req.getRole());
            }

            existing.setActive(true);

            if (userCacheService != null) {

                userCacheService.evict(email);
            }

            return toResponse(
                    employeeRepository.save(existing));
        }

        Employee emp = Employee.builder()

                .employeeId(employeeId)

                .firstName(
                        req.getFirstName() != null
                                ? req.getFirstName().trim()
                                : null)

                .lastName(
                        req.getLastName() != null
                                ? req.getLastName().trim()
                                : null)

                .email(email)

                .password(
                        passwordEncoder.encode(
                                req.getPassword()))

                .phone(
                        req.getPhone() != null
                                ? req.getPhone().trim()
                                : null)

                .department(
                        req.getDepartment() != null
                                ? req.getDepartment().trim()
                                : null)

                .designation(
                        req.getDesignation() != null
                                ? req.getDesignation().trim()
                                : null)

                .basicSalary(
                        req.getBasicSalary())

                .dateOfJoining(
                        req.getDateOfJoining() != null
                                ? req.getDateOfJoining()
                                : LocalDate.now())

                .dateOfBirth(
                        req.getDateOfBirth())

                .role(
                        req.getRole() != null
                                ? req.getRole()
                                : Role.EMPLOYEE)

                .active(true)

                .build();

        return toResponse(
                employeeRepository.save(emp));
    }

    // ============================================================
    // GET ALL EMPLOYEES
    // ============================================================

    @Transactional(readOnly = true)
    @Cacheable("dashboardData")
    public Page<EmployeeDTOs.Response> getAllEmployees(
            Pageable pageable) {

        return employeeRepository
                .findAll(pageable)
                .map(this::toResponse);
    }

    // ============================================================
    // GET BY DEPARTMENT
    // ============================================================

    @Transactional(readOnly = true)
    public Page<EmployeeDTOs.Response> getByDepartment(
            String department,
            Pageable pageable) {

        return employeeRepository
                .findByDepartmentIgnoreCase(
                        department,
                        pageable)
                .map(this::toResponse);
    }

    // ============================================================
    // GET EMPLOYEE BY ID
    // ============================================================

    @Transactional(readOnly = true)
    public EmployeeDTOs.Response getById(Long id) {

        return toResponse(
                findById(id));
    }

    // ============================================================
    // UPDATE EMPLOYEE
    // ============================================================

    @Transactional
    @CacheEvict(value = "dashboardData", allEntries = true)
    public EmployeeDTOs.Response updateEmployee(
            Long id,
            EmployeeDTOs.UpdateRequest req) {

        Employee emp = findById(id);

        // --------------------------------------------------------
        // EMPLOYEE ID
        // --------------------------------------------------------

        if (req.getEmployeeId() != null
                && !req.getEmployeeId().trim().isEmpty()) {

            String employeeId = req.getEmployeeId()
                    .trim()
                    .toUpperCase();

            Optional<Employee> existingEmployee = employeeRepository
                    .findByEmployeeId(employeeId);

            if (existingEmployee.isPresent()
                    && !existingEmployee
                            .get()
                            .getId()
                            .equals(id)) {

                throw new IllegalArgumentException(
                        "Employee ID already exists: "
                                + employeeId);
            }

            emp.setEmployeeId(employeeId);
        }

        // --------------------------------------------------------
        // EMAIL
        // --------------------------------------------------------

        String oldEmail = emp.getEmail();

        if (req.getEmail() != null
                && !req.getEmail().trim().isEmpty()) {

            String email = req.getEmail()
                    .trim()
                    .toLowerCase();

            Optional<Employee> existingEmail = employeeRepository
                    .findByEmail(email);

            if (existingEmail.isPresent()
                    && !existingEmail
                            .get()
                            .getId()
                            .equals(id)) {

                throw new IllegalArgumentException(
                        "Email already exists: "
                                + email);
            }

            emp.setEmail(email);
        }

        // --------------------------------------------------------
        // FIRST NAME
        // --------------------------------------------------------

        if (req.getFirstName() != null) {

            emp.setFirstName(
                    req.getFirstName().trim());
        }

        // --------------------------------------------------------
        // LAST NAME
        // --------------------------------------------------------

        if (req.getLastName() != null) {

            emp.setLastName(
                    req.getLastName().trim());
        }

        // --------------------------------------------------------
        // PHONE
        // --------------------------------------------------------

        if (req.getPhone() != null) {

            emp.setPhone(
                    req.getPhone().trim());
        }

        // --------------------------------------------------------
        // DEPARTMENT
        // --------------------------------------------------------

        if (req.getDepartment() != null) {

            emp.setDepartment(
                    req.getDepartment().trim());
        }

        // --------------------------------------------------------
        // DESIGNATION
        // --------------------------------------------------------

        if (req.getDesignation() != null) {

            emp.setDesignation(
                    req.getDesignation().trim());
        }

        // --------------------------------------------------------
        // BASIC SALARY
        // --------------------------------------------------------

        if (req.getBasicSalary() != null) {

            emp.setBasicSalary(
                    req.getBasicSalary());
        }

        // --------------------------------------------------------
        // DATE OF JOINING
        // --------------------------------------------------------

        if (req.getDateOfJoining() != null) {

            emp.setDateOfJoining(
                    req.getDateOfJoining());
        }

        // --------------------------------------------------------
        // DATE OF BIRTH
        // --------------------------------------------------------

        if (req.getDateOfBirth() != null) {

            emp.setDateOfBirth(
                    req.getDateOfBirth());
        }

        // --------------------------------------------------------
        // ROLE
        // --------------------------------------------------------

        if (req.getRole() != null) {

            emp.setRole(
                    req.getRole());
        }

        // --------------------------------------------------------
        // ACTIVE STATUS
        // --------------------------------------------------------

        if (req.getActive() != null) {

            emp.setActive(
                    req.getActive());
        }

        // --------------------------------------------------------
        // PASSWORD
        // --------------------------------------------------------

        /*
         * Important:
         * Do not overwrite the existing password when the
         * password field is empty.
         */

        if (req.getPassword() != null
                && !req.getPassword().trim().isEmpty()) {

            emp.setPassword(
                    passwordEncoder.encode(
                            req.getPassword()));
        }

        // --------------------------------------------------------
        // SAVE UPDATED EMPLOYEE
        // --------------------------------------------------------

        Employee saved = employeeRepository.save(emp);

        // --------------------------------------------------------
        // CLEAR USER CACHE
        // --------------------------------------------------------

        if (userCacheService != null) {

            if (oldEmail != null
                    && !oldEmail.equals(
                            saved.getEmail())) {

                userCacheService.evict(
                        oldEmail);
            }

            if (saved.getEmail() != null) {

                userCacheService.evict(
                        saved.getEmail());
            }
        }

        // --------------------------------------------------------
        // RETURN UPDATED DATA
        // --------------------------------------------------------

        return toResponse(saved);
    }

    // ============================================================
    // DEACTIVATE EMPLOYEE
    // ============================================================

    @Transactional
    @CacheEvict(value = "dashboardData", allEntries = true)
    public void deactivateEmployee(Long id) {

        Employee emp = findById(id);

        emp.setActive(false);

        employeeRepository.save(emp);

        if (userCacheService != null
                && emp.getEmail() != null) {

            userCacheService.evict(
                    emp.getEmail());
        }
    }

    // ============================================================
    // DELETE EMPLOYEE
    // ============================================================

    @Transactional
    @CacheEvict(value = "dashboardData", allEntries = true)
    public void deleteEmployee(Long id) {

        Employee emp = findById(id);

        if (userCacheService != null
                && emp.getEmail() != null) {

            userCacheService.evict(
                    emp.getEmail());
        }

        if (entityManager != null) {

            entityManager.createQuery(
                    "UPDATE LeaveRequest l " +
                            "SET l.reviewedBy = null " +
                            "WHERE l.reviewedBy.id = :id")
                    .setParameter("id", id)
                    .executeUpdate();

            entityManager.createQuery(
                    "UPDATE LeaveRequest l " +
                            "SET l.cancellationReviewedBy = null " +
                            "WHERE l.cancellationReviewedBy.id = :id")
                    .setParameter("id", id)
                    .executeUpdate();

            entityManager.createQuery(
                    "UPDATE Onboarding o " +
                            "SET o.assignedHr = null " +
                            "WHERE o.assignedHr.id = :id")
                    .setParameter("id", id)
                    .executeUpdate();

            entityManager.createQuery(
                    "UPDATE JobPosting j " +
                            "SET j.createdBy = null " +
                            "WHERE j.createdBy.id = :id")
                    .setParameter("id", id)
                    .executeUpdate();

            entityManager.createQuery(
                    "UPDATE JobApplication j " +
                            "SET j.interviewer = null " +
                            "WHERE j.interviewer.id = :id")
                    .setParameter("id", id)
                    .executeUpdate();

            entityManager.createQuery(
                    "UPDATE PerformanceReview p " +
                            "SET p.reviewer = null " +
                            "WHERE p.reviewer.id = :id")
                    .setParameter("id", id)
                    .executeUpdate();

            entityManager.createQuery(
                    "UPDATE OnboardingDocument d " +
                            "SET d.reviewedByHr = null " +
                            "WHERE d.reviewedByHr.id = :id")
                    .setParameter("id", id)
                    .executeUpdate();

            entityManager.createQuery(
                    "DELETE FROM AttendanceBreak ab " +
                            "WHERE ab.attendance.employee.id = :id")
                    .setParameter("id", id)
                    .executeUpdate();

            entityManager.createQuery(
                    "DELETE FROM Attendance a " +
                            "WHERE a.employee.id = :id")
                    .setParameter("id", id)
                    .executeUpdate();

            entityManager.createQuery(
                    "DELETE FROM LeaveRequest l " +
                            "WHERE l.employee.id = :id")
                    .setParameter("id", id)
                    .executeUpdate();

            entityManager.createQuery(
                    "DELETE FROM LeaveBalance l " +
                            "WHERE l.employee.id = :id")
                    .setParameter("id", id)
                    .executeUpdate();

            entityManager.createQuery(
                    "DELETE FROM Payslip p " +
                            "WHERE p.employee.id = :id")
                    .setParameter("id", id)
                    .executeUpdate();

            entityManager.createQuery(
                    "DELETE FROM Payroll p " +
                            "WHERE p.employee.id = :id")
                    .setParameter("id", id)
                    .executeUpdate();

            entityManager.createQuery(
                    "DELETE FROM PerformanceReview p " +
                            "WHERE p.employee.id = :id")
                    .setParameter("id", id)
                    .executeUpdate();

            entityManager.createQuery(
                    "DELETE FROM Notification n " +
                            "WHERE n.recipient.id = :id")
                    .setParameter("id", id)
                    .executeUpdate();

            entityManager.createQuery(
                    "DELETE FROM OnboardingDocument d " +
                            "WHERE d.onboarding.employee.id = :id")
                    .setParameter("id", id)
                    .executeUpdate();

            entityManager.createQuery(
                    "DELETE FROM Onboarding o " +
                            "WHERE o.employee.id = :id")
                    .setParameter("id", id)
                    .executeUpdate();

            entityManager.createQuery(
                    "DELETE FROM TrainingEnrollment t " +
                            "WHERE t.employee.id = :id")
                    .setParameter("id", id)
                    .executeUpdate();
        }

        employeeRepository.delete(emp);
    }

    // ============================================================
    // SEARCH
    // ============================================================

    @Transactional(readOnly = true)
    public Page<EmployeeDTOs.Response> search(
            String q,
            Pageable pageable) {

        return employeeRepository
                .search(q, pageable)
                .map(this::toResponse);
    }

    // ============================================================
    // GET MANAGERS
    // ============================================================

    @Transactional(readOnly = true)
    public List<EmployeeDTOs.Response> getManagers() {

        return employeeRepository
                .findAll()
                .stream()
                .filter(e -> e.isActive()
                        &&
                        (e.getRole() == Role.ADMIN
                                ||
                                e.getRole() == Role.HR))
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    // ============================================================
    // FIND EMPLOYEE BY ID
    // ============================================================

    public Employee findById(Long id) {

        return employeeRepository
                .findById(id)
                .orElseThrow(
                        () -> new NoSuchElementException(
                                "Employee not found: " + id));
    }

    // ============================================================
    // ENTITY → RESPONSE
    // ============================================================

    public EmployeeDTOs.Response toResponse(Employee e) {

        EmployeeDTOs.Response r = new EmployeeDTOs.Response();

        r.setId(
                e.getId());

        r.setEmployeeId(
                e.getEmployeeId());

        r.setFirstName(
                e.getFirstName());

        r.setLastName(
                e.getLastName());

        r.setFullName(
                buildFullName(
                        e.getFirstName(),
                        e.getLastName()));

        r.setEmail(
                e.getEmail());

        r.setPhone(
                e.getPhone());

        r.setDepartment(
                e.getDepartment());

        r.setDesignation(
                e.getDesignation());

        r.setBasicSalary(
                e.getBasicSalary());

        r.setDateOfJoining(
                e.getDateOfJoining());

        r.setDateOfBirth(
                e.getDateOfBirth());

        r.setRole(
                e.getRole());

        r.setActive(
                e.isActive());

        r.setCreatedAt(
                e.getCreatedAt());

        return r;
    }

    // ============================================================
    // BUILD FULL NAME
    // ============================================================

    private String buildFullName(
            String firstName,
            String lastName) {

        String first = firstName != null
                ? firstName.trim()
                : "";

        String last = lastName != null
                ? lastName.trim()
                : "";

        String full = (first + " " + last).trim();

        return full.isEmpty()
                ? null
                : full;
    }
}