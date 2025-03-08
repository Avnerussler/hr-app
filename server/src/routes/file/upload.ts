import { Request, Response, Router } from 'express'
import { uploadFileToMinio } from '../../utils'

const router = Router()
router.get('/generate-presigned-url', async (req: Request, res: Response) => {
    try {
        const { filename, filetype } = req.query

        if (!filename || !filetype) {
            console.error(`FileName:${filename}. FileType:${filetype}.`)
            throw Error('filename or filetype not exist')
        }
        const presignedUrl = await uploadFileToMinio(
            filename as string,
            filetype as string
        )

        const bucketUrl = `${process.env.MINIO_ENDPOINT}:${process.env.MINIO_PORT}`
        const bucketName = process.env.MINIO_BUCKET

        if (!bucketUrl || !bucketName) {
            console.error(`bucketUrl:${bucketUrl}. bucketName:${bucketName}.`)
            throw Error('bucketUrl or bucketName not exist')
        }

        res.status(201).send({ presignedUrl, bucketUrl, bucketName })
    } catch (error) {
        console.error('Error submitting form:', error)
        res.status(500).json({ message: 'Error submitting form', error })
    }
})

export { router as uploadFile }
