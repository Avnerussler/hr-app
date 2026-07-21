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

const SELECT_FIELD_LABELS = {
    studioRole: 'תפקיד בסטודיו',
    reserveCategory: 'סוג העסקה',
    layer: 'שכבה',
    classificationClass: 'רמת סיווג',
    fieldOfExpertise: 'תחום מקצועי',
    experience: 'שנות ניסיון',
} as const

export type PersonnelSelectFieldKey = keyof typeof SELECT_FIELD_LABELS

export type PersonnelSelectFieldAllowedValues = Record<PersonnelSelectFieldKey, string[]>

/**
 * These fields moved from static zod enums to plain strings validated against the
 * Settings collection (see apps/server/src/services/setting.service.ts
 * `validateSelectField`). This re-adds client-side validation against the *current*
 * allowed values so a stale option (removed/deactivated since the form loaded) is still
 * caught before submit, not just by the backend's 400 response.
 */
function buildSelectFieldValidation(allowed: PersonnelSelectFieldAllowedValues) {
    return Object.fromEntries(
        (Object.keys(SELECT_FIELD_LABELS) as PersonnelSelectFieldKey[]).map((key) => [
            key,
            z
                .string()
                .nullish()
                .refine((v) => !v || allowed[key].includes(v), `${SELECT_FIELD_LABELS[key]} אינו תקין`),
        ])
    )
}

export function buildPersonnelFormSchema(allowed: PersonnelSelectFieldAllowedValues) {
    return PersonnelFormSchema._def.schema.extend(buildSelectFieldValidation(allowed)).superRefine(
        (data, ctx) => {
            const result = PersonnelFormSchema.safeParse(data)
            if (!result.success) {
                result.error.issues.forEach((issue) => ctx.addIssue(issue))
            }
        }
    )
}

export function buildPersonnelUpdateFormSchema(allowed: PersonnelSelectFieldAllowedValues) {
    return PersonnelUpdateFormSchema._def.schema.extend(buildSelectFieldValidation(allowed)).superRefine(
        (data, ctx) => {
            const result = PersonnelUpdateFormSchema.safeParse(data)
            if (!result.success) {
                result.error.issues.forEach((issue) => ctx.addIssue(issue))
            }
        }
    )
}
