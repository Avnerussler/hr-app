import { FormSubmissions } from '../models'
import logger from '../config/logger'
import { eachDayOfInterval, parseISO, format } from 'date-fns'
import mongoose from 'mongoose'

// formData.startDate/endDate are stored as UTC-midnight Date objects in Mongo,
// so query bounds and any date read from formData must be normalized to Date
// before comparison instead of compared as 'dd/MM/yyyy' strings.
const toUtcMidnight = (dateStr: string): Date =>
    parseISO(`${dateStr}T00:00:00.000Z`)

const asDate = (val: unknown): Date =>
    val instanceof Date ? val : parseISO(val as string)

const NO_PROJECT_LABEL = 'ללא פרויקט'
const TOTALS_LABEL = 'סה"כ'

interface ReportData {
    headers: string[]
    rows: any[][]
}

interface ProjectAnalyticsReport extends ReportData {
    activeProjectCount: number
}

interface ProjectStats {
    studioDays: number
    externalDays: number
    openOrders: number
    uniquePersonnel: Set<string>
}
interface UnitStats {
    [unit: string]: number
}
/**
 * Statistics Service for Reserve Days Reports
 * Generates various reports for reserve_days_management
 */
class StatisticsService {
    /**
     * Report 1: Daily Reserve Days Summary
     * Shows orders by project for a specific date
     */
    async generateDailySummaryReport(date: string): Promise<ReportData> {
        try {
            logger.info('Generating daily summary report', { date })

            // Get all active reserve days for the specified date
            const targetDate = toUtcMidnight(date)
            const reserveDays = await FormSubmissions.find({
                isDeleted: false,
                'formData.startDate': { $lte: targetDate },
                'formData.endDate': { $gte: targetDate },
            }).lean()

            // Group by project
            const projectStats = new Map<
                string,
                {
                    studioOrders: Set<string>
                    externalOrders: Set<string>
                    openOrders: Set<string>
                }
            >()

            // Process each reserve day
            for (const reserve of reserveDays) {
                const fundingSource = reserve.formData.fundingSource // 'internal' | 'external'
                const orderType = reserve.formData.orderType // '8open' | 'routineOpen'
                const employeeId = reserve.formData.employeeName

                if (!employeeId) {
                    logger.warn('missing employee ID', {
                        reserveId: reserve._id.toString(),
                        startDate: reserve.formData.startDate,
                        endDate: reserve.formData.endDate,
                        fundingSource,
                    })

                    continue
                }

                // Get the personnel record to find their assigned project
                const personnel = await FormSubmissions.findOne({
                    _id: employeeId,

                    isDeleted: false,
                }).lean()

                if (!personnel) continue

                const assignedProjectId = personnel.formData.assignedProjects

                let projectName = NO_PROJECT_LABEL

                // Get the project details if assigned
                if (assignedProjectId) {
                    const project = await FormSubmissions.findOne({
                        _id: assignedProjectId,
                        formName: 'project_management',
                        isDeleted: false,
                    }).lean()

                    if (project) {
                        projectName =
                            project.formData.projectName || NO_PROJECT_LABEL
                    }
                }

                if (!projectStats.has(projectName)) {
                    projectStats.set(projectName, {
                        studioOrders: new Set(),
                        externalOrders: new Set(),
                        openOrders: new Set(),
                    })
                }

                const stats = projectStats.get(projectName)!

                // Count studio orders (internal funding)
                if (fundingSource === 'internal') {
                    stats.studioOrders.add(employeeId)
                }

                // Count external orders
                if (fundingSource === 'external') {
                    stats.externalOrders.add(employeeId)
                }

                // Count open orders (pending approval)
                if (orderType === '8open' || orderType === 'routineOpen') {
                    stats.openOrders.add(employeeId)
                }
            }

            // Build report rows
            const rows: any[][] = []
            let totalStudio = 0
            let totalExternal = 0
            let totalOpen = 0
            let grandTotal = 0

            for (const [projectName, stats] of projectStats.entries()) {
                const studioCount = stats.studioOrders.size
                const externalCount = stats.externalOrders.size
                const openCount = stats.openOrders.size
                const total = studioCount + externalCount

                rows.push([
                    projectName,
                    studioCount,
                    externalCount,
                    openCount,
                    total,
                ])

                totalStudio += studioCount
                totalExternal += externalCount
                totalOpen += openCount
                grandTotal += total
            }

            // Add totals row
            rows.push([
                TOTALS_LABEL,
                totalStudio,
                totalExternal,
                totalOpen,
                grandTotal,
            ])

            return {
                headers: [
                    // `תאריך דוח: ${format(parseISO(date), 'dd/MM/yyyy')}`,
                    'שם פרויקט',
                    'צווים סטודיו היום',
                    'צווים חיצוניים',
                    'צווים פתוחים',
                    'סה"כ צווים היום',
                ],
                rows,
            }
        } catch (error) {
            logger.error('Failed to generate daily summary report', error)
            throw error
        }
    }

