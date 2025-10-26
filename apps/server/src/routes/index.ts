import { Router } from 'express'
import { FormFieldsRouter } from './formFields'
import { formSubmissionRouter } from './formSubmission'
import { fileUploadRouter } from './file'
import { quotaRouter } from './quota'
import { statisticsRouter } from './statistics'
const router = Router()

router.use('/formFields', FormFieldsRouter)
router.use('/formSubmission', formSubmissionRouter)
router.use('/file', fileUploadRouter)
router.use('/quotas', quotaRouter)
router.use('/statistics', statisticsRouter)

export default router
