import { FormSubmissions, FormFields } from '../models'
import logger from '../config/logger'
import { faker } from '@faker-js/faker'
import { transformFormData } from '../utils'
import { bidirectionalSyncService } from '../services/bidirectionalSync'

const generateRandomPersonnelData = (index: number) => {
    const hebrewFirstNames = [
        'דוד',
        'משה',
        'יוסף',
        'אברהם',
        'יעקב',
        'שמואל',
        'יצחק',
        'דניאל',
        'אלי',
        'נתן',
        'רחל',
        'שרה',
        'מרים',
        'לאה',
        'רבקה',
        'תמר',
        'אסתר',
        'רות',
        'נועה',
        'מיכל',
    ]
    const hebrewLastNames = [
        'כהן',
        'לוי',
        'מילר',
        'שמיט',
        'פישר',
        'וייס',
        'שולץ',
        'וגנר',
        'בקר',
        'שולמן',
        'רוזן',
        'כץ',
        'גולד',
        'סילבר',
        'ברג',
        'שטיין',
        'קליין',
        'רוט',
        'גרין',
        'בלאו',
    ]
    const israeliCities = [
        'ירושלים',
        'תל אביב',
        'חיפה',
        'באר שבע',
        'נתניה',
        'פתח תקווה',
        'אשדוד',
        'ראשון לציון',
        'אשקלון',
        'רחובות',
    ]
    const expertise = ['Algorithms', 'Frontend', 'Backend', 'RF', 'Other']
    const experience = ['0-1 years', '1-3 years', '3-5 years', '5+ years']
    const techCompanies = [
        'Intel',
        'Google',
        'Microsoft',
        'Apple',
        'Meta',
        'אמזון',
        'IBM',
        'סיסקו',
        'נביד',
        'רפאל',
    ]
    const hebrewPositions = [
        'מפתח תוכנה',
        'מהנדס מערכות',
        'אנליסט מערכות',
        'מנהל פרויקט',
        'מהנדס איכות',
        'מהנדס אינטגרציה',
        'ארכיטקט מערכות',
        'מפתח פולסטק',
    ]
    const militaryUnits = [
        'יחידה 8200',
        'יחידה 81',
        'מערכות פיקוד',
        'חיל המודיעין',
        'חיל האוויר',
        'חיל הים',
        'חיל השריון',
        'חיל הרגלים',
    ]
    const projectNames = [
        'פרויקט אלפא',
        'פרויקט בטא',
        'פרויקט גמא',
        'פרויקט דלתא',
        'פרויקט זטא',
        'פרויקט חטא',
        'פרויקט תטא',
    ]
    const militaryRoles = [
        'מפתח',
        'ראש צוות',
        'יועץ טכני',
        'אנליסט',
        'מתכנן',
        'בודק איכות',
        'מנהל פרויקט',
    ]
    const militaryRanks = [
        'רס"ן דוד',
        'סרן משה',
        'רב"ט יוסף',
        'סמ"ר אברהם',
        'סמ"ח יצחק',
        'סמל דניאל',
        'רס"ר אלי',
    ]
    const categories = [
        'Content Specialist',
        'Consultant',
        'Team Leader',
        'Other',
    ]
    const hebrewDegrees = [
        'תואר ראשון במדעי המחשב',
        'תואר ראשון בהנדסה',
        'תואר שני במדעי המחשב',
        'תואר שני בהנדסה',
        'תואר ראשון במתמטיקה',
        'תואר ראשון בפיזיקה',
    ]
    const israeliUniversities = [
        'טכניון',
        'אוניברסיטת תל אביב',
        'האוניברסיטה העברית',
        'בן גוריון',
        'בר אילן',
        'אריאל',
        'חיפה',
        'אפקה',
    ]
    const studyFields = [
        'מדעי המחשב',
        'הנדסת תוכנה',
        'הנדסת חשמל',
        'מתמטיקה',
        'פיזיקה',
        'הנדסת מכונות',
        'הנדסה כימית',
    ]

    const recruitmentYear = faker.date
        .between({ from: '2000-01-01', to: '2020-12-31' })
        .getFullYear()
    const dismissYear = faker.date
        .between({
            from: `${recruitmentYear + 2}-01-01`,
            to: `${recruitmentYear + 4}-12-31`,
        })
        .getFullYear()

    return {
        firstName: faker.helpers.arrayElement(hebrewFirstNames),
        lastName: faker.helpers.arrayElement(hebrewLastNames),
        userId: faker.number.int({ min: 100000000, max: 999999999 }),
        phone: `0${faker.number.int({ min: 50, max: 59 })}-${faker.number.int({
            min: 1000000,
            max: 9999999,
        })}`,
        email: faker.internet.email({
            firstName: `user${index}`,
            lastName: 'example',
            provider: 'example.com',
        }),
        city: faker.helpers.arrayElement(israeliCities),
        linkedin: faker.internet.username({ firstName: `user${index}` }),
        isActive: faker.datatype.boolean(),
        FieldOfExpertise: faker.helpers.arrayElement(expertise),
        Experience: faker.helpers.arrayElement(experience),
        workPlace: faker.helpers.arrayElement(techCompanies),
        currentPosition: faker.helpers.arrayElement(hebrewPositions),
        personalNumber: faker.number.int({ min: 1000000, max: 9999999 }),
        RecruitmentYear: faker.date
            .between({
                from: `${recruitmentYear}-01-01`,
                to: `${recruitmentYear}-12-31`,
            })
            .toISOString()
            .split('T')[0],
        DismissYear: faker.date
            .between({
                from: `${dismissYear}-01-01`,
                to: `${dismissYear}-12-31`,
            })
            .toISOString()
            .split('T')[0],
        reserveUnit: faker.helpers.arrayElement(militaryUnits),
        projectAssign: faker.helpers.arrayElement(projectNames),
        rule: faker.helpers.arrayElement(militaryRoles),
        directBoss: faker.helpers.arrayElement(militaryRanks),
        isOfficer: faker.datatype.boolean(),
        classificationClass: faker.helpers.arrayElement(['1', '2', '3', 'no']),
        canBeRecited: faker.datatype.boolean(),
        activeOrderToday: faker.datatype.boolean(),
        reserveCategory: faker.helpers.arrayElement(categories),
        degree: faker.helpers.arrayElement(hebrewDegrees),
        University: faker.helpers.arrayElement(israeliUniversities),
        studyArea: faker.helpers.arrayElement(studyFields),
        yearOfGradation: faker.date
            .between({ from: '2015-01-01', to: new Date() })
            .toISOString()
            .split('T')[0],
        extraCourses: faker.lorem.sentence({ min: 3, max: 8 }),
        workExperience: faker.lorem.paragraph({ min: 2, max: 4 }),
        talentAndSkills: faker.lorem.paragraph({ min: 1, max: 3 }),
        referralSource: faker.company.name(),
    }
}

