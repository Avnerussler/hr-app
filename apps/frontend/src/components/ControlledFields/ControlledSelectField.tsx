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

import { Control, Controller, FieldValues, Path } from 'react-hook-form'
// import ContentRefContext from '@/providers/ContentRefContext'

interface ControlledSelectFieldProps<T extends FieldValues = FieldValues> {
    control: Control<T>
    name: Path<T>
    options: { label: string; value: string }[]
    label?: string
    placeholder?: string
    size?: 'xs' | 'sm' | 'md' | 'lg'
    rules?: any
    contentRef?: RefObject<HTMLElement>
    [key: string]: any
}
export const ControlledSelectField = <T extends FieldValues = FieldValues>({
    control,
    name,
    options,
    rules,
    ...props
}: ControlledSelectFieldProps<T>) => {
    const frameworks = (options: { label: string; value: string }[]) =>
        createListCollection({
            items: options,
        })
    // const contentRef = useContext(ContentRefContext)

    return (
        <Controller
            name={name}
            control={control}
            defaultValue={props.defaultValue}
            rules={rules}
            render={({ field, fieldState: { error } }) => {
                return (
                    <Field.Root orientation="vertical" invalid={!!error}>
                        <SelectRoot
                            collection={frameworks(options)}
                            size={props.size || "sm"}
                            value={field.value ? [field.value] : []}
                            onValueChange={({ items }) =>
                                field.onChange(items[0]?.value || '')
                            }
                            onInteractOutside={() => field.onBlur()}
                        >
                            {props.label && <SelectLabel>{props.label}</SelectLabel>}
                            <SelectTrigger>
                                <SelectValueText
                                    placeholder={props.placeholder}
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
