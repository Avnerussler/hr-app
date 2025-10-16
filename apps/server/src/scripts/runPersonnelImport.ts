import dotenv from 'dotenv'
import connectDB from '../config/db'
import { importPersonnelFromExcel } from '../migrations/importPersonnelFromExcel'
import logger from '../config/logger'

dotenv.config()

async function run() {
    try {
        logger.info('Starting Personnel Excel import script...')

        // Connect to MongoDB
        await connectDB()

        // Run the import
        const result = await importPersonnelFromExcel()

        logger.info('Import completed successfully!')
        logger.info(`Results: ${JSON.stringify(result, null, 2)}`)

        process.exit(0)
    } catch (error) {
        logger.error('Error running personnel import:', error)
        process.exit(1)
    }
}

run()
