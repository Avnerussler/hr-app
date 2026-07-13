import { FormSubmissions, FormFields } from '../models'
import logger from '../config/logger'
import { faker } from '@faker-js/faker'
import { addDays, format, eachDayOfInterval, startOfMonth, endOfMonth } from 'date-fns'

// Spread dates across the current month
const MONTH_START = startOfMonth(new Date())
const MONTH_END = endOfMonth(new Date())
const MONTH_DAYS = Math.round((MONTH_END.getTime() - MONTH_START.getTime()) / 86400000)

const randomDateInMonth = (): Date => {
    const offset = faker.number.int({ min: 0, max: MONTH_DAYS - 1 })
    return addDays(MONTH_START, offset)
}

const orderTypes = ['8open', '8daily', 'routineOpen', 'routineDaily']
const fundingUnits = [
    'יחידה 8200', 'יחידה 81', 'חיל המודיעין', 'מערכות פיקוד',
    'חיל האוויר', 'יחידת מו"פ', 'אגף התקשוב',
]

const generateReserveDayData = (personnelId: string, personnelData: any) => {
    const fundingSource = faker.helpers.arrayElement([
        'internal', 'internal', 'internal', 'external',
    ]) // 75% internal

    // Start date: random day within this month
    const startDate = randomDateInMonth()
    // Duration: 1-10 days, clamped to end of month
    const maxDuration = Math.max(
        0,
        Math.round((MONTH_END.getTime() - startDate.getTime()) / 86400000)
    )
    const duration = faker.number.int({ min: 1, max: Math.min(10, maxDuration || 1) })
    const endDate = addDays(startDate, duration)

    // Pre-populate attendance: 90% chance attended each day
    const attendance: Record<string, boolean> = {}
    const dates = eachDayOfInterval({ start: startDate, end: endDate })
    dates.forEach((date) => {
        const past = date <= new Date()
        if (past) {
            attendance[format(date, 'yyyy-MM-dd')] = faker.datatype.boolean({ probability: 0.9 })
        }
    })

    return {
        employeeName: personnelId,
        firstName: personnelData.firstName,
        lastName: personnelData.lastName,
        personalNumber: personnelData.personalNumber,
        startDate: format(startDate, 'yyyy-MM-dd'),
        endDate: format(endDate, 'yyyy-MM-dd'),
        fundingSource,
        fundingName: fundingSource === 'external' ? faker.helpers.arrayElement(fundingUnits) : undefined,
        orderType: faker.helpers.arrayElement(orderTypes),
        requestStatus: faker.helpers.arrayElement(['approved', 'approved', 'approved', 'pending']),
        baseAccessApproval: faker.helpers.arrayElement(['approved', 'approved', 'approved', 'pending']),
        vehicleEntry: faker.datatype.boolean({ probability: 0.3 }),
        vehicleNumber: faker.datatype.boolean({ probability: 0.3 })
            ? `${faker.number.int({ min: 10, max: 99 })}-${faker.number.int({ min: 100, max: 999 })}-${faker.number.int({ min: 10, max: 99 })}`
            : undefined,
        isActive: true,
        attendance,
        notes: faker.datatype.boolean({ probability: 0.2 }) ? faker.lorem.sentence() : undefined,
    }
}

export const seedReserveDaysData = async () => {
    try {
        logger.info('Starting Reserve Days data seeding process...')

        const reserveDaysForm = await FormFields.findOne({ formName: 'reserve_days_management' })
        if (!reserveDaysForm) {
            logger.error('Reserve Days Management form not found. Please run reserve days migration first.')
            return
        }

        const existingCount = await FormSubmissions.countDocuments({
            formName: 'reserve_days_management',
            isDeleted: false,
        })
        logger.info(`Found ${existingCount} existing reserve days records — adding more...`)

        // Get all personnel
        const allPersonnel = await FormSubmissions.find({
            formName: 'personnel',
            isDeleted: false,
        }).lean()

        if (allPersonnel.length === 0) {
            logger.error('No personnel found. Please seed personnel first.')
            return
        }

        logger.info(`Found ${allPersonnel.length} personnel records`)

        // Pick personnel randomly (with repetition) to generate exactly 1000 records
        const sample = Array.from({ length: 400 }, () => faker.helpers.arrayElement(allPersonnel))

        const reserveDaysData = []
        for (const personnel of sample) {
            const numPeriods = faker.number.int({ min: 1, max: 3 })
            for (let i = 0; i < numPeriods; i++) {
                reserveDaysData.push({
                    formId: reserveDaysForm._id,
                    formName: 'reserve_days_management',
                    formData: generateReserveDayData(
                        (personnel._id as any).toString(),
                        personnel.formData
                    ),
                    isDeleted: false,
                })
            }
        }

        logger.info(`Generated ${reserveDaysData.length} reserve days records for ${sample.length} personnel`)

        const batchSize = 50
        let insertedCount = 0
        for (let i = 0; i < reserveDaysData.length; i += batchSize) {
            const batch = reserveDaysData.slice(i, i + batchSize)
            await FormSubmissions.insertMany(batch)
            insertedCount += batch.length
            logger.info(`Inserted ${insertedCount}/${reserveDaysData.length} reserve days records`)
        }

        logger.info(`Successfully seeded ${insertedCount} reserve days records`)
        return { inserted: insertedCount }
    } catch (error) {
        logger.error('Reserve Days data seeding error:', error)
        throw error
    }
}
