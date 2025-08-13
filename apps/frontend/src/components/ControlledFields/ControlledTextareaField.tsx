import { Textarea } from '@chakra-ui/react'
import { Control, Controller, FieldValues } from 'react-hook-form'
import { Field } from '@chakra-ui/react'
import { FC } from 'react'

interface ControlledTextareaFieldProps extends FieldValues {
    control: Control
}
export const ControlledTextareaField: FC<ControlledTextareaFieldProps> = ({
    name,
    control,
    label,
    id,
    ...props
}) => {
    return (
        <Controller
            name={name}
            control={control}
            defaultValue={props.defaultValue}
            rules={{
                required: props.required ? `${label} הוא שדה חובה` : false,
                validate: (value) => {
                    if (props.required && !value) {
                        return `${label} הוא שדה חובה`
                    }
                    return true
                },
            }}
            render={({ field }) => (
                <Field.Root key={id} orientation="vertical">
                    <Field.Label>{label}</Field.Label>
                    <Textarea {...field} autoresize id={id.toString()} />
                </Field.Root>
            )}
        />
    )
}
