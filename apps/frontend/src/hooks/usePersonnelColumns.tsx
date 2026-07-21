import { useMemo } from 'react'
import { createColumnHelper } from '@tanstack/react-table'
import { format } from 'date-fns'
import { VStack, HStack, Text, Box } from '@chakra-ui/react'
import { LuChevronUp, LuChevronDown, LuChevronsUpDown } from 'react-icons/lu'
import { RESERVE_CATEGORY_LABELS, STUDIO_ROLE_LABELS } from '@hr-app/shared-types'
import { EntityLink } from '@/components/common/EntityLink'
import { PersonnelRecord } from './queries/usePersonnelQueries'
import type { Column } from '@tanstack/react-table'
import type { KeyboardEvent } from 'react'

const columnHelper = createColumnHelper<PersonnelRecord>()

function SortableHeader({ label, column }: { label: string; column: Column<PersonnelRecord, unknown> }) {
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

export function usePersonnelColumns() {
    return useMemo(
        () => [
            columnHelper.accessor('firstName', {
                id: 'firstName',
                header: ({ column }) => <SortableHeader label="שם פרטי" column={column} />,
                enableSorting: true,
                sortDescFirst: false,
                cell: (info) => <Text color="foreground">{info.getValue()}</Text>,
            }),
            columnHelper.accessor('lastName', {
                id: 'lastName',
                header: ({ column }) => <SortableHeader label="שם משפחה" column={column} />,
                enableSorting: true,
                sortDescFirst: false,
                cell: (info) => <Text color="foreground">{info.getValue()}</Text>,
            }),
            columnHelper.accessor('personalNumber', {
                id: 'personalNumber',
                header: ({ column }) => <SortableHeader label="מספר אישי" column={column} />,
                enableSorting: true,
                sortDescFirst: false,
                cell: (info) => <Text color="foreground">{info.getValue()}</Text>,
            }),
            columnHelper.accessor('reserveCategory', {
                id: 'reserveCategory',
                header: ({ column }) => <SortableHeader label="סוג העסקה" column={column} />,
                enableSorting: true,
                sortDescFirst: false,
                cell: (info) => {
                    const val = info.getValue()
                    return <Text color="foreground">{val ? RESERVE_CATEGORY_LABELS[val] : '—'}</Text>
                },
            }),
            columnHelper.accessor('directBoss', {
                id: 'directBoss',
                header: ({ column }) => <SortableHeader label="מנהל ישיר" column={column} />,
                enableSorting: true,
                sortDescFirst: false,
                cell: (info) => <Text color="foreground">{info.getValue() || '—'}</Text>,
            }),
            columnHelper.accessor((row) => row.assignedProjects, {
                id: 'assignedProjects',
                header: ({ column }) => <SortableHeader label="שיוך לפרויקט" column={column} />,
                enableSorting: true,
                sortDescFirst: false,
                cell: (info) => {
                    const project = info.getValue()
                    if (!project) return <Text color="foreground">—</Text>
                    return (
                        <EntityLink formName="project_management" itemId={project._id}>
                            {project.projectName}
                        </EntityLink>
                    )
                },
            }),
            columnHelper.accessor('studioRole', {
                id: 'studioRole',
                header: ({ column }) => <SortableHeader label="תפקיד בסטודיו" column={column} />,
                enableSorting: true,
                sortDescFirst: false,
                cell: (info) => {
                    const val = info.getValue()
                    return <Text color="foreground">{val ? STUDIO_ROLE_LABELS[val] : '—'}</Text>
                },
            }),
            columnHelper.accessor('isActive', {
                id: 'isActive',
                header: ({ column }) => <SortableHeader label="סטטוס" column={column} />,
                enableSorting: true,
                sortDescFirst: false,
                cell: (info) => <Text color="foreground">{info.getValue() ? 'פעיל' : 'לא פעיל'}</Text>,
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
