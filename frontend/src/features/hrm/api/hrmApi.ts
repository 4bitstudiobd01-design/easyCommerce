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
  tagTypes: ['Department', 'Employee'],
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
} = hrmApi;
