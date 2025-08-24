import { WorkHours, IWorkHours } from '../../models'
import { Request, Response, Router } from 'express'
import logger from '../../config/logger'
import mongoose from 'mongoose'
import { parseISO, isValid, startOfDay } from 'date-fns'
import { validate, commonSchemas, asyncHandler } from '../../middleware'

const router = Router()

// Create single work hour entry
router.post('/', 
    validate(commonSchemas.workHours),
    asyncHandler(async (req: Request, res: Response) => {
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

        // Parse and validate the date
        const parsedDate = parseISO(date)
        if (!isValid(parsedDate)) {
            return res.status(400).json({ 
                message: 'Invalid date format. Expected ISO date string.',
                code: 'INVALID_DATE'
            })
        }

        // Create the work hour entry
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
    })
)

// Bulk create work hour entries
router.post('/bulk', 
    validate(commonSchemas.bulkWorkHours),
    asyncHandler(async (req: Request, res: Response) => {
        const { entries, submittedBy } = req.body

        // Validate all entries
        const validationErrors: string[] = []
        const validatedEntries: any[] = []

        for (let i = 0; i < entries.length; i++) {
            const entry = entries[i]
            
            // Basic validation for each entry
            if (!entry.employeeId || !entry.employeeName || !entry.date || entry.hours === undefined) {
                validationErrors.push(`Entry ${i + 1}: Missing required fields`)
                continue
            }

            // Validate hours
            if (typeof entry.hours !== 'number' || isNaN(entry.hours) || entry.hours < 0 || entry.hours > 24) {
                validationErrors.push(`Entry ${i + 1}: Hours must be a number between 0 and 24`)
                continue
            }

            // Validate date
            const parsedDate = parseISO(entry.date)
            if (!isValid(parsedDate)) {
                validationErrors.push(`Entry ${i + 1}: Invalid date format`)
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
            return res.status(400).json({
                message: 'Validation errors in bulk entries',
                errors: validationErrors,
                code: 'BULK_VALIDATION_ERROR'
            })
        }

        // Insert all valid entries
        const workHours = await WorkHours.insertMany(validatedEntries)

        res.status(201).json({
            message: `Successfully created ${workHours.length} work hour entries`,
            workHours,
            count: workHours.length
        })
    })
)

export { router as CreateWorkHoursRouter }