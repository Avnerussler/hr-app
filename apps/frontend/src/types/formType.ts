import { FormFields } from './fieldsType'

export type AllFormSubmission = {
    forms: {
        _id: string
        description: string
        formName: string
        formData: FormFields[]
    }[]
}

export type FormSubmission = {
    form: {
        _id: string
        formName: string
        formFields: FormFields[]
    }
}

export interface FilterOption {
    value: string
    label: string
}

interface FilterCollection {
    items: FilterOption[]
}
export interface Filter {
    label: string
    collection: FilterCollection
    onValueChange: (value: FilterOption[] | { value: string[] }) => void
    placeholder: string
}
