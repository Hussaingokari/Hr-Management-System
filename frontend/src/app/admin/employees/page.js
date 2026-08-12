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
    ACTIVE: 'bg-green-100 text-green-700 border-green-200 dark:bg-[#173404] dark:text-[#97C459] dark:border-[#27500A]',
    INACTIVE: 'bg-red-100 text-red-700 border-red-200 dark:bg-[#4A1313] dark:text-[#F09595] dark:border-[#791F1F]',
    ADMIN: 'bg-indigo-100 text-indigo-700 border-indigo-200 dark:bg-[#0C447C] dark:text-[#B5D4F4] dark:border-[#185FA5]',
    HR: 'bg-purple-100 text-purple-700 border-purple-200 dark:bg-[#3C3489] dark:text-[#CECBF6] dark:border-[#534AB7]',
    EMPLOYEE: 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-[#1B2740] dark:text-[#B5D4F4] dark:border-[#223148]',
  };
  const cls = map[status] || map.EMPLOYEE;
  return (
    <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold border ${cls}`}>
      {status}
    </span>
  );
}

const INPUT_BASE_CLASS =
  'w-full px-3 py-2.5 rounded-lg text-[13px] outline-none box-border ' +
  'bg-white border border-slate-200 text-slate-900 placeholder-slate-400 ' +
  'dark:bg-[#111A2C] dark:border-[#223148] dark:text-[#E6F1FB] dark:placeholder-[#5F7590] ' +
  'focus:border-indigo-500 dark:focus:border-[#378ADD] transition-colors';

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
      <label className="text-xs font-semibold text-slate-700 dark:text-[#B5D4F4] block mb-1.5">
        {label} {required && <span className="text-red-500 dark:text-[#F09595]">*</span>}
      </label>
      <input
        type={type}
        value={value || ''}
        onChange={e => {
          let val = e.target.value;
          if (numericOnly) {
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
        className={INPUT_BASE_CLASS}
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
    <div className="min-h-screen p-6 bg-slate-50 text-slate-900 dark:bg-[#0B1220] dark:text-[#E6F1FB]">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-[22px] font-extrabold mb-1 text-slate-900 dark:text-[#E6F1FB]">
            Employee Management
          </h1>
          <p className="text-[13px] text-slate-500 dark:text-[#7C93B3]">
            {totalElements} total employees
          </p>
        </div>
        <button
          onClick={openAddForm}
          className="px-5 py-2.5 rounded-xl text-[13px] font-bold flex items-center gap-1.5 cursor-pointer
            bg-indigo-500 text-white shadow-[0_4px_12px_rgba(99,102,241,0.25)]
            dark:bg-[#378ADD] dark:text-[#042C53] dark:shadow-none"
        >
          + Add Employee
        </button>
      </div>

      {/* Search Bar */}
      <div className="relative mb-5 max-w-[400px]">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" strokeWidth="2"
          className="absolute left-3 top-1/2 -translate-y-1/2 stroke-slate-400 dark:stroke-[#5F7590]">
          <circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" />
        </svg>
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search by name, email, department..."
          className="w-full h-10 pl-[38px] pr-4 rounded-xl text-[13px] outline-none transition-colors
            bg-white border border-slate-200 text-slate-900 shadow-[0_1px_2px_rgba(0,0,0,0.03)]
            dark:bg-[#111A2C] dark:border-[#223148] dark:text-[#E6F1FB] dark:shadow-none
            focus:border-indigo-500 dark:focus:border-[#378ADD]"
        />
        {(searching) && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 dark:text-[#5F7590]">
            Searching...
          </span>
        )}
      </div>

      {/* Table */}
      <div className="table-responsive rounded-xl border overflow-hidden
        bg-white border-slate-200 shadow-[0_1px_3px_rgba(0,0,0,0.05)]
        dark:bg-[#0F1728] dark:border-[#1B2740] dark:shadow-none">
        {/* Table Header */}
        <div className="grid gap-4 px-5 py-3 border-b
          bg-slate-50 border-slate-200
          dark:bg-[#0B1220] dark:border-[#1B2740]"
          style={{ gridTemplateColumns: '0.6fr 2fr 1.2fr 1.2fr 1fr 1fr 1fr' }}>
          {['Emp ID', 'Employee', 'Department', 'Designation', 'Role', 'Status', 'Actions'].map(h => (
            <div key={h} className="text-[11px] font-bold uppercase tracking-wide text-slate-500 dark:text-[#7C93B3]">
              {h}
            </div>
          ))}
        </div>

        {loading ? (
          <div className="p-16 text-center text-slate-400 dark:text-[#5F7590]">Loading employees...</div>
        ) : employees.length === 0 ? (
          <div className="p-16 text-center">
            <div className="flex justify-center mb-3 text-slate-400 dark:text-[#5F7590]">
              <Users size={48} strokeWidth={1.5} />
            </div>
            <div className="text-[15px] font-semibold mb-2 text-slate-900 dark:text-[#E6F1FB]">
              {search ? 'No employees found' : 'No employees yet'}
            </div>
            <div className="text-[13px] mb-4 text-slate-500 dark:text-[#7C93B3]">
              {search ? `No results for "${search}"` : 'Add your first employee'}
            </div>
            {!search && (
              <button onClick={openAddForm} className="px-5 py-2.5 rounded-lg text-[13px] font-bold cursor-pointer
                bg-indigo-500 text-white dark:bg-[#378ADD] dark:text-[#042C53]">
                + Add Employee
              </button>
            )}
          </div>
        ) : (
          <>
            {employees.map((emp) => (
              <div key={emp.id}
                className="grid gap-4 px-5 py-3.5 items-center border-b transition-colors
                  border-slate-100 hover:bg-slate-50
                  dark:border-[#1B2740] dark:hover:bg-[#111A2C]"
                style={{ gridTemplateColumns: '0.6fr 2fr 1.2fr 1.2fr 1fr 1fr 1fr' }}
              >
                <div className="text-xs font-semibold text-slate-500 dark:text-[#7C93B3]">
                  {emp.employeeId}
                </div>

                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-[34px] h-[34px] rounded-full flex items-center justify-center
                    text-xs font-bold text-white flex-shrink-0
                    bg-gradient-to-br from-indigo-500 to-indigo-400
                    dark:bg-none dark:bg-[#185FA5] dark:text-[#E6F1FB]">
                    {emp.firstName?.[0]}{emp.lastName?.[0]}
                  </div>
                  <div className="min-w-0">
                    <div className="text-[13px] font-semibold whitespace-nowrap overflow-hidden text-ellipsis
                      text-slate-900 dark:text-[#E6F1FB]">
                      {emp.firstName} {emp.lastName}
                    </div>
                    <div className="text-[11px] whitespace-nowrap overflow-hidden text-ellipsis
                      text-slate-500 dark:text-[#5F7590]">{emp.email}</div>
                  </div>
                </div>

                <div className="text-[13px] whitespace-nowrap overflow-hidden text-ellipsis
                  text-slate-700 dark:text-[#B5D4F4]">{emp.department || '—'}</div>
                <div className="text-[13px] whitespace-nowrap overflow-hidden text-ellipsis
                  text-slate-700 dark:text-[#B5D4F4]">{emp.designation || '—'}</div>
                <Badge status={emp.role} />
                <Badge status={emp.active ? 'ACTIVE' : 'INACTIVE'} />

                <div className="flex gap-1.5">
                  <button
                    onClick={() => openEditForm(emp)}
                    className="px-3 py-1.5 rounded-md text-[11px] font-bold cursor-pointer border
                      bg-indigo-100 text-indigo-700 border-indigo-200
                      dark:bg-[#0C447C] dark:text-[#B5D4F4] dark:border-[#185FA5]"
                  >Edit</button>
                  <button
                    onClick={() => setShowDeleteConfirm(emp)}
                    className="px-3 py-1.5 rounded-md text-[11px] font-bold cursor-pointer border
                      bg-red-100 text-red-700 border-red-200
                      dark:bg-[#4A1313] dark:text-[#F09595] dark:border-[#791F1F]"
                  >Delete</button>
                </div>
              </div>
            ))}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="px-5 py-3.5 flex justify-center gap-2 border-t
                border-slate-200 bg-slate-50
                dark:border-[#1B2740] dark:bg-[#0B1220]">
                <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0}
                  className={`px-3.5 py-1.5 rounded-md text-xs font-semibold border
                    bg-white border-slate-300 dark:bg-[#111A2C] dark:border-[#223148]
                    ${page === 0
                      ? 'text-slate-400 dark:text-[#3E4E68] cursor-not-allowed'
                      : 'text-slate-700 dark:text-[#B5D4F4] cursor-pointer'}`}>
                  ← Prev
                </button>
                <span className="px-3.5 py-1.5 text-xs text-slate-500 dark:text-[#7C93B3]">
                  Page {page + 1} of {totalPages}
                </span>
                <button onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))} disabled={page >= totalPages - 1}
                  className={`px-3.5 py-1.5 rounded-md text-xs font-semibold border
                    bg-white border-slate-300 dark:bg-[#111A2C] dark:border-[#223148]
                    ${page >= totalPages - 1
                      ? 'text-slate-400 dark:text-[#3E4E68] cursor-not-allowed'
                      : 'text-slate-700 dark:text-[#B5D4F4] cursor-pointer'}`}>
                  Next →
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Add/Edit Employee Modal */}
      {showForm && (
        <div className="fixed inset-0 flex items-center justify-center z-[100] p-5
          bg-slate-900/40 backdrop-blur-sm dark:bg-black/60">
          <div className="rounded-2xl p-7 w-full max-w-[600px] max-h-[90vh] overflow-y-auto border
            bg-white border-slate-200 shadow-[0_20px_25px_-5px_rgba(0,0,0,0.1),0_10px_10px_-5px_rgba(0,0,0,0.04)]
            dark:bg-[#0F1728] dark:border-[#1B2740] dark:shadow-none">
            <div className="flex justify-between items-center mb-5">
              <h2 className="text-lg font-extrabold text-slate-900 dark:text-[#E6F1FB]">
                {editMode ? 'Edit Employee' : 'Add New Employee'}
              </h2>
              <button onClick={() => setShowForm(false)}
                className="bg-transparent border-none text-xl cursor-pointer
                  text-slate-500 dark:text-[#7C93B3]">✕</button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-2 gap-3.5 mb-3.5">
                <InputField
                  label="Employee ID"
                  name="employeeId"
                  required
                  placeholder="EMP0004"
                  value={form.employeeId}
                  onChange={handleFieldChange}
                />
                <InputField label="First Name" name="firstName" required placeholder="John" value={form.firstName} onChange={handleFieldChange} />
                <InputField label="Last Name" name="lastName" required placeholder="Doe" value={form.lastName} onChange={handleFieldChange} />
                <InputField label="Email" name="email" type="email" required placeholder="john@hrms.com" value={form.email} onChange={handleFieldChange} />
                <div className="relative">
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
                    className="absolute right-3 top-[38px] cursor-pointer text-base
                      text-slate-500 dark:text-[#7C93B3]"
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
              <div className="mb-5">
                <label className="text-xs font-semibold text-slate-700 dark:text-[#B5D4F4] block mb-1.5">
                  Role <span className="text-red-500 dark:text-[#F09595]">*</span>
                </label>
                <select
                  value={form.role}
                  onChange={e => setForm({ ...form, role: e.target.value })}
                  className="w-full px-3 py-2.5 rounded-lg text-[13px] outline-none
                    bg-white border border-slate-200 text-slate-900
                    dark:bg-[#111A2C] dark:border-[#223148] dark:text-[#E6F1FB]
                    focus:border-indigo-500 dark:focus:border-[#378ADD]"
                >
                  <option value="EMPLOYEE">EMPLOYEE</option>
                  <option value="HR">HR</option>
                  <option value="ADMIN">ADMIN</option>
                </select>
              </div>

              <div className="flex gap-2.5">
                <button type="button" onClick={() => setShowForm(false)}
                  className="flex-1 py-3 rounded-xl text-sm font-semibold cursor-pointer border
                    bg-slate-100 text-slate-700 border-slate-300
                    dark:bg-[#111A2C] dark:text-[#B5D4F4] dark:border-[#223148]">
                  Cancel
                </button>
                <button type="submit" disabled={submitting}
                  className={`flex-1 py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2
                    bg-indigo-500 text-white dark:bg-[#378ADD] dark:text-[#042C53]
                    ${submitting ? 'opacity-70 cursor-not-allowed' : 'cursor-pointer'}`}>
                  {submitting ? <><Loader2 size={16} className="animate-spin" /> Saving...</> : editMode ? 'Update Employee' : 'Add Employee'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 flex items-center justify-center z-[100] p-5
          bg-slate-900/40 backdrop-blur-sm dark:bg-black/60">
          <div className="rounded-2xl p-7 w-full max-w-[400px] text-center border
            bg-white border-slate-200 shadow-[0_20px_25px_-5px_rgba(0,0,0,0.1)]
            dark:bg-[#0F1728] dark:border-[#1B2740] dark:shadow-none">
            <div className="flex justify-center mb-4 text-red-500 dark:text-[#F09595]">
              <AlertTriangle size={48} strokeWidth={1.5} />
            </div>
            <h2 className="text-lg font-extrabold mb-2 text-slate-900 dark:text-[#E6F1FB]">
              Delete Employee?
            </h2>
            <p className="text-[13px] mb-6 text-slate-500 dark:text-[#7C93B3]">
              Are you sure you want to delete <strong className="text-slate-900 dark:text-[#E6F1FB]">{showDeleteConfirm.firstName} {showDeleteConfirm.lastName}</strong>?
              This action cannot be undone.
            </p>
            <div className="flex gap-2.5">
              <button
                onClick={() => setShowDeleteConfirm(null)}
                className="flex-1 py-3 rounded-xl text-sm font-semibold cursor-pointer border
                  bg-slate-100 text-slate-700 border-slate-300
                  dark:bg-[#111A2C] dark:text-[#B5D4F4] dark:border-[#223148]"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(showDeleteConfirm.id)}
                disabled={deleting === showDeleteConfirm.id}
                className="flex-1 py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2 cursor-pointer
                  bg-red-600 text-white dark:bg-[#A32D2D]"
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