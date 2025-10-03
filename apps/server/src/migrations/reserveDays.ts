import { FormFields } from '../models'
import logger from '../config/logger'

const CURRENT_VERSION = '1.0.2'

export const createReserveDaysForm = async () => {
    try {
        const formName = 'Reserve Days Management'
        const existingForm = await FormFields.findOne({ formName })

        const formData = {
            version: CURRENT_VERSION,
            description: 'Reserve Days Management',
            icon: 'FiCalendar',
            sections: [
                {
                    id: 'reserveDaysInfo',
                    name: 'פרטי ימי מילואים',
                    fields: [
                        {
                            name: 'employeeName',
                            type: 'selectAutocomplete',
                            label: 'שם העובד',
                            placeholder: 'חפש ובחר עובד',
                            required: true,
                            defaultValue: '',
                            errorMessage: 'שם העובד הוא שדה חובה',
                            foreignFormName: 'Personnel',
                            foreignField: 'firstName',
                        },
                        {
                            name: 'startDate',
                            type: 'date',
                            label: 'תאריך התחלה',
                            placeholder: 'בחר תאריך התחלה',
                            required: true,
                            defaultValue: '',
                            errorMessage: 'תאריך התחלה הוא שדה חובה',
                        },
                        {
                            name: 'endDate',
                            type: 'date',
                            label: 'תאריך סיום',
                            placeholder: 'בחר תאריך סיום',
                            required: true,
                            defaultValue: '',
                            errorMessage: 'תאריך סיום הוא שדה חובה',
                        },
                        {
                            name: 'fundingSource',
                            type: 'select',
                            label: 'מקור מימון',
                            placeholder: 'בחר מקור מימון',
                            required: false,
                            defaultValue: 'internal',
                            options: [
                                {
                                    value: 'internal',
                                    label: 'פנימי',
                                    name: 'internal',
                                },
                                {
                                    value: 'external',
                                    label: 'חיצוני',
                                    name: 'external',
                                },
                            ],
                        },
                        {
                            name: 'fundingName',
                            type: 'text',
                            label: 'שם גורם ממן',
                            placeholder: 'הזן שם גורם ממן',
                            required: false,
                            defaultValue: '',
                        },
                        {
                            name: 'orderType',
                            type: 'radio',
                            label: 'סוג צו',
                            placeholder: 'בחר סוג צו',
                            required: true,
                            defaultValue: '',
                            errorMessage: 'סוג צו הוא שדה חובה',
                            items: [
                                { value: 'open', label: 'צו פתוח' },
                                { value: 'daily', label: 'חד יומי' },
                            ],
                        },

                        {
                            name: 'baseAccessApproval',
                            type: 'select',
                            label: 'אישור כניסה לבסיס',
                            placeholder: 'בחר סטטוס אישור',
                            required: false,
                            defaultValue: 'pending',
                            options: [
                                {
                                    value: 'pending',
                                    label: 'מחכה לאישור',
                                    name: 'pending',
                                },
                                {
                                    value: 'approved',
                                    label: 'אושר',
                                    name: 'approved',
                                },
                                {
                                    value: 'rejected',
                                    label: 'נדחה',
                                    name: 'rejected',
                                },
                            ],
                        },
                        {
                            name: 'vehicleEntry',
                            type: 'radio',
                            label: 'כניסה עם רכב',
                            placeholder: 'האם נכנס עם רכב',
                            required: false,
                            defaultValue: false,
                            items: [
                                { value: true, label: 'כן' },
                                { value: false, label: 'לא' },
                            ],
                        },
                        {
                            name: 'vehicleNumber',
                            type: 'text',
                            label: 'מספר רכב',
                            placeholder: 'הזן מספר רכב',
                            required: false,
                            defaultValue: '',
                        },
                        {
                            name: 'requestStatus',
                            type: 'select',
                            label: 'סטטוס בקשה',
                            placeholder: 'בחר סטטוס בקשה',
                            required: true,
                            defaultValue: 'pending',
                            errorMessage: 'סטטוס בקשה הוא שדה חובה',
                            options: [
                                {
                                    value: 'pending',
                                    label: 'ממתין לטיפול',
                                    name: 'pending',
                                },
                                {
                                    value: 'approved',
                                    label: 'אושר',
                                    name: 'approved',
                                },
                                {
                                    value: 'denied',
                                    label: 'נדחה',
                                    name: 'denied',
                                },
                            ],
                        },
                        {
                            name: 'notes',
                            type: 'textarea',
                            label: 'הערות',
                            placeholder: 'הזן הערות נוספות',
                            required: false,
                            defaultValue: '',
                        },
                    ],
                },
            ],
            overviewFields: [
                'employeeName',
                'requestDate',
                'orderType',
                'fundingSource',
                'requestStatus',
                'startDate',
                'endDate',
            ],
        }

        if (existingForm) {
            const existingVersion = existingForm.version || '1.0.0'
            if (existingVersion === CURRENT_VERSION) {
                logger.info(
                    `${formName} form is up to date (v${CURRENT_VERSION})`
                )
                return
            }
            logger.info(
                `Updating ${formName} form from v${existingVersion} to v${CURRENT_VERSION}`
            )
            await FormFields.updateOne({ formName }, formData)
        } else {
            logger.info(`Creating new ${formName} form (v${CURRENT_VERSION})`)
            const formDocument = new FormFields({
                formName,
                ...formData,
            })
            await formDocument.save()
        }
    } catch (error) {
        logger.error('Reserve Days form migration error:', error)
    }
}
