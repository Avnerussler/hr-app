import { useMutation, useQueryClient } from '@tanstack/react-query'
import axios from 'axios'
import { BASE_URL } from '@/config'
import { toaster } from '@/components/ui/toaster'
import { ReserveDay } from '@hr-app/shared-types'

function invalidateCrossEntityQueries(queryClient: ReturnType<typeof useQueryClient>) {
    queryClient.invalidateQueries({
        predicate: (query) =>
            typeof query.queryKey[0] === 'string' && query.queryKey[0].startsWith('statistics'),
    })
    queryClient.invalidateQueries({ queryKey: ['quotasWithOccupancyRange'] })
    queryClient.invalidateQueries({ queryKey: ['attendanceSummary'] })
    queryClient.invalidateQueries({ queryKey: ['employeeAttendance'] })
    queryClient.invalidateQueries({ queryKey: ['quotas/attendance/range'] })
    queryClient.invalidateQueries({ queryKey: ['quotas/occupancy/range'] })
}

function mapMutationError(error: unknown, onFieldError?: (field: string, message: string) => void) {
    const err = error as { response?: { status?: number; data?: { message?: string; errors?: { field?: string; message: string }[] } } }

    if (err.response?.status === 409) {
        toaster.error({
            title: 'צו חופף',
            description: err.response.data?.message ?? 'לעובד זה כבר קיים צו חופף בתאריכים אלו',
            duration: 8000,
            closable: true,
        })
        return
    }

    if (err.response?.status === 400 && err.response.data?.errors) {
        err.response.data.errors.forEach((validationError) => {
            if (validationError.field && onFieldError) {
                onFieldError(validationError.field, validationError.message)
            }
            toaster.error({ title: 'שגיאת ולידציה', description: validationError.message, duration: 8000, closable: true })
        })
        return
    }

    toaster.error({
        title: 'שגיאה',
        description: err.response?.data?.message ?? 'הפעולה נכשלה. אנא נסה שוב.',
        duration: 5000,
        closable: true,
    })
}

export function useCreateReserveDay(onFieldError?: (field: string, message: string) => void) {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: async (body: Partial<ReserveDay>) => {
            const { data } = await axios.post(`${BASE_URL}/reserve-days`, body)
            return data
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['reserveDays'] })
            invalidateCrossEntityQueries(queryClient)
            toaster.success({ title: 'Success', description: 'Form submitted successfully', duration: 5000, closable: true })
        },
        onError: (error) => mapMutationError(error, onFieldError),
    })
}

export function useUpdateReserveDay(onFieldError?: (field: string, message: string) => void) {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: async ({ id, body }: { id: string; body: Partial<ReserveDay> }) => {
            const { data } = await axios.patch(`${BASE_URL}/reserve-days/${id}`, body)
            return data
        },
        onSuccess: (_, { id }) => {
            queryClient.invalidateQueries({ queryKey: ['reserveDays'] })
            queryClient.invalidateQueries({ queryKey: ['reserveDays', 'detail', id] })
            invalidateCrossEntityQueries(queryClient)
            toaster.success({ title: 'Success', description: 'Form updated successfully', duration: 3000, closable: true })
        },
        onError: (error) => mapMutationError(error, onFieldError),
    })
}

export function useDeleteReserveDay() {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: async (id: string) => {
            const { data } = await axios.delete(`${BASE_URL}/reserve-days/${id}`)
            return data
        },
        onSuccess: (_, id) => {
            queryClient.invalidateQueries({ queryKey: ['reserveDays'] })
            queryClient.removeQueries({ queryKey: ['reserveDays', 'detail', id] })
            invalidateCrossEntityQueries(queryClient)
            toaster.success({ title: 'Success', description: 'נמחק בהצלחה', duration: 5000, closable: true })
        },
        onError: (error) => mapMutationError(error),
    })
}
