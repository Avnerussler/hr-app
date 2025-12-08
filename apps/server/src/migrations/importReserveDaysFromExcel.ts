import ExcelJS from 'exceljs'
import path from 'path'
import { FormSubmissions, FormFields } from '../models'
import logger from '../config/logger'
import { format, parse } from 'date-fns'

// Configuration: Set the year for dates in the Excel file
// If your Excel has dates like "5.1", "6.1", this will be treated as January 5th, 6th of this year
const RESERVE_DAYS_YEAR = 2025

interface ReserveDayRow {
    [key: string]: any
}

/**
 * Parse date from Excel cell
 * Excel stores dates as serial numbers, but ExcelJS might return them as Date objects or numbers
 * @param value - The value to parse as a date
 * @param defaultYear - The year to use if only day.month is provided (defaults to 2025)
 */
const parseExcelDate = (
    value: any,
    defaultYear: number = 2025
): string | null => {
    if (!value) return null

    try {
        // If it's already a Date object
        if (value instanceof Date) {
            return format(value, 'yyyy-MM-dd')
        }

        // If it's a string, try to parse it
        if (typeof value === 'string') {
            const trimmed = value.trim()

            // Check if it's in d.M format (e.g., "5.1" for January 5th)
            const dayMonthMatch = trimmed.match(/^(\d{1,2})\.(\d{1,2})$/)
            if (dayMonthMatch) {
                const day = parseInt(dayMonthMatch[1], 10)
                const month = parseInt(dayMonthMatch[2], 10)

                // Validate day and month
                if (day >= 1 && day <= 31 && month >= 1 && month <= 12) {
                    // Create date with default year
                    const dateStr = `${day}.${month}.${defaultYear}`
                    const parsed = parse(dateStr, 'd.M.yyyy', new Date())
                    if (!isNaN(parsed.getTime())) {
                        return format(parsed, 'yyyy-MM-dd')
                    }
                }
            }

            // Try common date formats
            const formats = [
                'dd/MM/yyyy',
                'dd-MM-yyyy',
                'yyyy-MM-dd',
                'd.M.yyyy',
            ]
            for (const dateFormat of formats) {
                try {
                    const parsed = parse(trimmed, dateFormat, new Date())
                    if (!isNaN(parsed.getTime())) {
                        return format(parsed, 'yyyy-MM-dd')
                    }
                } catch {
                    continue
                }
            }
        }

        // If it's a number (Excel serial date)
        if (typeof value === 'number') {
            // Excel dates start from 1900-01-01 (serial 1)
            // But Excel incorrectly treats 1900 as a leap year, so we need to adjust
            const excelEpoch = new Date(1899, 11, 30) // Dec 30, 1899
            const date = new Date(
                excelEpoch.getTime() + value * 24 * 60 * 60 * 1000
            )
            return format(date, 'yyyy-MM-dd')
        }
    } catch (error) {
        logger.warn(`Failed to parse date: ${value}`, error)
    }

    return null
}

/**
 * Parse cell value - handles 'X' for external funding and '1' for internal funding
 */
const parseFundingSource = (value: any): 'internal' | 'external' => {
    if (!value) return 'internal'

    const stringValue = value.toString().trim().toUpperCase()

    // X = מימון חיצוני (external funding)
    if (stringValue === 'X') {
        return 'external'
    }

    // 1 = מימון פנימי (internal funding)
    return 'internal'
}

/**
 * Get personnel by full name (first name + last name)
 */
