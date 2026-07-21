import { useMemo } from 'react'
import { createColumnHelper } from '@tanstack/react-table'
import { format } from 'date-fns'
import { VStack, HStack, Text, Box } from '@chakra-ui/react'
import { LuChevronUp, LuChevronDown, LuChevronsUpDown } from 'react-icons/lu'
import { EntityLink } from '@/components/common/EntityLink'
import { SettingLabelCell } from '@/components/common/SettingLabelCell'
import { ProjectRecord } from './queries/useProjectQueries'
import type { Column } from '@tanstack/react-table'
import type { KeyboardEvent } from 'react'

const columnHelper = createColumnHelper<ProjectRecord>()

function SortableHeader({ label, column }: { label: string; column: Column<ProjectRecord, unknown> }) {
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

export function useProjectColumns() {
    return useMemo(
        () => [
            columnHelper.accessor('projectName', {
                id: 'projectName',
                header: ({ column }) => <SortableHeader label="שם הפרויקט" column={column} />,
                enableSorting: true,
                sortDescFirst: false,
                cell: (info) => <Text color="foreground">{info.getValue()}</Text>,
            }),
            columnHelper.accessor((row) => row.projectManager, {
                id: 'projectManager',
                header: ({ column }) => <SortableHeader label="מנהל פרויקט" column={column} />,
                enableSorting: true,
                sortDescFirst: false,
                cell: (info) => {
                    const manager = info.getValue()
                    if (!manager) return <Text color="foreground">—</Text>
                    return (
                        <EntityLink formName="personnel" itemId={manager._id}>
                            {manager.firstName} {manager.lastName}
                        </EntityLink>
                    )
                },
            }),
            columnHelper.accessor((row) => row.projectPersonnel, {
                id: 'projectPersonnel',
                header: ({ column }) => <SortableHeader label="אנשי צוות בפרויקט" column={column} />,
                enableSorting: true,
                sortDescFirst: false,
                cell: (info) => {
                    const count = info.getValue()?.length ?? 0
                    return <Text color="foreground">{count} selected</Text>
                },
            }),
            columnHelper.accessor('projectStatus', {
                id: 'projectStatus',
                header: ({ column }) => <SortableHeader label="סטטוס הפרוייקט" column={column} />,
                enableSorting: true,
                sortDescFirst: false,
                cell: (info) => <SettingLabelCell settingKey="projectStatus" value={info.getValue()} />,
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