    /**
     * Report 2: Reserve Days Summary by Date Range
     * Shows daily totals across a date range
     */
    async generateDateRangeSummaryReport(
        startDate: string,
        endDate: string
    ): Promise<ReportData> {
        try {
            logger.info('Generating date range summary report', {
                startDate,
                endDate,
            })

            // Get all dates in range
            const dates = eachDayOfInterval({
                start: parseISO(startDate),
                end: parseISO(endDate),
            })

            const headers = ['תאריך', ...dates.map((d) => format(d, 'd.M'))]
            const studioRow: (string | number)[] = ['צווים סטודיו']
            const externalRow: (string | number)[] = ['צווים חיצוניים']
            const totalRow: (string | number)[] = [
                'סה"כ צווים (סטודיו + חיצוניים)',
            ]

            for (const date of dates) {
                // Get active reserve days for this date
                const reserveDays = await FormSubmissions.find({
                    isDeleted: false,
                    'formData.startDate': { $lte: date },
                    'formData.endDate': { $gte: date },
                }).lean()

                const studioPersonnel = new Set<string>()
                const externalPersonnel = new Set<string>()

                for (const record of reserveDays) {
                    const fundingSource = record.formData.fundingSource
                    const employeeId = record.formData.employeeName

                    if (fundingSource === 'internal') {
                        studioPersonnel.add(employeeId)
                    } else if (fundingSource === 'external') {
                        externalPersonnel.add(employeeId)
                    }
                }

                const studioCount = studioPersonnel.size
                const externalCount = externalPersonnel.size

                studioRow.push(studioCount)
                externalRow.push(externalCount)
                totalRow.push(studioCount + externalCount)
            }

            return {
                headers,
                rows: [totalRow, studioRow, externalRow],
            }
        } catch (error) {
            logger.error('Failed to generate date range summary report', error)
            throw error
        }
    }

