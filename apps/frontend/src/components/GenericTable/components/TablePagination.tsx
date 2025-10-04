import { FC } from 'react'
import { HStack, Text, createListCollection } from '@chakra-ui/react'
import { Table } from '@tanstack/react-table'
import { useSearchParams } from 'react-router-dom'
import {
    SelectContent,
    SelectItem,
    SelectRoot,
    SelectTrigger,
    SelectValueText,
} from '@/components/ui/select'
import {
    PaginationItems,
    PaginationNextTrigger,
    PaginationPrevTrigger,
    PaginationRoot,
} from '@/components/ui/pagination'

interface TablePaginationProps {
    table: Table<any>
}

export const TablePagination: FC<TablePaginationProps> = ({ table }) => {
    const pageIndex = table.getState().pagination.pageIndex
    const pageSize = table.getState().pagination.pageSize
    const [searchParams, setSearchParams] = useSearchParams()

    const updateUrlPage = (newPageIndex: number) => {
        const pageNumber = newPageIndex + 1 // Convert to 1-based for URL
        const newParams = new URLSearchParams(searchParams)
        if (pageNumber === 1) {
            newParams.delete('page') // Remove page param for page 1
        } else {
            newParams.set('page', pageNumber.toString())
        }
        setSearchParams(newParams, { replace: true })
    }

    const pageSizeOptions = createListCollection({
        items: [
            { label: '10', value: '10' },
            { label: '20', value: '20' },
            { label: '50', value: '50' },
            { label: '100', value: '100' },
        ],
    })

    const handlePageChange = (details: { page: number }) => {
        const newPageIndex = details.page - 1 // Convert from 1-based to 0-based
        table.setPageIndex(newPageIndex)
        updateUrlPage(newPageIndex)
    }

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

            <PaginationRoot
                count={table.getFilteredRowModel().rows.length}
                pageSize={pageSize}
                page={pageIndex + 1} // Convert to 1-based for Chakra
                onPageChange={handlePageChange}
                variant="solid"
                size="sm"
            >
                <HStack gap={2} flex="1" justify="center" maxW="container.lg">
                    <PaginationPrevTrigger />
                    <PaginationItems />
                    <PaginationNextTrigger />
                </HStack>
            </PaginationRoot>

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
