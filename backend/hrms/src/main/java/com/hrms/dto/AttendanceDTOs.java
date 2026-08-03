package com.hrms.dto;

import com.hrms.enums.AttendanceStatus;
import com.hrms.enums.BreakType;
import lombok.AllArgsConstructor;
import lombok.Data;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

public class AttendanceDTOs {

    @Data
    public static class CheckInRequest {
        private LocalDate date;
        private LocalTime checkIn;
    }

    @Data
    public static class CheckOutRequest {
        private LocalTime checkOut;
        private String remarks;
    }

    @Data
    public static class BreakStartRequest {
        private LocalTime breakStart;
        private BreakType breakType;
    }

    @Data
    public static class BreakEndRequest {
        private LocalTime breakEnd;
    }

    @Data
    public static class BreakResponse {
        private Long id;
        private String breakType;
        private LocalTime breakStart;
        private LocalTime breakEnd;
        private Integer durationMinutes;
        private boolean paid;
        private boolean flagged;
    }

    @Data
    public static class Response {
        private Long id;
        private Long employeeDbId;
        private String employeeName;
        private LocalDate date;
        private LocalTime checkIn;
        private LocalTime checkOut;
        private Double workHours;
        private String status;
        private String remarks;
        private Integer totalBreakMinutes;
        private boolean onBreak;
        private List<BreakResponse> breaks;
    }

    @Data
    public static class DailyRecord {
        private LocalDate date;
        private String dayName;
        private String status;
        private LocalTime checkIn;
        private LocalTime checkOut;
        private Double workHours;
        private String remarks;
        private Integer totalBreakMinutes;
        private List<BreakResponse> breaks;
    }

    @Data
    public static class WeeklyStats {
        private int presentCount;
        private int absentCount;
        private int halfDayCount;
        private int leaveCount;
        private Double avgWorkHours;
    }

    @Data
    public static class MonthlyStats {
        private double attendancePercent;
        private Double totalWorkHours;
        private int presentCount;
        private int absentCount;
        private int halfDayCount;
        private int leaveCount;
        private int workingDays;
    }

    @Data
    @AllArgsConstructor
    public static class EmployeeDetailedReport {
        private Long employeeId;
        private String employeeCode;
        private String employeeName;
        private String departmentName;

        // Yesterday (date passed in query)
        private LocalDate yesterdayDate;
        private String yesterdayStatus;
        private LocalTime yesterdayCheckIn;
        private LocalTime yesterdayCheckOut;
        private Double yesterdayWorkHours;
        private String yesterdayRemarks;

        // Weekly (7 days from the date)
        private List<DailyRecord> weeklyRecords;
        private WeeklyStats weeklyStats;

        // Monthly (entire month from the date)
        private List<DailyRecord> monthlyRecords;
        private MonthlyStats monthlyStats;
    }

    @Data
    public static class EmployeeAttendanceSummary {
        private Long employeeId;
        private String employeeCode;
        private String employeeName;
        private String departmentName;
        private String status; // PRESENT, ABSENT, HALF_DAY, ON_LEAVE
        private LocalTime checkIn;
        private LocalTime checkOut;
        private Double workHours;
        private Integer totalBreakMinutes;
        private boolean onBreak;
        private List<BreakResponse> breaks;
    }
}