    /**
     * Report 3: Project Analytics by Period
     * Shows detailed project statistics for a date range
     */
    async generateProjectAnalyticsReport(
        startDate: string,
        endDate: string
    ): Promise<ProjectAnalyticsReport> {
        try {
            logger.info('Generating project analytics report', {
                startDate,
                endDate,
            })

            const rangeStartDate = toUtcMidnight(startDate)
            const rangeEndDate = toUtcMidnight(endDate)

            // Get all reserve days in the range
            const reserveDays = await FormSubmissions.find({
                isDeleted: false,
                $or: [
                    {
                        'formData.startDate': {
                            $gte: rangeStartDate,
                            $lte: rangeEndDate,
                        },
                    },
                    {
                        'formData.endDate': {
                            $gte: rangeStartDate,
                            $lte: rangeEndDate,
                        },
                    },
                    {
                        $and: [
                            { 'formData.startDate': { $lte: rangeStartDate } },
                            { 'formData.endDate': { $gte: rangeEndDate } },
                        ],
                    },
                ],
            }).lean()

            // Calculate number of days in range
            const dates = eachDayOfInterval({
                start: parseISO(startDate),
                end: parseISO(endDate),
            })
            const totalDays = dates.length

            // Group by project

            const projectStats = new Map<string, ProjectStats>()

            for (const record of reserveDays) {
                const fundingSource = record.formData.fundingSource
                const orderType = record.formData.orderType
                const employeeId = record.formData.employeeName

                if (!employeeId) {
                    logger.warn('missing employee ID in project analytics', {
                        reserveId: record._id.toString(),
                        startDate: record.formData.startDate,
                        endDate: record.formData.endDate,
                        fundingSource,
                    })
                    continue
                }

                // Get the personnel record to find their assigned project
                const personnel = await FormSubmissions.findOne({
                    _id: employeeId,

                    isDeleted: false,
                }).lean()

                if (!personnel) {
                    logger.warn('Personnel record not found for employee', {
                        employeeId,
                        reserveId: record._id.toString(),
                    })
                    continue
                }

                const assignedProjectId = personnel.formData.assignedProjects

                let projectName = NO_PROJECT_LABEL

                // Get the project details if assigned
                if (assignedProjectId) {
                    const project = await FormSubmissions.findOne({
                        _id: assignedProjectId,
                        formName: 'project_management',
                        isDeleted: false,
                    }).lean()

                    if (project) {
                        projectName =
                            project.formData.projectName || NO_PROJECT_LABEL
                    }
                }

                if (!projectStats.has(projectName)) {
                    projectStats.set(projectName, {
                        studioDays: 0,
                        externalDays: 0,
                        openOrders: 0,
                        uniquePersonnel: new Set(),
                    })
                }

                const stats = projectStats.get(projectName)!

                // Calculate overlapping days
                const recordStart = asDate(record.formData.startDate)
                const recordEnd = asDate(record.formData.endDate)
                const rangeStart = parseISO(startDate)
                const rangeEnd = parseISO(endDate)

                const overlapStart =
                    recordStart > rangeStart ? recordStart : rangeStart
                const overlapEnd = recordEnd < rangeEnd ? recordEnd : rangeEnd

                const overlapDays = eachDayOfInterval({
                    start: overlapStart,
                    end: overlapEnd,
                }).length

                // Add days based on funding source
                if (fundingSource === 'internal') {
                    stats.studioDays += overlapDays
                } else if (fundingSource === 'external') {
                    stats.externalDays += overlapDays
                }

                // Count open orders (8open or routineOpen)
                if (orderType === '8open' || orderType === 'routineOpen') {
                    stats.openOrders += 1
                }

                // Track unique personnel
                stats.uniquePersonnel.add(employeeId)
            }

            // Build report rows
            const rows: any[][] = []
            let totalStudioDays = 0
            let totalExternalDays = 0
            let totalOpenOrders = 0
            let totalPersonnel = 0

            // Active projects = project_management records with projectStatus 'active',
            // regardless of whether they had reservations in this date range
            const activeProjectCount = await FormSubmissions.countDocuments({
                formName: 'project_management',
                isDeleted: false,
                'formData.projectStatus': 'active',
            })

            for (const [projectName, stats] of projectStats.entries()) {
                const totalProjectDays = stats.studioDays + stats.externalDays
                const avgOrdersPerDay =
                    totalDays > 0
                        ? (totalProjectDays / totalDays).toFixed(2)
                        : '0'
                const personnelCount = stats.uniquePersonnel.size

                rows.push([
                    projectName,
                    stats.studioDays,
                    stats.externalDays,
                    stats.openOrders,
                    totalProjectDays,
                    avgOrdersPerDay,
                    personnelCount,
                ])

                totalStudioDays += stats.studioDays
                totalExternalDays += stats.externalDays
                totalOpenOrders += stats.openOrders
                totalPersonnel += personnelCount
            }

            // Add totals row
            const totalAllDays = totalStudioDays + totalExternalDays
            const avgTotalPerDay =
                totalDays > 0 ? (totalAllDays / totalDays).toFixed(2) : '0'

            rows.push([
                TOTALS_LABEL,
                totalStudioDays,
                totalExternalDays,
                totalOpenOrders,
                totalAllDays,
                avgTotalPerDay,
                totalPersonnel,
            ])

            return {
                headers: [
                    'שם פרויקט',
                    "ימי מיל' סטודיו",
                    "ימי מיל' חיצוניים",
                    'צווים פתוחים',
                    'סה"כ ימי מיל\'',
                    "ממוצע צווי מיל' ליום",
                    'כמות אנשים בפרויקט',
                ],
                rows,
                activeProjectCount,
            }
        } catch (error) {
            logger.error('Failed to generate project analytics report', error)
            throw error
        }
    }