const getPersonnelByName = async (
    fullName: string
): Promise<{ id: string; data: any } | null> => {
    if (!fullName) return null

    const nameParts = fullName.trim().split(' ')
    const firstName = nameParts[0] || ''
    const lastName = nameParts.slice(1).join(' ') || ''

    try {
        const personnel = await FormSubmissions.findOne({
            formName: 'personnel',
            'formData.firstName': firstName,
            'formData.lastName': lastName,
            isDeleted: false,
        }).lean()

        if (personnel) {
            logger.info(
                `✅ Found personnel: "${fullName}" (ID: ${personnel._id})`
            )
            return {
                id: (personnel._id as any).toString(),
                data: personnel.formData,
            }
        }

        logger.warn(
            `❌ Personnel not found in database: "${fullName}" (firstName: "${firstName}", lastName: "${lastName}")`
        )
        logger.warn(
            `   Please ensure this person exists in the personnel.xlsx file and has been imported.`
        )
        return null
    } catch (error) {
        logger.error(`Error finding personnel ${fullName}:`, error)
        return null
    }
}

/**
 * Parse date columns from Excel headers
 * Returns array of { colIndex, date } for date columns
 */
const parseDateColumns = (
    headers: string[]
): Array<{ colIndex: number; date: string }> => {
    const dateColumns: Array<{ colIndex: number; date: string }> = []

    headers.forEach((header, index) => {
        if (!header) return

        // Try to parse the header as a date, using the configured year
        const parsedDate = parseExcelDate(header, RESERVE_DAYS_YEAR)
        if (parsedDate) {
            dateColumns.push({
                colIndex: index,
                date: parsedDate,
            })
        }
    })

    return dateColumns
}

/**
 * Check if personnel already has a reserve day for any of the given dates
 */
const checkExistingReserveDays = async (
    personnelId: string,
    dates: string[]
): Promise<{ hasConflict: boolean; conflictingDates: string[] }> => {
    try {
        // Find all reserve days for this personnel
        const existingReserves = await FormSubmissions.find({
            formName: 'reserve_days_management',
            'formData.employeeName': personnelId,
            isDeleted: false,
        }).lean()

        const conflictingDates: Set<string> = new Set()

        // Check each date against existing reserves
        for (const date of dates) {
            for (const reserve of existingReserves) {
                const attendance = reserve.formData.attendance || {}
                // Check if this date exists in the attendance object
                if (attendance[date] === true) {
                    conflictingDates.add(date)
                    break
                }
            }
        }

        return {
            hasConflict: conflictingDates.size > 0,
            conflictingDates: Array.from(conflictingDates),
        }
    } catch (error) {
        logger.error('Error checking existing reserve days:', error)
        return { hasConflict: false, conflictingDates: [] }
    }
}

/**
 * Process a single date range for a person
 * Creates one reserve day record with attendance data
 */
const createReserveDayRecord = async (
    personnelId: string,
    personnelData: any,
    fundingName: string | null,
    dateRangeData: {
        dates: string[]
        fundingSource: 'internal' | 'external'
    }
) => {
    const { dates, fundingSource } = dateRangeData

    if (dates.length === 0) return null

    // Check for existing reserve days on these dates
    const { hasConflict, conflictingDates } = await checkExistingReserveDays(
        personnelId,
        dates
    )

    if (hasConflict) {
        logger.warn(
            `⚠️  Personnel ${personnelData.firstName} ${
                personnelData.lastName
            } already has reserve days on: ${conflictingDates.join(', ')}`
        )
        logger.warn(`   Skipping this date range to avoid duplicates.`)
        return null
    }

    // Sort dates to get start and end
    const sortedDates = dates.sort()
    const startDate = sortedDates[0]
    const endDate = sortedDates[sortedDates.length - 1]

    // Create attendance object for all dates in range
    const attendance: Record<string, boolean> = {}
    sortedDates.forEach((date) => {
        attendance[date] = true
    })

    // Determine order type based on date range
    // If less than 4 consecutive days, it's "daily", otherwise "open"
    let orderType = '8daily'
    if (dates.length >= 4) {
        // Check if dates are consecutive
        const dateObjs = sortedDates.map((d) => new Date(d))
        let isConsecutive = true
        for (let i = 1; i < dateObjs.length; i++) {
            const diff = Math.abs(
                dateObjs[i].getTime() - dateObjs[i - 1].getTime()
            )
            const daysDiff = diff / (1000 * 60 * 60 * 24)
            if (daysDiff > 1) {
                isConsecutive = false
                break
            }
        }
        orderType = isConsecutive ? '8open' : '8daily'
    }

    const formData = {
        employeeName: personnelId,
        firstName: personnelData.firstName,
        lastName: personnelData.lastName,
        personalNumber: personnelData.personalNumber,
        startDate,
        endDate,
        fundingSource,
        fundingName: fundingName || undefined, // Store funding unit if it exists, regardless of current funding source
        orderType,
        requestStatus: 'approved', // Data from Excel is already approved
        baseAccessApproval: 'approved',
        vehicleEntry: false,
        isActive: 'true',
        attendance,
    }

    return formData
}

