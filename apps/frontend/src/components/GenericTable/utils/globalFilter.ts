import { FilterFn } from '@tanstack/react-table'
import { rankItem } from '@tanstack/match-sorter-utils'
import { FormFields } from '@/types/fieldsType'

export const globalFilter: FilterFn<FormFields> = (
    row,
    _columnId,
    value,
    addMeta
) => {
    // Get all columns for this row
    const allCells = row.getAllCells()

    // Collect all searchable text from all columns
    const searchableTexts: string[] = []

    allCells.forEach((cell) => {
        const column = cell.column
        const columnDef = column.columnDef
        const rawValue = cell.getValue()

        // Check if the column has options in meta (for select fields)
        const options =
            ((
                columnDef.meta as {
                    options?: { value: string; label: string }[]
                }
            )?.options ||
                (
                    columnDef.meta as {
                        items?: { value: string; label: string }[]
                    }
                )?.items) ??
            []

        // Convert value to searchable text
        let searchableText = ''

        if (options.length > 0 && Array.isArray(rawValue)) {
            // Handle multipleSelect with array values
            const matchingLabels = rawValue
                .map(
                    (val: string) =>
                        options.find((option) => option.value === val)?.label
                )
                .filter(Boolean)
            searchableText = matchingLabels.join(' ')
        } else if (options.length > 0 && typeof rawValue === 'string') {
            // Handle select fields
            const matchingOption = options.find((option) =>
                rawValue?.includes(option.value)
            )
            searchableText = matchingOption?.label || rawValue
        } else if (Array.isArray(rawValue)) {
            // Handle other array values
            searchableText = rawValue.map((v) => String(v)).join(' ')
        } else if (rawValue != null) {
            // Handle primitive values
            searchableText = String(rawValue)
        }

        if (searchableText) {
            searchableTexts.push(searchableText)
        }
    })

    // Combine all searchable text
    const combinedText = searchableTexts.join(' ')

    // Rank the combined text against the search value
    const itemRank = rankItem(combinedText, value)

    // Add meta data
    addMeta({
        itemRank,
    })

    return itemRank.passed
}
