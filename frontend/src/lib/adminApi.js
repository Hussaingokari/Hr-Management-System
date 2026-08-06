import api from './axios';

export const getAllEmployees = (page = 0, size = 10, department = 'All Departments') => {
  let url = `/api/employees?page=${page}&size=${size}`;
  if (department && department !== 'All Departments') {
    url += `&department=${encodeURIComponent(department)}`;
  }
  return api.get(url);
};

export const getEmployeeById = (id) =>
  api.get(`/api/employees/${id}`);

export const createEmployee = (data) =>
  api.post('/api/employees', data);

export const updateEmployee = (id, data) =>
  api.put(`/api/employees/${id}`, data);

export const deleteEmployee = (id) =>
  api.delete(`/api/employees/${id}`);

export const searchEmployees = (q, page = 0, size = 10) =>
  api.get(`/api/employees/search?q=${q}&page=${page}&size=${size}`);

export const getPendingLeaves = (page = 0, size = 10) =>
  api.get(`/api/leaves/pending?page=${page}&size=${size}`);

export const getPendingCancellations = (page = 0, size = 100) =>
  api.get(`/api/leaves/pending-cancellations?page=${page}&size=${size}`);

export const leaveAction = (id, action, remarks) =>
  api.put(`/api/leaves/${id}/action`, {
    action: action,
    remarks: remarks,
  });

export const cancelAction = (id, approve, remarks) =>
  api.put(`/api/leaves/${id}/cancel-action`, {
    approve: Boolean(approve),
    remarks: remarks,
  });

export const generatePayroll = (employeeId, month, year) =>
  api.post('/api/payroll/generate', { employeeId, month, year });

export const getPayrollByMonth = (month, year) =>
  api.get(`/api/payroll/month?month=${month}&year=${year}`);

export const markPayrollPaid = (id) =>
  api.put(`/api/payroll/${id}/mark-paid`);

export const generatePayslip = (payrollId) =>
  api.post(`/api/payslips/generate/${payrollId}`);

export const getAttendanceByDate = (date) =>
  api.get(`/api/attendance/date/${date}`);

// ── Attendance report: table view (all employees, one date, paginated) ──
export const getAttendanceSummaryByDate = (date, page = 0, size = 50) =>
  api.get(`/api/attendance/admin/summary/${date}?page=${page}&size=${size}`);

// ── Attendance report: modal view (one employee, yesterday/weekly/monthly) ──
export const getEmployeeDetailedReport = (employeeId, asOfDate) =>
  api.get(`/api/attendance/admin/employee/${employeeId}/detailed-report`, {
    params: asOfDate ? { asOfDate } : {},
  });

// Optional single-employee single-date lookup (available if ever needed)
export const getEmployeeAttendanceSummary = (employeeId, date) =>
  api.get(`/api/attendance/admin/employee/${employeeId}/summary`, {
    params: date ? { date } : {},
  });

// ── Attendance report: export to Excel ──
export const exportAttendanceRange = (from, to, status, search) =>
  api.get('/api/attendance/admin/export', {
    params: {
      from,
      to,
      status: status && status !== 'ALL' ? status : undefined,
      search: search || undefined,
    },
    responseType: 'blob',
  });

export const exportEmployeeAttendanceRange = (employeeId, from, to) =>
  api.get(`/api/attendance/admin/employee/${employeeId}/export`, {
    params: { from, to },
    responseType: 'blob',
  });

export const getAllOnboarding = () =>
  api.get('/api/onboarding');

export const getPendingOnboarding = () =>
  api.get('/api/onboarding/pending');

export const getJobPostings = () =>
  api.get('/api/recruitment/jobs/all');

export const getApplications = (jobId) =>
  api.get(`/api/recruitment/jobs/${jobId}/applications`);

// ── Notifications ──
export const getAdminNotifications = (page = 0, size = 20) =>
  api.get(`/api/notifications?page=${page}&size=${size}`);

export const getAdminUnreadCount = () =>
  api.get('/api/notifications/unread-count');

export const markAdminNotificationRead = (id) =>
  api.put(`/api/notifications/${id}/read`);

export const markAllAdminNotificationsRead = () =>
  api.put('/api/notifications/mark-all-read');