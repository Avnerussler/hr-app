import { MetricConfig } from './metricsType'

export type FieldType =
    | 'text'
    | 'email'
    | 'password'
    | 'switch'
    | 'select'
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

export interface Option {
    value: string
    label: string
    name: string
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
    foreignFormId?: string
    foreignField?: string
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
}
