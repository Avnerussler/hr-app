import express, { Request, Response } from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import router from './routes'
import connectDB from './config/db'
dotenv.config()

const app = express()
const PORT = process.env.PORT

// ✅ Enable CORS for the frontend
const allowedOrigins = [process.env.FRONTEND_URL || 'http://localhost:3000']

app.use(
    cors({
        origin: allowedOrigins,
        credentials: true, // Allow cookies and authentication headers
    })
)

// Connect to MongoDB
connectDB()
app.use(express.json()) // Middleware to parse JSON requests
// app.use(express.urlencoded({ extended: true })) // Add this for form data parsing

// Basic route
app.get('/', (req: Request, res: Response) => {
    res.send('Hello, TypeScript with Express!')
})
app.use('/api', router)
// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`)
})
