import { Router } from 'express'
import { FormFieldsRouter } from './formFields'
import { formSubmissionRouter } from './formSubmission'
import { fileUploadRouter } from './file'
const router = Router()

router.use('/formFields', FormFieldsRouter)
router.use('/formSubmission', formSubmissionRouter)
router.use('/file', fileUploadRouter)

export default router
