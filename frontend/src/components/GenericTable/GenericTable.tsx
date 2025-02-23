import {
    createColumnHelper,
    flexRender,
    getCoreRowModel,
    useReactTable,
} from '@tanstack/react-table'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { FC, useMemo } from 'react'
import { Button, Table } from '@chakra-ui/react'

import { AllFormSubmission } from '@/types/formType'
import { FormFields } from '@/types/fieldsType'
import { Dialog } from '../Dialog'
import { GenericForm } from '../GenericForm'

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
    const queryClient = useQueryClient()

    const { data: submittedData, isSuccess } = useQuery<AllFormSubmission>({
        queryKey: ['formSubmission/get', id],
    })

    const deleteMutation = useMutation<
        void,
        unknown,
        { url: string; method: string; params: string }
    >({
        onSuccess(_, variables) {
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

    // const handleEdit = (rowId: string) => {
    //     if (!submittedData?.forms[parseInt(rowId)]._id) {
    //         return
    //     }

    //     return (
    //         <Dialog title="Edit Form" buttonText="Edit">
    //             <GenericForm
    //                 formId={submittedData?.forms[parseInt(rowId)]._id}
    //             />
    //         </Dialog>
    //     )
    //     // mutation.mutate({
    //     //     url: 'formSubmission/edit/',
    //     //     method: 'PUT',
    //     //     params: submittedData?.forms[parseInt(rowId)]._id,
    //     // })
    // }

    const columns = useMemo(
        () =>
            isSuccess && submittedData?.forms?.length
                ? Object.keys(submittedData?.forms[0].formFields as object).map(
                      (key) =>
                          columnHelper.accessor(key as keyof FormFields, {
                              header: key,
                          })
                  )
                : [],
        [isSuccess, submittedData]
    )

    const getDataFromCell = (cell: unknown) => {
        if (!cell) return
        if (Array.isArray(cell)) {
            return cell[0].label
        }
        return cell
    }
    const data = useMemo(
        () =>
            isSuccess && submittedData?.forms?.length
                ? submittedData.forms.flatMap((form) => form.formFields)
                : [],
        [isSuccess, submittedData]
    )

    const table = useReactTable({
        data,
        columns,
        getCoreRowModel: getCoreRowModel(),
    })

    return (
        <Table.Root size="sm" interactive>
            <Table.Header>
                {table.getHeaderGroups().map((headerGroup) => (
                    <Table.Row key={headerGroup.id}>
                        {withIndex && (
                            <Table.ColumnHeader>index</Table.ColumnHeader>
                        )}
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
                {table.getRowModel().rows.map((row, index) => (
                    <Table.Row key={row.id}>
                        {withIndex && <Table.Cell>{index}</Table.Cell>}

                        {row.getVisibleCells().map((cell) => {
                            return (
                                <Table.Cell key={cell.id}>
                                    {getDataFromCell(cell.getValue())}
                                    {/* {flexRender(
                                            cell.column.columnDef.cell,
                                            cell.getContext()
                                        )} */}
                                </Table.Cell>
                            )
                        })}
                        {isEditable && (
                            <Table.Cell>
                                <Button
                                    onClick={() => handleDelete(row.id)}
                                    variant="outline"
                                    colorScheme="red"
                                >
                                    Delete
                                </Button>
                            </Table.Cell>
                        )}
                        {isCanBeDeleted && (
                            <Table.Cell>
                                <Dialog title="Edit Form" buttonText="Edit">
                                    <GenericForm
                                        formMode="update"
                                        defaultValues={
                                            submittedData?.forms[row.index]
                                        }
                                        formId={id}
                                    />
                                </Dialog>
                            </Table.Cell>
                        )}
                    </Table.Row>
                ))}
            </Table.Body>
        </Table.Root>
    )
}
