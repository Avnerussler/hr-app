import mongoose from 'mongoose'
import { FormSubmissions } from '../../models/FormSubmissions'
import { ProjectModel } from '../../models/Project'
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

function extractRefIds(value: unknown): string[] {
    if (!Array.isArray(value)) {
        const single = extractRefId(value)
        return single ? [single] : []
    }
    return value.map(extractRefId).filter((v): v is string => v !== null)
}

export async function migrateProjects(
    dryRun: boolean,
    migratedPersonnelIds: Set<string>
): Promise<{ report: MigrationReport; docs: Record<string, unknown>[] }> {
    const report = createReport('projects')
    const submissions = (await FormSubmissions.find({
        formName: 'project_management',
    }).lean()) as unknown as LeanFormSubmission[]
    report.sourceCount = submissions.length

    const docs: Record<string, unknown>[] = []

    for (const sub of submissions) {
        const fd = sub.formData as Record<string, unknown>

        const projectManagerId = extractRefId(fd.projectManager)
        const validProjectManager = projectManagerId && migratedPersonnelIds.has(projectManagerId) ? projectManagerId : null
        if (projectManagerId && !validProjectManager) {
            report.droppedOrphanRefs.push({
                sourceId: String(sub._id),
                field: 'projectManager',
                danglingId: projectManagerId,
            })
        }

        const personnelIds = extractRefIds(fd.projectPersonnel)
        const validPersonnelIds: string[] = []
        for (const id of personnelIds) {
            if (migratedPersonnelIds.has(id)) {
                validPersonnelIds.push(id)
            } else {
                report.droppedOrphanRefs.push({
                    sourceId: String(sub._id),
                    field: 'projectPersonnel',
                    danglingId: id,
                })
            }
        }

        let mapped: Record<string, unknown> = {
            _id: sub._id,
            projectName: fd.projectName ?? '',
            projectManager: toObjectId(validProjectManager),
            projectPersonnel: validPersonnelIds.map((id) => toObjectId(id)).filter((id): id is mongoose.Types.ObjectId => id !== null),
            projectStatus: fd.projectStatus || null,
            isDeleted: sub.isDeleted ?? false,
            createdAt: sub.createdAt,
            updatedAt: sub.updatedAt,
        }

        const before = mapped.projectStatus
        mapped = applyBackfill('projects', mapped)
        if (before !== mapped.projectStatus) {
            report.backfilledFieldCounts.projectStatus = (report.backfilledFieldCounts.projectStatus ?? 0) + 1
        }

        docs.push(mapped)
    }

    report.insertedCount = docs.length

    if (!dryRun && docs.length > 0) {
        await ProjectModel.collection.insertMany(docs, { ordered: false })
        logger.info(`Inserted ${docs.length} project documents`)
    }

    return { report, docs }
}
