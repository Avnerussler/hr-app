import { Box, Text, Flex, Skeleton } from '@chakra-ui/react'
import { ReactNode, useMemo, useState } from 'react'
import {
    useReactTable,
    getCoreRowModel,
    getSortedRowModel,
    getFilteredRowModel,
    flexRender,
    ColumnDef,
    FilterFn,
    SortingState,
} from '@tanstack/react-table'
import { FiChevronUp, FiChevronDown, FiMinus } from 'react-icons/fi'
import { DebouncedInput } from '@/components/DebounceInput'

// Substring filter for a single column
const fuzzyFilter: FilterFn<Record<string, unknown>> = (
    row,
    columnId,
    value
) => {
    return String(row.getValue(columnId))
        .toLowerCase()
        .includes(String(value).toLowerCase())
}

// Substring filter across all columns
const globalFilter: FilterFn<Record<string, unknown>> = (
    row,
    _columnId,
    value
) => {
    const searchableText = row
        .getAllCells()
        .map((cell) => String(cell.getValue()))
        .join(' ')
        .toLowerCase()
    return searchableText.includes(String(value).toLowerCase())
}

interface StatisticsTableProps {
    title: string
    description?: string
    icon?: ReactNode
    headers: string[]
    rows: unknown[][]
    isLoading?: boolean
    minHeight?: string
}

