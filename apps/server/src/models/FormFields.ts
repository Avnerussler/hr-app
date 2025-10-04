import mongoose, { Schema, Document } from 'mongoose'
import { v4 as uuidv4 } from 'uuid'
import { IForm } from '../types'

type TFormFields = IForm & Document

// Subschema for options (select dropdown)
const OptionSchema = new Schema(
    {
        value: {
            type: String,
            required: true,
            default: uuidv4,
        },
        label: { type: String, required: true },
        name: { type: String, required: true },
    },
    { _id: false }
)

// Subschema for items (radio buttons)
const ItemSchema = new Schema(
    {
        value: {
            type: String,
            required: true,
            default: uuidv4,
        },
        label: { type: String, required: true },
    },
    { _id: false }
)

// Subschema for fields inside sections
const FieldSchema = new Schema(
    {
        name: { type: String, required: true },
        type: { type: String, required: true },
        label: { type: String },
        placeholder: { type: String },
        required: { type: Boolean },
        errorMessage: { type: String, default: '' },
        validation: {
            min: { type: Number },
            max: { type: Number },
            minLength: { type: Number },
            maxLength: { type: Number },
            pattern: { type: String },
            customValidation: { type: String }
        },
        defaultValue: { type: String },
        foreignFormName: { type: String },
        foreignField: { type: String },
        foreignFields: { type: [String] },
        options: [OptionSchema],
        items: {
            type: [ItemSchema],
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
    { _id: false }
)

// Subschema for metric calculations
const MetricCalculationSchema = new Schema(
    {
        type: {
            type: String,
            required: true,
            enum: ['total', 'filtered', 'aggregated'],
        },
        field: { type: String },
        value: { type: Schema.Types.Mixed },
        aggregateField: { type: String },
        operator: {
            type: String,
            enum: ['=', '!=', '>', '<', '>=', '<=', 'includes', 'excludes'],
        },
    },
    { _id: false }
)

// Subschema for metrics
const MetricConfigSchema = new Schema(
    {
        id: { type: String, required: true },
        title: { type: String, required: true },
        icon: { type: String },
        color: { type: String },
        type: {
            type: String,
            required: true,
            enum: ['count', 'sum', 'average', 'percentage'],
        },
        calculation: { type: MetricCalculationSchema, required: true },
    },
    { _id: false }
)

// Subschema for business rule validations
const BusinessRuleSchema = new Schema(
    {
        id: { type: String, required: true },
        name: { type: String, required: true },
        description: { type: String },
        ruleType: { 
            type: String, 
            required: true,
            enum: ['uniqueConstraint', 'dateRange', 'conditional', 'custom']
        },
        config: { type: Schema.Types.Mixed, required: true },
        errorMessage: { type: String, required: true },
        enabled: { type: Boolean, default: true }
    },
    { _id: false }
)

// Subschema for sections
const SectionSchema = new Schema(
    {
        id: { type: String, required: true },
        name: { type: String, required: true },
        fields: [FieldSchema],
    },
    { _id: false }
)

// Top-level schema
const FormSchema: Schema = new Schema<TFormFields>(
    {
        formName: { type: String, required: true, unique: true },
        version: { type: String, default: '1.0.0' },
        description: { type: String, default: '' },
        icon: { type: String, default: '' },
        sections: [SectionSchema],
        metrics: [MetricConfigSchema],
        overviewFields: { type: [String], default: [] },
        businessRules: [BusinessRuleSchema],
    },
    { timestamps: true }
)

export const FormFields = mongoose.model<IForm>('form_fields', FormSchema)

// Ensure formName is unique
FormFields.collection.createIndex({ formName: 1 }, { unique: true })
