import { Request, Response, Router } from 'express'
import { FormSubmissions } from '../../models'

const router = Router()
router.post('/', async (req: Request, res: Response) => {
    console.log('POST /formSubmission - Request received')
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
        console.error('Error submitting form:', error)
        res.status(500).json({ message: 'Error submitting form', error })
    }
})

export { router as CreateFormSubmissionRouter }
