import { Fieldset, CheckboxGroup } from '@chakra-ui/react'
import { Control, Controller, FieldValues } from 'react-hook-form'
import { Checkbox } from '../ui/checkbox'

interface CheckboxOption {
    label: string
    value: string
}

interface ControlledCheckboxGroupProps extends FieldValues {
    control: Control
    options: CheckboxOption[]
}

export const ControlledCheckboxGroup = ({
    control,
    name,
    label,
    options,
    ...props
}: ControlledCheckboxGroupProps) => {
    return (
        <Controller
            name={name}
            control={control}
            defaultValue={props.defaultValue || []}
            render={({ field }) => {
                return (
                    <Fieldset.Root>
                        {label && <Fieldset.Legend>{label}</Fieldset.Legend>}
                        <CheckboxGroup
                            name={field.name}
                            value={field.value || []}
                            onValueChange={field.onChange}
                        >
                            <Fieldset.Content>
                                {options.map((option) => (
                                    <Checkbox
                                        key={option.value}
                                        value={option.value}
                                    >
                                        {option.label}
                                    </Checkbox>
                                ))}
                            </Fieldset.Content>
                        </CheckboxGroup>
                    </Fieldset.Root>
                )
            }}
        />
    )
}
