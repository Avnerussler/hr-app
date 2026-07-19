import { ReserveDayModel } from '../models/ReserveDay'
import { PersonnelModel, PersonnelDocument } from '../models/Personnel'
import { ProjectModel } from '../models/Project'
import { ORDER_TYPE_LABELS } from '@hr-app/shared-types'
import logger from '../config/logger'
import { eachDayOfInterval, parseISO, format } from 'date-fns'

// startDate/endDate are stored as UTC-midnight Date objects in Mongo, so query
// bounds and any date read from a record must be normalized to Date before
// comparison instead of compared as 'dd/MM/yyyy' strings.
const toUtcMidnight = (dateStr: string): Date => parseISO(`${dateStr}T00:00:00.000Z`)

const asDate = (val: unknown): Date => (val instanceof Date ? val : parseISO(val as string))

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

/** Resolve each reserve day's assigned project name via its populated employee, once per unique employee. */
async function buildProjectNameResolver(
    reserveDays: { employeeName: unknown }[]
): Promise<(employeeId: string | null | undefined) => string> {
    const employeeIds = [...new Set(reserveDays.map((r) => String(r.employeeName)).filter(Boolean))]
    const personnel = await PersonnelModel.find({ _id: { $in: employeeIds } })
        .select('assignedProjects')
        .lean()
    const projectIds = [
        ...new Set(personnel.map((p) => p.assignedProjects).filter(Boolean).map((id) => String(id))),
    ]
    const projects = await ProjectModel.find({ _id: { $in: projectIds } })
        .select('projectName')
        .lean()

    const projectNameById = new Map(projects.map((p) => [String(p._id), p.projectName]))
    const projectIdByPersonnel = new Map(
        personnel.map((p) => [String(p._id), p.assignedProjects ? String(p.assignedProjects) : null])
    )

    return (employeeId: string | null | undefined) => {
        if (!employeeId) return NO_PROJECT_LABEL
        const projectId = projectIdByPersonnel.get(String(employeeId))
        if (!projectId) return NO_PROJECT_LABEL
        return projectNameById.get(projectId) ?? NO_PROJECT_LABEL
    }
}

/**
 * Statistics Service for Reserve Days Reports
 * Generates various reports for reserve days, reading live data from the
 * typed Personnel/Project/ReserveDay collections.
 */
