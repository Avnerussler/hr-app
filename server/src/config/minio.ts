import { Client } from 'minio'
import dotenv from 'dotenv'

dotenv.config()

// Initialize MinIO client
const minioClient = new Client({
    endPoint: process.env.MINIO_ENDPOINT || 'localhost',
    port: parseInt(process.env.MINIO_PORT || '9000', 10),
    useSSL: process.env.USE_SSL === 'true', // Set to `true` if using HTTPS
    accessKey: process.env.MINIO_ACCESS_KEY || 'admin',
    secretKey: process.env.MINIO_SECRET_KEY || 'password123',
})

const BUCKET_NAME = process.env.MINIO_BUCKET || 'uploads'

// Ensure the bucket exists
const ensureBucketExists = async () => {
    try {
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
    } catch (error) {
        console.error('❌ Error ensuring bucket:', error)
    }
}

ensureBucketExists()

export { minioClient, BUCKET_NAME }
