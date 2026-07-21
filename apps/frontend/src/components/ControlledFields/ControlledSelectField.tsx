import { RefObject } from 'react'
import { createListCollection, Field } from '@chakra-ui/react'
import {
    SelectContent,
    SelectItem,
    SelectLabel,
    SelectRoot,
    SelectTrigger,
    SelectValueText,
} from '@/components/ui/select'

import { Control, Controller, FieldValues } from 'react-hook-form'

interface ControlledSelectFieldProps extends FieldValues {
    control: Control
    contentRef?: RefObject<HTMLElement>
}
export const ControlledSelectField = ({
    control,
    name,
    options,
    required,
    label,
    ...props
}: ControlledSelectFieldProps) => {
    const frameworks = (options: { label: string; value: string }[]) =>
        createListCollection({
            items: options,
        })

    return (
        <Controller
            name={name}
            control={control}
            rules={{ required: required ? `${label} הוא שדה חובה` : false }}
            render={({ field, fieldState: { error } }) => {
                return (
                    <Field.Root
                        data-field-name={name}
                        orientation="vertical"
                        invalid={!!error}
                        required={false}
                    >
                        <SelectRoot
                            collection={frameworks(options)}
                            size="sm"
                            {...props}
                            value={field.value ? [field.value] : []}
                            onValueChange={({ items }) =>
                                field.onChange(items[0]?.value || '')
                            }
                            onInteractOutside={() => field.onBlur()}
                        >
                            <SelectLabel>
                                {label}
                                <Field.RequiredIndicator />
                            </SelectLabel>
                            <SelectTrigger>
                                <SelectValueText
                                    placeholder={
                                        field.value
                                            ? frameworks(options).items.filter(
                                                  (option) =>
                                                      option.value ===
                                                      field.value
                                              )[0]?.label
                                            : props.placeholder
                                    }
                                />
                            </SelectTrigger>
                            <SelectContent portalled={false}>
                                {frameworks(options).items.map((option) => (
                                    <SelectItem
                                        item={option}
                                        key={option.value}
                                    >
                                        {option.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </SelectRoot>
                        {error && (
                            <Field.ErrorText>{error.message}</Field.ErrorText>
                        )}
                    </Field.Root>
                )
            }}
        />
    )
}
