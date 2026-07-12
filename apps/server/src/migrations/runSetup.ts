import connectDB from '../config/db'
import { createPersonalForm } from './personnel'
import { createReserveDaysForm } from './reserveDays'
import { createStudioForm } from './projectManagement'
import { addMetricsToAllForms } from './addMetricsConfig'
import logger from '../config/logger'

const run = async () => {
    await connectDB()
    logger.info('Creating form schemas...')
    await createPersonalForm()
    await createStudioForm()
    await createReserveDaysForm()
    await addMetricsToAllForms()
    logger.info('Form schemas ready.')
    process.exit(0)
}

run().catch(err => { logger.error(err); process.exit(1) })
