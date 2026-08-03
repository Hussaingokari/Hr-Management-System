'use client';
import { useState, useEffect } from 'react';
import { getMyPayslips, downloadPayslipPdf } from '@/lib/employeeApi';
import api from '@/lib/axios';
import toast from 'react-hot-toast';

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

function PayslipListItem({ p, selected, onSelect, formatCurrency }) {
  const isSelected = selected?.payslipNumber === p.payslipNumber;
  return (
    <button
      type="button"
      onClick={() => onSelect(p.payslipNumber)}
      style={{
        width: '100%',
        textAlign: 'left',
        border: 'none',
        display: 'block',
        padding: '16px 20px',
        borderBottom: '1px solid #f1f5f9',
        cursor: 'pointer',
        background: isSelected ? '#eff6ff' : 'white',
        borderLeft: isSelected ? '3px solid #3b82f6' : '3px solid transparent',
        transition: 'all 0.15s',
      }}
      onMouseEnter={e => {
        if (!isSelected) e.currentTarget.style.background = '#f8fafc';
      }}
      onMouseLeave={e => {
        if (!isSelected) e.currentTarget.style.background = 'white';
      }}
      onFocus={e => {
        if (!isSelected) e.currentTarget.style.background = '#f8fafc';
      }}
      onBlur={e => {
        if (!isSelected) e.currentTarget.style.background = 'white';
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ fontSize: '14px', fontWeight: '700', color: '#1e293b', marginBottom: '4px' }}>
            {MONTHS[(p.month || 1) - 1]} {p.year}
          </div>
          <div style={{ fontSize: '12px', color: '#94a3b8' }}>
            {p.payslipNumber}
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '16px', fontWeight: '800', color: '#16a34a', marginBottom: '4px' }}>
            {formatCurrency(p.netSalary)}
          </div>
          <span style={{
            background: p.paid ? '#dcfce7' : '#fef9c3',
            color: p.paid ? '#16a34a' : '#ca8a04',
            padding: '2px 8px', borderRadius: '20px',
            fontSize: '10px', fontWeight: '700',
          }}>
            {p.paid ? 'PAID' : 'PENDING'}
          </span>
        </div>
      </div>
    </button>
  );
}

function PayslipListView({ loading, payslips, selected, onSelect, page, totalPages, setPage, formatCurrency }) {
  const renderListContent = () => {
    if (loading) {
      return <div style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>Loading...</div>;
    }
    if (payslips.length === 0) {
      return (
        <div style={{ padding: '60px', textAlign: 'center' }}>
          <div style={{ fontSize: '40px', marginBottom: '12px' }}>💰</div>
          <div style={{ fontSize: '15px', fontWeight: '600', color: '#1e293b', marginBottom: '4px' }}>
            No payslips yet
          </div>
          <div style={{ fontSize: '13px', color: '#94a3b8' }}>
            Payslips will appear here once HR generates them
          </div>
        </div>
      );
    }
    return (
      <>
        {payslips.map((p) => (
          <PayslipListItem
            key={p.payslipNumber || p.id}
            p={p}
            selected={selected}
            onSelect={onSelect}
            formatCurrency={formatCurrency}
          />
        ))}

        {/* Pagination */}
        {totalPages > 1 && (
          <div style={{ padding: '14px 20px', display: 'flex', justifyContent: 'center', gap: '8px', borderTop: '1px solid #e2e8f0' }}>
            <button
              onClick={() => setPage(prev => Math.max(0, prev - 1))}
              disabled={page === 0}
              style={{ padding: '6px 14px', border: '1px solid #e2e8f0', borderRadius: '6px', fontSize: '12px', fontWeight: '600', color: page === 0 ? '#cbd5e1' : '#374151', background: 'white', cursor: page === 0 ? 'not-allowed' : 'pointer' }}
            >← Prev</button>
            <span style={{ padding: '6px 14px', fontSize: '12px', color: '#64748b' }}>
              {page + 1} / {totalPages}
            </span>
            <button
              onClick={() => setPage(prev => Math.min(totalPages - 1, prev + 1))}
              disabled={page >= totalPages - 1}
              style={{ padding: '6px 14px', border: '1px solid #e2e8f0', borderRadius: '6px', fontSize: '12px', fontWeight: '600', color: page >= totalPages - 1 ? '#cbd5e1' : '#374151', background: 'white', cursor: page >= totalPages - 1 ? 'not-allowed' : 'pointer' }}
            >Next →</button>
          </div>
        )}
      </>
    );
  };

  return (
    <div style={{
      background: 'white', borderRadius: '12px',
      border: '1px solid #e2e8f0',
      boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
      overflow: 'hidden',
    }}>
      <div style={{ padding: '16px 20px', borderBottom: '1px solid #e2e8f0' }}>
        <h3 style={{ fontSize: '15px', fontWeight: '700', color: '#1e293b' }}>Payslip History</h3>
      </div>
      {renderListContent()}
    </div>
  );
}

