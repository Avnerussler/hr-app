import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toaster } from '@/components/ui/toaster'
import { FieldValues } from 'react-hook-form'
import { AllFormSubmission } from '@/types/formType'
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
        onSuccess(data, { formId }) {
            queryClient.setQueryData(
                ['formSubmission', formId],
                (oldData: AllFormSubmission | undefined) => {
                    return oldData
                        ? { forms: [...oldData.forms, data.form] }
                        : { forms: [data.form] }
                }
            )

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

            toaster.success({
                title: 'Success',
                description: 'Form submitted successfully',
                duration: 5000,
            })
        },
        onError(error: any) {
            console.error('Error creating form submission:', error)

            // Handle validation errors specifically
            if (
                error.response?.status === 400 &&
                error.response?.data?.errors
            ) {
                const validationErrors = error.response.data.errors

                // Handle field-specific errors if callback provided
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

                // Show toast notifications for all errors
                validationErrors.forEach((validationError: any) => {
                    toaster.error({
                        title: 'שגיאת ולידציה',
                        description: validationError.message,
                        duration: 8000,
                    })
                })
            } else {
                // Generic error handling
                toaster.error({
                    title: 'שגיאה',
                    description: 'שליחת הטופס נכשלה. אנא נסה שוב.',
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
            // Update the cache with the updated form submission
            queryClient.setQueryData(
                ['formSubmission', formId],
                (oldData: AllFormSubmission | undefined) => {
                    if (!oldData) return { forms: [data.form] }

                    const updatedData = oldData.forms.map((form) => {
                        if (form._id === id) {
                            return data.form
                        }
                        return form
                    })

                    return { forms: updatedData }
                }
            )

            // Also update the detailed view if it exists
            queryClient.setQueryData(['formSubmission/detail', id], data.form)

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

            // Show success notification
            toaster.success({
                title: 'Success',
                description: 'Form updated successfully',
                duration: 5000,
            })
        },
        onError(error: any) {
            console.error('Error updating form submission:', error)

            // Handle validation errors specifically
            if (
                error.response?.status === 400 &&
                error.response?.data?.errors
            ) {
                const validationErrors = error.response.data.errors

                // Handle field-specific errors if callback provided
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

                // Show toast notifications for all errors
                validationErrors.forEach((validationError: any) => {
                    toaster.error({
                        title: 'שגיאת ולידציה',
                        description: validationError.message,
                        duration: 8000,
                    })
                })
            } else {
                // Generic error handling
                toaster.error({
                    title: 'שגיאה',
                    description: 'עדכון הטופס נכשל. אנא נסה שוב.',
                    duration: 5000,
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
            // Update the cache by removing the deleted form submission
            queryClient.setQueryData(
                ['formSubmission', formId],
                (oldData: AllFormSubmission | undefined) => {
                    if (!oldData) return { forms: [] }

                    const updatedForms = oldData.forms.filter(
                        (form) => form._id !== id
                    )
                    return { forms: updatedForms }
                }
            )

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

            // Show success notification
            toaster.success({
                title: 'Success',
                description: 'Form deleted successfully',
                duration: 5000,
            })
        },
        onError(error) {
            console.error('Error deleting form submission:', error)

            toaster.error({
                title: 'Error',
                description: 'Failed to delete form. Please try again.',
                duration: 5000,
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
