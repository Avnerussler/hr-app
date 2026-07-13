import { FC } from 'react'
import { Table, flexRender } from '@tanstack/react-table'
import { Box, Text } from '@chakra-ui/react'

interface TableBodyProps {
    table: Table<Record<string, unknown>>
    onRowClick?: (rowId: string) => void
}

export const TableBody: FC<TableBodyProps> = ({ table, onRowClick }) => {
    const rows = table.getRowModel().rows
    const colCount = table.getVisibleLeafColumns().length

    return (
        <Box as="tbody">
            {rows.length === 0 && (
                <Box as="tr">
                    <Box as="td" colSpan={colCount} h="300px" textAlign="center" verticalAlign="middle">
                        <Text color="muted.foreground" fontSize="sm">
                            No results found
                        </Text>
                    </Box>
                </Box>
            )}
            {rows.map((row) => (
                <Box
                    as="tr"
                    key={row.id}
                    borderBottomWidth="1px"
                    borderColor="border"
                    transition="colors 0.2s"
                    cursor={onRowClick ? 'pointer' : 'default'}
                    _hover={{
                        bg: 'muted/50',
                    }}
                    _last={{
                        borderBottom: 'none',
                    }}
                    onClick={() => {
                        if (onRowClick && row.original._id) {
                            onRowClick(row.original._id as string)
                        }
                    }}
                >
                    {row.getVisibleCells().map((cell) => (
                        <Box
                            as="td"
                            key={cell.id}
                            p={2}
                            verticalAlign="top"
                            color="foreground"
                            maxW="400px"
                        >
                            {flexRender(
                                cell.column.columnDef.cell,
                                cell.getContext()
                            )}
                        </Box>
                    ))}
                </Box>
            ))}
        </Box>
    )
}
