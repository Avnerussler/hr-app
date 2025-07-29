import { Router, Request, Response } from 'express'
import { FormFieldsRouter } from './formFields'
import { formSubmissionRouter } from './formSubmission'
import { fileUploadRouter } from './file'
const router = Router()

router.get('/health', (req: Request, res: Response) => {
    console.log('GET /health - Request received')
    res.status(200).json({ 
        status: 'OK',
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
    })
})

router.use('/formFields', FormFieldsRouter)
router.use('/formSubmission', formSubmissionRouter)
router.use('/file', fileUploadRouter)

export default router
