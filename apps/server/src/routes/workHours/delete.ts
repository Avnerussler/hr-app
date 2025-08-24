import { WorkHours } from '../../models'
import { Request, Response, Router } from 'express'
import logger from '../../config/logger'
import mongoose from 'mongoose'
import { parseISO, isValid, startOfDay, endOfDay } from 'date-fns'

const router = Router()

// Delete single work hour entry
router.delete('/:id', async (req: Request, res: Response) => {
    logger.info(`DELETE /workHours/${req.params.id} - Request received`)
    try {
        const workHour = await WorkHours.findByIdAndDelete(req.params.id)

        if (!workHour) {
            res.status(404).json({ message: 'Work hour entry not found' })
            return
        }

        res.status(200).json({
            message: 'Work hour entry deleted successfully',
            deletedEntry: {
                id: workHour._id,
                employeeName: workHour.employeeName,
                date: workHour.date,
                hours: workHour.hours,
            },
        })
    } catch (error) {
        logger.error('Error deleting work hour entry:', error)
        res.status(500).json({
            message: 'Error deleting work hour entry',
            error,
        })
    }
})

// Bulk delete work hour entries
router.delete('/bulk', async (req: Request, res: Response) => {
    logger.info('DELETE /workHours/bulk - Request received')
    try {
        const { workHourIds } = req.body

        if (!Array.isArray(workHourIds) || workHourIds.length === 0) {
            res.status(400).json({
                message: 'workHourIds array is required and must not be empty',
            })
        }

        const result = await WorkHours.deleteMany({
            _id: {
                $in: workHourIds.map((id: string) =>
                    mongoose.Types.ObjectId.createFromHexString(id)
                ),
            },
        })

        res.status(200).json({
            message: 'Work hour entries deleted successfully',
            result: {
                deleted: result.deletedCount,
            },
        })
    } catch (error) {
        logger.error('Error deleting bulk work hour entries:', error)
        res.status(500).json({
            message: 'Error deleting bulk work hour entries',
            error,
        })
    }
})

// Delete work hour entry by employee and date
router.delete(
    '/employee/:employeeId/date/:date',
    async (req: Request, res: Response) => {
        logger.info(
            `DELETE /workHours/employee/${req.params.employeeId}/date/${req.params.date} - Request received`
        )
        try {
            const { employeeId, date } = req.params

            // Validate and parse date
            const parsedDate = parseISO(date)
            if (!isValid(parsedDate)) {
                res.status(400).json({
                    message: 'Invalid date format. Use ISO format (YYYY-MM-DD)',
                })
            }

            const workHour = await WorkHours.findOneAndDelete({
                employeeId:
                    mongoose.Types.ObjectId.createFromHexString(employeeId),
                date: startOfDay(parsedDate),
            })

            if (!workHour) {
                res.status(404).json({
                    message:
                        'Work hour entry not found for this employee and date',
                })
                return
            }

            res.status(200).json({
                message: 'Work hour entry deleted successfully',
                deletedEntry: {
                    id: workHour._id,
                    employeeName: workHour.employeeName,
                    date: workHour.date,
                    hours: workHour.hours,
                },
            })
        } catch (error) {
            logger.error(
                'Error deleting work hour entry by employee and date:',
                error
            )
            res.status(500).json({
                message: 'Error deleting work hour entry',
                error,
            })
        }
    }
)

// Delete all work hours for a date range (admin function)
router.delete(
    '/range/:startDate/:endDate',
    async (req: Request, res: Response) => {
        logger.info(
            `DELETE /workHours/range/${req.params.startDate}/${req.params.endDate} - Request received`
        )
        try {
            const startDate = parseISO(req.params.startDate)
            const endDate = parseISO(req.params.endDate)
            const { confirmDelete } = req.query

            if (!isValid(startDate) || !isValid(endDate)) {
                res.status(400).json({
                    message: 'Invalid date format. Use ISO format (YYYY-MM-DD)',
                })
            }

            // Safety check - require confirmation for bulk deletions
            if (confirmDelete !== 'true') {
                const count = await WorkHours.countDocuments({
                    date: {
                        $gte: startOfDay(startDate),
                        $lte: endOfDay(endDate),
                    },
                })

                res.status(400).json({
                    message: 'Confirmation required for bulk deletion',
                    entriesCount: count,
                    confirmationRequired:
                        'Add ?confirmDelete=true to confirm deletion',
                })
            }

            const result = await WorkHours.deleteMany({
                date: {
                    $gte: startOfDay(startDate),
                    $lte: endOfDay(endDate),
                },
            })

            res.status(200).json({
                message: 'Work hour entries deleted successfully',
                result: {
                    deleted: result.deletedCount,
                    dateRange: {
                        start: startDate,
                        end: endDate,
                    },
                },
            })
        } catch (error) {
            logger.error('Error deleting work hours by date range:', error)
            res.status(500).json({
                message: 'Error deleting work hours by date range',
                error,
            })
        }
    }
)

// Delete all draft entries for an employee (cleanup function)
router.delete(
    '/employee/:employeeId/drafts',
    async (req: Request, res: Response) => {
        logger.info(
            `DELETE /workHours/employee/${req.params.employeeId}/drafts - Request received`
        )
        try {
            const { employeeId } = req.params

            const result = await WorkHours.deleteMany({
                employeeId:
                    mongoose.Types.ObjectId.createFromHexString(employeeId),
                status: 'draft',
            })

            res.status(200).json({
                message: 'Draft work hour entries deleted successfully',
                result: {
                    deleted: result.deletedCount,
                },
            })
        } catch (error) {
            logger.error('Error deleting draft work hours for employee:', error)
            res.status(500).json({
                message: 'Error deleting draft work hours',
                error,
            })
        }
    }
)

export { router as DeleteWorkHoursRouter }
