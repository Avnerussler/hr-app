import { memo, useCallback, useMemo } from 'react'
import { Column } from '@tanstack/react-table'
import { DebouncedInput } from '@/components/DebounceInput'
import { FormFields } from '@/types/fieldsType'
import { Box } from '@chakra-ui/react'

interface FilterProps {
    column: Column<FormFields, unknown>
}

export const Filter = memo(({ column }: FilterProps) => {
    const columnFilterValue = column.getFilterValue()

    const sortedUniqueValues = useMemo(() => {
        const uniqueValues = column.getFacetedUniqueValues?.()
        if (!uniqueValues) return []

        return Array.from(uniqueValues.keys()).sort().slice(0, 5000)
    }, [column])

    const handleTextFilterChange = useCallback(
        (value: string) => {
            column.setFilterValue(value || undefined)
        },
        [column]
    )

    // Default text filter with autocomplete
    return (
        <Box position="relative">
            <DebouncedInput
                type="text"
                value={(columnFilterValue ?? '') as string}
                onChange={handleTextFilterChange}
                placeholder={`Search... (${column.getFacetedUniqueValues?.()?.size ?? 0})`}
                debounceTime={400}
                variant="outline"
                size="xs"
                list={column.id + 'list'}
            />
            <Box as="datalist" id={column.id + 'list'}>
                {sortedUniqueValues.slice(0, 50).map((value) => (
                    <option value={value} key={value} />
                ))}
            </Box>
        </Box>
    )
})
