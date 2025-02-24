import { Router } from 'express'
import { uploadFile } from './upload'

const router = Router()

router.use('/', uploadFile)

export { router as fileUploadRouter }
