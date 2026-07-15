import {
    getCoreRowModel,
    getSortedRowModel,
    useReactTable,
    getFacetedRowModel,
    getFacetedUniqueValues,
    getFacetedMinMaxValues,
} from '@tanstack/react-table'
import { FC, useEffect, useCallback, useState, useRef } from 'react'
import { VStack, Box } from '@chakra-ui/react'
import { FilterFn, SortingFn } from '@tanstack/react-table'
import { useSearchParams } from 'react-router-dom'

import { useTableState } from './hooks/useTableState'
import { useTableData } from './hooks/useTableData'
import { useTableColumns } from './hooks/useTableColumns'
import { useFormsQuery } from '@/hooks/queries/useFormQueries'
import { fuzzyFilter } from './utils/fuzzyFilter'
import { globalFilter as customGlobalFilter } from './utils/globalFilter'
import { rankSort } from './utils/rankSort'
import { exportToExcel } from './utils/exportToExcel'
import { TableControls } from './components/TableControls'
import { TableContainer } from './components/TableContainer'
import { TablePagination } from './components/TablePagination'
import { TableFilter } from '@/types/fieldsType'
import { useMemo } from 'react'
import useDebounce from '@/hooks/useDebounce'

declare module '@tanstack/react-table' {
    //add fuzzy filter to the filterFns
    interface FilterFns {
        fuzzy: FilterFn<unknown>
        global: FilterFn<unknown>
    }
    //add rank sort to the sortingFns
    interface SortingFns {
        rank: SortingFn<unknown>
    }
}

interface GenericTableProps {
    id: string
    isEditable?: boolean
    isCanBeDeleted?: boolean
    withIndex?: boolean
    onRowClick?: (rowId: string) => void
    filters?: TableFilter[]
    showCreatedAt?: boolean
}

export const GenericTable: FC<GenericTableProps> = ({
    id,
    onRowClick,
    filters,
    showCreatedAt,
}) => {
    const [searchParams] = useSearchParams()
    const [pagination, setPagination] = useState(() => {
        const page = Math.max(0, parseInt(searchParams.get('page') || '1') - 1)
        const limit = parseInt(searchParams.get('limit') || '10')
        const pageSize = [10, 20, 50, 100].includes(limit) ? limit : 10
        return { pageIndex: page, pageSize }
    })

    const {
        globalFilter,
        setGlobalFilter,
        sorting,
        setSorting,
        columnFilters,
        setColumnFilters,
        tableFilters,
        setTableFilters,
        handleClearFilters: clearFilters,
        syncColumnFilters,
    } = useTableState({ id })

    const debouncedSearch = useDebounce(globalFilter, 300)

    const { formFields, data, isSuccess, totalCount, totalPages } = useTableData({
        id,
        page: pagination.pageIndex + 1,
        pageSize: pagination.pageSize,
        search: debouncedSearch,
        tableFilters,
    })

    // Correct pageIndex only when our current page exceeds the total pages the server reports
    useEffect(() => {
        if (totalPages !== null && totalPages > 0 && pagination.pageIndex + 1 > totalPages) {
            setPagination((prev) => ({ ...prev, pageIndex: totalPages - 1 }))
        }
    }, [totalPages, pagination.pageIndex])

    const { columns } = useTableColumns({
        formFields,
        isSuccess,
        showCreatedAt,
    })
    const { data: formsData } = useFormsQuery()

    // Memoize table configuration objects to prevent re-renders
    const defaultColumn = useMemo(
        () => ({
            size: 100,
            minSize: 50,
            maxSize: 100,
        }),
        []
    )

    const filterFns = useMemo(
        () => ({
            fuzzy: fuzzyFilter,
            global: customGlobalFilter,
        }),
        []
    )

    const sortingFns = useMemo(
        () => ({
            rank: rankSort as SortingFn<unknown>,
        }),
        []
    )

    // Track if we auto-enabled sorting
    const autoSortEnabledRef = useRef(false)
    const previousGlobalFilterRef = useRef('')

    // Auto-sort by rank when global filter becomes active
    useEffect(() => {
        const wasFiltering = !!previousGlobalFilterRef.current
        const isFiltering = !!globalFilter
        previousGlobalFilterRef.current = globalFilter

        if (
            !wasFiltering &&
            isFiltering &&
            sorting.length === 0 &&
            columns.length > 0
        ) {
            autoSortEnabledRef.current = true
            setSorting([{ id: columns[0].id as string, desc: false }])
        }

        if (wasFiltering && !isFiltering && autoSortEnabledRef.current) {
            autoSortEnabledRef.current = false
            setSorting([])
        }
    }, [globalFilter, sorting.length, columns, setSorting])

    // Handle filter changes
    const handleFilterChange = useCallback(
        (filterId: string, value: string | string[] | boolean) => {
            setTableFilters((prev) => ({ ...prev, [filterId]: value }))
            setPagination((prev) => ({ ...prev, pageIndex: 0 }))
        },
        [setTableFilters]
    )

    const table = useReactTable<Record<string, unknown>>({
        defaultColumn,
        columnResizeDirection: 'rtl',
        data,
        columns,
        getCoreRowModel: getCoreRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getFacetedRowModel: getFacetedRowModel(),
        getFacetedUniqueValues: getFacetedUniqueValues(),
        getFacetedMinMaxValues: getFacetedMinMaxValues(),
        state: {
            globalFilter,
            sorting,
            columnFilters,
            pagination,
        },
        onGlobalFilterChange: setGlobalFilter,
        onSortingChange: setSorting,
        onColumnFiltersChange: setColumnFilters,
        onPaginationChange: setPagination,
        globalFilterFn: 'global',
        filterFns,
        sortingFns,
        enableSorting: true,
        enableColumnFilters: true,
        enableGlobalFilter: true,
        manualPagination: true,
        manualFiltering: true,
        rowCount: totalCount,
    })

    const handleClearFilters = () => {
        clearFilters(table)
        setPagination((prev) => ({ ...prev, pageIndex: 0 }))
    }

    const handleExportToExcel = useCallback(async () => {
        if (!formFields || !data.length) {
            console.warn('No data available for export')
            return
        }

        try {
            await exportToExcel({
                data: data,
                formFields,
                formsData,
                filename: formFields.formName,
            })
        } catch (error) {
            console.error('Error exporting to Excel:', error)
        }
    }, [data, formFields, formsData])

    // Sync our state with table state when table changes
    const columnFiltersState = table.getState().columnFilters
    useEffect(() => {
        syncColumnFilters(table)
    }, [columnFiltersState, syncColumnFilters, table])

    return (
        <VStack gap={4} align="stretch" w="full" h="full" overflow="hidden">
            <TableControls
                globalFilter={globalFilter}
                setGlobalFilter={setGlobalFilter}
                handleClearFilters={handleClearFilters}
                sorting={sorting}
                columnFilters={columnFilters}
                tableFilters={tableFilters}
                onExportToExcel={handleExportToExcel}
                filters={filters}
                filterValues={tableFilters}
                onFilterChange={handleFilterChange}
            />
            <Box flex="1" overflow="auto" minH="0">
                <TableContainer table={table} onRowClick={onRowClick} />
            </Box>
            <TablePagination
                table={table}
                onPageSizeChange={(newSize) =>
                    setPagination((prev) => ({ pageIndex: prev.pageIndex, pageSize: newSize }))
                }
            />
        </VStack>
    )
}
