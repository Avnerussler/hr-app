import { Field } from '@chakra-ui/react'

import { Switch } from '../ui/switch'
import { FieldType } from '@/types/fieldsType'
import {
    ControlledFileInput,
    ControlledInputField,
    ControlledSelectField,
} from '../ControlledFields'
import { Control, FieldValues } from 'react-hook-form'

export interface FormGeneratorProps extends FieldValues {
    control: Control
}

export const FormGenerator = ({
    id,
    type,
    options,
    control,
    ...props
}: FormGeneratorProps) => {
    const renderField = (type: FieldType) => {
        switch (type) {
            case 'text':
            case 'email':
            case 'password':
            case 'tel':
            case 'number':
            case 'url':
                return (
                    <ControlledInputField
                        {...props}
                        control={control}
                        key={id}
                        id={id}
                        type={type}
                    />
                )
            case 'file':
                return (
                    <ControlledFileInput
                        {...props}
                        control={control}
                        key={id}
                        id={id}
                        type={type}
                    />
                )
            case 'switch':
                return (
                    <Field.Root key={id} orientation="horizontal">
                        <Field.Label>{props.label}</Field.Label>
                        <Switch {...props} />
                    </Field.Root>
                )
            case 'select':
                if (!options) throw new Error('Options are required for select')

                return (
                    <ControlledSelectField
                        {...props}
                        control={control}
                        key={id}
                        options={options}
                        id={id}
                    />
                )
            default:
                return null
        }
    }
    return <div>{renderField(type)}</div>
}
