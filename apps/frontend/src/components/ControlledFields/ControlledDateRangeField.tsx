import { useMemo } from 'react'
import { DatePicker, Field, Portal, parseDate } from '@chakra-ui/react'
import type { DateValue } from '@chakra-ui/react'
import { LuCalendar } from 'react-icons/lu'
import { Control, FieldValues, useController } from 'react-hook-form'

interface ControlledDateRangeFieldProps {
    control: Control<FieldValues>
    startName: string
    endName: string
    label: string
    required?: boolean
    isDateUnavailable?: (date: DateValue) => boolean
}

const toCalendarDate = (value: unknown): DateValue | null => {
    if (typeof value === 'string' && value) {
        try {
            return parseDate(value.slice(0, 10))
        } catch {
            return null
        }
    }
    if (value instanceof Date && !isNaN(value.getTime())) {
        try {
            return parseDate(value.toISOString().slice(0, 10))
        } catch {
            return null
        }
    }
    return null
}

// dd/mm/yyyy display format — see https://chakra-ui.com/docs/components/date-picker#localization
const formatDate = (date: DateValue) => {
    const day = date.day.toString().padStart(2, '0')
    const month = date.month.toString().padStart(2, '0')
    return `${day}/${month}/${date.year}`
}

const parseDateInput = (value: string): DateValue | undefined => {
    const match = value.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/)
    if (!match) return undefined
    const [, day, month, year] = match
    try {
        return parseDate(
            `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`
        )
    } catch {
        return undefined
    }
}

/** A generic date-range picker (dd/mm/yyyy) that reads/writes two separate RHF fields (startName, endName). */
export function ControlledDateRangeField({
    control,
    startName,
    endName,
    label,
    required,
    isDateUnavailable,
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
        <Field.Root orientation="vertical" invalid={!!error} required={required}>
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
                        <DatePicker.ClearTrigger />
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
