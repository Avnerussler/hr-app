import { memo, useMemo } from 'react'
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

        const options = (
            column.columnDef.meta as {
                options?: { value: string; label: string }[]
            }
        )?.options
        const allValues = new Set<string>()

        Array.from(uniqueValues.keys()).forEach((value) => {
            if (Array.isArray(value)) {
                value.forEach((item) => {
                    if (typeof item === 'string') {
                        if (options) {
                            const option = options.find(
                                (opt) => opt.value === item
                            )
                            allValues.add(option?.label || item)
                        } else {
                            allValues.add(item)
                        }
                    }
                })
            } else if (typeof value === 'string') {
                if (options) {
                    const option = options.find((opt) => opt.value === value)
                    allValues.add(option?.label || value)
                } else {
                    allValues.add(value)
                }
            }
        })

        return Array.from(allValues).sort().slice(0, 5000)
    }, [column])

    const handleTextFilterChange = (value: string) => {
        column.setFilterValue(value || undefined)
    }

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
