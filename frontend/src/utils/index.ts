import { FormFields } from '@/types/fieldsType'

export const updateObjectInArray = (
    array: { _id: string; formName: string; formData: FormFields[] }[],
    objectId: string,
    updatedFields: object
) => {
    return array.map((obj) =>
        obj._id === objectId ? { ...obj, ...updatedFields } : obj
    )
}
