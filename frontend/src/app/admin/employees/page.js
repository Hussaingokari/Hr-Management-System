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
import { FaEye, FaEyeSlash } from 'react-icons/fa';
import { Users, AlertTriangle, Loader2 } from 'lucide-react';

/* =========================================================
   BADGE
========================================================= */

function Badge({ status }) {
    const badgeStyles = {
        ACTIVE:
            'bg-green-100 text-green-700 border-green-200 dark:bg-[#173404] dark:text-[#97C459] dark:border-[#27500A]',

        INACTIVE:
            'bg-red-100 text-red-700 border-red-200 dark:bg-[#4A1313] dark:text-[#F09595] dark:border-[#791F1F]',

        ADMIN:
            'bg-indigo-100 text-indigo-700 border-indigo-200 dark:bg-[#0C447C] dark:text-[#B5D4F4] dark:border-[#185FA5]',

        HR:
            'bg-purple-100 text-purple-700 border-purple-200 dark:bg-[#3C3489] dark:text-[#CECBF6] dark:border-[#534AB7]',

        EMPLOYEE:
            'bg-slate-100 text-slate-700 border-slate-200 dark:bg-[#1B2740] dark:text-[#B5D4F4] dark:border-[#223148]',
    };

    return (
        <span
            className={`
                inline-flex
                items-center
                justify-center
                whitespace-nowrap
                px-2.5
                py-1
                rounded-full
                text-[11px]
                font-bold
                border
                shrink-0
                ${badgeStyles[status] || badgeStyles.EMPLOYEE}
            `}
        >
            {status}
        </span>
    );
}

/* =========================================================
   INPUT
========================================================= */

const INPUT_CLASS = `
    w-full
    min-w-0
    px-3
    py-2.5
    rounded-lg
    text-[13px]
    outline-none
    box-border
    bg-white
    border
    border-slate-200
    text-slate-900
    placeholder-slate-400
    dark:bg-[#111A2C]
    dark:border-[#223148]
    dark:text-[#E6F1FB]
    dark:placeholder-[#5F7590]
    focus:border-indigo-500
    dark:focus:border-[#378ADD]
    transition-colors
`;

