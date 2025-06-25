import { RefObject, useContext } from 'react'
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
import ContentRefContext from '@/providers/ContentRefContext'

interface ControlledSelectFieldProps extends FieldValues {
    control: Control
    contentRef?: RefObject<HTMLElement>
}
export const ControlledSelectField = ({
    control,
    name,
    options,
    ...props
}: ControlledSelectFieldProps) => {
    const frameworks = (options: { label: string; value: string }[]) =>
        createListCollection({
            items: options,
        })
    const contentRef = useContext(ContentRefContext)

    return (
        <Controller
            name={name}
            control={control}
            defaultValue={props.defaultValue}
            render={({ field }) => {
                return (
                    <Field.Root orientation="vertical">
                        <SelectRoot
                            collection={frameworks(options)}
                            size="sm"
                            {...field}
                            {...props}
                            value={field.value}
                            onValueChange={({ items }) =>
                                field.onChange(items[0].value)
                            }
                            onInteractOutside={() => field.onBlur()}
                        >
                            <SelectLabel>{props.label}</SelectLabel>
                            <SelectTrigger>
                                <SelectValueText
                                    placeholder={
                                        field.value
                                            ? frameworks(options).items.filter(
                                                  (option) =>
                                                      option.value ===
                                                      field.value
                                              )[0].label
                                            : props.placeholder
                                    }
                                />
                            </SelectTrigger>
                            <SelectContent
                                portalRef={
                                    contentRef as RefObject<HTMLDivElement>
                                }
                            >
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
                    </Field.Root>
                )
            }}
        />
    )
}
