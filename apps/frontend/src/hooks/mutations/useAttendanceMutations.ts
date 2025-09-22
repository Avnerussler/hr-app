import { useMutation, useQueryClient } from '@tanstack/react-query'
import axios from 'axios'
import { BASE_URL } from '@/config'

interface SaveAttendanceParams {
    date: string
    attendanceChanges: Record<string, boolean>
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