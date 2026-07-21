import { z } from 'zod'
import { ObjectIdString } from './common'

const ReserveDayObjectSchema = z.object({
    employeeName: z
        .string()
        .min(1, 'שם העובד הוא שדה חובה')
        .pipe(ObjectIdString),
    startDate: z.coerce.date({
        errorMap: () => ({ message: 'תאריך התחלה הוא שדה חובה' }),
    }),
    endDate: z.coerce.date({
        errorMap: () => ({ message: 'תאריך סיום הוא שדה חובה' }),
    }),
    fundingSource: z.string().default('internal'),
    fundingName: z.string().optional(),
    orderType: z.string().min(1, 'סוג צו הוא שדה חובה'),
    requestStatus: z.string().default('pending'),
    baseAccessApproval: z.string().default('pending'),
    notes: z.string().optional(),
    // vehicleStatus is intentionally excluded — always computed at read time
    // from the linked Personnel doc (vehicleEntry/vehicleNumber), never stored.
})

export const ReserveDaySchema = ReserveDayObjectSchema.refine(
    (data) => data.endDate >= data.startDate,
    {
        message: 'תאריך סיום חייב להיות אחרי תאריך התחלה',
        path: ['endDate'],
    }
)
export type ReserveDay = z.infer<typeof ReserveDaySchema>

export const ReserveDayUpdateSchema = ReserveDayObjectSchema.partial().refine(
    (data) => !data.startDate || !data.endDate || data.endDate >= data.startDate,
    {
        message: 'תאריך סיום חייב להיות אחרי תאריך התחלה',
        path: ['endDate'],
    }
)

export const RESERVE_DAY_DEFAULT_VALUES: Pick<
    ReserveDay,
    'fundingSource' | 'requestStatus' | 'baseAccessApproval'
> = {
    fundingSource: 'internal',
    requestStatus: 'pending',
    baseAccessApproval: 'pending',
}
