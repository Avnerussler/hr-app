import mongoose, { Schema, Document } from 'mongoose'
import { Setting } from '@hr-app/shared-types'

export type SettingDocument = Setting & Document

const SettingOptionSchema = new Schema(
    {
        value: { type: String, required: true },
        label: { type: String, required: true },
        order: { type: Number, default: 0 },
        isActive: { type: Boolean, default: true },
    },
    { _id: false }
)

const SettingSchema = new Schema<SettingDocument>(
    {
        key: { type: String, required: true },
        label: { type: String, required: true },
        category: { type: String },
        type: { type: String, default: 'select' },
        isActive: { type: Boolean, default: true },
        options: { type: [SettingOptionSchema], default: [] },
    },
    { timestamps: true, collection: 'settings' }
)

SettingSchema.index({ key: 1 }, { unique: true })

export const SettingModel = mongoose.model<SettingDocument>('settings', SettingSchema)
