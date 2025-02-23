import { Request, Response, Router } from 'express'
import multer from 'multer'
import { uploadFileToMinio } from '../../utils'
import { FormSubmissions } from '../../models'
import { parseFields } from '../../utils/parseFields'

const upload = multer({ storage: multer.memoryStorage() })
const router = Router()
router.post('/', upload.single('file'), async (req: Request, res: Response) => {
    try {
        const fileUrl = req.file ? await uploadFileToMinio(req.file) : ''
        const formName = req.body.formName

        const { formName: _, ...formFields } = req.body
        const updatedFormFields = { ...formFields, fileUrl }

        delete updatedFormFields.formId
        const form = await FormSubmissions.create({
            formFields: parseFields(updatedFormFields),
            formId: formFields.formId,
            formName,
        })

        res.status(201).json(form)
    } catch (error) {
        console.error('Error submitting form:', error)
        res.status(500).json({ message: 'Error submitting form', error })
    }
})

export { router as CreateFormSubmissionRouter }
