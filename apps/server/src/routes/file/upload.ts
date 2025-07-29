import { Request, Response, Router } from 'express'
import { uploadFileToMinio } from '../../utils'
import { isMinioAvailable } from '../../config/minio'
import logger from '../../config/logger'

const router = Router()
router.get('/generate-presigned-url', async (req: Request, res: Response) => {
    logger.info('GET /file/generate-presigned-url - Request received')
    try {
        const { filename, filetype } = req.query

        if (!filename || !filetype) {
            logger.error(`FileName:${filename}. FileType:${filetype}.`)
            throw Error('filename or filetype not exist')
        }

        if (!isMinioAvailable) {
            res.status(503).json({ 
                message: 'File upload service is not available. MinIO is not configured or running.',
                error: 'MinIO unavailable' 
            })
            return
        }

        const presignedUrl = await uploadFileToMinio(
            filename as string,
            filetype as string
        )

        const bucketUrl = `${process.env.MINIO_ENDPOINT}:${process.env.MINIO_PORT}`
        const bucketName = process.env.MINIO_BUCKET

        if (!bucketUrl || !bucketName) {
            logger.error(`bucketUrl:${bucketUrl}. bucketName:${bucketName}.`)
            throw Error('bucketUrl or bucketName not exist')
        }

        res.status(201).send({ presignedUrl, bucketUrl, bucketName })
    } catch (error) {
        logger.error('Error submitting form:', error)
        res.status(500).json({ message: 'Error submitting form', error })
    }
})

export { router as uploadFile }
