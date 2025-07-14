import connectDB from './config/db'
import { addMetricsToAllForms } from './migrations/addMetricsConfig'

const runMigration = async () => {
    try {
        console.log('Connecting to database...')
        await connectDB()
        
        console.log('Running metrics migration...')
        await addMetricsToAllForms()
        
        console.log('Migration completed successfully!')
        process.exit(0)
    } catch (error) {
        console.error('Migration failed:', error)
        process.exit(1)
    }
}

runMigration()