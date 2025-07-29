import { Request, Response, Router } from 'express'
import { FormSubmissions } from '../../models'
import mongoose from 'mongoose'

const router = Router()
router.post('/', async (req: Request, res: Response) => {
    console.log('POST /formSubmission/update - Request received')
    try {
        const { id, formData } = req.body
        const updatedForm = await FormSubmissions.findByIdAndUpdate(
            mongoose.Types.ObjectId.createFromHexString(id),
            { $set: { formData } },
            { new: true } // Return the updated document
        )

        if (!updatedForm) {
            res.status(404).json({ message: 'Form not found' })
        }
        res.status(200).json({ form: updatedForm })
    } catch (error) {
        console.error('Error submitting form:', error)
        res.status(500).json({ message: 'Error submitting form', error })
    }
})

export { router as UpdateFormSubmissionsRouter }
