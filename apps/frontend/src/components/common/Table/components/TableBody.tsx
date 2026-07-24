import { FC } from 'react'
import { Table, flexRender } from '@tanstack/react-table'
import { Box, Text, Badge } from '@chakra-ui/react'
import { Tooltip } from '@/components/ui/tooltip'

interface TableBodyProps {
    table: Table<Record<string, unknown>>
    onRowClick?: (rowId: string) => void
}

export const TableBody: FC<TableBodyProps> = ({ table, onRowClick }) => {
    const rows = table.getRowModel().rows
    const visibleColumnIds = new Set(table.getVisibleLeafColumns().map((c) => c.id))
    const colCount = table.getVisibleLeafColumns().length

    return (
        <Box as="tbody">
            {rows.length === 0 && (
                <tr>
                    <td colSpan={colCount} style={{ height: '300px', textAlign: 'center', verticalAlign: 'middle' }}>
                        <Text color="muted.foreground" fontSize="sm">
                            No results found
                        </Text>
                    </td>
                </tr>
            )}
            {rows.map((row) => {
                const matchedFields = (row.original as { matchedFields?: string[] }).matchedFields ?? []
                const hiddenMatches = matchedFields.filter((fieldId) => !visibleColumnIds.has(fieldId))
                const hiddenMatchLabels = hiddenMatches.map(
                    (fieldId) => table.getColumn(fieldId)?.columnDef.meta?.label ?? fieldId
                )

                return (
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
                        {row.getVisibleCells().map((cell, cellIndex) => (
                            <Box
                                as="td"
                                key={cell.id}
                                p={2}
                                verticalAlign="top"
                                color="foreground"
                                style={{ width: cell.column.getSize() }}
                            >
                                <Box display="flex" alignItems="flex-start" gap={1}>
                                    {cellIndex === 0 && hiddenMatchLabels.length > 0 && (
                                        <Tooltip content={`נמצאה התאמה גם ב: ${hiddenMatchLabels.join(', ')}`}>
                                            <Badge
                                                colorPalette="blue"
                                                size="sm"
                                                flexShrink={0}
                                                onClick={(e) => e.stopPropagation()}
                                            >
                                                +{hiddenMatchLabels.length}
                                            </Badge>
                                        </Tooltip>
                                    )}
                                    <Box flex="1" minW={0}>
                                        {flexRender(
                                            cell.column.columnDef.cell,
                                            cell.getContext()
                                        )}
                                    </Box>
                                </Box>
                            </Box>
                        ))}
                    </Box>
                )
            })}
        </Box>
    )
}
