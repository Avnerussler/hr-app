import dotenv from 'dotenv'
import connectDB from '../config/db'
import { FormSubmissions } from '../models'
import logger from '../config/logger'

dotenv.config()

/**
 * Permanently delete all reserve days data from the database
 * This completely removes all form submissions with formName: 'reserve_days_management'
 */
async function deleteReserveDaysData() {
    try {
        logger.info('Starting PERMANENT Reserve Days data deletion...')
        logger.info('='.repeat(60))

        // Connect to MongoDB
        await connectDB()

        // Count existing records before deletion
        const countBefore = await FormSubmissions.countDocuments({
            formName: 'reserve_days_management',
        })

        logger.info(`Found ${countBefore} reserve days records in database`)

        if (countBefore === 0) {
            logger.info('No reserve days data to delete.')
            logger.info('='.repeat(60))
            process.exit(0)
        }

        // Ask for confirmation (check if running with --force flag)
        const forceDelete = process.argv.includes('--force')

        if (!forceDelete) {
            logger.warn('⚠️  WARNING: This will PERMANENTLY delete all reserve days data!')
            logger.warn(`   ${countBefore} records will be permanently removed from the database.`)
            logger.warn('')
            logger.warn('   ⚠️  THIS ACTION CANNOT BE UNDONE!')
            logger.warn('')
            logger.warn('   To proceed, run this script with the --force flag:')
            logger.warn('   npm run delete:reserveDays -- --force')
            logger.info('='.repeat(60))
            process.exit(0)
        }

        // Perform permanent deletion
        const result = await FormSubmissions.deleteMany({
            formName: 'reserve_days_management',
        })

        logger.info('='.repeat(60))
        logger.info('✅ Reserve Days data PERMANENTLY deleted!')
        logger.info('='.repeat(60))
        logger.info(`  • Records permanently removed: ${result.deletedCount}`)
        logger.info('')
        logger.warn('⚠️  WARNING: This action cannot be undone!')
        logger.info('='.repeat(60))

        process.exit(0)
    } catch (error) {
        logger.error('Error permanently deleting reserve days data:', error)
        process.exit(1)
    }
}

// Main execution
deleteReserveDaysData()
