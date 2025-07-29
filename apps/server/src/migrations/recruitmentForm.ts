import { FormFields } from '../models'
import { checkIfFormExist } from './utils'
import logger from '../config/logger'

export const createRecruitForm = async () => {
    try {
        const formName = 'Recruitment Form'
        const isFormExist = await checkIfFormExist(formName)
        if (isFormExist) {
            logger.info(`${formName} exist! passing on migration`)
            return
        }
        logger.info('Running on create form migration')

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
                            _id: 'fullName',
                            name: 'fullName',
                            type: 'text',
                            label: 'שם מלא',
                            placeholder: 'הזן שם מלא',
                            required: false,
                            defaultValue: '',
                        },
                        {
                            _id: 'userId',
                            name: 'userId',
                            type: 'number',
                            label: 'תעודת זהות',
                            placeholder: 'הזן תעודת זהות',
                            required: false,
                            defaultValue: '',
                        },
                        {
                            _id: 'maritalStatus',
                            name: 'maritalStatus',
                            type: 'select',
                            label: 'מצב משפחתי',
                            placeholder: 'בחר מצב משפחתי',
                            required: false,
                            defaultValue: '',
                            options: [
                                {
                                    value: 'married',
                                    label: 'נשוי.ה',
                                    name: 'married',
                                },
                                {
                                    value: 'single',
                                    label: 'רווק.ה',
                                    name: 'single',
                                },
                                { value: 'other', label: 'אחר', name: 'other' },
                            ],
                        },
                        {
                            _id: 'City',
                            name: 'City',
                            type: 'text',
                            label: 'עיר',
                            placeholder: 'הזן את שם העיר שלך',
                            required: false,
                            defaultValue: '',
                        },
                        {
                            _id: 'Phone',
                            name: 'Phone',
                            type: 'tel',
                            label: 'טלפון',
                            placeholder: 'Enter your phone number',
                            required: false,
                            defaultValue: '',
                        },
                        {
                            _id: 'Email',
                            name: 'Email',
                            type: 'email',
                            label: 'אימייל',
                            placeholder: 'Enter your email',
                            required: false,
                            defaultValue: '',
                        },
                        {
                            _id: 'Linkedin',
                            name: 'Linkedin',
                            type: 'text',
                            label: 'לינקדאין',
                            placeholder: 'הזן את שם המשתמש בלינקדאין',
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
                            _id: 'Category',
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
                            _id: 'FieldOfExpertise',
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
                            _id: 'Experience',
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
                            _id: 'workPlace',
                            name: 'workPlace',
                            type: 'text',
                            label: 'מקום עבודה',
                            placeholder: 'הזן את מקום העבודה',
                            required: false,
                            defaultValue: '',
                        },
                        {
                            _id: 'currentPosition',
                            name: 'currentPosition',
                            type: 'text',
                            label: 'תפקיד נוכחי',
                            placeholder: 'תפקיד נוכחי',
                            required: false,
                            defaultValue: '',
                        },
                        {
                            _id: 'Resume',
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
                            _id: 'RecruitmentYear',
                            name: 'RecruitmentYear',
                            type: 'date',
                            label: 'שנת גיוס',
                            placeholder: 'שנת גיוס',
                            required: false,
                            defaultValue: '',
                        },
                        {
                            _id: 'DismissYear',
                            name: 'DismissYear',
                            type: 'date',
                            label: 'שנת שחרור',
                            placeholder: 'שנת שחרור',
                            required: false,
                            defaultValue: '',
                        },
                        {
                            _id: 'reserveUnit',
                            name: 'reserveUnit',
                            type: 'text',
                            label: 'שיוך יחידה במילואים',
                            placeholder: 'שיוך יחידה במילואים',
                            required: false,
                            defaultValue: '',
                        },
                        {
                            _id: 'hasClassification',
                            name: 'hasClassification',
                            type: 'radio',
                            label: 'האם מסווג',
                            placeholder: 'האם מסווג',
                            required: false,
                            defaultValue: '',
                            items: [
                                { value: 'yes', label: 'כן' },
                                { value: 'no', label: 'לא' },
                            ],
                        },
                        {
                            _id: 'classificationClass',
                            name: 'classificationClass',
                            type: 'text',
                            label: 'רמת סיווג',
                            placeholder: 'רמת סיווג',
                            required: false,
                            defaultValue: '',
                        },
                        {
                            _id: 'canBeRecited',
                            name: 'canBeRecited',
                            type: 'radio',
                            label: 'האם ניתן לזמן למילואים',
                            placeholder: 'האם ניתן לזמן למילואים',
                            required: false,
                            defaultValue: '',
                            items: [
                                { value: 'yes', label: 'כן' },
                                { value: 'no', label: 'לא' },
                            ],
                        },
                    ],
                },
                {
                    id: 'educationAndSkills',
                    name: 'השכלה וכישורים',
                    fields: [
                        {
                            _id: 'degree',
                            name: 'degree',
                            type: 'text',
                            label: 'תואר אקדמי',
                            placeholder: 'תואר אקדמי',
                            required: false,
                            defaultValue: '',
                        },
                        {
                            _id: 'University',
                            name: 'University',
                            type: 'text',
                            label: 'מוסד לימודים',
                            placeholder: 'מוסד לימודים',
                            required: false,
                            defaultValue: '',
                        },
                        {
                            _id: 'studyArea',
                            name: 'studyArea',
                            type: 'text',
                            label: 'תחום לימודים',
                            placeholder: 'תחום לימודים',
                            required: false,
                            defaultValue: '',
                        },
                        {
                            _id: 'yearOfGradation',
                            name: 'yearOfGradation',
                            type: 'date',
                            label: 'תאריך סיום לימודים',
                            placeholder: 'תאריך סיום לימודים',
                            required: false,
                            defaultValue: '',
                        },
                        {
                            _id: 'extraCourses',
                            name: 'extraCourses',
                            type: 'textarea',
                            label: 'קורסים והסמכות נוספות',
                            placeholder: 'קורסים והסמכות נוספות',
                            required: false,
                            defaultValue: '',
                        },
                        {
                            _id: 'workExperience',
                            name: 'workExperience',
                            type: 'textarea',
                            label: 'ניסיון תעסוקתי',
                            placeholder: 'ניסיון תעסוקתי',
                            required: false,
                            defaultValue: '',
                        },
                        {
                            _id: 'talentAndSkills',
                            name: 'talentAndSkills',
                            type: 'textarea',
                            label: 'כישרון ומיומניות',
                            placeholder: 'כישרון ומיומניות',
                            required: false,
                            defaultValue: '',
                        },
                        {
                            _id: 'referralSource',
                            name: 'referralSource',
                            type: 'text',
                            label: 'מקור הפניה',
                            placeholder: 'מקור הפניה',
                            required: false,
                            defaultValue: '',
                        },
                    ],
                },
            ],
        })

        await formDocument.save()
    } catch (error) {
        logger.error(' error:', error)
    }
}
