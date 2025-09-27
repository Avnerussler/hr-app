import Quota from '../../models/Quota'
import { Request, Response, Router } from 'express'
import logger from '../../config/logger'
import { asyncHandler, validate } from '../../middleware'
import Joi from 'joi'

const router = Router()

// Validation schemas
const createQuotaSchema = {
    body: Joi.object({
        date: Joi.string().pattern(/^\d{4}-\d{2}-\d{2}$/).required()
            .messages({
                'string.pattern.base': 'Date must be in YYYY-MM-DD format',
                'any.required': 'Date is required'
            }),
        quota: Joi.number().min(0).max(10000).required()
            .messages({
                'number.min': 'Quota must be a positive number',
                'number.max': 'Quota cannot exceed 10,000',
                'any.required': 'Quota is required'
            }),
        notes: Joi.string().max(500).optional()
            .messages({
                'string.max': 'Notes cannot exceed 500 characters'
            }),
        createdBy: Joi.string().max(100).required()
            .messages({
                'string.max': 'Created by field cannot exceed 100 characters',
                'any.required': 'Created by is required'
            })
    })
}

const createQuotaRangeSchema = {
    body: Joi.object({
        startDate: Joi.string().pattern(/^\d{4}-\d{2}-\d{2}$/).required()
            .messages({
                'string.pattern.base': 'Start date must be in YYYY-MM-DD format',
                'any.required': 'Start date is required'
            }),
        endDate: Joi.string().pattern(/^\d{4}-\d{2}-\d{2}$/).optional()
            .messages({
                'string.pattern.base': 'End date must be in YYYY-MM-DD format'
            }),
        quota: Joi.number().min(0).max(10000).required()
            .messages({
                'number.min': 'Quota must be a positive number',
                'number.max': 'Quota cannot exceed 10,000',
                'any.required': 'Quota is required'
            }),
        notes: Joi.string().max(500).optional()
            .messages({
                'string.max': 'Notes cannot exceed 500 characters'
            }),
        createdBy: Joi.string().max(100).required()
            .messages({
                'string.max': 'Created by field cannot exceed 100 characters',
                'any.required': 'Created by is required'
            })
    })
}

// Create single quota
router.post('/', 
    validate(createQuotaSchema),
    asyncHandler(async (req: Request, res: Response) => {
        try {
            const { date, quota, notes, createdBy } = req.body

            // Check if quota already exists for this date
            const existingQuota = await Quota.findOne({ date })
            if (existingQuota) {
                return res.status(409).json({ 
                    message: 'Quota already exists for this date. Use PUT to update.' 
                })
            }

            const newQuota = await Quota.create({
                date,
                quota,
                notes,
                createdBy
            })

            logger.info(`Quota created for date ${date} by ${createdBy}`)
            res.status(201).json({ 
                message: 'Quota created successfully', 
                data: newQuota 
            })
        } catch (error: any) {
            logger.error('Error creating quota:', error)
            
            if (error.name === 'ValidationError') {
                return res.status(400).json({ 
                    message: 'Validation error', 
                    error: error.message 
                })
            }
            
            if (error.code === 11000) {
                return res.status(409).json({ 
                    message: 'Quota already exists for this date' 
                })
            }
            
            res.status(500).json({ 
                message: 'Error creating quota', 
                error: error.message 
            })
        }
    })
)

// Create quotas for a date range
router.post('/range', 
    validate(createQuotaRangeSchema),
    asyncHandler(async (req: Request, res: Response) => {
        try {
            const { startDate, endDate, quota, notes, createdBy } = req.body

            // Validate date range
            if (endDate && new Date(endDate) < new Date(startDate)) {
                return res.status(400).json({ 
                    message: 'End date must be after or equal to start date' 
                })
            }

            const quotas = await Quota.createQuotaRange({
                startDate,
                endDate,
                quota,
                notes,
                createdBy
            })

            logger.info(`${quotas.length} quotas created for date range ${startDate} to ${endDate || startDate} by ${createdBy}`)
            res.status(201).json({ 
                message: `${quotas.length} quotas created successfully`, 
                data: quotas,
                count: quotas.length
            })
        } catch (error: any) {
            logger.error('Error creating quota range:', error)
            
            if (error.name === 'ValidationError') {
                return res.status(400).json({ 
                    message: 'Validation error', 
                    error: error.message 
                })
            }
            
            res.status(500).json({ 
                message: 'Error creating quota range', 
                error: error.message 
            })
        }
    })
)

// Bulk create quotas
router.post('/bulk', 
    validate({
        body: Joi.object({
            quotas: Joi.array().items(
                Joi.object({
                    date: Joi.string().pattern(/^\d{4}-\d{2}-\d{2}$/).required(),
                    quota: Joi.number().min(0).max(10000).required(),
                    notes: Joi.string().max(500).optional(),
                    createdBy: Joi.string().max(100).required()
                })
            ).min(1).required()
                .messages({
                    'array.min': 'At least one quota is required',
                    'any.required': 'Quotas array is required'
                })
        })
    }),
    asyncHandler(async (req: Request, res: Response) => {
        try {
            const { quotas } = req.body

            // Create all quotas
            const createdQuotas = await Quota.insertMany(quotas, { ordered: false })

            logger.info(`${createdQuotas.length} quotas bulk created`)
            res.status(201).json({ 
                message: `${createdQuotas.length} quotas created successfully`, 
                data: createdQuotas,
                count: createdQuotas.length
            })
        } catch (error: any) {
            logger.error('Error bulk creating quotas:', error)
            
            if (error.name === 'ValidationError') {
                return res.status(400).json({ 
                    message: 'Validation error', 
                    error: error.message 
                })
            }
            
            // Handle partial success in bulk operations
            if (error.name === 'BulkWriteError' && error.result?.insertedCount > 0) {
                return res.status(207).json({ 
                    message: `${error.result.insertedCount} quotas created successfully, ${error.writeErrors?.length || 0} failed`, 
                    data: error.result.insertedDocs || [],
                    errors: error.writeErrors,
                    count: error.result.insertedCount
                })
            }
            
            res.status(500).json({ 
                message: 'Error bulk creating quotas', 
                error: error.message 
            })
        }
    })
)

export { router as CreateQuotaRouter }