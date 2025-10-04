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
import { FC, useEffect, useCallback, useState } from 'react'
import { VStack } from '@chakra-ui/react'
import { FilterFn } from '@tanstack/react-table'
import { useSearchParams } from 'react-router-dom'

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

declare module '@tanstack/react-table' {
    //add fuzzy filter to the filterFns
    interface FilterFns {
        fuzzy: FilterFn<any>
        global: FilterFn<any>
    }
}

interface GenericTableProps {
    id: string
    isEditable?: boolean
    isCanBeDeleted?: boolean
    withIndex?: boolean
    onRowClick?: (rowId: string) => void
}

export const GenericTable: FC<GenericTableProps> = ({ id, onRowClick }) => {
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
        handleClearFilters: clearFilters,
        syncColumnFilters,
    } = useTableState({ id })

    const { formFields, data, isSuccess } = useTableData({ id })
    const { columns } = useTableColumns({ formFields, isSuccess })
    const { data: formsData } = useFormsQuery()

    const table = useReactTable<Record<string, unknown>>({
        defaultColumn: {
            size: 100,
            minSize: 50,
            maxSize: 100,
        },
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
        filterFns: {
            fuzzy: fuzzyFilter,
            global: customGlobalFilter,
        },
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
            />
            <TableContainer table={table} onRowClick={onRowClick} />
            <TablePagination table={table} />
        </VStack>
    )
}
