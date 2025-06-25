import { Router } from 'express'
import { GetFormFieldsRouter } from './get'
const router = Router()

router.use('/get', GetFormFieldsRouter)

export { router as FormFieldsRouter }
