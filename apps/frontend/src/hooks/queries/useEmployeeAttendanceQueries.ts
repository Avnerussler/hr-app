import { useQuery } from '@tanstack/react-query'
import axios from 'axios'
import { BASE_URL } from '@/config'

export interface EmployeeAttendance {
    _id: string
    name: string
    personalNumber?: string
    reserveUnit?: string
    workPlace?: string
    orderNumber?: string
    orderType?: string
    isActive: boolean
    startDate?: string
    endDate?: string
    isStartingToday: boolean
    isEndingToday: boolean
    isAttendanceRequired: boolean
    hasAttended: boolean
    workDays?: string[] // Array of dates this employee should work
    reserveDays?: string[] // Array of reserve duty dates
}

export interface DailyAttendanceData {
    employees: EmployeeAttendance[]
    statistics: {
        startingToday: number
        endingToday: number
        totalRequired: number
        totalAttended: number
    }
}

/**
 * Hook to get employee attendance data for a specific date using quota API
 * Gets employees scheduled from Reserve Days Management forms
 */
export const useEmployeeAttendanceQuery = (selectedDate: string) => {
    return useQuery<DailyAttendanceData>({
        queryKey: ['employeeAttendance', selectedDate],
        queryFn: async () => {
            if (!selectedDate) {
                return { employees: [], statistics: { startingToday: 0, endingToday: 0, totalRequired: 0, totalAttended: 0 } }
            }

            const response = await axios({
                method: 'GET',
                baseURL: BASE_URL,
                url: `quotas/employees/${selectedDate}`,
            })

            const apiData = response.data.data
            return {
                employees: apiData.employees || [],
                statistics: apiData.statistics || { startingToday: 0, endingToday: 0, totalRequired: 0, totalAttended: 0 }
            } as DailyAttendanceData
        },
        enabled: !!selectedDate,
        staleTime: 1000 * 60 * 2, // 2 minutes
    })
}

/**
 * Hook to get attendance summary for date range (for calendar indicators)
 */
export const useAttendanceSummaryQuery = (startDate: string, endDate: string) => {
    return useQuery<Record<string, {
        totalRequired: number
        totalAttended: number
        attendanceRate: number
        hasData: boolean
    }>>({
        queryKey: ['attendanceSummary', startDate, endDate],
        queryFn: async () => {
            if (!startDate || !endDate) {
                return {}
            }

            const response = await axios({
                method: 'GET',
                baseURL: BASE_URL,
                url: `quotas/attendance/range/${startDate}/${endDate}`,
            })

            return response.data.data
        },
        enabled: !!(startDate && endDate),
        staleTime: 1000 * 60 * 5, // 5 minutes
    })
}

/**
 * Hook to get employee work schedule/date ranges
 */
export const useEmployeeWorkRangeQuery = (employeeId: string) => {
    return useQuery<{
        startDate?: string
        endDate?: string
        workDays: string[]
        reserveDays: string[]
    }>({
        queryKey: ['employeeWorkRange', employeeId],
        queryFn: async () => {
            // This would typically query a scheduling or reserve management API
            // For now, we'll return mock data structure
            return {
                startDate: '2024-01-15',
                endDate: '2024-01-28',
                workDays: ['2024-01-15', '2024-01-16', '2024-01-17'],
                reserveDays: ['2024-01-20', '2024-01-21', '2024-01-22']
            }
        },
        enabled: !!employeeId,
        staleTime: 1000 * 60 * 10, // 10 minutes - schedules don't change often
    })
}