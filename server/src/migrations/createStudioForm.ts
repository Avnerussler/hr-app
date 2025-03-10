import { FormFields } from '../models'
import { checkIfFormExist } from './utils'

export const createStudioForm = async () => {
    try {
        const formName = 'תפקיד בסטודיו'
        const isFormExist = await checkIfFormExist(formName)
        if (isFormExist) {
            console.log(`${formName} exist! passing on migration`)
            return
        }

        const formFields = new FormFields({
            formName,
            formFields: [
                {
                    name: 'fullName',
                    type: 'text',
                    label: 'שם פרטי מלא',
                    placeholder: 'הזן שם פרטי מלא',
                    required: false,
                    defaultValue: '',
                },
                {
                    name: 'currentRoll',
                    type: 'text',
                    label: 'תפקיד נוכחי',
                    placeholder: 'הזן תפקיד נוכחי',
                    required: false,
                    defaultValue: '',
                },
                {
                    name: 'project',
                    type: 'text',
                    label: 'פרוייקט',
                    placeholder: 'הזן פרוייקט',
                    required: false,
                    defaultValue: '',
                },
                {
                    name: 'directCommander',
                    label: 'מפקד ישיר',
                    placeholder: 'הזן מפקד ישיר',
                    required: false,
                    type: 'text',
                    defaultValue: '',
                },
                {
                    name: 'dateOfStartServing',
                    type: 'date',
                    label: 'תאריך תחילת שירות',
                    placeholder: 'הזן תאריך תחילת שירות',
                    required: false,
                    defaultValue: '',
                },
                {
                    name: 'servingTime',
                    type: 'text',
                    label: 'משך שירות צפוי',
                    placeholder: 'הזן משך שירות צפוי',
                    required: false,
                    defaultValue: '',
                },
                {
                    name: 'typeOfEmployment',
                    type: 'select',
                    label: 'סוג העסקה',
                    placeholder: 'בחר סוג העסקה',
                    required: false,
                    defaultValue: '',
                    options: [
                        {
                            label: 'מלאה',
                            name: 'fullEmployment',
                        },
                        {
                            label: 'חלקית',
                            name: 'partEmployment',
                        },
                        {
                            label: 'חד יומיים',
                            name: 'oneOrTwoDays',
                        },
                        { label: 'צו פתוח', name: 'openOrder' },
                        { label: 'צו שגרה', name: 'routineOrder' },
                    ],
                },
                {
                    name: 'workHistoryInTheStudio',
                    type: 'textarea',
                    label: 'הסטוריית עבודה בסטודיו',
                    placeholder: 'הסטוריית עבודה בסטודיו',
                    required: false,
                    defaultValue: '',
                },
                {
                    name: 'notes',
                    type: 'textarea',
                    label: 'הערות',
                    placeholder: 'הערות',
                    required: false,
                    defaultValue: '',
                },
            ],
        })
        await formFields.save()
    } catch (error) {
        console.log(' error:', error)
    }
}
