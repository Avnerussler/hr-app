import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toaster } from '@/components/ui/toaster'
import axios from 'axios'
import { BASE_URL } from '@/config'
import {
    CreateWorkHourParams,
    UpdateWorkHourParams,
    BulkCreateWorkHourParams,
    WeeklyWorkHourParams,
    BulkUpdateWorkHourParams,
    SubmitWorkHoursParams,
    ApproveWorkHoursParams,
} from '@/types/workHoursType'

const API_ENDPOINTS = {
    CREATE: 'workHours',
    BULK_CREATE: 'workHours/bulk',
    WEEKLY_CREATE: 'workHours/week',
    UPDATE: 'workHours',
    BULK_UPDATE: 'workHours/bulk',
    UPDATE_BY_EMPLOYEE_DATE: 'workHours/employee',
    SUBMIT: 'workHours/submit',
    APPROVE: 'workHours/approve',
    DELETE: 'workHours',
    BULK_DELETE: 'workHours/bulk',
    DELETE_BY_EMPLOYEE_DATE: 'workHours/employee',
}

/**
 * Hook for creating a single work hour entry
 */
export const useCreateWorkHour = () => {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: async (params: CreateWorkHourParams) => {
            const response = await axios({
                method: 'POST',
                baseURL: BASE_URL,
                url: API_ENDPOINTS.CREATE,
                data: params,
            })
            return response.data
        },
        onSuccess: () => {
            // Invalidate work hours queries to refresh the data
            queryClient.invalidateQueries({ queryKey: ['workHours'] })

            toaster.success({
                title: 'Success',
                description: 'Work hour entry created successfully',
                duration: 5000,
            })
        },
        onError: (error) => {
            console.error('Error creating work hour:', error)
            toaster.error({
                title: 'Error',
                description: 'Failed to create work hour entry. Please try again.',
                duration: 5000,
            })
        },
    })
}

/**
 * Hook for bulk creating work hour entries
 */
export const useBulkCreateWorkHours = () => {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: async (params: BulkCreateWorkHourParams) => {
            const response = await axios({
                method: 'POST',
                baseURL: BASE_URL,
                url: API_ENDPOINTS.BULK_CREATE,
                data: params,
            })
            return response.data
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ['workHours'] })

            toaster.success({
                title: 'Success',
                description: `Successfully processed ${data.result?.total || 0} work hour entries`,
                duration: 5000,
            })
        },
        onError: (error) => {
            console.error('Error bulk creating work hours:', error)
            toaster.error({
                title: 'Error',
                description: 'Failed to create work hour entries. Please try again.',
                duration: 5000,
            })
        },
    })
}

/**
 * Hook for creating weekly work hour entries
 */
export const useCreateWeeklyWorkHours = () => {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: async (params: WeeklyWorkHourParams) => {
            const response = await axios({
                method: 'POST',
                baseURL: BASE_URL,
                url: API_ENDPOINTS.WEEKLY_CREATE,
                data: params,
            })
            return response.data
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ['workHours'] })

            toaster.success({
                title: 'Success',
                description: `Successfully processed weekly entries: ${data.result?.total || 0} entries`,
                duration: 5000,
            })
        },
        onError: (error) => {
            console.error('Error creating weekly work hours:', error)
            toaster.error({
                title: 'Error',
                description: 'Failed to create weekly work hours. Please try again.',
                duration: 5000,
            })
        },
    })
}

/**
 * Hook for updating a single work hour entry
 */
export const useUpdateWorkHour = () => {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: async ({ id, ...updateData }: UpdateWorkHourParams) => {
            const response = await axios({
                method: 'PUT',
                baseURL: BASE_URL,
                url: `${API_ENDPOINTS.UPDATE}/${id}`,
                data: updateData,
            })
            return response.data
        },
        onSuccess: (data, variables) => {
            // Update the specific work hour in cache
            queryClient.setQueryData(['workHour', variables.id], data)
            
            // Invalidate related queries
            queryClient.invalidateQueries({ queryKey: ['workHours'] })

            toaster.success({
                title: 'Success',
                description: 'Work hour entry updated successfully',
                duration: 5000,
            })
        },
        onError: (error) => {
            console.error('Error updating work hour:', error)
            toaster.error({
                title: 'Error',
                description: 'Failed to update work hour entry. Please try again.',
                duration: 5000,
            })
        },
    })
}

/**
 * Hook for bulk updating work hour entries
 */
