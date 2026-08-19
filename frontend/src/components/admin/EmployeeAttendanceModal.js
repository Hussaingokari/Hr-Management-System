'use client';
import { useEffect, useState } from 'react';
import { getEmployeeDetailedReport, exportEmployeeAttendanceRange } from '@/lib/adminApi';
import { downloadBlob } from '@/lib/downloadFile';
import toast from 'react-hot-toast';
import { Download, Loader2 } from 'lucide-react';

const STATUS_COLORS = {
    PRESENT: { bg: '#dcfce7', color: '#16a34a' },
    HALF_DAY: { bg: '#fff7ed', color: '#f59e0b' },
    ON_LEAVE: { bg: '#eff6ff', color: '#3b82f6' },
    ABSENT: { bg: '#fee2e2', color: '#dc2626' },
    WEEKEND: { bg: '#f1f5f9', color: '#94a3b8' },
    HOLIDAY: { bg: '#fdf4ff', color: '#9333ea' },
};

const dateFieldStyle = {
    padding: '6px 10px',
    border: '1px solid #e2e8f0',
    borderRadius: '6px',
    fontSize: '12px',
    color: 'var(--text-primary)',
    background: 'var(--bg-secondary, transparent)',
};

function StatusBadge({ status }) {
    const s = STATUS_COLORS[status] || { bg: '#f1f5f9', color: '#64748b' };
    return (
        <span style={{
            background: s.bg, color: s.color,
            padding: '3px 10px', borderRadius: '20px',
            fontSize: '11px', fontWeight: '700',
        }}>
            {status?.replace(/_/g, ' ')}
        </span>
    );
}

