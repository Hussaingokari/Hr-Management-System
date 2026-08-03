package com.hrms.service;

import com.hrms.dto.PayslipDTOs;
import com.hrms.entity.Employee;
import com.hrms.entity.Payroll;
import com.hrms.entity.Payslip;
import com.hrms.repository.PayrollRepository;
import com.hrms.repository.PayslipRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.NoSuchElementException;

@Service
@RequiredArgsConstructor
public class PayslipService {

    private final PayslipRepository payslipRepo;
    private final PayrollRepository payrollRepo;
    private final EmployeeService employeeService;

    @Transactional
    public PayslipDTOs.Response generatePayslip(Long payrollId) {
        Payroll payroll = payrollRepo.findById(payrollId)
                .orElseThrow(() -> new NoSuchElementException("Payroll not found: " + payrollId));

        if (payslipRepo.existsByPayroll_Id(payrollId)) {
            throw new IllegalStateException("Payslip already generated for this payroll");
        }

        String payslipNumber = String.format("PS-%d-%02d-%s",
                payroll.getYear(), payroll.getMonth(), payroll.getEmployee().getEmployeeId());

        Payslip payslip = Payslip.builder()
                .payroll(payroll)
                .employee(payroll.getEmployee())
                .month(payroll.getMonth())
                .year(payroll.getYear())
                .basicSalary(payroll.getBasicSalary())
                .hra(payroll.getHra())
                .da(payroll.getDa())
                .specialAllowance(payroll.getSpecialAllowance())
                .grossSalary(payroll.getGrossSalary())
                .esi(payroll.getEsi())
                .tds(payroll.getTds())
                .totalDeductions(payroll.getTotalDeductions())
                .netSalary(payroll.getNetSalary())
                .presentDays(payroll.getPresentDays())
                .lopDays(payroll.getLopDays())
                .payDate(payroll.getPayDate())
                .payslipNumber(payslipNumber)
                .build();

        return toResponse(payslipRepo.save(payslip));
    }

    @Transactional(readOnly = true)
    public Page<PayslipDTOs.Response> getMyPayslips(Long employeeId, Pageable pageable) {
        Employee emp = employeeService.findById(employeeId);
        return payslipRepo.findByEmployee(emp, pageable).map(this::toResponse);
    }

    @Transactional(readOnly = true)
    public PayslipDTOs.Response getByPayslipNumber(String payslipNumber) {
        return toResponse(payslipRepo.findByPayslipNumber(payslipNumber)
                .orElseThrow(() -> new NoSuchElementException("Payslip not found: " + payslipNumber)));
    }

    @Transactional(readOnly = true)
    public Payslip getEntityByPayslipNumber(String payslipNumber) {
        return payslipRepo.findByPayslipNumber(payslipNumber)
                .orElseThrow(() -> new NoSuchElementException("Payslip not found: " + payslipNumber));
    }

    private PayslipDTOs.Response toResponse(Payslip p) {
        PayslipDTOs.Response r = new PayslipDTOs.Response();
        r.setId(p.getId());
        r.setPayslipNumber(p.getPayslipNumber());
        r.setEmployeeDbId(p.getEmployee().getId());
        r.setEmployeeName(p.getEmployee().getFirstName() + " " + p.getEmployee().getLastName());
        r.setEmployeeCode(p.getEmployee().getEmployeeId());
        r.setDepartment(p.getEmployee().getDepartment());
        r.setDesignation(p.getEmployee().getDesignation());
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
        r.setPaid(p.getPayroll() != null && p.getPayroll().isPaid());
        r.setPayDate(p.getPayroll() != null ? p.getPayroll().getPayDate() : p.getPayDate());
        r.setGeneratedAt(p.getGeneratedAt());
        return r;
    }
}