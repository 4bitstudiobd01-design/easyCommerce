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
  tagTypes: ['Department', 'Employee', 'Attendance'],
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
} = hrmApi;
