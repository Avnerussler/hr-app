import Quota from '../../models/Quota'
import { Request, Response, Router } from 'express'
import logger from '../../config/logger'
import { asyncHandler, validate } from '../../middleware'
import Joi from 'joi'

const router = Router()

// Validation schemas
const bulkDeleteSchema = {
    body: Joi.object({
        ids: Joi.array().items(Joi.string()).min(1).required()
            .messages({
                'array.min': 'At least one ID is required',
                'any.required': 'IDs array is required'
            })
    })
}

const dateRangeDeleteSchema = {
    body: Joi.object({
        startDate: Joi.string().pattern(/^\d{4}-\d{2}-\d{2}$/).required()
            .messages({
                'string.pattern.base': 'Start date must be in YYYY-MM-DD format',
                'any.required': 'Start date is required'
            }),
        endDate: Joi.string().pattern(/^\d{4}-\d{2}-\d{2}$/).optional()
            .messages({
                'string.pattern.base': 'End date must be in YYYY-MM-DD format'
            })
    })
}

// Delete single quota by ID
router.delete('/:id', 
    asyncHandler(async (req: Request, res: Response) => {
        try {
            const { id } = req.params

            const quota = await Quota.findByIdAndDelete(id)

            if (!quota) {
                return res.status(404).json({ message: 'Quota not found' })
            }

            logger.info(`Quota ${id} deleted successfully`)
            res.status(200).json({ 
                message: 'Quota deleted successfully',
                data: quota
            })
        } catch (error: any) {
            logger.error('Error deleting quota:', error)
            
            if (error.name === 'CastError') {
                return res.status(400).json({ 
                    message: 'Invalid quota ID format' 
                })
            }
            
            res.status(500).json({ 
                message: 'Error deleting quota', 
                error: error.message 
            })
        }
    })
)

// Delete quota by date
router.delete('/date/:date', 
    asyncHandler(async (req: Request, res: Response) => {
        try {
            const { date } = req.params

            const quota = await Quota.findOneAndDelete({ date })

            if (!quota) {
                return res.status(404).json({ message: 'Quota not found for this date' })
            }

            logger.info(`Quota for date ${date} deleted successfully`)
            res.status(200).json({ 
                message: 'Quota deleted successfully',
                data: quota
            })
        } catch (error: any) {
            logger.error('Error deleting quota by date:', error)
            res.status(500).json({ 
                message: 'Error deleting quota', 
                error: error.message 
            })
        }
    })
)

// Bulk delete quotas by IDs
router.delete('/bulk', 
    validate(bulkDeleteSchema),
    asyncHandler(async (req: Request, res: Response) => {
        try {
            const { ids } = req.body

            const result = await Quota.deleteMany({ _id: { $in: ids } })

            logger.info(`${result.deletedCount} quotas deleted via bulk operation`)
            res.status(200).json({ 
                message: `${result.deletedCount} quotas deleted successfully`,
                deletedCount: result.deletedCount
            })
        } catch (error: any) {
            logger.error('Error bulk deleting quotas:', error)
            res.status(500).json({ 
                message: 'Error bulk deleting quotas', 
                error: error.message 
            })
        }
    })
)

// Delete quotas for date range
router.delete('/range', 
    validate(dateRangeDeleteSchema),
    asyncHandler(async (req: Request, res: Response) => {
        try {
            const { startDate, endDate } = req.body

            // Validate date range
            if (endDate && new Date(endDate) < new Date(startDate)) {
                return res.status(400).json({ 
                    message: 'End date must be after or equal to start date' 
                })
            }

            const query: any = { date: { $gte: startDate } }
            if (endDate) {
                query.date.$lte = endDate
            } else {
                // If no end date, delete only the start date
                query.date = startDate
            }

            const result = await Quota.deleteMany(query)

            const dateRange = endDate ? `${startDate} to ${endDate}` : startDate
            logger.info(`${result.deletedCount} quotas deleted for date range ${dateRange}`)
            res.status(200).json({ 
                message: `${result.deletedCount} quotas deleted successfully`,
                deletedCount: result.deletedCount,
                dateRange
            })
        } catch (error: any) {
            logger.error('Error deleting quota range:', error)
            res.status(500).json({ 
                message: 'Error deleting quota range', 
                error: error.message 
            })
        }
    })
)

// Delete all quotas (admin only - dangerous operation)
router.delete('/all/confirm', 
    asyncHandler(async (req: Request, res: Response) => {
        try {
            // Add additional security check here if needed
            const confirmToken = req.headers['x-confirm-token']
            if (confirmToken !== 'DELETE_ALL_QUOTAS_CONFIRMED') {
                return res.status(403).json({ 
                    message: 'Confirmation token required for this dangerous operation' 
                })
            }

            const result = await Quota.deleteMany({})

            logger.warn(`ALL ${result.deletedCount} quotas deleted - DANGEROUS OPERATION`)
            res.status(200).json({ 
                message: `ALL ${result.deletedCount} quotas deleted successfully`,
                deletedCount: result.deletedCount,
                warning: 'This operation cannot be undone'
            })
        } catch (error: any) {
            logger.error('Error deleting all quotas:', error)
            res.status(500).json({ 
                message: 'Error deleting all quotas', 
                error: error.message 
            })
        }
    })
)

export { router as DeleteQuotaRouter }