import { WorkHours } from '../../models'
import { Request, Response, Router } from 'express'
import logger from '../../config/logger'
import mongoose from 'mongoose'
import { parseISO, isValid, startOfDay } from 'date-fns'

const router = Router()

// Update single work hour entry
router.put('/:id', async (req: Request, res: Response) => {
    logger.info(`PUT /workHours/${req.params.id} - Request received`)
    try {
        const {
            projectId,
            projectName,
            hours,
            notes,
            status
        } = req.body

        const workHour = await WorkHours.findById(req.params.id)
        
        if (!workHour) {
            res.status(404).json({ message: 'Work hour entry not found' })
            return
        }

        // Validation for hours if provided
        if (hours !== undefined && (hours < 0 || hours > 24)) {
            res.status(400).json({ 
                message: 'Hours must be between 0 and 24' 
            })
            return
        }

        // Update fields
        if (projectId !== undefined) {
            workHour.projectId = projectId ? mongoose.Types.ObjectId.createFromHexString(projectId) : undefined
        }
        if (projectName !== undefined) {
            workHour.projectName = projectName
        }
        if (hours !== undefined) {
            workHour.hours = hours
        }
        if (notes !== undefined) {
            workHour.notes = notes
        }
        if (status !== undefined) {
            workHour.status = status
        }

        await workHour.save()

        res.status(200).json({ 
            message: 'Work hour entry updated successfully', 
            workHour 
        })
    } catch (error) {
        logger.error('Error updating work hour entry:', error)
        res.status(500).json({ message: 'Error updating work hour entry', error })
    }
})

// Bulk update work hour entries
router.put('/bulk', async (req: Request, res: Response) => {
    logger.info('PUT /workHours/bulk - Request received')
    try {
        const { updates } = req.body

        if (!Array.isArray(updates) || updates.length === 0) {
            res.status(400).json({ 
                message: 'Updates array is required and must not be empty' 
            })
            return
        }

        const operations = []
        const validationErrors: string[] = []

        for (let i = 0; i < updates.length; i++) {
            const update = updates[i]
            
            if (!update.id) {
                validationErrors.push(`Update ${i + 1}: Missing id field`)
                continue
            }

            if (update.hours !== undefined && (update.hours < 0 || update.hours > 24)) {
                validationErrors.push(`Update ${i + 1}: Hours must be between 0 and 24`)
                continue
            }

            const updateFields: any = {}
            
            if (update.projectId !== undefined) {
                updateFields.projectId = update.projectId ? mongoose.Types.ObjectId.createFromHexString(update.projectId) : null
            }
            if (update.projectName !== undefined) {
                updateFields.projectName = update.projectName
            }
            if (update.hours !== undefined) {
                updateFields.hours = update.hours
            }
            if (update.notes !== undefined) {
                updateFields.notes = update.notes
            }
            if (update.status !== undefined) {
                updateFields.status = update.status
            }

            operations.push({
                updateOne: {
                    filter: { _id: mongoose.Types.ObjectId.createFromHexString(update.id) },
                    update: { $set: updateFields }
                }
            })
        }

        if (validationErrors.length > 0) {
            res.status(400).json({ 
                message: 'Validation errors found',
                errors: validationErrors
            })
            return
        }

        const result = await WorkHours.bulkWrite(operations)

        res.status(200).json({ 
            message: 'Bulk work hour entries updated successfully',
            result: {
                matched: result.matchedCount,
                modified: result.modifiedCount
            }
        })
    } catch (error) {
        logger.error('Error updating bulk work hour entries:', error)
        res.status(500).json({ message: 'Error updating bulk work hour entries', error })
    }
})

// Update work hour entry by employee and date (for grid interface)
router.put('/employee/:employeeId/date/:date', async (req: Request, res: Response) => {
    logger.info(`PUT /workHours/employee/${req.params.employeeId}/date/${req.params.date} - Request received`)
    try {
        const { employeeId, date } = req.params
        const { hours, projectId, projectName, notes, employeeName } = req.body

        // Validation
        if (hours !== undefined && (hours < 0 || hours > 24)) {
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
        
        const filter = {
            employeeId: mongoose.Types.ObjectId.createFromHexString(employeeId),
            date: startOfDay(parsedDate)
        }

        const updateData: any = {}
        
        if (hours !== undefined) updateData.hours = hours
        if (projectId !== undefined) {
            updateData.projectId = projectId ? mongoose.Types.ObjectId.createFromHexString(projectId) : null
        }
        if (projectName !== undefined) updateData.projectName = projectName
        if (notes !== undefined) updateData.notes = notes
        if (employeeName) updateData.employeeName = employeeName

        // For upsert, we need to provide required fields that might not exist
        updateData.employeeId = mongoose.Types.ObjectId.createFromHexString(employeeId)
        updateData.date = startOfDay(parsedDate)
        
        // Set a default submittedBy if not provided (using employeeId as fallback)
        updateData.submittedBy = updateData.employeeId
        updateData.status = 'draft'

        const workHour = await WorkHours.findOneAndUpdate(
            filter,
            { $set: updateData },
            { new: true, upsert: true }
        )

        res.status(200).json({ 
            message: 'Work hour entry updated successfully', 
            workHour 
        })
    } catch (error) {
        logger.error('Error updating work hour entry by employee and date:', error)
        res.status(500).json({ message: 'Error updating work hour entry', error })
    }
})

// Submit work hour entries for approval
router.put('/submit', async (req: Request, res: Response) => {
    logger.info('PUT /workHours/submit - Request received')
    try {
        const { workHourIds } = req.body

        if (!Array.isArray(workHourIds) || workHourIds.length === 0) {
            res.status(400).json({ 
                message: 'workHourIds array is required and must not be empty' 
            })
            return
        }

        const result = await WorkHours.updateMany(
            { 
                _id: { $in: workHourIds.map((id: string) => mongoose.Types.ObjectId.createFromHexString(id)) },
                status: 'draft'
            },
            {
                $set: {
                    status: 'submitted',
                    submittedAt: new Date()
                }
            }
        )

        res.status(200).json({ 
            message: 'Work hour entries submitted successfully',
            result: {
                matched: result.matchedCount,
                modified: result.modifiedCount
            }
        })
    } catch (error) {
        logger.error('Error submitting work hour entries:', error)
        res.status(500).json({ message: 'Error submitting work hour entries', error })
    }
})

// Approve work hour entries
router.put('/approve', async (req: Request, res: Response) => {
    logger.info('PUT /workHours/approve - Request received')
    try {
        const { workHourIds, approvedBy } = req.body

        if (!Array.isArray(workHourIds) || workHourIds.length === 0) {
            res.status(400).json({ 
                message: 'workHourIds array is required and must not be empty' 
            })
            return
        }

        if (!approvedBy) {
            res.status(400).json({ 
                message: 'approvedBy is required' 
            })
            return
        }

        const result = await WorkHours.updateMany(
            { 
                _id: { $in: workHourIds.map((id: string) => mongoose.Types.ObjectId.createFromHexString(id)) },
                status: 'submitted'
            },
            {
                $set: {
                    status: 'approved',
                    approvedBy: mongoose.Types.ObjectId.createFromHexString(approvedBy),
                    approvedAt: new Date()
                }
            }
        )

        res.status(200).json({ 
            message: 'Work hour entries approved successfully',
            result: {
                matched: result.matchedCount,
                modified: result.modifiedCount
            }
        })
    } catch (error) {
        logger.error('Error approving work hour entries:', error)
        res.status(500).json({ message: 'Error approving work hour entries', error })
    }
})

export { router as UpdateWorkHoursRouter }