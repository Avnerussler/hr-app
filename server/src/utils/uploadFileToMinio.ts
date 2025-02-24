import { minioClient, BUCKET_NAME } from '../config/minio'

export const uploadFileToMinio = async (
    fileName: string,
    fileType: string
): Promise<string> => {
    if (!fileName || !fileType) return ''

    return await minioClient.presignedPutObject(BUCKET_NAME, fileName, 60 * 60)
}