export const useBulkUpdateWorkHours = () => {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: async (params: BulkUpdateWorkHourParams) => {
            const response = await axios({
                method: 'PUT',
                baseURL: BASE_URL,
                url: API_ENDPOINTS.BULK_UPDATE,
                data: params,
            })
            return response.data
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ['workHours'] })

            toaster.success({
                title: 'Success',
                description: `Successfully updated ${data.result?.modified || 0} work hour entries`,
                duration: 5000,
            })
        },
        onError: (error) => {
            console.error('Error bulk updating work hours:', error)
            toaster.error({
                title: 'Error',
                description: 'Failed to update work hour entries. Please try again.',
                duration: 5000,
            })
        },
    })
}

/**
 * Hook for updating work hour by employee and date
 */
export const useUpdateWorkHourByEmployeeDate = () => {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: async ({
            employeeId,
            date,
            ...updateData
        }: {
            employeeId: string
            date: string
            hours?: number
            projectId?: string
            projectName?: string
            notes?: string
            employeeName?: string
        }) => {
            const response = await axios({
                method: 'PUT',
                baseURL: BASE_URL,
                url: `${API_ENDPOINTS.UPDATE_BY_EMPLOYEE_DATE}/${employeeId}/date/${date}`,
                data: updateData,
            })
            return response.data
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['workHours'] })
        },
        onError: (error) => {
            console.error('Error updating work hour by employee date:', error)
            toaster.error({
                title: 'Error',
                description: 'Failed to update work hour. Please try again.',
                duration: 3000,
            })
        },
    })
}

/**
 * Hook for submitting work hours for approval
 */
export const useSubmitWorkHours = () => {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: async (params: SubmitWorkHoursParams) => {
            const response = await axios({
                method: 'PUT',
                baseURL: BASE_URL,
                url: API_ENDPOINTS.SUBMIT,
                data: params,
            })
            return response.data
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ['workHours'] })

            toaster.success({
                title: 'Success',
                description: `Successfully submitted ${data.result?.modified || 0} work hour entries`,
                duration: 5000,
            })
        },
        onError: (error) => {
            console.error('Error submitting work hours:', error)
            toaster.error({
                title: 'Error',
                description: 'Failed to submit work hours. Please try again.',
                duration: 5000,
            })
        },
    })
}

/**
 * Hook for approving work hours
 */
export const useApproveWorkHours = () => {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: async (params: ApproveWorkHoursParams) => {
            const response = await axios({
                method: 'PUT',
                baseURL: BASE_URL,
                url: API_ENDPOINTS.APPROVE,
                data: params,
            })
            return response.data
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ['workHours'] })

            toaster.success({
                title: 'Success',
                description: `Successfully approved ${data.result?.modified || 0} work hour entries`,
                duration: 5000,
            })
        },
        onError: (error) => {
            console.error('Error approving work hours:', error)
            toaster.error({
                title: 'Error',
                description: 'Failed to approve work hours. Please try again.',
                duration: 5000,
            })
        },
    })
}

/**
 * Hook for deleting a single work hour entry
 */
export const useDeleteWorkHour = () => {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: async (id: string) => {
            const response = await axios({
                method: 'DELETE',
                baseURL: BASE_URL,
                url: `${API_ENDPOINTS.DELETE}/${id}`,
            })
            return response.data
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['workHours'] })

            toaster.success({
                title: 'Success',
                description: 'Work hour entry deleted successfully',
                duration: 5000,
            })
        },
        onError: (error) => {
            console.error('Error deleting work hour:', error)
            toaster.error({
                title: 'Error',
                description: 'Failed to delete work hour entry. Please try again.',
                duration: 5000,
            })
        },
    })
}

/**
 * Hook for bulk deleting work hour entries
 */
export const useBulkDeleteWorkHours = () => {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: async (workHourIds: string[]) => {
            const response = await axios({
                method: 'DELETE',
                baseURL: BASE_URL,
                url: API_ENDPOINTS.BULK_DELETE,
                data: { workHourIds },
            })
            return response.data
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ['workHours'] })

            toaster.success({
                title: 'Success',
                description: `Successfully deleted ${data.result?.deleted || 0} work hour entries`,
                duration: 5000,
            })
        },
        onError: (error) => {
            console.error('Error bulk deleting work hours:', error)
            toaster.error({
                title: 'Error',
                description: 'Failed to delete work hour entries. Please try again.',
                duration: 5000,
            })
        },
    })
}

/**
 * Hook for retrieving all work hours mutation hooks
 */
export const useWorkHoursMutations = () => {
    return {
        create: useCreateWorkHour(),
        bulkCreate: useBulkCreateWorkHours(),
        createWeekly: useCreateWeeklyWorkHours(),
        update: useUpdateWorkHour(),
        bulkUpdate: useBulkUpdateWorkHours(),
        updateByEmployeeDate: useUpdateWorkHourByEmployeeDate(),
        submit: useSubmitWorkHours(),
        approve: useApproveWorkHours(),
        delete: useDeleteWorkHour(),
        bulkDelete: useBulkDeleteWorkHours(),
    }
}