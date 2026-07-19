import { useCallback, useEffect, useMemo, useState } from 'react'
import useDebounce from '@/hooks/useDebounce'
import {
    usePersonnelOptionsQuery,
    usePersonnelOptionsByIdsQuery,
    PersonnelOption,
} from '@/hooks/queries/useProjectQueries'

/** Paginated, searchable, infinite-scroll-ready personnel options, merged with any currently selected options. */
export function usePagedPersonnelOptions(selectedValues: string[]) {
    const [searchTerm, setSearchTerm] = useState('')
    const [page, setPage] = useState(1)
    const [accumulated, setAccumulated] = useState<PersonnelOption[]>([])
    const debouncedSearch = useDebounce(searchTerm, 300)

    useEffect(() => {
        setPage(1)
        setAccumulated([])
    }, [debouncedSearch])

    const { data, isLoading, isFetching } = usePersonnelOptionsQuery(debouncedSearch, page)
    const { data: selectedOptionData = [] } = usePersonnelOptionsByIdsQuery(selectedValues)

    useEffect(() => {
        if (!data) return
        setAccumulated((prev) => (page === 1 ? data.options : [...prev, ...data.options]))
    }, [data, page])

    const searchOptions = accumulated

    const options: PersonnelOption[] = useMemo(() => {
        const merged = [...searchOptions]
        for (const sel of selectedOptionData) {
            if (!merged.some((o) => o.value === sel.value)) merged.unshift(sel)
        }
        return merged
    }, [searchOptions, selectedOptionData])

    const hasMore = data?.pagination.hasMore ?? false

    const handleLoadMore = useCallback(() => {
        if (hasMore) setPage((p) => p + 1)
    }, [hasMore])

    const handleScroll = useCallback(
        (e: React.UIEvent<HTMLDivElement>) => {
            const target = e.currentTarget
            const threshold = target.scrollHeight - 100
            if (target.scrollTop + target.clientHeight >= threshold && hasMore && !isLoading && !isFetching) {
                handleLoadMore()
            }
        },
        [hasMore, isLoading, isFetching, handleLoadMore]
    )

    return {
        searchTerm,
        setSearchTerm,
        searchOptions,
        options,
        isLoading,
        isFetching,
        pagination: data?.pagination,
        handleScroll,
    }
}
