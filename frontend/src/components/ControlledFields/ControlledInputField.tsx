import { Field, Input } from '@chakra-ui/react'
import { Control, Controller, FieldValues } from 'react-hook-form'

interface ControlledInputFieldProps extends FieldValues {
    control: Control
}
export const ControlledInputField = ({
    control,
    name,
    label,
    id,
    type,
    ...props
}: ControlledInputFieldProps) => {
    return (
        <Controller
            name={name}
            control={control}
            defaultValue={props.defaultValue}
            render={({ field }) => (
                <Field.Root key={id} orientation="vertical">
                    <Field.Label>{label}</Field.Label>
                    <Input
                        {...field}
                        // {...props}
                        type={type}
                        id={id.toString()}
                    />
                </Field.Root>
            )}
        />
    )
}
