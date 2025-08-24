import { Field, Input } from '@chakra-ui/react'
import { Control, Controller, FieldValues, Path } from 'react-hook-form'

interface ControlledInputFieldProps<T extends FieldValues = FieldValues> {
    control: Control<T>
    name: Path<T>
    label?: string
    id?: string | number
    type?: string
    rules?: any
    [key: string]: any
}
export const ControlledInputField = <T extends FieldValues = FieldValues>({
    control,
    name,
    label,
    id,
    type,
    rules,
    ...props
}: ControlledInputFieldProps<T>) => {
    return (
        <Controller
            name={name}
            control={control}
            defaultValue={props.defaultValue}
            rules={rules || {
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
                    {label && <Field.Label>{label}</Field.Label>}
                    <Input
                        {...field}
                        {...props}
                        type={type}
                        id={id?.toString()}
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