/**
 * Process reserve days for a single row
 * Groups consecutive dates by funding source
 */
const processReserveDaysForRow = async (
    personnelId: string,
    personnelData: any,
    fundingName: string | null,
    rowData: ReserveDayRow,
    dateColumns: Array<{ colIndex: number; date: string }>
): Promise<{
    records: any[]
    allConflictingDates: string[]
}> => {
    // Group dates by funding source and consecutive ranges
    const dateGroups: Array<{
        dates: string[]
        fundingSource: 'internal' | 'external'
    }> = []

    let currentGroup: {
        dates: string[]
        fundingSource: 'internal' | 'external'
    } | null = null

    for (const { colIndex, date } of dateColumns) {
        // colIndex is the actual 0-based column index in the Excel sheet
        const cellValue = rowData[colIndex]
        const fundingSource = parseFundingSource(cellValue)

        // Only process if there's a value (X or 1)
        if (
            cellValue &&
            (cellValue.toString().trim() === 'X' ||
                cellValue.toString().trim() === '1')
        ) {
            if (!currentGroup || currentGroup.fundingSource !== fundingSource) {
                // Start new group when funding source changes
                if (currentGroup) {
                    dateGroups.push(currentGroup)
                }
                currentGroup = {
                    dates: [date],
                    fundingSource,
                }
            } else {
                // Add to current group (same funding source, consecutive dates)
                currentGroup.dates.push(date)
            }
        } else {
            // Empty cell - end current group
            if (currentGroup) {
                dateGroups.push(currentGroup)
                currentGroup = null
            }
        }
    }

    // Add last group if exists
    if (currentGroup) {
        dateGroups.push(currentGroup)
    }

    // Create reserve day records for each group
    const records = []
    const allConflictingDates: Set<string> = new Set()

    for (const group of dateGroups) {
        // Check for conflicts before creating record
        const { hasConflict, conflictingDates } =
            await checkExistingReserveDays(personnelId, group.dates)

        if (hasConflict) {
            conflictingDates.forEach((date) => allConflictingDates.add(date))
        }

        const record = await createReserveDayRecord(
            personnelId,
            personnelData,
            fundingName,
            group
        )
        if (record) {
            records.push(record)
        }
    }

    return {
        records,
        allConflictingDates: Array.from(allConflictingDates).sort(),
    }
}

