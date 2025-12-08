import dotenv from 'dotenv'
import connectDB from '../config/db'
import { importReserveDaysFromExcel } from '../migrations/importReserveDaysFromExcel'
import logger from '../config/logger'

dotenv.config()

async function run() {
    try {
        logger.info('Starting Reserve Days Excel import script...')

        // Connect to MongoDB
        await connectDB()

        // Run the import
        const result = await importReserveDaysFromExcel()

        logger.info('Import completed successfully!')
        logger.info(`Results: ${JSON.stringify(result, null, 2)}`)

        process.exit(0)
    } catch (error) {
        logger.error('Error running reserve days import:', error)
        process.exit(1)
    }
}

run()
