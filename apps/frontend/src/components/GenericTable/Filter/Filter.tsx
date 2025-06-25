import { memo, useCallback } from 'react'
import { Column } from '@tanstack/react-table'
import { DebouncedInput } from '@/components/DebounceInput'
import { FormFields } from '@/types/fieldsType'

interface FilterProps {
    column: Column<FormFields, unknown>
}

export const Filter = memo(({ column }: FilterProps) => {
    const columnFilterValue = column.getFilterValue() as string

    const handleFilterChange = useCallback(
        (value: string) => {
            column.setFilterValue(value)
        },
        [column]
    )

    return (
        <DebouncedInput
            value={columnFilterValue ?? ''}
            onChange={handleFilterChange}
            placeholder="חפש..."
            debounceTime={400}
            variant="outline"
        />
    )
})