export function StatisticsTable({
    title,
    description,
    icon,
    headers,
    rows,
    isLoading = false,
    minHeight = '300px',
}: StatisticsTableProps) {
    const [sorting, setSorting] = useState<SortingState>([])
    const [globalFilterValue, setGlobalFilterValue] = useState('')

    // Transform rows array into objects for TanStack Table
    const data = useMemo(() => {
        return rows.map((row) => {
            const rowObj: Record<string, unknown> = {}
            headers.forEach((_header, index) => {
                rowObj[`col_${index}`] = row[index]
            })
            // Mark if this is a totals row
            rowObj._isTotalRow =
                row[0] === 'סה"כ' ||
                row[0] === 'סה"כ סטודיו' ||
                String(row[0] ?? '').includes('סה"כ')
            return rowObj
        })
    }, [rows, headers])

    // Create columns dynamically from headers
    const columns = useMemo<ColumnDef<Record<string, unknown>>[]>(() => {
        return headers.map((header, index) => ({
            id: `col_${index}`,
            accessorKey: `col_${index}`,
            header: () => header,
            cell: (info) => {
                const value = info.getValue()
                return value ?? '-'
            },
            size: index === 0 ? 200 : 120,
            sortingFn: 'alphanumeric',
            filterFn: fuzzyFilter,
        }))
    }, [headers])

    const table = useReactTable({
        data,
        columns,
        state: {
            sorting,
            globalFilter: globalFilterValue,
        },
        onSortingChange: setSorting,
        onGlobalFilterChange: setGlobalFilterValue,
        getCoreRowModel: getCoreRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        globalFilterFn: 'global',
        enableSortingRemoval: true,
        enableMultiSort: false,
        sortDescFirst: false,
        defaultColumn: {
            minSize: 80,
            maxSize: 300,
        },
        filterFns: {
            fuzzy: fuzzyFilter,
            global: globalFilter,
        },
    })

    if (isLoading) {
        return (
            <Box
                bg="white"
                borderRadius="lg"
                borderWidth="1px"
                borderColor="gray.200"
                p={6}
                minHeight={minHeight}
            >
                <Flex align="center" gap={2} mb={4}>
                    {icon && <Box color="blue.600">{icon}</Box>}
                    <Box flex="1">
                        <Skeleton height="20px" width="200px" mb={2} />
                        {description && (
                            <Skeleton height="14px" width="300px" />
                        )}
                    </Box>
                </Flex>
                <Skeleton height="200px" />
            </Box>
        )
    }

    return (
        <Box
            bg="white"
            borderRadius="lg"
            borderWidth="1px"
            borderColor="gray.200"
            minHeight={minHeight}
            w="full"
            overflow="hidden"
        >
            <Box p={6} pb={4}>
                <Flex align="center" gap={2}>
                    {icon && <Box color="blue.600">{icon}</Box>}
                    <Box flex="1">
                        <Text
                            fontSize="lg"
                            fontWeight="semibold"
                            color="gray.800"
                        >
                            {title}
                        </Text>
                        {description && (
                            <Text fontSize="sm" color="gray.500" mt={1}>
                                {description}
                            </Text>
                        )}
                    </Box>
                </Flex>
                <Box mt={4} maxW="280px">
                    <DebouncedInput
                        value={globalFilterValue}
                        onChange={(value) =>
                            setGlobalFilterValue(String(value))
                        }
                        placeholder="חיפוש בטבלה..."
                    />
                </Box>
            </Box>

            <Box
                position="relative"
                w="full"
                overflowX="auto"
                overflowY="hidden"
            >
                <Box as="table" w="full" fontSize="sm" minW="fit-content">
                    <Box as="thead">
                        {table.getHeaderGroups().map((headerGroup) => (
                            <Box
                                as="tr"
                                key={headerGroup.id}
                                bg="gray.50"
                                borderBottomWidth="1px"
                                borderColor="gray.200"
                            >
                                {headerGroup.headers.map((header, index) => {
                                    const sortDirection =
                                        header.column.getIsSorted()
                                    return (
                                        <Box
                                            as="th"
                                            key={header.id}
                                            py={3}
                                            px={4}
                                            textAlign={
                                                index === 0 ? 'right' : 'center'
                                            }
                                            fontSize="xs"
                                            fontWeight="bold"
                                            color="gray.700"
                                            textTransform="none"
                                            whiteSpace="nowrap"
                                            cursor="pointer"
                                            userSelect="none"
                                            onClick={header.column.getToggleSortingHandler()}
                                        >
                                            <Flex
                                                as="span"
                                                align="center"
                                                justify={
                                                    index === 0
                                                        ? 'flex-start'
                                                        : 'center'
                                                }
                                                gap={1}
                                            >
                                                {header.isPlaceholder
                                                    ? null
                                                    : flexRender(
                                                          header.column
                                                              .columnDef.header,
                                                          header.getContext()
                                                      )}
                                                <Box
                                                    as="span"
                                                    display="inline-flex"
                                                    color={
                                                        sortDirection
                                                            ? 'blue.600'
                                                            : 'gray.400'
                                                    }
                                                >
                                                    {sortDirection === 'asc' ? (
                                                        <FiChevronDown />
                                                    ) : sortDirection ===
                                                      'desc' ? (
                                                        <FiChevronUp />
                                                    ) : (
                                                        <FiMinus />
                                                    )}
                                                </Box>
                                            </Flex>
                                        </Box>
                                    )
                                })}
                            </Box>
                        ))}
                    </Box>
                    <Box as="tbody">
                        {table.getRowModel().rows.length > 0 ? (
                            table.getRowModel().rows.map((row, rowIndex) => {
                                const isTotalRow = Boolean(
                                    row.original._isTotalRow
                                )

                                return (
                                    <Box
                                        as="tr"
                                        key={row.id}
                                        bg={
                                            isTotalRow
                                                ? 'blue.50'
                                                : rowIndex % 2 === 0
                                                  ? 'white'
                                                  : 'gray.50'
                                        }
                                        borderTopWidth={
                                            isTotalRow ? '2px' : '1px'
                                        }
                                        borderTopColor={
                                            isTotalRow ? 'blue.200' : 'gray.100'
                                        }
                                        _hover={{
                                            bg: isTotalRow
                                                ? 'blue.100'
                                                : 'gray.100',
                                        }}
                                        transition="background 0.2s"
                                    >
                                        {row
                                            .getVisibleCells()
                                            .map((cell, cellIndex) => (
                                                <Box
                                                    as="td"
                                                    key={cell.id}
                                                    py={3}
                                                    px={4}
                                                    textAlign={
                                                        cellIndex === 0
                                                            ? 'right'
                                                            : 'center'
                                                    }
                                                    fontWeight={
                                                        isTotalRow ||
                                                        cellIndex === 0
                                                            ? 'bold'
                                                            : 'normal'
                                                    }
                                                    color={
                                                        isTotalRow
                                                            ? 'blue.700'
                                                            : cellIndex === 0
                                                              ? 'gray.800'
                                                              : 'gray.600'
                                                    }
                                                    whiteSpace="nowrap"
                                                >
                                                    {flexRender(
                                                        cell.column.columnDef
                                                            .cell,
                                                        cell.getContext()
                                                    )}
                                                </Box>
                                            ))}
                                    </Box>
                                )
                            })
                        ) : (
                            <Box as="tr">
                                <Box
                                    as="td"
                                    textAlign="center"
                                    py={8}
                                    color="gray.500"
                                >
                                    אין נתונים להצגה
                                </Box>
                            </Box>
                        )}
                    </Box>
                </Box>
            </Box>
        </Box>
    )
}
