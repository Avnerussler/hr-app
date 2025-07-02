import { FilterFn } from '@tanstack/react-table'
import { rankItem } from '@tanstack/match-sorter-utils'
import { FormFields } from '@/types/fieldsType'

export const fuzzyFilter: FilterFn<FormFields> = (
    row,
    columnId,
    value,
    addMeta
) => {
    // Find the current column
    const column = row
        .getAllCells()
        .find((cell) => cell.column.id === columnId)

    // Check if the column has `options` in `meta` (for select fields)
    const options =
        ((
            column?.column.columnDef.meta as {
                options?: { value: string; label: string }[]
            }
        )?.options ||
            (
                column?.column.columnDef.meta as {
                    items?: { value: string; label: string }[]
                }
            )?.items) ??
        []

    // Get the raw cell value
    const rawValue = row.getValue(columnId) as string

    // If options exist, map value to label, otherwise use raw value
    const valueToFilter = (options: { value: string; label: string }[]) => {
        if (options.length > 0 && Array.isArray(rawValue)) {
            const matchingLabels = rawValue
                .map(
                    (val) =>
                        options.find((option) => option.value === val)
                            ?.label
                )
                .filter(Boolean)
            return matchingLabels.join(' ')
        } else if (options.length > 0) {
            return options.find((option) =>
                rawValue?.includes(option.value)
            )?.label
        }

        return rawValue
    }
    
    // Rank the item based on the label (or raw value if no options exist)
    const itemRank = rankItem(valueToFilter(options), value)

    // Add meta data (for highlighting matched text if you need it)
    addMeta({
        itemRank,
    })

    return itemRank.passed
}