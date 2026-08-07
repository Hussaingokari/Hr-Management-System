'use client';
import { useState, useEffect, useCallback } from 'react';
import {
  getAllEmployees,
  searchEmployees,
  createEmployee,
  updateEmployee,
  deleteEmployee,
} from '@/lib/adminApi';
import toast from 'react-hot-toast';
import { FaEye, FaEyeSlash } from "react-icons/fa";
import { Users, AlertTriangle, Loader2 } from 'lucide-react';

function Badge({ status }) {
  const map = {
    ACTIVE: { bg: '#dcfce7', color: '#16a34a' },
    INACTIVE: { bg: '#fee2e2', color: '#dc2626' },
    ADMIN: { bg: '#dbeafe', color: '#1d4ed8' },
    HR: { bg: '#fdf4ff', color: '#9333ea' },
    EMPLOYEE: { bg: '#f1f5f9', color: '#374151' },
  };
  const style = map[status] || { bg: '#f1f5f9', color: '#64748b' };
  return (
    <span style={{ padding: '3px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '700', background: style.bg, color: style.color }}>
      {status}
    </span>
  );
}

// Shared style object for all text/select inputs so they always render
// with a light background + dark text, regardless of the page/browser
// being in dark mode. Without this, dark mode UA styles can make the
// typed value (and placeholder) nearly invisible against the input.
const INPUT_BASE_STYLE = {
  width: '100%',
  padding: '9px 12px',
  border: '1.5px solid #e2e8f0',
  borderRadius: '8px',
  fontSize: '13px',
  outline: 'none',
  boxSizing: 'border-box',
  background: '#ffffff',
  color: '#1e293b',
  colorScheme: 'light', // stops the browser from re-theming the field (and its placeholder) for dark mode
};

function InputField({
  label,
  name,
  type = 'text',
  required,
  placeholder,
  value,
  onChange,
  max,
  maxLength,
  numericOnly,
}) {
  return (
    <div>
      <label style={{ fontSize: '12px', fontWeight: '600', color: '#374151', display: 'block', marginBottom: '5px' }}>
        {label} {required && <span style={{ color: '#ef4444' }}>*</span>}
      </label>
      <input
        className="hrms-input"
        type={type}
        value={value || ''}
        onChange={e => {
          let val = e.target.value;
          if (numericOnly) {
            // Strip anything that isn't a digit — blocks letters and special characters
            val = val.replace(/[^0-9]/g, '');
          }
          if (maxLength) {
            val = val.slice(0, maxLength);
          }
          onChange(name, val);
        }}
        onKeyPress={e => {
          if (numericOnly && !/[0-9]/.test(e.key)) {
            e.preventDefault();
          }
        }}
        onPaste={e => {
          if (numericOnly) {
            const pasted = e.clipboardData.getData('text');
            if (/[^0-9]/.test(pasted)) {
              e.preventDefault();
            }
          }
        }}
        placeholder={placeholder}
        required={required}
        max={max}
        maxLength={maxLength}
        inputMode={numericOnly ? 'numeric' : undefined}
        style={INPUT_BASE_STYLE}
        onFocus={e => e.target.style.borderColor = '#3b82f6'}
        onBlur={e => e.target.style.borderColor = '#e2e8f0'}
      />
    </div>
  );
}

const EMPTY_FORM = {
  employeeId: "", firstName: '', lastName: '', email: '',
  password: '', phone: '', department: '',
  designation: '', basicSalary: '',
  dateOfJoining: '', dateOfBirth: '',
  role: 'EMPLOYEE',
};

export default function EmployeeManagementPage() {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [searching, setSearching] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(null);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);
  const [showPassword, setShowPassword] = useState(false);

  const fetchEmployees = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getAllEmployees(page, 10);
      const data = res.data?.data;
      const sortedEmployees = [...(data?.content || [])].sort((a, b) => {
        const empA = parseInt((a.employeeId || "").replace("EMP", ""), 10);
        const empB = parseInt((b.employeeId || "").replace("EMP", ""), 10);

        return empA - empB;
      });

      setEmployees(sortedEmployees); setTotalPages(data?.totalPages || 0);
      setTotalElements(data?.totalElements || 0);
    } catch (err) {
      toast.error('Failed to load employees');
    } finally {
      setLoading(false);
    }
  }, [page]);

  const handleSearch = useCallback(async () => {
    if (!search.trim()) return;
    setSearching(true);
    try {
      const res = await searchEmployees(search, page, 10);
      const data = res.data?.data;
      const sortedEmployees = [...(data?.content || [])].sort((a, b) => {
        const empA = parseInt((a.employeeId || "").replace("EMP", ""), 10);
        const empB = parseInt((b.employeeId || "").replace("EMP", ""), 10);

        return empA - empB;
      });

      setEmployees(sortedEmployees); setTotalPages(data?.totalPages || 0);
      setTotalElements(data?.totalElements || 0);
    } catch (err) {
      toast.error('Search failed');
    } finally {
      setSearching(false);
    }
  }, [search, page]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (search.trim()) {
        handleSearch();
      } else {
        fetchEmployees();
      }
    }, search.trim() ? 400 : 0);
    return () => clearTimeout(timer);
  }, [search, page, handleSearch, fetchEmployees]);

  const openAddForm = () => {
    setEditMode(false);
    setEditId(null);
    setForm(EMPTY_FORM);
    setShowForm(true);
  };

  const openEditForm = (emp) => {
    setEditMode(true);
    setEditId(emp.id);
    setForm({
      employeeId: emp.employeeId || '',
      firstName: emp.firstName || '',
      lastName: emp.lastName || '',
      email: emp.email || '',
      password: '',
      phone: emp.phone || '',
      department: emp.department || '',
      designation: emp.designation || '',
      basicSalary: emp.basicSalary || '',
      dateOfJoining: emp.dateOfJoining || '',
      dateOfBirth: emp.dateOfBirth || '',
      role: emp.role || 'EMPLOYEE',
    });
    setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (form.phone && form.phone.length !== 10) {
      toast.error('Phone number must be exactly 10 digits');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        ...form,
        basicSalary: form.basicSalary ? parseFloat(form.basicSalary) : 0,
      };
      if (editMode) {
        if (!payload.password) delete payload.password;
        await updateEmployee(editId, payload);
        toast.success('Employee updated successfully!');
      } else {
        await createEmployee(payload);
        toast.success('Employee created successfully!');
      }
      setShowForm(false);
      setForm(EMPTY_FORM);
      fetchEmployees();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Operation failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    setDeleting(id);
    try {
      await deleteEmployee(id);
      toast.success('Employee deleted successfully!');
      setShowDeleteConfirm(null);
      fetchEmployees();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Delete failed');
    } finally {
      setDeleting(null);
    }
  };

  const handleFieldChange = (name, val) => setForm(prev => ({ ...prev, [name]: val }));

  return (
    <div>
      {/* Scoped style so the placeholder text also stays visible in dark mode
          (::placeholder can't be set via inline style). */}
      <style>{`
        .hrms-input::placeholder {
          color: #94a3b8;
          opacity: 1;
        }
      `}</style>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: '800', color: '#1e293b', marginBottom: '4px' }}>
            Employee Management
          </h1>
          <p style={{ fontSize: '13px', color: '#94a3b8' }}>
            {totalElements} total employees
          </p>
        </div>
        <button
          onClick={openAddForm}
          style={{
            padding: '10px 20px', background: '#1e3a5f',
            color: 'white', border: 'none', borderRadius: '10px',
            fontSize: '13px', fontWeight: '700', cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: '6px',
          }}
        >
          + Add Employee
        </button>
      </div>

      {/* Search Bar */}
      <div style={{ position: 'relative', marginBottom: '20px', maxWidth: '400px' }}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2"
          style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }}>
          <circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" />
        </svg>
        <input
          className="hrms-input"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search by name, email, department..."
          style={{
            width: '100%', paddingLeft: '38px', paddingRight: '16px',
            height: '40px', border: '1.5px solid #e2e8f0',
            borderRadius: '10px', fontSize: '13px', outline: 'none',
            background: '#ffffff', color: '#1e293b', colorScheme: 'light',
          }}
          onFocus={e => e.target.style.borderColor = '#3b82f6'}
          onBlur={e => e.target.style.borderColor = '#e2e8f0'}
        />
        {(searching) && (
          <span style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', fontSize: '12px', color: '#94a3b8' }}>
            Searching...
          </span>
        )}
      </div>

      {/* Table */}
      <div className="table-responsive" style={{
        background: 'white', borderRadius: '12px', border: '1px solid #e2e8f0',
        boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
      }}>
        {/* Table Header */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '0.6fr 2fr 1.2fr 1.2fr 1fr 1fr 1fr',
          gap: '16px',
          padding: '10px 20px', background: '#f8fafc',
          borderBottom: '1px solid #e2e8f0',
        }}>
          {['Emp ID', 'Employee', 'Department', 'Designation', 'Role', 'Status', 'Actions'].map(h => (
            <div key={h} style={{ fontSize: '11px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              {h}
            </div>
          ))}
        </div>

        {loading ? (
          <div style={{ padding: '60px', textAlign: 'center', color: '#94a3b8' }}>Loading employees...</div>
        ) : employees.length === 0 ? (
          <div style={{ padding: '60px', textAlign: 'center' }}>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '12px', color: '#94a3b8' }}>
              <Users size={48} strokeWidth={1.5} />
            </div>
            <div style={{ fontSize: '15px', fontWeight: '600', color: '#1e293b', marginBottom: '8px' }}>
              {search ? 'No employees found' : 'No employees yet'}
            </div>
            <div style={{ fontSize: '13px', color: '#94a3b8', marginBottom: '16px' }}>
              {search ? `No results for "${search}"` : 'Add your first employee'}
            </div>
            {!search && (
              <button onClick={openAddForm} style={{ padding: '10px 20px', background: '#1e3a5f', color: 'white', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: '700', cursor: 'pointer' }}>
                + Add Employee
              </button>
            )}
          </div>
        ) : (
          <>
            {employees.map((emp, i) => (
              <div key={emp.id} style={{
                display: 'grid',
                gridTemplateColumns: '0.6fr 2fr 1.2fr 1.2fr 1fr 1fr 1fr',
                gap: '16px',
                padding: '13px 20px', borderBottom: '1px solid #f1f5f9',
                alignItems: 'center',
              }}
                onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'}
                onMouseLeave={e => e.currentTarget.style.background = 'white'}
              >
                <div style={{ fontSize: '12px', color: '#94a3b8', fontWeight: '600' }}>
                  {emp.employeeId}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
                  <div style={{
                    width: '34px', height: '34px', borderRadius: '50%',
                    background: 'linear-gradient(135deg, #1e3a5f, #3b82f6)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '12px', fontWeight: '700', color: 'white', flexShrink: 0,
                  }}>
                    {emp.firstName?.[0]}{emp.lastName?.[0]}
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: '13px', fontWeight: '600', color: '#1e293b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {emp.firstName} {emp.lastName}
                    </div>
                    <div style={{ fontSize: '11px', color: '#94a3b8', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{emp.email}</div>
                  </div>
                </div>

                <div style={{ fontSize: '13px', color: '#64748b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{emp.department || '—'}</div>
                <div style={{ fontSize: '13px', color: '#64748b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{emp.designation || '—'}</div>
                <Badge status={emp.role} />
                <Badge status={emp.active ? 'ACTIVE' : 'INACTIVE'} />

                <div style={{ display: 'flex', gap: '6px' }}>
                  <button
                    onClick={() => openEditForm(emp)}
                    style={{
                      padding: '5px 12px', background: '#eff6ff',
                      color: '#3b82f6', border: '1px solid #bfdbfe',
                      borderRadius: '6px', fontSize: '11px', fontWeight: '700',
                      cursor: 'pointer',
                    }}
                  >Edit</button>
                  <button
                    onClick={() => setShowDeleteConfirm(emp)}
                    style={{
                      padding: '5px 12px', background: '#fee2e2',
                      color: '#dc2626', border: '1px solid #fecaca',
                      borderRadius: '6px', fontSize: '11px', fontWeight: '700',
                      cursor: 'pointer',
                    }}
                  >Delete</button>
                </div>
              </div>
            ))}

            {/* Pagination */}
            {totalPages > 1 && (
              <div style={{ padding: '14px 20px', display: 'flex', justifyContent: 'center', gap: '8px', borderTop: '1px solid #e2e8f0' }}>
                <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0}
                  style={{ padding: '6px 14px', border: '1px solid #e2e8f0', borderRadius: '6px', fontSize: '12px', fontWeight: '600', color: page === 0 ? '#cbd5e1' : '#374151', background: 'white', cursor: page === 0 ? 'not-allowed' : 'pointer' }}>
                  ← Prev
                </button>
                <span style={{ padding: '6px 14px', fontSize: '12px', color: '#64748b' }}>
                  Page {page + 1} of {totalPages}
                </span>
                <button onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))} disabled={page >= totalPages - 1}
                  style={{ padding: '6px 14px', border: '1px solid #e2e8f0', borderRadius: '6px', fontSize: '12px', fontWeight: '600', color: page >= totalPages - 1 ? '#cbd5e1' : '#374151', background: 'white', cursor: page >= totalPages - 1 ? 'not-allowed' : 'pointer' }}>
                  Next →
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Add/Edit Employee Modal */}
      {showForm && (
        <div style={{
          position: 'fixed', inset: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex', alignItems: 'center',
          justifyContent: 'center', zIndex: 100, padding: '20px',
        }}>
          <div style={{
            background: 'white', borderRadius: '16px',
            padding: '28px', width: '100%', maxWidth: '600px',
            maxHeight: '90vh', overflowY: 'auto',
            boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ fontSize: '18px', fontWeight: '800', color: '#1e293b' }}>
                {editMode ? 'Edit Employee' : 'Add New Employee'}
              </h2>
              <button onClick={() => setShowForm(false)}
                style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: '#94a3b8' }}>✕</button>
            </div>

            <form onSubmit={handleSubmit}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '14px' }}>
                <InputField
                  label="Employee ID"
                  name="employeeId"
                  required
                  placeholder="EMP0004"
                  value={form.employeeId}
                  onChange={handleFieldChange}
                />                <InputField label="First Name" name="firstName" required placeholder="John" value={form.firstName} onChange={handleFieldChange} />
                <InputField label="Last Name" name="lastName" required placeholder="Doe" value={form.lastName} onChange={handleFieldChange} />
                <InputField label="Email" name="email" type="email" required placeholder="john@hrms.com" value={form.email} onChange={handleFieldChange} />
                <div style={{ position: "relative" }}>
                  <InputField
                    label={editMode ? "Password (leave blank to keep)" : "Password"}
                    name="password"
                    type={showPassword ? "text" : "password"}
                    required={!editMode}
                    placeholder="Min 8 characters"
                    value={form.password}
                    onChange={handleFieldChange}
                  />

                  <span
                    onClick={() => setShowPassword(!showPassword)}
                    style={{
                      position: "absolute",
                      right: "12px",
                      top: "38px",
                      cursor: "pointer",
                      color: "#64748b",
                      fontSize: "16px"
                    }}
                  >
                    {showPassword ? <FaEye /> : <FaEyeSlash />}
                  </span>
                </div>
                <InputField
                  label="Phone"
                  name="phone"
                  type="tel"
                  placeholder="9876543210"
                  value={form.phone}
                  onChange={handleFieldChange}
                  numericOnly
                  maxLength={10}
                />
                <InputField label="Department" name="department" placeholder="IT" value={form.department} onChange={handleFieldChange} />
                <InputField label="Designation" name="designation" placeholder="Software Engineer" value={form.designation} onChange={handleFieldChange} />
                <InputField label="Basic Salary" name="basicSalary" type="number" placeholder="50000" value={form.basicSalary} onChange={handleFieldChange} />
                <InputField label="Date of Joining" name="dateOfJoining" type="date" value={form.dateOfJoining} onChange={handleFieldChange} />
                <InputField
                  label="Date of Birth"
                  name="dateOfBirth"
                  type="date"
                  value={form.dateOfBirth}
                  onChange={handleFieldChange}
                  max={new Date().toISOString().split("T")[0]}
                />
              </div>

              {/* Role */}
              <div style={{ marginBottom: '20px' }}>
                <label style={{ fontSize: '12px', fontWeight: '600', color: '#374151', display: 'block', marginBottom: '5px' }}>
                  Role <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <select
                  value={form.role}
                  onChange={e => setForm({ ...form, role: e.target.value })}
                  style={{
                    width: '100%', padding: '9px 12px', border: '1.5px solid #e2e8f0',
                    borderRadius: '8px', fontSize: '13px', outline: 'none',
                    background: '#ffffff', color: '#1e293b', colorScheme: 'light',
                  }}
                >
                  <option value="EMPLOYEE">EMPLOYEE</option>
                  <option value="HR">HR</option>
                  <option value="ADMIN">ADMIN</option>
                </select>
              </div>

              <div style={{ display: 'flex', gap: '10px' }}>
                <button type="button" onClick={() => setShowForm(false)}
                  style={{ flex: 1, padding: '12px', background: 'white', color: '#374151', border: '1.5px solid #e2e8f0', borderRadius: '10px', fontSize: '14px', fontWeight: '600', cursor: 'pointer' }}>
                  Cancel
                </button>
                <button type="submit" disabled={submitting}
                  style={{ flex: 1, padding: '12px', background: '#1e3a5f', color: 'white', border: 'none', borderRadius: '10px', fontSize: '14px', fontWeight: '700', cursor: submitting ? 'not-allowed' : 'pointer', opacity: submitting ? 0.7 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                  {submitting ? <><Loader2 size={16} className="animate-spin" /> Saving...</> : editMode ? 'Update Employee' : 'Add Employee'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 100, padding: '20px',
        }}>
          <div style={{
            background: 'white', borderRadius: '16px', padding: '28px',
            width: '100%', maxWidth: '400px',
            boxShadow: '0 20px 60px rgba(0,0,0,0.2)', textAlign: 'center',
          }}>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '16px', color: '#dc2626' }}>
              <AlertTriangle size={48} strokeWidth={1.5} />
            </div>
            <h2 style={{ fontSize: '18px', fontWeight: '800', color: '#1e293b', marginBottom: '8px' }}>
              Delete Employee?
            </h2>
            <p style={{ fontSize: '13px', color: '#64748b', marginBottom: '24px' }}>
              Are you sure you want to delete <strong>{showDeleteConfirm.firstName} {showDeleteConfirm.lastName}</strong>?
              This action cannot be undone.
            </p>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                onClick={() => setShowDeleteConfirm(null)}
                style={{ flex: 1, padding: '12px', background: 'white', color: '#374151', border: '1.5px solid #e2e8f0', borderRadius: '10px', fontSize: '14px', fontWeight: '600', cursor: 'pointer' }}
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(showDeleteConfirm.id)}
                disabled={deleting === showDeleteConfirm.id}
                style={{ flex: 1, padding: '12px', background: '#dc2626', color: 'white', border: 'none', borderRadius: '10px', fontSize: '14px', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
              >
                {deleting === showDeleteConfirm.id ? <><Loader2 size={16} className="animate-spin" /> Deleting...</> : 'Yes, Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}