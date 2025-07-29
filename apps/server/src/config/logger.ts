import winston from 'winston'
import path from 'path'
import fs from 'fs'

// Ensure logs directory exists
const logsDir = path.join(process.cwd(), 'logs')
if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true })
}

const logger = new winston.Logger({
    level: process.env.LOG_LEVEL || 'info',
    transports: [
        new winston.transports.File({
            name: 'error-file',
            filename: path.join(logsDir, 'error.log'),
            level: 'error',
            json: true,
            maxsize: 5242880,
            maxFiles: 5,
            colorize: false,
        }),
        new winston.transports.File({
            name: 'combined-file',
            filename: path.join(logsDir, 'combined.log'),
            json: true,
            maxsize: 5242880,
            maxFiles: 5,
            colorize: false,
        }),
    ],
})

if (process.env.NODE_ENV !== 'production') {
    logger.add(winston.transports.Console, {
        name: 'console',
        colorize: true,
        timestamp: true,
    })
}

export default logger