function formatDuration(mins) {
    if (!mins) return '0m';
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

function formatTime(t) {
    return t ? String(t).slice(0, 5) : '--';
}

function effectiveStatus(day) {
    const hasRecord = !!day.checkIn;
    if (hasRecord && (day.status === 'WEEKEND' || day.status === 'ABSENT')) {
        return day.workHours != null && day.workHours < 4 ? 'HALF_DAY' : 'PRESENT';
    }
    return day.status;
}

function isFutureDate(dateStr) {
    if (!dateStr) return false;
    const todayStr = new Date().toLocaleDateString('en-CA');
    const dOnly = String(dateStr).slice(0, 10);
    return dOnly > todayStr;
}

function DayCell({ day, index = 0, total = 7 }) {
    const [hovered, setHovered] = useState(false);

    if (isFutureDate(day.date)) {
        return (
            <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '11px', color: '#94a3b8', marginBottom: '4px' }}>{day.dayName}</div>
                <div style={{
                    width: '32px', height: '32px', borderRadius: '6px',
                    background: 'transparent', color: '#cbd5e1',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '11px', fontWeight: '700', margin: '0 auto',
                    border: '1px dashed #e2e8f0',
                }}>
                    –
                </div>
            </div>
        );
    }

    const status = effectiveStatus(day);
    const s = STATUS_COLORS[status] || { bg: '#f1f5f9', color: '#64748b' };
    const shortLabel = status === 'PRESENT' ? 'P'
        : status === 'HALF_DAY' ? 'H'
            : status === 'ON_LEAVE' ? 'L'
                : status === 'WEEKEND' ? 'WK'
                    : status === 'HOLIDAY' ? 'HO'
                        : 'A';
    const breaks = day.breaks || [];
    const hasBreaks = breaks.length > 0;

    const sortedBreaks = [...breaks].sort(
        (a, b) => (b.durationMinutes || 0) - (a.durationMinutes || 0)
    );
    const longestDuration = sortedBreaks[0]?.durationMinutes || 0;
    const longestId = (sortedBreaks[0] && longestDuration > 60)
        ? (sortedBreaks[0].id ?? `${sortedBreaks[0].breakStart}-${sortedBreaks[0].breakEnd}`)
        : null;
    const totalMinutes = breaks.reduce((sum, b) => sum + (b.durationMinutes || 0), 0);

    let align = 'center';
    if (index <= 1) align = 'left';
    else if (index >= total - 2) align = 'right';

    const tooltipPositionStyle = align === 'left'
        ? { left: 0, transform: 'none' }
        : align === 'right'
            ? { right: 0, left: 'auto', transform: 'none' }
            : { left: '50%', transform: 'translateX(-50%)' };

    const arrowPositionStyle = align === 'left'
        ? { left: '16px', transform: 'none' }
        : align === 'right'
            ? { right: '16px', left: 'auto', transform: 'none' }
            : { left: '50%', transform: 'translateX(-50%)' };

    return (
        <div
            style={{ textAlign: 'center', position: 'relative' }}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
        >
            <div style={{ fontSize: '11px', color: '#94a3b8', marginBottom: '4px' }}>{day.dayName}</div>
            <div style={{
                width: '32px', height: '32px', borderRadius: '6px',
                background: s.bg, color: s.color,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '11px', fontWeight: '700', margin: '0 auto',
                cursor: hasBreaks ? 'pointer' : 'default',
                boxShadow: hasBreaks ? 'inset 0 0 0 1.5px rgba(0,0,0,0.15)' : 'none',
            }}>
                {shortLabel}
            </div>

            {hovered && (
                <div style={{
                    position: 'absolute', bottom: 'calc(100% + 6px)',
                    zIndex: 20, maxWidth: '230px', minWidth: '150px',
                    background: '#1e293b', color: 'white', borderRadius: '8px',
                    padding: '10px 12px', fontSize: '11px', textAlign: 'left',
                    boxShadow: '0 6px 20px rgba(0,0,0,0.25)',
                    whiteSpace: 'normal', wordBreak: 'break-word',
                    ...tooltipPositionStyle,
                }}>
                    <div style={{ fontWeight: '700', marginBottom: (hasBreaks || day.checkIn) ? '6px' : 0 }}>
                        {day.date} · {status?.replace(/_/g, ' ')}
                    </div>
                    {day.checkIn && (
                        <div style={{ color: '#e2e8f0', marginBottom: hasBreaks ? '4px' : 0 }}>
                            In: {formatTime(day.checkIn)} · Out: {formatTime(day.checkOut)}
                            {day.workHours != null && ` · ${day.workHours}h`}
                        </div>
                    )}
                    {hasBreaks ? (
                        <>
                            {sortedBreaks.map((b, idx) => {
                                const bId = b.id ?? `${b.breakStart}-${b.breakEnd}`;
                                const isLongest = bId === longestId && sortedBreaks.length > 1;
                                return (
                                    <div key={idx} style={{
                                        display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap',
                                        padding: '3px 0',
                                        color: b.flagged ? '#fca5a5' : '#e2e8f0',
                                        fontWeight: isLongest ? '700' : '400',
                                    }}>
                                        <span>
                                            {formatTime(b.breakStart)} – {formatTime(b.breakEnd)}
                                        </span>
                                        <span style={{ color: isLongest ? '#fbbf24' : '#94a3b8', fontWeight: isLongest ? '700' : '400' }}>
                                            ({formatDuration(b.durationMinutes)}{b.flagged ? ', flagged' : ''})
                                        </span>
                                        {isLongest && (
                                            <span style={{
                                                background: '#fbbf24', color: '#1e293b',
                                                fontSize: '9px', fontWeight: '800',
                                                padding: '1px 5px', borderRadius: '4px',
                                                textTransform: 'uppercase', letterSpacing: '0.3px',
                                            }}>
                                                Longest
                                            </span>
                                        )}
                                    </div>
                                );
                            })}
                            {sortedBreaks.length > 1 && (
                                <div style={{
                                    marginTop: '6px', paddingTop: '6px',
                                    borderTop: '1px solid rgba(255,255,255,0.15)',
                                    color: '#e2e8f0', fontWeight: '700',
                                }}>
                                    Total: {formatDuration(totalMinutes)}
                                </div>
                            )}
                        </>
                    ) : (
                        day.totalBreakMinutes ? (
                            <div style={{ color: '#e2e8f0' }}>Break: {formatDuration(day.totalBreakMinutes)}</div>
                        ) : !day.checkIn ? (
                            <div style={{ color: '#94a3b8' }}>No breaks</div>
                        ) : null
                    )}
                    <div style={{
                        position: 'absolute', top: '100%',
                        width: 0, height: 0,
                        borderLeft: '6px solid transparent', borderRight: '6px solid transparent',
                        borderTop: '6px solid #1e293b',
                        ...arrowPositionStyle,
                    }} />
                </div>
            )}
        </div>
    );
}

