/**
 * Pure utility for building a MongoDB sort spec from request query params.
 * No Express, DB, or Mongoose dependencies — safe to unit-test in isolation.
 */

/**
 * Builds a MongoDB `.sort()` spec from a requested sort field/order.
 *
 * - No `sortField` → defaults to `{ createdAt: -1 }` (newest first).
 * - `sortField === 'createdAt'` → sorts on the top-level `createdAt` field.
 * - Any other `sortField` → sorts on `formData.<sortField>`.
 * - `sortOrder` other than `'asc'`/`'desc'` (or missing) → defaults to `'asc'`.
 *
 * @param sortField - Field name to sort by (form field name, or `'createdAt'`)
 * @param sortOrder - `'asc'` or `'desc'`
 */
export function buildSortSpec(
    sortField?: string,
    sortOrder?: string
): Record<string, 1 | -1> {
    if (!sortField) {
        return { createdAt: -1 }
    }

    const direction: 1 | -1 = sortOrder === 'desc' ? -1 : 1
    const path = sortField === 'createdAt' ? 'createdAt' : `formData.${sortField}`

    return { [path]: direction }
}
