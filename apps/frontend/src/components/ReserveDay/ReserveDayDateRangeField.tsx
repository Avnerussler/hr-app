import { useEffect, useMemo } from 'react'
import { parseDate } from '@chakra-ui/react'
import type { DateValue } from '@chakra-ui/react'
import {
    Control,
    FieldValues,
    useController,
    useFormContext,
} from 'react-hook-form'
import { useEmployeeReservedRangesQuery } from '@/hooks/queries/useReserveDayQueries'
import { ControlledDateRangeField } from '@/components/ControlledFields/ControlledDateRangeField'

interface ReserveDayDateRangeFieldProps {
    control: Control<FieldValues>
    startName: string
    endName: string
    label: string
    required?: boolean
    /** The current record's own id, excluded from the reserved-days lookup when editing. */
    excludeId?: string
}

/** A single date-range picker that reads/writes two separate RHF fields (startName, endName). */
export function ReserveDayDateRangeField({
    control,
    startName,
    endName,
    label,
    required,
    excludeId,
}: ReserveDayDateRangeFieldProps) {
    const {
        setError,
        clearErrors,
        formState: { isSubmitted },
    } = useFormContext()
    const {
        field: startField,
        fieldState: { error: startError },
    } = useController({ name: startName, control })
    const {
        field: endField,
        fieldState: { error: endError },
    } = useController({ name: endName, control })
    const employeeId: string | null =
        useController({ name: 'employeeName', control }).field.value || null

    const { data: reservedRanges = [] } = useEmployeeReservedRangesQuery(
        employeeId,
        excludeId
    )

    const reservedDates = useMemo(() => {
        const dates = new Set<string>()
        for (const range of reservedRanges) {
            const start = parseDate(range.startDate.slice(0, 10))
            const end = parseDate(range.endDate.slice(0, 10))
            let cursor = start
            while (cursor.compare(end) <= 0) {
                dates.add(cursor.toString())
                cursor = cursor.add({ days: 1 })
            }
        }
        return dates
    }, [reservedRanges])

    // Re-check the currently selected range against the (possibly newly loaded) reserved
    // dates whenever the employee, the reserved ranges, or the selected range itself change —
    // covers picking dates first and then switching to an employee who is already booked on them.
    // Also enforces "required" with the field's own label (the Zod resolver used for schema
    // validation only knows the generic startDate/endDate error copy, not this label).
    useEffect(() => {
        const start = startField.value
            ? parseDate(String(startField.value).slice(0, 10))
            : null
        const end = endField.value
            ? parseDate(String(endField.value).slice(0, 10))
            : null
        const hasRange = start !== null && end !== null
        const missing = required && isSubmitted && !hasRange

        let conflict = false
        if (!missing && hasRange) {
            let cursor = start
            while (cursor.compare(end) <= 0) {
                if (reservedDates.has(cursor.toString())) {
                    conflict = true
                    break
                }
                cursor = cursor.add({ days: 1 })
            }
        }

        if (missing) {
            // Set on both fields — overrides the Zod resolver's generic startDate message
            // (attached during the same submit cycle) with this field's own label.
            if (startError?.type !== 'required') {
                setError(startName, {
                    type: 'required',
                    message: `${label} הינו שדה חובה`,
                })
            }
            if (endError?.type !== 'required') {
                setError(endName, {
                    type: 'required',
                    message: `${label} הינו שדה חובה`,
                })
            }
        } else if (conflict) {
            if (endError?.type !== 'reservedConflict') {
                setError(endName, {
                    type: 'reservedConflict',
                    message: 'הטווח שנבחר חופף לימים תפוסים עבור עובד זה',
                })
            }
        } else {
            if (startError?.type === 'required') clearErrors(startName)
            if (
                endError?.type === 'reservedConflict' ||
                endError?.type === 'required'
            )
                clearErrors(endName)
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [
        startField.value,
        endField.value,
        reservedDates,
        startName,
        endName,
        required,
        label,
        isSubmitted,
    ])

    return (
        <ControlledDateRangeField
            control={control}
            startName={startName}
            endName={endName}
            label={label}
            required={required}
            isDateUnavailable={(date: DateValue) =>
                reservedDates.has(date.toString())
            }
        />
    )
}
