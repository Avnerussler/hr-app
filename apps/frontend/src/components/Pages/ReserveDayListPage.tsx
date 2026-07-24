import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { VStack, Box, Grid } from '@chakra-ui/react'
import {
    getCoreRowModel,
    useReactTable,
    getFacetedRowModel,
    getFacetedUniqueValues,
    getFacetedMinMaxValues,
} from '@tanstack/react-table'
import { PageHeader } from '@/components/common/PageHeader'
import { MetricCard } from '@/components/common/MetricCard'
import { TableControls } from '@/components/common/Table/components/TableControls'
import { TableContainer } from '@/components/common/Table/components/TableContainer'
import { TablePagination } from '@/components/common/Table/components/TablePagination'
import { useTableState } from '@/components/common/Table/hooks/useTableState'
import { fuzzyFilter } from '@/components/common/Table/utils/fuzzyFilter'
import { globalFilter as customGlobalFilter } from '@/components/common/Table/utils/globalFilter'
import useDebounce from '@/hooks/useDebounce'
import { useRouteContext, useDrawerState } from '@/hooks/useRouteContext'
import { generateEditPath, generateFormPath, generateNewPath } from '@/types/routeTypes'
import { TableFilter } from '@/types/fieldsType'
import { FaList, FaHourglassHalf, FaCheck, FaTimes } from 'react-icons/fa'
import { useReserveDayListQuery, useReserveDayMetricsQuery } from '@/hooks/queries/useReserveDayQueries'
import { useSettingOptions } from '@/hooks/queries/useSettingQueries'
import { useReserveDayColumns, RESERVE_DAY_EXTRA_COLUMN_IDS } from '@/hooks/useReserveDayColumns'
import { ReserveDayDrawer } from '@/components/ReserveDay/ReserveDayDrawer'
import type { ReserveDayRecord } from '@/hooks/queries/useReserveDayQueries'

const METRIC_ICONS: Record<string, React.ElementType> = {
    FaList: FaList,
    FaHourglassHalf: FaHourglassHalf,
    FaCheck: FaCheck,
    FaTimes: FaTimes,
}

const RESERVE_DAY_FORM_NAME = 'reserve_days_management'
const RESERVE_DAY_ROUTE_ID = 'default'

