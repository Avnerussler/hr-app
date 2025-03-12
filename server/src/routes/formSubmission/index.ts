import { Router } from 'express'
import { GetFormSubmissionsRouter } from './get'
import { CreateFormSubmissionRouter } from './create'
import { DeleteFormSubmissionsRouter } from './delete'
import { UpdateFormSubmissionsRouter } from './update'

const router = Router()

router.use('/delete', DeleteFormSubmissionsRouter)
router.use('/get', GetFormSubmissionsRouter)
router.use('/create', CreateFormSubmissionRouter)
router.use('/update', UpdateFormSubmissionsRouter)
export { router as formSubmissionRouter }
