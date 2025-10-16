import dotenv from 'dotenv'
import connectDB from '../config/db'
import { FormSubmissions } from '../models'
import logger from '../config/logger'

dotenv.config()

async function verifyImport() {
    try {
        logger.info('Connecting to database...')
        await connectDB()

        // Check personnel records
        const personnel = await FormSubmissions.find({
            formName: 'personnel',
            isDeleted: false,
        })
            .limit(5)
            .lean()

        logger.info(`\n=== PERSONNEL RECORDS (${personnel.length}) ===`)
        personnel.forEach((p: any) => {
            logger.info(
                `\nName: ${p.formData.firstName} ${p.formData.lastName}`
            )
            logger.info(`  Personal Number: ${p.formData.personalNumber}`)
            logger.info(
                `  Assigned Projects: ${typeof p.formData.assignedProjects} = ${JSON.stringify(p.formData.assignedProjects)}`
            )
        })

        // Check project records
        const projects = await FormSubmissions.find({
            formName: 'project_management',
            isDeleted: false,
        })
            .limit(5)
            .lean()

        logger.info(`\n=== PROJECT RECORDS (${projects.length}) ===`)
        projects.forEach((proj: any) => {
            logger.info(`\nProject: ${proj.formData.projectName}`)
            logger.info(
                `  Manager Type: ${typeof proj.formData.projectManager}`
            )
            logger.info(
                `  Manager: ${JSON.stringify(proj.formData.projectManager, null, 2)}`
            )
            logger.info(
                `  Personnel Type: ${Array.isArray(proj.formData.projectPersonnel) ? 'array' : typeof proj.formData.projectPersonnel}`
            )
            if (
                Array.isArray(proj.formData.projectPersonnel) &&
                proj.formData.projectPersonnel.length > 0
            ) {
                logger.info(
                    `  Personnel[0] Type: ${typeof proj.formData.projectPersonnel[0]}`
                )
                logger.info(
                    `  Personnel[0]: ${JSON.stringify(proj.formData.projectPersonnel[0], null, 2)}`
                )
            }
        })

        // Verify relationships
        logger.info(`\n=== VERIFYING RELATIONSHIPS ===`)
        for (const proj of projects) {
            const projectId = proj._id.toString()
            const personnelInProject = proj.formData.projectPersonnel || []

            logger.info(`\nProject: ${proj.formData.projectName} (${projectId})`)

            if (Array.isArray(personnelInProject)) {
                for (const person of personnelInProject) {
                    const personId =
                        typeof person === 'object' && person._id
                            ? person._id
                            : person

                    // Find this person and check if they have the project assigned
                    const personDoc = await FormSubmissions.findById(
                        personId
                    ).lean()
                    if (personDoc) {
                        const assignedProjects =
                            personDoc.formData.assignedProjects
                        const hasProject =
                            assignedProjects === projectId ||
                            (Array.isArray(assignedProjects) &&
                                assignedProjects.some(
                                    (p: any) =>
                                        p === projectId ||
                                        (typeof p === 'object' &&
                                            p._id === projectId)
                                ))

                        logger.info(
                            `  ✓ ${personDoc.formData.firstName} ${personDoc.formData.lastName} - ${hasProject ? '✅ HAS PROJECT' : '❌ MISSING PROJECT'}`
                        )
                    }
                }
            }
        }

        logger.info('\n=== VERIFICATION COMPLETE ===')
        process.exit(0)
    } catch (error) {
        logger.error('Error verifying import:', error)
        process.exit(1)
    }
}

verifyImport()