/**
 * Create projects from personnel assignments
 * This runs AFTER personnel have been seeded
 * Uses transformFormData and bidirectionalSync for proper data handling
 */
const createProjectsFromAssignments = async (
    projectAssignments: Map<string, string[]>
) => {
    try {
        // Get the Project Management form
        const projectForm = await FormFields.findOne({
            formName: 'project_management',
        })

        if (!projectForm) {
            logger.error('Project Management form not found')
            return {
                created: 0,
                updated: 0,
                errors: 0,
            }
        }

        let created = 0
        let updated = 0
        let errors = 0

        for (const [
            projectName,
            personnelIds,
        ] of projectAssignments.entries()) {
            try {
                // Check if project already exists
                const existingProject = await FormSubmissions.findOne({
                    formName: 'project_management',
                    'formData.projectName': projectName,
                    isDeleted: false,
                })

                if (existingProject) {
                    logger.info(
                        `Project "${projectName}" already exists, updating with new personnel`
                    )

                    // Get current personnel IDs (extract from objects if they exist)
                    const currentPersonnel =
                        existingProject.formData.projectPersonnel || []
                    const currentIds = currentPersonnel.map((p: any) =>
                        typeof p === 'string' ? p : p._id || p
                    )

                    // Merge with new personnel IDs, removing duplicates
                    const mergedIds = [
                        ...new Set([...currentIds, ...personnelIds]),
                    ]

                    // Prepare updated form data with RAW IDs first
                    const updatedFormData = {
                        ...existingProject.formData,
                        projectPersonnel: mergedIds,
                    }

                    // Transform to get proper display format
                    const transformedFormData = await transformFormData(
                        updatedFormData,
                        projectForm._id.toString()
                    )

                    // Update the project with transformed data
                    await FormSubmissions.updateOne(
                        { _id: existingProject._id },
                        {
                            $set: {
                                'formData.projectPersonnel':
                                    transformedFormData.projectPersonnel,
                            },
                        }
                    )

                    // Handle bidirectional sync for the update
                    await bidirectionalSyncService.handleBidirectionalSyncOnUpdate(
                        projectForm._id.toString(),

                        (existingProject._id as any).toString(),
                        existingProject.formData,
                        transformedFormData
                    )

                    logger.info(
                        `Updated project "${projectName}" with ${personnelIds.length} new personnel (total: ${mergedIds.length})`
                    )
                    updated++
                } else {
                    logger.info(`Creating new project "${projectName}"`)

                    // Create new project with raw IDs
                    const projectManager = personnelIds[0] || null
                    const projectPersonnel = personnelIds

                    const rawFormData = {
                        projectName: projectName,
                        projectManager: projectManager,
                        projectPersonnel: projectPersonnel,
                        projectStatus: 'active',
                    }

                    // Transform the form data to include display values
                    const transformedFormData = await transformFormData(
                        rawFormData,
                        projectForm._id.toString()
                    )

                    // Create the project submission with TRANSFORMED data
                    const newProject = await FormSubmissions.create({
                        formId: projectForm._id.toString(),
                        formName: 'project_management',
                        formData: transformedFormData,
                        isDeleted: false,
                    })

                    // Handle bidirectional sync to update personnel records
                    await bidirectionalSyncService.handleBidirectionalSyncOnCreate(
                        projectForm._id.toString(),
                        'project_management',
                        (newProject._id as any).toString(),
                        transformedFormData
                    )

                    logger.info(
                        `Created project "${projectName}" with ${personnelIds.length} personnel`
                    )
                    created++
                }
            } catch (error) {
                errors++
                logger.error(
                    `Error creating/updating project "${projectName}":`,
                    error
                )
            }
        }

        logger.info('Project creation completed')
        logger.info(
            `Summary: ${created} created, ${updated} updated, ${errors} errors`
        )

        return {
            created,
            updated,
            errors,
            total: projectAssignments.size,
        }
    } catch (error) {
        logger.error('Error creating projects from assignments:', error)
        throw error
    }
}

