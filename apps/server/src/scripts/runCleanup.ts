import mongoose from 'mongoose'
import logger from '../config/logger'
import { cleanupMixedFormats } from '../migrations/cleanupMixedFormats'

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/hr-app'

async function runCleanup() {
    try {
        logger.info('Connecting to MongoDB...')
        await mongoose.connect(MONGODB_URI)
        logger.info('Connected to MongoDB')

        await cleanupMixedFormats()

        logger.info('Cleanup completed successfully')
        process.exit(0)
    } catch (error) {
        logger.error('Error running cleanup:', error)
        process.exit(1)
    }
}

runCleanup()
