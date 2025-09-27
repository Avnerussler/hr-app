import { useMutation, useQueryClient } from '@tanstack/react-query'
import axios from 'axios'
import { BASE_URL } from '@/config'

interface SaveAttendanceParams {
    date: string
    attendanceChanges: Record<string, boolean>
}

interface UpdateIndividualAttendanceParams {
    employeeId: string
    date: string
    hasAttended: boolean
}

interface ManagerReportParams {
    date: string
}

interface SaveAttendanceResponse {
    message: string
    data: {
        date: string
        results: Array<{
            employeeId: string
            date: string
            hasAttended?: boolean
            status: 'updated' | 'error'
            error?: string
        }>
        totalProcessed: number
        successful: number
        failed: number
    }
}

/**
 * Mutation to save attendance data for a specific date
 */
/**
 * Mutation to update individual employee attendance immediately
 */
export const useUpdateIndividualAttendanceMutation = () => {
    const queryClient = useQueryClient()

    return useMutation<{ message: string; data: any }, Error, UpdateIndividualAttendanceParams>({
        mutationFn: async ({ employeeId, date, hasAttended }) => {
            const response = await axios({
                method: 'PUT',
                baseURL: BASE_URL,
                url: `quotas/attendance/individual`,
                data: { employeeId, date, hasAttended }
            })
            return response.data
        },
        onSuccess: (data, variables) => {
            const { date } = variables
            
            // Invalidate and refetch employee attendance data for this date
            queryClient.invalidateQueries({ 
                queryKey: ['employeeAttendance', date] 
            })
            
            // Also invalidate attendance summary for calendar
            queryClient.invalidateQueries({ 
                queryKey: ['attendanceSummary'] 
            })
            
            console.log('Individual attendance updated successfully:', data)
        },
        onError: (error) => {
            console.error('Error updating individual attendance:', error)
        }
    })
}

/**
 * Mutation to report to manager (one-time action per day)
 */
export const useManagerReportMutation = () => {
    const queryClient = useQueryClient()

    return useMutation<{ message: string; data: any }, Error, ManagerReportParams>({
        mutationFn: async ({ date }) => {
            const response = await axios({
                method: 'POST',
                baseURL: BASE_URL,
                url: `quotas/attendance/manager-report/${date}`,
                data: {}
            })
            return response.data
        },
        onSuccess: (data, variables) => {
            const { date } = variables
            
            // Invalidate manager report status to immediately update button
            queryClient.invalidateQueries({ 
                queryKey: ['managerReportStatus', date] 
            })
            
            // Invalidate and refetch employee attendance data for this date
            queryClient.invalidateQueries({ 
                queryKey: ['employeeAttendance', date] 
            })
            
            // Also invalidate attendance summary for calendar indicators
            queryClient.invalidateQueries({ 
                queryKey: ['attendanceSummary'] 
            })
            
            // Invalidate quota data to update occupancy counts and calendar indicators
            queryClient.invalidateQueries({ 
                queryKey: ['quotasWithOccupancyRange'] 
            })
            
            console.log('Manager report submitted successfully:', data)
        },
        onError: (error) => {
            console.error('Error submitting manager report:', error)
        }
    })
}

export const useSaveAttendanceMutation = () => {
    const queryClient = useQueryClient()

    return useMutation<SaveAttendanceResponse, Error, SaveAttendanceParams>({
        mutationFn: async ({ date, attendanceChanges }) => {
            const response = await axios({
                method: 'POST',
                baseURL: BASE_URL,
                url: `quotas/attendance/${date}`,
                data: { attendanceChanges }
            })
            return response.data
        },
        onSuccess: (data, variables) => {
            const { date } = variables
            
            // Invalidate and refetch employee attendance data for this date
            queryClient.invalidateQueries({ 
                queryKey: ['employeeAttendance', date] 
            })
            
            // Also invalidate attendance summary for calendar
            queryClient.invalidateQueries({ 
                queryKey: ['attendanceSummary'] 
            })
            
            // Invalidate quota data to update occupancy counts
            queryClient.invalidateQueries({ 
                queryKey: ['quotasWithOccupancyRange'] 
            })
            
            console.log('Attendance saved successfully:', data)
        },
        onError: (error) => {
            console.error('Error saving attendance:', error)
        }
    })
}