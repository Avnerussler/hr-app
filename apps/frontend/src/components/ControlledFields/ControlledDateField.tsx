import { Field, Input } from '@chakra-ui/react'
import { Control, Controller, FieldValues } from 'react-hook-form'

interface ControlledDateFieldProps extends FieldValues {
    control: Control
}

export const ControlledDateField = ({
    control,
    name,
    label,
    id,
    ...props
}: ControlledDateFieldProps) => {
    return (
        <Controller
            name={name}
            control={control}
            defaultValue={props.defaultValue}
            rules={{ required: props.required }}
            render={({ field }) => (
                <Field.Root key={id} orientation="vertical">
                    <Field.Label>{label}</Field.Label>
                    <Input
                        {...field}
                        datatype="DDMMYYYY"
                        type="date"
                        id={id}
                        placeholder={props.placeholder}
                    />
                </Field.Root>
            )}
        />
    )
}