function InputField({
    label,
    name,
    type = 'text',
    required = false,
    placeholder,
    value,
    onChange,
    max,
    maxLength,
    numericOnly = false,
}) {
    return (
        <div className="min-w-0">
            <label
                className="
                    block
                    mb-1.5
                    text-xs
                    font-semibold
                    text-slate-700
                    dark:text-[#B5D4F4]
                "
            >
                {label}

                {required && (
                    <span className="text-red-500 dark:text-[#F09595]">
                        {' '}*
                    </span>
                )}
            </label>

            <input
                type={type}
                value={value || ''}
                placeholder={placeholder}
                required={required}
                max={max}
                maxLength={maxLength}
                inputMode={numericOnly ? 'numeric' : undefined}
                className={INPUT_CLASS}
                onChange={(e) => {
                    let newValue = e.target.value;

                    if (numericOnly) {
                        newValue = newValue.replace(/[^0-9]/g, '');
                    }

                    if (maxLength) {
                        newValue = newValue.slice(0, maxLength);
                    }

                    onChange(name, newValue);
                }}
                onKeyPress={(e) => {
                    if (
                        numericOnly &&
                        !/[0-9]/.test(e.key)
                    ) {
                        e.preventDefault();
                    }
                }}
            />
        </div>
    );
}

/* =========================================================
   EMPTY FORM
========================================================= */

const EMPTY_FORM = {
    employeeId: '',
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    phone: '',
    department: '',
    designation: '',
    basicSalary: '',
    dateOfJoining: '',
    dateOfBirth: '',
    role: 'EMPLOYEE',
};

/* =========================================================
   MAIN PAGE
========================================================= */

export default function EmployeeManagementPage() {
    const [employees, setEmployees] = useState([]);

    const [loading, setLoading] = useState(true);
    const [searching, setSearching] = useState(false);

    const [search, setSearch] = useState('');

    const [page, setPage] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const [totalElements, setTotalElements] = useState(0);

    const [showForm, setShowForm] = useState(false);

    const [editMode, setEditMode] = useState(false);
    const [editId, setEditId] = useState(null);

    const [form, setForm] = useState(EMPTY_FORM);

    const [submitting, setSubmitting] = useState(false);

    const [showPassword, setShowPassword] = useState(false);

    const [showDeleteConfirm, setShowDeleteConfirm] =
        useState(null);

    const [deleting, setDeleting] = useState(null);

    /* =====================================================
       TABLE COLUMNS

       IMPORTANT:
       minmax(0, ...) prevents content from forcing
       the page wider.
    ===================================================== */

    const tableColumns =
        '88px minmax(190px, 2fr) minmax(120px, 1.2fr) minmax(140px, 1.2fr) 120px 115px 142px';

    /* =====================================================
       SORT EMPLOYEES
    ===================================================== */

    const sortEmployees = (list) => {
        return [...list].sort((a, b) => {
            const empA = parseInt(
                (a.employeeId || '').replace('EMP', ''),
                10
            );

            const empB = parseInt(
                (b.employeeId || '').replace('EMP', ''),
                10
            );

            return (
                (isNaN(empA) ? 0 : empA) -
                (isNaN(empB) ? 0 : empB)
            );
        });
    };

    /* =====================================================
       GET ALL EMPLOYEES
    ===================================================== */

    const fetchEmployees = useCallback(async () => {
        setLoading(true);

        try {
            const response = await getAllEmployees(
                page,
                10
            );

            const data = response?.data?.data;

            const content = data?.content || [];

            setEmployees(sortEmployees(content));

            setTotalPages(data?.totalPages || 0);

            setTotalElements(
                data?.totalElements || 0
            );
        } catch (error) {
            console.error(error);

            toast.error(
                'Failed to load employees'
            );
        } finally {
            setLoading(false);
        }
    }, [page]);

    /* =====================================================
       SEARCH
    ===================================================== */

    const performSearch = useCallback(async () => {
        if (!search.trim()) {
            return;
        }

        setSearching(true);

        try {
            const response = await searchEmployees(
                search,
                page,
                10
            );

            const data = response?.data?.data;

            const content = data?.content || [];

            setEmployees(sortEmployees(content));

            setTotalPages(
                data?.totalPages || 0
            );

            setTotalElements(
                data?.totalElements || 0
            );
        } catch (error) {
            console.error(error);

            toast.error(
                'Search failed'
            );
        } finally {
            setSearching(false);
        }
    }, [search, page]);

    /* =====================================================
       LOAD DATA
    ===================================================== */

    useEffect(() => {
        const timer = setTimeout(() => {
            if (search.trim()) {
                performSearch();
            } else {
                fetchEmployees();
            }
        }, search.trim() ? 400 : 0);

        return () => clearTimeout(timer);
    }, [
        search,
        page,
        fetchEmployees,
        performSearch,
    ]);

    /* =====================================================
       FORM CHANGE
    ===================================================== */

    const handleFieldChange = (name, value) => {
        setForm((previous) => ({
            ...previous,
            [name]: value,
        }));
    };

    /* =====================================================
       OPEN ADD
    ===================================================== */

    const openAddForm = () => {
        setEditMode(false);
        setEditId(null);
        setForm(EMPTY_FORM);
        setShowPassword(false);
        setShowForm(true);
    };

    /* =====================================================
       OPEN EDIT
    ===================================================== */

    const openEditForm = (employee) => {
        setEditMode(true);
        setEditId(employee.id);

        setForm({
            employeeId:
                employee.employeeId || '',

            firstName:
                employee.firstName || '',

            lastName:
                employee.lastName || '',

            email:
                employee.email || '',

            password: '',

            phone:
                employee.phone || '',

            department:
                employee.department || '',

            designation:
                employee.designation || '',

            basicSalary:
                employee.basicSalary || '',

            dateOfJoining:
                employee.dateOfJoining || '',

            dateOfBirth:
                employee.dateOfBirth || '',

            role:
                employee.role || 'EMPLOYEE',
        });

        setShowPassword(false);
        setShowForm(true);
    };

    /* =====================================================
       SUBMIT
    ===================================================== */

    const handleSubmit = async (event) => {
        event.preventDefault();

        if (
            form.phone &&
            form.phone.length !== 10
        ) {
            toast.error(
                'Phone number must be exactly 10 digits'
            );

            return;
        }

        setSubmitting(true);

        try {
            const payload = {
                ...form,

                basicSalary: form.basicSalary
                    ? parseFloat(form.basicSalary)
                    : 0,
            };

            if (editMode) {
                if (!payload.password) {
                    delete payload.password;
                }

                await updateEmployee(
                    editId,
                    payload
                );

                toast.success(
                    'Employee updated successfully!'
                );
            } else {
                await createEmployee(payload);

                toast.success(
                    'Employee created successfully!'
                );
            }

            setShowForm(false);
            setEditMode(false);
            setEditId(null);
            setForm(EMPTY_FORM);

            await fetchEmployees();
        } catch (error) {
            console.error(error);

            toast.error(
                error?.response?.data?.message ||
                'Operation failed'
            );
        } finally {
            setSubmitting(false);
        }
    };

    /* =====================================================
       DELETE
    ===================================================== */

    const handleDelete = async (employee) => {
        const employeeId = employee?.id ?? employee?.employeeId;

        if (!employeeId) {
            console.error('Delete failed: Employee ID is missing', employee);
            toast.error('Unable to delete employee: Employee ID is missing.');
            return;
        }

        setDeleting(employeeId);

        try {
            await deleteEmployee(employeeId);

            toast.success('Employee deleted successfully!');

            setShowDeleteConfirm(null);

            await fetchEmployees();

        } catch (error) {
            console.error('Delete employee error:', error);

            if (error?.response?.status === 403) {
                toast.error(
                    "You don't have permission to delete employees. Only Admin can delete employees.",
                    { duration: 5000 }
                );
                return;
            }

            if (error?.response?.status === 401) {
                toast.error(
                    'Your session has expired. Please login again.',
                    { duration: 5000 }
                );
                return;
            }

            toast.error(
                error?.response?.data?.message ||
                'Failed to delete employee. Please try again.',
                { duration: 5000 }
            );

        } finally {
            setDeleting(null);
        }
    };
    /* =====================================================
       PAGE
    ===================================================== */

    return (
        <div
            className="
                w-full
                min-w-0
                max-w-full
                min-h-screen
                overflow-x-hidden
                box-border
                p-4
                sm:p-6
                bg-slate-50
                text-slate-900
                dark:bg-[#0B1220]
                dark:text-[#E6F1FB]
            "
        >

            {/* =================================================
               PAGE CONTENT
            ================================================= */}

            <div className="w-full min-w-0 max-w-full">

                {/* =============================================
                   HEADER
                ============================================== */}

                <div
                    className="
                        flex
                        flex-col
                        sm:flex-row
                        sm:items-center
                        sm:justify-between
                        gap-4
                        min-w-0
                        max-w-full
                        mb-6
                    "
                >

                    <div className="min-w-0">

                        <h1
                            className="
                                text-[22px]
                                sm:text-[24px]
                                font-extrabold
                                truncate
                                text-slate-900
                                dark:text-[#E6F1FB]
                            "
                        >
                            Employee Management
                        </h1>

                        <p
                            className="
                                mt-1
                                text-[13px]
                                text-slate-500
                                dark:text-[#7C93B3]
                            "
                        >
                            {totalElements} total employees
                        </p>

                    </div>

                    <button
                        type="button"
                        onClick={openAddForm}
                        className="
                            shrink-0
                            self-start
                            sm:self-auto
                            px-5
                            py-2.5
                            rounded-xl
                            text-[13px]
                            font-bold
                            whitespace-nowrap
                            cursor-pointer
                            bg-indigo-500
                            text-white
                            dark:bg-[#378ADD]
                            dark:text-[#042C53]
                        "
                    >
                        + Add Employee
                    </button>

                </div>

                {/* =============================================
                   SEARCH
                ============================================== */}

                <div
                    className="
                        relative
                        w-full
                        sm:max-w-[430px]
                        min-w-0
                        mb-5
                    "
                >

                    <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        className="
                            absolute
                            left-3
                            top-1/2
                            -translate-y-1/2
                            text-slate-400
                            dark:text-[#5F7590]
                        "
                    >
                        <circle
                            cx="11"
                            cy="11"
                            r="8"
                        />

                        <path d="M21 21l-4.35-4.35" />
                    </svg>

                    <input
                        value={search}
                        onChange={(event) => {
                            setSearch(
                                event.target.value
                            );

                            setPage(0);
                        }}
                        placeholder="Search by name, email, department..."
                        className="
                            w-full
                            min-w-0
                            h-10
                            pl-[38px]
                            pr-4
                            rounded-xl
                            text-[13px]
                            outline-none
                            box-border
                            bg-white
                            border
                            border-slate-200
                            text-slate-900
                            dark:bg-[#111A2C]
                            dark:border-[#223148]
                            dark:text-[#E6F1FB]
                            focus:border-indigo-500
                            dark:focus:border-[#378ADD]
                        "
                    />

                    {searching && (
                        <span
                            className="
                                absolute
                                right-3
                                top-1/2
                                -translate-y-1/2
                                text-[11px]
                                text-slate-400
                                dark:text-[#5F7590]
                            "
                        >
                            Searching...
                        </span>
                    )}

                </div>

                {/* =============================================
                   TABLE
                ============================================== */}

                <div
                    className="
                        w-full
                        min-w-0
                        max-w-full
                        overflow-x-auto
                        rounded-xl
                        border
                        bg-white
                        border-slate-200
                        dark:bg-[#0F1728]
                        dark:border-[#1B2740]
                    "
                >

                    {/* TABLE HEADER */}

                    <div
                        className="
                            hidden
                            md:grid
                            gap-3
                            px-5
                            py-3
                            border-b
                            bg-slate-50
                            border-slate-200
                            dark:bg-[#0B1220]
                            dark:border-[#1B2740]
                        "
                        style={{
                            gridTemplateColumns:
                                tableColumns,
                        }}
                    >

                        <div className="text-[11px] font-bold uppercase text-slate-500 dark:text-[#7C93B3]">
                            EMP ID
                        </div>

                        <div className="text-[11px] font-bold uppercase text-slate-500 dark:text-[#7C93B3]">
                            EMPLOYEE
                        </div>

                        <div className="text-[11px] font-bold uppercase text-slate-500 dark:text-[#7C93B3]">
                            DEPARTMENT
                        </div>

                        <div className="text-[11px] font-bold uppercase text-slate-500 dark:text-[#7C93B3]">
                            DESIGNATION
                        </div>

                        <div className="text-[11px] font-bold uppercase text-slate-500 dark:text-[#7C93B3]">
                            ROLE
                        </div>

                        <div className="text-[11px] font-bold uppercase text-slate-500 dark:text-[#7C93B3]">
                            STATUS
                        </div>

                        <div className="text-[11px] font-bold uppercase text-slate-500 dark:text-[#7C93B3]">
                            ACTIONS
                        </div>

                    </div>

                    {/* =========================================
                       LOADING
                    ========================================== */}

                    {loading ? (

                        <div
                            className="
                                flex
                                items-center
                                justify-center
                                py-16
                                text-sm
                                text-slate-400
                                dark:text-[#5F7590]
                            "
                        >
                            Loading employees...
                        </div>

                    ) : employees.length === 0 ? (

                        /* =====================================
                           EMPTY
                        ====================================== */

                        <div
                            className="
                                flex
                                flex-col
                                items-center
                                justify-center
                                py-16
                                px-5
                                text-center
                            "
                        >

                            <Users
                                size={46}
                                strokeWidth={1.5}
                                className="
                                    mb-3
                                    text-slate-400
                                    dark:text-[#5F7590]
                                "
                            />

                            <p
                                className="
                                    text-[15px]
                                    font-semibold
                                    text-slate-900
                                    dark:text-[#E6F1FB]
                                "
                            >
                                {search
                                    ? 'No employees found'
                                    : 'No employees yet'}
                            </p>

                            <p
                                className="
                                    mt-1
                                    text-[13px]
                                    text-slate-500
                                    dark:text-[#7C93B3]
                                "
                            >
                                {search
                                    ? `No results for "${search}"`
                                    : 'Add your first employee'}
                            </p>

                        </div>

                    ) : (

                        /* =====================================
                           EMPLOYEE ROWS
                        ====================================== */

                        <div className="w-full min-w-0">

                            {employees.map((employee) => (

                                <div
                                    key={employee.id}
                                    className="
                                        border-b
                                        border-slate-100
                                        dark:border-[#1B2740]
                                        last:border-b-0
                                    "
                                >

                                    {/* =========================
                                       DESKTOP ROW
                                    ========================== */}

                                    <div
                                        className="
                                            hidden
                                            md:grid
                                            gap-3
                                            items-center
                                            px-5
                                            py-3.5
                                            min-w-0
                                            w-full
                                            hover:bg-slate-50
                                            dark:hover:bg-[#111A2C]
                                        "
                                        style={{
                                            gridTemplateColumns:
                                                tableColumns,
                                        }}
                                    >

                                        {/* EMP ID */}

                                        <div
                                            className="
                                                min-w-0
                                                overflow-hidden
                                                whitespace-nowrap
                                                text-ellipsis
                                                text-xs
                                                font-semibold
                                                text-slate-500
                                                dark:text-[#7C93B3]
                                            "
                                            title={
                                                employee.employeeId
                                            }
                                        >
                                            {
                                                employee.employeeId
                                            }
                                        </div>

                                        {/* EMPLOYEE */}

                                        <div
                                            className="
                                                min-w-0
                                                flex
                                                items-center
                                                gap-2.5
                                            "
                                        >

                                            <div
                                                className="
                                                    shrink-0
                                                    w-[34px]
                                                    h-[34px]
                                                    rounded-full
                                                    flex
                                                    items-center
                                                    justify-center
                                                    text-xs
                                                    font-bold
                                                    bg-[#185FA5]
                                                    text-white
                                                "
                                            >
                                                {
                                                    employee.firstName?.[0]
                                                }
                                                {
                                                    employee.lastName?.[0]
                                                }
                                            </div>

                                            <div
                                                className="
                                                    min-w-0
                                                    flex-1
                                                "
                                            >

                                                <div
                                                    className="
                                                        min-w-0
                                                        overflow-hidden
                                                        whitespace-nowrap
                                                        text-ellipsis
                                                        text-[13px]
                                                        font-semibold
                                                        text-slate-900
                                                        dark:text-[#E6F1FB]
                                                    "
                                                    title={`
                                                        ${employee.firstName || ''}
                                                        ${employee.lastName || ''}
                                                    `}
                                                >
                                                    {
                                                        employee.firstName
                                                    }{' '}
                                                    {
                                                        employee.lastName
                                                    }
                                                </div>

                                                <div
                                                    className="
                                                        min-w-0
                                                        overflow-hidden
                                                        whitespace-nowrap
                                                        text-ellipsis
                                                        text-[11px]
                                                        text-slate-500
                                                        dark:text-[#5F7590]
                                                    "
                                                    title={
                                                        employee.email
                                                    }
                                                >
                                                    {
                                                        employee.email
                                                    }
                                                </div>

                                            </div>

                                        </div>

                                        {/* DEPARTMENT */}

                                        <div
                                            className="
                                                min-w-0
                                                overflow-hidden
                                                whitespace-nowrap
                                                text-ellipsis
                                                text-[13px]
                                                text-slate-700
                                                dark:text-[#B5D4F4]
                                            "
                                            title={
                                                employee.department ||
                                                '—'
                                            }
                                        >
                                            {
                                                employee.department ||
                                                '—'
                                            }
                                        </div>

                                        {/* DESIGNATION */}

                                        <div
                                            className="
                                                min-w-0
                                                overflow-hidden
                                                whitespace-nowrap
                                                text-ellipsis
                                                text-[13px]
                                                text-slate-700
                                                dark:text-[#B5D4F4]
                                            "
                                            title={
                                                employee.designation ||
                                                '—'
                                            }
                                        >
                                            {
                                                employee.designation ||
                                                '—'
                                            }
                                        </div>

                                        {/* ROLE */}

                                        <div
                                            className="
                                                min-w-0
                                                overflow-hidden
                                            "
                                        >
                                            <Badge
                                                status={
                                                    employee.role
                                                }
                                            />
                                        </div>

                                        {/* STATUS */}

                                        <div
                                            className="
                                                min-w-0
                                                overflow-hidden
                                            "
                                        >
                                            <Badge
                                                status={
                                                    employee.active
                                                        ? 'ACTIVE'
                                                        : 'INACTIVE'
                                                }
                                            />
                                        </div>

                                        {/* ACTIONS */}

                                        <div
                                            className="
                                                min-w-0
                                                flex
                                                items-center
                                                gap-1.5
                                                overflow-hidden
                                            "
                                        >

                                            <button
                                                type="button"
                                                onClick={() =>
                                                    openEditForm(
                                                        employee
                                                    )
                                                }
                                                className="
                                                    shrink-0
                                                    px-3
                                                    py-1.5
                                                    rounded-md
                                                    text-[11px]
                                                    font-bold
                                                    whitespace-nowrap
                                                    cursor-pointer
                                                    bg-blue-600
                                                    text-white
                                                    dark:bg-[#185FA5]
                                                "
                                            >
                                                Edit
                                            </button>

                                            <button
                                                type="button"
                                                onClick={() =>
                                                    setShowDeleteConfirm(
                                                        employee
                                                    )
                                                }
                                                className="
                                                    shrink-0
                                                    px-3
                                                    py-1.5
                                                    rounded-md
                                                    text-[11px]
                                                    font-bold
                                                    whitespace-nowrap
                                                    cursor-pointer
                                                    bg-red-600
                                                    text-white
                                                    dark:bg-[#A32D2D]
                                                "
                                            >
                                                Delete
                                            </button>

                                        </div>

                                    </div>

                                    {/* =========================
                                       MOBILE CARD
                                    ========================== */}

                                    <div
                                        className="
                                            md:hidden
                                            p-4
                                            bg-white
                                            dark:bg-[#0F1728]
                                        "
                                    >

                                        <div
                                            className="
                                                flex
                                                items-center
                                                gap-3
                                                min-w-0
                                            "
                                        >

                                            <div
                                                className="
                                                    shrink-0
                                                    w-10
                                                    h-10
                                                    rounded-full
                                                    flex
                                                    items-center
                                                    justify-center
                                                    text-xs
                                                    font-bold
                                                    bg-[#185FA5]
                                                    text-white
                                                "
                                            >
                                                {
                                                    employee.firstName?.[0]
                                                }
                                                {
                                                    employee.lastName?.[0]
                                                }
                                            </div>

                                            <div className="min-w-0 flex-1">

                                                <div
                                                    className="
                                                        font-semibold
                                                        text-sm
                                                        truncate
                                                        text-slate-900
                                                        dark:text-[#E6F1FB]
                                                    "
                                                >
                                                    {
                                                        employee.firstName
                                                    }{' '}
                                                    {
                                                        employee.lastName
                                                    }
                                                </div>

                                                <div
                                                    className="
                                                        text-[11px]
                                                        truncate
                                                        text-slate-500
                                                        dark:text-[#5F7590]
                                                    "
                                                >
                                                    {
                                                        employee.email
                                                    }
                                                </div>

                                            </div>

                                            <Badge
                                                status={
                                                    employee.active
                                                        ? 'ACTIVE'
                                                        : 'INACTIVE'
                                                }
                                            />

                                        </div>

                                        <div
                                            className="
                                                grid
                                                grid-cols-2
                                                gap-3
                                                mt-4
                                            "
                                        >

                                            <div>
                                                <p className="text-[10px] uppercase font-bold text-slate-400">
                                                    EMP ID
                                                </p>

                                                <p className="text-xs mt-1 text-slate-700 dark:text-[#B5D4F4]">
                                                    {
                                                        employee.employeeId
                                                    }
                                                </p>
                                            </div>

                                            <div>
                                                <p className="text-[10px] uppercase font-bold text-slate-400">
                                                    ROLE
                                                </p>

                                                <div className="mt-1">
                                                    <Badge
                                                        status={
                                                            employee.role
                                                        }
                                                    />
                                                </div>
                                            </div>

                                            <div>
                                                <p className="text-[10px] uppercase font-bold text-slate-400">
                                                    DEPARTMENT
                                                </p>

                                                <p className="text-xs mt-1 truncate text-slate-700 dark:text-[#B5D4F4]">
                                                    {
                                                        employee.department ||
                                                        '—'
                                                    }
                                                </p>
                                            </div>

                                            <div>
                                                <p className="text-[10px] uppercase font-bold text-slate-400">
                                                    DESIGNATION
                                                </p>

                                                <p className="text-xs mt-1 truncate text-slate-700 dark:text-[#B5D4F4]">
                                                    {
                                                        employee.designation ||
                                                        '—'
                                                    }
                                                </p>
                                            </div>

                                        </div>

                                        <div
                                            className="
                                                flex
                                                gap-2
                                                mt-4
                                            "
                                        >

                                            <button
                                                type="button"
                                                onClick={() =>
                                                    openEditForm(
                                                        employee
                                                    )
                                                }
                                                className="
                                                    flex-1
                                                    py-2
                                                    rounded-lg
                                                    text-xs
                                                    font-bold
                                                    bg-blue-600
                                                    text-white
                                                    cursor-pointer
                                                "
                                            >
                                                Edit
                                            </button>

                                            <button
                                                type="button"
                                                onClick={() =>
                                                    setShowDeleteConfirm(
                                                        employee
                                                    )
                                                }
                                                className="
                                                    flex-1
                                                    py-2
                                                    rounded-lg
                                                    text-xs
                                                    font-bold
                                                    bg-red-600
                                                    text-white
                                                    cursor-pointer
                                                "
                                            >
                                                Delete
                                            </button>

                                        </div>

                                    </div>

                                </div>
                            ))}

                        </div>
                    )}

                    {/* =========================================
                       PAGINATION
                    ========================================== */}

                    {!loading &&
                        employees.length > 0 &&
                        totalPages > 1 && (

                            <div
                                className="
                                    flex
                                    flex-wrap
                                    items-center
                                    justify-center
                                    gap-2
                                    px-5
                                    py-4
                                    border-t
                                    border-slate-200
                                    dark:border-[#1B2740]
                                "
                            >

                                <button
                                    type="button"
                                    disabled={page === 0}
                                    onClick={() =>
                                        setPage((previous) =>
                                            Math.max(
                                                0,
                                                previous - 1
                                            )
                                        )
                                    }
                                    className="
                                        px-3
                                        py-1.5
                                        rounded-md
                                        text-xs
                                        font-semibold
                                        border
                                        bg-white
                                        border-slate-300
                                        dark:bg-[#111A2C]
                                        dark:border-[#223148]
                                        dark:text-[#B5D4F4]
                                        disabled:opacity-40
                                        disabled:cursor-not-allowed
                                    "
                                >
                                    ← Prev
                                </button>

                                <span
                                    className="
                                        text-xs
                                        px-2
                                        text-slate-500
                                        dark:text-[#7C93B3]
                                        whitespace-nowrap
                                    "
                                >
                                    Page {page + 1} of{' '}
                                    {totalPages}
                                </span>

                                <button
                                    type="button"
                                    disabled={
                                        page >=
                                        totalPages - 1
                                    }
                                    onClick={() =>
                                        setPage((previous) =>
                                            Math.min(
                                                totalPages - 1,
                                                previous + 1
                                            )
                                        )
                                    }
                                    className="
                                        px-3
                                        py-1.5
                                        rounded-md
                                        text-xs
                                        font-semibold
                                        border
                                        bg-white
                                        border-slate-300
                                        dark:bg-[#111A2C]
                                        dark:border-[#223148]
                                        dark:text-[#B5D4F4]
                                        disabled:opacity-40
                                        disabled:cursor-not-allowed
                                    "
                                >
                                    Next →
                                </button>

                            </div>
                        )}

                </div>

            </div>

            {/* =================================================
               ADD / EDIT MODAL
            ================================================= */}

            {showForm && (

                <div
                    className="
                        fixed
                        inset-0
                        z-[100]
                        flex
                        items-center
                        justify-center
                        p-4
                        bg-black/50
                        backdrop-blur-sm
                    "
                >

                    <div
                        className="
                            w-full
                            max-w-[620px]
                            max-h-[90vh]
                            overflow-y-auto
                            rounded-2xl
                            p-6
                            sm:p-7
                            border
                            bg-white
                            border-slate-200
                            dark:bg-[#0F1728]
                            dark:border-[#1B2740]
                        "
                    >

                        {/* Modal Header */}

                        <div
                            className="
                                flex
                                items-center
                                justify-between
                                gap-3
                                mb-5
                            "
                        >

                            <h2
                                className="
                                    text-lg
                                    font-extrabold
                                    text-slate-900
                                    dark:text-[#E6F1FB]
                                "
                            >
                                {editMode
                                    ? 'Edit Employee'
                                    : 'Add New Employee'}
                            </h2>

                            <button
                                type="button"
                                onClick={() =>
                                    setShowForm(false)
                                }
                                className="
                                    shrink-0
                                    text-xl
                                    cursor-pointer
                                    text-slate-500
                                    dark:text-[#7C93B3]
                                "
                            >
                                ✕
                            </button>

                        </div>

                        <form
                            onSubmit={handleSubmit}
                        >

                            <div
                                className="
                                    grid
                                    grid-cols-1
                                    sm:grid-cols-2
                                    gap-3.5
                                "
                            >

                                <InputField
                                    label="Employee ID"
                                    name="employeeId"
                                    required
                                    placeholder="EMP0004"
                                    value={
                                        form.employeeId
                                    }
                                    onChange={
                                        handleFieldChange
                                    }
                                />

                                <InputField
                                    label="First Name"
                                    name="firstName"
                                    required
                                    placeholder="John"
                                    value={
                                        form.firstName
                                    }
                                    onChange={
                                        handleFieldChange
                                    }
                                />

                                <InputField
                                    label="Last Name"
                                    name="lastName"
                                    required
                                    placeholder="Doe"
                                    value={
                                        form.lastName
                                    }
                                    onChange={
                                        handleFieldChange
                                    }
                                />

                                <InputField
                                    label="Email"
                                    name="email"
                                    type="email"
                                    required
                                    placeholder="john@hrms.com"
                                    value={
                                        form.email
                                    }
                                    onChange={
                                        handleFieldChange
                                    }
                                />

                                {/* Password */}

                                <div className="relative">

                                    <InputField
                                        label={
                                            editMode
                                                ? 'Password (leave blank to keep)'
                                                : 'Password'
                                        }
                                        name="password"
                                        type={
                                            showPassword
                                                ? 'text'
                                                : 'password'
                                        }
                                        required={
                                            !editMode
                                        }
                                        placeholder="Min 8 characters"
                                        value={
                                            form.password
                                        }
                                        onChange={
                                            handleFieldChange
                                        }
                                    />

                                    <button
                                        type="button"
                                        onClick={() =>
                                            setShowPassword(
                                                (previous) =>
                                                    !previous
                                            )
                                        }
                                        className="
                                            absolute
                                            right-3
                                            top-[36px]
                                            cursor-pointer
                                            text-slate-500
                                            dark:text-[#7C93B3]
                                        "
                                    >
                                        {showPassword ? (
                                            <FaEye />
                                        ) : (
                                            <FaEyeSlash />
                                        )}
                                    </button>

                                </div>

                                <InputField
                                    label="Phone"
                                    name="phone"
                                    type="tel"
                                    placeholder="9876543210"
                                    value={
                                        form.phone
                                    }
                                    onChange={
                                        handleFieldChange
                                    }
                                    numericOnly
                                    maxLength={10}
                                />

                                <InputField
                                    label="Department"
                                    name="department"
                                    placeholder="IT"
                                    value={
                                        form.department
                                    }
                                    onChange={
                                        handleFieldChange
                                    }
                                />

                                <InputField
                                    label="Designation"
                                    name="designation"
                                    placeholder="Software Engineer"
                                    value={
                                        form.designation
                                    }
                                    onChange={
                                        handleFieldChange
                                    }
                                />

                                <InputField
                                    label="Basic Salary"
                                    name="basicSalary"
                                    type="number"
                                    placeholder="50000"
                                    value={
                                        form.basicSalary
                                    }
                                    onChange={
                                        handleFieldChange
                                    }
                                />

                                <InputField
                                    label="Date of Joining"
                                    name="dateOfJoining"
                                    type="date"
                                    value={
                                        form.dateOfJoining
                                    }
                                    onChange={
                                        handleFieldChange
                                    }
                                />

                                <InputField
                                    label="Date of Birth"
                                    name="dateOfBirth"
                                    type="date"
                                    value={
                                        form.dateOfBirth
                                    }
                                    onChange={
                                        handleFieldChange
                                    }
                                    max={
                                        new Date()
                                            .toISOString()
                                            .split('T')[0]
                                    }
                                />

                            </div>

                            {/* ROLE */}

                            <div className="mt-4">

                                <label
                                    className="
                                        block
                                        mb-1.5
                                        text-xs
                                        font-semibold
                                        text-slate-700
                                        dark:text-[#B5D4F4]
                                    "
                                >
                                    Role{' '}
                                    <span className="text-red-500">
                                        *
                                    </span>
                                </label>

                                <select
                                    value={form.role}
                                    onChange={(event) =>
                                        handleFieldChange(
                                            'role',
                                            event.target.value
                                        )
                                    }
                                    className={INPUT_CLASS}
                                >
                                    <option value="EMPLOYEE">
                                        EMPLOYEE
                                    </option>

                                    <option value="HR">
                                        HR
                                    </option>

                                    <option value="ADMIN">
                                        ADMIN
                                    </option>
                                </select>

                            </div>

                            {/* BUTTONS */}

                            <div
                                className="
                                    flex
                                    flex-col
                                    sm:flex-row
                                    gap-2.5
                                    mt-6
                                "
                            >

                                <button
                                    type="button"
                                    onClick={() =>
                                        setShowForm(false)
                                    }
                                    className="
                                        flex-1
                                        py-3
                                        rounded-xl
                                        text-sm
                                        font-semibold
                                        cursor-pointer
                                        bg-slate-100
                                        text-slate-700
                                        dark:bg-[#111A2C]
                                        dark:text-[#B5D4F4]
                                    "
                                >
                                    Cancel
                                </button>

                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="
                                        flex-1
                                        py-3
                                        rounded-xl
                                        text-sm
                                        font-bold
                                        flex
                                        items-center
                                        justify-center
                                        gap-2
                                        cursor-pointer
                                        bg-indigo-500
                                        text-white
                                        dark:bg-[#378ADD]
                                        dark:text-[#042C53]
                                        disabled:opacity-60
                                        disabled:cursor-not-allowed
                                    "
                                >

                                    {submitting ? (
                                        <>
                                            <Loader2
                                                size={16}
                                                className="animate-spin"
                                            />

                                            Saving...
                                        </>
                                    ) : editMode ? (
                                        'Update Employee'
                                    ) : (
                                        'Add Employee'
                                    )}

                                </button>

                            </div>

                        </form>

                    </div>

                </div>
            )}

            {/* =================================================
               DELETE MODAL
            ================================================= */}

            {showDeleteConfirm && (

                <div
                    className="
                        fixed
                        inset-0
                        z-[100]
                        flex
                        items-center
                        justify-center
                        p-4
                        bg-black/50
                        backdrop-blur-sm
                    "
                >

                    <div
                        className="
                            w-full
                            max-w-[400px]
                            rounded-2xl
                            p-7
                            text-center
                            border
                            bg-white
                            border-slate-200
                            dark:bg-[#0F1728]
                            dark:border-[#1B2740]
                        "
                    >

                        <AlertTriangle
                            size={48}
                            strokeWidth={1.5}
                            className="
                                mx-auto
                                mb-4
                                text-red-500
                                dark:text-[#F09595]
                            "
                        />

                        <h2
                            className="
                                text-lg
                                font-extrabold
                                text-slate-900
                                dark:text-[#E6F1FB]
                            "
                        >
                            Delete Employee?
                        </h2>

                        <p
                            className="
                                mt-2
                                text-[13px]
                                text-slate-500
                                dark:text-[#7C93B3]
                            "
                        >
                            Are you sure you want to delete{' '}

                            <strong
                                className="
                                    text-slate-900
                                    dark:text-[#E6F1FB]
                                "
                            >
                                {
                                    showDeleteConfirm.firstName
                                }{' '}
                                {
                                    showDeleteConfirm.lastName
                                }
                            </strong>
                            ?
                        </p>

                        <div
                            className="
                                flex
                                gap-2.5
                                mt-6
                            "
                        >

                            <button
                                type="button"
                                onClick={() =>
                                    setShowDeleteConfirm(
                                        null
                                    )
                                }
                                className="
                                    flex-1
                                    py-3
                                    rounded-xl
                                    text-sm
                                    font-semibold
                                    cursor-pointer
                                    bg-slate-100
                                    text-slate-700
                                    dark:bg-[#111A2C]
                                    dark:text-[#B5D4F4]
                                "
                            >
                                Cancel
                            </button>

                            <button
                                type="button"
                                disabled={
                                    deleting ===
                                    showDeleteConfirm.id
                                }
                                onClick={() => handleDelete(showDeleteConfirm)}
                                className="
                                    flex-1
                                    py-3
                                    rounded-xl
                                    text-sm
                                    font-bold
                                    flex
                                    items-center
                                    justify-center
                                    gap-2
                                    cursor-pointer
                                    bg-red-600
                                    text-white
                                    dark:bg-[#A32D2D]
                                    disabled:opacity-60
                                    disabled:cursor-not-allowed
                                "
                            >

                                {deleting ===
                                    showDeleteConfirm.id ? (
                                    <>
                                        <Loader2
                                            size={16}
                                            className="animate-spin"
                                        />
                                        Deleting...
                                    </>
                                ) : (
                                    'Yes, Delete'
                                )}

                            </button>

                        </div>

                    </div>

                </div>
            )}

        </div>
    );
}