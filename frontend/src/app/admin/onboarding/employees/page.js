'use client';
import { useState, useEffect, useCallback } from 'react';
import {
    getAllEmployees,
    searchEmployees,
    createEmployee,
    updateEmployee,
    deleteEmployee,
} from '@/lib/adminApi';
import api from '@/lib/axios';
import toast from 'react-hot-toast';
import { FaEye, FaEyeSlash } from "react-icons/fa";
import { Edit, Trash2, Loader2, AlertTriangle } from 'lucide-react';

function OnboardingBadge({ status }) {
    const map = {
        PENDING: { bg: '#f1f5f9', color: 'var(--text-secondary)', label: 'Not Started' },
        IN_PROGRESS: { bg: '#eff6ff', color: '#3b82f6', label: 'In Progress' },
        COMPLETED: { bg: '#dcfce7', color: '#16a34a', label: 'Completed' },
    };
    const s = map[status] || map.PENDING;
    return (
        <span style={{ background: s.bg, color: s.color, padding: '3px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '700', display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: s.color }} />
            {s.label}
        </span>
    );
}

function InputField({ label, name, type = 'text', required, placeholder, value, onChange, max }) {
    return (
        <div>
            <label style={{ fontSize: '12px', fontWeight: '600', color: '#374151', display: 'block', marginBottom: '5px' }}>
                {label} {required && <span style={{ color: '#ef4444' }}>*</span>}
            </label>
            <input
                type={type}
                value={value || ''}
                onChange={e => onChange(name, e.target.value)}
                placeholder={placeholder}
                required={required}
                max={max}
                style={{ width: '100%', padding: '9px 12px', border: '1.5px solid #e2e8f0', borderRadius: '8px', fontSize: '13px', outline: 'none', boxSizing: 'border-box' }}
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

const DEPARTMENTS = ['All Departments', 'Engineering', 'Design', 'Product', 'Marketing', 'Sales', 'HR', 'Finance'];

export default function OnboardingEmployeesPage() {
    const [employees, setEmployees] = useState([]);
    const [onboardingByEmpId, setOnboardingByEmpId] = useState({});
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [deptFilter, setDeptFilter] = useState('All Departments');
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

    const fetchOnboardingStatuses = useCallback(async () => {
        try {
            const res = await api.get('/api/onboarding?page=0&size=200');
            const list = res.data?.data?.content || [];
            const map = {};
            list.forEach(o => { map[o.employeeId] = o.status; });
            setOnboardingByEmpId(map);
        } catch {
            // non-fatal — just means the onboarding column shows "Not Started" for everyone
        }
    }, []);

    const fetchEmployees = useCallback(async () => {
        setLoading(true);
        try {
            const res = await getAllEmployees(page, 10, deptFilter);
            const data = res.data?.data;
            setEmployees(data?.content || []);
            setTotalPages(data?.totalPages || 0);
            setTotalElements(data?.totalElements || 0);
        } catch (err) {
            toast.error('Failed to load employees');
        } finally {
            setLoading(false);
        }
    }, [page, deptFilter]);

    const handleSearch = useCallback(async () => {
        if (!search.trim()) return;
        setSearching(true);
        try {
            const res = await searchEmployees(search, page, 10);
            const data = res.data?.data;
            setEmployees(data?.content || []);
            setTotalPages(data?.totalPages || 0);
            setTotalElements(data?.totalElements || 0);
        } catch (err) {
            toast.error('Search failed');
        } finally {
            setSearching(false);
        }
    }, [search, page]);

    useEffect(() => { fetchOnboardingStatuses(); }, [fetchOnboardingStatuses]);

    useEffect(() => {
        const timer = setTimeout(() => {
            if (search.trim()) {
                handleSearch();
            } else {
                fetchEmployees();
            }
        }, search.trim() ? 400 : 0);
        return () => clearTimeout(timer);
    }, [search, page, handleSearch, fetchEmployees, deptFilter]);

    const handleDeptFilterChange = (e) => {
        setDeptFilter(e.target.value);
        setPage(0);
    };

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
        setSubmitting(true);
        try {
            const payload = { ...form, basicSalary: form.basicSalary ? parseFloat(form.basicSalary) : 0 };
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

    const displayedEmployees = employees;

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '8px' }}>
                        <span>Onboarding</span>
                        <span style={{ color: 'var(--text-muted)' }}>/</span>
                        <span style={{ color: '#3b82f6' }}>Employees</span>
                    </div>
                    <h1 style={{ fontSize: '22px', fontWeight: '800', color: 'var(--text-primary)', marginBottom: '4px' }}>
                        Onboarding Employees
                    </h1>
                    <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                        View, add, edit, and manage employees in the onboarding process.
                    </p>
                </div>
                <button onClick={openAddForm}
                    style={{ padding: '10px 20px', background: '#1e3a5f', color: 'white', border: 'none', borderRadius: '10px', fontSize: '13px', fontWeight: '700', cursor: 'pointer' }}>
                    + Add Employee
                </button>
            </div>

            <div style={{ display: 'flex', gap: '12px', marginBottom: '20px' }}>
                <div style={{ position: 'relative', flex: 1 }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2"
                        style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }}>
                        <circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" />
                    </svg>
                    <input
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        placeholder="Search by name, email, or employee code..."
                        style={{ width: '100%', paddingLeft: '38px', paddingRight: '16px', height: '40px', border: '1.5px solid #e2e8f0', borderRadius: '10px', fontSize: '13px', outline: 'none', boxSizing: 'border-box' }}
                    />
                </div>
                <select value={deptFilter} onChange={handleDeptFilterChange}
                    style={{ padding: '0 14px', height: '40px', border: '1.5px solid #e2e8f0', borderRadius: '10px', fontSize: '13px', outline: 'none', background: 'var(--card-bg)' }}>
                    {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
            </div>

            <div style={{ background: 'var(--card-bg)', borderRadius: '12px', border: '1px solid var(--card-border)', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1.2fr 1fr 1fr 0.8fr', gap: '16px', padding: '10px 20px', background: 'var(--bg-primary)', borderBottom: '1px solid var(--card-border)' }}>
                    {['Employee', 'Department', 'Joining Date', 'Onboarding', 'Actions'].map(h => (
                        <div key={h} style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{h}</div>
                    ))}
                </div>

                {loading ? (
                    <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-muted)' }}>Loading employees...</div>
                ) : displayedEmployees.length === 0 ? (
                    <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-muted)' }}>No employees found</div>
                ) : (
                    <>
                        {displayedEmployees.map((emp) => (
                            <div key={emp.id} style={{ display: 'grid', gridTemplateColumns: '2fr 1.2fr 1fr 1fr 0.8fr', gap: '16px', padding: '13px 20px', borderBottom: '1px solid #f1f5f9', alignItems: 'center' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
                                    <div style={{ width: '34px', height: '34px', borderRadius: '50%', background: 'linear-gradient(135deg, #1e3a5f, #3b82f6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: '700', color: 'white', flexShrink: 0 }}>
                                        {emp.firstName?.[0]}{emp.lastName?.[0]}
                                    </div>
                                    <div style={{ minWidth: 0 }}>
                                        <div style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-primary)' }}>{emp.firstName} {emp.lastName}</div>
                                        <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{emp.email}</div>
                                    </div>
                                </div>
                                <div>
                                    <div style={{ fontSize: '13px', color: 'var(--text-primary)' }}>{emp.department || '—'}</div>
                                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{emp.designation || '—'}</div>
                                </div>
                                <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{emp.dateOfJoining || '—'}</div>
                                <div><OnboardingBadge status={onboardingByEmpId[emp.id]} /></div>
                                <div style={{ display: 'flex', gap: '10px' }}>
                                    <button onClick={() => openEditForm(emp)} title="Edit"
                                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}><Edit size={16} /></button>
                                    <button onClick={() => setShowDeleteConfirm(emp)} title="Delete"
                                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#dc2626' }}><Trash2 size={16} /></button>
                                </div>
                            </div>
                        ))}

                        {totalPages > 1 && (
                            <div style={{ padding: '14px 20px', display: 'flex', justifyContent: 'center', gap: '8px', borderTop: '1px solid var(--card-border)' }}>
                                <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0}
                                    style={{ padding: '6px 14px', border: '1px solid var(--card-border)', borderRadius: '6px', fontSize: '12px', fontWeight: '600', color: page === 0 ? '#cbd5e1' : '#374151', background: 'var(--card-bg)', cursor: page === 0 ? 'not-allowed' : 'pointer' }}>← Prev</button>
                                <span style={{ padding: '6px 14px', fontSize: '12px', color: 'var(--text-secondary)' }}>Page {page + 1} of {totalPages}</span>
                                <button onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))} disabled={page >= totalPages - 1}
                                    style={{ padding: '6px 14px', border: '1px solid var(--card-border)', borderRadius: '6px', fontSize: '12px', fontWeight: '600', color: page >= totalPages - 1 ? '#cbd5e1' : '#374151', background: 'var(--card-bg)', cursor: page >= totalPages - 1 ? 'not-allowed' : 'pointer' }}>Next →</button>
                            </div>
                        )}
                    </>
                )}
            </div>

            {showForm && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '20px' }}>
                    <div style={{ background: 'var(--card-bg)', borderRadius: '16px', padding: '28px', width: '100%', maxWidth: '600px', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                            <h2 style={{ fontSize: '18px', fontWeight: '800', color: 'var(--text-primary)' }}>{editMode ? 'Edit Employee' : 'Add New Employee'}</h2>
                            <button onClick={() => setShowForm(false)} style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: 'var(--text-muted)' }}>✕</button>
                        </div>
                        <form onSubmit={handleSubmit}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '14px' }}>
                                <InputField label="Employee ID" name="employeeId" required placeholder="EMP0004" value={form.employeeId} onChange={handleFieldChange} />
                                <InputField label="First Name" name="firstName" required placeholder="John" value={form.firstName} onChange={handleFieldChange} />
                                <InputField label="Last Name" name="lastName" required placeholder="Doe" value={form.lastName} onChange={handleFieldChange} />
                                <InputField label="Email" name="email" type="email" required placeholder="john@hrms.com" value={form.email} onChange={handleFieldChange} />
                                <div style={{ position: "relative" }}>
                                    <InputField label={editMode ? "Password (leave blank to keep)" : "Password"} name="password" type={showPassword ? "text" : "password"} required={!editMode} placeholder="Min 8 characters" value={form.password} onChange={handleFieldChange} />
                                    <span onClick={() => setShowPassword(!showPassword)} style={{ position: "absolute", right: "12px", top: "38px", cursor: "pointer", color: "var(--text-secondary)", fontSize: "16px" }}>
                                        {showPassword ? <FaEyeSlash /> : <FaEye />}
                                    </span>
                                </div>
                                <InputField label="Phone" name="phone" placeholder="9876543210" value={form.phone} onChange={handleFieldChange} />
                                <div>
                                    <label style={{ fontSize: '12px', fontWeight: '600', color: '#374151', display: 'block', marginBottom: '5px' }}>Department</label>
                                    <select value={form.department} onChange={e => handleFieldChange('department', e.target.value)} style={{ width: '100%', padding: '9px 12px', border: '1.5px solid #e2e8f0', borderRadius: '8px', fontSize: '13px', outline: 'none', background: 'var(--card-bg)' }}>
                                        <option value="">Select Department</option>
                                        {DEPARTMENTS.filter(d => d !== 'All Departments').map(d => <option key={d} value={d}>{d}</option>)}
                                    </select>
                                </div>
                                <InputField label="Designation" name="designation" placeholder="Software Engineer" value={form.designation} onChange={handleFieldChange} />
                                <InputField label="Basic Salary" name="basicSalary" type="number" placeholder="50000" value={form.basicSalary} onChange={handleFieldChange} />
                                <InputField label="Date of Joining" name="dateOfJoining" type="date" value={form.dateOfJoining} onChange={handleFieldChange} />
                                <InputField label="Date of Birth" name="dateOfBirth" type="date" value={form.dateOfBirth} onChange={handleFieldChange} max={new Date().toISOString().split("T")[0]} />
                            </div>
                            <div style={{ marginBottom: '20px' }}>
                                <label style={{ fontSize: '12px', fontWeight: '600', color: '#374151', display: 'block', marginBottom: '5px' }}>Role <span style={{ color: '#ef4444' }}>*</span></label>
                                <select value={form.role} onChange={e => setForm({ ...form, role: e.target.value })} style={{ width: '100%', padding: '9px 12px', border: '1.5px solid #e2e8f0', borderRadius: '8px', fontSize: '13px', outline: 'none', background: 'var(--card-bg)' }}>
                                    <option value="EMPLOYEE">EMPLOYEE</option>
                                    <option value="HR">HR</option>
                                    <option value="ADMIN">ADMIN</option>
                                </select>
                            </div>
                            <div style={{ display: 'flex', gap: '10px' }}>
                                <button type="button" onClick={() => setShowForm(false)} style={{ flex: 1, padding: '12px', background: 'var(--card-bg)', color: '#374151', border: '1.5px solid #e2e8f0', borderRadius: '10px', fontSize: '14px', fontWeight: '600', cursor: 'pointer' }}>Cancel</button>
                                <button type="submit" disabled={submitting} style={{ flex: 1, padding: '12px', background: '#1e3a5f', color: 'white', border: 'none', borderRadius: '10px', fontSize: '14px', fontWeight: '700', cursor: submitting ? 'not-allowed' : 'pointer', opacity: submitting ? 0.7 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                                    {submitting ? <><Loader2 size={16} className="animate-spin" /> Saving...</> : editMode ? 'Update Employee' : 'Add Employee'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {showDeleteConfirm && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '20px' }}>
                    <div style={{ background: 'var(--card-bg)', borderRadius: '16px', padding: '28px', width: '100%', maxWidth: '400px', boxShadow: '0 20px 60px rgba(0,0,0,0.2)', textAlign: 'center' }}>
                        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '16px', color: '#dc2626' }}>
                            <AlertTriangle size={48} strokeWidth={1.5} />
                        </div>
                        <h2 style={{ fontSize: '18px', fontWeight: '800', color: 'var(--text-primary)', marginBottom: '8px' }}>Delete Employee?</h2>
                        <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '24px' }}>
                            Are you sure you want to delete <strong>{showDeleteConfirm.firstName} {showDeleteConfirm.lastName}</strong>? This action cannot be undone.
                        </p>
                        <div style={{ display: 'flex', gap: '10px' }}>
                            <button onClick={() => setShowDeleteConfirm(null)} style={{ flex: 1, padding: '12px', background: 'var(--card-bg)', color: '#374151', border: '1.5px solid #e2e8f0', borderRadius: '10px', fontSize: '14px', fontWeight: '600', cursor: 'pointer' }}>Cancel</button>
                            <button onClick={() => handleDelete(showDeleteConfirm.id)} disabled={deleting === showDeleteConfirm.id} style={{ flex: 1, padding: '12px', background: '#dc2626', color: 'white', border: 'none', borderRadius: '10px', fontSize: '14px', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                                {deleting === showDeleteConfirm.id ? <><Loader2 size={16} className="animate-spin" /> Deleting...</> : 'Yes, Delete'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}