import { useState, useEffect, useCallback, useMemo } from 'react'
import { useFieldOptionsQuery, useSelectedOptionsQuery } from './queries/useFormQueries'
import useDebounce from './useDebounce'

interface UseEnhancedSelectOptionsParams {
    formId: string
    fieldName: string
    initialOptions: any[]
    selectedValues: string[]
    isOpen: boolean
}

export const useEnhancedSelectOptions = ({
    formId,
    fieldName,
    initialOptions,
    selectedValues,
    isOpen,
}: UseEnhancedSelectOptionsParams) => {
    const [searchTerm, setSearchTerm] = useState('')
    const [page, setPage] = useState(1)
    const [allOptions, setAllOptions] = useState<any[]>(initialOptions)

    // Debounce search term using custom hook (300ms delay)
    const debouncedSearch = useDebounce(searchTerm, 300)

    // Reset page and clear options when debounced search changes
    useEffect(() => {
        setPage(1)
        setAllOptions([])
    }, [debouncedSearch])

    // Fetch paginated options
    const {
        data: paginatedData,
        isLoading,
        isFetching,
    } = useFieldOptionsQuery({
        formId,
        fieldName,
        page,
        limit: 100,
        search: debouncedSearch,
        isOpen,
    })

    // Fetch full details of selected options
    const { data: selectedOptionsData } = useSelectedOptionsQuery({
        formId,
        fieldName,
        ids: selectedValues,
        enabled: selectedValues.length > 0,
    })

    // Update options when search results come in
    useEffect(() => {
        if (paginatedData) {
            if (page === 1) {
                setAllOptions(paginatedData.options)
            } else {
                // Append for pagination
                setAllOptions((prev) => [...prev, ...paginatedData.options])
            }
        }
    }, [paginatedData, page])

    // Merge display options with selected options
    const displayOptions = useMemo(() => {
        const baseOptions = isOpen && allOptions?.length > 0 ? allOptions : initialOptions

        // Always include selected options that aren't in the current display
        if (selectedOptionsData?.options) {
            const selectedNotInDisplay = selectedOptionsData.options.filter(
                (selected) => !baseOptions.some((opt: any) => opt.value === selected.value)
            )
            return [...selectedNotInDisplay, ...baseOptions]
        }

        return baseOptions
    }, [isOpen, allOptions, initialOptions, selectedOptionsData])

    // Get selected options with full details
    const selectedOptions = useMemo(() => {
        return selectedValues
            .map((value: string) => {
                // First try to find in initialOptions
                const fromInitial = initialOptions?.find((opt: any) => opt.value === value)
                if (fromInitial) return fromInitial

                // Otherwise use fetched data
                return selectedOptionsData?.options?.find((opt: any) => opt.value === value)
            })
            .filter(Boolean) // Remove undefined/null values
    }, [selectedValues, initialOptions, selectedOptionsData])

    const handleLoadMore = useCallback(() => {
        if (paginatedData?.pagination.hasMore) {
            setPage((p) => p + 1)
        }
    }, [paginatedData])

    return {
        searchTerm,
        setSearchTerm,
        displayOptions,
        selectedOptions,
        isLoading,
        isFetching,
        paginatedData,
        handleLoadMore,
    }
}
