import { z } from 'zod'
import { SettingSchema as SharedSettingSchema, SettingUpdateSchema as SharedSettingUpdateSchema } from '@hr-app/shared-types'

export const SettingFormSchema = SharedSettingSchema
export const SettingUpdateFormSchema = SharedSettingUpdateSchema
export type SettingFormValues = z.infer<typeof SettingFormSchema>
