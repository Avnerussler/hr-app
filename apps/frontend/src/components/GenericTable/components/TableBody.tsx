import { FC } from 'react'
import { Table, flexRender } from '@tanstack/react-table'
import { Box } from '@chakra-ui/react'

interface TableBodyProps {
    table: Table<Record<string, unknown>>
    onRowClick?: (rowId: string) => void
}

export const TableBody: FC<TableBodyProps> = ({ table, onRowClick }) => {
    return (
        <Box as="tbody">
            {table.getRowModel().rows.map((row) => (
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
                            verticalAlign="middle"
                            whiteSpace="nowrap"
                            color="foreground"
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
