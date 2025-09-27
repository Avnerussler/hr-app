import Quota from '../../models/Quota'
import { FormSubmissions } from '../../models/FormSubmissions'
import { Request, Response, Router } from 'express'
import logger from '../../config/logger'
import { asyncHandler } from '../../middleware'

const router = Router()

// List quotas with filtering and pagination
router.get('/', asyncHandler(async (req: Request, res: Response) => {
    try {
        const { 
            page = 1, 
            limit = 100, 
            startDate, 
            endDate,
            ...filters 
        } = req.query

        let query: any = {}
        
        // Date range filter
        if (startDate || endDate) {
            query.date = {}
            if (startDate) query.date.$gte = startDate
            if (endDate) query.date.$lte = endDate
        }

        // Apply other filters
        Object.assign(query, filters)

        const quotas = await Quota.find(query)
            .sort({ date: 1 })
            .limit(Number(limit))
            .skip((Number(page) - 1) * Number(limit))

        const total = await Quota.countDocuments(query)
        const pages = Math.ceil(total / Number(limit))

        res.status(200).json({ 
            data: { quotas },
            pagination: { 
                page: Number(page), 
                limit: Number(limit), 
                total, 
                pages 
            }
        })
    } catch (error) {
        logger.error('Error getting quotas:', error)
        res.status(500).json({ message: 'Error getting quotas', error })
    }
}))

// Get single quota by ID
router.get('/:id', asyncHandler(async (req: Request, res: Response) => {
    try {
        const quota = await Quota.findById(req.params.id)
        
        if (!quota) {
            return res.status(404).json({ message: 'Quota not found' })
        }

        res.status(200).json({ data: quota })
    } catch (error) {
        logger.error('Error getting quota:', error)
        res.status(500).json({ message: 'Error getting quota', error })
    }
}))

// Get quota with occupancy for a specific date
router.get('/date/:date', asyncHandler(async (req: Request, res: Response) => {
    try {
        const { date } = req.params
        
        const result = await Quota.getQuotaWithOccupancy(date)
        
        res.status(200).json({ 
            data: {
                date,
                ...result
            }
        })
    } catch (error) {
        logger.error('Error getting quota with occupancy:', error)
        res.status(500).json({ message: 'Error getting quota with occupancy', error })
    }
}))

// Get quotas for a date range (lightweight)
router.get('/range/:startDate/:endDate', asyncHandler(async (req: Request, res: Response) => {
    try {
        const { startDate, endDate } = req.params
        
        const quotas = await Quota.findByDateRange(startDate, endDate)
        
        res.status(200).json({ 
            data: { quotas }
        })
    } catch (error) {
        logger.error('Error getting quotas for range:', error)
        res.status(500).json({ message: 'Error getting quotas for range', error })
    }
}))

// Get quotas with occupancy for date range (main calendar endpoint)
router.get('/occupancy/range/:startDate/:endDate', asyncHandler(async (req: Request, res: Response) => {
    try {
        const { startDate, endDate } = req.params
        const { occupancyOnly } = req.query
        
        if (occupancyOnly === 'true') {
            // Return only occupancy data (lightweight)
            const occupancyData = await Quota.getOccupancyForDateRange(startDate, endDate)
            return res.status(200).json({ data: occupancyData })
        }
        
        // Return full quota + occupancy data for calendar
        const quotasWithOccupancy = await Quota.getQuotasWithOccupancyForRange(startDate, endDate)
        
        // Calculate summary statistics
        const summary = {
            totalQuotas: quotasWithOccupancy.reduce((sum, item) => sum + (item.quota || 0), 0),
            totalOccupancy: quotasWithOccupancy.reduce((sum, item) => sum + item.currentOccupancy, 0),
            totalCapacityLeft: quotasWithOccupancy.reduce((sum, item) => sum + item.capacityLeft, 0),
            averageOccupancyRate: Math.round(
                quotasWithOccupancy.reduce((sum, item) => sum + (item.occupancyRate || 0), 0) / 
                quotasWithOccupancy.filter(item => item.occupancyRate !== undefined).length
            ) || 0
        }
        
        res.status(200).json({ 
            data: quotasWithOccupancy,
            summary
        })
    } catch (error) {
        logger.error('Error getting quotas with occupancy for range:', error)
        res.status(500).json({ message: 'Error getting quotas with occupancy for range', error })
    }
}))

// Get employees scheduled for a specific date
router.get('/employees/:date', asyncHandler(async (req: Request, res: Response) => {
    try {
        const { date } = req.params
        
        // Find all Reserve Days Management form submissions that include this date
        const reservations = await FormSubmissions.find({
            formName: 'Reserve%20Days%20Management',
            $or: [
                // Date falls within startDate and endDate range
                {
                    'formData.startDate': { $lte: date },
                    'formData.endDate': { $gte: date }
                },
                // Single day reservation (startDate equals the date)
                {
                    'formData.startDate': date,
                    'formData.endDate': { $exists: false }
                },
                // startDate equals endDate equals the date
                {
                    'formData.startDate': date,
                    'formData.endDate': date
                }
            ]
        })
        
        // Map reservations to employee attendance data
        const employees = reservations.map((reservation: any) => {
            const formData = reservation.formData
            
            // Handle employee name - it might be an object with display property or a string
            let employeeName = 'Unknown Employee'
            if (formData.employeeName) {
                if (typeof formData.employeeName === 'object' && formData.employeeName.display) {
                    employeeName = formData.employeeName.display
                } else if (typeof formData.employeeName === 'string') {
                    employeeName = formData.employeeName
                }
            }
            
            return {
                _id: reservation._id.toString(),
                name: employeeName,
                personalNumber: formData.personalNumber || '',
                reserveUnit: formData.reserveUnit || '',
                workPlace: formData.workPlace || '',
                orderNumber: formData.orderNumber || '',
                orderType: formData.orderType || '',
                isActive: true,
                startDate: formData.startDate,
                endDate: formData.endDate,
                isStartingToday: formData.startDate === date,
                isEndingToday: formData.endDate === date,
                isAttendanceRequired: true,
                hasAttended: formData.attendance && formData.attendance[date] === true, // Check saved attendance data
                workDays: [], // Could be calculated from the date range
                reserveDays: formData.reserveDays || []
            }
        })
        
        // Calculate statistics
        const statistics = {
            startingToday: employees.filter(emp => emp.isStartingToday).length,
            endingToday: employees.filter(emp => emp.isEndingToday).length,
            totalRequired: employees.length,
            totalAttended: employees.filter(emp => emp.hasAttended).length
        }
        
        res.status(200).json({ 
            data: {
                date,
                employees,
                statistics
            }
        })
    } catch (error) {
        logger.error('Error getting employees for date:', error)
        res.status(500).json({ message: 'Error getting employees for date', error })
    }
}))

export { router as GetQuotaRouter }