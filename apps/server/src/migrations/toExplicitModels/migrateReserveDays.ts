import mongoose from 'mongoose'
import { FormSubmissions } from '../../models/FormSubmissions'
import { ReserveDayModel } from '../../models/ReserveDay'
import { applyBackfill } from './backfillDefaults'
import { createReport, MigrationReport, LeanFormSubmission } from './report'
import logger from '../../config/logger'

function extractRefId(value: unknown): string | null {
    if (value === null || value === undefined || value === '') return null
    if (typeof value === 'string') return value
    if (typeof value === 'object' && value !== null && '_id' in value) {
        return String((value as { _id: unknown })._id)
    }
    return null
}

/**
 * `.collection.insertMany()` bypasses Mongoose's schema-based casting entirely
 * (needed to preserve the original `_id`), so every ObjectId-ref field must be
 * cast explicitly here or it gets stored as a plain string.
 */
function toObjectId(id: string | null): mongoose.Types.ObjectId | null {
    if (!id || !mongoose.isValidObjectId(id)) return null
    return new mongoose.Types.ObjectId(id)
}

export async function migrateReserveDays(
    dryRun: boolean,
    migratedPersonnelIds: Set<string>
): Promise<{ report: MigrationReport; docs: Record<string, unknown>[] }> {
    const report = createReport('reserve_days')
    const submissions = (await FormSubmissions.find({
        formName: 'reserve_days_management',
    }).lean()) as unknown as LeanFormSubmission[]
    report.sourceCount = submissions.length

    const docs: Record<string, unknown>[] = []

    for (const sub of submissions) {
        const fd = sub.formData as Record<string, unknown>
        const employeeId = extractRefId(fd.employeeName)

        if (!employeeId || !migratedPersonnelIds.has(employeeId)) {
            report.excludedRows.push({
                sourceId: String(sub._id),
                reason: `dangling required employeeName ref: ${employeeId ?? 'null'}`,
            })
            continue
        }

        // vehicleStatus is never migrated — it was always computed at read time
        // from the linked Personnel doc (vehicleEntry/vehicleNumber), never stored data.
        let mapped: Record<string, unknown> = {
            _id: sub._id,
            employeeName: toObjectId(employeeId),
            startDate: fd.startDate,
            endDate: fd.endDate || undefined,
            fundingSource: fd.fundingSource || null,
            fundingName: fd.fundingName ?? undefined,
            orderType: fd.orderType,
            requestStatus: fd.requestStatus || null,
            baseAccessApproval: fd.baseAccessApproval || null,
            notes: fd.notes ?? undefined,
            attendance: fd.attendance ?? {},
            isDeleted: sub.isDeleted ?? false,
            createdAt: sub.createdAt,
            updatedAt: sub.updatedAt,
        }

        const before = {
            fundingSource: mapped.fundingSource,
            requestStatus: mapped.requestStatus,
            baseAccessApproval: mapped.baseAccessApproval,
        }
        mapped = applyBackfill('reserve_days', mapped)
        for (const field of ['fundingSource', 'requestStatus', 'baseAccessApproval'] as const) {
            if (before[field] !== mapped[field]) {
                report.backfilledFieldCounts[field] = (report.backfilledFieldCounts[field] ?? 0) + 1
            }
        }

        docs.push(mapped)
    }

    report.insertedCount = docs.length

    if (!dryRun && docs.length > 0) {
        await ReserveDayModel.collection.insertMany(docs, { ordered: false })
        logger.info(`Inserted ${docs.length} reserve day documents`)
    }

    return { report, docs }
}

/**
 * Sorts each employee's reserve days by start date and checks for overlaps.
 * The old system enforced noOverlap at write time, so a violation here signals
 * a migration bug (e.g. date parsing), not a pre-existing data problem — it is
 * logged as a warning for manual review, never used to block or mutate the migration.
 */
export function checkNoOverlapInvariant(docs: Record<string, unknown>[]): string[] {
    const warnings: string[] = []
    const byEmployee = new Map<string, { startDate: Date; endDate: Date; id: string }[]>()

    for (const doc of docs) {
        const employeeId = String(doc.employeeName)
        const start = new Date(doc.startDate as string)
        const end = doc.endDate ? new Date(doc.endDate as string) : start
        const list = byEmployee.get(employeeId) ?? []
        list.push({ startDate: start, endDate: end, id: String(doc._id) })
        byEmployee.set(employeeId, list)
    }

    for (const [employeeId, ranges] of byEmployee) {
        ranges.sort((a, b) => a.startDate.getTime() - b.startDate.getTime())
        for (let i = 1; i < ranges.length; i++) {
            if (ranges[i].startDate <= ranges[i - 1].endDate) {
                warnings.push(
                    `Employee ${employeeId}: reserve days ${ranges[i - 1].id} and ${ranges[i].id} overlap post-migration`
                )
            }
        }
    }

    if (warnings.length > 0) {
        warnings.forEach((w) => logger.warn(w))
    }
    return warnings
}
