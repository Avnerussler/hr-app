import { Request, Response, Router } from 'express'
import { FormSubmissions } from '../../models'
import mongoose from 'mongoose'
import logger from '../../config/logger'

const router = Router()
router.post('/', async (req: Request, res: Response) => {
    logger.info('POST /formSubmission/update - Request received')
    try {
        const { id, formData } = req.body
        const updatedForm = await FormSubmissions.findByIdAndUpdate(
            mongoose.Types.ObjectId.createFromHexString(id),
            { $set: { formData } },
            { new: true } // Return the updated document
        )

        if (!updatedForm) {
            logger.warn(`Form with ID ${id} not found for update`)
            res.status(404).json({ message: 'Form not found' })
        }
        res.status(200).json({ form: updatedForm })
    } catch (error) {
        logger.error('Error submitting form:', error)
        res.status(500).json({ message: 'Error submitting form', error })
    }
})

export { router as UpdateFormSubmissionsRouter }
