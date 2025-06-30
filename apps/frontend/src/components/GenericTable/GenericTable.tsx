import {
    createColumnHelper,
    FilterFn,
    flexRender,
    getCoreRowModel,
    getFilteredRowModel,
    getSortedRowModel,
    useReactTable,
    SortingState,
    ColumnFiltersState,
    getFacetedRowModel,
    getFacetedUniqueValues,
    getFacetedMinMaxValues,
} from '@tanstack/react-table'
import { useQuery } from '@tanstack/react-query'
import { FC, useMemo, useState, useEffect } from 'react'
import {
    Box,
    Link,
    Tag,
    VStack,
    HStack,
    IconButton,
    Button,
    Flex,
    Text,
} from '@chakra-ui/react'
import { FiChevronUp, FiChevronDown, FiX } from 'react-icons/fi'

import { AllFormSubmission } from '@/types/formType'
import { IForm, FormFields } from '@/types/fieldsType'
// import { Dialog } from '../Dialog'
// import { GenericForm } from '../GenericForm'
import {
    // RankingInfo,
    rankItem,
    // compareItems,
} from '@tanstack/match-sorter-utils'
// import { DeleteCell } from './CustomsCells'
import { Filter } from './Filter'
import { DebouncedInput } from '../DebounceInput'
import { createTableStateManager } from '@/utils/localStorage'
declare module '@tanstack/react-table' {
    //add fuzzy filter to the filterFns
    interface FilterFns {
        fuzzy: FilterFn<unknown>
    }
}

const columnHelper = createColumnHelper<FormFields>()

