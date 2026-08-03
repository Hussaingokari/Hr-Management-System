package com.hrms.repository;

import com.hrms.entity.Attendance;
import com.hrms.entity.AttendanceBreak;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface AttendanceBreakRepository extends JpaRepository<AttendanceBreak, Long> {

    List<AttendanceBreak> findByAttendanceOrderByBreakStartAsc(Attendance attendance);

    // An "open" break has no breakEnd yet — this is how we know someone is
    // currently on break.
    Optional<AttendanceBreak> findFirstByAttendanceAndBreakEndIsNull(Attendance attendance);
}