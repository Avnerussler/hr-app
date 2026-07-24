import { useMemo } from 'react'
import { createColumnHelper } from '@tanstack/react-table'
import { format } from 'date-fns'
import { Text } from '@chakra-ui/react'
import { EntityLink } from '@/components/common/EntityLink'
import { SettingLabelCell } from '@/components/common/SettingLabelCell'
import { TruncatedText } from '@/components/common/TruncatedText'
import { SortableHeader } from '@/components/common/Table/components/SortableHeader'
import { ProjectRecord } from './queries/useProjectQueries'

const columnHelper = createColumnHelper<ProjectRecord>()

export function useProjectColumns() {
    return useMemo(
        () => [
            columnHelper.accessor('projectName', {
                id: 'projectName',
                header: ({ column }) => <SortableHeader label="שם הפרויקט" column={column} />,
                enableSorting: true,
                sortDescFirst: false,
                meta: { label: 'שם הפרויקט' },
                cell: (info) => <TruncatedText>{info.getValue()}</TruncatedText>,
            }),
            columnHelper.accessor((row) => row.projectManager, {
                id: 'projectManager',
                header: ({ column }) => <SortableHeader label="מנהל פרויקט" column={column} />,
                enableSorting: true,
                sortDescFirst: false,
                meta: { label: 'מנהל פרויקט' },
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
                meta: { label: 'אנשי צוות בפרויקט' },
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
                meta: { label: 'סטטוס הפרוייקט' },
                cell: (info) => <SettingLabelCell settingKey="projectStatus" value={info.getValue()} />,
            }),
            columnHelper.accessor('createdAt', {
                id: 'createdAt',
                header: ({ column }) => <SortableHeader label="Created At" column={column} />,
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
        ],
        []
    )
}
