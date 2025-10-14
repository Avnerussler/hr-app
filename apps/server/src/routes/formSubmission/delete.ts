import { FormSubmissions } from '../../models'
import { Request, Response, Router } from 'express'
import logger from '../../config/logger'
import { bidirectionalSyncService } from '../../services/bidirectionalSync'

const router = Router()

router.delete('/:id', async (req: Request, res: Response) => {
    logger.info(`DELETE /formSubmission/${req.params.id} - Request received`)
    try {
        const id = req.params.id

        // Get the form before soft deletion to access its data for bidirectional sync
        const formToDelete = await FormSubmissions.findById(id)
        if (!formToDelete) {
            logger.warn(`Form with ID ${id} not found for deletion`)
            res.status(404).json({ message: 'Form not found' })
            return
        }

        // Check if already deleted
        if (formToDelete.isDeleted) {
            logger.warn(`Form with ID ${id} is already deleted`)
            res.status(400).json({ message: 'Form is already deleted' })
            return
        }

        // Store the form data and metadata before deletion
        const formData = formToDelete.formData
        const formId = formToDelete.formId.toString()
        const formName = formToDelete.formName

        // Soft delete the form by setting isDeleted flag to true
        const forms = await FormSubmissions.findByIdAndUpdate(
            id,
            { isDeleted: true },
            { new: true }
        )

        // Handle bidirectional sync after successful deletion
        await bidirectionalSyncService.handleBidirectionalSyncOnDelete(
            formId,
            formName,
            id,
            formData
        )

        res.status(200).json({ forms })
    } catch (error) {
        logger.error('Error deleting form:', error)
        res.status(500).json({ message: 'Error deleting form', error })
    }
})
export { router as DeleteFormSubmissionsRouter }
