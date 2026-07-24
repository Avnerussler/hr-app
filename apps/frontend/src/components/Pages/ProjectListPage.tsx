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
import { FaProjectDiagram, FaCheck, FaUserTimes, FaHourglassHalf } from 'react-icons/fa'
import { useProjectListQuery, useProjectMetricsQuery } from '@/hooks/queries/useProjectQueries'
import { useSettingOptions } from '@/hooks/queries/useSettingQueries'
import { useProjectColumns } from '@/hooks/useProjectColumns'
import { ProjectDrawer } from '@/components/Project/ProjectDrawer'
import type { ProjectRecord } from '@/hooks/queries/useProjectQueries'

const PROJECT_FORM_NAME = 'project_management'
const PROJECT_ROUTE_ID = 'default'

const METRIC_ICONS: Record<string, React.ElementType> = {
    FaProjectDiagram: FaProjectDiagram,
    FaCheck: FaCheck,
    FaUserTimes: FaUserTimes,
    FaHourglassHalf: FaHourglassHalf,
}

export function ProjectListPage() {
    const navigate = useNavigate()
    const [searchParams] = useSearchParams()
    const [pagination, setPagination] = useState(() => {
        const page = Math.max(0, parseInt(searchParams.get('page') || '1') - 1)
        const limit = parseInt(searchParams.get('limit') || '10')
        const pageSize = [10, 20, 50, 100].includes(limit) ? limit : 10
        return { pageIndex: page, pageSize }
    })
    const [tableFilters, setTableFilters] = useState<Record<string, string | string[] | boolean>>({
        projectStatus: 'all',
    })

    const { options: projectStatusOptions } = useSettingOptions('projectStatus')
    const projectStatusFilter: TableFilter = useMemo(
        () => ({
            id: 'projectStatusFilter',
            label: 'סטטוס הפרוייקט',
            fieldName: 'projectStatus',
            type: 'select',
            placeholder: 'בחר סטטוס',
            defaultValue: 'all',
            options: [{ value: 'all', label: 'הכל' }, ...projectStatusOptions],
        }),
        [projectStatusOptions]
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
    } = useTableState({ id: PROJECT_FORM_NAME })

    const debouncedSearch = useDebounce(globalFilter, 300)
    const activeSort = sorting[0]
    const sortField = activeSort?.id
    const sortOrder: 'asc' | 'desc' | undefined = activeSort ? (activeSort.desc ? 'desc' : 'asc') : undefined

    const { data, isLoading } = useProjectListQuery({
        page: pagination.pageIndex + 1,
        limit: pagination.pageSize,
        search: debouncedSearch,
        filters: tableFilters,
        sortField,
        sortOrder,
    })
    const { data: metrics = [] } = useProjectMetricsQuery()

    const items = useMemo(() => data?.items ?? [], [data])
    const totalCount = data?.pagination.total ?? 0
    const totalPages = data?.pagination.pages ?? 0

    useEffect(() => {
        if (totalPages > 0 && pagination.pageIndex + 1 > totalPages) {
            setPagination((prev) => ({ ...prev, pageIndex: totalPages - 1 }))
        }
    }, [totalPages, pagination.pageIndex])

    const columns = useProjectColumns()

    const defaultColumn = useMemo(() => ({ size: 100, minSize: 50, maxSize: 100 }), [])
    const filterFns = useMemo(() => ({ fuzzy: fuzzyFilter, global: customGlobalFilter }), [])

    const handleSortingChange: typeof setSorting = useCallback(
        (updater) => {
            setSorting(updater)
            setPagination((prev) => ({ ...prev, pageIndex: 0 }))
        },
        [setSorting]
    )

    const table = useReactTable<ProjectRecord>({
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
        setTableFilters({ projectStatus: 'all' })
        setPagination((prev) => ({ ...prev, pageIndex: 0 }))
    }

    const columnFiltersState = table.getState().columnFilters
    useEffect(() => {
        syncColumnFilters(table as never)
    }, [columnFiltersState, syncColumnFilters, table])

    const { formState, itemId } = useRouteContext()
    const isDrawerOpen = useDrawerState()

    const handleRowClick = (rowId: string) => {
        navigate(generateEditPath(PROJECT_FORM_NAME, PROJECT_ROUTE_ID, rowId))
    }

    const handleAddNew = () => {
        navigate(generateNewPath(PROJECT_FORM_NAME, PROJECT_ROUTE_ID))
    }

    const onDrawerClose = () => {
        navigate(generateFormPath(PROJECT_FORM_NAME, PROJECT_ROUTE_ID))
    }

    return (
        <Box display="flex" flexDirection="column" h="full">
            <PageHeader
                title="ניהול פרויקטים"
                description=" ניהול פרויקטים "
                action={{ label: 'ניהול פרויקטים', onClick: handleAddNew, icon: undefined }}
            />

            {metrics.length > 0 && (
                <Grid templateColumns={{ base: 'repeat(1, 1fr)', md: 'repeat(2, 1fr)', lg: 'repeat(3, 1fr)', xl: 'repeat(4, 1fr)' }} gap={6} mb={6}>
                    {metrics.map((metric) => (
                        <MetricCard
                            key={metric.id}
                            icon={METRIC_ICONS[metric.icon ?? 'FaProjectDiagram'] ?? FaProjectDiagram}
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
                    filters={[projectStatusFilter]}
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

            <ProjectDrawer key={`${formState}-${itemId || 'new'}`} isOpen={isDrawerOpen} onClose={onDrawerClose} />
        </Box>
    )
}
