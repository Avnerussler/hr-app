import { useState, useEffect, useMemo } from 'react'
import { SortingState, ColumnFiltersState, Table } from '@tanstack/react-table'
import { createTableStateManager } from '@/utils/localStorage'
import { FormFields } from '@/types/fieldsType'

interface UseTableStateProps {
    id: string
}

export const useTableState = ({ id }: UseTableStateProps) => {
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

    // Save state to localStorage whenever it changes
    useEffect(() => {
        const state = {
            sorting,
            columnFilters,
            globalFilter,
        }
        tableStateManager.saveTableState(state)
    }, [sorting, columnFilters, globalFilter, tableStateManager])

    // Reset all filters and sorting
    const handleClearFilters = (table?: Table<FormFields> | undefined) => {
        setSorting([])
        setColumnFilters([])
        setGlobalFilter('')
        tableStateManager.clearTableState()

        if (table) {
            table.resetColumnFilters()
            table.resetGlobalFilter()
        }
    }

    // Sync column filters with table state
    const syncColumnFilters = (table?: Table<FormFields> | undefined) => {
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
        handleClearFilters,
        syncColumnFilters,
    }
}
