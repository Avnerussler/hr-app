import { FormSubmissions, FormFields } from '../models'
import logger from '../config/logger'
import { faker } from '@faker-js/faker'
import { addDays, format, eachDayOfInterval } from 'date-fns'

const generateReserveDayData = (
    personnelId: string,
    personnelData: any,
    projectName: string
) => {
    const fundingSource = faker.helpers.arrayElement([
        'internal',
        'internal',
        'internal',
        'external',
    ]) // 75% internal, 25% external

    const orderTypes = [
        '8open',
        '8daily',
        'routineOpen',
        'routineDaily',
        'training',
    ]

    const fundingUnits = [
        'יחידה 8200',
        'יחידה 81',
        'חיל המודיעין',
        'מערכות פיקוד',
        'חיל האוויר',
        'יחידת מו"פ',
        'אגף התקשוב',
    ]

    // Generate start date (random date in the past 60 days or future 30 days)
    const daysOffset = faker.number.int({ min: -60, max: 30 })
    const startDate = addDays(new Date(), daysOffset)

    // Generate end date (between 1 to 14 days after start date)
    const duration = faker.number.int({ min: 1, max: 14 })
    const endDate = addDays(startDate, duration)

    // Generate attendance data for the date range
    const attendance: Record<string, boolean> = {}
    const dates = eachDayOfInterval({ start: startDate, end: endDate })

    dates.forEach((date) => {
        const dateStr = format(date, 'yyyy-MM-dd')
        // 90% chance of attendance
        attendance[dateStr] = faker.datatype.boolean({ probability: 0.9 })
    })

    return {
        employeeName: personnelId, // This is the personnel ID for the enhancedSelect
        firstName: personnelData.firstName,
        lastName: personnelData.lastName,
        personalNumber: personnelData.personalNumber,
        startDate: format(startDate, 'yyyy-MM-dd'),
        endDate: format(endDate, 'yyyy-MM-dd'),
        fundingSource,
        fundingUnit:
            fundingSource === 'external'
                ? faker.helpers.arrayElement(fundingUnits)
                : undefined,
        fundingName:
            fundingSource === 'external'
                ? faker.helpers.arrayElement(fundingUnits)
                : undefined,
        orderType: faker.helpers.arrayElement(orderTypes),
        baseAccessApproval: faker.helpers.arrayElement([
            'approved',
            'approved',
            'approved',
            'pending',
        ]), // 75% approved
        vehicleEntry: faker.datatype.boolean({ probability: 0.3 }), // 30% with vehicle
        vehicleNumber: faker.datatype.boolean({ probability: 0.3 })
            ? `${faker.number.int({ min: 10, max: 99 })}-${faker.number.int({
                  min: 100,
                  max: 999,
              })}-${faker.number.int({ min: 10, max: 99 })}`
            : undefined,
        projectName,
        attendance,
        requestStatus: faker.helpers.arrayElement([
            'approved',
            'approved',
            'approved',
            'pending',
        ]),
        notes: faker.datatype.boolean({ probability: 0.2 })
            ? faker.lorem.sentence()
            : undefined,
    }
}

export const seedReserveDaysData = async () => {
    try {
        logger.info('Starting Reserve Days data seeding process...')

        // Find the Reserve Days Management form
        const reserveDaysForm = await FormFields.findOne({})
        if (!reserveDaysForm) {
            logger.error(
                'Reserve Days Management form not found. Please run reserve days migration first.'
            )
            return
        }

        // Check if reserve days data already exists
        const existingCount = await FormSubmissions.countDocuments({
            isDeleted: false,
        })

        if (existingCount > 0) {
            logger.info(
                `Found ${existingCount} existing reserve days records. Skipping seeding.`
            )
            return
        }

        // Get all active projects with their assigned personnel
        const projects = await FormSubmissions.find({
            formName: 'project_management',
            isDeleted: false,
        }).lean()

        if (projects.length === 0) {
            logger.error(
                'No projects found. Please seed projects first or import personnel from Excel.'
            )
            return
        }

        logger.info(`Found ${projects.length} projects`)

        // Collect all personnel with their project assignments
        interface PersonnelWithProject {
            personnelId: string
            personnelData: any
            projectName: string
        }

        const personnelWithProjects: PersonnelWithProject[] = []

        for (const project of projects) {
            const projectName = project.formData.projectName
            const projectPersonnel = project.formData.projectPersonnel || []

            logger.info(
                `Processing project "${projectName}" with ${projectPersonnel.length} personnel`
            )

            // Get personnel IDs from the projectPersonnel field
            // The field might contain objects {_id, firstName, lastName} or just IDs
            const personnelIds: string[] = []

            for (const p of projectPersonnel) {
                let personnelId: string

                if (typeof p === 'string') {
                    personnelId = p
                } else if (p && typeof p === 'object') {
                    personnelId = (p as any)._id || (p as any).value || ''
                } else {
                    continue
                }

                if (personnelId) {
                    personnelIds.push(personnelId)
                }
            }

            // Fetch the actual personnel documents
            for (const personnelId of personnelIds) {
                try {
                    const personnel = await FormSubmissions.findOne({
                        _id: personnelId,
                        formName: 'personnel',
                        isDeleted: false,
                    }).lean()

                    if (personnel) {
                        personnelWithProjects.push({
                            personnelId: personnelId,
                            personnelData: personnel.formData,
                            projectName: projectName,
                        })
                    }
                } catch (error) {
                    logger.warn(
                        `Could not find personnel with ID ${personnelId}`
                    )
                }
            }
        }

        logger.info(
            `Found ${personnelWithProjects.length} personnel assigned to projects`
        )

        if (personnelWithProjects.length === 0) {
            logger.error(
                'No personnel found in projects. Cannot generate reserve days.'
            )
            return
        }

        // Generate reserve days for a subset of personnel
        // Each person can have 1-3 reserve day periods
        const reserveDaysData = []

        // Use ~70% of assigned personnel for reserve days
        const personnelSample = faker.helpers
            .shuffle(personnelWithProjects)
            .slice(0, Math.floor(personnelWithProjects.length * 0.7))

        for (const {
            personnelId,
            personnelData,
            projectName,
        } of personnelSample) {
            const numPeriods = faker.number.int({ min: 1, max: 3 })

            for (let i = 0; i < numPeriods; i++) {
                reserveDaysData.push({
                    formId: reserveDaysForm._id,

                    formData: generateReserveDayData(
                        personnelId,
                        personnelData,
                        projectName
                    ),
                    isDeleted: false,
                })
            }
        }

        logger.info(
            `Generated ${reserveDaysData.length} reserve days records for ${personnelSample.length} personnel`
        )

        // Insert in batches for better performance
        const batchSize = 100
        let insertedCount = 0

        for (let i = 0; i < reserveDaysData.length; i += batchSize) {
            const batch = reserveDaysData.slice(i, i + batchSize)
            await FormSubmissions.insertMany(batch)
            insertedCount += batch.length
            logger.info(
                `Inserted ${insertedCount}/${reserveDaysData.length} reserve days records`
            )
        }

        logger.info(`Successfully seeded ${insertedCount} reserve days records`)
    } catch (error) {
        logger.error('Reserve Days data seeding error:', error)
        throw error
    }
}
