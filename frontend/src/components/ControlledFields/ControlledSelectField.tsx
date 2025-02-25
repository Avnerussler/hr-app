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
import { RefObject } from 'react'

interface ControlledSelectFieldProps extends FieldValues {
    control: Control
    contentRef?: RefObject<HTMLElement>
}
export const ControlledSelectField = ({
    control,
    name,
    options,
    contentRef,
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
            defaultValue={props.defaultValue}
            render={({ field }) => (
                <Field.Root orientation="vertical">
                    <SelectRoot
                        collection={frameworks(options)}
                        size="sm"
                        {...field}
                        {...props}
                        onValueChange={({ items }) =>
                            field.onChange(items[0].label)
                        }
                        onInteractOutside={() => field.onBlur()}
                    >
                        <SelectLabel>{props.label}</SelectLabel>
                        <SelectTrigger>
                            <SelectValueText placeholder={props.placeholder} />
                        </SelectTrigger>
                        <SelectContent portalRef={contentRef}>
                            {frameworks(options).items.map((option) => (
                                <SelectItem item={option} key={option.value}>
                                    {option.label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </SelectRoot>
                </Field.Root>
            )}
        />
    )
}
