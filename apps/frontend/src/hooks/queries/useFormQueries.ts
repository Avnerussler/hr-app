import { useQuery } from '@tanstack/react-query'
import { AllFormSubmission } from '@/types/formType'

export const useFormsQuery = () => {
    return useQuery<AllFormSubmission>({
        queryKey: ['formFields/get/partialData'],
        staleTime: 1000 * 60 * 5, // 5 minutes
    })
}