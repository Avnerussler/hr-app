/**
 * Pure utility for building a MongoDB aggregation expression that maps a
 * select/radio field's raw stored value to its display label, for sorting.
 * No Express, DB, or Mongoose dependencies — safe to unit-test in isolation.
 */

/**
 * Builds a `$switch` expression that maps `fieldPath`'s raw value to its
 * option/item label, so sorting reflects what the user sees (e.g. 'מילואים')
 * rather than the raw stored code (e.g. 'reserves').
 *
 * Falls back to the raw field value when it matches none of the choices,
 * so unmapped/legacy values still sort (at the end, alongside their raw text).
 *
 * @param fieldPath - MongoDB dot-notation path, e.g. `"formData.reserveCategory"`
 * @param choices   - Array of `{ value, label }` option objects (from `options` or `items`)
 * @returns A `$switch` aggregation expression, or `undefined` if there are no choices
 */
export function buildLabelSortKeyExpr(
    fieldPath: string,
    choices: { value: unknown; label?: string }[]
): Record<string, unknown> | undefined {
    if (choices.length === 0) return undefined

    const branches = choices
        .filter((c) => c.label !== undefined)
        .map((c) => ({
            case: { $eq: [`$${fieldPath}`, c.value] },
            then: c.label,
        }))

    if (branches.length === 0) return undefined

    return {
        $switch: {
            branches,
            default: `$${fieldPath}`,
        },
    }
}
