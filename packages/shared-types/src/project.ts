import { z } from 'zod'
import { ProjectStatus } from './enums'
import { ObjectIdString } from './common'

export const ProjectSchema = z.object({
    projectName: z.string().min(1),
    projectManager: ObjectIdString.nullable().default(null),
    projectPersonnel: z.array(ObjectIdString).default([]),
    projectStatus: ProjectStatus.default('active'),
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
