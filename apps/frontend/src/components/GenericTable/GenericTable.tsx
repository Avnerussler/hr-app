import {
    getCoreRowModel,
    useReactTable,
    getFacetedRowModel,
    getFacetedUniqueValues,
    getFacetedMinMaxValues,
} from '@tanstack/react-table'
import { FC, useEffect, useCallback, useState } from 'react'
import { VStack, Box } from '@chakra-ui/react'
import { FilterFn } from '@tanstack/react-table'
import { useSearchParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'

import { useTableState } from './hooks/useTableState'
import { useTableData } from './hooks/useTableData'
import { useTableColumns } from './hooks/useTableColumns'
import { useFormsQuery } from '@/hooks/queries/useFormQueries'
import { fuzzyFilter } from './utils/fuzzyFilter'
import { globalFilter as customGlobalFilter } from './utils/globalFilter'
import { exportToExcel } from './utils/exportToExcel'
import { TableControls } from './components/TableControls'
import { TableContainer } from './components/TableContainer'
import { TablePagination } from './components/TablePagination'
import { IForm, TableFilter } from '@/types/fieldsType'
import { useMemo } from 'react'
import useDebounce from '@/hooks/useDebounce'

declare module '@tanstack/react-table' {
    //add fuzzy filter to the filterFns
    interface FilterFns {
        fuzzy: FilterFn<unknown>
        global: FilterFn<unknown>
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

    // Same query key as inside useTableData — React Query dedupes this, no extra request.
    // Needed here so we can resolve the sorted column's backend field name (column `id`
    // is the field's Mongo `_id`, not its `name`) before building useTableData's params.
    const { data: formSchema } = useQuery<IForm>({
        queryKey: ['formFields/get', id],
        staleTime: 1000 * 60 * 5,
    })

    const activeSort = sorting[0]
    const sortField = useMemo(() => {
        if (!activeSort) return undefined
        if (activeSort.id === 'createdAt') return 'createdAt'
        const allFields = formSchema?.sections?.flatMap((section) => section.fields ?? []) ?? []
        return allFields.find((f) => f._id === activeSort.id)?.name ?? activeSort.id
    }, [activeSort, formSchema])
    const sortOrder: 'asc' | 'desc' | undefined = activeSort
        ? activeSort.desc
            ? 'desc'
            : 'asc'
        : undefined

    const { formFields, data, isSuccess, totalCount, totalPages } = useTableData({
        id,
        page: pagination.pageIndex + 1,
        pageSize: pagination.pageSize,
        search: debouncedSearch,
        tableFilters,
        sortField,
        sortOrder,
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

    // Handle filter changes
    const handleFilterChange = useCallback(
        (filterId: string, value: string | string[] | boolean) => {
            setTableFilters((prev) => ({ ...prev, [filterId]: value }))
            setPagination((prev) => ({ ...prev, pageIndex: 0 }))
        },
        [setTableFilters]
    )

    // Sorting is server-side (see sortField/sortOrder above) — reset to page 1
    // whenever the sort changes, since the rows on "page 1" change with sort order.
    const handleSortingChange: typeof setSorting = useCallback(
        (updater) => {
            setSorting(updater)
            setPagination((prev) => ({ ...prev, pageIndex: 0 }))
        },
        [setSorting]
    )

    const table = useReactTable<Record<string, unknown>>({
        defaultColumn,
        columnResizeDirection: 'rtl',
        data,
        columns,
        getCoreRowModel: getCoreRowModel(),
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
        onSortingChange: handleSortingChange,
        onColumnFiltersChange: setColumnFilters,
        onPaginationChange: setPagination,
        globalFilterFn: 'global',
        filterFns,
        enableSorting: true,
        enableColumnFilters: true,
        enableGlobalFilter: true,
        manualPagination: true,
        manualFiltering: true,
        manualSorting: true,
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
