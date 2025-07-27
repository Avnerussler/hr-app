import { FormFields } from '../models'
import { checkIfFormExist } from './utils'

export const createStudioForm = async () => {
    try {
        const formName = 'Project Management'
        const isFormExist = await checkIfFormExist(formName)
        if (isFormExist) {
            console.log(`${formName} exist! passing on migration`)
            return
        }

        const formDocument = new FormFields({
            formName,
            sections: [
                {
                    id: 'studioRole',
                    name: 'Studio Role',
                    fields: [
                        {
                            _id: 'fullName',
                            name: 'fullName',
                            type: 'select',
                            foreignFormId: '67cf2ff809fc7f33e5a2caf9',
                            foreignField: 'fullName',
                            label: 'שם פרטי מלא',
                            placeholder: 'הזן שם פרטי מלא',
                            required: false,
                            defaultValue: '',
                            options: [],
                        },
                        {
                            _id: 'currentRoll',
                            name: 'currentRoll',
                            type: 'text',
                            label: 'תפקיד נוכחי',
                            placeholder: 'הזן תפקיד נוכחי',
                            required: false,
                            defaultValue: '',
                        },
                        {
                            _id: 'project',
                            name: 'project',
                            type: 'text',
                            label: 'פרוייקט',
                            placeholder: 'הזן פרוייקט',
                            required: false,
                            defaultValue: '',
                        },
                        {
                            _id: 'directCommander',
                            name: 'directCommander',
                            type: 'text',
                            label: 'מפקד ישיר',
                            placeholder: 'הזן מפקד ישיר',
                            required: false,
                            defaultValue: '',
                        },
                        {
                            _id: 'dateOfStartServing',
                            name: 'dateOfStartServing',
                            type: 'date',
                            label: 'תאריך תחילת שירות',
                            placeholder: 'הזן תאריך תחילת שירות',
                            required: false,
                            defaultValue: '',
                        },
                        {
                            _id: 'servingTime',
                            name: 'servingTime',
                            type: 'text',
                            label: 'משך שירות צפוי',
                            placeholder: 'הזן משך שירות צפוי',
                            required: false,
                            defaultValue: '',
                        },
                        {
                            _id: 'typeOfEmployment',
                            name: 'typeOfEmployment',
                            type: 'select',
                            label: 'סוג העסקה',
                            placeholder: 'בחר סוג העסקה',
                            required: false,
                            defaultValue: '',
                            options: [
                                {
                                    value: 'fullEmployment',
                                    label: 'מלאה',
                                    name: 'fullEmployment',
                                },
                                {
                                    value: 'partEmployment',
                                    label: 'חלקית',
                                    name: 'partEmployment',
                                },
                                {
                                    value: 'oneOrTwoDays',
                                    label: 'חד יומיים',
                                    name: 'oneOrTwoDays',
                                },
                                {
                                    value: 'openOrder',
                                    label: 'צו פתוח',
                                    name: 'openOrder',
                                },
                                {
                                    value: 'routineOrder',
                                    label: 'צו שגרה',
                                    name: 'routineOrder',
                                },
                            ],
                        },
                        {
                            _id: 'workHistoryInTheStudio',
                            name: 'workHistoryInTheStudio',
                            type: 'textarea',
                            label: 'הסטוריית עבודה בסטודיו',
                            placeholder: 'הסטוריית עבודה בסטודיו',
                            required: false,
                            defaultValue: '',
                        },
                        {
                            _id: 'notes',
                            name: 'notes',
                            type: 'textarea',
                            label: 'הערות',
                            placeholder: 'הערות',
                            required: false,
                            defaultValue: '',
                        },
                    ],
                },
            ],
        })

        await formDocument.save()
    } catch (error) {
        console.log(' error:', error)
    }
}
