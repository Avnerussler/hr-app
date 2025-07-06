import { useMemo } from 'react'
import { createColumnHelper } from '@tanstack/react-table'
import { FormFields, IForm } from '@/types/fieldsType'
import { fuzzyFilter } from '../utils/fuzzyFilter'
import { TableHeader } from '../components/TableHeader'
import { TableCell } from '../components/TableCell'

const columnHelper = createColumnHelper<FormFields>()

interface UseTableColumnsProps {
    formFields: IForm | undefined
    isSuccess: boolean
}

export const useTableColumns = ({
    formFields,
    isSuccess,
}: UseTableColumnsProps) => {
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
                              <TableHeader column={column} field={field} />
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
                          cell: (info) => (
                              <TableCell info={info} field={field} />
                          ),
                          filterFn: fuzzyFilter,
                      }
                  )
              )
            : []
    }, [formFields, isSuccess])

    // Ensure columns are always typed correctly
    const columnsToAdd = (): typeof columns => {
        // Add any additional columns here if needed
        return columns
    }

    return {
        columns: columnsToAdd(),
    }
}
