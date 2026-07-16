import { useMemo } from 'react'
import { createColumnHelper } from '@tanstack/react-table'
import { IForm } from '@/types/fieldsType'
import { fuzzyFilter } from '../utils/fuzzyFilter'
import { TableHeader } from '../components/TableHeader'
import { TableCell } from '../components/TableCell'
import { format, isValid, parseISO } from 'date-fns'

const columnHelper = createColumnHelper<Record<string, unknown>>()

interface UseTableColumnsProps {
    formFields: IForm | undefined
    isSuccess: boolean
    showCreatedAt?: boolean
}

export const useTableColumns = ({
    formFields,
    isSuccess,
    showCreatedAt,
}: UseTableColumnsProps) => {
    const columns = useMemo(() => {
        // If formFields or overviewFields are not available yet, return empty
        if (!formFields?.sections || !formFields?.overviewFields) return []

        // Get all fields from all sections
        const allFields = formFields.sections.flatMap((section) =>
            section.fields ? section.fields : []
        )

        // Build base columns from overviewFields
        const baseColumns: any[] = []

        if (isSuccess && formFields.overviewFields.length) {
            for (const fieldName of formFields.overviewFields) {
                const field = allFields.find((f: any) => f.name === fieldName)
                if (!field) continue

                // For date fields, format the value for searching
                const accessor =
                    field.type === 'date'
                        ? (row: any) => {
                              const value = row[field.name as keyof typeof row]
                              if (!value) return ''
                              try {
                                  const dateValue =
                                      typeof value === 'string'
                                          ? parseISO(value)
                                          : new Date(value)
                                  if (isValid(dateValue)) {
                                      return format(dateValue, 'dd/MM/yyyy')
                                  }
                              } catch {
                                  // ignore
                              }
                              return String(value)
                          }
                        : (row: any) => row[field.name as keyof typeof row]

                baseColumns.push(
                    columnHelper.accessor(accessor, {
                        header: ({ column }) => (
                            <TableHeader column={column} field={field} />
                        ),
                        id: field._id,
                        enableSorting: true,
                        enableColumnFilter: true,
                        meta: {
                            fieldName: field.name,
                            filterVariant:
                                field.type === 'number'
                                    ? 'range'
                                    : field.type === 'select' ||
                                        field.type === 'multipleSelect' ||
                                        field.type === 'selectAutocomplete' ||
                                        field.type === 'radio'
                                      ? 'select'
                                      : 'text',
                            options:
                                field.type === 'select' ||
                                field.type === 'multipleSelect' ||
                                field.type === 'selectAutocomplete'
                                    ? field.options
                                    : undefined,
                            items:
                                field.type === 'radio'
                                    ? field.items
                                    : undefined,
                        },
                        cell: (info: any) => (
                            <TableCell info={info} field={field} />
                        ),
                        filterFn: fuzzyFilter as any,
                    })
                )
            }
        }

        // Inject createdAt column if requested in overviewFields OR via prop
        if (showCreatedAt || formFields.overviewFields.includes('createdAt')) {
            baseColumns.push(
                columnHelper.accessor((row) => row['createdAt'], {
                    header: ({ column }) => (
                        <TableHeader
                            column={column as any}
                            field={{ label: 'Created At' } as any}
                        />
                    ),
                    id: 'createdAt',
                    enableSorting: true,
                    enableColumnFilter: false,
                    meta: {
                        fieldName: 'createdAt',
                    },
                    cell: (info: any) => {
                        const val = info.getValue() as string | undefined
                        if (!val) return ''
                        try {
                            return format(new Date(val), 'dd/MM/yyyy HH:mm')
                        } catch {
                            return String(val)
                        }
                    },
                    filterFn: fuzzyFilter as any,
                })
            )
        }

        return baseColumns
    }, [formFields, isSuccess, showCreatedAt])

    // Ensure columns are always typed correctly
    const columnsToAdd = (): typeof columns => {
        // Add any additional columns here if needed
        return columns
    }

    return {
        columns: columnsToAdd(),
    }
}
