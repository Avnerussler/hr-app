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
