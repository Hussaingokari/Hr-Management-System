package com.hrms.entity;

import com.hrms.enums.BreakType;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalTime;

@Entity
@Table(name = "attendance_break")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AttendanceBreak {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "attendance_id", nullable = false)
    private Attendance attendance;

    @Enumerated(EnumType.STRING)
    @Builder.Default
    private BreakType breakType = BreakType.GENERAL;

    @Column(nullable = false)
    private LocalTime breakStart;

    private LocalTime breakEnd;

    private Integer durationMinutes;

    // Whether this break counts toward work hours (paid) or is subtracted (unpaid).
    // Defaults to unpaid per break type — flip per-type later without a migration.
    @Builder.Default
    private boolean paid = false;

    // Auto-set true when durationMinutes > 60, for HR review.
    @Builder.Default
    private boolean flagged = false;
}