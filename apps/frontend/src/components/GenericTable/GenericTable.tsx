import {
    createColumnHelper,
    DisplayColumnDef,
    FilterFn,
    flexRender,
    getCoreRowModel,
    getFilteredRowModel,
    useReactTable,
} from '@tanstack/react-table'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { FC, useMemo, useState } from 'react'
import { Box, Link, Table, Tag, VStack } from '@chakra-ui/react'

import { AllFormSubmission } from '@/types/formType'
import { FormFields } from '@/types/fieldsType'
import { Dialog } from '../Dialog'
import { GenericForm } from '../GenericForm'
import {
    // RankingInfo,
    rankItem,
    // compareItems,
} from '@tanstack/match-sorter-utils'
import { DeleteCell } from './CustomsCells'
import { Filter } from './Filter'
import { DebouncedInput } from '../DebounceInput'
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
}
export const GenericTable: FC<GenericTableProps> = ({
    id,
    isEditable = true,
    isCanBeDeleted = true,
    withIndex = true,
}) => {
    const [globalFilter, setGlobalFilter] = useState<string>('')
    const queryClient = useQueryClient()

    const { data: formFields, isSuccess } = useQuery<{
        form: { formFields: FormFields[] }
    }>({
        queryKey: ['formFields/get', id],
        staleTime: 1000 * 60 * 5,
    })

    const { data: submittedData } = useQuery<AllFormSubmission>({
        queryKey: ['formSubmission/get', id],
    })

    const deleteMutation = useMutation({
        onSuccess(
            _,
            variables: { params: string; url: string; method: string }
        ) {
            queryClient.setQueryData(
                ['formSubmission/get', id],
                (oldData: AllFormSubmission | undefined) => {
                    if (!oldData) return
                    return {
                        forms: oldData.forms.filter(
                            (form) => form._id !== variables.params
                        ),
                    }
                }
            )
        },
    })
    const handleDelete = (rowId: string) => {
        if (!submittedData?.forms[parseInt(rowId)]._id) {
            return
        }
        deleteMutation.mutate({
            url: 'formSubmission/delete/',
            method: 'DELETE',
            params: submittedData?.forms[parseInt(rowId)]._id,
        })
    }

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
                return options.find((option) => rawValue.includes(option.value))
                    ?.label
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

    const indexColumn = columnHelper.display({
        id: 'index',
        header: 'מספר שורה',
        cell: (info) => info.row.index + 1,
        enableSorting: false,
        filterFn: 'equalsString',
    })

    const editColumn = columnHelper.display({
        id: 'edit',
        header: 'עריכה',
        cell: (info) => (
            <Dialog title="עריכת טופס" buttonText="עריכה">
                <GenericForm
                    formMode="update"
                    defaultValues={submittedData?.forms[info.row.index]}
                    formId={id}
                />
            </Dialog>
        ),
    })

    const columns = useMemo(() => {
        return isSuccess && formFields.form.formFields.length
            ? formFields?.form.formFields.map((field) =>
                  columnHelper.accessor(field.name as keyof FormFields, {
                      header: () => <Box>{field.label}</Box>,
                      id: field._id,
                      cell: (info) => {
                          const value = info.getValue()

                          if (field.type === 'file' && value) {
                              return (
                                  <Link href={value as string}>
                                      {value as string}
                                  </Link>
                              )
                          }
                          if (field.type === 'select') {
                              return field.options?.find(
                                  (option) => option.value === value
                              )?.label
                          }
                          if (field.type === 'multipleSelect') {
                              if (!Array.isArray(value)) return
                              const commonItems = field.options?.filter(
                                  (item) =>
                                      (value as unknown as string[])?.includes(
                                          item.value
                                      )
                              )

                              return commonItems?.map((item) => (
                                  <Tag.Root key={item.value}>
                                      <Tag.Label>{item.label}</Tag.Label>
                                  </Tag.Root>
                              ))
                          }
                          if (field.type === 'radio') {
                              return field.items?.find(
                                  (item) => item.value === value
                              )?.label
                          }
                          return value
                      },
                      filterFn: fuzzyFilter,
                      meta: {
                          options:
                              field.type === 'select' ||
                              field.type === 'multipleSelect'
                                  ? field.options
                                  : undefined,
                          items:
                              field.type === 'radio' ? field.items : undefined,
                      },
                  })
              )
            : []
    }, [formFields, isSuccess])

    const mergeColumns: (
        | (typeof columns)[number]
        | DisplayColumnDef<FormFields, unknown>
    )[] = [...columns]

    const columnsToAdd = () => {
        if (isEditable) {
            mergeColumns.push(editColumn)
        }
        if (isCanBeDeleted) {
            mergeColumns.push(
                DeleteCell({ columnHelper, onClick: handleDelete })
            )
        }
        if (withIndex) {
            mergeColumns.unshift(indexColumn)
        }

        return mergeColumns
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
        state: {
            globalFilter,
        },
        onGlobalFilterChange: setGlobalFilter,
        globalFilterFn: 'fuzzy',
        filterFns: {
            fuzzy: fuzzyFilter, //define as a filter function that can be used in column definitions
        },
    })

    return (
        <>
            <DebouncedInput
                value={globalFilter ?? ''}
                onChange={(value) => setGlobalFilter(String(value))}
                className="p-2 font-lg shadow border border-block"
                placeholder="חפש בכל העמודות..."
            />
            <Table.Root size="sm" interactive>
                <Table.Header>
                    {table.getHeaderGroups().map((headerGroup) => (
                        <Table.Row key={headerGroup.id}>
                            {headerGroup.headers.map((header) => (
                                <Table.ColumnHeader key={header.id}>
                                    <VStack justifyContent="center">
                                        {header.column.getCanFilter() && (
                                            <Filter column={header.column} />
                                        )}
                                        {header.isPlaceholder
                                            ? null
                                            : flexRender(
                                                  header.column.columnDef
                                                      .header,
                                                  header.getContext()
                                              )}
                                    </VStack>
                                </Table.ColumnHeader>
                            ))}
                        </Table.Row>
                    ))}
                </Table.Header>
                <Table.Body>
                    {table.getRowModel().rows.map((row) => (
                        <Table.Row key={row.id}>
                            {row.getVisibleCells().map((cell) => (
                                <Table.Cell key={cell.id}>
                                    {flexRender(
                                        cell.column.columnDef.cell,
                                        cell.getContext()
                                    )}
                                </Table.Cell>
                            ))}
                        </Table.Row>
                    ))}
                </Table.Body>
            </Table.Root>
        </>
    )
}
