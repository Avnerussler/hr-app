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
            render={({ field }) => (
                <Field.Root key={id} orientation="vertical">
                    <Field.Label>{label}</Field.Label>
                    <Textarea
                        {...field}
                        // {...props}
                        autoresize
                        id={id.toString()}
                    />
                </Field.Root>
            )}
        />
    )
}
