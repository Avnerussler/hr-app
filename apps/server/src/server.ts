import express, { Request, Response } from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import router from './routes'
import connectDB from './config/db'
import {
    createRecruitForm,
    createStudioForm,
    addMetricsToAllForms,
} from './migrations'
dotenv.config()

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

// Connect to MongoDB
connectDB()
const runMigrations = process.env.RUN_MIGRATIONS

;(async () => {
    if (runMigrations === 'true') {
        await createRecruitForm()
        await createStudioForm()
        await addMetricsToAllForms()
        console.log('Running migrations')
    }
})()

app.use(express.json()) // Middleware to parse JSON requests

// Basic route
app.get('/health', (req: Request, res: Response) => {
    console.log('GET /health - Request received')
    res.status(200).json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
    })
})
app.use('/api', router)
// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`)
})
