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

        // Skip if value is null or undefined
        if (rawValue == null) {
            return
        }

        // Handle enhancedSelect format: {_id, display, metadata}
        if (
            typeof rawValue === 'object' &&
            !Array.isArray(rawValue) &&
            'display' in rawValue
        ) {
            const foreignValue = rawValue as {
                _id: string
                display: string
                metadata?: Record<string, unknown>
            }
            searchableText = foreignValue.display

            // Also search metadata fields if they exist
            if (foreignValue.metadata) {
                const metadataText = Object.values(foreignValue.metadata)
                    .filter((v) => v != null && typeof v !== 'object')
                    .map((v) => String(v))
                    .join(' ')
                if (metadataText) {
                    searchableText += ' ' + metadataText
                }
            }
        }
        // Handle arrays - check for enhanced format first
        else if (Array.isArray(rawValue)) {
            if (rawValue.length === 0) {
                return
            }

            // Check if it's enhancedMultipleSelect format (array of {_id, display})
            if (
                typeof rawValue[0] === 'object' &&
                rawValue[0] != null &&
                'display' in rawValue[0]
            ) {
                const foreignValues = rawValue as Array<{
                    _id: string
                    display: string
                    metadata?: Record<string, unknown>
                }>
                const displays = foreignValues.map((v) => v.display)
                searchableText = displays.join(' ')
            }
            // Handle standard multipleSelect with string values and options
            else if (options.length > 0 && typeof rawValue[0] === 'string') {
                const matchingLabels = rawValue
                    .map(
                        (val: string) =>
                            options.find((option) => option.value === val)
                                ?.label
                    )
                    .filter(Boolean)
                searchableText = matchingLabels.join(' ')
            }
            // Handle other primitive arrays
            else {
                searchableText = rawValue
                    .filter((v) => v != null)
                    .map((v) => String(v))
                    .join(' ')
            }
        }
        // Handle select fields with options
        else if (options.length > 0 && typeof rawValue === 'string') {
            const matchingOption = options.find((option) =>
                rawValue.includes(option.value)
            )
            searchableText = matchingOption?.label || rawValue
        }
        // Handle primitive values (string, number, boolean)
        else {
            searchableText = String(rawValue)
        }

        if (searchableText) {
            searchableTexts.push(searchableText)
        }
    })

    // Rank each field individually and keep the BEST rank
    // This ensures exact matches in specific fields (like "אברהם לוי" in firstName + lastName) rank highest
    let bestRank = rankItem('', value) // Start with no match
    const rankedFields: Array<{ text: string; rank: number }> = []

    // Rank individual fields
    searchableTexts.forEach((text) => {
        const fieldRank = rankItem(text, value)
        if (fieldRank.passed) {
            rankedFields.push({ text, rank: fieldRank.rankedValue })
            // Keep the best rank
            if (fieldRank.rankedValue > bestRank.rankedValue) {
                bestRank = fieldRank
            }
        }
    })

    // Also rank combinations of adjacent fields (for firstName + lastName matches)
    for (let i = 0; i < searchableTexts.length - 1; i++) {
        const combined = searchableTexts[i] + ' ' + searchableTexts[i + 1]
        const combinedRank = rankItem(combined, value)
        if (
            combinedRank.passed &&
            combinedRank.rankedValue > bestRank.rankedValue
        ) {
            rankedFields.push({
                text: combined,
                rank: combinedRank.rankedValue,
            })
            bestRank = combinedRank
        }
    }

    // Store the best ranking info in meta under 'global' key
    addMeta(bestRank)

    return bestRank.passed
}
