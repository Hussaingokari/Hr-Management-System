package com.hrms.service;

import com.hrms.dto.PayrollDTOs;
import com.hrms.entity.Employee;
import com.hrms.entity.Payroll;
import com.hrms.repository.PayrollRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.YearMonth;
import java.util.NoSuchElementException;

@Service
@RequiredArgsConstructor
public class PayrollService {

    private final PayrollRepository payrollRepo;
    private final EmployeeService employeeService;

    // ---- Configurable rates (adjust to match your company policy) ----
    private static final BigDecimal HRA_RATE = new BigDecimal("0.40");
    private static final BigDecimal DA_RATE = new BigDecimal("0.10");
    private static final BigDecimal ESI_RATE = new BigDecimal("0.0075");
    private static final BigDecimal ESI_GROSS_LIMIT = new BigDecimal("21000");

    @Transactional
    public PayrollDTOs.Response generatePayroll(PayrollDTOs.GenerateRequest request) {
        Employee employee = employeeService.findById(request.getEmployeeId());

        if (payrollRepo.findByEmployeeAndMonthAndYear(employee, request.getMonth(), request.getYear()).isPresent()) {
            throw new IllegalStateException("Payroll already generated for this employee for this month");
        }

        BigDecimal basic = employee.getBasicSalary();
        if (basic == null) {
            throw new IllegalStateException("Employee has no basic salary set: " + employee.getEmployeeId());
        }

        int standardDays = YearMonth.of(request.getYear(), request.getMonth()).lengthOfMonth();
        int presentDays = standardDays; // no attendance integration yet — assumes full month present
        int lopDays = 0;

        BigDecimal targetGross = basic;
        BigDecimal actualBasic = round(targetGross.multiply(new BigDecimal("0.50")));
        BigDecimal hra = round(actualBasic.multiply(HRA_RATE));
        BigDecimal da = round(actualBasic.multiply(DA_RATE));
        BigDecimal specialAllowance = targetGross.subtract(actualBasic).subtract(hra).subtract(da);

        basic = actualBasic;
        BigDecimal grossSalary = basic.add(hra).add(da).add(specialAllowance);

        BigDecimal esi = grossSalary.compareTo(ESI_GROSS_LIMIT) <= 0
                ? round(grossSalary.multiply(ESI_RATE))
                : BigDecimal.ZERO;
        BigDecimal tds = BigDecimal.ZERO; // no tax slab logic yet

        BigDecimal totalDeductions = esi.add(tds);
        BigDecimal netSalary = grossSalary.subtract(totalDeductions);

        Payroll payroll = Payroll.builder()
                .employee(employee)
                .month(request.getMonth())
                .year(request.getYear())
                .basicSalary(basic)
                .hra(hra)
                .da(da)
                .specialAllowance(specialAllowance)
                .grossSalary(grossSalary)
                .esi(esi)
                .tds(tds)
                .totalDeductions(totalDeductions)
                .netSalary(netSalary)
                .presentDays(presentDays)
                .lopDays(lopDays)
                .paid(false)
                .build();

        return toResponse(payrollRepo.save(payroll));
    }

    @Transactional(readOnly = true)
    public Page<PayrollDTOs.Response> getByEmployee(Long employeeId, Pageable pageable) {
        Employee employee = employeeService.findById(employeeId);
        return payrollRepo.findByEmployee(employee, pageable).map(this::toResponse);
    }

    @Transactional(readOnly = true)
    public java.util.List<PayrollDTOs.Response> getByMonth(int month, int year) {
        return payrollRepo.findByMonthAndYear(month, year)
                .stream()
                .map(this::toResponse)
                .collect(java.util.stream.Collectors.toList());
    }

    @Transactional
    public PayrollDTOs.Response markAsPaid(Long payrollId) {
        Payroll payroll = payrollRepo.findById(payrollId)
                .orElseThrow(() -> new NoSuchElementException("Payroll not found: " + payrollId));
        payroll.setPaid(true);
        payroll.setPayDate(java.time.LocalDate.now());
        return toResponse(payrollRepo.save(payroll));
    }

    private BigDecimal round(BigDecimal value) {
        return value.setScale(2, RoundingMode.HALF_UP);
    }

    private PayrollDTOs.Response toResponse(Payroll p) {
        PayrollDTOs.Response r = new PayrollDTOs.Response();
        r.setId(p.getId());
        r.setEmployeeDbId(p.getEmployee().getId());
        r.setEmployeeName(p.getEmployee().getFirstName() + " " + p.getEmployee().getLastName());
        r.setEmployeeCode(p.getEmployee().getEmployeeId());
        r.setMonth(p.getMonth());
        r.setYear(p.getYear());
        r.setBasicSalary(p.getBasicSalary());
        r.setHra(p.getHra());
        r.setDa(p.getDa());
        r.setSpecialAllowance(p.getSpecialAllowance());
        r.setGrossSalary(p.getGrossSalary());
        r.setEsi(p.getEsi());
        r.setTds(p.getTds());
        r.setTotalDeductions(p.getTotalDeductions());
        r.setNetSalary(p.getNetSalary());
        r.setPresentDays(p.getPresentDays());
        r.setLopDays(p.getLopDays());
        r.setPaid(p.isPaid());
        r.setPayDate(p.getPayDate());
        return r;
    }
}