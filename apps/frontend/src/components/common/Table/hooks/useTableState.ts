import { useState, useEffect, useMemo } from 'react'
import { SortingState, ColumnFiltersState, VisibilityState, Table } from '@tanstack/react-table'
import { createTableStateManager } from '@/utils/localStorage'

interface UseTableStateProps {
    id: string
    /** Column ids that should start hidden the first time this table is opened
     *  (i.e. only when there's no persisted preference yet for that column). */
    defaultHiddenColumnIds?: string[]
}

export const useTableState = ({
    id,
    defaultHiddenColumnIds = [],
}: UseTableStateProps) => {
    // Create table state manager with unique ID
    const tableStateManager = useMemo(() => createTableStateManager(id), [id])

    // Initialize state from localStorage
    const initialState = useMemo(
        () => tableStateManager.loadTableState(),
        [tableStateManager]
    )

    const [globalFilter, setGlobalFilter] = useState<string>(
        initialState.globalFilter
    )
    const [sorting, setSorting] = useState<SortingState>(initialState.sorting)
    const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>(
        initialState.columnFilters
    )
    const [tableFilters, setTableFilters] = useState<
        Record<string, string | string[] | boolean>
    >(initialState.tableFilters || {})
    const [columnVisibility, setColumnVisibility] = useState<VisibilityState>(
        () => {
            const persisted = initialState.columnVisibility || {}
            const defaults: VisibilityState = {}
            for (const columnId of defaultHiddenColumnIds) {
                if (!(columnId in persisted)) defaults[columnId] = false
            }
            return { ...defaults, ...persisted }
        }
    )

    // Save state to localStorage whenever it changes
    useEffect(() => {
        const state = {
            sorting,
            columnFilters,
            globalFilter,
            tableFilters,
            columnVisibility,
        }
        tableStateManager.saveTableState(state)
    }, [sorting, columnFilters, globalFilter, tableFilters, columnVisibility, tableStateManager])

    // Reset all filters and sorting
    const handleClearFilters = (
        table?: Table<Record<string, unknown>> | undefined
    ) => {
        setSorting([])
        setColumnFilters([])
        setGlobalFilter('')
        setTableFilters({})
        tableStateManager.clearTableState()

        if (table) {
            table.resetColumnFilters()
            table.resetGlobalFilter()
        }
    }

    // Sync column filters with table state
    const syncColumnFilters = (
        table?: Table<Record<string, unknown>> | undefined
    ) => {
        if (table) {
            const currentFilters = table.getState().columnFilters
            setColumnFilters(currentFilters)
        }
    }

    return {
        globalFilter,
        setGlobalFilter,
        sorting,
        setSorting,
        columnFilters,
        setColumnFilters,
        tableFilters,
        setTableFilters,
        columnVisibility,
        setColumnVisibility,
        handleClearFilters,
        syncColumnFilters,
    }
}
