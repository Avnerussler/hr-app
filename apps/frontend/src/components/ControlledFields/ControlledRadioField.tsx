import { FC } from 'react'
import { Field, Fieldset, HStack, RadioGroup } from '@chakra-ui/react'
import { Control, Controller, FieldValues } from 'react-hook-form'

interface ControlledRadioFieldProps extends FieldValues {
    control: Control
    items: { value: string; label: string }[]
}

export const ControlledRadioField: FC<ControlledRadioFieldProps> = ({
    name,
    control,
    items,
    id,
    label,
    required,
    ...props
}) => {
    return (
        <Controller
            name={name}
            control={control}
            rules={{
                required: required ? `${label} הוא שדה חובה` : false,
            }}
            render={({ field, fieldState: { error } }) => (
                <Field.Root invalid={!!error}>
                    <Fieldset.Root>
                        <Fieldset.Legend>{label}</Fieldset.Legend>
                        <RadioGroup.Root
                            id={id}
                            name={field.name}
                            value={field.value != null ? String(field.value) : ''}
                            onValueChange={({ value }) => {
                                field.onChange(value)
                            }}
                            {...props}
                        >
                            <HStack gap="6">
                                {items.map((item) => (
                                    <RadioGroup.Item
                                        key={String(item.value)}
                                        value={String(item.value)}
                                    >
                                        <RadioGroup.ItemHiddenInput
                                            onBlur={field.onBlur}
                                        />
                                        <RadioGroup.ItemIndicator />
                                        <RadioGroup.ItemText>
                                            {item.label}
                                        </RadioGroup.ItemText>
                                    </RadioGroup.Item>
                                ))}
                            </HStack>
                        </RadioGroup.Root>
                    </Fieldset.Root>
                    {error && <Field.ErrorText>{error.message}</Field.ErrorText>}
                </Field.Root>
            )}
        />
    )
}
