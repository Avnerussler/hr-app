import { Router } from 'express'
import { GetFormSubmissionsRouter } from './get'
import { CreateFormSubmissionRouter } from './create'
import { DeleteFormSubmissionsRouter } from './delete'
import { UpdateFormSubmissionsRouter } from './update'

const router = Router()

router.use('/delete', DeleteFormSubmissionsRouter)
router.use('/create', CreateFormSubmissionRouter)
router.use('/update', UpdateFormSubmissionsRouter)
router.use('/', GetFormSubmissionsRouter)
export { router as formSubmissionRouter }
