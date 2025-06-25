import mongoose, { Schema, Document } from 'mongoose'

// Define the forms schema
export interface IFormSubmissions extends Document {
    formName: string
    formFields: object
}

const FormSubmissionsSchema: Schema = new Schema(
    {
        formId: {
            type: mongoose.Types.ObjectId,
            required: true,
            ref: 'form_fields',
        },
        formName: {
            type: String,
            required: true,
        },
        formData: { type: Object, required: true },
    },
    { timestamps: true }
)

export const FormSubmissions = mongoose.model<IFormSubmissions>(
    'form_submissions',
    FormSubmissionsSchema
)
