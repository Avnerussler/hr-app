import { useMemo } from 'react'
import { createColumnHelper } from '@tanstack/react-table'
import { format } from 'date-fns'
import { Text } from '@chakra-ui/react'
import { EntityLink } from '@/components/common/EntityLink'
import { SettingLabelCell } from '@/components/common/SettingLabelCell'
import { TruncatedText } from '@/components/common/TruncatedText'
import { SortableHeader } from '@/components/common/Table/components/SortableHeader'
import { ReserveDayStatusCell } from '@/components/ReserveDay/ReserveDayStatusCell'
import { ReserveDayRecord } from './queries/useReserveDayQueries'
import type { Column } from '@tanstack/react-table'

const columnHelper = createColumnHelper<ReserveDayRecord>()

/** Fields that exist on the ReserveDay model but have no dedicated column above —
 *  exposed via the column-visibility picker (hidden by default) so the user can
 *  add any model field to the table, not just the ones shown out of the box. */
const EXTRA_TEXT_FIELDS: { id: keyof ReserveDayRecord; label: string }[] = [
    { id: 'fundingName', label: 'שם מקור מימון' },
    { id: 'notes', label: 'הערות' },
]

const EXTRA_LABEL_FIELDS: {
    id: keyof ReserveDayRecord
    label: string
    settingKey: string
}[] = [
    {
        id: 'baseAccessApproval',
        label: 'אישור כניסה לבסיס',
        settingKey: 'baseAccessApproval',
    },
]

export const RESERVE_DAY_EXTRA_COLUMN_IDS = [
    ...EXTRA_TEXT_FIELDS.map((f) => f.id as string),
    ...EXTRA_LABEL_FIELDS.map((f) => f.id as string),
]

function formatDate(val: string | undefined) {
    if (!val) return ''
    try {
        return format(new Date(val), 'dd/MM/yyyy')
    } catch {
        return String(val)
    }
}

export function useReserveDayColumns() {
    return useMemo(
        () => [
            columnHelper.accessor((row) => row.employeeName, {
                id: 'employeeName',
                header: ({ column }) => (
                    <SortableHeader label="שם העובד" column={column} />
                ),
                enableSorting: true,
                sortDescFirst: false,
                meta: { label: 'שם העובד' },
                cell: (info) => {
                    const employee = info.getValue()
                    if (!employee) return <Text color="foreground">—</Text>
                    return (
                        <EntityLink formName="personnel" itemId={employee._id}>
                            {employee.firstName} {employee.lastName}
                        </EntityLink>
                    )
                },
            }),
            columnHelper.accessor('orderType', {
                id: 'orderType',
                header: ({ column }) => (
                    <SortableHeader label="סוג צו" column={column} />
                ),
                enableSorting: true,
                sortDescFirst: false,
                meta: { label: 'סוג צו' },
                cell: (info) => (
                    <SettingLabelCell
                        settingKey="orderType"
                        value={info.getValue()}
                    />
                ),
            }),
            columnHelper.accessor('fundingSource', {
                id: 'fundingSource',
                header: ({ column }) => (
                    <SortableHeader label="מקור מימון" column={column} />
                ),
                enableSorting: true,
                sortDescFirst: false,
                meta: { label: 'מקור מימון' },
                cell: (info) => (
                    <SettingLabelCell
                        settingKey="fundingSource"
                        value={info.getValue()}
                    />
                ),
            }),
            columnHelper.accessor('requestStatus', {
                id: 'requestStatus',
                header: ({ column }) => (
                    <SortableHeader label="סטטוס בקשה" column={column} />
                ),
                enableSorting: true,
                sortDescFirst: false,
                meta: { label: 'סטטוס בקשה' },
                cell: (info) => (
                    <ReserveDayStatusCell
                        id={info.row.original._id}
                        status={info.getValue()}
                    />
                ),
            }),
            columnHelper.accessor('startDate', {
                id: 'startDate',
                header: ({ column }) => (
                    <SortableHeader label="תאריך התחלה" column={column} />
                ),
                enableSorting: true,
                sortDescFirst: false,
                meta: { label: 'תאריך התחלה' },
                cell: (info) => (
                    <Text color="foreground">
                        {formatDate(info.getValue())}
                    </Text>
                ),
            }),
            columnHelper.accessor('endDate', {
                id: 'endDate',
                header: ({ column }) => (
                    <SortableHeader label="תאריך סיום" column={column} />
                ),
                enableSorting: true,
                sortDescFirst: false,
                meta: { label: 'תאריך סיום' },
                cell: (info) => (
                    <Text color="foreground">
                        {formatDate(info.getValue())}
                    </Text>
                ),
            }),
            columnHelper.accessor('createdAt', {
                id: 'createdAt',
                header: ({ column }) => (
                    <SortableHeader label="Created At" column={column} />
                ),
                enableSorting: true,
                sortDescFirst: false,
                meta: { label: 'Created At' },
                cell: (info) => {
                    const val = info.getValue()
                    if (!val) return ''
                    try {
                        return format(new Date(val), 'dd/MM/yyyy HH:mm')
                    } catch {
                        return String(val)
                    }
                },
            }),
            ...EXTRA_TEXT_FIELDS.map(({ id, label }) =>
                columnHelper.accessor((row) => row[id], {
                    id: id as string,
                    header: ({
                        column,
                    }: {
                        column: Column<ReserveDayRecord, unknown>
                    }) => <SortableHeader label={label} column={column} />,
                    enableSorting: true,
                    sortDescFirst: false,
                    meta: { label },
                    cell: (info) => (
                        <TruncatedText>
                            {String(info.getValue() ?? '')}
                        </TruncatedText>
                    ),
                })
            ),
            ...EXTRA_LABEL_FIELDS.map(({ id, label, settingKey }) =>
                columnHelper.accessor((row) => row[id], {
                    id: id as string,
                    header: ({
                        column,
                    }: {
                        column: Column<ReserveDayRecord, unknown>
                    }) => <SortableHeader label={label} column={column} />,
                    enableSorting: true,
                    sortDescFirst: false,
                    meta: { label },
                    cell: (info) => (
                        <SettingLabelCell
                            settingKey={settingKey}
                            value={info.getValue() as string | null}
                        />
                    ),
                })
            ),
        ],
        []
    )
}
