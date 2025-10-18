import { useMemo } from 'react'
import { TableFilter, FilterOption } from '@/types/fieldsType'
import { useFormSubmissionsQuery } from '@/hooks/queries/useFormQueries'

// Type for individual form submission from API
interface FormSubmissionItem {
    _id: string
    formName: string
    formData: Record<string, unknown>
}

export const useDynamicFilters = (filters?: TableFilter[]) => {
    // Find all unique foreign form names that need to be fetched
    const foreignFormNames = useMemo(() => {
        if (!filters) return []
        const uniqueFormNames = new Set<string>()
        filters.forEach((filter) => {
            if (filter.foreignFormName) {
                uniqueFormNames.add(filter.foreignFormName)
            }
        })
        return Array.from(uniqueFormNames)
    }, [filters])

    // Dynamically fetch data for each unique foreign form
    // Using a map to store queries by form name
    const foreignFormsData = useMemo(() => {
        const dataMap: Record<string, { forms: FormSubmissionItem[] }> = {}
        return dataMap
    }, [])

    // Fetch data for each foreign form (currently only supporting one at a time due to hooks rules)
    // If we need multiple forms, we'd need to use a different pattern
    const firstForeignFormName = foreignFormNames[0]

    const { data: foreignFormData } = useFormSubmissionsQuery({
        params: firstForeignFormName ? { formName: firstForeignFormName, limit: 1000 } : undefined,
        enabled: !!firstForeignFormName,
    })

    // Store the fetched data in our map
    if (firstForeignFormName && foreignFormData) {
        foreignFormsData[firstForeignFormName] = foreignFormData as unknown as { forms: FormSubmissionItem[] }
    }

    // Enrich filters with dynamic options
    const enrichedFilters = useMemo(() => {
        if (!filters || filters.length === 0) return []

        return filters.map((filter) => {
            // If filter has foreignFormName and foreignField, enrich with dynamic options
            if (filter.foreignFormName && filter.foreignField) {
                const foreignField = filter.foreignField
                const foreignData = foreignFormsData[filter.foreignFormName]
                const formSubmissions: FormSubmissionItem[] = []

                // Get the data for this specific foreign form
                if (foreignData?.forms) {
                    // Cast the forms array to the correct type
                    // The API returns individual submissions, not grouped forms
                    formSubmissions.push(...(foreignData.forms as unknown as FormSubmissionItem[]))
                }

                // Extract unique options from the foreign form submissions
                const optionsMap = new Map<string, FilterOption>()

                // Always add "all" option for select filters
                if (filter.type === 'select') {
                    optionsMap.set('all', { value: 'all', label: 'הכל' })
                }

                formSubmissions.forEach((submission) => {
                    const submissionId = submission._id
                    const fieldValue = submission.formData[foreignField]

                    if (fieldValue && submissionId && !optionsMap.has(submissionId)) {
                        optionsMap.set(submissionId, {
                            value: submissionId,
                            label: String(fieldValue),
                        })
                    }
                })

                return {
                    ...filter,
                    options: Array.from(optionsMap.values()),
                }
            }
            return filter
        })
    }, [filters, foreignFormsData])

    return { filters: enrichedFilters }
}
