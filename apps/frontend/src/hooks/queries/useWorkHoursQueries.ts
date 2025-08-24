import { useQuery } from '@tanstack/react-query'
import axios from 'axios'
import { BASE_URL } from '@/config'
import {
    WorkHoursResponse,
    WorkHour,
    WorkHourMetricsResponse,
    WorkHourQueryParams,
} from '@/types/workHoursType'

const API_ENDPOINTS = {
    GET_WORK_HOURS: 'workHours',
    GET_WORK_HOUR: 'workHours',
    GET_WEEKLY_WORK_HOURS: 'workHours/week',
    GET_WORK_HOURS_RANGE: 'workHours/range',
    GET_WORK_HOURS_METRICS: 'workHours/metrics',
    GET_EMPLOYEE_WORK_HOURS: 'workHours/employee',
}

/**
 * Hook for fetching work hours with filters and pagination
 */
export const useWorkHoursQuery = (params?: WorkHourQueryParams) => {
    return useQuery<WorkHoursResponse>({
        queryKey: ['workHours', params],
        queryFn: async () => {
            const response = await axios({
                method: 'GET',
                baseURL: BASE_URL,
                url: API_ENDPOINTS.GET_WORK_HOURS,
                params,
            })
            return response.data
        },
        staleTime: 1000 * 60 * 2, // 2 minutes
        enabled: true,
    })
}

/**
 * Hook for fetching a single work hour entry by ID
 */
export const useWorkHourQuery = (id: string) => {
    return useQuery<{ workHour: WorkHour }>({
        queryKey: ['workHour', id],
        queryFn: async () => {
            const response = await axios({
                method: 'GET',
                baseURL: BASE_URL,
                url: `${API_ENDPOINTS.GET_WORK_HOUR}/${id}`,
            })
            return response.data
        },
        staleTime: 1000 * 60 * 5, // 5 minutes
        enabled: !!id,
    })
}

/**
 * Hook for fetching work hours for a specific week
 */
export const useWeeklyWorkHoursQuery = (year: number, week: number) => {
    return useQuery<{ workHours: WorkHour[] }>({
        queryKey: ['workHours', 'week', year, week],
        queryFn: async () => {
            const response = await axios({
                method: 'GET',
                baseURL: BASE_URL,
                url: `${API_ENDPOINTS.GET_WEEKLY_WORK_HOURS}/${year}/${week}`,
            })
            return response.data
        },
        staleTime: 1000 * 60 * 5, // 5 minutes
        enabled: !!(year && week),
    })
}

/**
 * Hook for fetching work hours within a date range
 */
export const useWorkHoursRangeQuery = (startDate: string, endDate: string) => {
    return useQuery<{ workHours: WorkHour[] }>({
        queryKey: ['workHours', 'range', startDate, endDate],
        queryFn: async () => {
            const response = await axios({
                method: 'GET',
                baseURL: BASE_URL,
                url: `${API_ENDPOINTS.GET_WORK_HOURS_RANGE}/${startDate}/${endDate}`,
            })
            return response.data
        },
        staleTime: 1000 * 60 * 3, // 3 minutes
        enabled: !!(startDate && endDate),
    })
}

/**
 * Hook for fetching work hours metrics for a date range
 */
export const useWorkHoursMetricsQuery = (startDate: string, endDate: string) => {
    return useQuery<WorkHourMetricsResponse>({
        queryKey: ['workHours', 'metrics', startDate, endDate],
        queryFn: async () => {
            const response = await axios({
                method: 'GET',
                baseURL: BASE_URL,
                url: `${API_ENDPOINTS.GET_WORK_HOURS_METRICS}/${startDate}/${endDate}`,
            })
            return response.data
        },
        staleTime: 1000 * 60 * 5, // 5 minutes
        enabled: !!(startDate && endDate),
    })
}

/**
 * Hook for fetching work hours for a specific employee
 */
export const useEmployeeWorkHoursQuery = (
    employeeId: string,
    params?: { startDate?: string; endDate?: string; limit?: number }
) => {
    return useQuery<{ workHours: WorkHour[] }>({
        queryKey: ['workHours', 'employee', employeeId, params],
        queryFn: async () => {
            const response = await axios({
                method: 'GET',
                baseURL: BASE_URL,
                url: `${API_ENDPOINTS.GET_EMPLOYEE_WORK_HOURS}/${employeeId}`,
                params,
            })
            return response.data
        },
        staleTime: 1000 * 60 * 5, // 5 minutes
        enabled: !!employeeId,
    })
}

/**
 * Hook for retrieving all work hours query hooks
 */
export const useWorkHoursQueries = () => {
    return {
        workHours: useWorkHoursQuery,
        workHour: useWorkHourQuery,
        weeklyWorkHours: useWeeklyWorkHoursQuery,
        workHoursRange: useWorkHoursRangeQuery,
        workHoursMetrics: useWorkHoursMetricsQuery,
        employeeWorkHours: useEmployeeWorkHoursQuery,
    }
}