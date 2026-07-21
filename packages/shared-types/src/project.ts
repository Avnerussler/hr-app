import { z } from 'zod'
import { ObjectIdString } from './common'

export const ProjectSchema = z.object({
    projectName: z.string().min(1),
    projectManager: ObjectIdString.nullable().default(null),
    projectPersonnel: z.array(ObjectIdString).default([]),
    projectStatus: z.string().default('active'),
})
export type Project = z.infer<typeof ProjectSchema>

export const PROJECT_DEFAULT_VALUES: Pick<
    Project,
    'projectManager' | 'projectPersonnel' | 'projectStatus'
> = {
    projectManager: null,
    projectPersonnel: [],
    projectStatus: 'active',
}
