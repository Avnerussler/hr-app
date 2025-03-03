import { FormFields } from '../models'

export const createForms = async () => {
    const formFields = new FormFields({
        formName: 'Recruit',
        formFields: [
            {
                name: 'FirstName',
                type: 'text',
                label: 'שם',
                placeholder: 'Enter your name',
                required: false,
                defaultValue: '',
            },
            {
                name: 'LastName',
                type: 'text',
                label: 'משפחה',
                placeholder: 'Enter your last name',
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
                name: 'Phone',
                type: 'tel',
                label: 'טלפון',
                placeholder: 'Enter your phone number',
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
            {
                name: 'Linkedin',
                type: 'text',
                label: 'לינקדאין',
                placeholder: 'הזן את שם המשתמש שלך בלינקדאין',
                required: false,
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
                name: 'City',
                type: 'text',
                label: 'עיר',
                placeholder: 'הזן את שם העיר שלך',
                required: false,
                defaultValue: '',
            },
            {
                name: 'Category',
                type: 'select',
                label: 'קטגוריה',
                placeholder: 'הזן קטגוריה',
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
        ],
    })
    await formFields.save()
}
