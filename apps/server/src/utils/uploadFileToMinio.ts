import { minioClient, BUCKET_NAME, isMinioAvailable } from '../config/minio'

export const uploadFileToMinio = async (
    fileName: string,
    fileType: string
): Promise<string> => {
    if (!fileName || !fileType) return ''
    
    if (!isMinioAvailable || !minioClient) {
        throw new Error('MinIO is not available')
    }

    return await minioClient.presignedPutObject(BUCKET_NAME, fileName, 60 * 60)
}
