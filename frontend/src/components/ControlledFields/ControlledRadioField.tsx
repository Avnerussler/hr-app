import { FC } from 'react'
import { Fieldset, HStack, RadioGroup } from '@chakra-ui/react'
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
    ...props
}) => {
    return (
        <Fieldset.Root>
            <Fieldset.Legend>{label}</Fieldset.Legend>
            <Controller
                name={name}
                control={control}
                render={({ field }) => (
                    <RadioGroup.Root
                        id={id}
                        name={field.name}
                        value={field.value}
                        onValueChange={({ value }) => {
                            field.onChange(value)
                        }}
                        {...props}
                    >
                        <HStack gap="6">
                            {items.map((item) => (
                                <RadioGroup.Item
                                    key={item.value}
                                    value={item.value}
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
                )}
            />
        </Fieldset.Root>
    )
}