function PayslipDetailView({ selected, loadingDetail, formatCurrency }) {
  const [downloading, setDownloading] = useState(false);

  const handleDownload = async () => {
    setDownloading(true);
    try {
      const res = await downloadPayslipPdf(selected.payslipNumber);
      const blob = new Blob([res.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${selected.payslipNumber}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      toast.success('Payslip downloaded');
    } catch (err) {
      console.error('Error downloading payslip:', err);
      toast.error('Failed to download payslip');
    } finally {
      setDownloading(false);
    }
  };

  if (loadingDetail) {
    return (
      <div style={{
        background: 'white', borderRadius: '12px',
        border: '1px solid #e2e8f0',
        boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
        overflow: 'hidden', padding: '40px', textAlign: 'center', color: '#94a3b8'
      }}>
        Loading details...
      </div>
    );
  }

  const earningsList = [
    { label: 'Basic Salary', value: selected.basicSalary },
    { label: 'HRA (40%)', value: selected.hra },
    { label: 'DA (10%)', value: selected.da },
    { label: 'Special Allowance', value: selected.specialAllowance },
  ];

  const deductionsList = [
    { label: 'ESI ', value: selected.esi },
    { label: 'TDS', value: selected.tds },
    { label: 'PF', value: 0 },
    { label: 'Professional Tax', value: 0 },
  ];

  return (
    <div style={{
      background: 'white', borderRadius: '12px',
      border: '1px solid #e2e8f0',
      boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
      overflow: 'hidden',
    }}>
      {/* Payslip Header */}
      <div style={{
        background: 'linear-gradient(135deg, #1e3a5f, #2563eb)',
        padding: '20px 24px', color: 'white',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.7)', marginBottom: '4px', letterSpacing: '1px' }}>
              PAYSLIP
            </div>
            <div style={{ fontSize: '18px', fontWeight: '800', marginBottom: '4px' }}>
              {MONTHS[(selected.month || 1) - 1]} {selected.year}
            </div>
            <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.7)' }}>
              {selected.payslipNumber}
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.7)', marginBottom: '4px' }}>NET SALARY</div>
            <div style={{ fontSize: '28px', fontWeight: '900' }}>
              {formatCurrency(selected.netSalary)}
            </div>
            <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.7)', marginTop: '4px' }}>
              {selected.paid ? `Paid on ${selected.payDate}` : 'Payment Pending'}
            </div>
          </div>
        </div>

        {/* Employee info */}
        <div style={{
          marginTop: '16px', paddingTop: '16px',
          borderTop: '1px solid rgba(255,255,255,0.2)',
          display: 'grid', gridTemplateColumns: '1fr 1fr',
          gap: '8px',
        }}>
          <div>
            <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.6)' }}>EMPLOYEE</div>
            <div style={{ fontSize: '13px', fontWeight: '600' }}>{selected.employeeName}</div>
          </div>
          <div>
            <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.6)' }}>EMPLOYEE CODE</div>
            <div style={{ fontSize: '13px', fontWeight: '600' }}>{selected.employeeCode}</div>
          </div>
          <div>
            <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.6)' }}>PRESENT DAYS</div>
            <div style={{ fontSize: '13px', fontWeight: '600' }}>{selected.presentDays} days</div>
          </div>
          <div>
            <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.6)' }}>LOP DAYS</div>
            <div style={{ fontSize: '13px', fontWeight: '600' }}>{selected.lopDays} days</div>
          </div>
        </div>
      </div>

      {/* Earnings & Deductions */}
      <div style={{ padding: '20px 24px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>

          {/* Earnings */}
          <div>
            <div style={{ fontSize: '12px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '12px' }}>
              Earnings
            </div>
            {earningsList.map((item) => (
              <div key={item.label} style={{
                display: 'flex', justifyContent: 'space-between',
                padding: '8px 0', borderBottom: '1px solid #f1f5f9',
                fontSize: '13px',
              }}>
                <span style={{ color: '#64748b' }}>{item.label}</span>
                <span style={{ fontWeight: '600', color: '#1e293b' }}>{formatCurrency(item.value)}</span>
              </div>
            ))}
            <div style={{
              display: 'flex', justifyContent: 'space-between',
              padding: '10px 0', fontSize: '14px', fontWeight: '800',
              color: '#1e293b', borderTop: '2px solid #e2e8f0', marginTop: '4px',
            }}>
              <span>Gross Salary</span>
              <span style={{ color: '#16a34a' }}>{formatCurrency(selected.grossSalary)}</span>
            </div>
          </div>

          {/* Deductions */}
          <div>
            <div style={{ fontSize: '12px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '12px' }}>
              Deductions
            </div>
            {deductionsList.map((item) => (
              <div key={item.label} style={{
                display: 'flex', justifyContent: 'space-between',
                padding: '8px 0', borderBottom: '1px solid #f1f5f9',
                fontSize: '13px',
              }}>
                <span style={{ color: '#64748b' }}>{item.label}</span>
                <span style={{ fontWeight: '600', color: '#dc2626' }}>{formatCurrency(item.value)}</span>
              </div>
            ))}
            <div style={{
              display: 'flex', justifyContent: 'space-between',
              padding: '10px 0', fontSize: '14px', fontWeight: '800',
              color: '#1e293b', borderTop: '2px solid #e2e8f0', marginTop: '4px',
            }}>
              <span>Total Deductions</span>
              <span style={{ color: '#dc2626' }}>{formatCurrency(selected.totalDeductions)}</span>
            </div>
          </div>
        </div>

        {/* Net Salary */}
        <div style={{
          background: 'linear-gradient(135deg, #f0fdf4, #dcfce7)',
          border: '1px solid #bbf7d0',
          borderRadius: '10px', padding: '16px 20px',
          display: 'flex', justifyContent: 'space-between',
          alignItems: 'center', marginBottom: '16px',
        }}>
          <div>
            <div style={{ fontSize: '12px', color: '#64748b', fontWeight: '600', marginBottom: '4px' }}>NET SALARY</div>
            <div style={{ fontSize: '11px', color: '#94a3b8' }}>Gross - Total Deductions</div>
          </div>
          <div style={{ fontSize: '28px', fontWeight: '900', color: '#16a34a' }}>
            {formatCurrency(selected.netSalary)}
          </div>
        </div>

        {/* Download Button */}
        <button
          onClick={handleDownload}
          disabled={downloading}
          style={{
            width: '100%', padding: '12px',
            background: '#1e3a5f', color: 'white',
            border: 'none', borderRadius: '10px',
            fontSize: '14px', fontWeight: '700',
            cursor: downloading ? 'not-allowed' : 'pointer',
            opacity: downloading ? 0.7 : 1,
            display: 'flex', alignItems: 'center',
            justifyContent: 'center', gap: '8px',
          }}
        >
          ⬇ {downloading ? 'Downloading...' : 'Download Payslip PDF'}
        </button>
      </div>
    </div>
  );
}

export default function PayslipsPage() {
  const [payslips, setPayslips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  useEffect(() => {
    let active = true;
    const fetchPayslips = async () => {
      try {
        const res = await getMyPayslips(page, 10);
        if (active) {
          const data = res.data?.data;
          setPayslips(data?.content || []);
          setTotalPages(data?.totalPages || 0);
          setLoading(false);
        }
      } catch (err) {
        console.error('Error fetching payslips:', err);
        if (active) {
          toast.error(err?.response?.data?.message || 'Failed to load payslips');
          setLoading(false);
        }
      }
    };
    fetchPayslips();
    return () => { active = false; };
  }, [page]);

  const fetchDetail = async (payslipNumber) => {
    setLoadingDetail(true);
    try {
      const res = await api.get(`/api/payslips/${payslipNumber}`);
      setSelected(res.data?.data);
    } catch (err) {
      console.error('Error fetching payslip details:', err);
      toast.error(err?.response?.data?.message || 'Failed to load payslip details');
    } finally {
      setLoadingDetail(false);
    }
  };

  const formatCurrency = (amount) => {
    if (!amount && amount !== 0) return '—';
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '22px', fontWeight: '800', color: '#1e293b', marginBottom: '4px' }}>
          My Payslips
        </h1>
        <p style={{ fontSize: '13px', color: '#94a3b8' }}>
          View and download your monthly payslips
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: selected ? '1fr 1.4fr' : '1fr', gap: '20px' }}>
        <PayslipListView
          loading={loading}
          payslips={payslips}
          selected={selected}
          onSelect={fetchDetail}
          page={page}
          totalPages={totalPages}
          setPage={setPage}
          formatCurrency={formatCurrency}
        />
        {selected && (
          <PayslipDetailView
            selected={selected}
            loadingDetail={loadingDetail}
            formatCurrency={formatCurrency}
          />
        )}
      </div>
    </div>
  );
}