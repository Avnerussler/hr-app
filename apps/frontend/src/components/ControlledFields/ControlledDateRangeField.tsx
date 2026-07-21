import { useMemo } from 'react'
import { DatePicker, Field, Portal } from '@chakra-ui/react'
import type { DateValue } from '@chakra-ui/react'
import { LuCalendar } from 'react-icons/lu'
import { Control, FieldValues, useController } from 'react-hook-form'
import { toCalendarDate, formatDate, parseDateInput } from './dateFieldUtils'

interface ControlledDateRangeFieldProps {
    control: Control<FieldValues>
    startName: string
    endName: string
    label?: string
    required?: boolean
    isDateUnavailable?: (date: DateValue) => boolean
    /** Hide the picker's clear ("x") button — for fields that must always hold a range. */
    hideClearTrigger?: boolean
}

/** A generic date-range picker (dd/mm/yyyy) that reads/writes two separate RHF fields (startName, endName). */
export function ControlledDateRangeField({
    control,
    startName,
    endName,
    label,
    required,
    isDateUnavailable,
    hideClearTrigger,
}: ControlledDateRangeFieldProps) {
    const {
        field: startField,
        fieldState: { error: startError },
    } = useController({
        name: startName,
        control,
        rules: { required: required ? `${label} הינו שדה חובה` : false },
    })
    const {
        field: endField,
        fieldState: { error: endError },
    } = useController({
        name: endName,
        control,
        rules: { required: required ? `${label} הינו שדה חובה` : false },
    })

    const value = useMemo(() => {
        const start = toCalendarDate(startField.value)
        const end = toCalendarDate(endField.value)
        return [start, end].filter((d): d is DateValue => d !== null)
    }, [startField.value, endField.value])

    const error = startError || endError

    return (
        <Field.Root
            orientation="vertical"
            invalid={!!error}
            required={required}
        >
            <DatePicker.Root
                selectionMode="range"
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
                    const [start, end] = details.value
                    startField.onChange(start ? start.toString() : '')
                    endField.onChange(end ? end.toString() : '')
                }}
                onOpenChange={(details: DatePicker.OpenChangeDetails) => {
                    if (!details.open) {
                        startField.onBlur()
                        endField.onBlur()
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
                    <DatePicker.Input index={1} placeholder="dd/mm/yyyy" />
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
