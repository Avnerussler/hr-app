// import { Path, FieldValues } from 'react-hook-form'

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

export interface FormFields {
    _id: string
    name: string
    type: FieldType
    label: string
    placeholder: string
    required: true
    options?: Option[]
    errorMessages?: string
}
