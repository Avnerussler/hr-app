import mongoose, { Schema, Document } from 'mongoose'

export interface IFormFields extends Document {
    formName: string
    formFields: object
}

/**
 * Option Schema for selectable form fields (e.g., dropdown, radio buttons).
 */
const OptionSchema: Schema = new Schema({
    value: { type: String, required: true },
    label: { type: String, required: true },
    name: { type: String, required: true },
})
/**
 * Form Field Schema - Defines individual fields within a form.
 */
const FormFieldSchema: Schema = new Schema({
    id: { type: Number, required: true },
    name: { type: String, required: true },
    type: { type: String, required: true },
    label: { type: String },
    placeholder: { type: String },
    required: { type: Boolean },
    defaultValue: { type: String },
    options: [OptionSchema],
})

const FormFieldsSchema: Schema = new Schema(
    {
        formName: { type: String, required: true },
        formFields: [FormFieldSchema],
    },
    { timestamps: true }
)

export const FormFields = mongoose.model<IFormFields>(
    'form_fields',
    FormFieldsSchema
)
