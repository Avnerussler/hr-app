import { useMutation, useQueryClient } from '@tanstack/react-query'
import axios from 'axios'
import { toaster } from '@/components/ui/toaster'
import {
    CreateQuotaParams,
    UpdateQuotaParams,
    DailyQuota,
} from '@/types/workHoursType'

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api'

const API_ENDPOINTS = {
    CREATE: 'quotas',
    UPDATE: 'quotas',
    DELETE: 'quotas',
    CREATE_RANGE: 'quotas/range',
}

/**
 * Hook to create a single quota
 */
export const useCreateQuota = () => {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: async (params: CreateQuotaParams): Promise<DailyQuota> => {
            const response = await axios({
                method: 'POST',
                baseURL: BASE_URL,
                url: API_ENDPOINTS.CREATE,
                data: params,
            })
            return response.data
        },
        onSuccess: (data) => {
            // Invalidate all quota-related queries
            queryClient.invalidateQueries({ queryKey: ['quotas'] })
            queryClient.invalidateQueries({ queryKey: ['quotaWithOccupancy'] })
            queryClient.invalidateQueries({ queryKey: ['quotasRange'] })
            queryClient.invalidateQueries({
                queryKey: ['quotasWithOccupancyRange'],
            })

            toaster.success({
                title: 'הצלחה',
                description: 'הכמות נוצרה בהצלחה',
                duration: 5000,
            })
        },
        onError: (error: any) => {
            console.error('Error creating quota:', error)
            const errorMessage =
                error?.response?.data?.message || 'שגיאה ביצירת הכמות'
            toaster.error({
                title: 'שגיאה',
                description: errorMessage,
                duration: 5000,
            })
        },
    })
}

/**
 * Hook to create quotas for a date range
 */
export const useCreateQuotaRange = () => {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: async (
            params: CreateQuotaParams
        ): Promise<DailyQuota[]> => {
            const response = await axios({
                method: 'POST',
                baseURL: BASE_URL,
                url: API_ENDPOINTS.CREATE_RANGE,
                data: params,
            })
            return response.data
        },
        onSuccess: (data, variables) => {
            // Invalidate all quota-related queries
            queryClient.invalidateQueries({ queryKey: ['quotas'] })
            queryClient.invalidateQueries({ queryKey: ['quotaWithOccupancy'] })
            queryClient.invalidateQueries({ queryKey: ['quotasRange'] })
            queryClient.invalidateQueries({
                queryKey: ['quotasWithOccupancyRange'],
            })

            const dateCount = variables.endDate
                ? Math.ceil(
                      (new Date(variables.endDate).getTime() -
                          new Date(variables.startDate).getTime()) /
                          (1000 * 60 * 60 * 24)
                  ) + 1
                : 1

            toaster.success({
                title: 'הצלחה',
                description: `${dateCount} כמויות נוצרו בהצלחה`,

                duration: 5000,
            })
        },
        onError: (error: any) => {
            console.error('Error creating quota range:', error)
            const errorMessage =
                error?.response?.data?.message || 'שגיאה ביצירת טווח הכמויות'
            toaster.error({
                title: 'שגיאה',
                description: errorMessage,

                duration: 5000,
            })
        },
    })
}

/**
 * Hook to update an existing quota
 */
export const useUpdateQuota = () => {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: async (params: UpdateQuotaParams): Promise<DailyQuota> => {
            const { id, ...updateData } = params
            const response = await axios({
                method: 'PUT',
                baseURL: BASE_URL,
                url: `${API_ENDPOINTS.UPDATE}/${id}`,
                data: updateData,
            })
            return response.data
        },
        onSuccess: (data) => {
            // Invalidate all quota-related queries
            queryClient.invalidateQueries({ queryKey: ['quotas'] })
            queryClient.invalidateQueries({ queryKey: ['quota', data._id] })
            queryClient.invalidateQueries({ queryKey: ['quotaWithOccupancy'] })
            queryClient.invalidateQueries({ queryKey: ['quotasRange'] })
            queryClient.invalidateQueries({
                queryKey: ['quotasWithOccupancyRange'],
            })

            toaster.success({
                title: 'הצלחה',
                description: 'הכמות עודכנה בהצלחה',
                duration: 5000,
            })
        },
        onError: (error: any) => {
            console.error('Error updating quota:', error)
            const errorMessage =
                error?.response?.data?.message || 'שגיאה בעדכון הכמות'
            toaster.error({
                title: 'שגיאה',
                description: errorMessage,
                duration: 5000,
            })
        },
    })
}

/**
 * Hook to delete a quota
 */
export const useDeleteQuota = () => {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: async (id: string): Promise<{ message: string }> => {
            const response = await axios({
                method: 'DELETE',
                baseURL: BASE_URL,
                url: `${API_ENDPOINTS.DELETE}/${id}`,
            })
            return response.data
        },
        onSuccess: () => {
            // Invalidate all quota-related queries
            queryClient.invalidateQueries({ queryKey: ['quotas'] })
            queryClient.invalidateQueries({ queryKey: ['quotaWithOccupancy'] })
            queryClient.invalidateQueries({ queryKey: ['quotasRange'] })
            queryClient.invalidateQueries({
                queryKey: ['quotasWithOccupancyRange'],
            })

            toaster.success({
                title: 'הצלחה',
                description: 'הכמות נמחקה בהצלחה',

                duration: 5000,
            })
        },
        onError: (error: any) => {
            console.error('Error deleting quota:', error)
            const errorMessage =
                error?.response?.data?.message || 'שגיאה במחיקת הכמות'
            toaster.error({
                title: 'שגיאה',
                description: errorMessage,

                duration: 5000,
            })
        },
    })
}

/**
 * Hook to bulk delete quotas by date range
 */
export const useDeleteQuotaRange = () => {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: async (params: {
            startDate: string
            endDate?: string
        }): Promise<{ message: string; deletedCount: number }> => {
            const response = await axios({
                method: 'DELETE',
                baseURL: BASE_URL,
                url: `${API_ENDPOINTS.DELETE}/range`,
                data: params,
            })
            return response.data
        },
        onSuccess: (data) => {
            // Invalidate all quota-related queries
            queryClient.invalidateQueries({ queryKey: ['quotas'] })
            queryClient.invalidateQueries({ queryKey: ['quotaWithOccupancy'] })
            queryClient.invalidateQueries({ queryKey: ['quotasRange'] })
            queryClient.invalidateQueries({
                queryKey: ['quotasWithOccupancyRange'],
            })

            toaster.success({
                title: 'הצלחה',
                description: `${data.deletedCount} כמויות נמחקו בהצלחה`,

                duration: 5000,
            })
        },
        onError: (error: any) => {
            console.error('Error deleting quota range:', error)
            const errorMessage =
                error?.response?.data?.message || 'שגיאה במחיקת טווח הכמויות'
            toaster.error({
                title: 'שגיאה',
                description: errorMessage,

                duration: 5000,
            })
        },
    })
}
