import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toaster } from '@/components/ui/toaster'
import { FieldValues } from 'react-hook-form'
import axios from 'axios'
import { BASE_URL } from '@/config'

export interface CreateFormSubmissionParams {
    formData: FieldValues
    formId: string
    formName?: string
}

export interface UpdateFormSubmissionParams {
    formData: FieldValues
    id: string
    formId: string
}

export interface DeleteFormSubmissionParams {
    id: string
    formId: string
}

const API_ENDPOINTS = {
    CREATE: 'formSubmission/create',
    UPDATE: 'formSubmission/update',
    DELETE: 'formSubmission/delete',
}

/**
 * Hook for creating new form submissions
 */
export const useCreateFormSubmission = (
    onFieldError?: (fieldName: string, message: string) => void
) => {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: async ({
            formData,
            formId,
            formName,
        }: CreateFormSubmissionParams) => {
            const response = await axios({
                method: 'POST',
                baseURL: BASE_URL,
                url: API_ENDPOINTS.CREATE.toLowerCase(),
                data: { formData, formId, formName },
            })
            return response.data
        },
        onSuccess(_, { formId }) {
            // Invalidate all paginated queries for this form
            queryClient.invalidateQueries({ queryKey: ['formSubmission', formId] })

            // Invalidate quota and attendance queries
            queryClient.invalidateQueries({
                queryKey: ['quotasWithOccupancyRange'],
            })
            queryClient.invalidateQueries({
                queryKey: ['attendanceSummary'],
            })
            queryClient.invalidateQueries({
                queryKey: ['employeeAttendance'],
            })
            queryClient.invalidateQueries({
                queryKey: ['quotas/attendance/range'],
            })
            queryClient.invalidateQueries({
                queryKey: ['quotas/occupancy/range'],
            })

            toaster.success({
                title: 'Success',
                description: 'Form submitted successfully',
                duration: 5000,
                closable: true,
            })
        },
        onError(error: any) {
            console.error('Error creating form submission:', error)

            if (error.response?.status === 409) {
                toaster.error({
                    title: 'צו חופף',
                    description:
                        error.response.data?.message ??
                        'לעובד זה כבר קיים צו חופף בתאריכים אלו',
                    duration: 8000,
                    closable: true,
                })
            } else if (
                error.response?.status === 400 &&
                error.response?.data?.errors
            ) {
                const validationErrors = error.response.data.errors

                if (onFieldError) {
                    validationErrors.forEach((validationError: any) => {
                        if (validationError.field) {
                            onFieldError(
                                validationError.field,
                                validationError.message
                            )
                        }
                    })
                }

                validationErrors.forEach((validationError: any) => {
                    toaster.error({
                        title: 'שגיאת ולידציה',
                        description: validationError.message,
                        duration: 8000,
                        closable: true,
                    })
                })
            } else {
                toaster.error({
                    title: 'שגיאה',
                    description: 'שליחת הטופס נכשלה. אנא נסה שוב.',
                    closable: true,
                })
            }
        },
    })
}

/**
 * Hook for updating existing form submissions
 */
