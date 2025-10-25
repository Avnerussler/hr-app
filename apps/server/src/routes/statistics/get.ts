import { Router, Request, Response } from 'express'
import { statisticsService } from '../../services/statisticsService'
import { asyncHandler } from '../../middleware'
import logger from '../../config/logger'

const router = Router()

/**
 * GET /api/statistics/reports
 * Generate multiple reports based on query parameters
 * Query params: reportTypes (comma-separated), startDate, endDate
 */
router.get(
    '/reports',
    asyncHandler(async (req: Request, res: Response) => {
        const { reportTypes, startDate, endDate } = req.query

        if (!reportTypes || !startDate || !endDate) {
            return res.status(400).json({
                error: 'Missing required parameters: reportTypes, startDate, endDate',
            })
        }

        const types = (reportTypes as string).split(',')
        const reports: Record<string, any> = {}

        logger.info('Generating reports', {
            types,
            startDate,
            endDate,
        })

        for (const type of types) {
            switch (type) {
                case 'daily_summary':
                    // If it's a single day range, use that day; otherwise use today
                    const dateForDaily =
                        startDate === endDate
                            ? (startDate as string)
                            : new Date().toISOString().split('T')[0]
                    reports[type] =
                        await statisticsService.generateDailySummaryReport(
                            dateForDaily
                        )
                    break
                case 'date_range_summary':
                    reports[type] =
                        await statisticsService.generateDateRangeSummaryReport(
                            startDate as string,
                            endDate as string
                        )
                    break
                case 'project_analytics':
                    reports[type] =
                        await statisticsService.generateProjectAnalyticsReport(
                            startDate as string,
                            endDate as string
                        )
                    break
                case 'external_by_unit':
                    reports[type] =
                        await statisticsService.generateExternalByUnitReport(
                            startDate as string,
                            endDate as string
                        )
                    break
                default:
                    logger.warn(`Unknown report type: ${type}`)
            }
        }

        res.status(200).json({
            data: reports,
            metadata: {
                startDate,
                endDate,
                generatedAt: new Date().toISOString(),
            },
        })
    })
)

/**
 * GET /api/statistics/daily-summary
 * Get daily summary report for today
 */
router.get(
    '/daily-summary',
    asyncHandler(async (_req: Request, res: Response) => {
        const today = new Date().toISOString().split('T')[0]

        const report = await statisticsService.generateDailySummaryReport(
            today
        )

        res.status(200).json({
            data: report,
            metadata: {
                date: today,
                generatedAt: new Date().toISOString(),
            },
        })
    })
)

/**
 * GET /api/statistics/date-range-summary
 * Get summary across a date range
 */
router.get(
    '/date-range-summary',
    asyncHandler(async (req: Request, res: Response) => {
        const { startDate, endDate } = req.query

        if (!startDate || !endDate) {
            return res.status(400).json({
                error: 'Missing required parameters: startDate, endDate',
            })
        }

        const report =
            await statisticsService.generateDateRangeSummaryReport(
                startDate as string,
                endDate as string
            )

        res.status(200).json({
            data: report,
            metadata: {
                startDate,
                endDate,
                generatedAt: new Date().toISOString(),
            },
        })
    })
)

/**
 * GET /api/statistics/project-analytics
 * Get detailed project analytics for a date range
 */
router.get(
    '/project-analytics',
    asyncHandler(async (req: Request, res: Response) => {
        const { startDate, endDate } = req.query

        if (!startDate || !endDate) {
            return res.status(400).json({
                error: 'Missing required parameters: startDate, endDate',
            })
        }

        const report = await statisticsService.generateProjectAnalyticsReport(
            startDate as string,
            endDate as string
        )

        res.status(200).json({
            data: report,
            metadata: {
                startDate,
                endDate,
                generatedAt: new Date().toISOString(),
            },
        })
    })
)

/**
 * GET /api/statistics/external-by-unit
 * Get external reserve days grouped by funding unit
 */
router.get(
    '/external-by-unit',
    asyncHandler(async (req: Request, res: Response) => {
        const { startDate, endDate } = req.query

        if (!startDate || !endDate) {
            return res.status(400).json({
                error: 'Missing required parameters: startDate, endDate',
            })
        }

        const report = await statisticsService.generateExternalByUnitReport(
            startDate as string,
            endDate as string
        )

        res.status(200).json({
            data: report,
            metadata: {
                startDate,
                endDate,
                generatedAt: new Date().toISOString(),
            },
        })
    })
)

/**
 * GET /api/statistics/personnel-list
 * Get detailed personnel list for a specific date/project/funding source
 */
router.get(
    '/personnel-list',
    asyncHandler(async (req: Request, res: Response) => {
        const { date, projectName, fundingSource } = req.query

        if (!date) {
            return res.status(400).json({
                error: 'Missing required parameter: date',
            })
        }

        const personnelList = await statisticsService.getPersonnelList(
            date as string,
            projectName as string | undefined,
            fundingSource as 'internal' | 'external' | undefined
        )

        res.status(200).json({
            data: personnelList,
            metadata: {
                date,
                projectName,
                fundingSource,
                count: personnelList.length,
            },
        })
    })
)

export { router as GetStatisticsRouter }
