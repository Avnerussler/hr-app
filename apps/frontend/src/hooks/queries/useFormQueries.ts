import { useQuery } from '@tanstack/react-query'
import axios from 'axios'
import { BASE_URL } from '@/config'
import { AllFormSubmission } from '@/types/formType'

export const useFormsQuery = () => {
    return useQuery<AllFormSubmission>({
        queryKey: ['formFields/get/partialData'],
        staleTime: 1000 * 60 * 5, // 5 minutes
    })
}

export interface FormSubmissionQueryParams {
    formName?: string
    formId?: string
    limit?: number
    page?: number
}

export const useFormSubmissionsQuery = (params?: FormSubmissionQueryParams) => {
    return useQuery<AllFormSubmission>({
        queryKey: ['formSubmission', params],
        queryFn: async () => {
            const response = await axios({
                method: 'GET',
                baseURL: BASE_URL,
                url: 'formSubmission',
                params,
            })
            return response.data
        },
        staleTime: 1000 * 60 * 3, // 3 minutes
        enabled: true,
    })
}
