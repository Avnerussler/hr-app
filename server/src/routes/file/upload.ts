import { Request, Response, Router } from 'express'
import { uploadFileToMinio } from '../../utils'

const router = Router()
router.get('/generate-presigned-url', async (req: Request, res: Response) => {
    try {
        const { fileName, fileType } = req.query
        const fileUrl = await uploadFileToMinio(
            fileName as string,
            fileType as string
        )

        res.status(201).send(fileUrl)
    } catch (error) {
        console.error('Error submitting form:', error)
        res.status(500).json({ message: 'Error submitting form', error })
    }
})

export { router as uploadFile }
