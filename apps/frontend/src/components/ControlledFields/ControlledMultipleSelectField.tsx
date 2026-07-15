import { FC, RefObject } from 'react'
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
// import ContentRefContext from '@/providers/ContentRefContext'

interface ControlledMultipleSelectFieldProps extends FieldValues {
    control: Control
    contentRef?: RefObject<HTMLElement>
}

export const ControlledMultipleSelectField: FC<
    ControlledMultipleSelectFieldProps
> = ({ control, name, options, required, label, ...props }) => {
    const frameworks = (options: { label: string; value: string }[]) =>
        createListCollection({
            items: options,
        })
    // const contentRef = useContext(ContentRefContext)

    return (
        <Controller
            name={name}
            control={control}
            rules={{ required: required ? `${label} הוא שדה חובה` : false }}
            render={({ field, fieldState: { error } }) => {
                return (
                    <Field.Root orientation="vertical" invalid={!!error}>
                        <SelectRoot
                            multiple
                            value={field.value ? field.value : []}
                            collection={frameworks(options)}
                            size="sm"
                            {...props}
                            onValueChange={({ items }) =>
                                field.onChange(items.map((item) => item.value))
                            }
                            onInteractOutside={() => field.onBlur()}
                        >
                            <SelectLabel>{label}</SelectLabel>
                            <SelectTrigger>
                                <SelectValueText
                                    placeholder={props.placeholder}
                                />
                            </SelectTrigger>
                            <SelectContent
                                // portalRef={
                                //     contentRef as React.RefObject<HTMLDivElement>
                                // }
                                portalled={false}
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
                        {error && <Field.ErrorText>{error.message}</Field.ErrorText>}
                    </Field.Root>
                )
            }}
        />
    )
}
