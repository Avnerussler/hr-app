import { Request, Response, Router } from 'express'
import logger from '../../config/logger'
import { asyncHandler } from '../../middleware'
import { FormSubmissions } from '../../models/FormSubmissions'

const router = Router()

// Save attendance data for a specific date
router.post('/attendance/:date', asyncHandler(async (req: Request, res: Response) => {
    try {
        const { date } = req.params
        const { attendanceChanges } = req.body // { employeeId: boolean, ... }
        
        if (!attendanceChanges || typeof attendanceChanges !== 'object') {
            return res.status(400).json({ message: 'Invalid attendance data' })
        }
        
        // Create or update attendance records for each employee
        const results = []
        
        for (const [employeeId, hasAttended] of Object.entries(attendanceChanges)) {
            try {
                // Find the reservation record for this employee
                const reservation = await FormSubmissions.findById(employeeId)
                
                if (!reservation) {
                    logger.warn(`Reservation not found for employee ID: ${employeeId}`)
                    continue
                }
                
                // Update or create attendance record in the formData
                if (!reservation.formData.attendance) {
                    reservation.formData.attendance = {}
                }
                
                reservation.formData.attendance[date] = hasAttended
                reservation.markModified('formData')
                
                await reservation.save()
                
                results.push({
                    employeeId,
                    date,
                    hasAttended,
                    status: 'updated'
                })
                
            } catch (err) {
                const error = err instanceof Error ? err : new Error(String(err))
                logger.error(`Error updating attendance for employee ${employeeId}:`, error)
                results.push({
                    employeeId,
                    date,
                    status: 'error',
                    error: error.message
                })
            }
        }
        
        res.status(200).json({
            message: 'Attendance data saved successfully',
            data: {
                date,
                results,
                totalProcessed: results.length,
                successful: results.filter(r => r.status === 'updated').length,
                failed: results.filter(r => r.status === 'error').length
            }
        })
        
    } catch (error) {
        logger.error('Error saving attendance data:', error)
        res.status(500).json({ message: 'Error saving attendance data', error })
    }
}))

// Get attendance summary for a date range (for calendar indicators)
router.get('/attendance/range/:startDate/:endDate', asyncHandler(async (req: Request, res: Response) => {
    try {
        const { startDate, endDate } = req.params
        
        // Find all reservations that overlap with the date range
        const reservations = await FormSubmissions.find({
            formName: 'Reserve%20Days%20Management',
            $or: [
                {
                    'formData.startDate': { $lte: endDate },
                    'formData.endDate': { $gte: startDate }
                },
                {
                    'formData.startDate': { $gte: startDate, $lte: endDate },
                    'formData.endDate': { $exists: false }
                },
                {
                    'formData.startDate': { $gte: startDate, $lte: endDate },
                    'formData.endDate': { $eq: '$formData.startDate' }
                }
            ]
        })
        
        // Calculate attendance summary for each date
        const attendanceSummary: Record<string, {
            totalRequired: number
            totalAttended: number
            attendanceRate: number
            hasData: boolean
        }> = {}
        
        // Initialize all dates in range
        const start = new Date(startDate)
        const end = new Date(endDate)
        
        for (let date = new Date(start); date <= end; date.setDate(date.getDate() + 1)) {
            const dateStr = date.toISOString().split('T')[0] // YYYY-MM-DD format
            attendanceSummary[dateStr] = {
                totalRequired: 0,
                totalAttended: 0,
                attendanceRate: 0,
                hasData: false
            }
        }
        
        // Process each reservation
        reservations.forEach((reservation: any) => {
            const formData = reservation.formData
            const resStartDate = new Date(formData.startDate)
            const resEndDate = formData.endDate ? new Date(formData.endDate) : resStartDate
            
            // Check each date this employee should work
            for (let date = new Date(Math.max(resStartDate.getTime(), start.getTime()));
                 date.getTime() <= Math.min(resEndDate.getTime(), end.getTime());
                 date.setDate(date.getDate() + 1)) {
                
                const dateStr = date.toISOString().split('T')[0]
                
                if (attendanceSummary[dateStr]) {
                    attendanceSummary[dateStr].totalRequired++
                    
                    // Check if attendance was recorded for this date
                    if (formData.attendance && formData.attendance[dateStr] === true) {
                        attendanceSummary[dateStr].totalAttended++
                        attendanceSummary[dateStr].hasData = true
                    }
                }
            }
        })
        
        // Calculate attendance rates
        Object.keys(attendanceSummary).forEach(dateStr => {
            const summary = attendanceSummary[dateStr]
            if (summary.totalRequired > 0) {
                summary.attendanceRate = Math.round((summary.totalAttended / summary.totalRequired) * 100)
            }
        })
        
        res.status(200).json({
            data: attendanceSummary
        })
        
    } catch (error) {
        logger.error('Error getting attendance summary:', error)
        res.status(500).json({ message: 'Error getting attendance summary', error })
    }
}))

export { router as AttendanceRouter }