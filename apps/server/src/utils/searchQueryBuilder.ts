/**
 * Pure utility functions for building MongoDB search query clauses.
 * No Express, DB, or Mongoose dependencies — safe to unit-test in isolation.
 */

/**
 * Builds MongoDB query clauses for searching a date field by a raw search string.
 *
 * Supported patterns:
 * - `YYYY-MM-DD` → exact day range
 * - `D/M/YYYY` or `DD/MM/YYYY` → exact day range (day-first format)
 * - `D/M` or `DD/MM` (with optional trailing `/`) → month-day match across any year via $expr
 * - `M/YYYY` or `MM/YYYY` → month range
 * - `YYYY` → year range
 *
 * @param fieldPath - MongoDB dot-notation path, e.g. `"formData.startDate"`
 * @param search    - Raw search string from the user
 * @returns Array of MongoDB query clause objects (empty if no pattern matched)
 */
export function buildDateSearchClauses(
    fieldPath: string,
    search: string
): Record<string, unknown>[] {
    const s = search.trim()
    const clauses: Record<string, unknown>[] = []

    // YYYY-MM-DD (ISO full date)
    const isoMatch = s.match(/^(\d{4})-(\d{2})-(\d{2})$/)
    if (isoMatch) {
        const dayStart = new Date(`${s}T00:00:00.000Z`)
        const dayEnd = new Date(`${s}T23:59:59.999Z`)
        clauses.push({ [fieldPath]: { $gte: dayStart, $lte: dayEnd } })
    }

    // D/M/YYYY or DD/MM/YYYY (full date, day-first)
    const dmyMatch = s.match(/^(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{4})$/)
    if (dmyMatch) {
        const [, d, m, y] = dmyMatch
        const isoPrefix = `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`
        const dayStart = new Date(`${isoPrefix}T00:00:00.000Z`)
        const dayEnd = new Date(`${isoPrefix}T23:59:59.999Z`)
        clauses.push({ [fieldPath]: { $gte: dayStart, $lte: dayEnd } })
    }

    // D/M or DD/MM (partial — day + month, any year)
    const dmMatch = s.match(/^(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.]?$/)
    if (dmMatch) {
        const [, d, m] = dmMatch
        const mm = m.padStart(2, '0')
        const dd = d.padStart(2, '0')
        // Use $expr + $dateToString to match day+month across any year
        clauses.push({
            $expr: {
                $eq: [
                    { $dateToString: { format: '%m-%d', date: `$${fieldPath}` } },
                    `${mm}-${dd}`,
                ],
            },
        })
    }

    // M/YYYY or MM/YYYY (month + year)
    const myMatch = s.match(/^(\d{1,2})[\/\-\.](\d{4})$/)
    if (myMatch) {
        const [, m, y] = myMatch
        const monthStart = new Date(`${y}-${m.padStart(2, '0')}-01T00:00:00.000Z`)
        const nextMonth = Number(m) === 12 ? 1 : Number(m) + 1
        const nextYear = Number(m) === 12 ? Number(y) + 1 : Number(y)
        const monthEnd = new Date(`${nextYear}-${String(nextMonth).padStart(2, '0')}-01T00:00:00.000Z`)
        clauses.push({ [fieldPath]: { $gte: monthStart, $lt: monthEnd } })
    }

    // YYYY (year only)
    const yearMatch = s.match(/^(\d{4})$/)
    if (yearMatch) {
        const y = yearMatch[1]
        clauses.push({
            [fieldPath]: {
                $gte: new Date(`${y}-01-01T00:00:00.000Z`),
                $lt: new Date(`${Number(y) + 1}-01-01T00:00:00.000Z`),
            },
        })
    }

    return clauses
}

/**
 * Builds MongoDB `$in` query clauses by matching the search string against
 * option labels in a field's choices array.
 *
 * For boolean-string values (`"true"` / `"false"`), both the string and the
 * actual boolean are included in the `$in` array so that either storage format
 * is matched.
 *
 * @param fieldPath - MongoDB dot-notation path, e.g. `"formData.isActive"`
 * @param search    - Raw search string from the user
 * @param choices   - Array of `{ value, label? }` option objects (from `options` or `items`)
 * @returns Array of MongoDB `$in` clause objects (empty if no label matched)
 */
export function buildLabelSearchClauses(
    fieldPath: string,
    search: string,
    choices: { value: unknown; label?: string }[]
): Record<string, unknown>[] {
    if (choices.length === 0) return []

    const searchLower = search.toLowerCase()
    const matchingValues = choices
        .filter((c) => c.label && c.label.toLowerCase().includes(searchLower))
        .flatMap((c) => {
            if (c.value === 'true') return ['true', true]
            if (c.value === 'false') return ['false', false]
            return [c.value]
        })

    if (matchingValues.length === 0) return []

    return [{ [fieldPath]: { $in: matchingValues } }]
}
