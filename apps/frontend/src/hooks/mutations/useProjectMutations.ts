import { useMutation, useQueryClient } from '@tanstack/react-query'
import axios from 'axios'
import { BASE_URL } from '@/config'
import { toaster } from '@/components/ui/toaster'
import { Project } from '@hr-app/shared-types'

function invalidateCrossEntityQueries(queryClient: ReturnType<typeof useQueryClient>) {
    queryClient.invalidateQueries({
        predicate: (query) =>
            typeof query.queryKey[0] === 'string' && query.queryKey[0].startsWith('statistics'),
    })
    queryClient.invalidateQueries({ queryKey: ['personnel'] })
    queryClient.invalidateQueries({ queryKey: ['quotasWithOccupancyRange'] })
    queryClient.invalidateQueries({ queryKey: ['attendanceSummary'] })
    queryClient.invalidateQueries({ queryKey: ['employeeAttendance'] })
    queryClient.invalidateQueries({ queryKey: ['quotas/attendance/range'] })
    queryClient.invalidateQueries({ queryKey: ['quotas/occupancy/range'] })
}

function mapMutationError(error: unknown, onFieldError?: (field: string, message: string) => void) {
    const err = error as { response?: { status?: number; data?: { message?: string; errors?: { field?: string; message: string }[] } } }
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

export function useCreateProject(onFieldError?: (field: string, message: string) => void) {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: async (body: Partial<Project>) => {
            const { data } = await axios.post(`${BASE_URL}/projects`, body)
            return data
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['projects'] })
            invalidateCrossEntityQueries(queryClient)
            toaster.success({ title: 'Success', description: 'Project created successfully', duration: 5000, closable: true })
        },
        onError: (error) => mapMutationError(error, onFieldError),
    })
}

export function useUpdateProject(onFieldError?: (field: string, message: string) => void) {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: async ({ id, body }: { id: string; body: Partial<Project> }) => {
            const { data } = await axios.patch(`${BASE_URL}/projects/${id}`, body)
            return data
        },
        onSuccess: (_, { id }) => {
            queryClient.invalidateQueries({ queryKey: ['projects'] })
            queryClient.invalidateQueries({ queryKey: ['projects', 'detail', id] })
            invalidateCrossEntityQueries(queryClient)
            toaster.success({ title: 'Success', description: 'Project updated successfully', duration: 3000, closable: true })
        },
        onError: (error) => mapMutationError(error, onFieldError),
    })
}

export function useDeleteProject() {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: async (id: string) => {
            const { data } = await axios.delete(`${BASE_URL}/projects/${id}`)
            return data
        },
        onSuccess: (_, id) => {
            queryClient.invalidateQueries({ queryKey: ['projects'] })
            queryClient.removeQueries({ queryKey: ['projects', 'detail', id] })
            invalidateCrossEntityQueries(queryClient)
            toaster.success({ title: 'Success', description: 'Project deleted successfully', duration: 5000, closable: true })
        },
        onError: (error) => mapMutationError(error),
    })
}
