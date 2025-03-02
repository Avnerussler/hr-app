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
import { Box, Link, Table } from '@chakra-ui/react'

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
    const indexColumn = columnHelper.display({
        id: 'index',
        header: 'מספר שורה',
        cell: (info) => info.row.index + 1,
        enableSorting: false,
    })

    // const deleteCustomColumn = deleteColumn(columnHelper)

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
                          const value = info.getValue() as string

                          if (field.type === 'file' && value) {
                              return <Link href={value}>קובץ</Link>
                          }
                          if (field.type === 'select') {
                              return field.options?.find(
                                  (option) => option.value === value
                              )?.label
                          }

                          // For other field types, just render the value as text
                          return value
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
            mergeColumns.unshift(editColumn)
        }
        if (isCanBeDeleted) {
            mergeColumns.unshift(
                DeleteCell({ columnHelper, onClick: handleDelete })
            )
        }
        if (withIndex) {
            mergeColumns.push(indexColumn)
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

    // Define a custom fuzzy filter function that will apply ranking info to rows (using match-sorter utils)
    const fuzzyFilter: FilterFn<FormFields> = (
        row,
        columnId,
        value,
        addMeta
    ) => {
        // Rank the item
        const itemRank = rankItem(row.getValue(columnId), value)

        // Store the itemRank info
        addMeta({
            itemRank,
        })

        // Return if the item should be filtered in/out
        return itemRank.passed
    }
    const table = useReactTable({
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
            <Filter globalFilter={globalFilter} table={table} />
            <Table.Root size="sm" interactive>
                <Table.Header>
                    {table.getHeaderGroups().map((headerGroup) => (
                        <Table.Row key={headerGroup.id}>
                            {headerGroup.headers.map((header) => (
                                <Table.ColumnHeader key={header.id}>
                                    {header.isPlaceholder
                                        ? null
                                        : flexRender(
                                              header.column.columnDef.header,
                                              header.getContext()
                                          )}
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
            </Table.Root>{' '}
        </>
    )
}
