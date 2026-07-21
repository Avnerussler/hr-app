import { FilterFn } from '@tanstack/react-table'
import { rankItem } from '@tanstack/match-sorter-utils'

export const fuzzyFilter: FilterFn<Record<string, unknown>> = (
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
    const rawValue = row.getValue(columnId)

    // Convert the value to searchable text
    let searchableText = ''

    // Handle enhancedSelect/enhancedMultipleSelect format: {_id, display, metadata}
    if (
        typeof rawValue === 'object' &&
        rawValue != null &&
        !Array.isArray(rawValue) &&
        'display' in rawValue
    ) {
        const foreignValue = rawValue as { _id: string; display: string; metadata?: Record<string, any> }
        searchableText = foreignValue.display
    } else if (options.length > 0 && Array.isArray(rawValue)) {
        // Handle multipleSelect with array values
        // Check if it's enhancedMultipleSelect format (array of {_id, display})
        if (rawValue.length > 0 && typeof rawValue[0] === 'object' && rawValue[0] != null && 'display' in rawValue[0]) {
            const foreignValues = rawValue as Array<{ _id: string; display: string; metadata?: Record<string, any> }>
            searchableText = foreignValues.map(v => v.display).join(' ')
        } else {
            // Standard multipleSelect with string values
            const matchingLabels = rawValue
                .map(
                    (val) =>
                        options.find((option) => option.value === val)
                            ?.label
                )
                .filter(Boolean)
            searchableText = matchingLabels.join(' ')
        }
    } else if (options.length > 0 && typeof rawValue === 'string') {
        // Handle select fields - find matching option
        const matchingOption = options.find((option) =>
            rawValue?.includes(option.value)
        )
        searchableText = matchingOption?.label || rawValue || ''
    } else if (Array.isArray(rawValue)) {
        // Handle other array values
        searchableText = rawValue.map((v) => String(v)).join(' ')
    } else if (rawValue != null) {
        // Handle primitive values
        searchableText = String(rawValue)
    }

    // Rank the item based on the searchable text
    const itemRank = rankItem(searchableText, value)

    // Add meta data (for highlighting matched text if you need it)
    addMeta({
        itemRank,
    })

    return itemRank.passed
}