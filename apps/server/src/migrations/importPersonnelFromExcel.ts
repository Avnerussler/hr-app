import ExcelJS from 'exceljs'
import path from 'path'
import { FormSubmissions, FormFields } from '../models'
import logger from '../config/logger'
import { transformFormData } from '../utils'
import { bidirectionalSyncService } from '../services/bidirectionalSync'

interface PersonnelRow {
    [key: string]: any
}

/**
 * Create projects from personnel assignments
 * This runs AFTER personnel have been imported
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
                    // The normalizeToArray function in sync service handles both raw and transformed data
                    await bidirectionalSyncService.handleBidirectionalSyncOnUpdate(
                        projectForm._id.toString(),
                        'project_management',
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
                    // All personnel are added to the team
                    const projectManager = personnelIds[0] || null
                    const projectPersonnel = personnelIds

                    const rawFormData = {
                        projectName: projectName,
                        projectManager: projectManager,
                        projectPersonnel: projectPersonnel,
                        projectStatus: 'active',
                    }

                    logger.info(
                        `Raw form data for project "${projectName}":`,
                        JSON.stringify(rawFormData, null, 2)
                    )

                    // Transform the form data to include display values
                    // This is necessary for the UI to display properly
                    const transformedFormData = await transformFormData(
                        rawFormData,
                        projectForm._id.toString()
                    )

                    logger.info(
                        `Transformed form data for project "${projectName}":`,
                        JSON.stringify(transformedFormData, null, 2)
                    )

                    // Create the project submission with TRANSFORMED data
                    // This matches how the UI creates projects
                    const newProject = await FormSubmissions.create({
                        formId: projectForm._id.toString(),
                        formName: 'project_management',
                        formData: transformedFormData,
                        isDeleted: false,
                    })

                    logger.info(
                        `Created project with ID: ${(
                            newProject._id as any
                        ).toString()}`
                    )

                    // Handle bidirectional sync to update personnel records
                    // Pass transformed data - the sync service extracts IDs from objects
                    logger.info(
                        `Starting bidirectional sync for project "${projectName}"...`
                    )
                    await bidirectionalSyncService.handleBidirectionalSyncOnCreate(
                        projectForm._id.toString(),
                        'project_management',
                        (newProject._id as any).toString(),
                        transformedFormData
                    )

                    logger.info(
                        `Completed bidirectional sync for project "${projectName}"`
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

export const importPersonnelFromExcel = async () => {
    try {
        logger.info('Starting Personnel Excel import...')

        const excelPath = path.join(__dirname, 'personnel.xlsx')
        const workbook = new ExcelJS.Workbook()
        await workbook.xlsx.readFile(excelPath)

        const worksheet = workbook.worksheets[0]
        if (!worksheet) {
            throw new Error('No worksheet found in Excel file')
        }

        // Get headers from first row
        const headers: string[] = []
        const firstRow = worksheet.getRow(1)
        firstRow.eachCell((cell, colNumber) => {
            headers[colNumber - 1] =
                cell.value?.toString() || `column_${colNumber}`
        })

        logger.info(`Found ${headers.length} columns: ${headers.join(', ')}`)

        const personnelData: PersonnelRow[] = []
        let rowCount = 0

        // Process each data row (starting from row 2)
        worksheet.eachRow((row, rowNumber) => {
            if (rowNumber === 1) return // Skip header row

            const rowData: PersonnelRow = {}
            row.eachCell((cell, colNumber) => {
                const header = headers[colNumber - 1]
                if (header) {
                    rowData[header] = cell.value
                }
            })

            // Only add rows that have at least some data
            if (Object.keys(rowData).length > 0) {
                personnelData.push(rowData)
                rowCount++
            }
        })

        logger.info(`Parsed ${rowCount} personnel records from Excel`)

        // Get the Personnel form ID
        const personnelForm = await FormFields.findOne({
            formName: 'personnel',
        })

        if (!personnelForm) {
            throw new Error('Personnel form not found in database')
        }

        logger.info(`Using Personnel form ID: ${personnelForm._id}`)

        // Import each personnel record
        let imported = 0
        let skipped = 0
        let errors = 0
        const projectAssignments = new Map<string, string[]>() // Map: projectName -> personnelIds[]

        // Mapping for FieldOfExpertise from Hebrew labels to English values
        const fieldOfExpertiseMap: Record<string, string> = {
            אלגוריתמיקה: 'Algorithms',
            פרונט: 'Frontend',
            בקנד: 'Backend',
            RF: 'RF',
            אחר: 'Other',
            // Also accept English values directly
            Algorithms: 'Algorithms',
            Frontend: 'Frontend',
            Backend: 'Backend',
            Other: 'Other',
        }

        // Mapping for reserveCategory from Hebrew labels to English values
        const reserveCategoryMap: Record<string, string> = {
            מילואים: 'reserves',
            יועץ: 'consultant',
            קבע: 'permanentService',
            סדיר: 'mandatoryMilitaryService',
            // Also accept English values directly
            reserves: 'reserves',
            consultant: 'consultant',
            permanentService: 'permanentService',
            mandatoryMilitaryService: 'mandatoryMilitaryService',
        }

        for (const record of personnelData) {
            try {
                // Map Excel columns to form fields
                // Split full name into first and last name
                const fullName = record['שם מלא']?.toString() || ''
                const nameParts = fullName.trim().split(' ')
                const firstName = nameParts[0] || ''
                const lastName = nameParts.slice(1).join(' ') || ''

                // Map FieldOfExpertise from Hebrew to English value
                const rawFieldOfExpertise =
                    record['הכשרה / מקצוע']?.toString().trim() || ''
                const mappedFieldOfExpertise =
                    fieldOfExpertiseMap[rawFieldOfExpertise] || ''

                // Map reserveCategory from Hebrew to English value
                const rawReserveCategory =
                    record['מילואים / אחר']?.toString().trim() || ''
                const mappedReserveCategory =
                    reserveCategoryMap[rawReserveCategory] || ''

                const formData: any = {
                    // Personal Information
                    firstName: firstName,
                    lastName: lastName,
                    userId: record['תעודת זהות'],
                    phone: record['מספר טלפון']?.toString() || '',

                    // Military Information
                    personalNumber: record['מספר אישי']?.toString() || '',
                    reserveUnit: record['שיוך']?.toString() || '',
                    studioRole: record['תפקיד בסטודיו']?.toString() || '',
                    reserveRole: '',
                    directBoss: '',

                    // Additional fields from Excel
                    rank: record['דרגה']?.toString() || '',
                    FieldOfExpertise: mappedFieldOfExpertise,
                    reserveCategory: mappedReserveCategory,
                    projectAssignment:
                        record['שיוך לפרוייקט']?.toString() || '',
                    classificationClass: record['סיווג']?.toString() || '',
                    referralSource: record['מקור גיוס']?.toString() || '',

                    // Default values for all imported personnel
                    isActive: 'true',
                    RecruitmentYear: '',
                    DismissYear: '',
                    canBeRecited: 'true',
                }

                // Check if this personnel already exists (by personalNumber)
                if (formData.personalNumber) {
                    const existing = await FormSubmissions.findOne({
                        formName: 'personnel',
                        'formData.personalNumber': formData.personalNumber,
                        isDeleted: false,
                    })

                    if (existing) {
                        logger.warn(
                            `Personnel with personalNumber ${formData.personalNumber} already exists, skipping`
                        )
                        skipped++
                        continue
                    }
                }

                // Create new form submission
                const newPersonnel = await FormSubmissions.create({
                    formId: personnelForm._id.toString(),
                    formName: 'personnel',
                    formData: formData,
                    isDeleted: false,
                })

                // Track project assignments from Excel
                const projectName = record['שיוך לפרוייקט']?.toString().trim()
                if (projectName && newPersonnel._id) {
                    if (!projectAssignments.has(projectName)) {
                        projectAssignments.set(projectName, [])
                    }
                    projectAssignments
                        .get(projectName)!
                        .push((newPersonnel._id as any).toString())
                }

                imported++
                if (imported % 10 === 0) {
                    logger.info(`Imported ${imported} personnel records...`)
                }
            } catch (error) {
                errors++
                logger.error(`Error importing record:`, error)
                logger.error(`Record data:`, JSON.stringify(record))
            }
        }

        logger.info('Personnel Excel import completed')
        logger.info(
            `Summary: ${imported} imported, ${skipped} skipped, ${errors} errors`
        )

        // Step 2: Create projects and assign personnel
        logger.info('Starting project creation and personnel assignment...')
        const projectResults = await createProjectsFromAssignments(
            projectAssignments
        )

        return {
            personnel: {
                imported,
                skipped,
                errors,
                total: personnelData.length,
            },
            projects: projectResults,
        }
    } catch (error) {
        logger.error('Error importing personnel from Excel:', error)
        throw error
    }
}
