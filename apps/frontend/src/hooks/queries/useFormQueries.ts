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

export interface PaginatedOptionsResponse {
    options: Array<{
        value: string
        label: string
        name: string
        metadata?: Record<string, any>
    }>
    pagination: {
        page: number
        limit: number
        total: number
        totalPages: number
        hasMore: boolean
    }
}

export interface FieldOptionsParams {
    formId: string
    fieldName: string
    page: number
    limit: number
    search: string
    isOpen: boolean
}

export const useFieldOptionsQuery = ({
    formId,
    fieldName,
    page,
    limit,
    search,
    isOpen,
}: FieldOptionsParams) => {
    return useQuery<PaginatedOptionsResponse>({
        queryKey: ['fieldOptions', formId, fieldName, search, page],
        queryFn: async () => {
            const response = await axios.get(
                `${BASE_URL}/formFields/get/options/${formId}/${fieldName}`,
                {
                    params: {
                        page,
                        limit,
                        search,
                    },
                }
            )
            return response.data
        },
        enabled: isOpen,
        staleTime: 1000 * 60 * 5, // Cache for 5 minutes
    })
}

interface SelectedOptionsParams {
    formId: string
    fieldName: string
    ids: string[]
    enabled: boolean
}

export const useSelectedOptionsQuery = ({
    formId,
    fieldName,
    ids,
    enabled,
}: SelectedOptionsParams) => {
    return useQuery<{ options: any[] }>({
        queryKey: ['selectedOptions', formId, fieldName, ids],
        queryFn: async () => {
            const response = await axios.post(
                `${BASE_URL}/formFields/get/options/${formId}/${fieldName}/byIds`,
                { ids }
            )
            return response.data
        },
        enabled: enabled && ids.length > 0,
        staleTime: 1000 * 60 * 10, // Cache for 10 minutes
    })
}
