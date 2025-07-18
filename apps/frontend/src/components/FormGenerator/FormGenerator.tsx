import { Field } from '@chakra-ui/react'

import { Switch } from '../ui/switch'
import { FieldType } from '@/types/fieldsType'
import {
    ControlledFileInput,
    ControlledInputField,
    ControlledMultipleSelectField,
    ControlledSelectField,
} from '../ControlledFields'
import { Control, FieldValues } from 'react-hook-form'
import { RefObject } from 'react'
import { ControlledTextareaField } from '../ControlledFields/ControlledTextareaField'
import { ControlledRadioField } from '../ControlledFields/ControlledRadioField'

export interface FormGeneratorProps extends FieldValues {
    control: Control
    contentRef?: RefObject<HTMLElement>
}

export const FormGenerator = ({
    id,
    type,
    options,
    items,
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
            case 'date':
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
                        <Switch />
                    </Field.Root>
                )
            case 'select':
                return (
                    <ControlledSelectField
                        {...props}
                        control={control}
                        key={id}
                        options={options}
                        id={id}
                    />
                )

            case 'multipleSelect':
                return (
                    <ControlledMultipleSelectField
                        {...props}
                        control={control}
                        key={id}
                        options={options}
                        id={id}
                    />
                )
            case 'textarea':
                return (
                    <ControlledTextareaField
                        {...props}
                        control={control}
                        key={id}
                        options={options}
                        id={id}
                    />
                )

            case 'radio':
                return (
                    <ControlledRadioField
                        {...props}
                        control={control}
                        key={id}
                        items={items}
                        id={id}
                    />
                )
            default:
                return null
        }
    }
    return <div>{renderField(type)}</div>
}
