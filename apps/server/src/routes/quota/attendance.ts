import { Request, Response, Router } from 'express'
import logger from '../../config/logger'
import { asyncHandler } from '../../middleware'
import { FormSubmissions } from '../../models/FormSubmissions'
import Quota from '../../models/Quota'

const router = Router()

// Update individual employee attendance immediately
router.put(
    '/attendance/individual',
    asyncHandler(async (req: Request, res: Response) => {
        try {
            const { employeeId, date, hasAttended } = req.body

            if (!employeeId || !date || typeof hasAttended !== 'boolean') {
                return res
                    .status(400)
                    .json({ message: 'Invalid attendance data' })
            }

            // Find any form submission where this employee has attendance data within date range
            const reservation = await FormSubmissions.findOne({
                'formData.employeeName._id': employeeId,
                $or: [
                    {
                        'formData.startDate': { $lte: date },
                        'formData.endDate': { $gte: date },
                    },
                    {
                        'formData.startDate': date,
                        'formData.endDate': { $exists: false },
                    },
                    {
                        'formData.startDate': date,
                        'formData.endDate': '',
                    },
                ],
            })

            if (!reservation) {
                return res
                    .status(404)
                    .json({ message: 'Employee reservation not found' })
            }

            // Update attendance record in the formData
            if (!reservation.formData.attendance) {
                reservation.formData.attendance = {}
            }

            reservation.formData.attendance[date] = hasAttended
            reservation.markModified('formData')

            await reservation.save()

            res.status(200).json({
                message: 'Individual attendance updated successfully',
                data: {
                    employeeId,
                    date,
                    hasAttended,
                    status: 'updated',
                },
            })
        } catch (error) {
            logger.error('Error updating individual attendance:', error)
            res.status(500).json({
                message: 'Error updating individual attendance',
                error,
            })
        }
    })
)

// Submit manager report (one-time action per day)
router.post(
    '/attendance/manager-report/:date',
    asyncHandler(async (req: Request, res: Response) => {
        try {
            const { date } = req.params
            const managerReportedBy = req.body.reportedBy || 'System' // Could be from user session

            // Check if manager already reported for this date in Quota collection
            const existingQuota = await Quota.findOne({ date })

            if (existingQuota?.managerReported) {
                return res.status(409).json({
                    message: 'Manager has already reported for this date',
                    alreadyReported: true,
                    reportedAt: existingQuota.managerReportedAt,
                    reportedBy: existingQuota.managerReportedBy,
                })
            }

            // Create or update quota record with manager report
            const quotaUpdate = {
                managerReported: true,
                managerReportedAt: new Date(),
                managerReportedBy,
                updatedAt: new Date(),
            }

            let quota
            if (existingQuota) {
                // Update existing quota record
                Object.assign(existingQuota, quotaUpdate)
                quota = await existingQuota.save()
            } else {
                // Create new quota record with default quota of 0
                quota = await Quota.create({
                    date,
                    quota: 0,
                    createdBy: managerReportedBy,
                    ...quotaUpdate,
                })
            }

            res.status(200).json({
                message: 'Manager report submitted successfully',
                data: {
                    date,
                    managerReported: true,
                    managerReportedAt: quota.managerReportedAt,
                    managerReportedBy: quota.managerReportedBy,
                    quotaId: quota._id,
                },
            })
        } catch (error) {
            logger.error('Error submitting manager report:', error)
            res.status(500).json({
                message: 'Error submitting manager report',
                error,
            })
        }
    })
)

// Check if manager has reported for a specific date
router.get(
    '/attendance/manager-report/status/:date',
    asyncHandler(async (req: Request, res: Response) => {
        try {
            const { date } = req.params

            const quota = await Quota.findOne({ date })

            res.status(200).json({
                hasReported: quota?.managerReported ?? false,
                reportData: quota?.managerReported
                    ? {
                          reportedAt: quota.managerReportedAt,
                          reportedBy: quota.managerReportedBy,
                          quotaId: quota._id,
                      }
                    : null,
            })
        } catch (error) {
            logger.error('Error checking manager report status:', error)
            res.status(500).json({
                message: 'Error checking manager report status',
                error,
            })
        }
    })
)

