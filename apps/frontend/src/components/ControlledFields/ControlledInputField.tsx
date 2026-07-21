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
            rules={{
                required: props.required ? `${label} הוא שדה חובה` : false,
                validate: (value) => {
                    if (props.required && !value) {
                        return `${label} הוא שדה חובה`
                    }

                    // Special validation for number type (hours)
                    if (
                        type === 'number' &&
                        value !== '' &&
                        value !== undefined
                    ) {
                        const numValue = parseFloat(value)

                        if (isNaN(numValue)) {
                            return 'יש להזין מספר תקין'
                        }

                        // Check for negative numbers
                        if (numValue < 0) {
                            return 'המספר חייב להיות חיובי'
                        }

                        // Check for hours specifically (if max is 24)
                        if (props.max === 24 && numValue > 24) {
                            return 'מקסימום 24 שעות'
                        }
                    }

                    return true
                },
                ...props.rules,
            }}
            render={({ field, fieldState: { error } }) => {
                return (
                    <Field.Root
                        key={id}
                        data-field-name={name}
                        orientation="vertical"
                        invalid={!!error}
                        required={props.required}
                    >
                        <Field.Label>
                            {label}
                            <Field.RequiredIndicator />
                        </Field.Label>
                        <Input
                            {...field}
                            value={field.value ?? ''}
                            required={false} // Disable native HTML5 required validation; we handle it via react-hook-form
                            onChange={(e) => field.onChange(e.target.value)}
                            type={type}
                            id={id}
                            min={props.min}
                            max={props.max}
                            borderColor={error ? 'red.500' : undefined}
                        />
                        {error && (
                            <Field.ErrorText>{error.message}</Field.ErrorText>
                        )}
                    </Field.Root>
                )
            }}
        />
    )
}
