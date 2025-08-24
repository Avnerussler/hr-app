import { Request, Response, NextFunction } from 'express'
import logger from '../config/logger'
import mongoose from 'mongoose'

export interface ApiError extends Error {
    statusCode: number
    code?: string
    isOperational?: boolean
}

export class AppError extends Error implements ApiError {
    public statusCode: number
    public code: string
    public isOperational: boolean

    constructor(message: string, statusCode: number = 500, code: string = 'INTERNAL_ERROR') {
        super(message)
        this.statusCode = statusCode
        this.code = code
        this.isOperational = true
        this.name = 'AppError'

        Error.captureStackTrace(this, this.constructor)
    }
}

// Custom error classes for different scenarios
export class ValidationError extends AppError {
    constructor(message: string, details?: any) {
        super(message, 400, 'VALIDATION_ERROR')
        this.name = 'ValidationError'
    }
}

export class NotFoundError extends AppError {
    constructor(resource: string = 'Resource') {
        super(`${resource} not found`, 404, 'NOT_FOUND')
        this.name = 'NotFoundError'
    }
}

export class ConflictError extends AppError {
    constructor(message: string) {
        super(message, 409, 'CONFLICT')
        this.name = 'ConflictError'
    }
}

export class UnauthorizedError extends AppError {
    constructor(message: string = 'Unauthorized') {
        super(message, 401, 'UNAUTHORIZED')
        this.name = 'UnauthorizedError'
    }
}

export class ForbiddenError extends AppError {
    constructor(message: string = 'Forbidden') {
        super(message, 403, 'FORBIDDEN')
        this.name = 'ForbiddenError'
    }
}

// Helper function to determine if error is operational
const isOperationalError = (error: any): boolean => {
    if (error instanceof AppError) {
        return error.isOperational
    }
    return false
}

// Convert known errors to AppError instances
const handleCastErrorDB = (err: mongoose.Error.CastError): AppError => {
    const message = `Invalid ${err.path}: ${err.value}`
    return new ValidationError(message)
}

const handleDuplicateFieldsDB = (err: any): AppError => {
    const value = err.errmsg?.match(/(["'])(\\?.)*?\1/)?.[0]
    const message = `Duplicate field value: ${value}. Please use another value!`
    return new ConflictError(message)
}

const handleValidationErrorDB = (err: mongoose.Error.ValidationError): AppError => {
    const errors = Object.values(err.errors).map(el => el.message)
    const message = `Invalid input data: ${errors.join('. ')}`
    return new ValidationError(message)
}

const handleJWTError = (): AppError => {
    return new UnauthorizedError('Invalid token. Please log in again!')
}

const handleJWTExpiredError = (): AppError => {
    return new UnauthorizedError('Your token has expired! Please log in again.')
}

// Send error response in development
const sendErrorDev = (err: ApiError, res: Response) => {
    logger.error('Error Details:', {
        name: err.name,
        message: err.message,
        stack: err.stack,
        statusCode: err.statusCode,
        code: err.code
    })

    res.status(err.statusCode || 500).json({
        status: 'error',
        error: err.name,
        message: err.message,
        code: err.code,
        stack: err.stack
    })
}

// Send error response in production
const sendErrorProd = (err: ApiError, res: Response) => {
    // Operational, trusted error: send message to client
    if (isOperationalError(err)) {
        logger.warn('Operational Error:', {
            name: err.name,
            message: err.message,
            statusCode: err.statusCode,
            code: err.code
        })

        res.status(err.statusCode || 500).json({
            status: 'error',
            message: err.message,
            code: err.code
        })
    } else {
        // Programming or other unknown error: don't leak error details
        logger.error('Programming Error:', {
            name: err.name,
            message: err.message,
            stack: err.stack
        })

        res.status(500).json({
            status: 'error',
            message: 'Something went wrong!',
            code: 'INTERNAL_ERROR'
        })
    }
}

// Global error handling middleware
export const globalErrorHandler = (
    err: any,
    req: Request,
    res: Response,
    next: NextFunction
) => {
    let error = { ...err }
    error.message = err.message
    error.statusCode = err.statusCode || 500

    // Log the original error
    logger.error('Error caught by global handler:', {
        name: err.name,
        message: err.message,
        url: req.url,
        method: req.method,
        ip: req.ip,
        userAgent: req.get('User-Agent')
    })

    // Convert specific errors to AppError instances
    if (err.name === 'CastError') {
        error = handleCastErrorDB(err)
    } else if (err.code === 11000) {
        error = handleDuplicateFieldsDB(err)
    } else if (err.name === 'ValidationError') {
        error = handleValidationErrorDB(err)
    } else if (err.name === 'JsonWebTokenError') {
        error = handleJWTError()
    } else if (err.name === 'TokenExpiredError') {
        error = handleJWTExpiredError()
    }

    if (process.env.NODE_ENV === 'development') {
        sendErrorDev(error, res)
    } else {
        sendErrorProd(error, res)
    }
}

// Catch unhandled async errors
export const asyncHandler = (fn: Function) => {
    return (req: Request, res: Response, next: NextFunction) => {
        Promise.resolve(fn(req, res, next)).catch(next)
    }
}

// Handle unhandled routes
export const handleNotFound = (req: Request, res: Response, next: NextFunction) => {
    const err = new NotFoundError(`Route ${req.originalUrl} not found`)
    next(err)
}

// Handle uncaught exceptions
export const handleUncaughtException = () => {
    process.on('uncaughtException', (err: Error) => {
        logger.error('UNCAUGHT EXCEPTION! 💥 Shutting down...', {
            name: err.name,
            message: err.message,
            stack: err.stack
        })
        process.exit(1)
    })
}

// Handle unhandled promise rejections
export const handleUnhandledRejection = () => {
    process.on('unhandledRejection', (err: any) => {
        logger.error('UNHANDLED REJECTION! 💥 Shutting down...', {
            name: err.name,
            message: err.message,
            stack: err.stack
        })
        process.exit(1)
    })
}