import { WorkHours, IWorkHours } from '../../models'
import { Request, Response, Router } from 'express'
import logger from '../../config/logger'
import mongoose from 'mongoose'
import { parseISO, isValid, startOfDay } from 'date-fns'

const router = Router()

// Create single work hour entry
router.post('/', async (req: Request, res: Response) => {
    logger.info('POST /workHours - Request received')
    try {
        const {
            employeeId,
            employeeName,
            projectId,
            projectName,
            date,
            hours,
            notes,
            submittedBy
        } = req.body

        // Validation
        if (!employeeId || !employeeName || !date || hours === undefined || !submittedBy) {
            res.status(400).json({ 
                message: 'Missing required fields: employeeId, employeeName, date, hours, submittedBy' 
            })
            return
        }

        if (hours < 0 || hours > 24) {
            res.status(400).json({ 
                message: 'Hours must be between 0 and 24' 
            })
            return
        }

        // Validate and parse date
        const parsedDate = parseISO(date)
        if (!isValid(parsedDate)) {
            res.status(400).json({ message: 'Invalid date format. Use ISO format (YYYY-MM-DD)' })
            return
        }
        
        // Check for existing entry for this employee and date
        const existingEntry = await WorkHours.findOne({
            employeeId: mongoose.Types.ObjectId.createFromHexString(employeeId),
            date: startOfDay(parsedDate)
        })

        if (existingEntry) {
            res.status(409).json({ 
                message: 'Work hour entry already exists for this employee and date',
                existingEntry: existingEntry._id
            })
            return
        }

        const workHour = new WorkHours({
            employeeId: mongoose.Types.ObjectId.createFromHexString(employeeId),
            employeeName,
            projectId: projectId ? mongoose.Types.ObjectId.createFromHexString(projectId) : undefined,
            projectName,
            date: startOfDay(parsedDate),
            hours,
            notes,
            submittedBy: mongoose.Types.ObjectId.createFromHexString(submittedBy),
            status: 'draft'
        })

        await workHour.save()

        res.status(201).json({ 
            message: 'Work hour entry created successfully', 
            workHour 
        })
    } catch (error) {
        logger.error('Error creating work hour entry:', error)
        res.status(500).json({ message: 'Error creating work hour entry', error })
    }
})

// Bulk create work hour entries
router.post('/bulk', async (req: Request, res: Response) => {
    logger.info('POST /workHours/bulk - Request received')
    try {
        const { entries, submittedBy } = req.body

        if (!Array.isArray(entries) || entries.length === 0) {
            res.status(400).json({ 
                message: 'Entries array is required and must not be empty' 
            })
            return
        }

        if (!submittedBy) {
            res.status(400).json({ 
                message: 'submittedBy is required' 
            })
        }

        // Validate all entries
        const validationErrors: string[] = []
        const validatedEntries: any[] = []

        for (let i = 0; i < entries.length; i++) {
            const entry = entries[i]
            
            if (!entry.employeeId || !entry.employeeName || !entry.date || entry.hours === undefined) {
                validationErrors.push(`Entry ${i + 1}: Missing required fields`)
                continue
            }

            if (entry.hours < 0 || entry.hours > 24) {
                validationErrors.push(`Entry ${i + 1}: Hours must be between 0 and 24`)
                continue
            }
            
            const parsedDate = parseISO(entry.date)
            if (!isValid(parsedDate)) {
                validationErrors.push(`Entry ${i + 1}: Invalid date format. Use ISO format (YYYY-MM-DD)`)
                continue
            }

            validatedEntries.push({
                employeeId: mongoose.Types.ObjectId.createFromHexString(entry.employeeId),
                employeeName: entry.employeeName,
                projectId: entry.projectId ? mongoose.Types.ObjectId.createFromHexString(entry.projectId) : undefined,
                projectName: entry.projectName,
                date: startOfDay(parsedDate),
                hours: entry.hours,
                notes: entry.notes,
                submittedBy: mongoose.Types.ObjectId.createFromHexString(submittedBy),
                status: 'draft'
            })
        }

        if (validationErrors.length > 0) {
            res.status(400).json({ 
                message: 'Validation errors found',
                errors: validationErrors
            })
        }

        // Use upsert to handle duplicates
        const operations = validatedEntries.map(entry => ({
            updateOne: {
                filter: {
                    employeeId: entry.employeeId,
                    date: entry.date
                },
                update: { $set: entry },
                upsert: true
            }
        }))

        const result = await WorkHours.bulkWrite(operations)

        res.status(201).json({ 
            message: 'Bulk work hour entries processed successfully',
            result: {
                inserted: result.upsertedCount,
                updated: result.modifiedCount,
                total: validatedEntries.length
            }
        })
    } catch (error) {
        logger.error('Error creating bulk work hour entries:', error)
        res.status(500).json({ message: 'Error creating bulk work hour entries', error })
    }
})

// Quick create for a week (manager fills entire week for employees)
router.post('/week', async (req: Request, res: Response) => {
    logger.info('POST /workHours/week - Request received')
    try {
        const { weekStart, employees, submittedBy } = req.body

        if (!weekStart || !Array.isArray(employees) || !submittedBy) {
            res.status(400).json({ 
                message: 'weekStart, employees array, and submittedBy are required' 
            })
        }

        const parsedWeekStart = parseISO(weekStart)
        if (!isValid(parsedWeekStart)) {
            res.status(400).json({ message: 'Invalid weekStart format. Use ISO format (YYYY-MM-DD)' })
            return
        }
        
        const startDate = startOfDay(parsedWeekStart)
        const entries: any[] = []

        // Generate entries for each day of the week for each employee
        employees.forEach((employee: any) => {
            if (!employee.id || !employee.name || !employee.weekHours) return

            employee.weekHours.forEach((dailyHours: any, dayIndex: number) => {
                if (dailyHours.hours > 0) { // Only create entries for non-zero hours
                    const date = new Date(startDate.getTime() + (dayIndex * 24 * 60 * 60 * 1000))

                    entries.push({
                        employeeId: mongoose.Types.ObjectId.createFromHexString(employee.id),
                        employeeName: employee.name,
                        projectId: dailyHours.projectId ? mongoose.Types.ObjectId.createFromHexString(dailyHours.projectId) : undefined,
                        projectName: dailyHours.projectName,
                        date,
                        hours: dailyHours.hours,
                        notes: dailyHours.notes,
                        submittedBy: mongoose.Types.ObjectId.createFromHexString(submittedBy),
                        status: 'draft'
                    })
                }
            })
        })

        if (entries.length === 0) {
            res.status(400).json({ 
                message: 'No valid work hour entries found to create' 
            })
        }

        // Use upsert to handle duplicates
        const operations = entries.map(entry => ({
            updateOne: {
                filter: {
                    employeeId: entry.employeeId,
                    date: entry.date
                },
                update: { $set: entry },
                upsert: true
            }
        }))

        const result = await WorkHours.bulkWrite(operations)

        res.status(201).json({ 
            message: 'Weekly work hours processed successfully',
            result: {
                inserted: result.upsertedCount,
                updated: result.modifiedCount,
                total: entries.length
            }
        })
    } catch (error) {
        logger.error('Error creating weekly work hours:', error)
        res.status(500).json({ message: 'Error creating weekly work hours', error })
    }
})

export { router as CreateWorkHoursRouter }