import { FormFields } from '../models'
import logger from '../config/logger'

const CURRENT_VERSION = '1.1.8'

export const createPersonalForm = async () => {
    try {
        const formName = 'Personnel'
        const existingForm = await FormFields.findOne({ formName })

        const formData = {
            version: CURRENT_VERSION,
            description: 'Employee Management',
            icon: 'FiUsers',
            sections: [
                {
                    id: 'personalInformation',
                    name: 'מידע אישי',
                    fields: [
                        {
                            name: 'firstName',
                            type: 'text',
                            label: 'שם פרטי',
                            placeholder: 'הזן שם פרטי',
                            required: true,
                            defaultValue: '',
                            errorMessage: 'שם פרטי הוא שדה חובה',
                        },
                        {
                            name: 'lastName',
                            type: 'text',
                            label: 'שם משפחה',
                            placeholder: 'הזן שם משפחה',
                            required: true,
                            defaultValue: '',
                            errorMessage: 'שם משפחה הוא שדה חובה',
                        },
                        {
                            name: 'userId',
                            type: 'number',
                            label: 'תעודת זהות',
                            placeholder: 'הזן תעודת זהות',
                            required: false,
                            defaultValue: '',
                        },

                        {
                            name: 'phone',
                            type: 'tel',
                            label: 'טלפון',
                            placeholder: 'הזן מספר טלפון',
                            required: false,
                            defaultValue: '',
                        },
                        {
                            name: 'email',
                            type: 'email',
                            label: 'אימייל',
                            placeholder: 'הזן אימייל',
                            required: false,
                            defaultValue: '',
                        },
                        {
                            name: 'city',
                            type: 'text',
                            label: 'עיר',
                            placeholder: 'הזן את שם עיר המגורים',
                            required: false,
                            defaultValue: '',
                        },

                        {
                            name: 'linkedin',
                            type: 'text',
                            label: 'לינקדאין',
                            placeholder: 'הזן את שם המשתמש לינקדאין',
                            required: false,
                            defaultValue: '',
                        },
                        {
                            name: 'isActive',
                            type: 'radio',
                            label: 'סטטוס',
                            placeholder: 'סטטוס',
                            required: false,
                            defaultValue: true,
                            items: [
                                { value: true, label: 'פעיל' },
                                { value: false, label: 'לא פעיל' },
                            ],
                        },
                    ],
                },
                {
                    id: 'professionalDetails',
                    name: 'פרטים מקצועיים',
                    fields: [
                        {
                            name: 'FieldOfExpertise',
                            type: 'select',
                            label: 'תחום מקצועי',
                            placeholder: 'תחום מקצועי',
                            required: false,
                            defaultValue: '',
                            options: [
                                {
                                    value: 'Algorithms',
                                    label: 'אלגוריתמיקה',
                                    name: 'Algorithms',
                                },
                                {
                                    value: 'Frontend',
                                    label: 'פרונט',
                                    name: 'Frontend',
                                },
                                {
                                    value: 'Backend',
                                    label: 'בקנד',
                                    name: 'Backend',
                                },
                                { value: 'RF', label: 'RF', name: 'RF' },
                                { value: 'Other', label: 'אחר', name: 'Other' },
                            ],
                        },
                        {
                            name: 'Experience',
                            type: 'select',
                            label: 'שנות ניסיון',
                            placeholder: 'שנות ניסיון',
                            required: false,
                            defaultValue: '',
                            options: [
                                {
                                    value: '0-1 years',
                                    label: '0-1 שנים',
                                    name: '0-1 years',
                                },
                                {
                                    value: '1-3 years',
                                    label: '1-3 שנים',
                                    name: '1-3 years',
                                },
                                {
                                    value: '3-5 years',
                                    label: '3-5 שנים',
                                    name: '3-5 years',
                                },
                                {
                                    value: '5+ years',
                                    label: '5+ שנים',
                                    name: '5+ years',
                                },
                            ],
                        },
                        {
                            name: 'workPlace',
                            type: 'text',
                            label: 'מקום עבודה',
                            placeholder: 'הזן את מקום העבודה',
                            required: false,
                            defaultValue: '',
                        },
                        {
                            name: 'currentPosition',
                            type: 'text',
                            label: 'תפקיד נוכחי',
                            placeholder: 'תפקיד נוכחי',
                            required: false,
                            defaultValue: '',
                        },
                        {
                            name: 'Resume',
                            type: 'file',
                            label: 'רזומה',
                            placeholder: 'רזומה',
                            required: false,
                            defaultValue: '',
                        },
                    ],
                },
                {
                    id: 'militaryInformation',
                    name: 'מידע צבאי',
                    fields: [
                        {
                            name: 'personalNumber',
                            type: 'number',
                            label: 'מספר אישי',
                            placeholder: 'הזן מספר אישי',
                            required: false,
                            defaultValue: '',
                        },
                        {
                            name: 'RecruitmentYear',
                            type: 'date',
                            label: 'שנת גיוס',
                            placeholder: 'שנת גיוס',
                            required: false,
                            defaultValue: '',
                        },
                        {
                            name: 'DismissYear',
                            type: 'date',
                            label: 'שנת שחרור',
                            placeholder: 'שנת שחרור',
                            required: false,
                            defaultValue: '',
                        },
                        {
                            name: 'reserveUnit',
                            type: 'text',
                            label: 'שיוך יחידה במילואים',
                            placeholder: 'שיוך יחידה במילואים',
                            required: false,
                            defaultValue: '',
                        },
                        {
                            name: 'projectAssign',
                            type: 'text',
                            label: 'שיוך לפרויקט',
                            placeholder: 'שיוך לפרויקט',
                            required: false,
                            defaultValue: '',
                        },
                        {
                            name: 'rule',
                            type: 'text',
                            label: 'תפקיד',
                            placeholder: 'תפקיד',
                            required: false,
                            defaultValue: '',
                        },
                        {
                            name: 'directBoss',
                            type: 'text',
                            label: 'מנהל ישיר',
                            placeholder: 'מנהל ישיר',
                            required: false,
                            defaultValue: '',
                        },
                        {
                            name: 'isOfficer',
                            type: 'radio',
                            label: 'מעמד קצונה',
                            placeholder: 'מעמד קצונה',
                            required: false,
                            defaultValue: '',
                            items: [
                                { value: true, label: 'קצין' },
                                { value: false, label: 'לא קצין' },
                            ],
                        },
                        {
                            name: 'classificationClass',
                            type: 'text',
                            label: 'רמת סיווג',
                            placeholder: 'רמת סיווג',
                            required: false,
                            defaultValue: '',
                            options: [
                                {
                                    value: '1',
                                    label: '1',
                                    name: '1',
                                },
                                {
                                    value: '2',
                                    label: '2',
                                    name: '2',
                                },
                                {
                                    value: '3',
                                    label: '3',
                                    name: '3',
                                },
                                {
                                    value: 'no',
                                    label: 'לא מסווג',
                                    name: 'no',
                                },
                            ],
                        },
                        {
                            name: 'canBeRecited',
                            type: 'radio',
                            label: 'האם ניתן לזמן למילואים',
                            placeholder: 'האם ניתן לזמן למילואים',
                            required: false,
                            defaultValue: '',
                            items: [
                                { value: true, label: 'כן' },
                                { value: false, label: 'לא' },
                            ],
                        },
                        {
                            name: 'activeOrderToday',
                            type: 'radio',
                            label: 'צו פעיל היום',
                            placeholder: 'צו פעיל היום',
                            required: false,
                            defaultValue: '',
                            items: [
                                { value: true, label: 'כן' },
                                { value: false, label: 'לא' },
                            ],
                        },
                        {
                            name: 'reserveCategory',
                            type: 'select',
                            label: 'אפיון',
                            placeholder: 'בחר אפיון',
                            required: false,
                            defaultValue: '',
                            options: [
                                {
                                    value: 'Content Specialist',
                                    label: 'מומחה תוכן',
                                    name: 'Content Specialist',
                                },
                                {
                                    value: 'Consultant',
                                    label: 'יועץ',
                                    name: 'Consultant',
                                },
                                {
                                    value: 'Team Leader',
                                    label: 'ראש צוות',
                                    name: 'Team Leader',
                                },
                                { value: 'Other', label: 'אחר', name: 'Other' },
                            ],
                        },
                    ],
                },
                {
                    id: 'educationAndSkills',
                    name: 'השכלה וכישורים',
                    fields: [
                        {
                            name: 'degree',
                            type: 'text',
                            label: 'תואר אקדמי',
                            placeholder: 'תואר אקדמי',
                            required: false,
                            defaultValue: '',
                        },
                        {
                            name: 'University',
                            type: 'text',
                            label: 'מוסד לימודים',
                            placeholder: 'מוסד לימודים',
                            required: false,
                            defaultValue: '',
                        },
                        {
                            name: 'studyArea',
                            type: 'text',
                            label: 'תחום לימודים',
                            placeholder: 'תחום לימודים',
                            required: false,
                            defaultValue: '',
                        },
                        {
                            name: 'yearOfGradation',
                            type: 'date',
                            label: 'תאריך סיום לימודים',
                            placeholder: 'תאריך סיום לימודים',
                            required: false,
                            defaultValue: '',
                        },
                        {
                            name: 'extraCourses',
                            type: 'textarea',
                            label: 'קורסים והסמכות נוספות',
                            placeholder: 'קורסים והסמכות נוספות',
                            required: false,
                            defaultValue: '',
                        },
                        {
                            name: 'workExperience',
                            type: 'textarea',
                            label: 'ניסיון תעסוקתי',
                            placeholder: 'ניסיון תעסוקתי',
                            required: false,
                            defaultValue: '',
                        },
                        {
                            name: 'talentAndSkills',
                            type: 'textarea',
                            label: 'כישרון ומיומניות',
                            placeholder: 'כישרון ומיומניות',
                            required: false,
                            defaultValue: '',
                        },
                        {
                            name: 'referralSource',
                            type: 'text',
                            label: 'מקור הפניה',
                            placeholder: 'מקור הפניה',
                            required: false,
                            defaultValue: '',
                        },
                    ],
                },
                {
                    id: 'attendance',
                    name: 'נוכחות',
                    fields: [
                        {
                            name: 'attendanceHistory',
                            type: 'attendance',
                            label: 'היסטוריית נוכחות',
                            placeholder: 'הזן את פרטי הנוכחות',
                            required: false,
                            defaultValue: '',
                        },
                    ],
                },
            ],
            overviewFields: [
                'firstName',
                'lastName',
                'personalNumber',
                'projectAssign',
                'reserveCategory',
                'rule',
                'directBoss',
                'activeOrderToday',
                'isActive',
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
        logger.error('Personnel form migration error:', error)
    }
}
