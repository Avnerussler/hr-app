import { Request, Response, NextFunction } from 'express'
import Joi from 'joi'
import logger from '../config/logger'
import mongoose from 'mongoose'

// Custom Joi extensions for MongoDB ObjectId
const joiObjectId = Joi.extend((joi: any) => ({
    type: 'objectId',
    base: joi.string(),
    validate: (value: string, helpers: any) => {
        if (!mongoose.Types.ObjectId.isValid(value)) {
            return { value, errors: helpers.error('objectId.invalid') }
        }
        return { value }
    },
    messages: {
        'objectId.invalid': 'Must be a valid ObjectId'
    }
}))

// Custom validation for work hours
const hoursValidation = Joi.number()
    .min(0)
    .max(24)
    .precision(2)
    .messages({
        'number.min': 'Hours must be at least 0',
        'number.max': 'Hours cannot exceed 24',
        'number.precision': 'Hours should not have more than 2 decimal places'
    })

// Predefined Joi schemas
export const schemas = {
    // Work Hours validation
    workHours: {
        body: Joi.object({
            employeeId: joiObjectId.objectId().required()
                .messages({
                    'any.required': 'Employee ID is required'
                }),
            employeeName: Joi.string().min(1).max(100).required()
                .messages({
                    'string.empty': 'Employee name is required',
                    'string.min': 'Employee name cannot be empty',
                    'string.max': 'Employee name cannot exceed 100 characters'
                }),
            date: Joi.date().iso().required()
                .messages({
                    'date.format': 'Date must be in ISO format',
                    'any.required': 'Date is required'
                }),
            hours: hoursValidation.required()
                .messages({
                    'any.required': 'Hours is required'
                }),
            projectId: joiObjectId.objectId().optional(),
            projectName: Joi.string().max(100).optional(),
            notes: Joi.string().max(1000).optional()
                .messages({
                    'string.max': 'Notes cannot exceed 1000 characters'
                }),
            submittedBy: joiObjectId.objectId().required()
                .messages({
                    'any.required': 'Submitted by is required'
                })
        })
    },

    // Form Submission validation
    formSubmission: {
        body: Joi.object({
            formId: joiObjectId.objectId().required()
                .messages({
                    'any.required': 'Form ID is required'
                }),
            formData: Joi.object().required()
                .messages({
                    'any.required': 'Form data is required',
                    'object.base': 'Form data must be an object'
                }),
            formName: Joi.string().optional()
        })
    },

    // Bulk work hours validation
    bulkWorkHours: {
        body: Joi.object({
            entries: Joi.array().items(
                Joi.object({
                    employeeId: joiObjectId.objectId().required(),
                    employeeName: Joi.string().min(1).max(100).required(),
                    date: Joi.date().iso().required(),
                    hours: hoursValidation.required(),
                    projectId: joiObjectId.objectId().optional(),
                    projectName: Joi.string().max(100).optional(),
                    notes: Joi.string().max(1000).optional()
                })
            ).min(1).required()
                .messages({
                    'array.min': 'At least one entry is required',
                    'any.required': 'Entries array is required'
                }),
            submittedBy: joiObjectId.objectId().required()
                .messages({
                    'any.required': 'Submitted by is required'
                })
        })
    },

    // ObjectId parameter validation
    objectIdParam: {
        params: Joi.object({
            id: joiObjectId.objectId().required()
                .messages({
                    'any.required': 'ID parameter is required'
                })
        })
    },

    // Query parameters for pagination and filtering
    queryPagination: {
        query: Joi.object({
            page: Joi.number().integer().min(1).default(1),
            limit: Joi.number().integer().min(1).max(100).default(10),
            sortBy: Joi.string().optional(),
            sortOrder: Joi.string().valid('asc', 'desc').default('asc'),
            search: Joi.string().optional(),
            startDate: Joi.date().iso().optional(),
            endDate: Joi.date().iso().optional()
        }).with('startDate', 'endDate')
            .messages({
                'object.with': 'End date is required when start date is provided'
            })
    }
}

// Generic validation middleware factory
export const validate = (schema: {
    body?: Joi.ObjectSchema,
    params?: Joi.ObjectSchema,
    query?: Joi.ObjectSchema
}) => {
    return (req: Request, res: Response, next: NextFunction): void => {
        const validationErrors: string[] = []

        // Validate body
        if (schema.body) {
            const { error } = schema.body.validate(req.body, { 
                abortEarly: false,
                stripUnknown: true 
            })
            if (error) {
                validationErrors.push(...error.details.map(detail => detail.message))
            }
        }

        // Validate params
        if (schema.params) {
            const { error } = schema.params.validate(req.params, { 
                abortEarly: false 
            })
            if (error) {
                validationErrors.push(...error.details.map(detail => detail.message))
            }
        }

        // Validate query
        if (schema.query) {
            const { error, value } = schema.query.validate(req.query, { 
                abortEarly: false,
                stripUnknown: true
            })
            if (error) {
                validationErrors.push(...error.details.map(detail => detail.message))
            } else {
                // Set validated and transformed query values
                req.query = value
            }
        }

        if (validationErrors.length > 0) {
            logger.warn('Joi Validation failed:', {
                url: req.url,
                method: req.method,
                errors: validationErrors,
                body: req.body,
                params: req.params,
                query: req.query
            })

            res.status(400).json({
                status: 'error',
                message: 'Validation failed',
                errors: validationErrors,
                code: 'VALIDATION_ERROR'
            })
            return
        }

        next()
    }
}

// Convenience validation functions
export const validateBody = (schema: Joi.ObjectSchema) => validate({ body: schema })
export const validateParams = (schema: Joi.ObjectSchema) => validate({ params: schema })
export const validateQuery = (schema: Joi.ObjectSchema) => validate({ query: schema })

// Export commonly used schemas for easy access
export const commonSchemas = {
    workHours: schemas.workHours,
    formSubmission: schemas.formSubmission,
    bulkWorkHours: schemas.bulkWorkHours,
    objectIdParam: schemas.objectIdParam,
    queryPagination: schemas.queryPagination
}