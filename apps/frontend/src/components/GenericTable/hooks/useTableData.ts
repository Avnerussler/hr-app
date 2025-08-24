import { useQuery } from '@tanstack/react-query'
import { useMemo } from 'react'
import { AllFormSubmission } from '@/types/formType'
import { IForm } from '@/types/fieldsType'

interface UseTableDataProps {
    id: string
}

export const useTableData = ({ id }: UseTableDataProps) => {
    const { data: formFields, isSuccess } = useQuery<IForm>({
        queryKey: ['formFields/get', id],
        staleTime: 1000 * 60 * 5,
    })

    const { data: submittedData } = useQuery<AllFormSubmission>({
        queryKey: ['formSubmission', id],
    })

    const data = useMemo(
        () =>
            isSuccess && submittedData?.forms?.length
                ? submittedData.forms.flatMap((form) => form.formData)
                : [],
        [isSuccess, submittedData]
    )

    return {
        formFields,
        submittedData,
        data,
        isSuccess,
    }
}
