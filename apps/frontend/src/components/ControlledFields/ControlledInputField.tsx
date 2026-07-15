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
                const isDate = type === 'date'
                // Display: Date objects and full ISO strings → "YYYY-MM-DD" for the input
                const displayValue = isDate
                    ? (field.value instanceof Date
                        ? field.value.toISOString().slice(0, 10)
                        : typeof field.value === 'string'
                            ? field.value.slice(0, 10)
                            : '')
                    : field.value

                return (
                <Field.Root key={id} orientation="vertical" invalid={!!error}>
                    <Field.Label>{label}</Field.Label>
                    <Input
                        {...field}
                        value={displayValue ?? ''}
                        onChange={(e) => {
                            if (isDate) {
                                const d = e.target.value ? new Date(e.target.value) : ''
                                field.onChange(d)
                            } else {
                                field.onChange(e.target.value)
                            }
                        }}
                        type={type}
                        id={id}
                        min={props.min}
                        max={props.max}
                        borderColor={error ? 'red.500' : undefined}
                        dir={type === 'text' ? 'rtl' : undefined}
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
