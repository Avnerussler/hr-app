import { z } from 'zod'
import { ReserveDaySchema as SharedReserveDaySchema } from '@hr-app/shared-types'

export const ReserveDayFormSchema = SharedReserveDaySchema
export type ReserveDayFormValues = z.infer<typeof ReserveDayFormSchema>

export const RESERVE_DAY_DEFAULT_VALUES: Partial<ReserveDayFormValues> = {
    employeeName: '',
    fundingSource: 'internal',
    requestStatus: 'pending',
    baseAccessApproval: 'pending',
}

const SELECT_FIELD_LABELS = {
    fundingSource: 'מקור מימון',
    orderType: 'סוג צו',
    requestStatus: 'סטטוס בקשה',
    baseAccessApproval: 'אישור כניסה לבסיס',
} as const

export type ReserveDaySelectFieldKey = keyof typeof SELECT_FIELD_LABELS

export type ReserveDaySelectFieldAllowedValues = Record<ReserveDaySelectFieldKey, string[]>

/**
 * These fields moved from static zod enums to plain strings validated against the
 * Settings collection (see apps/server/src/services/setting.service.ts
 * `validateSelectField`). This re-adds client-side validation against the *current*
 * allowed values so a stale option (removed/deactivated since the form loaded) is still
 * caught before submit, not just by the backend's 400 response.
 */
export function buildReserveDayFormSchema(allowed: ReserveDaySelectFieldAllowedValues) {
    const selectFieldValidation = Object.fromEntries(
        (Object.keys(SELECT_FIELD_LABELS) as ReserveDaySelectFieldKey[]).map((key) => [
            key,
            z.string().refine((v) => !v || allowed[key].includes(v), `${SELECT_FIELD_LABELS[key]} אינו תקין`),
        ])
    )

    return ReserveDayFormSchema._def.schema.extend(selectFieldValidation).superRefine((data, ctx) => {
        const result = ReserveDayFormSchema.safeParse(data)
        if (!result.success) {
            result.error.issues.forEach((issue) => ctx.addIssue(issue))
        }
    })
}
