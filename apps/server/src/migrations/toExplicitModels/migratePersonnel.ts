import mongoose from 'mongoose'
import { FormSubmissions } from '../../models/FormSubmissions'
import { PersonnelModel } from '../../models/Personnel'
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

export async function migratePersonnel(dryRun: boolean): Promise<{ report: MigrationReport; docs: Record<string, unknown>[] }> {
    const report = createReport('personnel')
    const submissions = (await FormSubmissions.find({
        formName: 'personnel',
    }).lean()) as unknown as LeanFormSubmission[]
    report.sourceCount = submissions.length

    const docs = submissions.map((sub) => {
        const fd = sub.formData as Record<string, unknown>

        let mapped: Record<string, unknown> = {
            _id: sub._id,
            firstName: fd.firstName ?? '',
            lastName: fd.lastName ?? '',
            userId: fd.userId ?? undefined,
            personalNumber: String(fd.personalNumber ?? ''),
            phone: fd.phone ?? undefined,
            email: fd.email ?? undefined,
            city: fd.city ?? undefined,
            linkedin: fd.linkedin ?? undefined,
            vehicleNumber: fd.vehicleNumber ?? undefined,
            note: fd.note ?? undefined,
            isActive: fd.isActive ?? null,

            recruitmentYear: fd.RecruitmentYear || undefined,
            dismissYear: fd.DismissYear || undefined,
            reserveUnit: fd.reserveUnit ?? undefined,
            studioRole: fd.studioRole || undefined,
            reserveRole: fd.reserveRole ?? undefined,
            directBoss: fd.directBoss ?? undefined,
            rank: fd.rank ?? undefined,
            classificationClass: fd.classificationClass || undefined,
            canBeRecited: fd.canBeRecited ?? undefined,
            reserveCategory: fd.reserveCategory || undefined,
            assignedProjects: toObjectId(extractRefId(fd.assignedProjects)),
            vehicleEntry: fd.vehicleEntry ?? null,

            degree: fd.degree ?? undefined,
            university: fd.University ?? undefined,
            studyArea: fd.studyArea ?? undefined,
            yearOfGradation: fd.yearOfGradation || undefined,
            workExperience: fd.workExperience ?? undefined,
            talentAndSkills: fd.talentAndSkills ?? undefined,
            referralSource: fd.referralSource ?? undefined,
            fieldOfExpertise: fd.FieldOfExpertise || undefined,
            experience: fd.Experience || undefined,
            workPlace: fd.workPlace ?? undefined,
            currentPosition: fd.currentPosition ?? undefined,
            resumeFileUrl: fd.Resume ?? undefined,

            isDeleted: sub.isDeleted ?? false,
            createdAt: sub.createdAt,
            updatedAt: sub.updatedAt,
        }

        const before = { isActive: mapped.isActive, vehicleEntry: mapped.vehicleEntry }
        mapped = applyBackfill('personnel', mapped)
        if (before.isActive !== mapped.isActive) {
            report.backfilledFieldCounts.isActive = (report.backfilledFieldCounts.isActive ?? 0) + 1
        }
        if (before.vehicleEntry !== mapped.vehicleEntry) {
            report.backfilledFieldCounts.vehicleEntry = (report.backfilledFieldCounts.vehicleEntry ?? 0) + 1
        }

        return mapped
    })

    report.insertedCount = docs.length

    if (!dryRun && docs.length > 0) {
        await PersonnelModel.collection.insertMany(docs, { ordered: false })
        logger.info(`Inserted ${docs.length} personnel documents`)
    }

    return { report, docs }
}

/**
 * Second pass: fix up assignedProjects now that Projects have been migrated with
 * stable _ids. Operates on the in-memory personnel/project doc arrays (not live
 * collection queries) so it produces correct results in both dry-run and real runs.
 */
export async function fixupPersonnelAssignedProjects(
    dryRun: boolean,
    report: MigrationReport,
    personnelDocs: Record<string, unknown>[],
    migratedProjectIds: Set<string>
) {
    for (const p of personnelDocs) {
        const projectId = p.assignedProjects
        if (!projectId) continue
        if (!migratedProjectIds.has(String(projectId))) {
            report.droppedOrphanRefs.push({
                sourceId: String(p._id),
                field: 'assignedProjects',
                danglingId: String(projectId),
            })
            p.assignedProjects = null
            if (!dryRun) {
                await PersonnelModel.updateOne({ _id: p._id }, { $set: { assignedProjects: null } })
            }
        }
    }
}