// Save attendance data for a specific date
router.post(
    '/attendance/:date',
    asyncHandler(async (req: Request, res: Response) => {
        try {
            const { date } = req.params
            const { attendanceChanges } = req.body // { employeeId: boolean, ... }

            if (!attendanceChanges || typeof attendanceChanges !== 'object') {
                return res
                    .status(400)
                    .json({ message: 'Invalid attendance data' })
            }

            // Create or update attendance records for each employee
            const results = []

            for (const [employeeId, hasAttended] of Object.entries(
                attendanceChanges
            )) {
                try {
                    // Find any form submission where this employee has attendance data
                    const reservation = await FormSubmissions.findOne({
                        'formData.employeeName._id': employeeId,
                        'formData.attendance': { $exists: true },
                    })

                    if (!reservation) {
                        logger.warn(
                            `Reservation not found for employee ID: ${employeeId}`
                        )
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
                        status: 'updated',
                    })
                } catch (err) {
                    const error =
                        err instanceof Error ? err : new Error(String(err))
                    logger.error(
                        `Error updating attendance for employee ${employeeId}:`,
                        error
                    )
                    results.push({
                        employeeId,
                        date,
                        status: 'error',
                        error: error.message,
                    })
                }
            }

            res.status(200).json({
                message: 'Attendance data saved successfully',
                data: {
                    date,
                    results,
                    totalProcessed: results.length,
                    successful: results.filter((r) => r.status === 'updated')
                        .length,
                    failed: results.filter((r) => r.status === 'error').length,
                },
            })
        } catch (error) {
            logger.error('Error saving attendance data:', error)
            res.status(500).json({
                message: 'Error saving attendance data',
                error,
            })
        }
    })
)

// Get attendance summary for a date range (for calendar indicators)
router.get(
    '/attendance/range/:startDate/:endDate',
    asyncHandler(async (req: Request, res: Response) => {
        try {
            const { startDate, endDate } = req.params

            // Find all reservations that overlap with the date range
            const reservations = await FormSubmissions.find({
                formName: 'Reserve%20Days%20Management',
                $or: [
                    // Case 1: Reservation spans across the requested range
                    {
                        'formData.startDate': { $lte: endDate },
                        'formData.endDate': { $gte: startDate },
                    },
                    // Case 2: Reservation starts within the range (no end date)
                    {
                        'formData.startDate': {
                            $gte: startDate,
                            $lte: endDate,
                        },
                        'formData.endDate': { $exists: false },
                    },
                    // Case 3: Single day reservation within range
                    {
                        'formData.startDate': {
                            $gte: startDate,
                            $lte: endDate,
                        },
                        'formData.endDate': '',
                    },
                ],
            })

            // Calculate attendance summary for each date
            const attendanceSummary: Record<
                string,
                {
                    totalRequired: number
                    totalAttended: number
                    attendanceRate: number
                    managerReported: boolean
                }
            > = {}

            // Initialize all dates in range
            const start = new Date(startDate)
            const end = new Date(endDate)

            for (
                let date = new Date(start);
                date <= end;
                date.setDate(date.getDate() + 1)
            ) {
                const dateStr = date.toISOString().split('T')[0] // YYYY-MM-DD format
                attendanceSummary[dateStr] = {
                    totalRequired: 0,
                    totalAttended: 0,
                    attendanceRate: 0,
                    managerReported: false,
                }
            }

            // Process each reservation
            reservations.forEach((reservation: any) => {
                const formData = reservation.formData
                const resStartDate = new Date(formData.startDate)
                const resEndDate = formData.endDate
                    ? new Date(formData.endDate)
                    : resStartDate

                // Check each date this employee should work
                for (
                    let date = new Date(
                        Math.max(resStartDate.getTime(), start.getTime())
                    );
                    date.getTime() <=
                    Math.min(resEndDate.getTime(), end.getTime());
                    date.setDate(date.getDate() + 1)
                ) {
                    const dateStr = date.toISOString().split('T')[0]

                    if (attendanceSummary[dateStr]) {
                        attendanceSummary[dateStr].totalRequired++
                    }
                }
            })

            // Check for manager reports from Quota collection and update hasData flag
            const managerReports = await Quota.find({
                date: {
                    $gte: startDate,
                    $lte: endDate,
                },
                managerReported: true,
            })

            // Update hasData for dates with manager reports
            managerReports.forEach((quota) => {
                const reportDate = quota.date
                if (attendanceSummary[reportDate]) {
                    attendanceSummary[reportDate].managerReported = true
                }
            })

            // Calculate attendance rates
            Object.keys(attendanceSummary).forEach((dateStr) => {
                const summary = attendanceSummary[dateStr]
                if (summary.totalRequired > 0) {
                    summary.attendanceRate = Math.round(
                        (summary.totalAttended / summary.totalRequired) * 100
                    )
                }
            })

            res.status(200).json({
                data: attendanceSummary,
            })
        } catch (error) {
            logger.error('Error getting attendance summary:', error)
            res.status(500).json({
                message: 'Error getting attendance summary',
                error,
            })
        }
    })
)

