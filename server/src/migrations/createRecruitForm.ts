import { FormFields } from '../models'
import { checkIfFormExist } from './utils'

export const createRecruitForm = async () => {
    try {
        const formName = 'Recruit'
        const isFormExist = await checkIfFormExist(formName)
        if (isFormExist) {
            console.log('From Recruit exist! passing on migration')
            return
        }
        console.log('Running on create form migration')

        const formFields = new FormFields({
            formName,
            formFields: [
                {
                    name: 'fullName',
                    type: 'text',
                    label: 'שם מלא',
                    placeholder: 'הזן שם מלא',
                    required: false,
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
                    name: 'maritalStatus',
                    type: 'select',
                    label: 'מצב משפחתי',
                    placeholder: 'בחר מצב משפחתי',
                    required: false,
                    options: [
                        {
                            label: 'נשוי.ה',
                            name: 'married',
                        },
                        {
                            label: 'רווק.ה',
                            name: 'single',
                        },
                        {
                            label: 'אחר',
                            name: 'other',
                        },
                    ],
                    defaultValue: '',
                },
                {
                    name: 'City',
                    type: 'text',
                    label: 'עיר',
                    placeholder: 'הזן את שם העיר שלך',
                    required: false,
                    defaultValue: '',
                },
                {
                    name: 'Phone',
                    type: 'tel',
                    label: 'טלפון',
                    placeholder: 'Enter your phone number',
                    required: false,
                    defaultValue: '',
                },
                {
                    name: 'Email',
                    type: 'email',
                    label: 'אימייל',
                    placeholder: 'Enter your email',
                    required: false,
                    defaultValue: '',
                },
                {
                    name: 'Linkedin',
                    type: 'text',
                    label: 'לינקדאין',
                    placeholder: 'הזן את שם המשתמש בלינקדאין',
                    required: false,
                    defaultValue: '',
                },
                {
                    name: 'Category',
                    type: 'multipleSelect',
                    label: 'קטגוריה',
                    placeholder: 'בחר קטגוריה',
                    required: false,
                    options: [
                        {
                            label: 'מומחה תוכן',
                            name: 'Content Specialist',
                        },
                        {
                            label: 'יועץ',
                            name: 'Consultant',
                        },
                        {
                            label: 'ראש צוות',
                            name: 'Team Leader',
                        },
                        {
                            label: 'אחר',
                            name: 'Other',
                        },
                    ],
                    defaultValue: '',
                },

                {
                    name: 'FieldOfExpertise',
                    type: 'select',
                    label: 'תחום מקצועי',
                    placeholder: 'תחום מקצועי',
                    required: false,
                    options: [
                        {
                            label: 'אלגוריתמיקה',
                            name: 'Algorithms',
                        },
                        {
                            label: 'פרונט',
                            name: 'Frontend',
                        },
                        {
                            label: 'בקנד',
                            name: 'Backend',
                        },
                        {
                            label: 'RF',
                            name: 'RF',
                        },
                        {
                            label: 'אחר',
                            name: 'Other',
                        },
                    ],
                    defaultValue: '',
                },
                {
                    name: 'Experience',
                    type: 'select',
                    label: 'שנות ניסיון',
                    placeholder: 'שנות ניסיון',
                    required: false,
                    options: [
                        {
                            label: '0-1 שנים',
                            name: '0-1 years',
                        },
                        {
                            label: '1-3 שנים',
                            name: '1-3 years',
                        },
                        {
                            label: '3-5 שנים',
                            name: '3-5 years',
                        },
                        { label: '5+ שנים', name: '5+ years' },
                    ],
                    defaultValue: '',
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
        })
        await formFields.save()
    } catch (error) {
        console.log(' error:', error)
    }
}
