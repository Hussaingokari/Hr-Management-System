'use client';

import { useEffect, useState, useMemo } from 'react';
import {
    getAttendanceSummaryByDate,
    exportAttendanceRange,
} from '@/lib/adminApi';
import { downloadBlob } from '@/lib/downloadFile';
import EmployeeAttendanceModal from './EmployeeAttendanceModal';
import toast from 'react-hot-toast';
import { Download, Loader2 } from 'lucide-react';

/* =========================================================
   STATUS COLORS
========================================================= */

const STATUS_COLORS = {
    PRESENT: {
        bg: '#dcfce7',
        color: '#16a34a',
    },

    HALF_DAY: {
        bg: '#fff7ed',
        color: '#f59e0b',
    },

    ON_LEAVE: {
        bg: '#eff6ff',
        color: '#3b82f6',
    },

    ABSENT: {
        bg: '#fee2e2',
        color: '#dc2626',
    },
};

/* =========================================================
   STATUS BADGE
========================================================= */

function StatusBadge({ status }) {
    const s =
        STATUS_COLORS[status] || {
            bg: 'var(--status-neutral-bg, #e2e8f0)',
            color: 'var(--status-neutral-color, #475569)',
        };

    return (
        <span
            style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: s.bg,
                color: s.color,
                padding: '4px 10px',
                borderRadius: '20px',
                fontSize: '11px',
                fontWeight: '700',
                whiteSpace: 'nowrap',
                textTransform: 'uppercase',
            }}
        >
            {status?.replace(/_/g, ' ') || '--'}
        </span>
    );
}

/* =========================================================
   FORMAT DURATION
========================================================= */

