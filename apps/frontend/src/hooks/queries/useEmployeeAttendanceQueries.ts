import { useQuery } from '@tanstack/react-query'
import type {
    DailyAttendanceData,
    AttendanceSummary,
    ManagerReportStatus,
    AttendanceHistoryData,
} from './types'

export interface EmployeeAttendanceQueryParams {
    date: string
    filter?: string
    search?: string
    page?: number
    limit?: number
}

export const useEmployeeAttendanceQuery = (
    params: EmployeeAttendanceQueryParams,
    options?: { enabled?: boolean }
) => {
    const { date, filter = 'all', search = '', page = 1, limit = 30 } = params
    return useQuery<any, Error, DailyAttendanceData>({
        queryKey: ['quotas/employees', date, { filter, search, page, limit }],
        select: (data: any) => {
            const apiData = data.data
            return {
                employees: apiData?.employees || [],
                statistics: apiData?.statistics || {
                    startingToday: 0,
                    endingToday: 0,
                    totalRequired: 0,
                    totalAttended: 0,
                    internalCount: 0,
                    externalCount: 0,
                },
                pagination: apiData?.pagination,
            }
        },
        enabled: !!date && (options?.enabled ?? true),
        staleTime: 0,
        refetchOnMount: true,
        refetchOnWindowFocus: true,
    })
}

/**
 * Hook to get attendance summary for date range (for calendar indicators)
 */
export const useAttendanceSummaryQuery = (
    startDate: string,
    endDate: string
) => {
    return useQuery<{ data: AttendanceSummary }, Error, AttendanceSummary>({
        queryKey: ['quotas/attendance/range', `${startDate}/${endDate}`],
        select: (data) => data.data,
        enabled: !!(startDate && endDate),
        staleTime: 0, // Always consider stale to ensure fresh data
        refetchOnMount: true,
        refetchOnWindowFocus: true,
    })
}

/**
 * Hook to check if manager has reported for a specific date
 */
export const useManagerReportStatusQuery = (selectedDate: string) => {
    return useQuery<ManagerReportStatus, Error>({
        queryKey: ['quotas/attendance/manager-report/status', selectedDate],
        enabled: !!selectedDate,
        staleTime: 1000 * 60 * 5, // 5 minutes
    })
}

/**
 * Hook to get employee attendance history
 */
export const useEmployeeAttendanceHistoryQuery = (
    employeeId: string,
    maxRecords: number = 20
) => {
    return useQuery<AttendanceHistoryData, Error>({
        queryKey: [
            'quotas/employees',
            `${employeeId}/attendance-history`,
            { limit: maxRecords },
        ],
        enabled: !!employeeId,
        staleTime: 1000 * 60 * 5, // 5 minutes
    })
}
