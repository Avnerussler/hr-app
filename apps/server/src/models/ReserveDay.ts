import mongoose, { Schema, Document } from 'mongoose'
import {
    BaseAccessApproval,
    FundingSource,
    OrderType,
    RequestStatus,
    ReserveDay,
} from '@hr-app/shared-types'

export type ReserveDayDocument = Omit<ReserveDay, 'employeeName'> &
    Document & {
        employeeName: mongoose.Types.ObjectId
        isDeleted: boolean
        attendance: Map<string, boolean>
    }

const ReserveDaySchema = new Schema<ReserveDayDocument>(
    {
        employeeName: { type: Schema.Types.ObjectId, ref: 'personnel', required: true },
        startDate: { type: Date, required: true },
        endDate: { type: Date, required: true },
        fundingSource: { type: String, enum: FundingSource.options, default: 'internal' },
        fundingName: { type: String },
        orderType: { type: String, enum: OrderType.options, required: true },
        requestStatus: { type: String, enum: RequestStatus.options, default: 'pending', required: true },
        baseAccessApproval: { type: String, enum: BaseAccessApproval.options, default: 'pending' },
        notes: { type: String },
        attendance: { type: Map, of: Boolean, default: {} },
        isDeleted: { type: Boolean, default: false },
    },
    { timestamps: true, collection: 'reserve_days' }
)

ReserveDaySchema.index({ employeeName: 1, startDate: 1, endDate: 1 })

export const ReserveDayModel = mongoose.model<ReserveDayDocument>('reserve_days', ReserveDaySchema)
