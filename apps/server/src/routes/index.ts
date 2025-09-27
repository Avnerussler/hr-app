import { Router, Request, Response } from 'express'
import { FormFieldsRouter } from './formFields'
import { formSubmissionRouter } from './formSubmission'
import { fileUploadRouter } from './file'
import { quotaRouter } from './quota'
const router = Router()

router.use('/formFields', FormFieldsRouter)
router.use('/formSubmission', formSubmissionRouter)
router.use('/file', fileUploadRouter)
router.use('/quotas', quotaRouter)

export default router
