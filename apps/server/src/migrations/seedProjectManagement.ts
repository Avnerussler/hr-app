import { FormSubmissions, FormFields } from '../models'
import logger from '../config/logger'
import { faker } from '@faker-js/faker'

export const seedProjectManagement = async () => {
    try {
        logger.info('Starting Project Management seeding...')

        const projectForm = await FormFields.findOne({ formName: 'project_management' })
        if (!projectForm) {
            logger.error('Project Management form not found')
            return
        }

        const existingCount = await FormSubmissions.countDocuments({
            formName: 'project_management',
            isDeleted: false,
        })
        if (existingCount > 0) {
            logger.info(`Project Management data already seeded. Found ${existingCount} records.`)
            return
        }

        const allPersonnel = await FormSubmissions.find({
            formName: 'personnel',
            isDeleted: false,
        })
            .select('_id')
            .lean()

        if (allPersonnel.length === 0) {
            logger.error('No personnel found. Please seed personnel first.')
            return
        }

        logger.info(`Found ${allPersonnel.length} personnel records`)

        const shuffle = <T>(arr: T[]): T[] => arr.slice().sort(() => Math.random() - 0.5)

        const projects = [
            { name: 'פרויקט אלפא', status: 'active', teamSize: 15 },
            { name: 'פרויקט ביתא', status: 'active', teamSize: 18 },
            { name: 'פרויקט גאמא', status: 'active', teamSize: 12 },
            { name: 'פרויקט דלתא', status: 'pending', teamSize: 14 },
            { name: 'פרויקט אפסילון', status: 'active', teamSize: 16 },
            { name: 'פרויקט זטא', status: 'inactive', teamSize: 10 },
            { name: 'פרויקט אטא', status: 'active', teamSize: 20 },
        ]

        const allIds = shuffle(allPersonnel.map((p) => p._id.toString()))
        let idCursor = 0

        const pick = (count: number): string[] => {
            const result: string[] = []
            for (let i = 0; i < count && idCursor < allIds.length; i++, idCursor++) {
                result.push(allIds[idCursor])
            }
            return result
        }

        for (const project of projects) {
            const teamIds = pick(project.teamSize)
            if (teamIds.length === 0) break

            const managerId = faker.helpers.arrayElement(teamIds)

            await FormSubmissions.create({
                formId: projectForm._id,
                formName: 'project_management',
                formData: {
                    projectName: project.name,
                    projectManager: managerId,
                    projectPersonnel: teamIds,
                    projectStatus: project.status,
                },
                isDeleted: false,
            })

            logger.info(`Created project "${project.name}" with ${teamIds.length} members`)
        }

        logger.info('Project Management seeding completed successfully')
    } catch (error) {
        logger.error('Error seeding Project Management:', error)
        throw error
    }
}
