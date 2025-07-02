import { FC } from 'react'
import { Flex, Box, Button } from '@chakra-ui/react'
import { FiX } from 'react-icons/fi'
import { DebouncedInput } from '../../DebounceInput'

interface TableControlsProps {
    globalFilter: string
    setGlobalFilter: (value: string) => void
    handleClearFilters: () => void
    sorting: any[]
    columnFilters: any[]
}

export const TableControls: FC<TableControlsProps> = ({
    globalFilter,
    setGlobalFilter,
    handleClearFilters,
    sorting,
    columnFilters,
}) => {
    return (
        <Flex gap={2} align="center">
            <Box flex="1">
                <DebouncedInput
                    value={globalFilter ?? ''}
                    onChange={(value) => setGlobalFilter(String(value))}
                    placeholder="חפש בכל העמודות..."
                />
            </Box>
            <Button
                variant="outline"
                size="sm"
                onClick={handleClearFilters}
                disabled={
                    !sorting.length &&
                    !columnFilters.length &&
                    !globalFilter
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