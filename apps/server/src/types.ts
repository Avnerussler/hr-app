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
    foreignFormName?: string
    foreignField?: string
}

export interface FormSection {
    id: string
    name: string
    fields: FormFields[]
}

export interface MetricCalculation {
    type: 'total' | 'filtered' | 'aggregated'
    field?: string
    value?: string | number | boolean
    aggregateField?: string
    operator?: '=' | '!=' | '>' | '<' | '>=' | '<=' | 'includes' | 'excludes'
}

export interface MetricConfig {
    id: string
    title: string
    icon?: string
    color?: string
    type: 'count' | 'sum' | 'average' | 'percentage'
    calculation: MetricCalculation
}

export interface IForm {
    formName: string
    version?: string
    description?: string
    icon?: string
    sections: FormSection[]
    metrics?: MetricConfig[]
    overviewFields?: string[]
}
