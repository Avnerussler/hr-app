import { FC } from 'react'
import { Column } from '@tanstack/react-table'
import { VStack, HStack, Text, IconButton, Box } from '@chakra-ui/react'
import { FiChevronUp, FiChevronDown } from 'react-icons/fi'
import { FormFields } from '@/types/fieldsType'
import { Filter } from '../Filter'

interface TableHeaderProps {
    column: Column<Record<string, unknown>, unknown>
    field: FormFields
}

export const TableHeader: FC<TableHeaderProps> = ({ column, field }) => {
    return (
        <VStack align="start" gap={2} w="full">
            <HStack justify="space-between" w="full">
                <Text fontWeight="medium" color="foreground" fontSize="sm">
                    {field.label}
                </Text>
                <IconButton
                    variant="ghost"
                    size="xs"
                    onClick={() => column.toggleSorting()}
                    aria-label="Sort column"
                    bg="transparent"
                    color="muted.foreground"
                    _hover={{
                        bg: 'muted',
                        color: 'foreground',
                    }}
                    minW="6"
                    h="6"
                >
                    {column.getIsSorted() === 'asc' ? (
                        <FiChevronUp size="12px" />
                    ) : (
                        <FiChevronDown size="12px" />
                    )}
                </IconButton>
            </HStack>
            {column.getCanFilter() && (
                <Box onClick={(e) => e.stopPropagation()}>
                    <Filter column={column} />
                </Box>
            )}
        </VStack>
    )
}
