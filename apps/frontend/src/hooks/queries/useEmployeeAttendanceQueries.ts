import { useQuery } from '@tanstack/react-query'
import type {
    DailyAttendanceData,
    AttendanceSummary,
    ManagerReportStatus,
    AttendanceHistoryData,
} from './types'

/**
 * Hook to get employee attendance data for a specific date using quota API
 * Gets employees scheduled from Reserve Days Management forms
 */
export const useEmployeeAttendanceQuery = (selectedDate: string) => {
    return useQuery<any, Error, DailyAttendanceData>({
        queryKey: ['quotas/employees', selectedDate],
        select: (data: any) => {
            // Transform API response to match our interface
            const apiData = data.data
            return {
                employees: apiData?.employees || [],
                statistics: apiData?.statistics || {
                    startingToday: 0,
                    endingToday: 0,
                    totalRequired: 0,
                    totalAttended: 0,
                },
            }
        },
        enabled: !!selectedDate,
        staleTime: 0, // Always consider stale to ensure fresh data
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
