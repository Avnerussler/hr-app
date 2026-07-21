import { PersonnelModel } from '../models/Personnel'
import { ProjectModel } from '../models/Project'
import logger from '../config/logger'

/**
 * Keeps personnel.assignedProjects and project.projectPersonnel consistent
 * when a personnel record's assignedProjects field changes directly.
 * Only clears/adds the affected project's projectPersonnel entry — never
 * touches a project this personnel record isn't (or wasn't) linked to.
 */
export async function syncProjectOnPersonnelUpdate(
    personnelId: string,
    previousProjectId: string | null,
    nextProjectId: string | null
): Promise<void> {
    if (previousProjectId === nextProjectId) return

    if (previousProjectId) {
        await ProjectModel.updateOne(
            { _id: previousProjectId },
            { $pull: { projectPersonnel: personnelId } }
        )
    }
    if (nextProjectId) {
        await ProjectModel.updateOne(
            { _id: nextProjectId },
            { $addToSet: { projectPersonnel: personnelId } }
        )
    }
    logger.info('Synced project.projectPersonnel from personnel update', {
        personnelId,
        previousProjectId,
        nextProjectId,
    })
}

/**
 * Keeps project.projectPersonnel and personnel.assignedProjects consistent
 * when a project's projectPersonnel array changes directly. Only clears a
 * personnel record's assignedProjects if it currently points at *this*
 * project — avoids clobbering a personnel record reassigned elsewhere.
 */
export async function syncPersonnelOnProjectUpdate(
    projectId: string,
    previousPersonnelIds: string[],
    nextPersonnelIds: string[]
): Promise<void> {
    const previousSet = new Set(previousPersonnelIds.map(String))
    const nextSet = new Set(nextPersonnelIds.map(String))

    const removed = [...previousSet].filter((id) => !nextSet.has(id))
    const added = [...nextSet].filter((id) => !previousSet.has(id))

    if (removed.length > 0) {
        await PersonnelModel.updateMany(
            { _id: { $in: removed }, assignedProjects: projectId },
            { $set: { assignedProjects: null } }
        )
    }
    if (added.length > 0) {
        await PersonnelModel.updateMany(
            { _id: { $in: added } },
            { $set: { assignedProjects: projectId } }
        )
    }
    logger.info('Synced personnel.assignedProjects from project update', {
        projectId,
        removed,
        added,
    })
}

/** Removes a project from every personnel record pointing at it (project soft-delete). */
export async function clearProjectFromAllPersonnel(projectId: string): Promise<void> {
    await PersonnelModel.updateMany(
        { assignedProjects: projectId },
        { $set: { assignedProjects: null } }
    )
}

/** Removes a personnel record from every project's roster (personnel soft-delete). */
export async function removePersonnelFromAllProjects(personnelId: string): Promise<void> {
    await ProjectModel.updateMany(
        { projectPersonnel: personnelId },
        { $pull: { projectPersonnel: personnelId } }
    )
    await ProjectModel.updateMany(
        { projectManager: personnelId },
        { $set: { projectManager: null } }
    )
}
