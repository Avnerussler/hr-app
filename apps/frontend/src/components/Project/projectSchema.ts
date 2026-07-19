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
