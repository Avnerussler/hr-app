import { FormFields } from './fieldsType'
import { ListCollection } from '@chakra-ui/react'

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

export interface Filter {
    label: string
    collection: ListCollection<FilterOption>
    onValueChange: (value: FilterOption[] | { value: string[] }) => void
    placeholder: string
}
