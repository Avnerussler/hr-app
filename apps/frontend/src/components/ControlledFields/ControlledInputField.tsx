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
                    ? field.value instanceof Date
                        ? field.value.toISOString().slice(0, 10)
                        : typeof field.value === 'string'
                          ? field.value.slice(0, 10)
                          : ''
                    : field.value

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
                            value={displayValue ?? ''}
                            required={false} // Disable native HTML5 required validation; we handle it via react-hook-form
                            onChange={(e) => {
                                if (isDate) {
                                    // Keep the raw "YYYY-MM-DD" string in form state (matching what
                                    // the display logic above and API payloads expect). Storing a
                                    // Date object here gets serialized by axios/JSON.stringify as a
                                    // full ISO datetime (e.g. "2026-08-08T00:00:00.000Z"), which
                                    // fails server-side YYYY-MM-DD validation (e.g. POST /quotas/range).
                                    field.onChange(e.target.value)
                                } else {
                                    field.onChange(e.target.value)
                                }
                            }}
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
