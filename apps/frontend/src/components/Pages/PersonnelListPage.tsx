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
import { STUDIO_ROLE_LABELS, RESERVE_CATEGORY_LABELS } from '@hr-app/shared-types'
import { FaUserCheck, FaUserTimes, FaUsers } from 'react-icons/fa'
import { usePersonnelListQuery, usePersonnelMetricsQuery, useProjectOptionsQuery } from '@/hooks/queries/usePersonnelQueries'
import { usePersonnelColumns } from '@/hooks/usePersonnelColumns'
import { PersonnelDrawer } from '@/components/Personnel/PersonnelDrawer'
import type { PersonnelRecord } from '@/hooks/queries/usePersonnelQueries'

const PERSONNEL_FORM_NAME = 'personnel'
const PERSONNEL_ROUTE_ID = 'default'

const METRIC_ICONS: Record<string, React.ElementType> = {
    FaUserCheck: FaUserCheck,
    FaUserTimes: FaUserTimes,
    FaUsers: FaUsers,
}

const IS_ACTIVE_FILTER: TableFilter = {
    id: 'isActiveFilter',
    label: 'סטטוס',
    fieldName: 'isActive',
    type: 'select',
    placeholder: 'בחר סטטוס',
    defaultValue: 'all',
    options: [
        { value: 'all', label: 'הכל' },
        { value: 'true', label: 'פעיל' },
        { value: 'false', label: 'לא פעיל' },
    ],
}

const STUDIO_ROLE_FILTER: TableFilter = {
    id: 'studioRoleFilter',
    label: 'תפקיד בסטודיו',
    fieldName: 'studioRole',
    type: 'multiSelect',
    placeholder: 'בחר תפקיד בסטודיו',
    defaultValue: [],
    options: Object.entries(STUDIO_ROLE_LABELS).map(([value, label]) => ({ value, label })),
}

const RESERVE_CATEGORY_FILTER: TableFilter = {
    id: 'reserveCategoryFilter',
    label: 'סוג העסקה',
    fieldName: 'reserveCategory',
    type: 'multiSelect',
    placeholder: 'בחר סוג העסקה',
    defaultValue: [],
    options: Object.entries(RESERVE_CATEGORY_LABELS).map(([value, label]) => ({ value, label })),
}

