import { FC } from 'react'
import { Table } from '@tanstack/react-table'
import { Flex, Box, Button } from '@chakra-ui/react'
import { FiX, FiDownload } from 'react-icons/fi'
import { DebouncedInput } from '../../../DebounceInput'
import { TableFilters } from './TableFilters'
import { ColumnVisibilityMenu } from './ColumnVisibilityMenu'
import { TableFilter } from '@/types/fieldsType'

interface TableControlsProps {
    globalFilter: string
    setGlobalFilter: (value: string) => void
    handleClearFilters: () => void
    sorting: any[]
    columnFilters: any[]
    tableFilters?: Record<string, string | string[] | boolean>
    onExportToExcel?: () => void
    filters?: TableFilter[]
    filterValues?: Record<string, string | string[] | boolean>
    onFilterChange?: (
        filterId: string,
        value: string | string[] | boolean
    ) => void
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    table?: Table<any>
}

export const TableControls: FC<TableControlsProps> = ({
    globalFilter,
    setGlobalFilter,
    handleClearFilters,
    sorting,
    columnFilters,
    tableFilters,
    onExportToExcel,
    filters,
    filterValues,
    onFilterChange,
    table,
}) => {
    const hasActiveTableFilters = tableFilters
        ? Object.values(tableFilters).some(
              (v) => v !== '' && v !== 'all' && !(Array.isArray(v) && v.length === 0)
          )
        : false
    return (
        <Flex gap={2} direction={{ base: 'column', lg: 'row' }} align="stretch">
            {filters && filters.length > 0 && filterValues && onFilterChange && (
                <TableFilters
                    filters={filters}
                    filterValues={filterValues}
                    onFilterChange={onFilterChange}
                />
            )}
            <Box flex="1" minW="200px">
                <DebouncedInput
                    value={globalFilter ?? ''}
                    onChange={(value) => setGlobalFilter(String(value))}
                    placeholder="חפש בכל העמודות..."
                />
            </Box>
            {table && <ColumnVisibilityMenu table={table} />}
            {onExportToExcel && (
                <Button
                    variant="outline"
                    size="sm"
                    onClick={onExportToExcel}
                    bg="card"
                    borderColor="border"
                    color="foreground"
                    _hover={{
                        bg: 'muted',
                    }}
                >
                    <FiDownload />
                    Export Excel
                </Button>
            )}
            <Button
                variant="outline"
                size="sm"
                onClick={handleClearFilters}
                disabled={
                    !sorting.length && !columnFilters.length && !globalFilter && !hasActiveTableFilters
                }
                bg="card"
                borderColor="border"
                color="foreground"
                _hover={{
                    bg: 'muted',
                }}
            >
                <FiX />
                Clear Filters
            </Button>
        </Flex>
    )
}
