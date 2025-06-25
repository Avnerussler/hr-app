import { FormFields } from '../models'

export const checkIfFormExist = async (formName: string): Promise<boolean> => {
    return !!(await FormFields.exists({ formName }))
}
