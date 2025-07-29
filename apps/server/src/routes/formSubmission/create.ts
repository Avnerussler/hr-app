import { Request, Response, Router } from 'express'
import { FormSubmissions } from '../../models'
import logger from '../../config/logger'

const router = Router()
router.post('/', async (req: Request, res: Response) => {
    logger.info('POST /formSubmission - Request received')
    try {
        const { formData, formId, formName } = req.body

        const form = await FormSubmissions.create({
            formData,
            formId,
            formName,
        })

        await form.save()
        res.status(201).json({ form })
    } catch (error) {
        logger.error('Error submitting form:', error)
        res.status(500).json({ message: 'Error submitting form', error })
    }
})

export { router as CreateFormSubmissionRouter }