export function ReserveDayListPage() {
    const navigate = useNavigate()
    const [searchParams] = useSearchParams()
    const [pagination, setPagination] = useState(() => {
        const page = Math.max(0, parseInt(searchParams.get('page') || '1') - 1)
        const limit = parseInt(searchParams.get('limit') || '10')
        const pageSize = [10, 20, 50, 100].includes(limit) ? limit : 10
        return { pageIndex: page, pageSize }
    })
    const [tableFilters, setTableFilters] = useState<Record<string, string | string[] | boolean>>({
        requestStatus: 'all',
        orderType: 'all',
    })

    const { options: requestStatusOptions } = useSettingOptions('requestStatus')
    const { options: orderTypeOptions } = useSettingOptions('orderType')
    const filters: TableFilter[] = useMemo(
        () => [
            {
                id: 'requestStatus',
                label: 'סטטוס בקשה',
                fieldName: 'requestStatus',
                type: 'select',
                placeholder: 'בחר סטטוס בקשה',
                defaultValue: 'all',
                options: [{ value: 'all', label: 'כל הבקשות' }, ...requestStatusOptions],
            },
            {
                id: 'orderTypeFilter',
                label: 'סוג צו',
                fieldName: 'orderType',
                type: 'select',
                placeholder: 'בחר סוג צו',
                defaultValue: 'all',
                options: [{ value: 'all', label: 'כל הסוגים' }, ...orderTypeOptions],
            },
        ],
        [requestStatusOptions, orderTypeOptions]
    )

    const {
        globalFilter,
        setGlobalFilter,
        sorting,
        setSorting,
        columnFilters,
        setColumnFilters,
        columnVisibility,
        setColumnVisibility,
        handleClearFilters: clearFilters,
        syncColumnFilters,
    } = useTableState({
        id: RESERVE_DAY_FORM_NAME,
        defaultHiddenColumnIds: RESERVE_DAY_EXTRA_COLUMN_IDS,
    })

    const debouncedSearch = useDebounce(globalFilter, 300)
    const activeSort = sorting[0]
    const sortField = activeSort?.id
    const sortOrder: 'asc' | 'desc' | undefined = activeSort ? (activeSort.desc ? 'desc' : 'asc') : undefined

    const { data, isLoading } = useReserveDayListQuery({
        page: pagination.pageIndex + 1,
        limit: pagination.pageSize,
        search: debouncedSearch,
        filters: tableFilters,
        sortField,
        sortOrder,
    })
    const { data: metrics = [] } = useReserveDayMetricsQuery()

    const items = useMemo(() => data?.items ?? [], [data])
    const totalCount = data?.pagination.total ?? 0
    const totalPages = data?.pagination.pages ?? 0

    useEffect(() => {
        if (totalPages > 0 && pagination.pageIndex + 1 > totalPages) {
            setPagination((prev) => ({ ...prev, pageIndex: totalPages - 1 }))
        }
    }, [totalPages, pagination.pageIndex])

    const columns = useReserveDayColumns()

    const defaultColumn = useMemo(() => ({ size: 100, minSize: 50, maxSize: 100 }), [])
    const filterFns = useMemo(() => ({ fuzzy: fuzzyFilter, global: customGlobalFilter }), [])

    const handleSortingChange: typeof setSorting = useCallback(
        (updater) => {
            setSorting(updater)
            setPagination((prev) => ({ ...prev, pageIndex: 0 }))
        },
        [setSorting]
    )

    const table = useReactTable<ReserveDayRecord>({
        defaultColumn,
        columnResizeDirection: 'rtl',
        data: items,
        columns,
        getCoreRowModel: getCoreRowModel(),
        getFacetedRowModel: getFacetedRowModel(),
        getFacetedUniqueValues: getFacetedUniqueValues(),
        getFacetedMinMaxValues: getFacetedMinMaxValues(),
        state: { globalFilter, sorting, columnFilters, pagination, columnVisibility },
        onGlobalFilterChange: setGlobalFilter,
        onSortingChange: handleSortingChange,
        onColumnFiltersChange: setColumnFilters,
        onPaginationChange: setPagination,
        onColumnVisibilityChange: setColumnVisibility,
        globalFilterFn: 'global',
        filterFns,
        enableSorting: true,
        enableColumnFilters: true,
        enableGlobalFilter: true,
        enableHiding: true,
        manualPagination: true,
        manualFiltering: true,
        manualSorting: true,
        rowCount: totalCount,
    })

    const handleFilterChange = (filterId: string, value: string | string[] | boolean) => {
        setTableFilters((prev) => ({ ...prev, [filterId]: value }))
        setPagination((prev) => ({ ...prev, pageIndex: 0 }))
    }

    const handleClearFilters = () => {
        clearFilters(table as never)
        setTableFilters({ requestStatus: 'all', orderType: 'all' })
        setPagination((prev) => ({ ...prev, pageIndex: 0 }))
    }

    const columnFiltersState = table.getState().columnFilters
    useEffect(() => {
        syncColumnFilters(table as never)
    }, [columnFiltersState, syncColumnFilters, table])

    const { formState, itemId } = useRouteContext()
    const isDrawerOpen = useDrawerState()

    const handleRowClick = (rowId: string) => {
        navigate(generateEditPath(RESERVE_DAY_FORM_NAME, RESERVE_DAY_ROUTE_ID, rowId))
    }

    const handleAddNew = () => {
        navigate(generateNewPath(RESERVE_DAY_FORM_NAME, RESERVE_DAY_ROUTE_ID))
    }

    const onDrawerClose = () => {
        navigate(generateFormPath(RESERVE_DAY_FORM_NAME, RESERVE_DAY_ROUTE_ID))
    }

    return (
        <Box display="flex" flexDirection="column" h="full">
            <PageHeader
                title="צווי מילואים"
                description=" צווי מילואים "
                action={{ label: 'צווי מילואים', onClick: handleAddNew, icon: undefined }}
            />

            {metrics.length > 0 && (
                <Grid templateColumns={{ base: 'repeat(1, 1fr)', md: 'repeat(2, 1fr)', lg: 'repeat(4, 1fr)' }} gap={6} mb={6}>
                    {metrics.map((metric) => (
                        <MetricCard
                            key={metric.id}
                            icon={METRIC_ICONS[metric.icon ?? 'FaList'] ?? FaList}
                            label={metric.title}
                            value={metric.value}
                            color={metric.color ?? 'blue.500'}
                        />
                    ))}
                </Grid>
            )}

            <VStack gap={4} align="stretch" w="full" h="full" overflow="hidden">
                <TableControls
                    globalFilter={globalFilter}
                    setGlobalFilter={setGlobalFilter}
                    handleClearFilters={handleClearFilters}
                    sorting={sorting}
                    columnFilters={columnFilters}
                    tableFilters={tableFilters}
                    filters={filters}
                    filterValues={tableFilters}
                    onFilterChange={handleFilterChange}
                    table={table as never}
                />
                <Box flex="1" overflow="auto" minH="0">
                    {!isLoading && <TableContainer table={table as never} onRowClick={handleRowClick} />}
                </Box>
                <TablePagination
                    table={table as never}
                    onPageSizeChange={(newSize) => setPagination((prev) => ({ pageIndex: prev.pageIndex, pageSize: newSize }))}
                />
            </VStack>

            <ReserveDayDrawer key={`${formState}-${itemId || 'new'}`} isOpen={isDrawerOpen} onClose={onDrawerClose} />
        </Box>
    )
}
