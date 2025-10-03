import express, { Request, Response } from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import router from './routes'
import connectDB from './config/db'
import logger from './config/logger'
import {
    createPersonalForm,
    createStudioForm,
    addMetricsToAllForms,
    createReserveDaysForm,
    seedPersonnelData,
    seedProjectManagement,
} from './migrations'
import {
    globalErrorHandler,
    handleNotFound,
    handleUncaughtException,
    handleUnhandledRejection,
    requestLogger,
    securityLogger,
    performanceLogger,
    rateLimitLogger,
} from './middleware'

dotenv.config()

// Handle uncaught exceptions and unhandled rejections
handleUncaughtException()
handleUnhandledRejection()

const app = express()
const PORT = process.env.PORT

// ✅ Enable CORS for the frontend
const allowedOrigins = [process.env.FRONTEND_URL || 'http://localhost:3000']

app.use(
    cors({
        origin: (origin, callback) => {
            callback(null, origin || '*')
        },
        credentials: true,
    })
)

// Security middleware
app.use(securityLogger)

// Request logging middleware
app.use(requestLogger)

// Performance monitoring middleware
app.use(performanceLogger)

// Rate limiting middleware (100 requests per minute per IP)
app.use(rateLimitLogger(60 * 1000, 100))

// Parse JSON requests with size limit
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

// Connect to MongoDB
connectDB()
const runMigrations = process.env.RUN_MIGRATIONS

;(async () => {
    if (runMigrations === 'true') {
        await createPersonalForm()
        await createStudioForm()
        await createReserveDaysForm()
        await addMetricsToAllForms()
        await seedPersonnelData()
        await seedProjectManagement()
        logger.info('Running migrations')
    }
})()

// Health check route
app.get('/health', (req: Request, res: Response) => {
    res.status(200).json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        memoryUsage: process.memoryUsage(),
        version: process.env.npm_package_version || '1.0.0',
    })
})

// API routes
app.use('/api', router)

// Handle 404 errors
app.use(handleNotFound)

// Global error handler (must be last)
app.use(globalErrorHandler)

// Start the server
app.listen(PORT, () => {
    logger.info(`Server is running on http://localhost:${PORT}`)
    logger.info('Middleware loaded:', {
        security: '✅',
        requestLogging: '✅',
        performanceMonitoring: '✅',
        rateLimiting: '✅',
        errorHandling: '✅',
    })
})
