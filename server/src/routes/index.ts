import { Router } from 'express'
import { FormFieldsRouter } from './formFields'
import { formSubmissionRouter } from './formSubmission'
const router = Router()

router.use('/formFields', FormFieldsRouter)
router.use('/formSubmission', formSubmissionRouter)

export default router
