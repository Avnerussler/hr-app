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
export const useCreateFormSubmission = () => {
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

            toaster.success({
                title: 'Success',
                description: 'Form submitted successfully',
                duration: 5000,
            })
        },
        onError(error) {
            console.error('Error creating form submission:', error)

            toaster.error({
                title: 'Error',
                description: 'Failed to submit form. Please try again.',
            })
        },
    })
}

/**
 * Hook for updating existing form submissions
 */
export const useUpdateFormSubmission = () => {
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

            // Show success notification
            toaster.success({
                title: 'Success',
                description: 'Form updated successfully',
                duration: 5000,
            })
        },
        onError(error) {
            console.error('Error updating form submission:', error)

            toaster.error({
                title: 'Error',
                description: 'Failed to update form. Please try again.',
                duration: 5000,
            })
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