interface GenericTableProps {
    id: string
    isEditable?: boolean
    isCanBeDeleted?: boolean
    withIndex?: boolean
    onRowClick?: (rowId: string) => void
}
export const GenericTable: FC<GenericTableProps> = ({
    id,
    // isEditable = true,
    // isCanBeDeleted = true,
    // withIndex = true,
    onRowClick,
}) => {
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
    // const queryClient = useQueryClient()

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
    const handleClearFilters = () => {
        setSorting([])
        setColumnFilters([])
        setGlobalFilter('')
        tableStateManager.clearTableState()
    }

    const { data: formFields, isSuccess } = useQuery<IForm>({
        queryKey: ['formFields/get', id],
        staleTime: 1000 * 60 * 5,
    })

    const { data: submittedData } = useQuery<AllFormSubmission>({
        queryKey: ['formSubmission/get', id],
    })

    // const deleteMutation = useMutation({
    //     onSuccess(
    //         _,
    //         variables: { params: string; url: string; method: string }
    //     ) {
    //         queryClient.setQueryData(
    //             ['formSubmission/get', id],
    //             (oldData: AllFormSubmission | undefined) => {
    //                 if (!oldData) return
    //                 return {
    //                     forms: oldData.forms.filter(
    //                         (form) => form._id !== variables.params
    //                     ),
    //                 }
    //             }
    //         )
    //     },
    // })
    // const handleDelete = (rowId: string) => {
    //     if (!submittedData?.forms[parseInt(rowId)]._id) {
    //         return
    //     }
    //     deleteMutation.mutate({
    //         url: 'formSubmission/delete/',
    //         method: 'DELETE',
    //         params: submittedData?.forms[parseInt(rowId)]._id,
    //     })
    // }

    const fuzzyFilter: FilterFn<FormFields> = (
        row,
        columnId,
        value,
        addMeta
    ) => {
        // Find the current column
        const column = row
            .getAllCells()
            .find((cell) => cell.column.id === columnId)

        // Check if the column has `options` in `meta` (for select fields)
        const options =
            ((
                column?.column.columnDef.meta as {
                    options?: { value: string; label: string }[]
                }
            )?.options ||
                (
                    column?.column.columnDef.meta as {
                        items?: { value: string; label: string }[]
                    }
                )?.items) ??
            []

        // Get the raw cell value
        const rawValue = row.getValue(columnId) as string

        // If options exist, map value to label, otherwise use raw value

        const valueToFilter = (options: { value: string; label: string }[]) => {
            if (options.length > 0) {
                return options.find((option) =>
                    rawValue?.includes(option.value)
                )?.label
            }

            return rawValue
        }
        // Rank the item based on the label (or raw value if no options exist)
        const itemRank = rankItem(valueToFilter(options), value)

        // Add meta data (for highlighting matched text if you need it)
        addMeta({
            itemRank,
        })

        return itemRank.passed
    }

    // const indexColumn = columnHelper.display({
    //     id: 'index',
    //     header: 'מספר שורה',
    //     cell: (info) => info.row.index + 1,
    //     enableSorting: false,
    //     filterFn: 'equalsString',
    // })

    // const editColumn = columnHelper.display({
    //     id: 'edit',
    //     header: 'עריכה',
    //     cell: (info) => (
    //         <Dialog title="עריכת טופס" buttonText="עריכה">
    //             <GenericForm
    //                 formMode="update"
    //                 defaultValues={submittedData?.forms[info.row.index]}
    //                 formId={id}
    //             />
    //         </Dialog>
    //     ),
    // })

    const columns = useMemo(() => {
        if (!formFields?.sections?.length) return []
        // TODO: Make it more dynamic to handle different sections
        const sectionToRender = formFields?.sections?.find(
            (section) => section.id === 'personalInformation'
        )
        return isSuccess && formFields?.sections?.length
            ? sectionToRender!.fields.map((field) =>
                  columnHelper.accessor(
                      (row) => row[field.name as keyof typeof row],
                      {
                          header: ({ column }) => (
                              <VStack align="start" gap={2} w="full">
                                  <HStack justify="space-between" w="full">
                                      <Text
                                          fontWeight="medium"
                                          color="foreground"
                                          fontSize="sm"
                                      >
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
                          ),
                          id: field._id,
                          enableSorting: true,
                          enableColumnFilter: true,
                          meta: {
                              filterVariant:
                                  field.type === 'number'
                                      ? 'range'
                                      : field.type === 'select' ||
                                          field.type === 'multipleSelect' ||
                                          field.type === 'radio'
                                        ? 'select'
                                        : 'text',
                              options:
                                  field.type === 'select' ||
                                  field.type === 'multipleSelect'
                                      ? field.options
                                      : undefined,
                              items:
                                  field.type === 'radio'
                                      ? field.items
                                      : undefined,
                          },
                          cell: (info) => {
                              const value = info.getValue()

                              if (field.type === 'file' && value) {
                                  return (
                                      <Link
                                          href={value as string}
                                          color="primary"
                                          textDecoration="underline"
                                          _hover={{
                                              color: 'primary',
                                              opacity: 0.8,
                                          }}
                                      >
                                          {value as string}
                                      </Link>
                                  )
                              }
                              if (field.type === 'select') {
                                  return (
                                      <Text color="foreground">
                                          {
                                              field.options?.find(
                                                  (option) =>
                                                      option.value === value
                                              )?.label
                                          }
                                      </Text>
                                  )
                              }
                              if (field.type === 'multipleSelect') {
                                  if (!Array.isArray(value)) return null
                                  const commonItems = field.options?.filter(
                                      (item) =>
                                          (
                                              value as unknown as string[]
                                          )?.includes(item.value)
                                  )

                                  return (
                                      <HStack gap={1} flexWrap="wrap">
                                          {commonItems?.map((item) => (
                                              <Tag.Root
                                                  key={item.value}
                                                  size="sm"
                                                  bg="secondary"
                                                  color="secondary.foreground"
                                                  borderRadius="md"
                                              >
                                                  <Tag.Label fontSize="xs">
                                                      {item.label}
                                                  </Tag.Label>
                                              </Tag.Root>
                                          ))}
                                      </HStack>
                                  )
                              }
                              if (field.type === 'radio') {
                                  return (
                                      <Text color="foreground">
                                          {
                                              field.items?.find(
                                                  (item) => item.value === value
                                              )?.label
                                          }
                                      </Text>
                                  )
                              }
                              // Ensure only valid ReactNode types are rendered
                              if (
                                  typeof value === 'string' ||
                                  typeof value === 'number' ||
                                  typeof value === 'boolean'
                              ) {
                                  return (
                                      <Text color="foreground">
                                          {String(value)}
                                      </Text>
                                  )
                              }
                              // Handle arrays (Option[] or Item[])
                              if (Array.isArray(value)) {
                                  return (
                                      <Text color="foreground">
                                          {value.map((v, i) => (
                                              <span key={i}>
                                                  {JSON.stringify(v)}
                                                  {i < value.length - 1
                                                      ? ', '
                                                      : ''}
                                              </span>
                                          ))}
                                      </Text>
                                  )
                              }
                              // Handle undefined or other types
                              return <Text color="foreground"></Text>
                          },
                          filterFn: fuzzyFilter,
                      }
                  )
              )
            : []
    }, [formFields, isSuccess])

    // Ensure columns are always typed as ColumnDef<IForm, unknown>[]
    const columnsToAdd = (): typeof columns => {
        // If you add custom columns, ensure they are also typed for IForm
        // if (isEditable) {
        //     columns.push(editColumn as ColumnDef<IForm, unknown>)
        // }
        // if (isCanBeDeleted) {
        //     columns.push(
        //         DeleteCell({ columnHelper, onClick: handleDelete }) as ColumnDef<IForm, unknown>
        //     )
        // }
        // if (withIndex) {
        //     columns.unshift(indexColumn as ColumnDef<IForm, unknown>)
        // }
        return columns
    }

    const data = useMemo(
        () =>
            isSuccess && submittedData?.forms?.length
                ? submittedData.forms.flatMap((form) => form.formData)
                : [],
        [isSuccess, submittedData]
    )

    const table = useReactTable({
        defaultColumn: {
            size: 100, // starting column size
            minSize: 50, // enforced during column resizing
            maxSize: 100, // enforced during column resizing
        },
        columnResizeDirection: 'rtl',

        data,
        columns: columnsToAdd(),
        getCoreRowModel: getCoreRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getFacetedRowModel: getFacetedRowModel(),
        getFacetedUniqueValues: getFacetedUniqueValues(),
        getFacetedMinMaxValues: getFacetedMinMaxValues(),
        state: {
            globalFilter,
            sorting,
            columnFilters,
        },
        onGlobalFilterChange: setGlobalFilter,
        onSortingChange: setSorting,
        onColumnFiltersChange: setColumnFilters,
        globalFilterFn: 'fuzzy',
        filterFns: {
            fuzzy: fuzzyFilter, //define as a filter function that can be used in column definitions
        },
        enableSorting: true,
        enableColumnFilters: true,
        enableGlobalFilter: true,
    })

    return (
        <VStack gap={4} align="stretch" w="full">
            {/* Controls Section */}
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

            {/* Table Container */}
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
                                        bg="muted/50"
                                    >
                                        {header.isPlaceholder
                                            ? null
                                            : flexRender(
                                                  header.column.columnDef
                                                      .header,
                                                  header.getContext()
                                              )}
                                    </Box>
                                ))}
                            </Box>
                        ))}
                    </Box>

                    {/* Table Body */}
                    <Box as="tbody">
                        {table.getRowModel().rows.map((row, index) => (
                            <Box
                                as="tr"
                                key={row.id}
                                borderBottomWidth="1px"
                                borderColor="border"
                                transition="colors 0.2s"
                                cursor={onRowClick ? 'pointer' : 'default'}
                                _hover={{
                                    bg: 'muted/50',
                                }}
                                _last={{
                                    borderBottom: 'none',
                                }}
                                onClick={() => {
                                    if (
                                        onRowClick &&
                                        submittedData?.forms?.[index]?._id
                                    ) {
                                        onRowClick(
                                            submittedData.forms[index]._id
                                        )
                                    }
                                }}
                            >
                                {row.getVisibleCells().map((cell) => (
                                    <Box
                                        as="td"
                                        key={cell.id}
                                        p={2}
                                        verticalAlign="middle"
                                        whiteSpace="nowrap"
                                        color="foreground"
                                    >
                                        {flexRender(
                                            cell.column.columnDef.cell,
                                            cell.getContext()
                                        )}
                                    </Box>
                                ))}
                            </Box>
                        ))}
                    </Box>
                </Box>
            </Box>
        </VStack>
    )
}