function formatDuration(mins) {
    if (!mins) return '--';

    const h = Math.floor(mins / 60);
    const m = mins % 60;

    return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

/* =========================================================
   FORMAT BREAK TIMES
========================================================= */

function formatBreakTimes(breaks) {
    if (!breaks || breaks.length === 0) {
        return '--';
    }

    return breaks
        .map((b) => {
            const start = b.breakStart
                ? String(b.breakStart).slice(0, 5)
                : '--';

            const end = b.breakEnd
                ? String(b.breakEnd).slice(0, 5)
                : '...';

            return `${start}-${end}`;
        })
        .join(', ');
}

/* =========================================================
   TODAY IST
========================================================= */

function todayIST() {
    const now = new Date();

    const ist = new Date(
        now.toLocaleString('en-US', {
            timeZone: 'Asia/Kolkata',
        })
    );

    return ist.toISOString().split('T')[0];
}

/* =========================================================
   THEME AWARE FIELD STYLE
========================================================= */

const fieldStyle = {
    padding: '8px 12px',

    border:
        '1px solid var(--border-color, #dbe3ee)',

    borderRadius: '8px',

    fontSize: '13px',

    color:
        'var(--text-primary, #1e293b)',

    background:
        'var(--bg-secondary, #ffffff)',

    outline: 'none',

    height: '40px',

    boxSizing: 'border-box',

    /*
     * Allows browser controls to follow the
     * application's active theme.
     */
    colorScheme: 'inherit',
};

/* =========================================================
   MAIN COMPONENT
========================================================= */

export default function AttendanceReport() {
    const maxDate = useMemo(() => todayIST(), []);

    const [fromDate, setFromDate] =
        useState(todayIST());

    const [toDate, setToDate] =
        useState(todayIST());

    const [search, setSearch] =
        useState('');

    const [statusFilter, setStatusFilter] =
        useState('ALL');

    const [rows, setRows] =
        useState([]);

    const [loading, setLoading] =
        useState(true);

    const [page, setPage] =
        useState(0);

    const [totalPages, setTotalPages] =
        useState(1);

    const [selectedEmployeeId, setSelectedEmployeeId] =
        useState(null);

    const [exporting, setExporting] =
        useState(false);

    /* =====================================================
       LOAD ATTENDANCE
    ===================================================== */

    useEffect(() => {
        let active = true;

        setLoading(true);

        getAttendanceSummaryByDate(
            toDate,
            page,
            50
        )
            .then((res) => {
                if (!active) return;

                const pageData =
                    res.data?.data;

                setRows(
                    pageData?.content || []
                );

                setTotalPages(
                    pageData?.totalPages ?? 1
                );
            })
            .catch((err) => {
                if (!active) return;

                toast.error(
                    err.response?.data?.message ||
                    'Failed to load attendance'
                );

                setRows([]);
                setTotalPages(1);
            })
            .finally(() => {
                if (active) {
                    setLoading(false);
                }
            });

        return () => {
            active = false;
        };
    }, [toDate, page]);

    /* =====================================================
       FILTER DATA
    ===================================================== */

    const filteredRows = useMemo(() => {
        const normalizedSearch =
            search.trim().toLowerCase();

        return rows.filter((r) => {
            const employeeName =
                String(
                    r.employeeName || ''
                ).toLowerCase();

            const employeeCode =
                String(
                    r.employeeCode || ''
                ).toLowerCase();

            const employeeId =
                String(
                    r.employeeId || ''
                ).toLowerCase();

            const matchesSearch =
                !normalizedSearch ||
                employeeName.includes(
                    normalizedSearch
                ) ||
                employeeCode.includes(
                    normalizedSearch
                ) ||
                employeeId.includes(
                    normalizedSearch
                );

            const matchesStatus =
                statusFilter === 'ALL' ||
                r.status === statusFilter;

            return (
                matchesSearch &&
                matchesStatus
            );
        });
    }, [
        rows,
        search,
        statusFilter,
    ]);

    /* =====================================================
       FROM DATE
    ===================================================== */

    const handleFromDateChange = (e) => {
        const val = e.target.value;

        if (val > maxDate) {
            toast.error(
                'Future dates are not allowed'
            );
            return;
        }

        if (val > toDate) {
            toast.error(
                'From date cannot be after To date'
            );
            return;
        }

        setFromDate(val);
    };

    /* =====================================================
       TO DATE
    ===================================================== */

    const handleToDateChange = (e) => {
        const val = e.target.value;

        if (val > maxDate) {
            toast.error(
                'Future dates are not allowed'
            );
            return;
        }

        if (val < fromDate) {
            toast.error(
                'To date cannot be before From date'
            );
            return;
        }

        setToDate(val);
        setPage(0);
    };

    /* =====================================================
       EXPORT
    ===================================================== */

    const handleExport = async () => {
        setExporting(true);

        try {
            const res =
                await exportAttendanceRange(
                    fromDate,
                    toDate,
                    statusFilter,
                    search
                );

            downloadBlob(
                res,
                `attendance_${fromDate}_to_${toDate}.xlsx`
            );

            toast.success(
                'Attendance exported successfully'
            );
        } catch (err) {
            toast.error(
                err.response?.data?.message ||
                'Export failed'
            );
        } finally {
            setExporting(false);
        }
    };

    /* =====================================================
       UI
    ===================================================== */

    return (
        <div
            style={{
                width: '100%',
                color:
                    'var(--text-primary, #1e293b)',
            }}
        >
            <style jsx>{`
                /* =========================================
                   INPUT PLACEHOLDER
                ========================================= */

                input::placeholder {
                    color:
                        var(
                            --text-muted,
                            #94a3b8
                        ) !important;

                    opacity: 1 !important;
                }

                /* =========================================
                   ALL CONTROLS
                ========================================= */

                input,
                select,
                button {
                    font-family: inherit;
                }

                input,
                select {
                    transition:
                        border-color 0.2s ease,
                        box-shadow 0.2s ease,
                        background 0.2s ease,
                        color 0.2s ease;
                }

                input:focus,
                select:focus {
                    border-color:
                        #60a5fa !important;

                    box-shadow:
                        0 0 0 2px
                        rgba(
                            96,
                            165,
                            250,
                            0.15
                        ) !important;

                    outline: none !important;
                }

                /* =========================================
                   DATE ICON
                ========================================= */

                input[type='date']::-webkit-calendar-picker-indicator {
                    opacity: 0.8;
                    cursor: pointer;
                }

                /* =========================================
                   SELECT OPTIONS
                ========================================= */

                select option {
                    background:
                        var(
                            --bg-secondary,
                            #ffffff
                        );

                    color:
                        var(
                            --text-primary,
                            #1e293b
                        );
                }

                /* =========================================
                   TABLE ROW
                ========================================= */

                .attendance-row {
                    background:
                        var(
                            --bg-secondary,
                            #ffffff
                        );

                    transition:
                        background 0.15s ease;
                }

                .attendance-row:hover {
                    background:
                        var(
                            --bg-hover,
                            rgba(
                                148,
                                163,
                                184,
                                0.08
                            )
                        );
                }

                /* =========================================
                   VIEW BUTTON
                ========================================= */

                .attendance-view-btn {
                    background:
                        var(
                            --attendance-view-bg,
                            #eff6ff
                        );

                    color:
                        var(
                            --attendance-view-color,
                            #2563eb
                        );

                    border:
                        1px solid
                        var(
                            --attendance-view-border,
                            #bfdbfe
                        );
                }

                .attendance-view-btn:hover {
                    background:
                        var(
                            --attendance-view-hover,
                            #dbeafe
                        ) !important;

                    border-color:
                        #93c5fd !important;
                }

                /* =========================================
                   PAGINATION
                ========================================= */

                .attendance-page-btn {
                    color:
                        var(
                            --text-secondary,
                            #475569
                        );

                    background:
                        var(
                            --bg-secondary,
                            #ffffff
                        );

                    border:
                        1px solid
                        var(
                            --border-color,
                            #dbe3ee
                        );

                    border-radius: 6px;

                    transition:
                        all 0.15s ease;
                }

                .attendance-page-btn:hover:not(
                        :disabled
                    ) {
                    background:
                        var(
                            --bg-hover,
                            #eff6ff
                        ) !important;

                    border-color:
                        #93c5fd !important;

                    color:
                        #2563eb !important;
                }

                .attendance-page-btn:disabled {
                    opacity: 0.45;
                }

                /* =========================================
                   EXPORT BUTTON
                ========================================= */

                .attendance-export-btn {
                    background:
                        var(
                            --primary-color,
                            #1e3a5f
                        );

                    color: #ffffff;

                    transition:
                        opacity 0.2s ease,
                        background 0.2s ease;
                }

                .attendance-export-btn:hover:not(
                        :disabled
                    ) {
                    opacity: 0.9;
                }
            `}</style>

            {/* =================================================
                HEADER
            ================================================= */}

            <div
                style={{
                    marginBottom: '20px',
                }}
            >
                <h1
                    style={{
                        fontSize: '22px',
                        fontWeight: '800',

                        color:
                            'var(--text-primary, #1e293b)',

                        marginBottom: '4px',
                    }}
                >
                    Attendance report
                </h1>

                <p
                    style={{
                        fontSize: '13px',

                        color:
                            'var(--text-muted, #64748b)',

                        margin: 0,
                    }}
                >
                    View attendance for all
                    employees by date range.
                </p>
            </div>

            {/* =================================================
                FILTER SECTION
            ================================================= */}

            <div
                style={{
                    display: 'flex',

                    gap: '12px',

                    marginBottom: '16px',

                    flexWrap: 'wrap',

                    background:
                        'var(--bg-secondary, #ffffff)',

                    border:
                        '1px solid var(--border-color, #e2e8f0)',

                    borderRadius: '12px',

                    padding: '14px 16px',
                }}
            >
                {/* SEARCH */}

                <input
                    type="text"
                    placeholder="Search employee or code..."
                    value={search}
                    onChange={(e) => {
                        setSearch(
                            e.target.value
                        );

                        setPage(0);
                    }}
                    style={{
                        ...fieldStyle,

                        flex: 1,

                        minWidth: '200px',
                    }}
                />

                {/* FROM DATE */}

                <input
                    type="date"
                    value={fromDate}
                    max={maxDate}
                    onChange={
                        handleFromDateChange
                    }
                    style={{
                        ...fieldStyle,

                        minWidth: '160px',
                    }}
                />

                {/* TO DATE */}

                <input
                    type="date"
                    value={toDate}
                    max={maxDate}
                    onChange={
                        handleToDateChange
                    }
                    style={{
                        ...fieldStyle,

                        minWidth: '160px',
                    }}
                />

                {/* STATUS */}

                <select
                    value={statusFilter}
                    onChange={(e) => {
                        setStatusFilter(
                            e.target.value
                        );

                        setPage(0);
                    }}
                    style={{
                        ...fieldStyle,

                        minWidth: '128px',

                        cursor: 'pointer',
                    }}
                >
                    <option value="ALL">
                        All status
                    </option>

                    <option value="PRESENT">
                        Present
                    </option>

                    <option value="HALF_DAY">
                        Half day
                    </option>

                    <option value="ON_LEAVE">
                        On leave
                    </option>

                    <option value="ABSENT">
                        Absent
                    </option>
                </select>

                {/* EXPORT */}

                <button
                    className="attendance-export-btn"
                    onClick={handleExport}
                    disabled={exporting}
                    style={{
                        padding:
                            '8px 16px',

                        height: '40px',

                        border: 'none',

                        borderRadius: '8px',

                        fontSize: '13px',

                        fontWeight: '700',

                        cursor: exporting
                            ? 'not-allowed'
                            : 'pointer',

                        display: 'inline-flex',

                        alignItems: 'center',

                        justifyContent:
                            'center',

                        gap: '6px',

                        whiteSpace: 'nowrap',
                    }}
                >
                    {exporting ? (
                        <>
                            <Loader2
                                size={14}
                                className="animate-spin"
                            />

                            Exporting...
                        </>
                    ) : (
                        <>
                            <Download
                                size={14}
                            />

                            Export
                        </>
                    )}
                </button>
            </div>

            {/* =================================================
                TABLE
            ================================================= */}

            <div
                style={{
                    background:
                        'var(--bg-secondary, #ffffff)',

                    borderRadius: '12px',

                    border:
                        '1px solid var(--border-color, #e2e8f0)',

                    boxShadow:
                        '0 1px 4px rgba(0,0,0,0.04)',

                    overflow: 'hidden',
                }}
            >
                <div
                    style={{
                        width: '100%',
                        overflowX: 'auto',
                    }}
                >
                    <div
                        style={{
                            minWidth: '780px',
                        }}
                    >
                        {/* =================================================
                            TABLE HEADER
                        ================================================= */}

                        <div
                            style={{
                                display: 'grid',

                                gridTemplateColumns:
                                    '1.8fr 1.1fr 0.9fr 0.9fr 0.9fr 0.9fr 0.8fr',

                                padding:
                                    '11px 26px',

                                /*
                                 * IMPORTANT:
                                 * Do NOT use #f8fafc here.
                                 * This must follow the theme.
                                 */

                                background:
                                    'var(--bg-secondary, #ffffff)',

                                borderBottom:
                                    '1px solid var(--border-color, #e2e8f0)',
                            }}
                        >
                            {[
                                'Name',
                                'Department',
                                'Status',
                                'Check in',
                                'Check out',
                                'Break',
                                '',
                            ].map(
                                (
                                    header,
                                    index
                                ) => (
                                    <div
                                        key={`${header}-${index}`}
                                        style={{
                                            fontSize:
                                                '11px',

                                            fontWeight:
                                                '700',

                                            color:
                                                'var(--text-muted, #64748b)',

                                            textTransform:
                                                'uppercase',

                                            letterSpacing:
                                                '0.5px',
                                        }}
                                    >
                                        {header}
                                    </div>
                                )
                            )}
                        </div>

                        {/* =================================================
                            TABLE BODY
                        ================================================= */}

                        {loading ? (
                            <div
                                style={{
                                    textAlign:
                                        'center',

                                    padding: '60px',

                                    color:
                                        'var(--text-muted, #94a3b8)',

                                    fontSize:
                                        '13px',

                                    background:
                                        'var(--bg-secondary, #ffffff)',
                                }}
                            >
                                Loading...
                            </div>
                        ) : filteredRows.length ===
                            0 ? (
                            <div
                                style={{
                                    textAlign:
                                        'center',

                                    padding: '60px',

                                    color:
                                        'var(--text-muted, #94a3b8)',

                                    fontSize:
                                        '13px',

                                    background:
                                        'var(--bg-secondary, #ffffff)',
                                }}
                            >
                                No attendance
                                records found
                                for this date.
                            </div>
                        ) : (
                            filteredRows.map(
                                (r) => (
                                    <div
                                        key={`${r.employeeId}-${r.employeeCode || ''}`}
                                        className="attendance-row"
                                        style={{
                                            display:
                                                'grid',

                                            gridTemplateColumns:
                                                '1.8fr 1.1fr 0.9fr 0.9fr 0.9fr 0.9fr 0.8fr',

                                            padding:
                                                '13px 26px',

                                            borderBottom:
                                                '1px solid var(--border-color, #f1f5f9)',

                                            alignItems:
                                                'center',
                                        }}
                                    >
                                        {/* EMPLOYEE */}

                                        <div>
                                            <div
                                                style={{
                                                    fontSize:
                                                        '13px',

                                                    fontWeight:
                                                        '600',

                                                    color:
                                                        'var(--text-primary, #1e293b)',
                                                }}
                                            >
                                                {
                                                    r.employeeName
                                                }
                                            </div>

                                            <div
                                                style={{
                                                    fontSize:
                                                        '11px',

                                                    color:
                                                        'var(--text-muted, #94a3b8)',

                                                    marginTop:
                                                        '2px',
                                                }}
                                            >
                                                {
                                                    r.employeeCode
                                                }
                                            </div>
                                        </div>

                                        {/* DEPARTMENT */}

                                        <div
                                            style={{
                                                fontSize:
                                                    '13px',

                                                color:
                                                    'var(--text-secondary, #64748b)',

                                                fontWeight:
                                                    '500',
                                            }}
                                        >
                                            {r.departmentName ||
                                                '—'}
                                        </div>

                                        {/* STATUS */}

                                        <div>
                                            <StatusBadge
                                                status={
                                                    r.status
                                                }
                                            />
                                        </div>

                                        {/* CHECK IN */}

                                        <div
                                            style={{
                                                fontSize:
                                                    '13px',

                                                color:
                                                    'var(--text-secondary, #64748b)',

                                                fontWeight:
                                                    '500',
                                            }}
                                        >
                                            {r.checkIn
                                                ? String(
                                                    r.checkIn
                                                ).slice(
                                                    0,
                                                    5
                                                )
                                                : '--'}
                                        </div>

                                        {/* CHECK OUT */}

                                        <div
                                            style={{
                                                fontSize:
                                                    '13px',

                                                color:
                                                    'var(--text-secondary, #64748b)',

                                                fontWeight:
                                                    '500',
                                            }}
                                        >
                                            {r.checkOut
                                                ? String(
                                                    r.checkOut
                                                ).slice(
                                                    0,
                                                    5
                                                )
                                                : '--'}
                                        </div>

                                        {/* BREAK */}

                                        <div
                                            style={{
                                                fontSize:
                                                    '13px',

                                                color:
                                                    r.onBreak
                                                        ? '#f59e0b'
                                                        : 'var(--text-secondary, #64748b)',

                                                fontWeight:
                                                    r.onBreak
                                                        ? '700'
                                                        : '400',
                                            }}
                                        >
                                            {r.onBreak
                                                ? 'On break'
                                                : formatBreakTimes(
                                                    r.breaks
                                                )}
                                        </div>

                                        {/* VIEW */}

                                        <div>
                                            <button
                                                className="attendance-view-btn"
                                                onClick={() =>
                                                    setSelectedEmployeeId(
                                                        r.employeeId
                                                    )
                                                }
                                                style={{
                                                    padding:
                                                        '6px 14px',

                                                    borderRadius:
                                                        '6px',

                                                    fontSize:
                                                        '12px',

                                                    fontWeight:
                                                        '700',

                                                    cursor:
                                                        'pointer',

                                                    transition:
                                                        'all 0.15s ease',
                                                }}
                                            >
                                                View
                                            </button>
                                        </div>
                                    </div>
                                )
                            )
                        )}
                    </div>
                </div>

                {/* =================================================
                    PAGINATION
                ================================================= */}

                {totalPages > 1 && (
                    <div
                        style={{
                            display: 'flex',

                            justifyContent:
                                'center',

                            alignItems:
                                'center',

                            gap: '12px',

                            padding: '14px',

                            borderTop:
                                '1px solid var(--border-color, #f1f5f9)',

                            background:
                                'var(--bg-secondary, #ffffff)',
                        }}
                    >
                        <button
                            className="attendance-page-btn"
                            disabled={
                                page === 0
                            }
                            onClick={() =>
                                setPage(
                                    (p) =>
                                        Math.max(
                                            0,
                                            p - 1
                                        )
                                )
                            }
                            style={{
                                padding:
                                    '6px 14px',

                                fontSize:
                                    '12px',

                                cursor:
                                    page === 0
                                        ? 'not-allowed'
                                        : 'pointer',
                            }}
                        >
                            ← Prev
                        </button>

                        <span
                            style={{
                                fontSize:
                                    '12px',

                                color:
                                    'var(--text-muted, #64748b)',

                                fontWeight:
                                    '500',
                            }}
                        >
                            Page {page + 1}{' '}
                            of {totalPages}
                        </span>

                        <button
                            className="attendance-page-btn"
                            disabled={
                                page + 1 >=
                                totalPages
                            }
                            onClick={() =>
                                setPage(
                                    (p) =>
                                        p + 1
                                )
                            }
                            style={{
                                padding:
                                    '6px 14px',

                                fontSize:
                                    '12px',

                                cursor:
                                    page + 1 >=
                                        totalPages
                                        ? 'not-allowed'
                                        : 'pointer',
                            }}
                        >
                            Next →
                        </button>
                    </div>
                )}
            </div>

            {/* =================================================
                EMPLOYEE ATTENDANCE MODAL
            ================================================= */}

            {selectedEmployeeId && (
                <EmployeeAttendanceModal
                    employeeId={
                        selectedEmployeeId
                    }
                    asOfDate={toDate}
                    onClose={() =>
                        setSelectedEmployeeId(
                            null
                        )
                    }
                />
            )}
        </div>
    );
}