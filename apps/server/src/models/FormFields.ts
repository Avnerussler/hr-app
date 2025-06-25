import mongoose, { Schema, Document } from 'mongoose'
import { v4 as uuidv4 } from 'uuid'
import { IForm } from '../types'

type TFormFields = IForm & Document
const FormFieldsSchema: Schema = new Schema<TFormFields>(
    {
        formName: { type: String, required: true, unique: true },
        formFields: [
            {
                name: { type: String, required: true },
                type: { type: String, required: true },
                label: { type: String },
                placeholder: { type: String },
                required: { type: Boolean },
                defaultValue: { type: String },
                foreignFormId: { type: mongoose.Types.ObjectId },
                foreignField: { type: String },
                options: {
                    type: [
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

                    // validate: {
                    //     validator: function (this: any, options: any) {
                    //         return (
                    //             this.type !== 'select' ||
                    //             (Array.isArray(options) && options.length > 0)
                    //         )
                    //     },
                    //     message: 'Options are required when type is "select"',
                    // },
                },
                items: {
                    type: [
                        {
                            value: {
                                type: String,
                                required: true,
                                default: uuidv4,
                            },
                            label: { type: String, required: true },
                            _id: false,
                        },
                    ],
                    validate: {
                        validator: function (this: any, items: any) {
                            return (
                                this.type !== 'radio' ||
                                (Array.isArray(items) && items.length > 0)
                            )
                        },
                        message: 'Items are required when type is "radio"',
                    },
                },
            },
        ],
    },
    { timestamps: true }
)

export const FormFields = mongoose.model<IForm>('form_fields', FormFieldsSchema)
FormFields.collection.createIndex({ formName: 1 }, { unique: true })
