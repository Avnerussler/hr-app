import { z } from 'zod'
import { ProjectSchema as SharedProjectSchema } from '@hr-app/shared-types'

export const ProjectFormSchema = SharedProjectSchema
export type ProjectFormValues = z.infer<typeof ProjectFormSchema>

export const PROJECT_DEFAULT_VALUES: ProjectFormValues = {
    projectName: '',
    projectManager: null,
    projectPersonnel: [],
    projectStatus: 'active',
}

/**
 * projectStatus moved from a static zod enum to a plain string validated against the
 * Settings collection (see apps/server/src/services/setting.service.ts
 * `validateSelectField`). This re-adds client-side validation against the *current*
 * allowed values so a stale option (removed/deactivated since the form loaded) is still
 * caught before submit, not just by the backend's 400 response.
 */
export function buildProjectFormSchema(allowedProjectStatusValues: string[]) {
    return ProjectFormSchema.extend({
        projectStatus: z.string().refine((v) => !v || allowedProjectStatusValues.includes(v), 'סטטוס הפרויקט אינו תקין'),
    })
}
