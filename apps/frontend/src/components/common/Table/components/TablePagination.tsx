import { FC, useRef } from 'react'
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
    onPageSizeChange: (newSize: number) => void
}

export const TablePagination: FC<TablePaginationProps> = ({ table, onPageSizeChange }) => {
    const pageIndex = table.getState().pagination.pageIndex
    const pageSize = table.getState().pagination.pageSize
    const [searchParams, setSearchParams] = useSearchParams()
    const pageSizeChanging = useRef(false)

    const updateUrl = (newPageIndex: number, newPageSize: number) => {
        const newParams = new URLSearchParams(searchParams)
        const pageNumber = newPageIndex + 1
        if (pageNumber === 1) {
            newParams.delete('page')
        } else {
            newParams.set('page', pageNumber.toString())
        }
        if (newPageSize === 10) {
            newParams.delete('limit')
        } else {
            newParams.set('limit', newPageSize.toString())
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
        if (pageSizeChanging.current) {
            pageSizeChanging.current = false
            return
        }
        const newPageIndex = details.page - 1
        table.setPageIndex(newPageIndex)
        updateUrl(newPageIndex, pageSize)
    }

    const handlePageSizeChange = ({ items }: { items: { value: string }[] }) => {
        const newSize = Number(items[0]?.value || '10')
        pageSizeChanging.current = true
        onPageSizeChange(newSize)
        updateUrl(pageIndex, newSize)
    }

    const totalRows = table.getRowCount()
    const firstRow = totalRows === 0 ? 0 : pageIndex * pageSize + 1
    const lastRow = Math.min((pageIndex + 1) * pageSize, totalRows)

    return (
        <HStack justify="space-between" align="center" w="full" p={4}>
            <HStack>
                <Text fontSize="sm" color="gray.600">
                    Showing {firstRow} to {lastRow} of {totalRows} entries
                </Text>
            </HStack>

            <PaginationRoot
                count={totalRows}
                pageSize={pageSize}
                page={pageIndex + 1}
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
                    onValueChange={handlePageSizeChange}
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
