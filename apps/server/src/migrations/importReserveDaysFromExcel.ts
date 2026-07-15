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
export const computeOrderType = (sortedDates: string[]): string => {
    if (sortedDates.length < 4) return '8daily'
    const dateObjs = sortedDates.map((d) => new Date(d))
    for (let i = 1; i < dateObjs.length; i++) {
        const daysDiff =
            Math.abs(dateObjs[i].getTime() - dateObjs[i - 1].getTime()) /
            (1000 * 60 * 60 * 24)
        if (daysDiff > 1) return '8daily'
    }
    return '8open'
}

/**
 * Find existing reserve day record for this personnel that already contains any of the given dates.
 * Returns the first matching record, or null if none found.
 */
export const findOverlappingReserveRecord = async (
    personnelId: string,
    dates: string[]
): Promise<{ id: string; formData: any } | null> => {
    try {
        const existingReserves = await FormSubmissions.find({
            formName: 'reserve_days_management',
            'formData.employeeName': personnelId,
            isDeleted: false,
        }).lean()

        for (const reserve of existingReserves) {
            const attendance = reserve.formData.attendance || {}
            const hasOverlap = dates.some((date) => attendance[date] === true)
            if (hasOverlap) {
                return {
                    id: (reserve._id as any).toString(),
                    formData: reserve.formData,
                }
            }
        }

        return null
    } catch (error) {
        logger.error('Error finding overlapping reserve record:', error)
        return null
    }
}

/**
 * Process a single date range for a person.
 * If an existing record already covers any of these dates, merge the new dates into it.
 * Otherwise create a new record.
 * Returns { action: 'created' | 'updated' | 'skipped', formData }
 */
export const createOrUpdateReserveDayRecord = async (
    personnelId: string,
    personnelData: any,
    fundingName: string | null,
    dateRangeData: {
        dates: string[]
        fundingSource: 'internal' | 'external'
    }
): Promise<{ action: 'created' | 'updated' | 'skipped'; formData: any | null }> => {
    const { dates, fundingSource } = dateRangeData

    if (dates.length === 0) return { action: 'skipped', formData: null }

    const overlapping = await findOverlappingReserveRecord(personnelId, dates)

    if (overlapping) {
        // Merge new dates into the existing record
        const existingAttendance: Record<string, boolean> =
            overlapping.formData.attendance || {}
        const newDates = dates.filter((d) => !existingAttendance[d])

        if (newDates.length === 0) {
            logger.info(
                `ℹ️  All dates already present in existing record for ${personnelData.firstName} ${personnelData.lastName}, skipping`
            )
            return { action: 'skipped', formData: null }
        }

        // Merge attendance
        const mergedAttendance = { ...existingAttendance }
        newDates.forEach((d) => {
            mergedAttendance[d] = true
        })

        const sortedDates = Object.keys(mergedAttendance).sort()
        const orderType = computeOrderType(sortedDates)

        const updatedFormData = {
            ...overlapping.formData,
            startDate: new Date(sortedDates[0]),
            endDate: new Date(sortedDates[sortedDates.length - 1]),
            isActive: true,
            orderType,
            attendance: mergedAttendance,
        }

        await FormSubmissions.updateOne(
            { _id: overlapping.id },
            { $set: { formData: updatedFormData } }
        )

        logger.info(
            `🔄 Merged ${newDates.length} new date(s) into existing record for ${personnelData.firstName} ${personnelData.lastName} (added: ${newDates.join(', ')})`
        )

        return { action: 'updated', formData: updatedFormData }
    }

    // No overlap — create a new record
    const sortedDates = dates.sort()

    const attendance: Record<string, boolean> = {}
    sortedDates.forEach((date) => {
        attendance[date] = true
    })

    const orderType = computeOrderType(sortedDates)

    const formData = {
        employeeName: personnelId,
        firstName: personnelData.firstName,
        lastName: personnelData.lastName,
        personalNumber: personnelData.personalNumber,
        startDate: new Date(sortedDates[0]),
        endDate: new Date(sortedDates[sortedDates.length - 1]),
        fundingSource,
        fundingName: fundingName || undefined,
        orderType,
        requestStatus: 'approved',
        baseAccessApproval: 'approved',
        vehicleEntry: false,
        isActive: true,
        attendance,
    }

    return { action: 'created', formData }
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

    // Create or update reserve day records for each group
    const records = []

    for (const group of dateGroups) {
        const { action, formData } = await createOrUpdateReserveDayRecord(
            personnelId,
            personnelData,
            fundingName,
            group
        )
        if (formData && (action === 'created' || action === 'updated')) {
            records.push({ ...formData, _action: action })
        }
    }

    return {
        records,
        allConflictingDates: [],
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
                const { records: reserveDayRecords } =
                    await processReserveDaysForRow(
                        personnelId,
                        personnelData,
                        fundingUnit,
                        rowData,
                        dateColumns
                    )

                // Create new records; updated ones were already saved in createOrUpdateReserveDayRecord
                let createdCount = 0
                let updatedCount = 0
                for (const recordData of reserveDayRecords) {
                    if (!recordData) continue

                    if (recordData._action === 'created') {
                        const { _action, ...formData } = recordData
                        await FormSubmissions.create({
                            formId: reserveDaysForm._id.toString(),
                            formName: 'reserve_days_management',
                            formData,
                            isDeleted: false,
                        })
                        imported++
                        createdCount++
                    } else if (recordData._action === 'updated') {
                        updatedCount++
                    }
                }

                if (createdCount > 0 || updatedCount > 0) {
                    const parts = []
                    if (createdCount > 0) parts.push(`${createdCount} created`)
                    if (updatedCount > 0) parts.push(`${updatedCount} updated`)
                    logger.info(
                        `${parts.join(', ')} reserve day record(s) for ${employeeName}`
                    )
                    importedPersonnel.push({
                        name: employeeName,
                        recordsCreated: createdCount + updatedCount,
                        fundingUnit,
                        records: reserveDayRecords
                            .filter((record: any) => record !== null)
                            .map((record: any) => ({
                                startDate: record.startDate,
                                endDate: record.endDate,
                                fundingSource: record.fundingSource,
                            })),
                    })
                } else if (reserveDayRecords.length === 0) {
                    logger.warn(
                        `⏭️  No new dates to import for ${employeeName}`
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
