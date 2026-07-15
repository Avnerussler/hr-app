import { Field } from '@chakra-ui/react'
import { Control, Controller, FieldValues } from 'react-hook-form'
import { Switch } from '../ui/switch'

interface ControlledSwitchFieldProps extends FieldValues {
    control: Control
}

export const ControlledSwitchField = ({
    control,
    name,
    label,
    id,
    ...props
}: ControlledSwitchFieldProps) => {
    return (
        <Controller
            name={name}
            control={control}
            defaultValue={props.defaultValue ?? false}
            render={({ field }) => (
                <Field.Root key={id} orientation="horizontal">
                    <Field.Label>{label}</Field.Label>
                    <Switch
                        checked={!!field.value}
                        onCheckedChange={({ checked }) => field.onChange(checked)}
                        ref={field.ref}
                    />
                </Field.Root>
            )}
        />
    )
}
