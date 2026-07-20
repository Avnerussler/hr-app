import { z } from 'zod'
import {
    PersonnelSchema as SharedPersonnelSchema,
    PersonnelUpdateSchema as SharedPersonnelUpdateSchema,
} from '@hr-app/shared-types'

export const PersonnelFormSchema = SharedPersonnelSchema
export const PersonnelUpdateFormSchema = SharedPersonnelUpdateSchema
export type PersonnelFormValues = z.infer<typeof PersonnelFormSchema>

export const PERSONNEL_DEFAULT_VALUES: PersonnelFormValues = {
    firstName: '',
    lastName: '',
    personalNumber: '',
    isActive: true,
    assignedProjects: null,
}
