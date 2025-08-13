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
            rules={{
                required: props.required ? `${label} הוא שדה חובה` : false,
                validate: (value) => {
                    if (props.required && !value) {
                        return `${label}הוא שדה חובה`
                    }
                    return true
                },
            }}
            render={({ field, fieldState: { error } }) => (
                <Field.Root key={id} orientation="vertical" invalid={!!error}>
                    <Field.Label>{label}</Field.Label>
                    <Input
                        {...field}
                        type={type}
                        id={id.toString()}
                        borderColor={error ? 'red.500' : undefined}
                    />
                    {error && (
                        <Field.ErrorText>{error.message}</Field.ErrorText>
                    )}
                </Field.Root>
            )}
        />
    )
}