// Local YYYY-MM-DD for "today", used as the `max` on both date pickers so
// the calendar UI itself greys out/blocks any future date from selection.
const todayStr = new Date().toLocaleDateString('en-CA');

export default function EmployeeAttendanceModal({ employeeId, asOfDate, onClose }) {
    const [report, setReport] = useState(null);
    const [loading, setLoading] = useState(true);
    const [fromDate, setFromDate] = useState(asOfDate ? asOfDate.slice(0, 8) + '01' : '');
    const [toDate, setToDate] = useState(asOfDate && asOfDate > todayStr ? todayStr : asOfDate);
    const [exporting, setExporting] = useState(false);

    useEffect(() => {
        let active = true;
        setLoading(true);
        getEmployeeDetailedReport(employeeId, asOfDate)
            .then((res) => {
                if (active) setReport(res.data?.data || null);
            })
            .catch((err) => {
                toast.error(err.response?.data?.message || 'Failed to load employee report');
            })
            .finally(() => {
                if (active) setLoading(false);
            });
        return () => { active = false; };
    }, [employeeId, asOfDate]);

    useEffect(() => {
        const onKey = (e) => { if (e.key === 'Escape') onClose(); };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [onClose]);

    const handleExport = async () => {
        setExporting(true);
        try {
            const res = await exportEmployeeAttendanceRange(employeeId, fromDate, toDate);
            downloadBlob(res, `attendance_emp${employeeId}_${fromDate}_to_${toDate}.xlsx`);
        } catch (err) {
            toast.error(err.response?.data?.message || 'Export failed');
        } finally {
            setExporting(false);
        }
    };

    return (
        <div
            onClick={onClose}
            style={{
                position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.45)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                zIndex: 1000, padding: '20px',
            }}
        >
            <div
                onClick={(e) => e.stopPropagation()}
                style={{
                    background: 'var(--bg-primary)', borderRadius: '14px', width: '460px',
                    maxWidth: '100%', maxHeight: '85vh',
                    overflowY: 'auto', overflowX: 'visible',
                    padding: '20px 24px', boxShadow: '0 10px 40px rgba(0,0,0,0.2)',
                }}
            >
                {loading ? (
                    <div style={{ textAlign: 'center', padding: '60px', color: '#94a3b8' }}>Loading...</div>
                ) : !report ? (
                    <div style={{ textAlign: 'center', padding: '60px', color: '#94a3b8' }}>
                        No report available.
                        <div style={{ marginTop: '16px' }}>
                            <button onClick={onClose} style={closeBtnStyle}>Close</button>
                        </div>
                    </div>
                ) : (
                    <>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px' }}>
                            <div>
                                <div style={{ fontSize: '16px', fontWeight: '800', color: '#1e293b' }}>
                                    {report.employeeName} <span style={{ color: '#94a3b8', fontWeight: '500' }}>({report.employeeCode})</span>
                                </div>
                                <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>
                                    {report.departmentName}
                                </div>
                            </div>
                            <button onClick={onClose} aria-label="Close" style={{
                                border: 'none', background: 'none', cursor: 'pointer',
                                fontSize: '18px', color: '#94a3b8', lineHeight: 1,
                            }}>
                                ✕
                            </button>
                        </div>

                        <div style={{
                            display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap',
                            borderTop: '1px solid #f1f5f9', paddingTop: '12px', marginBottom: '16px',
                        }}>
                            <input
                                type="date"
                                value={fromDate}
                                max={todayStr}
                                onChange={(e) => {
                                    const v = e.target.value;
                                    setFromDate(v > todayStr ? todayStr : v);
                                }}
                                style={dateFieldStyle}
                            />
                            <span style={{ fontSize: '12px', color: '#94a3b8' }}>to</span>
                            <input
                                type="date"
                                value={toDate}
                                max={todayStr}
                                onChange={(e) => {
                                    const v = e.target.value;
                                    setToDate(v > todayStr ? todayStr : v);
                                }}
                                style={dateFieldStyle}
                            />
                            <button
                                onClick={handleExport}
                                disabled={exporting}
                                style={{
                                    marginLeft: 'auto', padding: '6px 14px', background: '#1e3a5f', color: 'white',
                                    border: 'none', borderRadius: '6px', fontSize: '12px', fontWeight: '700',
                                    cursor: exporting ? 'not-allowed' : 'pointer',
                                }}
                            >
                                {exporting ? <><Loader2 size={12} className="animate-spin inline" /> Exporting...</> : <><Download size={12} className="inline" /> Export</>}
                            </button>
                        </div>

                        <div style={{ marginBottom: '16px' }}>
                            <div style={{ fontSize: '11px', color: '#94a3b8', fontWeight: '700', textTransform: 'uppercase', marginBottom: '6px' }}>
                                Yesterday ({report.yesterdayDate})
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', color: '#334155', flexWrap: 'wrap' }}>
                                <StatusBadge status={report.yesterdayStatus} />
                                <span>Hours: {report.yesterdayWorkHours ?? 0}</span>
                                {report.yesterdayCheckIn && (
                                    <span>In: {String(report.yesterdayCheckIn).slice(0, 5)} · Out: {report.yesterdayCheckOut ? String(report.yesterdayCheckOut).slice(0, 5) : '--'}</span>
                                )}
                            </div>
                            {report.yesterdayRemarks && (
                                <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '4px', fontStyle: 'italic' }}>
                                    &quot;{report.yesterdayRemarks}&quot;
                                </div>
                            )}
                        </div>

                        <div style={{ marginBottom: '16px' }}>
                            <div style={{ fontSize: '11px', color: '#94a3b8', fontWeight: '700', textTransform: 'uppercase', marginBottom: '10px' }}>
                                This week
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '4px' }}>
                                {report.weeklyRecords?.map((d, i) => (
                                    <DayCell key={d.date} day={d} index={i} total={report.weeklyRecords.length} />
                                ))}
                            </div>
                            <div style={{ fontSize: '12px', color: '#64748b', marginTop: '10px' }}>
                                P: {report.weeklyStats?.presentCount ?? 0} &nbsp;
                                H: {report.weeklyStats?.halfDayCount ?? 0} &nbsp;
                                A: {report.weeklyStats?.absentCount ?? 0} &nbsp;
                                L: {report.weeklyStats?.leaveCount ?? 0} &nbsp;
                                Avg hrs: {report.weeklyStats?.avgWorkHours ?? 0}
                            </div>
                            <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '4px' }}>
                                Hover a day to see its break time · red-flagged breaks ran over 60 min
                            </div>
                        </div>

                        <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '12px' }}>
                            <div style={{ fontSize: '11px', color: '#94a3b8', fontWeight: '700', textTransform: 'uppercase', marginBottom: '10px' }}>
                                This month
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '10px' }}>
                                <div style={{ background: '#f8fafc', borderRadius: '10px', padding: '10px 12px' }}>
                                    <div style={{ fontSize: '11px', color: '#94a3b8' }}>Attendance</div>
                                    <div style={{ fontSize: '20px', fontWeight: '800', color: '#1e293b' }}>
                                        {report.monthlyStats?.attendancePercent ?? 0}%
                                    </div>
                                </div>
                                <div style={{ background: '#f8fafc', borderRadius: '10px', padding: '10px 12px' }}>
                                    <div style={{ fontSize: '11px', color: '#94a3b8' }}>Total hours</div>
                                    <div style={{ fontSize: '20px', fontWeight: '800', color: '#1e293b' }}>
                                        {report.monthlyStats?.totalWorkHours ?? 0}
                                    </div>
                                </div>
                            </div>
                            <div style={{ fontSize: '12px', color: '#64748b' }}>
                                Present: {report.monthlyStats?.presentCount ?? 0} &nbsp;
                                Half: {report.monthlyStats?.halfDayCount ?? 0} &nbsp;
                                Absent: {report.monthlyStats?.absentCount ?? 0} &nbsp;
                                Leave: {report.monthlyStats?.leaveCount ?? 0} &nbsp;
                                Working days: {report.monthlyStats?.workingDays ?? 0}
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}

const closeBtnStyle = {
    padding: '8px 20px', background: '#f1f5f9', border: 'none',
    borderRadius: '8px', fontSize: '13px', fontWeight: '600',
    color: '#334155', cursor: 'pointer',
};