import { z } from 'zod'
import { BaseAccessApproval, FundingSource, OrderType, RequestStatus } from './enums'
import { ObjectIdString } from './common'

export const ReserveDaySchema = z
    .object({
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
        fundingSource: FundingSource.default('internal'),
        fundingName: z.string().optional(),
        orderType: OrderType,
        requestStatus: RequestStatus.default('pending'),
        baseAccessApproval: BaseAccessApproval.default('pending'),
        notes: z.string().optional(),
        // vehicleStatus is intentionally excluded — always computed at read time
        // from the linked Personnel doc (vehicleEntry/vehicleNumber), never stored.
    })
    .refine((data) => data.endDate >= data.startDate, {
        message: 'תאריך סיום חייב להיות אחרי תאריך התחלה',
        path: ['endDate'],
    })
export type ReserveDay = z.infer<typeof ReserveDaySchema>

export const RESERVE_DAY_DEFAULT_VALUES: Pick<
    ReserveDay,
    'fundingSource' | 'requestStatus' | 'baseAccessApproval'
> = {
    fundingSource: 'internal',
    requestStatus: 'pending',
    baseAccessApproval: 'pending',
}
