import {
    getCoreRowModel,
    getFilteredRowModel,
    getSortedRowModel,
    useReactTable,
    getFacetedRowModel,
    getFacetedUniqueValues,
    getFacetedMinMaxValues,
    getPaginationRowModel,
} from '@tanstack/react-table'
import { FC, useEffect, useCallback, useState, useRef } from 'react'
import { VStack } from '@chakra-ui/react'
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

declare module '@tanstack/react-table' {
    //add fuzzy filter to the filterFns
    interface FilterFns {
        fuzzy: FilterFn<any>
        global: FilterFn<any>
    }
    //add rank sort to the sortingFns
    interface SortingFns {
        rank: SortingFn<any>
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
    const [pagination, setPagination] = useState(() => ({
        pageIndex: Math.max(0, parseInt(searchParams.get('page') || '1') - 1), // URL pages are 1-based, table is 0-based
        pageSize: 10,
    }))

    // Sync pagination state when URL changes (browser back/forward, refresh)
    useEffect(() => {
        const urlPage = parseInt(searchParams.get('page') || '1')
        const urlPageIndex = Math.max(0, urlPage - 1) // Convert to 0-based

        if (pagination.pageIndex !== urlPageIndex) {
            setPagination((prev) => ({
                ...prev,
                pageIndex: urlPageIndex,
            }))
        }
    }, [searchParams, pagination.pageIndex])

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

    const { formFields, data: rawData, isSuccess } = useTableData({ id })
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
            rank: rankSort,
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

        // When filter starts: auto-sort by first column if not manually sorted
        if (
            !wasFiltering &&
            isFiltering &&
            sorting.length === 0 &&
            columns.length > 0
        ) {
            autoSortEnabledRef.current = true
            setSorting([{ id: columns[0].id as string, desc: false }])
        }

        // When filter clears: remove auto-sort if it was auto-enabled
        if (wasFiltering && !isFiltering && autoSortEnabledRef.current) {
            autoSortEnabledRef.current = false
            setSorting([])
        }
    }, [globalFilter])

    // Apply table filters to data
    const data = useMemo(() => {
        if (
            !filters ||
            filters.length === 0 ||
            !tableFilters ||
            Object.keys(tableFilters).length === 0
        ) {
            return rawData
        }

        return rawData.filter((row) => {
            return filters.every((filter: TableFilter) => {
                const filterValue = tableFilters[filter.id]

                // If no filter value is set or it's "all", don't filter
                if (filterValue === undefined || filterValue === 'all') {
                    return true
                }

                const rowValue = row[filter.fieldName]

                // Handle different filter types
                if (filter.type === 'switch') {
                    return rowValue === filterValue
                }

                if (filter.type === 'radio' || filter.type === 'select') {
                    // Convert both to strings for comparison
                    return String(rowValue) === String(filterValue)
                }

                if (filter.type === 'multiSelect') {
                    // If it's a multiselect and no values selected, show all
                    if (
                        !Array.isArray(filterValue) ||
                        filterValue.length === 0
                    ) {
                        return true
                    }

                    // If rowValue is an array (e.g., assignedProjects with multiple projects), check if any of its values match any filter value
                    if (Array.isArray(rowValue)) {
                        return rowValue.some((val: unknown) => {
                            const stringVal =
                                typeof val === 'object' &&
                                val !== null &&
                                '_id' in val
                                    ? String((val as { _id: unknown })._id)
                                    : typeof val === 'object' &&
                                        val !== null &&
                                        'value' in val
                                      ? String(
                                            (val as { value: unknown }).value
                                        )
                                      : String(val)
                            return filterValue.includes(stringVal)
                        })
                    }

                    // If rowValue is an object with _id (e.g., single project assignment), extract the _id
                    if (
                        typeof rowValue === 'object' &&
                        rowValue !== null &&
                        '_id' in rowValue
                    ) {
                        const idValue = String(
                            (rowValue as { _id: unknown })._id
                        )
                        return filterValue.includes(idValue)
                    }

                    // If rowValue is a simple value, check if it matches any of the selected filter values
                    return filterValue.includes(String(rowValue))
                }

                return true
            })
        })
    }, [rawData, filters, tableFilters])

    // Handle filter changes
    const handleFilterChange = useCallback(
        (filterId: string, value: string | string[] | boolean) => {
            setTableFilters((prev) => ({
                ...prev,
                [filterId]: value,
            }))
        },
        [setTableFilters]
    )

    const table = useReactTable<Record<string, unknown>>({
        defaultColumn,
        columnResizeDirection: 'rtl',
        data,
        columns,
        getCoreRowModel: getCoreRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getFacetedRowModel: getFacetedRowModel(),
        getFacetedUniqueValues: getFacetedUniqueValues(),
        getFacetedMinMaxValues: getFacetedMinMaxValues(),
        getPaginationRowModel: getPaginationRowModel(),
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
        manualPagination: false,
    })

    const handleClearFilters = () => {
        clearFilters(table)
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
        <VStack gap={4} align="stretch" w="full">
            <TableControls
                globalFilter={globalFilter}
                setGlobalFilter={setGlobalFilter}
                handleClearFilters={handleClearFilters}
                sorting={sorting}
                columnFilters={columnFilters}
                onExportToExcel={handleExportToExcel}
                filters={filters}
                filterValues={tableFilters}
                onFilterChange={handleFilterChange}
            />
            <TableContainer table={table} onRowClick={onRowClick} />
            <TablePagination table={table} />
        </VStack>
    )
}
