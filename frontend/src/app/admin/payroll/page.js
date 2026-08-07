'use client';
import { useState, useEffect, useCallback } from 'react';
import {
  getAllEmployees,
  getPayrollByMonth,
  generatePayroll,
  markPayrollPaid,
  generatePayslip,
} from '@/lib/adminApi';
import toast from 'react-hot-toast';
import { Users, Banknote, MinusCircle, Wallet, CheckCircle, FileText, Loader2 } from 'lucide-react';

const MONTHS = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December'
];

const currentMonth = new Date().getMonth() + 1;
const currentYear  = new Date().getFullYear();

export default function PayrollPage() {
  const [employees, setEmployees]     = useState([]);
  const [payrolls, setPayrolls]       = useState([]);
  const [loading, setLoading]         = useState(false);
  const [generating, setGenerating]   = useState(false);
  const [month, setMonth]             = useState(currentMonth);
  const [year, setYear]               = useState(currentYear);
  const [showForm, setShowForm]       = useState(false);
  const [actioningId, setActioningId] = useState(null);

  const [form, setForm] = useState({
    employeeId: '',
    month: currentMonth,
    year: currentYear,
  });

  const fetchEmployees = useCallback(async () => {
    try {
      const res = await getAllEmployees(0, 100);
      setEmployees(res.data?.data?.content || []);
    } catch (err) {
      console.error('Error fetching employees:', err);
    }
  }, []);

  const fetchPayroll = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getPayrollByMonth(month, year);
      setPayrolls(res.data?.data?.content || res.data?.data || []);
    } catch (err) {
      if (err.response?.status !== 404) {
        toast.error('Failed to load payroll');
      }
      setPayrolls([]);
    } finally {
      setLoading(false);
    }
  }, [month, year]);

  useEffect(() => {
    const timer = setTimeout(() => { fetchEmployees(); }, 0);
    return () => clearTimeout(timer);
  }, [fetchEmployees]);

  useEffect(() => {
    const timer = setTimeout(() => { fetchPayroll(); }, 0);
    return () => clearTimeout(timer);
  }, [fetchPayroll]);

  const handleGenerate = async (e) => {
    e.preventDefault();
    if (!form.employeeId) {
      toast.error('Please select an employee');
      return;
    }
    setGenerating(true);
    try {
      await generatePayroll(
        parseInt(form.employeeId),
        parseInt(form.month),
        parseInt(form.year)
      );
      toast.success('Payroll generated successfully!');
      setShowForm(false);
      setMonth(parseInt(form.month));
      setYear(parseInt(form.year));
      fetchPayroll();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to generate payroll');
    } finally {
      setGenerating(false);
    }
  };

  const handleMarkPaid = async (id) => {
    setActioningId(id + 'pay');
    try {
      await markPayrollPaid(id);
      toast.success('Payroll marked as paid!');
      fetchPayroll();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to mark as paid');
    } finally {
      setActioningId(null);
    }
  };

  const handleGeneratePayslip = async (id) => {
    setActioningId(id + 'slip');
    try {
      await generatePayslip(id);
      toast.success('Payslip generated successfully!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to generate payslip');
    } finally {
      setActioningId(null);
    }
  };

  const formatCurrency = (amount) => {
    if (!amount && amount !== 0) return '—';
    return '₹' + Number(amount).toLocaleString('en-IN', {
      minimumFractionDigits: 2,
    });
  };

  const totalGross = payrolls.reduce((s, p) => s + (p.grossSalary || 0), 0);
  const totalNet   = payrolls.reduce((s, p) => s + (p.netSalary   || 0), 0);
  const totalDed   = payrolls.reduce((s, p) => s + (p.totalDeductions || 0), 0);
  const paidCount  = payrolls.filter(p => p.paid).length;

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: '800', color: 'var(--text-primary)', marginBottom: '4px' }}>
            Payroll Management
          </h1>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
            Generate and manage employee payroll
          </p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          style={{
            padding: '10px 20px', background: '#1e3a5f',
            color: 'white', border: 'none', borderRadius: '10px',
            fontSize: '13px', fontWeight: '700', cursor: 'pointer',
          }}
        >
          + Generate Payroll
        </button>
      </div>

      {/* Month/Year Filter */}
      <div style={{
        background: 'var(--card-bg)', borderRadius: '12px', padding: '16px 20px',
        border: '1px solid var(--card-border)', marginBottom: '20px',
        display: 'flex', alignItems: 'center', gap: '16px',
        boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
      }}>
        <span style={{ fontSize: '13px', fontWeight: '600', color: '#374151' }}>Filter by:</span>
        <select
          value={month}
          onChange={e => setMonth(parseInt(e.target.value))}
          style={{
            padding: '8px 14px', border: '1.5px solid #e2e8f0',
            borderRadius: '8px', fontSize: '13px', outline: 'none',
            background: 'var(--card-bg)', fontWeight: '500',
          }}
        >
          {MONTHS.map((m, i) => (
            <option key={i} value={i + 1}>{m}</option>
          ))}
        </select>

        <select
          value={year}
          onChange={e => setYear(parseInt(e.target.value))}
          style={{
            padding: '8px 14px', border: '1.5px solid #e2e8f0',
            borderRadius: '8px', fontSize: '13px', outline: 'none',
            background: 'var(--card-bg)', fontWeight: '500',
          }}
        >
          {[2024, 2025, 2026, 2027].map(y => (
            <option key={y} value={y}>{y}</option>
          ))}
        </select>

        <button
          onClick={fetchPayroll}
          style={{
            padding: '8px 20px', background: '#1e3a5f',
            color: 'white', border: 'none', borderRadius: '8px',
            fontSize: '13px', fontWeight: '700', cursor: 'pointer',
          }}
        >
          Load
        </button>
      </div>

      {/* Summary Cards */}
      {payrolls.length > 0 && (
        <div style={{ display: 'flex', gap: '14px', marginBottom: '20px' }}>
          {[
            { label: 'Total Employees', value: payrolls.length, color: '#1e3a5f', bg: '#eff6ff', icon: <Users size={16} color="#1e3a5f" /> },
            { label: 'Total Gross', value: formatCurrency(totalGross), color: '#16a34a', bg: '#dcfce7', icon: <Banknote size={16} color="#16a34a" /> },
            { label: 'Total Deductions', value: formatCurrency(totalDed), color: '#dc2626', bg: '#fee2e2', icon: <MinusCircle size={16} color="#dc2626" /> },
            { label: 'Total Net Pay', value: formatCurrency(totalNet), color: '#f59e0b', bg: '#fff7ed', icon: <Wallet size={16} color="#f59e0b" /> },
            { label: 'Paid', value: `${paidCount}/${payrolls.length}`, color: '#8b5cf6', bg: '#fdf4ff', icon: <CheckCircle size={16} color="#8b5cf6" /> },
          ].map((s, i) => (
            <div key={i} style={{
              flex: 1, background: 'var(--card-bg)', borderRadius: '12px',
              padding: '16px', border: '1px solid var(--card-border)',
              boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: '600' }}>{s.label}</span>
                <div style={{ width: '28px', height: '28px', background: s.bg, borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px' }}>{s.icon}</div>
              </div>
              <div style={{ fontSize: '18px', fontWeight: '800', color: s.color }}>{s.value}</div>
            </div>
          ))}
        </div>
      )}

      {/* Payroll Table */}
      <div className="table-responsive" style={{
        background: 'var(--card-bg)', borderRadius: '12px',
        border: '1px solid var(--card-border)',
        boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
      }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--card-border)' }}>
          <h3 style={{ fontSize: '15px', fontWeight: '700', color: 'var(--text-primary)' }}>
            {MONTHS[month - 1]} {year} — Payroll Records
          </h3>
        </div>

        {/* Table Header */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '2fr 1.2fr 1.2fr 1.2fr 1.2fr 1fr 2fr',
          padding: '10px 20px', background: 'var(--bg-primary)',
          borderBottom: '1px solid var(--card-border)',
        }}>
          {['Employee', 'Gross', 'Deductions', 'Net Salary', 'Present Days', 'Status', 'Actions'].map(h => (
            <div key={h} style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              {h}
            </div>
          ))}
        </div>

        {loading ? (
          <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-muted)' }}>Loading...</div>
        ) : payrolls.length === 0 ? (
          <div style={{ padding: '80px', textAlign: 'center' }}>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '16px', color: '#1e3a5f' }}>
              <Wallet size={48} strokeWidth={1.5} />
            </div>
            <div style={{ fontSize: '16px', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '8px' }}>
              No payroll for {MONTHS[month - 1]} {year}
            </div>
            <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '16px' }}>
              Generate payroll for employees using the button above
            </div>
            <button
              onClick={() => setShowForm(true)}
              style={{ padding: '10px 20px', background: '#1e3a5f', color: 'white', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: '700', cursor: 'pointer' }}
            >
              + Generate Payroll
            </button>
          </div>
        ) : (
          payrolls.map((p, i) => (
            <div key={p.id} style={{
              display: 'grid',
              gridTemplateColumns: '2fr 1.2fr 1.2fr 1.2fr 1.2fr 1fr 2fr',
              padding: '13px 20px', borderBottom: '1px solid #f1f5f9',
              alignItems: 'center',
            }}>
              {/* Employee */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{
                  width: '34px', height: '34px', borderRadius: '50%',
                  background: 'linear-gradient(135deg, #1e3a5f, #3b82f6)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '11px', fontWeight: '700', color: 'white', flexShrink: 0,
                }}>
                  {p.employeeName?.split(' ').map(n => n[0]).join('').slice(0, 2)}
                </div>
                <div>
                  <div style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-primary)' }}>
                    {p.employeeName}
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{p.employeeCode}</div>
                </div>
              </div>

              <div style={{ fontSize: '13px', fontWeight: '600', color: '#16a34a' }}>
                {formatCurrency(p.grossSalary)}
              </div>
              <div style={{ fontSize: '13px', fontWeight: '600', color: '#dc2626' }}>
                {formatCurrency(p.totalDeductions)}
              </div>
              <div style={{ fontSize: '14px', fontWeight: '800', color: '#1e3a5f' }}>
                {formatCurrency(p.netSalary)}
              </div>
              <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                {p.presentDays} days
              </div>

              {/* Status */}
              <span style={{
                background: p.paid ? '#dcfce7' : '#fef9c3',
                color: p.paid ? '#16a34a' : '#ca8a04',
                padding: '3px 10px', borderRadius: '20px',
                fontSize: '11px', fontWeight: '700',
              }}>
                {p.paid ? `PAID · ${p.payDate}` : 'UNPAID'}
              </span>

              {/* Actions */}
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                {!p.paid && (
                  <button
                    onClick={() => handleMarkPaid(p.id)}
                    disabled={actioningId === p.id + 'pay'}
                    style={{
                      padding: '5px 10px', background: '#dcfce7',
                      color: '#16a34a', border: '1px solid #bbf7d0',
                      borderRadius: '6px', fontSize: '11px', fontWeight: '700',
                      cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', minWidth: '90px'
                    }}
                  >
                    {actioningId === p.id + 'pay' ? <Loader2 size={12} className="animate-spin" /> : '✓ Mark Paid'}
                  </button>
                )}
                <button
                  onClick={() => handleGeneratePayslip(p.id)}
                  disabled={actioningId === p.id + 'slip'}
                  style={{
                    padding: '5px 10px', background: '#eff6ff',
                    color: '#3b82f6', border: '1px solid #bfdbfe',
                    borderRadius: '6px', fontSize: '11px', fontWeight: '700',
                    cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', minWidth: '80px'
                  }}
                >
                  {actioningId === p.id + 'slip' ? <Loader2 size={12} className="animate-spin" /> : <><FileText size={12} /> Payslip</>}
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Generate Payroll Modal */}
      {showForm && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 100, padding: '20px',
        }}>
          <div style={{
            background: 'var(--card-bg)', borderRadius: '16px', padding: '28px',
            width: '100%', maxWidth: '440px',
            boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ fontSize: '18px', fontWeight: '800', color: 'var(--text-primary)' }}>
                Generate Payroll
              </h2>
              <button onClick={() => setShowForm(false)}
                style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: 'var(--text-muted)' }}>✕</button>
            </div>

            <form onSubmit={handleGenerate}>
              {/* Employee */}
              <div style={{ marginBottom: '16px' }}>
                <label style={{ fontSize: '13px', fontWeight: '600', color: '#374151', display: 'block', marginBottom: '6px' }}>
                  Employee <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <select
                  value={form.employeeId}
                  onChange={e => setForm({ ...form, employeeId: e.target.value })}
                  required
                  style={{ width: '100%', padding: '10px 12px', border: '1.5px solid #e2e8f0', borderRadius: '10px', fontSize: '13px', outline: 'none', background: 'var(--card-bg)' }}
                >
                  <option value="">Select employee...</option>
                  {employees.map(emp => (
                    <option key={emp.id} value={emp.id}>
                      {emp.firstName} {emp.lastName} — {emp.employeeCode}
                    </option>
                  ))}
                </select>
              </div>

              {/* Month */}
              <div style={{ marginBottom: '16px' }}>
                <label style={{ fontSize: '13px', fontWeight: '600', color: '#374151', display: 'block', marginBottom: '6px' }}>
                  Month <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <select
                  value={form.month}
                  onChange={e => setForm({ ...form, month: e.target.value })}
                  style={{ width: '100%', padding: '10px 12px', border: '1.5px solid #e2e8f0', borderRadius: '10px', fontSize: '13px', outline: 'none', background: 'var(--card-bg)' }}
                >
                  {MONTHS.map((m, i) => (
                    <option key={i} value={i + 1}>{m}</option>
                  ))}
                </select>
              </div>

              {/* Year */}
              <div style={{ marginBottom: '24px' }}>
                <label style={{ fontSize: '13px', fontWeight: '600', color: '#374151', display: 'block', marginBottom: '6px' }}>
                  Year <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <select
                  value={form.year}
                  onChange={e => setForm({ ...form, year: e.target.value })}
                  style={{ width: '100%', padding: '10px 12px', border: '1.5px solid #e2e8f0', borderRadius: '10px', fontSize: '13px', outline: 'none', background: 'var(--card-bg)' }}
                >
                  {[2024, 2025, 2026, 2027].map(y => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'flex', gap: '10px' }}>
                <button type="button" onClick={() => setShowForm(false)}
                  style={{ flex: 1, padding: '12px', background: 'var(--card-bg)', color: '#374151', border: '1.5px solid #e2e8f0', borderRadius: '10px', fontSize: '14px', fontWeight: '600', cursor: 'pointer' }}>
                  Cancel
                </button>
                <button type="submit" disabled={generating}
                  style={{ flex: 1, padding: '12px', background: '#1e3a5f', color: 'white', border: 'none', borderRadius: '10px', fontSize: '14px', fontWeight: '700', cursor: generating ? 'not-allowed' : 'pointer', opacity: generating ? 0.7 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                  {generating ? <><Loader2 size={16} className="animate-spin" /> Generating...</> : 'Generate'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}