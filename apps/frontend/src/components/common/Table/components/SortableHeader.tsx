import { VStack, HStack, Text, Box } from '@chakra-ui/react'
import { LuChevronUp, LuChevronDown, LuChevronsUpDown } from 'react-icons/lu'
import type { Column } from '@tanstack/react-table'
import type { KeyboardEvent } from 'react'

interface SortableHeaderProps<TData> {
    label: string
    column: Column<TData, unknown>
}

export function SortableHeader<TData>({ label, column }: SortableHeaderProps<TData>) {
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
