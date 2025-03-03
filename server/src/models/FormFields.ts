import mongoose, { Schema, Document } from 'mongoose'
import { v4 as uuidv4 } from 'uuid'

export interface IOption {
    value: string // UUID
    label: string
    name: string
}

export interface IFormField {
    name: string
    type: string
    label?: string
    placeholder?: string
    required?: boolean
    defaultValue?: string
    options?: IOption[]
}

export interface IFormFields extends Document {
    formName: string
    formFields: IFormField[]
}

const FormFieldsSchema: Schema = new Schema(
    {
        formName: { type: String, required: true },
        formFields: [
            {
                name: { type: String, required: true },
                type: { type: String, required: true },
                label: { type: String },
                placeholder: { type: String },
                required: { type: Boolean },
                defaultValue: { type: String },
                options: [
                    {
                        value: {
                            type: String,
                            required: true,
                            default: uuidv4,
                        },
                        label: { type: String, required: true },
                        name: { type: String, required: true },
                        _id: false,
                    },
                ],
            },
        ],
    },
    { timestamps: true }
)
export const FormFields = mongoose.model<IFormFields>(
    'form_fields',
    FormFieldsSchema
)
