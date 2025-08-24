import { Control } from 'react-hook-form'
import {
    ControlledInputField,
    ControlledTextareaField,
    ControlledSelectField,
    ControlledSelectAutocompleteField,
    ControlledMultipleSelectField,
    ControlledRadioField,
    ControlledDateField,
    ControlledFileInput,
} from '../ControlledFields'

export interface FormField {
    _id: { $oid: string }
    name: string
    type: string
    label: string
    placeholder: string
    required: boolean
    defaultValue: string
    options?: { label: string; name: string; value: string }[]
    items?: { label: string; value: string }[]
    foreignFormId?: { $oid: string }
    foreignField?: string
}

interface DynamicFormRendererProps {
    fields: FormField[]
    control: Control
    employeeData?: any
}

export function DynamicFormRenderer({
    fields,
    control,
    employeeData,
}: DynamicFormRendererProps) {
    const renderField = (field: FormField) => {
        // Handle foreign field default values - extract ID from stored object format
        const getDefaultValue = () => {
            const storedValue = employeeData?.[field.name]
            if (!storedValue) return field.defaultValue

            // If it's a foreign field with stored object format {_id, display}
            if (field.foreignFormId && typeof storedValue === 'object') {
                if (field.type === 'multipleSelect') {
                    // For multiple select, extract array of IDs
                    return Array.isArray(storedValue) ? storedValue.map(item => item._id || item) : []
                } else {
                    // For single select, extract single ID
                    return storedValue._id || storedValue
                }
            }
            
            return storedValue || field.defaultValue
        }

        const commonProps = {
            control,
            name: field.name,
            label: field.label,
            id: field._id.$oid,
            placeholder: field.placeholder,
            defaultValue: getDefaultValue(),
        }

        switch (field.type) {
            case 'text':
            case 'email':
            case 'tel':
            case 'number':
                return (
                    <ControlledInputField
                        key={field._id.$oid}
                        {...commonProps}
                        type={field.type}
                    />
                )

            case 'textarea':
                return (
                    <ControlledTextareaField
                        key={field._id.$oid}
                        {...commonProps}
                    />
                )

            case 'select':
                return (
                    <ControlledSelectField
                        key={field._id.$oid}
                        {...commonProps}
                        options={
                            field.options?.map((opt) => ({
                                label: opt.label,
                                value: opt.value,
                            })) || []
                        }
                    />
                )

            case 'selectAutocomplete':
                return (
                    <ControlledSelectAutocompleteField
                        key={field._id.$oid}
                        {...commonProps}
                        options={
                            field.options?.map((opt) => ({
                                label: opt.label,
                                value: opt.value,
                            })) || []
                        }
                    />
                )

            case 'multipleSelect':
                return (
                    <ControlledMultipleSelectField
                        key={field._id.$oid}
                        {...commonProps}
                        options={
                            field.options?.map((opt) => ({
                                label: opt.label,
                                value: opt.value,
                            })) || []
                        }
                    />
                )

            case 'radio':
                return (
                    <ControlledRadioField
                        key={field._id.$oid}
                        {...commonProps}
                        items={
                            field.items?.map((item) => ({
                                label: item.label,
                                value: item.value,
                            })) || []
                        }
                    />
                )

            case 'date':
                return (
                    <ControlledDateField
                        key={field._id.$oid}
                        {...commonProps}
                    />
                )

            case 'file':
                return (
                    <ControlledFileInput
                        key={field._id.$oid}
                        {...commonProps}
                    />
                )

            default:
                return (
                    <ControlledInputField
                        key={field._id.$oid}
                        {...commonProps}
                        type="text"
                    />
                )
        }
    }

    return (
        <>
            {fields.map((field) => renderField(field))}
        </>
    )
}