import ExcelJS from 'exceljs'
import { QueryClient } from '@tanstack/react-query'
import axios from 'axios'
import { BASE_URL } from '@/config'

interface ExportReportsToExcelProps {
    selectedReports: string[]
    startDate: string
    endDate: string
    queryClient: QueryClient
}

interface ReportData {
    headers: string[]
    rows: any[][]
}

/**
 * Fetch report data using TanStack Query
 */
const fetchReportData = async (
    reportType: string,
    startDate: string,
    endDate: string,
    queryClient: QueryClient
): Promise<ReportData> => {
    try {
        // Build query key and queryFn based on report type
        const url =
            reportType === 'daily_summary'
                ? 'statistics/daily-summary'
                : `statistics/${reportType.replace(/_/g, '-')}`

        // Build query params based on report type
        let queryParams: Record<string, string> = {}
        if (reportType === 'daily_summary') {
            queryParams = {}
        } else if (reportType === 'employees_on_reserve') {
            // This endpoint expects 'date' not 'startDate/endDate'
            queryParams = { date: startDate }
        } else {
            queryParams = { startDate, endDate }
        }

        const queryKey = [url, undefined, queryParams]

        // Define queryFn that matches the default pattern
        const queryFn = async () => {
            const { data } = await axios({
                method: 'get',
                baseURL: BASE_URL,
                url: url.toLowerCase(),
                params: queryParams,
            })
            return data
        }

        // Fetch data using query client with explicit queryFn
        const response = await queryClient.fetchQuery({
            queryKey,
            queryFn,
            staleTime: 1000 * 60 * 5,
        })

        // Extract data from response
        return (response as any).data
    } catch (error) {
        console.error(`Error fetching report ${reportType}:`, error)
        // Return error data
        return {
            headers: ['שגיאה'],
            rows: [[`לא ניתן להביא נתונים עבור ${getReportName(reportType)}`]],
        }
    }
}

const getReportName = (reportType: string): string => {
    const names: Record<string, string> = {
        daily_summary: 'סכימת ימי מילואים יומית',
        date_range_summary: 'סכימת ימי מילואים לפי טווח',
        project_analytics: 'סכימה לפי פרויקטים',
        external_by_unit: 'ימי מילואים חיצוניים לפי יחידות',
        employees_on_reserve: 'עובדים על צו',
    }
    return names[reportType] || reportType
}

export const exportReportsToExcel = async ({
    selectedReports,
    startDate,
    endDate,
    queryClient,
}: ExportReportsToExcelProps) => {
    if (!selectedReports.length) {
        console.warn('No reports selected for export')
        throw new Error('לא נבחרו דוחות לייצוא')
    }

    // Fetch all report data first
    const reportsData: { reportType: string; data: ReportData }[] = []
    let hasErrors = false

    for (const reportType of selectedReports) {
        try {
            console.log(`Fetching report: ${reportType}`)
            const reportData = await fetchReportData(
                reportType,
                startDate,
                endDate,
                queryClient
            )

            // Check if data was successfully fetched
            if (reportData.headers[0] === 'שגיאה') {
                hasErrors = true
                console.error(`Failed to fetch ${reportType}`)
            }

            reportsData.push({ reportType, data: reportData })
        } catch (error) {
            console.error(`Error fetching report ${reportType}:`, error)
            hasErrors = true
            reportsData.push({
                reportType,
                data: {
                    headers: ['שגיאה'],
                    rows: [[`שגיאה בטעינת ${getReportName(reportType)}`]],
                },
            })
        }
    }

    // If all reports failed, throw error
    if (hasErrors && reportsData.every((r) => r.data.headers[0] === 'שגיאה')) {
        throw new Error('לא ניתן לטעון את הדוחות מהשרת')
    }

    // Create workbook
    const workbook = new ExcelJS.Workbook()

    // Add metadata
    workbook.creator = 'HR Management System'
    workbook.created = new Date()
    workbook.modified = new Date()

    // Add a worksheet for each fetched report
    for (const { reportType, data: reportData } of reportsData) {
        try {
            const reportName = getReportName(reportType)

            // Create worksheet with truncated name (Excel has 31 char limit)
            const worksheet = workbook.addWorksheet(reportName.substring(0, 31))

            // Set RTL for Hebrew text
            worksheet.views = [{ rightToLeft: true }]

            // Add headers
            worksheet.addRow(reportData.headers)

            // Style the header row
            const headerRow = worksheet.getRow(1)
            headerRow.font = {
                bold: true,
                size: 12,
                color: { argb: 'FFFFFFFF' },
            }
            headerRow.fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: 'FF4472C4' },
            }
            headerRow.alignment = { horizontal: 'center', vertical: 'middle' }
            headerRow.height = 25

            // Add data rows - convert objects to display strings
            reportData.rows.forEach((row) => {
                // Convert each cell value to a displayable string
                const processedRow = row.map((cell) => {
                    if (cell === null || cell === undefined) {
                        return ''
                    }
                    if (typeof cell === 'object') {
                        // Handle object fields (like assignedProjects with display property)
                        if ('display' in cell && cell.display) {
                            return String(cell.display)
                        }
                        // Fallback to JSON representation for other objects
                        return JSON.stringify(cell)
                    }
                    return cell
                })

                const excelRow = worksheet.addRow(processedRow)
                excelRow.alignment = { horizontal: 'right', vertical: 'middle' }
            })

            // Auto-fit columns
            worksheet.columns.forEach((column, index) => {
                const header = reportData.headers[index]
                if (column && header) {
                    const maxLength = Math.max(
                        header.length,
                        ...reportData.rows.map((row) => {
                            const value = row[index]
                            // Handle objects with display property
                            if (
                                value &&
                                typeof value === 'object' &&
                                'display' in value
                            ) {
                                return String(value.display || '').length
                            }
                            return String(value || '').length
                        })
                    )
                    column.width = Math.min(Math.max(maxLength + 4, 12), 60)
                }
            })

            // Add borders to all cells
            worksheet.eachRow((row) => {
                row.eachCell((cell) => {
                    cell.border = {
                        top: { style: 'thin', color: { argb: 'FFD0D0D0' } },
                        left: { style: 'thin', color: { argb: 'FFD0D0D0' } },
                        bottom: { style: 'thin', color: { argb: 'FFD0D0D0' } },
                        right: { style: 'thin', color: { argb: 'FFD0D0D0' } },
                    }
                })
            })

            // Freeze header row
            worksheet.views = [
                {
                    rightToLeft: true,
                    state: 'frozen',
                    ySplit: 1,
                },
            ]
        } catch (error) {
            console.error(`Error adding report ${reportType}:`, error)
        }
    }

    // Generate filename with timestamp and date range
    const formatDateForFilename = (dateStr: string) => {
        return dateStr.replace(/-/g, '')
    }

    const filename = `דוחות_ימי_מילואים_${formatDateForFilename(startDate)}_${formatDateForFilename(endDate)}_${new Date().getTime()}.xlsx`

    // Download file
    const buffer = await workbook.xlsx.writeBuffer()
    const blob = new Blob([buffer], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    })

    const url = window.URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = filename
    anchor.click()

    window.URL.revokeObjectURL(url)
}
