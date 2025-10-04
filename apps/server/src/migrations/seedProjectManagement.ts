import { FormSubmissions, FormFields } from '../models'
import logger from '../config/logger'
import mongoose from 'mongoose'

export const seedProjectManagement = async () => {
    try {
        logger.info('Starting Project Management seeding...')

        // Get the Project Management form ID
        const projectForm = await FormFields.findOne({ formName: 'Project Management' })
        if (!projectForm) {
            logger.error('Project Management form not found')
            return
        }

        // Get all active personnel
        const allPersonnel = await FormSubmissions.find({
            formName: 'Personnel'
        }).lean()

        if (allPersonnel.length === 0) {
            logger.error('No personnel found for assignment')
            return
        }

        logger.info(`Found ${allPersonnel.length} personnel records`)

        // Helper function to get random personnel
        const getRandomPersonnel = (count: number, exclude: string[] = []) => {
            const available = allPersonnel
                .filter(p => !exclude.includes(p._id.toString()))
                .map(p => p._id.toString())

            const shuffled = available.sort(() => 0.5 - Math.random())
            return shuffled.slice(0, Math.min(count, available.length))
        }

        // Define project data
        const projects = [
            { name: 'פרויקט אלפא', status: 'active', teamSize: 12 },
            { name: 'פרויקט ביתא', status: 'active', teamSize: 15 },
            { name: 'פרויקט גאמא', status: 'active', teamSize: 10 },
            { name: 'פרויקט דלתא', status: 'pending', teamSize: 13 },
            { name: 'פרויקט אפסילון', status: 'active', teamSize: 14 },
        ]

        // Delete existing project management records (optional - for clean seeding)
        const existingCount = await FormSubmissions.countDocuments({
            formName: 'Project Management'
        })

        if (existingCount > 0) {
            logger.info(`Found ${existingCount} existing project records. Deleting...`)
            await FormSubmissions.deleteMany({
                formName: 'Project Management'
            })
        }

        // Create projects with assigned personnel
        for (const project of projects) {
            // Get random project manager
            const managerId = getRandomPersonnel(1)[0]

            // Get random team members (excluding the manager)
            const teamIds = getRandomPersonnel(project.teamSize, [managerId])

            const projectData = {
                formId: projectForm._id.toString(),
                formName: 'Project Management',
                formData: {
                    projectName: project.name,
                    projectManager: managerId,
                    projectPersonnel: teamIds,
                    projectStatus: project.status
                }
            }

            const newProject = await FormSubmissions.create(projectData)
            logger.info(`Created project: ${project.name} with ${teamIds.length} team members`)
        }

        logger.info('Project Management seeding completed successfully')
    } catch (error) {
        logger.error('Error seeding Project Management:', error)
    }
}
