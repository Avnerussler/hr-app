/** FormSubmissions' TS interface omits the timestamps mongoose adds at runtime via { timestamps: true }. */
export interface LeanFormSubmission {
    _id: unknown
    formId: unknown
    formName: string
    formData: Record<string, unknown>
    isDeleted: boolean
    createdAt: Date
    updatedAt: Date
}

export interface MigrationReport {
    entity: string
    sourceCount: number
    insertedCount: number
    droppedOrphanRefs: { sourceId: string; field: string; danglingId: string }[]
    excludedRows: { sourceId: string; reason: string }[]
    backfilledFieldCounts: Record<string, number>
}

export function createReport(entity: string): MigrationReport {
    return {
        entity,
        sourceCount: 0,
        insertedCount: 0,
        droppedOrphanRefs: [],
        excludedRows: [],
        backfilledFieldCounts: {},
    }
}

export function printReport(report: MigrationReport, dryRun: boolean) {
    /* eslint-disable no-console */
    console.log(`\n=== ${report.entity} ${dryRun ? '(dry run)' : ''} ===`)
    console.log(`Source rows: ${report.sourceCount}`)
    console.log(`${dryRun ? 'Would insert' : 'Inserted'}: ${report.insertedCount}`)
    if (Object.keys(report.backfilledFieldCounts).length > 0) {
        console.log('Backfilled defaults:')
        for (const [field, count] of Object.entries(report.backfilledFieldCounts)) {
            console.log(`  ${field}: ${count} rows`)
        }
    }
    if (report.droppedOrphanRefs.length > 0) {
        console.log(`Dropped orphan refs: ${report.droppedOrphanRefs.length}`)
        for (const o of report.droppedOrphanRefs.slice(0, 20)) {
            console.log(`  source=${o.sourceId} field=${o.field} dangling=${o.danglingId}`)
        }
    }
    if (report.excludedRows.length > 0) {
        console.log(`Excluded rows: ${report.excludedRows.length}`)
        for (const e of report.excludedRows.slice(0, 20)) {
            console.log(`  source=${e.sourceId}: ${e.reason}`)
        }
    }
    /* eslint-enable no-console */
}
