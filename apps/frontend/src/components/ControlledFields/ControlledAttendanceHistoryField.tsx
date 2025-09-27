import { Control, Controller, FieldValues, useWatch } from 'react-hook-form'
import { AttendanceHistoryField } from './AttendanceHistoryField'
import { useRouteContext } from '@/hooks/useRouteContext'

interface ControlledAttendanceHistoryFieldProps extends FieldValues {
    control: Control
    employeeIdField?: string // Name of the field that contains the employee ID
}

export function ControlledAttendanceHistoryField({
    control,
    name,
    label,
    employeeIdField = '_id', // Default field name for employee ID
    maxRecords = 20,
    ...props
}: ControlledAttendanceHistoryFieldProps) {
    // Get route context to determine if we're in edit mode and get the record ID
    const { itemId, formState } = useRouteContext()

    // Watch the employee ID field in the form data
    const formEmployeeId = useWatch({
        control,
        name: employeeIdField,
        defaultValue: props.defaultValue,
    })

    // Use route itemId for edit mode, otherwise use form field or fallback
    const employeeId =
        formState === 'edit' ? itemId : formEmployeeId || props.employeeId

    return (
        <Controller
            name={name}
            control={control}
            defaultValue=""
            render={({ field }) => (
                <AttendanceHistoryField
                    {...field}
                    employeeId={employeeId}
                    label={label}
                    maxRecords={maxRecords}
                />
            )}
        />
    )
}
