import { z } from 'zod'
import { PersonnelSchema as SharedPersonnelSchema } from '@hr-app/shared-types'

export const PersonnelFormSchema = SharedPersonnelSchema
export type PersonnelFormValues = z.infer<typeof PersonnelFormSchema>

export const PERSONNEL_DEFAULT_VALUES: PersonnelFormValues = {
    firstName: '',
    lastName: '',
    personalNumber: '',
    isActive: true,
    assignedProjects: null,
}
