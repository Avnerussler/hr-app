/**
 * Fields whose old FormFields schema declared a real (non-empty) defaultValue,
 * which the generic engine never persisted on create (see CLAUDE.md gotcha).
 * Historical records with a null/undefined value here get backfilled to the
 * documented default. Fields whose old default was just '' (orderType,
 * reserveCategory, classificationClass, ...) are intentionally NOT listed —
 * there's no meaningful value to backfill.
 */
export const BACKFILL_DEFAULTS = {
    personnel: {
        isActive: true,
        vehicleEntry: false,
    },
    projects: {
        projectStatus: 'active',
    },
    reserve_days: {
        fundingSource: 'internal',
        requestStatus: 'pending',
        baseAccessApproval: 'pending',
    },
} as const

export function applyBackfill<T extends Record<string, unknown>>(
    entity: keyof typeof BACKFILL_DEFAULTS,
    doc: T
): T {
    const defaults = BACKFILL_DEFAULTS[entity] as Record<string, unknown>
    const result = { ...doc }
    for (const [field, defaultValue] of Object.entries(defaults)) {
        if (result[field] === null || result[field] === undefined || result[field] === '') {
            ;(result as Record<string, unknown>)[field] = defaultValue
        }
    }
    return result
}
