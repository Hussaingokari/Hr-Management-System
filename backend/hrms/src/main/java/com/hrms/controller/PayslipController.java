package com.hrms.controller;

import com.hrms.dto.ApiResponse;
import com.hrms.dto.PayslipDTOs;
import com.hrms.entity.Employee;
import com.hrms.entity.Payslip;
import com.hrms.service.PayslipPdfService;
import com.hrms.service.PayslipService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/payslips")
@RequiredArgsConstructor
@Tag(name = "Payslips")
public class PayslipController {

        private final PayslipService payslipService;
        private final PayslipPdfService payslipPdfService;

        @PostMapping("/generate/{payrollId}")
        @PreAuthorize("hasAnyRole('ADMIN','HR')")
        @Operation(summary = "Generate payslip from payroll record")
        public ResponseEntity<ApiResponse<PayslipDTOs.Response>> generate(@PathVariable Long payrollId) {
                return ResponseEntity.status(HttpStatus.CREATED)
                                .body(ApiResponse.success("Payslip generated",
                                                payslipService.generatePayslip(payrollId)));
        }

        @GetMapping("/my")
        @Operation(summary = "Get my payslips")
        public ResponseEntity<ApiResponse<Page<PayslipDTOs.Response>>> myPayslips(
                        @AuthenticationPrincipal Employee emp,
                        @RequestParam(defaultValue = "0") int page,
                        @RequestParam(defaultValue = "12") int size) {
                return ResponseEntity.ok(ApiResponse.success("My payslips",
                                payslipService.getMyPayslips(emp.getId(),
                                                PageRequest.of(page, size, Sort.by("year", "month").descending()))));
        }

        @GetMapping("/{payslipNumber}")
        @Operation(summary = "Get payslip by payslip number (e.g. PS-2024-12-EMP0003)")
        public ResponseEntity<ApiResponse<PayslipDTOs.Response>> getByNumber(
                        @PathVariable String payslipNumber,
                        @AuthenticationPrincipal Employee emp) {
                return ResponseEntity.ok(ApiResponse.success("Payslip found",
                                payslipService.getByPayslipNumber(payslipNumber, emp)));
        }

        @GetMapping("/{payslipNumber}/download")
        @Operation(summary = "Download payslip as PDF")
        public ResponseEntity<byte[]> downloadPdf(
                        @PathVariable String payslipNumber,
                        @AuthenticationPrincipal Employee emp) {
                Payslip payslip = payslipService.getEntityByPayslipNumber(payslipNumber, emp);
                byte[] pdfBytes = payslipPdfService.generatePayslipPdf(payslip);

                String filename = payslipNumber + ".pdf";
                HttpHeaders headers = new HttpHeaders();
                headers.setContentType(MediaType.APPLICATION_PDF);
                headers.setContentDisposition(ContentDisposition.attachment().filename(filename).build());

                return ResponseEntity.ok()
                                .headers(headers)
                                .body(pdfBytes);
        }
}