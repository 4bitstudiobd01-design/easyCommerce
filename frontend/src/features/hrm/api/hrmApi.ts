import { createApi } from '@reduxjs/toolkit/query/react';
import { createBaseQueryWithReauth } from '@/store/baseQueryWithReauth';

export type EmploymentType = 'FULL_TIME' | 'PART_TIME' | 'CONTRACT' | 'INTERN';
export type EmploymentStatus = 'ACTIVE' | 'ON_LEAVE' | 'SUSPENDED' | 'TERMINATED';
export type EmployeeGender = 'MALE' | 'FEMALE' | 'OTHER';

export interface Department {
  id: string;
  tenantId: string;
  storeId: string;
  name: string;
  description?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Employee {
  id: string;
  tenantId: string;
  storeId: string;
  departmentId?: string;
  department?: Department;
  employeeCode: string;
  fullName: string;
  email?: string;
  phone?: string;
  designation?: string;
  employmentType: EmploymentType;
  employmentStatus: EmploymentStatus;
  dateOfJoining: string;
  dateOfBirth?: string;
  gender?: EmployeeGender;
  address?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  avatarUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PaginatedEmployees {
  items: Employee[];
  total: number;
  page: number;
  limit: number;
}

export interface CreateDepartmentRequest {
  name: string;
  description?: string;
}

export interface UpdateDepartmentRequest {
  id: string;
  name?: string;
  description?: string;
  isActive?: boolean;
}

export interface CreateEmployeeRequest {
  fullName: string;
  email?: string;
  phone?: string;
  departmentId?: string;
  designation?: string;
  employmentType?: EmploymentType;
  dateOfJoining: string;
  dateOfBirth?: string;
  gender?: EmployeeGender;
  address?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
}

export interface UpdateEmployeeRequest extends Omit<Partial<CreateEmployeeRequest>, 'departmentId'> {
  id: string;
  employmentStatus?: EmploymentStatus;
  departmentId?: string | null;
}

export type AttendanceStatus = 'PRESENT' | 'ABSENT' | 'LATE' | 'HALF_DAY' | 'ON_LEAVE';
export type LeaveType = 'EARNED' | 'CASUAL' | 'SICK';
export type LeaveStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED';

export interface Attendance {
  id: string;
  tenantId: string;
  storeId: string;
  employeeId: string;
  date: string;
  status: AttendanceStatus;
  checkInAt?: string;
  checkOutAt?: string;
  notes?: string;
  markedByUserId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AttendanceRosterRow {
  employee: Employee;
  attendance: Attendance | null;
}

export interface ListAttendanceParams {
  date?: string;
  departmentId?: string;
}

export interface CheckInRequest {
  employeeId: string;
  date: string;
}

export interface CheckOutRequest {
  employeeId: string;
  date: string;
}

export interface MarkAttendanceStatusRequest {
  employeeId: string;
  date: string;
  status: AttendanceStatus;
  notes?: string;
}

export interface Holiday {
  id: string;
  tenantId: string;
  storeId: string;
  name: string;
  date: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateHolidayRequest {
  name: string;
  date: string;
}

export interface UpdateHolidayRequest {
  id: string;
  name?: string;
  date?: string;
}

export interface LeavePolicy {
  id: string;
  tenantId: string;
  storeId: string;
  earnedDaysPerYear: number;
  casualDaysPerYear: number;
  sickDaysPerYear: number;
  createdAt: string;
  updatedAt: string;
}

export interface UpdateLeavePolicyRequest {
  earnedDaysPerYear?: number;
  casualDaysPerYear?: number;
  sickDaysPerYear?: number;
}

export interface LeaveBalanceLine {
  leaveType: LeaveType;
  allocated: number;
  used: number;
  remaining: number;
}

export interface LeaveRequest {
  id: string;
  tenantId: string;
  storeId: string;
  employeeId: string;
  employee?: Employee;
  leaveType: LeaveType;
  startDate: string;
  endDate: string;
  totalDays: number;
  reason?: string;
  status: LeaveStatus;
  documentFileId?: string;
  reviewedByUserId?: string;
  reviewedAt?: string;
  reviewNote?: string;
  createdByUserId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PaginatedLeaveRequests {
  items: LeaveRequest[];
  total: number;
  page: number;
  limit: number;
}

export interface CreateLeaveRequestRequest {
  employeeId: string;
  leaveType: LeaveType;
  startDate: string;
  endDate: string;
  reason?: string;
}

export interface ReviewLeaveRequestRequest {
  id: string;
  status: 'APPROVED' | 'REJECTED';
  reviewNote?: string;
}

export interface ListLeaveRequestsParams {
  employeeId?: string;
  status?: LeaveStatus;
  leaveType?: LeaveType;
  page?: number;
  limit?: number;
}

export interface Shift {
  id: string;
  tenantId: string;
  storeId: string;
  name: string;
  startTime: string;
  endTime: string;
  colorTag: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateShiftRequest {
  name: string;
  startTime: string;
  endTime: string;
  colorTag?: string;
}

export interface UpdateShiftRequest {
  id: string;
  name?: string;
  startTime?: string;
  endTime?: string;
  colorTag?: string;
  isActive?: boolean;
}

export interface ShiftAssignment {
  employeeId: string;
  date: string;
  shiftId: string;
}

export interface Roster {
  employees: Employee[];
  shifts: Shift[];
  assignments: ShiftAssignment[];
}

export interface ListRosterParams {
  startDate: string;
  endDate: string;
  departmentId?: string;
}

export interface AssignShiftRequest {
  employeeId: string;
  shiftId: string;
  date: string;
}

export interface RemoveShiftAssignmentRequest {
  employeeId: string;
  date: string;
}

export interface ListEmployeesParams {
  search?: string;
  departmentId?: string;
  status?: EmploymentStatus;
  page?: number;
  limit?: number;
}

const unwrap = <T,>(response: { data: T } | T): T =>
  (response as { data: T })?.data !== undefined ? (response as { data: T }).data : (response as T);

export const hrmApi = createApi({
  reducerPath: 'hrmApi',
  baseQuery: createBaseQueryWithReauth(
    process.env.NEXT_PUBLIC_API_URL?.replace('/orders', '') || 'http://localhost:5001/api/v1',
  ),
  tagTypes: ['Department', 'Employee', 'Attendance', 'Holiday', 'LeavePolicy', 'LeaveRequest', 'LeaveBalance', 'Shift', 'Roster'],
  endpoints: (builder) => ({
    getDepartments: builder.query<Department[], void>({
      query: () => '/hr/departments',
      providesTags: ['Department'],
      transformResponse: unwrap<Department[]>,
    }),
    createDepartment: builder.mutation<Department, CreateDepartmentRequest>({
      query: (body) => ({ url: '/hr/departments', method: 'POST', body }),
      invalidatesTags: ['Department'],
      transformResponse: unwrap<Department>,
    }),
    updateDepartment: builder.mutation<Department, UpdateDepartmentRequest>({
      query: ({ id, ...body }) => ({ url: `/hr/departments/${id}`, method: 'PATCH', body }),
      invalidatesTags: ['Department', 'Employee'],
      transformResponse: unwrap<Department>,
    }),
    deleteDepartment: builder.mutation<{ success: boolean; message: string }, string>({
      query: (id) => ({ url: `/hr/departments/${id}`, method: 'DELETE' }),
      invalidatesTags: ['Department', 'Employee'],
      transformResponse: unwrap<{ success: boolean; message: string }>,
    }),

    getEmployees: builder.query<PaginatedEmployees, ListEmployeesParams | void>({
      query: (params) => ({ url: '/hr/employees', params: params || undefined }),
      providesTags: ['Employee'],
      transformResponse: unwrap<PaginatedEmployees>,
    }),
    getEmployee: builder.query<Employee, string>({
      query: (id) => `/hr/employees/${id}`,
      providesTags: ['Employee'],
      transformResponse: unwrap<Employee>,
    }),
    createEmployee: builder.mutation<Employee, CreateEmployeeRequest>({
      query: (body) => ({ url: '/hr/employees', method: 'POST', body }),
      invalidatesTags: ['Employee'],
      transformResponse: unwrap<Employee>,
    }),
    updateEmployee: builder.mutation<Employee, UpdateEmployeeRequest>({
      query: ({ id, ...body }) => ({ url: `/hr/employees/${id}`, method: 'PATCH', body }),
      invalidatesTags: ['Employee'],
      transformResponse: unwrap<Employee>,
    }),
    terminateEmployee: builder.mutation<Employee, string>({
      query: (id) => ({ url: `/hr/employees/${id}`, method: 'DELETE' }),
      invalidatesTags: ['Employee'],
      transformResponse: unwrap<Employee>,
    }),

    getAttendance: builder.query<AttendanceRosterRow[], ListAttendanceParams | void>({
      query: (params) => ({ url: '/hr/attendance', params: params || undefined }),
      providesTags: ['Attendance'],
      transformResponse: unwrap<AttendanceRosterRow[]>,
    }),
    checkIn: builder.mutation<Attendance, CheckInRequest>({
      query: (body) => ({ url: '/hr/attendance/check-in', method: 'POST', body }),
      invalidatesTags: ['Attendance'],
      transformResponse: unwrap<Attendance>,
    }),
    checkOut: builder.mutation<Attendance, CheckOutRequest>({
      query: (body) => ({ url: '/hr/attendance/check-out', method: 'POST', body }),
      invalidatesTags: ['Attendance'],
      transformResponse: unwrap<Attendance>,
    }),
    markAttendanceStatus: builder.mutation<Attendance, MarkAttendanceStatusRequest>({
      query: (body) => ({ url: '/hr/attendance/status', method: 'POST', body }),
      invalidatesTags: ['Attendance'],
      transformResponse: unwrap<Attendance>,
    }),

    getHolidays: builder.query<Holiday[], { year?: number } | void>({
      query: (params) => ({ url: '/hr/holidays', params: params || undefined }),
      providesTags: ['Holiday'],
      transformResponse: unwrap<Holiday[]>,
    }),
    createHoliday: builder.mutation<Holiday, CreateHolidayRequest>({
      query: (body) => ({ url: '/hr/holidays', method: 'POST', body }),
      invalidatesTags: ['Holiday'],
      transformResponse: unwrap<Holiday>,
    }),
    updateHoliday: builder.mutation<Holiday, UpdateHolidayRequest>({
      query: ({ id, ...body }) => ({ url: `/hr/holidays/${id}`, method: 'PATCH', body }),
      invalidatesTags: ['Holiday'],
      transformResponse: unwrap<Holiday>,
    }),
    deleteHoliday: builder.mutation<{ success: boolean; message: string }, string>({
      query: (id) => ({ url: `/hr/holidays/${id}`, method: 'DELETE' }),
      invalidatesTags: ['Holiday'],
      transformResponse: unwrap<{ success: boolean; message: string }>,
    }),

    getLeavePolicy: builder.query<LeavePolicy, void>({
      query: () => '/hr/leave/policy',
      providesTags: ['LeavePolicy'],
      transformResponse: unwrap<LeavePolicy>,
    }),
    updateLeavePolicy: builder.mutation<LeavePolicy, UpdateLeavePolicyRequest>({
      query: (body) => ({ url: '/hr/leave/policy', method: 'PATCH', body }),
      invalidatesTags: ['LeavePolicy', 'LeaveBalance'],
      transformResponse: unwrap<LeavePolicy>,
    }),

    getLeaveBalance: builder.query<LeaveBalanceLine[], { employeeId: string; year?: number }>({
      query: ({ employeeId, year }) => ({ url: `/hr/employees/${employeeId}/leave-balance`, params: year ? { year } : undefined }),
      providesTags: ['LeaveBalance'],
      transformResponse: unwrap<LeaveBalanceLine[]>,
    }),

    getLeaveRequests: builder.query<PaginatedLeaveRequests, ListLeaveRequestsParams | void>({
      query: (params) => ({ url: '/hr/leave-requests', params: params || undefined }),
      providesTags: ['LeaveRequest'],
      transformResponse: unwrap<PaginatedLeaveRequests>,
    }),
    createLeaveRequest: builder.mutation<LeaveRequest, CreateLeaveRequestRequest>({
      query: (body) => ({ url: '/hr/leave-requests', method: 'POST', body }),
      invalidatesTags: ['LeaveRequest', 'LeaveBalance'],
      transformResponse: unwrap<LeaveRequest>,
    }),
    reviewLeaveRequest: builder.mutation<LeaveRequest, ReviewLeaveRequestRequest>({
      query: ({ id, ...body }) => ({ url: `/hr/leave-requests/${id}/review`, method: 'PATCH', body }),
      invalidatesTags: ['LeaveRequest', 'LeaveBalance'],
      transformResponse: unwrap<LeaveRequest>,
    }),
    cancelLeaveRequest: builder.mutation<LeaveRequest, string>({
      query: (id) => ({ url: `/hr/leave-requests/${id}/cancel`, method: 'POST' }),
      invalidatesTags: ['LeaveRequest', 'LeaveBalance'],
      transformResponse: unwrap<LeaveRequest>,
    }),
    uploadLeaveDocument: builder.mutation<LeaveRequest, { id: string; file: File }>({
      query: ({ id, file }) => {
        const formData = new FormData();
        formData.append('file', file);
        return { url: `/hr/leave-requests/${id}/document`, method: 'POST', body: formData };
      },
      invalidatesTags: ['LeaveRequest'],
      transformResponse: unwrap<LeaveRequest>,
    }),

    getShifts: builder.query<Shift[], void>({
      query: () => '/hr/shifts',
      providesTags: ['Shift'],
      transformResponse: unwrap<Shift[]>,
    }),
    createShift: builder.mutation<Shift, CreateShiftRequest>({
      query: (body) => ({ url: '/hr/shifts', method: 'POST', body }),
      invalidatesTags: ['Shift'],
      transformResponse: unwrap<Shift>,
    }),
    updateShift: builder.mutation<Shift, UpdateShiftRequest>({
      query: ({ id, ...body }) => ({ url: `/hr/shifts/${id}`, method: 'PATCH', body }),
      invalidatesTags: ['Shift', 'Roster'],
      transformResponse: unwrap<Shift>,
    }),
    deleteShift: builder.mutation<{ success: boolean; message: string }, string>({
      query: (id) => ({ url: `/hr/shifts/${id}`, method: 'DELETE' }),
      invalidatesTags: ['Shift'],
      transformResponse: unwrap<{ success: boolean; message: string }>,
    }),

    getRoster: builder.query<Roster, ListRosterParams>({
      query: (params) => ({ url: '/hr/roster', params }),
      providesTags: ['Roster'],
      transformResponse: unwrap<Roster>,
    }),
    assignShift: builder.mutation<ShiftAssignment, AssignShiftRequest>({
      query: (body) => ({ url: '/hr/roster/assign', method: 'POST', body }),
      invalidatesTags: ['Roster'],
      transformResponse: unwrap<ShiftAssignment>,
    }),
    removeShiftAssignment: builder.mutation<{ success: boolean; message: string }, RemoveShiftAssignmentRequest>({
      query: (params) => ({ url: '/hr/roster/assign', method: 'DELETE', params }),
      invalidatesTags: ['Roster'],
      transformResponse: unwrap<{ success: boolean; message: string }>,
    }),
  }),
});

export const {
  useGetDepartmentsQuery,
  useCreateDepartmentMutation,
  useUpdateDepartmentMutation,
  useDeleteDepartmentMutation,
  useGetEmployeesQuery,
  useGetEmployeeQuery,
  useCreateEmployeeMutation,
  useUpdateEmployeeMutation,
  useTerminateEmployeeMutation,
  useGetAttendanceQuery,
  useCheckInMutation,
  useCheckOutMutation,
  useMarkAttendanceStatusMutation,
  useGetHolidaysQuery,
  useCreateHolidayMutation,
  useUpdateHolidayMutation,
  useDeleteHolidayMutation,
  useGetLeavePolicyQuery,
  useUpdateLeavePolicyMutation,
  useGetLeaveBalanceQuery,
  useGetLeaveRequestsQuery,
  useCreateLeaveRequestMutation,
  useReviewLeaveRequestMutation,
  useCancelLeaveRequestMutation,
  useUploadLeaveDocumentMutation,
  useGetShiftsQuery,
  useCreateShiftMutation,
  useUpdateShiftMutation,
  useDeleteShiftMutation,
  useGetRosterQuery,
  useAssignShiftMutation,
  useRemoveShiftAssignmentMutation,
} = hrmApi;

/** Streams the authenticated document endpoint and opens it in a new tab. RTK Query's
 *  fetchBaseQuery isn't a fit for binary responses, and a plain <a href> can't carry the
 *  bearer token, so this does the fetch + blob URL dance directly. */
export async function openLeaveDocument(requestId: string): Promise<void> {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL?.replace('/orders', '') || 'http://localhost:5001/api/v1';
  const token = localStorage.getItem('bitcommerce_token');
  const storeId = localStorage.getItem('bitcommerce_active_store_id');

  const response = await fetch(`${baseUrl}/hr/leave-requests/${requestId}/document`, {
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(storeId ? { 'x-store-id': storeId } : {}),
    },
  });

  if (!response.ok) {
    throw new Error('Could not load the attached document.');
  }

  const blob = await response.blob();
  const url = window.URL.createObjectURL(blob);
  window.open(url, '_blank');
  setTimeout(() => window.URL.revokeObjectURL(url), 60_000);
}