class StatisticsService {
    /**
     * Report 1: Daily Reserve Days Summary
     * Shows orders by project for a specific date
     */
    async generateDailySummaryReport(date: string): Promise<ReportData> {
        try {
            logger.info('Generating daily summary report', { date })

            const targetDate = toUtcMidnight(date)
            const reserveDays = await ReserveDayModel.find({
                isDeleted: false,
                startDate: { $lte: targetDate },
                endDate: { $gte: targetDate },
            }).lean()

            const resolveProjectName = await buildProjectNameResolver(reserveDays)

            const projectStats = new Map<
                string,
                { studioOrders: Set<string>; externalOrders: Set<string>; openOrders: Set<string> }
            >()

            for (const reserve of reserveDays) {
                const fundingSource = reserve.fundingSource
                const orderType = reserve.orderType
                const employeeId = reserve.employeeName

                if (!employeeId) {
                    logger.warn('missing employee ID', {
                        reserveId: reserve._id.toString(),
                        startDate: reserve.startDate,
                        endDate: reserve.endDate,
                        fundingSource,
                    })
                    continue
                }

                const projectName = resolveProjectName(String(employeeId))

                if (!projectStats.has(projectName)) {
                    projectStats.set(projectName, {
                        studioOrders: new Set(),
                        externalOrders: new Set(),
                        openOrders: new Set(),
                    })
                }

                const stats = projectStats.get(projectName)!
                const empIdStr = String(employeeId)

                if (fundingSource === 'internal') {
                    stats.studioOrders.add(empIdStr)
                }
                if (fundingSource === 'external') {
                    stats.externalOrders.add(empIdStr)
                }
                if (orderType === '8open' || orderType === 'routineOpen') {
                    stats.openOrders.add(empIdStr)
                }
            }

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

                rows.push([projectName, studioCount, externalCount, openCount, total])

                totalStudio += studioCount
                totalExternal += externalCount
                totalOpen += openCount
                grandTotal += total
            }

            rows.push([TOTALS_LABEL, totalStudio, totalExternal, totalOpen, grandTotal])

            return {
                headers: [
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
    async generateDateRangeSummaryReport(startDate: string, endDate: string): Promise<ReportData> {
        try {
            logger.info('Generating date range summary report', { startDate, endDate })

            const dates = eachDayOfInterval({ start: parseISO(startDate), end: parseISO(endDate) })

            const headers = ['תאריך', ...dates.map((d) => format(d, 'd.M'))]
            const studioRow: (string | number)[] = ['צווים סטודיו']
            const externalRow: (string | number)[] = ['צווים חיצוניים']
            const totalRow: (string | number)[] = ['סה"כ צווים (סטודיו + חיצוניים)']

            for (const date of dates) {
                const reserveDays = await ReserveDayModel.find({
                    isDeleted: false,
                    startDate: { $lte: date },
                    endDate: { $gte: date },
                }).lean()

                const studioPersonnel = new Set<string>()
                const externalPersonnel = new Set<string>()

                for (const record of reserveDays) {
                    const fundingSource = record.fundingSource
                    const employeeId = record.employeeName

                    if (fundingSource === 'internal') {
                        studioPersonnel.add(String(employeeId))
                    } else if (fundingSource === 'external') {
                        externalPersonnel.add(String(employeeId))
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
            logger.info('Generating project analytics report', { startDate, endDate })

            const rangeStartDate = toUtcMidnight(startDate)
            const rangeEndDate = toUtcMidnight(endDate)

            const reserveDays = await ReserveDayModel.find({
                isDeleted: false,
                $or: [
                    { startDate: { $gte: rangeStartDate, $lte: rangeEndDate } },
                    { endDate: { $gte: rangeStartDate, $lte: rangeEndDate } },
                    { $and: [{ startDate: { $lte: rangeStartDate } }, { endDate: { $gte: rangeEndDate } }] },
                ],
            }).lean()

            const dates = eachDayOfInterval({ start: parseISO(startDate), end: parseISO(endDate) })
            const totalDays = dates.length

            const resolveProjectName = await buildProjectNameResolver(reserveDays)

            const projectStats = new Map<string, ProjectStats>()

            for (const record of reserveDays) {
                const fundingSource = record.fundingSource
                const orderType = record.orderType
                const employeeId = record.employeeName

                if (!employeeId) {
                    logger.warn('missing employee ID in project analytics', {
                        reserveId: record._id.toString(),
                        startDate: record.startDate,
                        endDate: record.endDate,
                        fundingSource,
                    })
                    continue
                }

                const projectName = resolveProjectName(String(employeeId))

                if (!projectStats.has(projectName)) {
                    projectStats.set(projectName, {
                        studioDays: 0,
                        externalDays: 0,
                        openOrders: 0,
                        uniquePersonnel: new Set(),
                    })
                }

                const stats = projectStats.get(projectName)!

                const recordStart = asDate(record.startDate)
                const recordEnd = asDate(record.endDate)
                const rangeStart = parseISO(startDate)
                const rangeEnd = parseISO(endDate)

                const overlapStart = recordStart > rangeStart ? recordStart : rangeStart
                const overlapEnd = recordEnd < rangeEnd ? recordEnd : rangeEnd

                const overlapDays = eachDayOfInterval({ start: overlapStart, end: overlapEnd }).length

                if (fundingSource === 'internal') {
                    stats.studioDays += overlapDays
                } else if (fundingSource === 'external') {
                    stats.externalDays += overlapDays
                }

                if (orderType === '8open' || orderType === 'routineOpen') {
                    stats.openOrders += 1
                }

                stats.uniquePersonnel.add(String(employeeId))
            }

            const rows: any[][] = []
            let totalStudioDays = 0
            let totalExternalDays = 0
            let totalOpenOrders = 0
            let totalPersonnel = 0

            // Active projects = projects with projectStatus 'active', regardless
            // of whether they had reservations in this date range.
            const activeProjectCount = await ProjectModel.countDocuments({ projectStatus: 'active' })

            for (const [projectName, stats] of projectStats.entries()) {
                const totalProjectDays = stats.studioDays + stats.externalDays
                const avgOrdersPerDay = totalDays > 0 ? (totalProjectDays / totalDays).toFixed(2) : '0'
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

            const totalAllDays = totalStudioDays + totalExternalDays
            const avgTotalPerDay = totalDays > 0 ? (totalAllDays / totalDays).toFixed(2) : '0'

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
    async generateExternalByUnitReport(startDate: string, endDate: string): Promise<ReportData> {
        try {
            logger.info('Generating external by unit report', { startDate, endDate })

            const rangeStartDate = toUtcMidnight(startDate)
            const rangeEndDate = toUtcMidnight(endDate)

            const reserveDays = await ReserveDayModel.find({
                isDeleted: false,
                fundingSource: 'external',
                $or: [
                    { startDate: { $gte: rangeStartDate, $lte: rangeEndDate } },
                    { endDate: { $gte: rangeStartDate, $lte: rangeEndDate } },
                    { $and: [{ startDate: { $lte: rangeStartDate } }, { endDate: { $gte: rangeEndDate } }] },
                ],
            }).lean()

            const resolveProjectName = await buildProjectNameResolver(reserveDays)

            const fundingUnits = new Set<string>()
            for (const record of reserveDays) {
                fundingUnits.add(record.fundingName || 'ללא יחידה')
            }

            const projectStats = new Map<string, UnitStats>()

            for (const record of reserveDays) {
                const employeeId = record.employeeName
                const fundingUnit = record.fundingName || 'ללא יחידה'

                if (!employeeId) {
                    logger.warn('missing employee ID in external by unit report', {
                        reserveId: record._id.toString(),
                        startDate: record.startDate,
                        endDate: record.endDate,
                    })
                    continue
                }

                const projectName = resolveProjectName(String(employeeId))

                if (!projectStats.has(projectName)) {
                    projectStats.set(projectName, {})
                }

                const stats = projectStats.get(projectName)!

                const recordStart = asDate(record.startDate)
                const recordEnd = asDate(record.endDate)
                const rangeStart = parseISO(startDate)
                const rangeEnd = parseISO(endDate)

                const overlapStart = recordStart > rangeStart ? recordStart : rangeStart
                const overlapEnd = recordEnd < rangeEnd ? recordEnd : rangeEnd

                const overlapDays = eachDayOfInterval({ start: overlapStart, end: overlapEnd }).length

                stats[fundingUnit] = (stats[fundingUnit] || 0) + overlapDays
            }

            const unitHeaders = Array.from(fundingUnits).sort()
            const headers = ['שם פרויקט', ...unitHeaders, 'סה"כ ימי מיל\' חיצוניים']

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

            const totalRow: any[] = [TOTALS_LABEL]
            let grandTotal = 0

            for (const unit of unitHeaders) {
                const total = unitTotals[unit] || 0
                totalRow.push(total)
                grandTotal += total
            }

            totalRow.push(grandTotal)
            rows.push(totalRow)

            return { headers, rows }
        } catch (error) {
            logger.error('Failed to generate external by unit report', error)
            throw error
        }
    }

    /**
     * Report 5: Employees on Reserve by Date and Project
     * Shows all employees who should be on reserve on a specific date, grouped by project
     */
    async generateEmployeesOnReserveReport(date: string, projectId?: string): Promise<ReportData> {
        try {
            logger.info('Generating employees on reserve report', { date, projectId })

            const targetDate = toUtcMidnight(date)

            const reserveDays = await ReserveDayModel.find({
                isDeleted: false,
                startDate: { $lte: targetDate },
                endDate: { $gte: targetDate },
            }).lean()

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

            for (const reserve of reserveDays) {
                const employeeId = reserve.employeeName

                if (!employeeId) {
                    logger.warn('Missing employee ID in reserve record', { reserveId: reserve._id.toString() })
                    continue
                }

                const personnel = await PersonnelModel.findById(employeeId).lean()

                if (!personnel) {
                    logger.warn('Personnel record not found', { employeeId })
                    continue
                }

                const assignedProjectId = personnel.assignedProjects
                let projectName = NO_PROJECT_LABEL
                let actualProjectId = ''

                if (assignedProjectId) {
                    const project = await ProjectModel.findById(assignedProjectId).lean()

                    if (project) {
                        projectName = project.projectName || NO_PROJECT_LABEL
                        actualProjectId = project._id.toString()
                    }
                }

                if (projectId && actualProjectId !== projectId) {
                    continue
                }

                if (!projectEmployees.has(projectName)) {
                    projectEmployees.set(projectName, [])
                }

                const employeeData = {
                    employeeName: `${personnel.firstName || ''} ${personnel.lastName || ''}`.trim(),
                    personalNumber: personnel.personalNumber || '',
                    unitName: personnel.reserveUnit || '',
                    fundingSource: reserve.fundingSource === 'internal' ? 'סטודיו' : 'חיצוני',
                    orderType: ORDER_TYPE_LABELS[reserve.orderType] ?? reserve.orderType ?? '',
                    startDate: format(asDate(reserve.startDate), 'dd/MM/yyyy'),
                    endDate: format(asDate(reserve.endDate), 'dd/MM/yyyy'),
                    projectId: actualProjectId,
                }

                projectEmployees.get(projectName)!.push(employeeData)
            }

            const rows: any[][] = []

            for (const [projectName, employees] of projectEmployees.entries()) {
                employees.sort((a, b) => a.employeeName.localeCompare(b.employeeName))

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
            logger.error('Failed to generate employees on reserve report', error)
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
            logger.info('Getting personnel list', { date, projectName, fundingSource })

            const targetDate = toUtcMidnight(date)
            const query: Record<string, unknown> = {
                isDeleted: false,
                startDate: { $lte: targetDate },
                endDate: { $gte: targetDate },
            }

            if (fundingSource) {
                query.fundingSource = fundingSource
            }

            const reserveDays = await ReserveDayModel.find(query).lean()
            const resolveProjectName = await buildProjectNameResolver(reserveDays)

            const results = await Promise.all(
                reserveDays.map(async (record) => {
                    const personnel = (await PersonnelModel.findById(record.employeeName).lean()) as PersonnelDocument | null
                    return {
                        name: personnel ? `${personnel.firstName} ${personnel.lastName}` : '',
                        personalNumber: personnel?.personalNumber ?? '',
                        projectName: resolveProjectName(String(record.employeeName)),
                        fundingSource: record.fundingSource,
                        startDate: format(asDate(record.startDate), 'dd/MM/yyyy'),
                        endDate: format(asDate(record.endDate), 'dd/MM/yyyy'),
                    }
                })
            )

            return projectName ? results.filter((r) => r.projectName === projectName) : results
        } catch (error) {
            logger.error('Failed to get personnel list', error)
            throw error
        }
    }
}

export const statisticsService = new StatisticsService()
