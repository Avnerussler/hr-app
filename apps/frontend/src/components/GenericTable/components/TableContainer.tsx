import { FC } from 'react'
import { Table, flexRender } from '@tanstack/react-table'
import { Box } from '@chakra-ui/react'
import { FormFields } from '@/types/fieldsType'
import { AllFormSubmission } from '@/types/formType'
import { TableBody } from './TableBody'

interface TableContainerProps {
    table: Table<FormFields>
    submittedData: AllFormSubmission | undefined
    onRowClick?: (rowId: string) => void
}

export const TableContainer: FC<TableContainerProps> = ({
    table,
    submittedData,
    onRowClick,
}) => {
    return (
        <Box
            position="relative"
            w="full"
            overflowX="auto"
            bg="card"
            borderRadius="lg"
            border="1px solid"
            borderColor="border"
            shadow="sm"
        >
            <Box as="table" w="full" fontSize="sm">
                {/* Table Header */}
                <Box as="thead">
                    {table.getHeaderGroups().map((headerGroup) => (
                        <Box
                            as="tr"
                            key={headerGroup.id}
                            borderBottomWidth="1px"
                            borderColor="border"
                        >
                            {headerGroup.headers.map((header) => (
                                <Box
                                    as="th"
                                    key={header.id}
                                    color="foreground"
                                    h="40px"
                                    px={2}
                                    textAlign="left"
                                    verticalAlign="middle"
                                    fontWeight="medium"
                                    whiteSpace="nowrap"
                                >
                                    {header.isPlaceholder
                                        ? null
                                        : flexRender(
                                              header.column.columnDef.header,
                                              header.getContext()
                                          )}
                                </Box>
                            ))}
                        </Box>
                    ))}
                </Box>

                {/* Table Body */}
                <TableBody
                    table={table}
                    submittedData={submittedData}
                    onRowClick={onRowClick}
                />
            </Box>
        </Box>
    )
}
