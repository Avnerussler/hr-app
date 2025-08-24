import { Textarea } from '@chakra-ui/react'
import { Control, Controller, FieldValues, Path } from 'react-hook-form'
import { Field } from '@chakra-ui/react'

interface ControlledTextareaFieldProps<T extends FieldValues = FieldValues> {
    control: Control<T>
    name: Path<T>
    label?: string
    id?: string | number
    rules?: any
    [key: string]: any
}
export const ControlledTextareaField = <T extends FieldValues = FieldValues>({
    name,
    control,
    label,
    id,
    rules,
    ...props
}: ControlledTextareaFieldProps<T>) => {
    return (
        <Controller
            name={name}
            control={control}
            defaultValue={props.defaultValue}
            rules={rules || {
                required: props.required ? `${label} הוא שדה חובה` : false,
                validate: (value) => {
                    if (props.required && !value) {
                        return `${label} הוא שדה חובה`
                    }
                    return true
                },
            }}
            render={({ field, fieldState: { error } }) => (
                <Field.Root key={id} orientation="vertical" invalid={!!error}>
                    {label && <Field.Label>{label}</Field.Label>}
                    <Textarea 
                        {...field} 
                        {...props}
                        autoresize 
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
