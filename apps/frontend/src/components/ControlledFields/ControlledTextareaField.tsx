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
                <Field.Root key={id} data-field-name={name} orientation="vertical" required={props.required}>
                    <Field.Label>
                        {label}
                        <Field.RequiredIndicator />
                    </Field.Label>
                    <Textarea
                        {...field}
                        autoresize
                        id={id}
                        value={field.value ?? ''}
                        onChange={(e) => field.onChange(e.target.value)}
                    />
                </Field.Root>
            )}
        />
    )
}
