import { useMemo } from 'react'
import { createColumnHelper } from '@tanstack/react-table'
import { format } from 'date-fns'
import { VStack, HStack, Text, Box } from '@chakra-ui/react'
import { LuChevronUp, LuChevronDown, LuChevronsUpDown } from 'react-icons/lu'
import { EntityLink } from '@/components/common/EntityLink'
import { SettingLabelCell } from '@/components/common/SettingLabelCell'
import { ReserveDayStatusCell } from '@/components/ReserveDay/ReserveDayStatusCell'
import { ReserveDayRecord } from './queries/useReserveDayQueries'
import type { Column } from '@tanstack/react-table'
import type { KeyboardEvent } from 'react'

const columnHelper = createColumnHelper<ReserveDayRecord>()

function SortableHeader({ label, column }: { label: string; column: Column<ReserveDayRecord, unknown> }) {
    const canSort = column.getCanSort()
    const sortState = column.getIsSorted()
    const sortLabel = sortState === 'asc' ? 'ascending' : sortState === 'desc' ? 'descending' : 'not sorted'

    return (
        <VStack align="start" gap={2} w="full">
            <HStack
                justify="flex-start"
                gap={1}
                w="full"
                {...(canSort && {
                    role: 'button',
                    tabIndex: 0,
                    cursor: 'pointer',
                    'aria-label': `Sort by ${label}, currently ${sortLabel}`,
                    onClick: () => column.toggleSorting(),
                    onKeyDown: (e: KeyboardEvent) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault()
                            column.toggleSorting()
                        }
                    },
                })}
            >
                <Text fontWeight="medium" color="foreground" fontSize="sm">
                    {label}
                </Text>
                {canSort && (
                    <Box color={sortState ? 'foreground' : 'muted.foreground'} opacity={sortState ? 1 : 0.5} display="flex" alignItems="center">
                        {sortState === 'asc' ? <LuChevronUp size="14px" /> : sortState === 'desc' ? <LuChevronDown size="14px" /> : <LuChevronsUpDown size="14px" />}
                    </Box>
                )}
            </HStack>
        </VStack>
    )
}

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
                header: ({ column }) => <SortableHeader label="שם העובד" column={column} />,
                enableSorting: true,
                sortDescFirst: false,
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
                header: ({ column }) => <SortableHeader label="סוג צו" column={column} />,
                enableSorting: true,
                sortDescFirst: false,
                cell: (info) => <SettingLabelCell settingKey="orderType" value={info.getValue()} />,
            }),
            columnHelper.accessor('fundingSource', {
                id: 'fundingSource',
                header: ({ column }) => <SortableHeader label="מקור מימון" column={column} />,
                enableSorting: true,
                sortDescFirst: false,
                cell: (info) => <SettingLabelCell settingKey="fundingSource" value={info.getValue()} />,
            }),
            columnHelper.accessor('requestStatus', {
                id: 'requestStatus',
                header: ({ column }) => <SortableHeader label="סטטוס בקשה" column={column} />,
                enableSorting: true,
                sortDescFirst: false,
                cell: (info) => <ReserveDayStatusCell id={info.row.original._id} status={info.getValue()} />,
            }),
            columnHelper.accessor('startDate', {
                id: 'startDate',
                header: ({ column }) => <SortableHeader label="תאריך התחלה" column={column} />,
                enableSorting: true,
                sortDescFirst: false,
                cell: (info) => <Text color="foreground">{formatDate(info.getValue())}</Text>,
            }),
            columnHelper.accessor('endDate', {
                id: 'endDate',
                header: ({ column }) => <SortableHeader label="תאריך סיום" column={column} />,
                enableSorting: true,
                sortDescFirst: false,
                cell: (info) => <Text color="foreground">{formatDate(info.getValue())}</Text>,
            }),
            columnHelper.accessor('createdAt', {
                id: 'createdAt',
                header: ({ column }) => <SortableHeader label="Created At" column={column} />,
                enableSorting: true,
                sortDescFirst: false,
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
        ],
        []
    )
}