export const importReserveDaysFromExcel = async () => {
    try {
        logger.info('Starting Reserve Days Excel import...')
        logger.info('='.repeat(60))

        const excelPath = path.join(__dirname, 'ReserveDays.xlsx')
        const workbook = new ExcelJS.Workbook()
        await workbook.xlsx.readFile(excelPath)

        const worksheet = workbook.worksheets[0]
        if (!worksheet) {
            throw new Error('No worksheet found in Excel file')
        }

        // Get headers from first row (includes employee names and date columns)
        const headers: string[] = []
        const firstRow = worksheet.getRow(1)
        firstRow.eachCell((cell, colNumber) => {
            headers[colNumber - 1] =
                cell.value?.toString() || `column_${colNumber}`
        })

        logger.info(`Found ${headers.length} columns in Excel file`)

        // Column layout:
        // Column A (index 0): Row number or empty
        // Column B (index 1): Employee name (שם)
        // Column C (index 2): Funding unit name (גורם מממן)
        // Column D onwards (index 3+): Date columns (5.1, 6.1, etc.)
        const employeeNameColumn = 1 // Column B
        const fundingUnitColumn = 2 // Column C

        // Parse date columns (starting from column D, index 3)
        const headersToCheck = headers.slice(3)
        const dateColumns = parseDateColumns(headersToCheck).map((dc) => ({
            ...dc,
            colIndex: dc.colIndex + 3, // Adjust for offset (Column D is index 3)
        }))

        logger.info(
            `Found ${dateColumns.length} date columns: ${dateColumns
                .map((dc) => dc.date)
                .join(', ')}`
        )

        // Get the Reserve Days form
        const reserveDaysForm = await FormFields.findOne({
            formName: 'reserve_days_management',
        })

        if (!reserveDaysForm) {
            throw new Error(
                'Reserve Days Management form not found in database'
            )
        }

        logger.info(`Using Reserve Days form ID: ${reserveDaysForm._id}`)

        // Process each data row (starting from row 2)
        let imported = 0
        let skipped = 0
        let errors = 0
        const importedPersonnel: Array<{
            name: string
            recordsCreated: number
            fundingUnit: string | null
            records: Array<{
                startDate: string
                endDate: string
                fundingSource: 'internal' | 'external'
            }>
        }> = []
        const skippedPersonnel: Array<{
            name: string
            reason: string
        }> = []
        const conflictPersonnel: Array<{
            name: string
            conflictingDates: string[]
        }> = []

        for (let rowNumber = 2; rowNumber <= worksheet.rowCount; rowNumber++) {
            const row = worksheet.getRow(rowNumber)

            try {
                // Get employee name from column B (index 1, cell 2)
                const employeeName =
                    row.getCell(employeeNameColumn + 1).value?.toString() || ''
                if (!employeeName.trim()) {
                    continue // Skip empty rows
                }

                // Get funding unit name from column C (index 2, cell 3)
                const fundingUnit =
                    row.getCell(fundingUnitColumn + 1).value?.toString() || null

                logger.info(
                    `Processing row ${rowNumber}: ${employeeName} (Funding unit: ${
                        fundingUnit || 'none'
                    })`
                )

                // Find personnel by name
                const personnelResult = await getPersonnelByName(employeeName)
                if (!personnelResult) {
                    logger.warn(
                        `⏭️  Skipping row ${rowNumber}: Personnel "${employeeName}" not found in database`
                    )
                    skipped++
                    skippedPersonnel.push({
                        name: employeeName,
                        reason: 'Personnel not found in database',
                    })
                    continue
                }

                const { id: personnelId, data: personnelData } = personnelResult

                // Build row data object with column index as key
                // This allows us to access cells by their actual column index
                const rowData: ReserveDayRow = {}
                row.eachCell((cell, colNumber) => {
                    // colNumber is 1-based, store as 0-based index
                    rowData[colNumber - 1] = cell.value
                })

                // Process reserve days for this person
                const { records: reserveDayRecords, allConflictingDates } =
                    await processReserveDaysForRow(
                        personnelId,
                        personnelData,
                        fundingUnit,
                        rowData,
                        dateColumns
                    )

                // Create form submissions for each record
                let createdCount = 0
                for (const recordData of reserveDayRecords) {
                    if (recordData) {
                        // recordData can be null if there was a conflict
                        await FormSubmissions.create({
                            formId: reserveDaysForm._id.toString(),
                            formName: 'reserve_days_management',
                            formData: recordData,
                            isDeleted: false,
                        })
                        imported++
                        createdCount++
                    }
                }

                // Track conflicts for reporting
                if (allConflictingDates.length > 0) {
                    conflictPersonnel.push({
                        name: employeeName,
                        conflictingDates: allConflictingDates,
                    })
                }

                if (createdCount > 0) {
                    logger.info(
                        `Created ${createdCount} reserve day record(s) for ${employeeName}`
                    )
                    importedPersonnel.push({
                        name: employeeName,
                        recordsCreated: createdCount,
                        fundingUnit,
                        records: reserveDayRecords
                            .filter((record: any) => record !== null)
                            .map((record: any) => ({
                                startDate: record.startDate,
                                endDate: record.endDate,
                                fundingSource: record.fundingSource,
                            })),
                    })
                } else if (reserveDayRecords.length > 0) {
                    // All records were skipped due to conflicts
                    logger.warn(
                        `⏭️  All reserve day records for ${employeeName} were skipped due to existing reserves`
                    )
                }
            } catch (error) {
                errors++
                logger.error(`Error processing row ${rowNumber}:`, error)
            }
        }

        logger.info('='.repeat(60))
        logger.info('Reserve Days Excel import completed')
        logger.info('='.repeat(60))

        // Summary statistics
        logger.info('\n📊 IMPORT SUMMARY:')
        logger.info(`  • Total reserve day records created: ${imported}`)
        logger.info(
            `  • Personnel successfully imported: ${importedPersonnel.length}`
        )
        logger.info(`  • Personnel skipped: ${skipped}`)
        logger.info(`  • Errors: ${errors}`)
        logger.info(
            `  • Date range: ${
                dateColumns.length > 0
                    ? `${dateColumns[0].date} to ${
                          dateColumns[dateColumns.length - 1].date
                      }`
                    : 'N/A'
            }`
        )

        // Detailed imported personnel
        if (importedPersonnel.length > 0) {
            logger.info('\n✅ SUCCESSFULLY IMPORTED:')
            importedPersonnel.forEach((person, index) => {
                const fundingInfo = person.fundingUnit
                    ? ` (Funding unit: ${person.fundingUnit})`
                    : ''
                logger.info(
                    `  ${index + 1}. ${person.name}${fundingInfo} - ${
                        person.recordsCreated
                    } record(s)`
                )

                // Show detailed breakdown of each record
                person.records.forEach((record) => {
                    const fundingIcon =
                        record.fundingSource === 'external' ? '💰' : '🏢'
                    const fundingLabel =
                        record.fundingSource === 'external'
                            ? 'External'
                            : 'Internal'
                    logger.info(
                        `      ${fundingIcon} ${record.startDate} to ${record.endDate} (${fundingLabel})`
                    )
                })
            })
        }

        // Detailed skipped personnel
        if (skippedPersonnel.length > 0) {
            logger.info('\n⏭️  SKIPPED PERSONNEL:')
            skippedPersonnel.forEach((person, index) => {
                logger.info(`  ${index + 1}. ${person.name} - ${person.reason}`)
            })
            logger.info(
                '\n💡 TIP: Import these personnel first using the personnel.xlsx file'
            )
        }

        // Personnel with conflicting dates
        if (conflictPersonnel.length > 0) {
            logger.info(
                '\n⚠️  PERSONNEL WITH EXISTING RESERVE DAYS (CONFLICTS):'
            )
            conflictPersonnel.forEach((person, index) => {
                logger.info(`  ${index + 1}. ${person.name}`)
                logger.info(
                    `      Conflicting dates: ${person.conflictingDates.join(
                        ', '
                    )}`
                )
            })
            logger.info(
                '\n💡 NOTE: These dates already have reserve day records in the database.'
            )
        }

        logger.info('\n' + '='.repeat(60))

        return {
            imported,
            skipped,
            errors,
            importedPersonnel,
            skippedPersonnel,
            conflictPersonnel,
        }
    } catch (error) {
        logger.error('Error importing reserve days from Excel:', error)
        throw error
    }
}
