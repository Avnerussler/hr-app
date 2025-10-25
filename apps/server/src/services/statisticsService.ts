import { FormSubmissions } from '../models'
import logger from '../config/logger'
import { eachDayOfInterval, parseISO, format } from 'date-fns'
import mongoose from 'mongoose'

interface ReportData {
    headers: string[]
    rows: any[][]
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
            const reserveDays = await FormSubmissions.find({
                isDeleted: false,
                'formData.startDate': { $lte: date },
                'formData.endDate': { $gte: date },
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
                        reserveId: reserve._id,
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

                let projectName = 'ללא פרויקט'

                // Get the project details if assigned
                if (assignedProjectId) {
                    const project = await FormSubmissions.findOne({
                        _id: assignedProjectId,
                        formName: 'project_management',
                        isDeleted: false,
                    }).lean()

                    if (project) {
                        projectName =
                            project.formData.projectName || 'ללא פרויקט'
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
                'סה"כ',
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
                const dateStr = format(date, 'yyyy-MM-dd')

                // Get active reserve days for this date
                const reserveDays = await FormSubmissions.find({
                    isDeleted: false,
                    'formData.startDate': { $lte: dateStr },
                    'formData.endDate': { $gte: dateStr },
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
    ): Promise<ReportData> {
        try {
            logger.info('Generating project analytics report', {
                startDate,
                endDate,
            })

            // Get all reserve days in the range
            const reserveDays = await FormSubmissions.find({
                isDeleted: false,
                $or: [
                    {
                        'formData.startDate': {
                            $gte: startDate,
                            $lte: endDate,
                        },
                    },
                    {
                        'formData.endDate': { $gte: startDate, $lte: endDate },
                    },
                    {
                        $and: [
                            { 'formData.startDate': { $lte: startDate } },
                            { 'formData.endDate': { $gte: endDate } },
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
                        reserveId: record._id,
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
                        reserveId: record._id,
                    })
                    continue
                }

                const assignedProjectId = personnel.formData.assignedProjects

                let projectName = 'ללא פרויקט'

                // Get the project details if assigned
                if (assignedProjectId) {
                    const project = await FormSubmissions.findOne({
                        _id: assignedProjectId,
                        formName: 'project_management',
                        isDeleted: false,
                    }).lean()

                    if (project) {
                        projectName =
                            project.formData.projectName || 'ללא פרויקט'
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
                const recordStart = parseISO(record.formData.startDate)
                const recordEnd = parseISO(record.formData.endDate)
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
                'סה"כ',
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

            // Get all external reserve days in the range
            const reserveDays = await FormSubmissions.find({
                isDeleted: false,
                'formData.fundingSource': 'external',
                $or: [
                    {
                        'formData.startDate': {
                            $gte: startDate,
                            $lte: endDate,
                        },
                    },
                    {
                        'formData.endDate': { $gte: startDate, $lte: endDate },
                    },
                    {
                        $and: [
                            { 'formData.startDate': { $lte: startDate } },
                            { 'formData.endDate': { $gte: endDate } },
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
                            reserveId: record._id,
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
                            reserveId: record._id,
                        }
                    )
                    continue
                }

                const projectName =
                    personnel.formData.assignedProjects.display || 'ללא פרויקט'

                if (!projectStats.has(projectName)) {
                    projectStats.set(projectName, {})
                }

                const stats = projectStats.get(projectName)!

                // Calculate overlapping days
                const recordStart = parseISO(record.formData.startDate)
                const recordEnd = parseISO(record.formData.endDate)
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
            const totalRow: any[] = ['סה"כ']
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

            const query: any = {
                isDeleted: false,
                'formData.startDate': { $lte: date },
                'formData.endDate': { $gte: date },
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
                startDate: record.formData.startDate,
                endDate: record.formData.endDate,
            }))
        } catch (error) {
            logger.error('Failed to get personnel list', error)
            throw error
        }
    }
}

export const statisticsService = new StatisticsService()