export const seedPersonnelData = async () => {
    try {
        logger.info('Starting personnel data seeding process...')

        // Find the Personnel form
        const personnelForm = await FormFields.findOne({
            formName: 'personnel',
        })
        if (!personnelForm) {
            logger.error(
                'Personnel form not found. Please run personnel migration first.'
            )
            return
        }

        // Check if data already exists (excluding deleted records)
        const existingCount = await FormSubmissions.countDocuments({
            formName: 'personnel',
            isDeleted: false,
        })
        if (existingCount >= 1200) {
            logger.info(
                `Personnel data already seeded. Found ${existingCount} records.`
            )
            return
        }

        // Generate 1200 personnel records
        const personnelData = []
        for (let i = 1; i <= 1200; i++) {
            personnelData.push({
                formId: personnelForm._id,
                formName: 'personnel',
                formData: generateRandomPersonnelData(i),
                isDeleted: false,
            })
        }

        // Insert in batches for better performance and track project assignments
        const batchSize = 100
        let insertedCount = 0
        const projectAssignments = new Map<string, string[]>() // Map: projectName -> personnelIds[]

        for (let i = 0; i < personnelData.length; i += batchSize) {
            const batch = personnelData.slice(i, i + batchSize)
            const insertedBatch = await FormSubmissions.insertMany(batch)

            // Track project assignments for each inserted personnel
            insertedBatch.forEach((personnel) => {
                const projectName = personnel.formData.projectAssign
                if (projectName && personnel._id) {
                    if (!projectAssignments.has(projectName)) {
                        projectAssignments.set(projectName, [])
                    }
                    projectAssignments
                        .get(projectName)!
                        .push((personnel._id as any).toString())
                }
            })

            insertedCount += batch.length
            logger.info(
                `Inserted ${insertedCount}/${personnelData.length} personnel records`
            )
        }

        logger.info(`Successfully seeded ${insertedCount} personnel records`)

        // Step 2: Create projects and assign personnel
        logger.info('Starting project creation and personnel assignment...')
        const projectResults = await createProjectsFromAssignments(
            projectAssignments
        )

        return {
            personnel: {
                inserted: insertedCount,
                total: personnelData.length,
            },
            projects: projectResults,
        }
    } catch (error) {
        logger.error('Personnel data seeding error:', error)
        throw error
    }
}
