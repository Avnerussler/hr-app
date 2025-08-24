import { WorkHours } from '../../models'
import { Request, Response, Router } from 'express'
import logger from '../../config/logger'
import mongoose from 'mongoose'
import { parseISO, isValid, startOfDay, endOfDay } from 'date-fns'

const router = Router()

// Get work hours by date range
router.get('/', async (req: Request, res: Response) => {
    logger.info('GET /workHours - Request received')
    try {
        const { 
            startDate, 
            endDate, 
            employeeId, 
            projectId, 
            status = 'all',
            page = 1,
            limit = 100
        } = req.query

        // Build query conditions
        const query: any = {}
        
        if (startDate && endDate) {
            const start = parseISO(startDate as string)
            const end = parseISO(endDate as string)
            
            if (!isValid(start) || !isValid(end)) {
                res.status(400).json({ message: 'Invalid date format. Use ISO format (YYYY-MM-DD)' })
                return
            }
            
            query.date = {
                $gte: startOfDay(start),
                $lte: endOfDay(end)
            }
        }
        
        if (employeeId) {
            query.employeeId = mongoose.Types.ObjectId.createFromHexString(employeeId as string)
        }
        
        if (projectId) {
            query.projectId = mongoose.Types.ObjectId.createFromHexString(projectId as string)
        }
        
        if (status !== 'all') {
            query.status = status
        }

        // Calculate pagination
        const skip = (Number(page) - 1) * Number(limit)

        const [workHours, totalCount] = await Promise.all([
            WorkHours.find(query)
                .sort({ date: -1, employeeName: 1 })
                .skip(skip)
                .limit(Number(limit))
                .populate('employeeId', 'formData.name')
                .populate('projectId', 'formData.name')
                .lean(),
            WorkHours.countDocuments(query)
        ])

        res.status(200).json({
            workHours,
            pagination: {
                page: Number(page),
                limit: Number(limit),
                total: totalCount,
                pages: Math.ceil(totalCount / Number(limit))
            }
        })
    } catch (error) {
        logger.error('Error getting work hours:', error)
        res.status(500).json({ message: 'Error getting work hours', error })
    }
})

// Get work hours for a specific week
router.get('/week/:year/:week', async (req: Request, res: Response) => {
    logger.info(`GET /workHours/week/${req.params.year}/${req.params.week} - Request received`)
    try {
        const year = parseInt(req.params.year)
        const week = parseInt(req.params.week)

        if (isNaN(year) || isNaN(week) || week < 1 || week > 53) {
            res.status(400).json({ message: 'Invalid year or week number' })
            return
        }

        const workHours = await WorkHours.findByWeek(year, week)
        
        res.status(200).json({ workHours })
    } catch (error) {
        logger.error('Error getting weekly work hours:', error)
        res.status(500).json({ message: 'Error getting weekly work hours', error })
    }
})

// Get work hours by date range (for the weekly grid)
router.get('/range/:startDate/:endDate', async (req: Request, res: Response) => {
    logger.info(`GET /workHours/range/${req.params.startDate}/${req.params.endDate} - Request received`)
    try {
        const start = parseISO(req.params.startDate)
        const end = parseISO(req.params.endDate)

        if (!isValid(start) || !isValid(end)) {
            res.status(400).json({ message: 'Invalid date format. Use ISO format (YYYY-MM-DD)' })
            return
        }

        const workHours = await WorkHours.find({
            date: {
                $gte: startOfDay(start),
                $lte: endOfDay(end)
            }
        })
        .sort({ employeeName: 1, date: 1 })
        .lean()

        res.status(200).json({ workHours })
    } catch (error) {
        logger.error('Error getting work hours by date range:', error)
        res.status(500).json({ message: 'Error getting work hours by date range', error })
    }
})

// Get work hours metrics for a date range
router.get('/metrics/:startDate/:endDate', async (req: Request, res: Response) => {
    logger.info(`GET /workHours/metrics/${req.params.startDate}/${req.params.endDate} - Request received`)
    try {
        const start = parseISO(req.params.startDate)
        const end = parseISO(req.params.endDate)

        if (!isValid(start) || !isValid(end)) {
            res.status(400).json({ message: 'Invalid date format. Use ISO format (YYYY-MM-DD)' })
            return
        }

        const metrics = await WorkHours.getWeeklyMetrics(startOfDay(start), endOfDay(end))
        
        res.status(200).json({ 
            metrics: metrics.length > 0 ? metrics[0] : {
                totalHours: 0,
                activeEmployees: 0,
                totalEntries: 0,
                avgHoursPerDay: 0,
                avgHoursPerEmployee: 0
            }
        })
    } catch (error) {
        logger.error('Error getting work hours metrics:', error)
        res.status(500).json({ message: 'Error getting work hours metrics', error })
    }
})

// Get work hours by employee
router.get('/employee/:employeeId', async (req: Request, res: Response) => {
    logger.info(`GET /workHours/employee/${req.params.employeeId} - Request received`)
    try {
        const employeeId = mongoose.Types.ObjectId.createFromHexString(req.params.employeeId)
        const { startDate, endDate, limit = 50 } = req.query

        let query: any = { employeeId }

        if (startDate && endDate) {
            const start = parseISO(startDate as string)
            const end = parseISO(endDate as string)
            
            if (!isValid(start) || !isValid(end)) {
                res.status(400).json({ message: 'Invalid date format. Use ISO format (YYYY-MM-DD)' })
                return
            }
            
            query.date = {
                $gte: startOfDay(start),
                $lte: endOfDay(end)
            }
        }

        const workHours = await WorkHours.findByEmployeeAndDateRange(
            employeeId,
            startDate ? (() => {
                const date = parseISO(startDate as string)
                return isValid(date) ? startOfDay(date) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
            })() : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
            endDate ? (() => {
                const date = parseISO(endDate as string)
                return isValid(date) ? endOfDay(date) : new Date()
            })() : new Date()
        ).limit(Number(limit))

        res.status(200).json({ workHours })
    } catch (error) {
        logger.error('Error getting employee work hours:', error)
        res.status(500).json({ message: 'Error getting employee work hours', error })
    }
})

// Get single work hour entry
router.get('/:id', async (req: Request, res: Response) => {
    logger.info(`GET /workHours/${req.params.id} - Request received`)
    try {
        const workHour = await WorkHours.findById(req.params.id)
            .populate('employeeId', 'formData.name')
            .populate('projectId', 'formData.name')

        if (!workHour) {
            res.status(404).json({ message: 'Work hour entry not found' })
            return
        }

        res.status(200).json({ workHour })
    } catch (error) {
        logger.error('Error getting work hour entry:', error)
        res.status(500).json({ message: 'Error getting work hour entry', error })
    }
})

export { router as GetWorkHoursRouter }