import { z } from 'zod'

export const SettingType = z.enum(['select'])
export type SettingType = z.infer<typeof SettingType>

export const SettingOptionSchema = z.object({
    value: z.string().min(1, 'ערך הוא שדה חובה'),
    label: z.string().min(1, 'תווית היא שדה חובה'),
    order: z.number().int().default(0),
    isActive: z.boolean().default(true),
})
export type SettingOption = z.infer<typeof SettingOptionSchema>

export const SettingObjectSchema = z.object({
    key: z.string().min(1, 'מפתח הוא שדה חובה'),
    label: z.string().min(1, 'תווית היא שדה חובה'),
    category: z.string().nullish(),
    type: SettingType.default('select'),
    isActive: z.boolean().default(true),
    options: z.array(SettingOptionSchema).default([]),
})

export const SettingSchema = SettingObjectSchema
export type Setting = z.infer<typeof SettingSchema>

export const SettingUpdateSchema = SettingObjectSchema.omit({ key: true }).partial()
