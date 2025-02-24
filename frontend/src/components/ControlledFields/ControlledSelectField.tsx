import {
    createListCollection,
    Field,
    SelectContent,
    SelectItem,
    SelectLabel,
    SelectRoot,
    SelectTrigger,
    SelectValueText,
} from '@chakra-ui/react'
import { Control, Controller, FieldValues } from 'react-hook-form'

interface ControlledSelectFieldProps extends FieldValues {
    control: Control
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
                        onValueChange={({ items }) => field.onChange(items)}
                        onInteractOutside={() => field.onBlur()}
                    >
                        <SelectLabel>{props.label}</SelectLabel>
                        <SelectTrigger>
                            <SelectValueText placeholder={props.placeholder} />
                        </SelectTrigger>
                        <SelectContent>
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
