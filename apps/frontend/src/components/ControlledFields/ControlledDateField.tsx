import { useMemo } from 'react'
import { DatePicker, Field, Portal } from '@chakra-ui/react'
import type { DateValue } from '@chakra-ui/react'
import { LuCalendar } from 'react-icons/lu'
import { Control, FieldValues, RegisterOptions, useController } from 'react-hook-form'
import { toCalendarDate, formatDate, parseDateInput } from './dateFieldUtils'

interface ControlledDateFieldProps {
    control: Control<FieldValues>
    name: string
    label: string
    required?: boolean
    rules?: RegisterOptions
    isDateUnavailable?: (date: DateValue) => boolean
    /** Hide the picker's clear ("x") button — for fields that must always hold a date. */
    hideClearTrigger?: boolean
}

/** A single date picker (dd/mm/yyyy) that reads/writes one RHF field. */
export function ControlledDateField({
    control,
    name,
    label,
    required,
    rules,
    isDateUnavailable,
    hideClearTrigger,
}: ControlledDateFieldProps) {
    const {
        field,
        fieldState: { error },
    } = useController({
        name,
        control,
        rules: {
            required: required ? `${label} הינו שדה חובה` : false,
            ...rules,
        },
    })

    const value = useMemo(() => {
        const date = toCalendarDate(field.value)
        return date ? [date] : []
    }, [field.value])

    return (
        <Field.Root orientation="vertical" invalid={!!error} required={required}>
            <DatePicker.Root
                selectionMode="single"
                value={value}
                format={formatDate}
                parse={parseDateInput}
                // The ambient app locale (he-IL) formats dates with a "." separator, which
                // makes the picker's input mask reject "/" keystrokes even though the
                // placeholder/format/parse above all use dd/mm/yyyy. Pin the picker's own
                // locale to one that separates with "/" so typed input matches what's shown.
                locale="en-GB"
                isDateUnavailable={isDateUnavailable}
                onValueChange={(details: DatePicker.ValueChangeDetails) => {
                    const [date] = details.value
                    field.onChange(date ? date.toString() : '')
                }}
                onOpenChange={(details: DatePicker.OpenChangeDetails) => {
                    if (!details.open) {
                        field.onBlur()
                    }
                }}
                size="sm"
            >
                <DatePicker.Label>
                    {label}
                    {required && <Field.RequiredIndicator />}
                </DatePicker.Label>
                <DatePicker.Control>
                    <DatePicker.Input index={0} placeholder="dd/mm/yyyy" />
                    <DatePicker.IndicatorGroup>
                        <DatePicker.Trigger>
                            <LuCalendar />
                        </DatePicker.Trigger>
                        {!hideClearTrigger && <DatePicker.ClearTrigger />}
                    </DatePicker.IndicatorGroup>
                </DatePicker.Control>
                <Portal>
                    <DatePicker.Positioner>
                        <DatePicker.Content>
                            <DatePicker.View view="day">
                                <DatePicker.Header>
                                    <DatePicker.ViewControl>
                                        <DatePicker.PrevTrigger />
                                        <DatePicker.ViewTrigger>
                                            <DatePicker.RangeText />
                                        </DatePicker.ViewTrigger>
                                        <DatePicker.NextTrigger />
                                    </DatePicker.ViewControl>
                                </DatePicker.Header>
                                <DatePicker.DayTable />
                            </DatePicker.View>
                            <DatePicker.View view="month">
                                <DatePicker.Header>
                                    <DatePicker.ViewControl>
                                        <DatePicker.PrevTrigger />
                                        <DatePicker.ViewTrigger />
                                        <DatePicker.NextTrigger />
                                    </DatePicker.ViewControl>
                                </DatePicker.Header>
                                <DatePicker.MonthTable columns={4} />
                            </DatePicker.View>
                            <DatePicker.View view="year">
                                <DatePicker.Header>
                                    <DatePicker.ViewControl>
                                        <DatePicker.PrevTrigger />
                                        <DatePicker.ViewTrigger />
                                        <DatePicker.NextTrigger />
                                    </DatePicker.ViewControl>
                                </DatePicker.Header>
                                <DatePicker.YearTable columns={4} />
                            </DatePicker.View>
                        </DatePicker.Content>
                    </DatePicker.Positioner>
                </Portal>
            </DatePicker.Root>
            {error && <Field.ErrorText>{error.message}</Field.ErrorText>}
        </Field.Root>
    )
}
