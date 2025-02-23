import { minioClient, BUCKET_NAME } from '../config/minio'
import { Readable } from 'stream'

const MINIO_ENDPOINT = 'http://localhost:9001'
export const uploadFileToMinio = async (
    file: Express.Multer.File
): Promise<string> => {
    if (!file) return ''

    const fileStream = Readable.from(file.buffer)
    const fileName = `${Date.now()}-${file.originalname}`

    await minioClient.putObject(BUCKET_NAME, fileName, fileStream, file.size, {
        'Content-Type': file.mimetype,
        'Content-Disposition': 'inline',
    })

    return `${MINIO_ENDPOINT}/${BUCKET_NAME}/${fileName}`
}
