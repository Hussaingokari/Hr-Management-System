'use client';
import { useEffect, useState, useMemo } from 'react';
import { getAttendanceSummaryByDate, exportAttendanceRange } from '@/lib/adminApi';
import { downloadBlob } from '@/lib/downloadFile';
import EmployeeAttendanceModal from './EmployeeAttendanceModal';
import toast from 'react-hot-toast';
import { Download, Loader2 } from 'lucide-react';

const STATUS_COLORS = {
    PRESENT: { bg: '#dcfce7', color: '#16a34a' },
    HALF_DAY: { bg: '#fff7ed', color: '#f59e0b' },
    ON_LEAVE: { bg: '#eff6ff', color: '#3b82f6' },
    ABSENT: { bg: '#fee2e2', color: '#dc2626' },
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
    if (!mins) return '--';
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

function formatBreakTimes(breaks) {
    if (!breaks || breaks.length === 0) return '--';
    return breaks
        .map((b) => {
            const start = b.breakStart ? String(b.breakStart).slice(0, 5) : '--';
            const end = b.breakEnd ? String(b.breakEnd).slice(0, 5) : '...';
            return `${start}-${end}`;
        })
        .join(', ');
}

function todayIST() {
    const now = new Date();
    const ist = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));
    return ist.toISOString().split('T')[0];
}

// Shared style for text inputs, date inputs, and the status select.
// color/background are set explicitly so the fields never inherit a
// faded/muted text color from a global stylesheet or dark-mode rule.
const fieldStyle = {
    padding: '8px 12px',
    border: '1px solid #e2e8f0',
    borderRadius: '8px',
    fontSize: '13px',
    color: '#1e293b',
    background: 'white',
    colorScheme: 'light',
};