export const useUpdateFormSubmission = (
    onFieldError?: (fieldName: string, message: string) => void
) => {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: async ({ formData, id }: UpdateFormSubmissionParams) => {
            const response = await axios({
                method: 'POST',
                baseURL: BASE_URL,
                url: API_ENDPOINTS.UPDATE.toLowerCase(),
                data: { formData, id },
            })
            return response.data
        },
        onSuccess(data, { formId, id }) {
            // Invalidate all paginated queries for this form
            queryClient.invalidateQueries({ queryKey: ['formSubmission', formId] })

            // Also update the detailed view if it exists
            queryClient.setQueryData(['formSubmission/detail', id], data.form)

            // IMPORTANT: Invalidate ALL form submission queries because bidirectional sync
            // may have updated related forms on the server
            queryClient.invalidateQueries({
                queryKey: ['formSubmission'],
            })

            // Invalidate quota and attendance queries if this is a Reserve Days form
            // Check if formName contains Reserve or מילואים
            queryClient.invalidateQueries({
                queryKey: ['quotasWithOccupancyRange'],
            })
            queryClient.invalidateQueries({
                queryKey: ['attendanceSummary'],
            })
            queryClient.invalidateQueries({
                queryKey: ['employeeAttendance'],
            })
            queryClient.invalidateQueries({
                queryKey: ['quotas/attendance/range'],
            })
            queryClient.invalidateQueries({
                queryKey: ['quotas/occupancy/range'],
            })
            // Show success notification
            toaster.success({
                title: 'Success',
                description: 'Form updated successfully',
                duration: 3000,
                closable: true,
            })
        },
        onError(error: any) {
            console.error('Error updating form submission:', error)

            if (error.response?.status === 409) {
                toaster.error({
                    title: 'צו חופף',
                    description:
                        error.response.data?.message ??
                        'לעובד זה כבר קיימת צו חופף בתאריכים אלו',
                    duration: 3000,
                    closable: true,
                })
            } else if (
                error.response?.status === 400 &&
                error.response?.data?.errors
            ) {
                const validationErrors = error.response.data.errors

                if (onFieldError) {
                    validationErrors.forEach((validationError: any) => {
                        if (validationError.field) {
                            onFieldError(
                                validationError.field,
                                validationError.message
                            )
                        }
                    })
                }

                validationErrors.forEach((validationError: any) => {
                    toaster.error({
                        title: 'שגיאת ולידציה',
                        description: validationError.message,
                        duration: 8000,
                        closable: true,
                    })
                })
            } else {
                toaster.error({
                    title: 'שגיאה',
                    description: 'עדכון הטופס נכשל. אנא נסה שוב.',
                    duration: 5000,
                    closable: true,
                })
            }
        },
    })
}

/**
 * Hook for deleting form submissions
 */
export const useDeleteFormSubmission = () => {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: async ({ id }: DeleteFormSubmissionParams) => {
            const response = await axios({
                method: 'DELETE',
                baseURL: BASE_URL,
                url: `${API_ENDPOINTS.DELETE.toLowerCase()}/${id}`,
            })
            return response.data
        },
        onSuccess(_, { formId, id }) {
            // Invalidate all paginated queries for this form
            queryClient.invalidateQueries({ queryKey: ['formSubmission', formId] })

            // Remove the item from the detail cache if it exists
            queryClient.removeQueries({
                queryKey: ['formSubmission/detail', id],
            })

            // Invalidate related queries
            queryClient.invalidateQueries({ queryKey: ['formSubmission/list'] })

            // Invalidate quota and attendance queries if this was a Reserve Days form
            // Check from the response data
            queryClient.invalidateQueries({
                queryKey: ['quotasWithOccupancyRange'],
            })
            queryClient.invalidateQueries({
                queryKey: ['attendanceSummary'],
            })
            queryClient.invalidateQueries({
                queryKey: ['employeeAttendance'],
            })
            queryClient.invalidateQueries({
                queryKey: ['quotas/attendance/range'],
            })
            queryClient.invalidateQueries({
                queryKey: ['quotas/occupancy/range'],
            })
            // Show success notification
            toaster.success({
                title: 'Success',
                description: 'Form deleted successfully',
                duration: 5000,
                closable: true,
            })
        },
        onError(error) {
            console.error('Error deleting form submission:', error)

            toaster.error({
                title: 'Error',
                description: 'Failed to delete form. Please try again.',
                duration: 5000,
                closable: true,
            })
        },
    })
}

/**
 * Hook for retrieving all mutation hooks related to form submissions
 * This allows you to import all hooks at once if needed
 */
export const useFormSubmissionMutations = () => {
    return {
        create: useCreateFormSubmission(),
        update: useUpdateFormSubmission(),
        delete: useDeleteFormSubmission(),
    }
}
