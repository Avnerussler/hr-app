import { useQuery } from '@tanstack/react-query'
import { useMemo } from 'react'
import { AllFormSubmission } from '@/types/formType'
import { IForm } from '@/types/fieldsType'

interface UseTableDataProps {
    id: string
    page: number
    pageSize: number
    search: string
    tableFilters: Record<string, string | string[] | boolean>
}

const stripInactiveFilters = (
    filters: Record<string, string | string[] | boolean>
): Record<string, string | string[] | boolean> | undefined => {
    const active: Record<string, string | string[] | boolean> = {}
    for (const [key, value] of Object.entries(filters)) {
        if (value === undefined || value === 'all' || value === '') continue
        if (Array.isArray(value) && value.length === 0) continue
        active[key] = value
    }
    return Object.keys(active).length > 0 ? active : undefined
}

export const useTableData = ({
    id,
    page,
    pageSize,
    search,
    tableFilters,
}: UseTableDataProps) => {
    const { data: formFields, isSuccess } = useQuery<IForm>({
        queryKey: ['formFields/get', id],
        staleTime: 1000 * 60 * 5,
    })

    const overviewFields = formFields?.overviewFields ?? []

    const activeFilters = useMemo(
        () => stripInactiveFilters(tableFilters),
        [tableFilters]
    )

    const queryParams = useMemo(
        () => ({
            formId: id,
            page,
            limit: pageSize,
            search: search || undefined,
            searchFields:
                isSuccess && overviewFields.length > 0
                    ? overviewFields.join(',')
                    : undefined,
            filters: activeFilters ? JSON.stringify(activeFilters) : undefined,
        }),
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [
            id,
            page,
            pageSize,
            search,
            overviewFields.join(','),
            isSuccess,
            activeFilters,
        ]
    )

    // Use 'formSubmission' as the URL with no path param so the default queryFn calls
    // GET /formSubmission?formId=<id>&page=...&limit=... (the paginated route, not /:id)
    const { data: submittedData } = useQuery<AllFormSubmission>({
        queryKey: ['formSubmission', undefined, queryParams],
        enabled: isSuccess,
    })

    const data = useMemo(
        () =>
            isSuccess && submittedData?.forms?.length
                ? submittedData.forms.map((form) => ({
                      ...form.formData,
                      _id: form._id,
                      createdAt:
                          form.createdAt ||
                          (form.formData as unknown as Record<string, unknown>)?.createdAt,
                  }))
                : ([] as Record<string, unknown>[]),
        [isSuccess, submittedData]
    )

    const totalCount = submittedData?.pagination?.total ?? 0
    const totalPages = submittedData?.pagination?.pages ?? null

    return {
        formFields,
        submittedData,
        data,
        isSuccess,
        totalCount,
        totalPages,
    }
}