export default function AttendanceReport() {
    const maxDate = useMemo(() => todayIST(), []);

    const [fromDate, setFromDate] = useState(todayIST());
    const [toDate, setToDate] = useState(todayIST());
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('ALL');
    const [rows, setRows] = useState([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(0);
    const [totalPages, setTotalPages] = useState(1);
    const [selectedEmployeeId, setSelectedEmployeeId] = useState(null);
    const [exporting, setExporting] = useState(false);

    useEffect(() => {
        let active = true;
        setLoading(true);
        getAttendanceSummaryByDate(toDate, page, 50)
            .then((res) => {
                if (!active) return;
                const pageData = res.data?.data;
                setRows(pageData?.content || []);
                setTotalPages(pageData?.totalPages ?? 1);
            })
            .catch((err) => {
                toast.error(err.response?.data?.message || 'Failed to load attendance');
            })
            .finally(() => {
                if (active) setLoading(false);
            });
        return () => { active = false; };
    }, [toDate, page]);

    const filteredRows = useMemo(() => {
        return rows.filter((r) => {
            const matchesSearch = !search ||
                r.employeeName?.toLowerCase().includes(search.toLowerCase()) ||
                r.employeeCode?.toLowerCase().includes(search.toLowerCase());
            const matchesStatus = statusFilter === 'ALL' || r.status === statusFilter;
            return matchesSearch && matchesStatus;
        });
    }, [rows, search, statusFilter]);

    const handleFromDateChange = (e) => {
        const val = e.target.value;
        if (val > maxDate) {
            toast.error('Future dates are not allowed');
            return;
        }
        if (val > toDate) {
            toast.error('From date cannot be after To date');
            return;
        }
        setFromDate(val);
    };

    const handleToDateChange = (e) => {
        const val = e.target.value;
        if (val > maxDate) {
            toast.error('Future dates are not allowed');
            return;
        }
        if (val < fromDate) {
            toast.error('To date cannot be before From date');
            return;
        }
        setToDate(val);
        setPage(0);
    };

    const handleExport = async () => {
        setExporting(true);
        try {
            const res = await exportAttendanceRange(fromDate, toDate, statusFilter, search);
            downloadBlob(res, `attendance_${fromDate}_to_${toDate}.xlsx`);
        } catch (err) {
            toast.error(err.response?.data?.message || 'Export failed');
        } finally {
            setExporting(false);
        }
    };

    return (
        <div>
            {/* Ensures placeholder text (e.g. "Search employee or code...")
                stays a visible, deliberate gray instead of inheriting a
                near-invisible color from elsewhere. */}
            <style jsx>{`
                input::placeholder {
                    color: #94a3b8;
                    opacity: 1;
                }
                input[type='date']::-webkit-calendar-picker-indicator {
                    filter: none;
                    opacity: 1;
                }
            `}</style>

            <div style={{ marginBottom: '20px' }}>
                <h1 style={{ fontSize: '22px', fontWeight: '800', color: 'var(--text-primary)', marginBottom: '4px' }}>
                    Attendance report
                </h1>
                <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                    View attendance for all employees by date range.
                </p>
            </div>

            <div style={{
                display: 'flex', gap: '12px', marginBottom: '16px', flexWrap: 'wrap',
                background: 'var(--bg-secondary, transparent)', border: '1px solid var(--border-color, #e2e8f0)', borderRadius: '12px', padding: '14px 16px',
            }}>
                <input
                    type="text"
                    placeholder="Search employee or code..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    style={{ ...fieldStyle, flex: 1, minWidth: '200px' }}
                />
                <input
                    type="date"
                    value={fromDate}
                    max={maxDate}
                    onChange={handleFromDateChange}
                    style={fieldStyle}
                />
                <input
                    type="date"
                    value={toDate}
                    max={maxDate}
                    onChange={handleToDateChange}
                    style={fieldStyle}
                />
                <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    style={fieldStyle}
                >
                    <option value="ALL">All status</option>
                    <option value="PRESENT">Present</option>
                    <option value="HALF_DAY">Half day</option>
                    <option value="ON_LEAVE">On leave</option>
                    <option value="ABSENT">Absent</option>
                </select>
                <button
                    onClick={handleExport}
                    disabled={exporting}
                    style={{
                        padding: '8px 16px', background: '#1e3a5f', color: 'white',
                        border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: '700',
                        cursor: exporting ? 'not-allowed' : 'pointer',
                    }}
                >
                    {exporting ? <><Loader2 size={14} className="animate-spin inline" /> Exporting...</> : <><Download size={14} className="inline" /> Export</>}
                </button>
            </div>

            <div style={{
                background: 'white', borderRadius: '12px', border: '1px solid #e2e8f0',
                boxShadow: '0 1px 4px rgba(0,0,0,0.04)', overflow: 'hidden',
            }}>
                <div className="table-responsive">
                    <div style={{ minWidth: '780px' }}>
                        <div style={{
                            display: 'grid', gridTemplateColumns: '1.8fr 1.1fr 0.9fr 0.9fr 0.9fr 0.9fr 0.8fr',
                            padding: '10px 20px', background: '#f8fafc', borderBottom: '1px solid #e2e8f0',
                        }}>
                            {['Name', 'Department', 'Status', 'Check in', 'Check out', 'Break', ''].map((h) => (
                                <div key={h} style={{
                                    fontSize: '11px', fontWeight: '700', color: '#64748b',
                                    textTransform: 'uppercase', letterSpacing: '0.5px',
                                }}>
                                    {h}
                                </div>
                            ))}
                        </div>

                        {loading ? (
                            <div style={{ textAlign: 'center', padding: '60px', color: '#94a3b8' }}>Loading...</div>
                        ) : filteredRows.length === 0 ? (
                            <div style={{ textAlign: 'center', padding: '60px', color: '#94a3b8' }}>
                                No attendance records found for this date.
                            </div>
                        ) : (
                            filteredRows.map((r) => (
                                <div key={r.employeeId} style={{
                                    display: 'grid', gridTemplateColumns: '1.8fr 1.1fr 0.9fr 0.9fr 0.9fr 0.9fr 0.8fr',
                                    padding: '12px 20px', borderBottom: '1px solid #f1f5f9', alignItems: 'center',
                                }}>
                                    <div>
                                        <div style={{ fontSize: '13px', fontWeight: '600', color: '#1e293b' }}>
                                            {r.employeeName}
                                        </div>
                                        <div style={{ fontSize: '11px', color: '#94a3b8' }}>{r.employeeCode}</div>
                                    </div>
                                    <div style={{ fontSize: '13px', color: '#64748b' }}>{r.departmentName || '—'}</div>
                                    <div><StatusBadge status={r.status} /></div>
                                    <div style={{ fontSize: '13px', color: '#64748b' }}>
                                        {r.checkIn ? String(r.checkIn).slice(0, 5) : '--'}
                                    </div>
                                    <div style={{ fontSize: '13px', color: '#64748b' }}>
                                        {r.checkOut ? String(r.checkOut).slice(0, 5) : '--'}
                                    </div>
                                    <div style={{ fontSize: '13px', color: r.onBreak ? '#f59e0b' : '#64748b', fontWeight: r.onBreak ? '700' : '400' }}>
                                        {r.onBreak ? 'On break' : formatBreakTimes(r.breaks)}
                                    </div>
                                    <div>
                                        <button
                                            onClick={() => setSelectedEmployeeId(r.employeeId)}
                                            style={{
                                                padding: '6px 14px', background: '#eff6ff', color: '#3b82f6',
                                                border: '1px solid #bfdbfe', borderRadius: '6px',
                                                fontSize: '12px', fontWeight: '700', cursor: 'pointer',
                                            }}
                                        >
                                            View
                                        </button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {totalPages > 1 && (
                    <div style={{
                        display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '12px',
                        padding: '14px', borderTop: '1px solid #f1f5f9',
                    }}>
                        <button
                            disabled={page === 0}
                            onClick={() => setPage((p) => Math.max(0, p - 1))}
                            style={{ padding: '6px 14px', fontSize: '12px', cursor: page === 0 ? 'not-allowed' : 'pointer' }}
                        >
                            ← Prev
                        </button>
                        <span style={{ fontSize: '12px', color: '#64748b' }}>
                            Page {page + 1} of {totalPages}
                        </span>
                        <button
                            disabled={page + 1 >= totalPages}
                            onClick={() => setPage((p) => p + 1)}
                            style={{ padding: '6px 14px', fontSize: '12px', cursor: page + 1 >= totalPages ? 'not-allowed' : 'pointer' }}
                        >
                            Next →
                        </button>
                    </div>
                )}
            </div>

            {selectedEmployeeId && (
                <EmployeeAttendanceModal
                    employeeId={selectedEmployeeId}
                    asOfDate={toDate}
                    onClose={() => setSelectedEmployeeId(null)}
                />
            )}
        </div>
    );
}