export function PersonnelListPage() {
    const navigate = useNavigate()
    const [searchParams] = useSearchParams()
    const [pagination, setPagination] = useState(() => {
        const page = Math.max(0, parseInt(searchParams.get('page') || '1') - 1)
        const limit = parseInt(searchParams.get('limit') || '10')
        const pageSize = [10, 20, 50, 100].includes(limit) ? limit : 10
        return { pageIndex: page, pageSize }
    })
    const [tableFilters, setTableFilters] = useState<Record<string, string | string[] | boolean>>({
        isActive: 'all',
        studioRole: [],
        reserveCategory: [],
        assignedProjects: [],
    })

    const { globalFilter, setGlobalFilter, sorting, setSorting, columnFilters, setColumnFilters, handleClearFilters: clearFilters, syncColumnFilters } =
        useTableState({ id: PERSONNEL_FORM_NAME })

    const debouncedSearch = useDebounce(globalFilter, 300)
    const activeSort = sorting[0]
    const sortField = activeSort?.id
    const sortOrder: 'asc' | 'desc' | undefined = activeSort ? (activeSort.desc ? 'desc' : 'asc') : undefined

    const { data: projectOptionsData } = useProjectOptionsQuery('', 1)
    const projectOptions = projectOptionsData?.options ?? []
    const assignedProjectsFilter: TableFilter = useMemo(
        () => ({
            id: 'assignedProjectsFilter',
            label: 'שיוך לפרויקט',
            fieldName: 'assignedProjects',
            type: 'multiSelect',
            placeholder: 'בחר פרויקט',
            defaultValue: [],
            options: projectOptions.map((opt) => ({ value: opt.value, label: opt.label })),
        }),
        [projectOptions]
    )

    const { data, isLoading } = usePersonnelListQuery({
        page: pagination.pageIndex + 1,
        limit: pagination.pageSize,
        search: debouncedSearch,
        filters: tableFilters,
        sortField,
        sortOrder,
    })
    const { data: metrics = [] } = usePersonnelMetricsQuery()

    const items = useMemo(() => data?.items ?? [], [data])
    const totalCount = data?.pagination.total ?? 0
    const totalPages = data?.pagination.pages ?? 0

    useEffect(() => {
        if (totalPages > 0 && pagination.pageIndex + 1 > totalPages) {
            setPagination((prev) => ({ ...prev, pageIndex: totalPages - 1 }))
        }
    }, [totalPages, pagination.pageIndex])

    const columns = usePersonnelColumns()

    const defaultColumn = useMemo(() => ({ size: 100, minSize: 50, maxSize: 100 }), [])
    const filterFns = useMemo(() => ({ fuzzy: fuzzyFilter, global: customGlobalFilter }), [])

    const handleSortingChange: typeof setSorting = useCallback(
        (updater) => {
            setSorting(updater)
            setPagination((prev) => ({ ...prev, pageIndex: 0 }))
        },
        [setSorting]
    )

    const table = useReactTable<PersonnelRecord>({
        defaultColumn,
        columnResizeDirection: 'rtl',
        data: items,
        columns,
        getCoreRowModel: getCoreRowModel(),
        getFacetedRowModel: getFacetedRowModel(),
        getFacetedUniqueValues: getFacetedUniqueValues(),
        getFacetedMinMaxValues: getFacetedMinMaxValues(),
        state: { globalFilter, sorting, columnFilters, pagination },
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

    const handleFilterChange = (filterId: string, value: string | string[] | boolean) => {
        setTableFilters((prev) => ({ ...prev, [filterId]: value }))
        setPagination((prev) => ({ ...prev, pageIndex: 0 }))
    }

    const handleClearFilters = () => {
        clearFilters(table as never)
        setTableFilters({ isActive: 'all', studioRole: [], reserveCategory: [], assignedProjects: [] })
        setPagination((prev) => ({ ...prev, pageIndex: 0 }))
    }

    const columnFiltersState = table.getState().columnFilters
    useEffect(() => {
        syncColumnFilters(table as never)
    }, [columnFiltersState, syncColumnFilters, table])

    const { formState, itemId } = useRouteContext()
    const isDrawerOpen = useDrawerState()

    const handleRowClick = (rowId: string) => {
        navigate(generateEditPath(PERSONNEL_FORM_NAME, PERSONNEL_ROUTE_ID, rowId))
    }

    const handleAddNew = () => {
        navigate(generateNewPath(PERSONNEL_FORM_NAME, PERSONNEL_ROUTE_ID))
    }

    const onDrawerClose = () => {
        navigate(generateFormPath(PERSONNEL_FORM_NAME, PERSONNEL_ROUTE_ID))
    }

    const handleExportToExcel = useCallback(async () => {
        // Excel export for the new explicit entities is scoped to a later pass —
        // no-op for now rather than reusing the schema-driven exporter.
    }, [])

    return (
        <Box display="flex" flexDirection="column" h="full">
            <PageHeader
                title="משאבי אנוש"
                description=" משאבי אנוש "
                action={{ label: 'משאבי אנוש', onClick: handleAddNew, icon: undefined }}
            />

            {metrics.length > 0 && (
                <Grid templateColumns={{ base: 'repeat(1, 1fr)', md: 'repeat(2, 1fr)', lg: 'repeat(3, 1fr)', xl: 'repeat(4, 1fr)' }} gap={6} mb={6}>
                    {metrics.map((metric) => (
                        <MetricCard
                            key={metric.id}
                            icon={METRIC_ICONS[metric.icon ?? 'FaUsers'] ?? FaUsers}
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
                    onExportToExcel={handleExportToExcel}
                    filters={[IS_ACTIVE_FILTER, STUDIO_ROLE_FILTER, RESERVE_CATEGORY_FILTER, assignedProjectsFilter]}
                    filterValues={tableFilters}
                    onFilterChange={handleFilterChange}
                />
                <Box flex="1" overflow="auto" minH="0">
                    {!isLoading && <TableContainer table={table as never} onRowClick={handleRowClick} />}
                </Box>
                <TablePagination
                    table={table as never}
                    onPageSizeChange={(newSize) => setPagination((prev) => ({ pageIndex: prev.pageIndex, pageSize: newSize }))}
                />
            </VStack>

            <PersonnelDrawer key={`${formState}-${itemId || 'new'}`} isOpen={isDrawerOpen} onClose={onDrawerClose} />
        </Box>
    )
}
