import Quota from '../../models/Quota'
import { Request, Response, Router } from 'express'
import logger from '../../config/logger'
import { asyncHandler, validate } from '../../middleware'
import Joi from 'joi'

const router = Router()

// Validation schema for update
const updateQuotaSchema = {
    body: Joi.object({
        quota: Joi.number().min(0).max(10000).optional()
            .messages({
                'number.min': 'Quota must be a positive number',
                'number.max': 'Quota cannot exceed 10,000'
            }),
        notes: Joi.string().max(500).optional()
            .messages({
                'string.max': 'Notes cannot exceed 500 characters'
            })
    })
}

const bulkUpdateQuotaSchema = {
    body: Joi.object({
        updates: Joi.array().items(
            Joi.object({
                id: Joi.string().required(),
                quota: Joi.number().min(0).max(10000).optional(),
                notes: Joi.string().max(500).optional()
            })
        ).min(1).required()
            .messages({
                'array.min': 'At least one update is required',
                'any.required': 'Updates array is required'
            })
    })
}

// Update single quota by ID
router.put('/:id', 
    validate(updateQuotaSchema),
    asyncHandler(async (req: Request, res: Response) => {
        try {
            const { id } = req.params
            const updateData = req.body

            const quota = await Quota.findByIdAndUpdate(
                id,
                { ...updateData, updatedAt: new Date() },
                { new: true, runValidators: true }
            )

            if (!quota) {
                return res.status(404).json({ message: 'Quota not found' })
            }

            logger.info(`Quota ${id} updated successfully`)
            res.status(200).json({ 
                message: 'Quota updated successfully', 
                data: quota 
            })
        } catch (error: any) {
            logger.error('Error updating quota:', error)
            
            if (error.name === 'ValidationError') {
                return res.status(400).json({ 
                    message: 'Validation error', 
                    error: error.message 
                })
            }
            
            if (error.name === 'CastError') {
                return res.status(400).json({ 
                    message: 'Invalid quota ID format' 
                })
            }
            
            res.status(500).json({ 
                message: 'Error updating quota', 
                error: error.message 
            })
        }
    })
)

// Update quota by date
router.put('/date/:date', 
    validate(updateQuotaSchema),
    asyncHandler(async (req: Request, res: Response) => {
        try {
            const { date } = req.params
            const updateData = req.body

            const quota = await Quota.findOneAndUpdate(
                { date },
                { ...updateData, updatedAt: new Date() },
                { new: true, runValidators: true }
            )

            if (!quota) {
                return res.status(404).json({ message: 'Quota not found for this date' })
            }

            logger.info(`Quota for date ${date} updated successfully`)
            res.status(200).json({ 
                message: 'Quota updated successfully', 
                data: quota 
            })
        } catch (error: any) {
            logger.error('Error updating quota by date:', error)
            
            if (error.name === 'ValidationError') {
                return res.status(400).json({ 
                    message: 'Validation error', 
                    error: error.message 
                })
            }
            
            res.status(500).json({ 
                message: 'Error updating quota', 
                error: error.message 
            })
        }
    })
)

// Bulk update quotas
router.put('/bulk', 
    validate(bulkUpdateQuotaSchema),
    asyncHandler(async (req: Request, res: Response) => {
        try {
            const { updates } = req.body
            const results = []
            let successCount = 0
            let errorCount = 0

            for (const update of updates) {
                try {
                    const { id, ...updateData } = update
                    const quota = await Quota.findByIdAndUpdate(
                        id,
                        { ...updateData, updatedAt: new Date() },
                        { new: true, runValidators: true }
                    )

                    if (quota) {
                        results.push({ id, status: 'success', data: quota })
                        successCount++
                    } else {
                        results.push({ id, status: 'error', error: 'Quota not found' })
                        errorCount++
                    }
                } catch (error: any) {
                    results.push({ id: update.id, status: 'error', error: error.message })
                    errorCount++
                }
            }

            const statusCode = errorCount > 0 ? (successCount > 0 ? 207 : 400) : 200

            logger.info(`Bulk update completed: ${successCount} successful, ${errorCount} failed`)
            res.status(statusCode).json({ 
                message: `Bulk update completed: ${successCount} successful, ${errorCount} failed`,
                results,
                summary: { successCount, errorCount, totalCount: updates.length }
            })
        } catch (error: any) {
            logger.error('Error bulk updating quotas:', error)
            res.status(500).json({ 
                message: 'Error bulk updating quotas', 
                error: error.message 
            })
        }
    })
)

// Update quotas for date range
router.put('/range/:startDate/:endDate', 
    validate(updateQuotaSchema),
    asyncHandler(async (req: Request, res: Response) => {
        try {
            const { startDate, endDate } = req.params
            const updateData = req.body

            const result = await Quota.updateMany(
                { 
                    date: { 
                        $gte: startDate, 
                        $lte: endDate 
                    } 
                },
                { ...updateData, updatedAt: new Date() },
                { runValidators: true }
            )

            logger.info(`${result.modifiedCount} quotas updated for date range ${startDate} to ${endDate}`)
            res.status(200).json({ 
                message: `${result.modifiedCount} quotas updated successfully`,
                modifiedCount: result.modifiedCount,
                matchedCount: result.matchedCount
            })
        } catch (error: any) {
            logger.error('Error updating quota range:', error)
            
            if (error.name === 'ValidationError') {
                return res.status(400).json({ 
                    message: 'Validation error', 
                    error: error.message 
                })
            }
            
            res.status(500).json({ 
                message: 'Error updating quota range', 
                error: error.message 
            })
        }
    })
)

export { router as UpdateQuotaRouter }