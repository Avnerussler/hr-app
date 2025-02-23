import { FormFields } from './fieldsType'

export type AllFormSubmission = {
    forms: { _id: string; formName: string; formFields: FormFields[] }[]
}

export type FormSubmission = {
    form: {
        _id: string
        formName: string
        formFields: FormFields[]
    }
}
