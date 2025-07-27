import { Client } from 'minio'
import dotenv from 'dotenv'

dotenv.config()

const BUCKET_NAME = process.env.MINIO_BUCKET || 'uploads'

let minioClient: Client | null = null
let isMinioAvailable = false

// Initialize MinIO client only if enabled
const initializeMinIO = async () => {
    if (process.env.MINIO_ENABLED === 'false') {
        console.info('MinIO is disabled')
        return
    }

    try {
        minioClient = new Client({
            endPoint: process.env.MINIO_ENDPOINT || 'localhost',
            port: parseInt(process.env.MINIO_PORT || '9000', 10),
            useSSL: process.env.USE_SSL === 'true',
            accessKey: process.env.MINIO_ACCESS_KEY || 'admin',
            secretKey: process.env.MINIO_SECRET_KEY || 'password123',
        })

        // Test connection
        const bucketExists = await minioClient.bucketExists(BUCKET_NAME)
        if (!bucketExists) {
            await minioClient.makeBucket(BUCKET_NAME, 'us-east-1')
            console.info(`✅ Bucket '${BUCKET_NAME}' created`)
        } else {
            console.info(
                `✅ Bucket '${BUCKET_NAME}' already exists, running on http://localhost:${
                    process.env.MINIO_PORT || '9000'
                }`
            )
        }
        isMinioAvailable = true
    } catch (error) {
        console.warn('⚠️ MinIO not available:', error)
        minioClient = null
        isMinioAvailable = false
    }
}

// Initialize on module load but don't crash if it fails
initializeMinIO()

export { minioClient, BUCKET_NAME, isMinioAvailable }