    /**
     * Report 4: External Reserve Days by Funding Unit
     * Shows external orders grouped by funding unit and project
     */
    async generateExternalByUnitReport(
        startDate: string,
        endDate: string
    ): Promise<ReportData> {
        try {
            logger.info('Generating external by unit report', {
                startDate,
                endDate,
            })

            const rangeStartDate = toUtcMidnight(startDate)
            const rangeEndDate = toUtcMidnight(endDate)

            // Get all external reserve days in the range
            const reserveDays = await FormSubmissions.find({
                isDeleted: false,
                'formData.fundingSource': 'external',
                $or: [
                    {
                        'formData.startDate': {
                            $gte: rangeStartDate,
                            $lte: rangeEndDate,
                        },
                    },
                    {
                        'formData.endDate': {
                            $gte: rangeStartDate,
                            $lte: rangeEndDate,
                        },
                    },
                    {
                        $and: [
                            { 'formData.startDate': { $lte: rangeStartDate } },
                            { 'formData.endDate': { $gte: rangeEndDate } },
                        ],
                    },
                ],
            }).lean()

            // Get unique funding units
            const fundingUnits = new Set<string>()
            for (const record of reserveDays) {
                const unit = record.formData.fundingName || 'ללא יחידה'
                fundingUnits.add(unit)
            }

            const projectStats = new Map<string, UnitStats>()

            for (const record of reserveDays) {
                const employeeId = record.formData.employeeName
                const fundingUnit = record.formData.fundingName || 'ללא יחידה'

                if (!employeeId) {
                    logger.warn(
                        'missing employee ID in external by unit report',
                        {
                            reserveId: record._id.toString(),
                            startDate: record.formData.startDate,
                            endDate: record.formData.endDate,
                        }
                    )
                    continue
                }

                // Get the personnel record to find their assigned project
                const personnel = await FormSubmissions.findOne({
                    _id: employeeId,

                    isDeleted: false,
                }).lean()

                if (!personnel) {
                    logger.warn(
                        'Personnel record not found for employee in external report',
                        {
                            employeeId,
                            reserveId: record._id.toString(),
                        }
                    )
                    continue
                }

                const assignedProjectId = personnel.formData.assignedProjects

                let projectName = NO_PROJECT_LABEL

                if (assignedProjectId) {
                    const project = await FormSubmissions.findOne({
                        _id: assignedProjectId,
                        formName: 'project_management',
                        isDeleted: false,
                    }).lean()

                    if (project) {
                        projectName =
                            project.formData.projectName || NO_PROJECT_LABEL
                    }
                }

                if (!projectStats.has(projectName)) {
                    projectStats.set(projectName, {})
                }

                const stats = projectStats.get(projectName)!

                // Calculate overlapping days
                const recordStart = asDate(record.formData.startDate)
                const recordEnd = asDate(record.formData.endDate)
                const rangeStart = parseISO(startDate)
                const rangeEnd = parseISO(endDate)

                const overlapStart =
                    recordStart > rangeStart ? recordStart : rangeStart
                const overlapEnd = recordEnd < rangeEnd ? recordEnd : rangeEnd

                const overlapDays = eachDayOfInterval({
                    start: overlapStart,
                    end: overlapEnd,
                }).length

                stats[fundingUnit] = (stats[fundingUnit] || 0) + overlapDays
            }

            // Build headers
            const unitHeaders = Array.from(fundingUnits).sort()
            const headers = [
                'שם פרויקט',
                ...unitHeaders,
                'סה"כ ימי מיל\' חיצוניים',
            ]

            // Build rows
            const rows: any[][] = []
            const unitTotals: { [unit: string]: number } = {}

            for (const [projectName, stats] of projectStats.entries()) {
                const row: any[] = [projectName]
                let projectTotal = 0

                for (const unit of unitHeaders) {
                    const days = stats[unit] || 0
                    row.push(days)
                    projectTotal += days
                    unitTotals[unit] = (unitTotals[unit] || 0) + days
                }

                row.push(projectTotal)
                rows.push(row)
            }

            // Add totals row
            const totalRow: any[] = [TOTALS_LABEL]
            let grandTotal = 0

            for (const unit of unitHeaders) {
                const total = unitTotals[unit] || 0
                totalRow.push(total)
                grandTotal += total
            }

            totalRow.push(grandTotal)
            rows.push(totalRow)

            return {
                headers,
                rows,
            }
        } catch (error) {
            logger.error('Failed to generate external by unit report', error)
            throw error
        }
    }

