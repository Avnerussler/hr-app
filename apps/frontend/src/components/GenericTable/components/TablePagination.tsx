import { FC } from 'react'
import { HStack, Button, Text, IconButton, createListCollection } from '@chakra-ui/react'
import { FiChevronLeft, FiChevronRight } from 'react-icons/fi'
import { Table } from '@tanstack/react-table'
import {
    SelectContent,
    SelectItem,
    SelectRoot,
    SelectTrigger,
    SelectValueText,
} from '@/components/ui/select'

interface TablePaginationProps {
    table: Table<any>
}

export const TablePagination: FC<TablePaginationProps> = ({ table }) => {
    const pageIndex = table.getState().pagination.pageIndex
    const pageCount = table.getPageCount()
    const pageSize = table.getState().pagination.pageSize

    const pageSizeOptions = createListCollection({
        items: [
            { label: '10', value: '10' },
            { label: '20', value: '20' },
            { label: '50', value: '50' },
            { label: '100', value: '100' },
        ],
    })

    return (
        <HStack justify="space-between" align="center" w="full" p={4}>
            <HStack>
                <Text fontSize="sm" color="gray.600">
                    Showing {pageIndex * pageSize + 1} to{' '}
                    {Math.min(
                        (pageIndex + 1) * pageSize,
                        table.getFilteredRowModel().rows.length
                    )}{' '}
                    of {table.getFilteredRowModel().rows.length} entries
                </Text>
            </HStack>

            <HStack gap={2}>
                <IconButton
                    aria-label="Previous page"
                    onClick={() => table.previousPage()}
                    disabled={!table.getCanPreviousPage()}
                    size="sm"
                >
                    <FiChevronLeft />
                </IconButton>

                <HStack gap={1}>
                    {Array.from({ length: pageCount }, (_, i) => (
                        <Button
                            key={i}
                            onClick={() => table.setPageIndex(i)}
                            variant={i === pageIndex ? 'solid' : 'outline'}
                            size="sm"
                            minW="8"
                        >
                            {i + 1}
                        </Button>
                    ))}
                </HStack>

                <IconButton
                    aria-label="Next page"
                    onClick={() => table.nextPage()}
                    disabled={!table.getCanNextPage()}
                    size="sm"
                >
                    <FiChevronRight />
                </IconButton>
            </HStack>

            <HStack>
                <Text fontSize="sm" color="gray.600">
                    Rows per page:
                </Text>
                <SelectRoot
                    collection={pageSizeOptions}
                    size="sm"
                    value={[pageSize.toString()]}
                    onValueChange={({ items }) => 
                        table.setPageSize(Number(items[0]?.value || '10'))
                    }
                >
                    <SelectTrigger w="20">
                        <SelectValueText />
                    </SelectTrigger>
                    <SelectContent portalled={false}>
                        {pageSizeOptions.items.map((option) => (
                            <SelectItem item={option} key={option.value}>
                                {option.label}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </SelectRoot>
            </HStack>
        </HStack>
    )
}