// Get attendance history for a specific employee
router.get(
    '/employees/:employeeId/attendance-history',
    asyncHandler(async (req: Request, res: Response) => {
        try {
            const { employeeId } = req.params
            const limit = parseInt(req.query.limit as string) || 30

            // Find all reservation records for this employee by matching employeeName._id
            // (regardless of form name - more flexible)
            const employeeReservations = await FormSubmissions.find({
                'formData.employeeName._id': employeeId,
                'formData.attendance': { $exists: true },
            }).lean()

            if (!employeeReservations || employeeReservations.length === 0) {
                return res.status(200).json({
                    employeeId,
                    employeeName: 'לא ידוע',
                    totalDays: 0,
                    attendedDays: 0,
                    attendanceRate: 0,
                    records: [],
                    totalReservations: 0,
                    message: 'No attendance data found for this employee',
                })
            }

            // Get employee basic info from the first reservation
            const firstReservation = employeeReservations[0]
            const employeeName =
                firstReservation.formData.employeeName?.display || 'לא ידוע'

            // Collect all attendance data from all reservations
            const allAttendanceData: Record<string, boolean> = {}

            employeeReservations.forEach((reservation: any) => {
                const attendanceData = reservation.formData.attendance || {}
                Object.entries(attendanceData).forEach(
                    ([date, hasAttended]) => {
                        allAttendanceData[date] = Boolean(hasAttended)
                    }
                )
            })

            // Convert attendance data to records and sort by date (newest first)
            const attendanceRecords = Object.entries(allAttendanceData)
                .map(([date, hasAttended]) => ({
                    date,
                    hasAttended: Boolean(hasAttended),
                    isReported: true, // If it exists in attendance data, it was reported
                }))
                .sort(
                    (a, b) =>
                        new Date(b.date).getTime() - new Date(a.date).getTime()
                )
                .slice(0, limit)

            // Calculate statistics
            const totalDays = attendanceRecords.length
            const attendedDays = attendanceRecords.filter(
                (record) => record.hasAttended
            ).length
            const attendanceRate =
                totalDays > 0 ? Math.round((attendedDays / totalDays) * 100) : 0

            res.status(200).json({
                employeeId,
                employeeName,
                totalDays,
                attendedDays,
                attendanceRate,
                records: attendanceRecords,
                totalReservations: employeeReservations.length,
            })
        } catch (error) {
            logger.error('Error fetching employee attendance history:', error)
            res.status(500).json({
                message: 'Error fetching attendance history',
                error,
            })
        }
    })
)

export { router as AttendanceRouter }
