import { MetricConfig } from './metricsType'

export type FieldType =
    | 'text'
    | 'email'
    | 'password'
    | 'switch'
    | 'select'
    | 'enhancedSelect'
    | 'selectAutocomplete'
    | 'radio'
    | 'checkbox'
    | 'textarea'
    | 'date'
    | 'time'
    | 'datetime'
    | 'file'
    | 'number'
    | 'tel'
    | 'url'
    | 'multipleSelect'
    | 'enhancedMultipleSelect'
    | 'attendance'
    | 'attendanceHistory'

export interface Option {
    value: string
    label: string
    name: string
    metadata?: Record<string, any>
}

export interface Item {
    value: string
    label: string
}

export interface FormFields {
    _id: string
    name: string
    type: FieldType
    label: string
    placeholder: string
    required: boolean
    defaultValue?: string
    options?: Option[]
    items?: Item[]
    errorMessages?: string
    foreignFormName?: string
    foreignField?: string
    foreignFields?: string[]
}

export interface FormSection {
    id: string
    name: string
    fields: FormFields[]
}

export interface IForm {
    formName: string
    description: string
    _id: string
    sections: FormSection[]
    metrics?: MetricConfig[]
    overviewFields?: string[]
}
