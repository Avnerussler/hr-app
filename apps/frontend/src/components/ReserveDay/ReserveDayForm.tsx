import { Control, FieldValues } from 'react-hook-form'
import { VStack } from '@chakra-ui/react'
import { ControlledInputField } from '@/components/ControlledFields/ControlledInputField'
import { ControlledSelectField } from '@/components/ControlledFields/ControlledSelectField'
import { ControlledRadioField } from '@/components/ControlledFields/ControlledRadioField'
import { ControlledTextareaField } from '@/components/ControlledFields/ControlledTextareaField'
import { EmployeeSelect } from './EmployeeSelect'
import { VehicleStatusDisplay } from './VehicleStatusDisplay'
import { ReserveDayDateRangeField } from './ReserveDayDateRangeField'
import { ReserveDayFormValues, ReserveDaySelectFieldKey } from './reserveDaySchema'

interface ReserveDayFormSectionProps {
    control: Control<ReserveDayFormValues>
    /** The current record's own id (edit mode), excluded from the reserved-days lookup used to block already-reserved days. */
    excludeId?: string
    selectOptions: Record<ReserveDaySelectFieldKey, { value: string; label: string }[]>
}

function useUntypedControl(control: Control<ReserveDayFormValues>) {
    return control as unknown as Control<FieldValues>
}

export function ReserveDayInfoSection({
    control: typedControl,
    excludeId,
    selectOptions,
}: ReserveDayFormSectionProps) {
    const control = useUntypedControl(typedControl)
    return (
        <VStack gap={4} align="stretch" p={6} pb={4}>
            <EmployeeSelect
                control={control}
                name="employeeName"
                label="שם העובד"
                placeholder="חפש ובחר עובד"
                required
            />
            <ReserveDayDateRangeField
                control={control}
                startName="startDate"
                endName="endDate"
                label="תקופת שירות"
                excludeId={excludeId}
                required
            />
            <ControlledSelectField
                control={control}
                name="fundingSource"
                label="מקור מימון"
                placeholder="בחר מקור מימון"
                options={selectOptions.fundingSource}
            />
            <ControlledInputField
                control={control}
                name="fundingName"
                id="fundingName"
                type="text"
                label="שם גורם ממן"
                placeholder="הזן שם גורם ממן"
            />
            <ControlledRadioField
                control={control}
                name="orderType"
                id="orderType"
                label="סוג צו"
                items={selectOptions.orderType}
                required
            />
            <ControlledSelectField
                control={control}
                name="requestStatus"
                label="סטטוס בקשה"
                placeholder="בחר סטטוס בקשה"
                options={selectOptions.requestStatus}
                required
            />
            <ControlledSelectField
                control={control}
                name="baseAccessApproval"
                label="אישור כניסה לבסיס"
                placeholder="בחר סטטוס אישור"
                options={selectOptions.baseAccessApproval}
            />
            <VehicleStatusDisplay
                control={control}
                sourceField="employeeName"
                label="סטטוס רכב"
            />
            <ControlledTextareaField
                control={control}
                name="notes"
                id="notes"
                label="הערות"
                placeholder="הזן הערות נוספות"
            />
        </VStack>
    )
}
