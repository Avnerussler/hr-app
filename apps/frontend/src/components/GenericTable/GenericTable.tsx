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
import { FC, useEffect, useCallback } from 'react'
import { VStack } from '@chakra-ui/react'

import { FormFields } from '@/types/fieldsType'
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
        fuzzy: any
        global: any
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

    const { formFields, submittedData, data, isSuccess } = useTableData({ id })
    const { columns } = useTableColumns({ formFields, isSuccess })
    const { data: formsData } = useFormsQuery()

    const table = useReactTable<FormFields>({
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
        },
        onGlobalFilterChange: setGlobalFilter,
        onSortingChange: setSorting,
        onColumnFiltersChange: setColumnFilters,
        globalFilterFn: 'global',
        filterFns: {
            fuzzy: fuzzyFilter,
            global: customGlobalFilter,
        },
        enableSorting: true,
        enableColumnFilters: true,
        enableGlobalFilter: true,
        initialState: {
            pagination: {
                pageSize: 10,
            },
        },
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
                data: data as Record<string, unknown>[],
                formFields,
                formsData,
                filename: formFields.formName
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
            <TableContainer
                table={table}
                submittedData={submittedData}
                onRowClick={onRowClick}
            />
            <TablePagination table={table} />
        </VStack>
    )
}
