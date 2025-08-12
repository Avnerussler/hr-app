import { FormFields } from '../models'
import { checkIfFormExist } from './utils'
import logger from '../config/logger'

export const createPersonalForm = async () => {
    try {
        const formName = 'Personal'
        const isFormExist = await checkIfFormExist(formName)
        if (isFormExist) {
            logger.info(`${formName} exist! passing on migration`)
            return
        }
        logger.info('Running Personal form migration')

        const formDocument = new FormFields({
            formName,
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
                        },
                        {
                            name: 'lastName',
                            type: 'text',
                            label: 'שם משפחה',
                            placeholder: 'הזן שם משפחה',
                            required: true,
                            defaultValue: '',
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
                            name: 'personalNumber',
                            type: 'number',
                            label: 'מספר אישי',
                            placeholder: 'הזן מספר אישי',
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
                    ],
                },
                {
                    id: 'professionalDetails',
                    name: 'פרטים מקצועיים',
                    fields: [
                        {
                            name: 'Category',
                            type: 'multipleSelect',
                            label: 'קטגוריה',
                            placeholder: 'בחר קטגוריה',
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
                'Email',
                'Phone',
                'Category',
                'FieldOfExpertise',
                'Experience',
                'currentPosition',
            ],
        })

        await formDocument.save()
    } catch (error) {
        logger.error('Personal form migration error:', error)
    }
}
