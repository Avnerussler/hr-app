import { FormSubmissions } from '../../models/FormSubmissions'
import { PersonnelModel } from '../../models/Personnel'
import { ProjectModel } from '../../models/Project'
import { ReserveDayModel } from '../../models/ReserveDay'
import logger from '../../config/logger'

export async function verifyCounts() {
    const [srcPersonnel, srcProjects, srcReserveDays, newPersonnel, newProjects, newReserveDays] = await Promise.all([
        FormSubmissions.countDocuments({ formName: 'personnel' }),
        FormSubmissions.countDocuments({ formName: 'project_management' }),
        FormSubmissions.countDocuments({ formName: 'reserve_days_management' }),
        PersonnelModel.countDocuments({}),
        ProjectModel.countDocuments({}),
        ReserveDayModel.countDocuments({}),
    ])

    const results = [
        { entity: 'personnel', source: srcPersonnel, migrated: newPersonnel, exact: srcPersonnel === newPersonnel },
        { entity: 'projects', source: srcProjects, migrated: newProjects, exact: srcProjects === newProjects },
        {
            entity: 'reserve_days',
            source: srcReserveDays,
            migrated: newReserveDays,
            exact: srcReserveDays === newReserveDays,
        },
    ]

    for (const r of results) {
        if (r.exact) {
            logger.info(`[verify] ${r.entity}: source=${r.source} migrated=${r.migrated} OK`)
        } else {
            logger.warn(
                `[verify] ${r.entity}: source=${r.source} migrated=${r.migrated} MISMATCH (expected for reserve_days if rows were excluded for dangling employeeName refs)`
            )
        }
    }

    return results
}
