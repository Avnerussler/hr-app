import connectDB from './config/db'
import { addMetricsToAllForms } from './migrations/addMetricsConfig'
import logger from './config/logger'

const runMigration = async () => {
    try {
        logger.info('Connecting to database...')
        await connectDB()
        
        logger.info('Running metrics migration...')
        await addMetricsToAllForms()
        
        logger.info('Migration completed successfully!')
        process.exit(0)
    } catch (error) {
        logger.error('Migration failed:', error)
        process.exit(1)
    }
}

runMigration()