    /**
     * Report 5: Employees on Reserve by Date and Project
     * Shows all employees who should be on reserve on a specific date, grouped by project
     */
    async generateEmployeesOnReserveReport(
        date: string,
        projectId?: string
    ): Promise<ReportData> {
        try {
            logger.info('Generating employees on reserve report', {
                date,
                projectId,
            })

            const targetDate = toUtcMidnight(date)

            // Get all active reserve days for the specified date
            const reserveDays = await FormSubmissions.find({
                formName: 'reserve_days_management',
                isDeleted: false,
                'formData.startDate': { $lte: targetDate },
                'formData.endDate': { $gte: targetDate },
            }).lean()

            // Group by project
            const projectEmployees = new Map<
                string,
                Array<{
                    employeeName: string
                    personalNumber: string
                    unitName: string
                    fundingSource: string
                    orderType: string
                    startDate: string
                    endDate: string
                    projectId: string
                }>
            >()

            // Process each reserve day
            for (const reserve of reserveDays) {
                const employeeId = reserve.formData.employeeName

                if (!employeeId) {
                    logger.warn('Missing employee ID in reserve record', {
                        reserveId: reserve._id.toString(),
                    })
                    continue
                }

                // Get the personnel record
                const personnel = await FormSubmissions.findOne({
                    _id: employeeId,
                    isDeleted: false,
                }).lean()

                if (!personnel) {
                    logger.warn('Personnel record not found', {
                        employeeId,
                    })
                    continue
                }

                const assignedProjectId = personnel.formData.assignedProjects
                let projectName = NO_PROJECT_LABEL
                let actualProjectId = ''

                // Get the project details if assigned
                if (assignedProjectId) {
                    const project = await FormSubmissions.findOne({
                        _id: assignedProjectId,
                        formName: 'project_management',
                        isDeleted: false,
                    }).lean()

                    if (project) {
                        projectName =
                            project.formData.projectName || NO_PROJECT_LABEL
                        actualProjectId = project._id.toString()
                    }
                }

                // Filter by project if specified
                if (projectId && actualProjectId !== projectId) {
                    continue
                }

                if (!projectEmployees.has(projectName)) {
                    projectEmployees.set(projectName, [])
                }

                const employeeData = {
                    employeeName: `${personnel.formData.firstName || ''} ${
                        personnel.formData.lastName || ''
                    }`.trim(),
                    personalNumber: personnel.formData.personalNumber || '',
                    unitName: personnel.formData.unitName || '',
                    fundingSource:
                        reserve.formData.fundingSource === 'internal'
                            ? 'סטודיו'
                            : 'חיצוני',
                    orderType: reserve.formData.orderType || '',
                    startDate: format(
                        asDate(reserve.formData.startDate),
                        'dd/MM/yyyy'
                    ),
                    endDate: format(
                        asDate(reserve.formData.endDate),
                        'dd/MM/yyyy'
                    ),
                    projectId: actualProjectId,
                }

                projectEmployees.get(projectName)!.push(employeeData)
            }

            // Build report rows
            const rows: any[][] = []

            for (const [projectName, employees] of projectEmployees.entries()) {
                // Sort employees by name
                employees.sort((a, b) =>
                    a.employeeName.localeCompare(b.employeeName)
                )

                for (const employee of employees) {
                    rows.push([
                        projectName,
                        employee.employeeName,
                        employee.personalNumber,
                        employee.unitName,
                        employee.fundingSource,
                        employee.orderType,
                        employee.startDate,
                        employee.endDate,
                    ])
                }
            }

            return {
                headers: [
                    'פרויקט',
                    'שם עובד',
                    'מספר אישי',
                    'יחידה',
                    'מקור מימון',
                    'סוג צו',
                    'תאריך התחלה',
                    'תאריך סיום',
                ],
                rows,
            }
        } catch (error) {
            logger.error(
                'Failed to generate employees on reserve report',
                error
            )
            throw error
        }
    }

    /**
     * Get detailed list of personnel for a report
     * Used when clicking on numbers to see the list
     */
    async getPersonnelList(
        date: string,
        projectName?: string,
        fundingSource?: 'internal' | 'external'
    ): Promise<any[]> {
        try {
            logger.info('Getting personnel list', {
                date,
                projectName,
                fundingSource,
            })

            const targetDate = toUtcMidnight(date)
            const query: any = {
                isDeleted: false,
                'formData.startDate': { $lte: targetDate },
                'formData.endDate': { $gte: targetDate },
            }

            if (projectName) {
                query['formData.projectName'] = projectName
            }

            if (fundingSource) {
                query['formData.fundingSource'] = fundingSource
            }

            const reserveDays = await FormSubmissions.find(query)

            return reserveDays.map((record) => ({
                name: `${record.formData.firstName} ${record.formData.lastName}`,
                personalNumber: record.formData.personalNumber,
                projectName: record.formData.projectName,
                fundingSource: record.formData.fundingSource,
                startDate: format(
                    asDate(record.formData.startDate),
                    'dd/MM/yyyy'
                ),
                endDate: format(asDate(record.formData.endDate), 'dd/MM/yyyy'),
            }))
        } catch (error) {
            logger.error('Failed to get personnel list', error)
            throw error
        }
    }
}

export const statisticsService = new StatisticsService()
