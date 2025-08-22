import ExcelJS from 'exceljs'
import { IForm, FormFields } from '@/types/fieldsType'
import { AllFormSubmission } from '@/types/formType'

interface ExportToExcelProps {
    data: Record<string, unknown>[]
    formFields: IForm
    formsData?: AllFormSubmission
    filename?: string
}

export const exportToExcel = async ({
    data,
    formFields,
    formsData,
    filename = `${formFields.formName}_export`,
}: ExportToExcelProps) => {
    if (!data.length || !formFields.sections.length) {
        console.warn('No data or form fields available for export')
        return
    }

    // Get all fields from all sections (not just overview fields)
    const allFields = formFields.sections.flatMap((section) => section.fields)

    // Create workbook and worksheet
    const workbook = new ExcelJS.Workbook()
    const worksheet = workbook.addWorksheet('Data')

    // Add headers
    const headers = allFields.map((field) => field.label)
    worksheet.addRow(headers)

    // Style the header row
    const headerRow = worksheet.getRow(1)
    headerRow.font = { bold: true }
    headerRow.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFE0E0E0' },
    }

    // Add data rows
    data.forEach((row) => {
        const exportRow = allFields.map((field) =>
            formatCellValue(row[field.name], field, formsData)
        )
        worksheet.addRow(exportRow)
    })

    // Auto-fit columns
    worksheet.columns.forEach((column, index) => {
        const header = headers[index]
        if (column && header) {
            const maxLength = Math.max(
                header.length,
                ...data.map((row) => {
                    const field = allFields[index]
                    const value = formatCellValue(
                        row[field.name],
                        field,
                        formsData
                    )
                    return String(value || '').length
                })
            )
            column.width = Math.min(Math.max(maxLength + 2, 10), 50)
        }
    })

    // Generate filename with timestamp
    const timestamp = new Date().toISOString().split('T')[0]
    const finalFilename = `${filename}_${timestamp}.xlsx`

    // Download file
    const buffer = await workbook.xlsx.writeBuffer()
    const blob = new Blob([buffer], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    })

    const url = window.URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = finalFilename
    anchor.click()

    window.URL.revokeObjectURL(url)
}

const formatCellValue = (
    value: unknown,
    field: FormFields,
    formsData?: AllFormSubmission
): string => {
    if (value == null || value === '') return ''

    try {
        switch (field.type) {
            case 'date':
            case 'datetime':
                return value
                    ? new Date(value as string).toLocaleDateString('he-IL')
                    : ''
            case 'time':
                return value
                    ? new Date(value as string).toLocaleTimeString('he-IL')
                    : ''
            case 'multipleSelect': {
                if (!Array.isArray(value)) return String(value)

                const selectedItems =
                    field.options?.filter((opt) =>
                        (value as string[]).includes(opt.value)
                    ) || []

                if (
                    field.foreignFormName &&
                    field.foreignField &&
                    formsData?.forms &&
                    selectedItems.length > 0
                ) {
                    try {
                        const foreignFormData = formsData.forms
                            .filter(
                                (form) =>
                                    form &&
                                    form.formName === field.foreignFormName
                            )
                            .flatMap((form) => form.formData || [])
                            .filter((record) => record != null)

                        const resolvedNames = selectedItems.map((item) => {
                            const foreignRecord = foreignFormData.find(
                                (record) => {
                                    const recordAsAny =
                                        record as unknown as Record<
                                            string,
                                            unknown
                                        >
                                    const recordId =
                                        recordAsAny._id ||
                                        recordAsAny.id ||
                                        (field.foreignField
                                            ? recordAsAny[field.foreignField]
                                            : undefined)
                                    return recordId === item.value
                                }
                            )

                            if (foreignRecord && field.foreignField) {
                                const recordAsAny =
                                    foreignRecord as unknown as Record<
                                        string,
                                        unknown
                                    >
                                const fieldValue =
                                    recordAsAny[field.foreignField]
                                if (fieldValue) {
                                    return String(fieldValue)
                                }
                            }
                            return item.label
                        })

                        return resolvedNames.join(', ')
                    } catch (err) {
                        console.warn('Error resolving foreign fields:', err)
                    }
                }

                return selectedItems.map((item) => item.label).join(', ')
            }
            case 'select': {
                // Find the label for the selected option
                const option = field.options?.find((opt) => opt.value === value)
                if (option) {
                    // If this is a foreign field, try to get the actual name from the foreign form data
                    if (
                        field.foreignFormName &&
                        field.foreignField &&
                        formsData?.forms
                    ) {
                        try {
                            const foreignFormData = formsData.forms
                                .filter(
                                    (form) =>
                                        form &&
                                        form.formName === field.foreignFormName
                                )
                                .flatMap((form) => form.formData || [])
                                .filter((record) => record != null)

                            const foreignRecord = foreignFormData.find(
                                (record) => {
                                    const recordAsAny =
                                        record as unknown as Record<
                                            string,
                                            unknown
                                        >
                                    const recordId =
                                        recordAsAny._id ||
                                        recordAsAny.id ||
                                        (field.foreignField
                                            ? recordAsAny[field.foreignField]
                                            : undefined)
                                    return recordId === value
                                }
                            )

                            if (foreignRecord && field.foreignField) {
                                const recordAsAny =
                                    foreignRecord as unknown as Record<
                                        string,
                                        unknown
                                    >
                                const fieldValue =
                                    recordAsAny[field.foreignField]
                                if (fieldValue) {
                                    return String(fieldValue)
                                }
                            }
                        } catch (err) {
                            console.warn('Error resolving foreign field:', err)
                        }
                    }
                    return option.label
                }
                return String(value)
            }
            case 'radio': {
                // Find the label for the selected option
                const radioItem = field.items?.find(
                    (item) => item.value === value
                )
                return radioItem ? radioItem.label : String(value)
            }
            case 'switch':
                return value ? 'כן' : 'לא'
            case 'file': {
                if (Array.isArray(value)) {
                    return value
                        .map(
                            (file: { name?: string; filename?: string }) =>
                                file.name || file.filename || 'קובץ'
                        )
                        .join(', ')
                }
                const fileValue = value as {
                    name?: string
                    filename?: string
                } | null
                return (
                    fileValue?.name ||
                    fileValue?.filename ||
                    String(value) ||
                    ''
                )
            }
            case 'attendance': {
                if (typeof value === 'object' && value !== null) {
                    return Object.entries(value as Record<string, unknown>)
                        .map(([key, val]) => `${key}: ${val}`)
                        .join(', ')
                }
                return String(value)
            }
            default:
                return String(value)
        }
    } catch (error) {
        console.error('Error formatting cell value:', error, {
            value,
            field: field.name,
            type: field.type,
        })
        return String(value)
    }
}
