import { FormFields } from '../models'
import logger from '../config/logger'

const CURRENT_VERSION = '1.0.3'

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
                            name: 'reserveDays',
                            type: 'calendar',
                            label: 'ימי מילואים',
                            placeholder: 'פתיחה בלוח שנה - סימון ימים רלוונטים',
                            required: true,
                            defaultValue: '',
                            errorMessage: 'ימי מילואים הם שדה חובה',
                        },
                        {
                            name: 'requestDate',
                            type: 'date',
                            label: 'תאריך הבקשה',
                            placeholder: 'בחר תאריך הבקשה',
                            required: true,
                            defaultValue: '',
                            errorMessage: 'תאריך הבקשה הוא שדה חובה',
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
                            name: 'orderNumber',
                            type: 'text',
                            label: 'מספר צו',
                            placeholder: 'הזן מספר צו',
                            required: false,
                            defaultValue: '',
                        },
                        {
                            name: 'reserveUnit',
                            type: 'text',
                            label: 'יחידת מילואים',
                            placeholder: 'הזן יחידת מילואים',
                            required: false,
                            defaultValue: '',
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
                                    value: 'has_tag',
                                    label: 'יש תג',
                                    name: 'has_tag',
                                },
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
                'orderNumber',
                'reserveUnit',
                'baseAccessApproval',
                'vehicleEntry',
                'vehicleNumber',
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
