import winston from 'winston'

const logger = new winston.Logger({
    level: process.env.LOG_LEVEL || 'info',
    transports: [
        new winston.transports.Console({
            name: 'console',
            colorize: true,
            timestamp: true,
        }),
    ],
})

export default logger
