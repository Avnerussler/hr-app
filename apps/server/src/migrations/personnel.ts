import { FormFields } from '../models'
import logger from '../config/logger'

const CURRENT_VERSION = '1.1.36'

export const createPersonalForm = async () => {
    try {
        const formName = 'personnel'
        const existingForm = await FormFields.findOne({ formName })

        const formData = {
            version: CURRENT_VERSION,
            description: 'Employee Management',
            displayName: 'משאבי אנוש',
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
                            name: 'personalNumber',
                            type: 'number',
                            label: 'מספר אישי',
                            placeholder: 'הזן מספר אישי',
                            required: true,
                            defaultValue: '',
                            errorMessage: 'מספר אישי הוא שדה חובה',
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
                            name: 'vehicleNumber',
                            type: 'text',
                            label: 'מספר רכב',
                            placeholder: 'הזן מספר רכב',
                            required: false,
                            defaultValue: '',
                        },

                        {
                            name: 'note',
                            type: 'textarea',
                            label: 'כללי',
                            placeholder: 'הזן הערה כללית',
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
                            name: 'studioRole',
                            type: 'selectAutocomplete',
                            label: 'תפקיד בסטודיו',
                            placeholder: 'בחר תפקיד בסטודיו',
                            required: false,
                            defaultValue: '',
                            options: [
                                {
                                    value: 'algorithmDeveloper',
                                    label: 'Algorithm developer',
                                    name: 'algorithmDeveloper',
                                },
                                {
                                    value: 'algorithmResearch',
                                    label: 'Algorithm Research',
                                    name: 'algorithmResearch',
                                },
                                {
                                    value: 'backendDeveloper',
                                    label: 'Backend Developer',
                                    name: 'backendDeveloper',
                                },
                                {
                                    value: 'coo',
                                    label: 'COO',
                                    name: 'coo',
                                },
                                {
                                    value: 'frontendDeveloper',
                                    label: 'Frontend Developer',
                                    name: 'frontendDeveloper',
                                },
                                {
                                    value: 'fullstackDeveloper',
                                    label: 'Fullstack Developer',
                                    name: 'fullstackDeveloper',
                                },
                                {
                                    value: 'hr',
                                    label: 'HR',
                                    name: 'hr',
                                },
                                {
                                    value: 'hwEngineer',
                                    label: 'HW Engineer',
                                    name: 'hwEngineer',
                                },
                                {
                                    value: 'productEngineer',
                                    label: 'Product Engineer',
                                    name: 'productEngineer',
                                },
                                {
                                    value: 'uxui',
                                    label: 'UX/UI',
                                    name: 'uxui',
                                },
                                {
                                    value: 'fieldPerson',
                                    label: 'איש שטח',
                                    name: 'fieldPerson',
                                },
                                {
                                    value: 'wirelessOperator',
                                    label: 'אלחוטן',
                                    name: 'wirelessOperator',
                                },
                                {
                                    value: 'academia',
                                    label: 'אקדמיה',
                                    name: 'academia',
                                },
                                {
                                    value: 'acoustician',
                                    label: 'אקוסטיקאי',
                                    name: 'acoustician',
                                },
                                {
                                    value: 'dataScience',
                                    label: 'דאטה סיינס',
                                    name: 'dataScience',
                                },
                                {
                                    value: 'devops',
                                    label: 'דבאופס',
                                    name: 'devops',
                                },
                                {
                                    value: 'projectManager',
                                    label: 'מנהל פרויקט',
                                    name: 'projectManager',
                                },
                                {
                                    value: 'track',
                                    label: 'מסלול',
                                    name: 'track',
                                },
                                {
                                    value: 'kaman',
                                    label: 'קמ"ן',
                                    name: 'kaman',
                                },
                                {
                                    value: 'kamatz',
                                    label: 'קמב"ץ',
                                    name: 'kamatz',
                                },
                                {
                                    value: 'teamLead',
                                    label: 'ראש צוות',
                                    name: 'teamLead',
                                },
                                {
                                    value: 'algorithmTeamLead',
                                    label: 'ראש צוות אלגוריתמיקה',
                                    name: 'algorithmTeamLead',
                                },
                                {
                                    value: 'softwareTeamLead',
                                    label: 'ראש צוות תוכנה',
                                    name: 'softwareTeamLead',
                                },
                                {
                                    value: 'partnerships',
                                    label: 'שותפויות',
                                    name: 'partnerships',
                                },
                                {
                                    value: 'operations',
                                    label: 'אופרציה',
                                    name: 'operations',
                                },
                                {
                                    value: 'performanceResearch',
                                    label: `חק"ב`,
                                    name: 'performanceResearch',
                                },
                                {
                                    value: 'other',
                                    label: 'אחר',
                                    name: 'other',
                                },
                            ],
                        },
                        {
                            name: 'reserveRole',
                            type: 'text',
                            label: 'תפקיד במילואים',
                            placeholder: 'הזן תפקיד במילואים',
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
                            name: 'rank',
                            type: 'text',
                            label: 'דרגה',
                            placeholder: 'דרגה',
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
                        {
                            name: 'reserveCategory',
                            type: 'select',
                            label: 'סוג העסקה',
                            placeholder: 'בחר סוג העסקה',
                            required: false,
                            defaultValue: '',
                            options: [
                                {
                                    value: 'reserves',
                                    label: 'מילואים',
                                    name: 'reserves',
                                },
                                {
                                    value: 'consultant',
                                    label: 'יועץ',
                                    name: 'consultant',
                                },
                                {
                                    value: 'permanentService',
                                    label: 'קבע',
                                    name: 'permanentService',
                                },
                                {
                                    value: 'mandatoryMilitaryService',
                                    label: 'סדיר',
                                    name: 'mandatoryMilitaryService',
                                },
                                { value: 'Other', label: 'אחר', name: 'Other' },
                            ],
                        },
                        {
                            name: 'assignedProjects',
                            type: 'selectAutocomplete',
                            label: 'שיוך לפרויקט',
                            placeholder: 'בחר פרויקט',
                            required: false,
                            defaultValue: '',
                            foreignFormName: 'project_management',
                            foreignField: 'projectName',
                            bidirectionalSync: {
                                enabled: true,
                                targetFormName: 'project_management',
                                targetFieldName: 'projectPersonnel',
                            },
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
                    ],
                },

                {
                    id: 'attendanceHistory',
                    name: 'היסטוריית נוכחות',
                    fields: [
                        {
                            name: 'attendanceHistory',
                            type: 'attendanceHistory',
                            label: 'היסטוריית נוכחות',
                            placeholder: '',
                            required: false,
                            defaultValue: '',
                            employeeIdField: '_id', // Field that contains the employee ID
                        },
                    ],
                },
                {
                    id: 'professionalInformation',
                    name: 'מידע מקצועי',
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
                            label: 'כישורים ומיומניות',
                            placeholder: 'כישורים ומיומניות',
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
            ],
            overviewFields: [
                'firstName',
                'lastName',
                'personalNumber',
                'reserveCategory',
                'rule',
                'directBoss',
                'talentAndSkills',
                'assignedProjects',
                'studioRole',
                'isActive',
                'createdAt',
            ],
            filters: [
                {
                    id: 'isActiveFilter',
                    label: 'סטטוס',
                    fieldName: 'isActive',
                    type: 'select',
                    placeholder: 'בחר סטטוס',
                    options: [
                        { value: 'all', label: 'הכל' },
                        { value: 'true', label: 'פעיל' },
                        { value: 'false', label: 'לא פעיל' },
                    ],
                    defaultValue: 'all',
                },
                {
                    id: 'studioRoleFilter',
                    label: 'תפקיד בסטודיו',
                    fieldName: 'studioRole',
                    type: 'multiSelect',
                    placeholder: 'בחר תפקיד בסטודיו',
                    options: [
                        {
                            value: 'algorithmDeveloper',
                            label: 'Algorithm developer',
                        },
                        {
                            value: 'algorithmResearch',
                            label: 'Algorithm Research',
                        },
                        {
                            value: 'backendDeveloper',
                            label: 'Backend Developer',
                        },
                        { value: 'coo', label: 'COO' },
                        {
                            value: 'frontendDeveloper',
                            label: 'Frontend Developer',
                        },
                        {
                            value: 'fullstackDeveloper',
                            label: 'Fullstack Developer',
                        },
                        { value: 'hr', label: 'HR' },
                        { value: 'hwEngineer', label: 'HW Engineer' },
                        { value: 'productEngineer', label: 'Product Engineer' },
                        { value: 'uxui', label: 'UX/UI' },
                        { value: 'fieldPerson', label: 'איש שטח' },
                        { value: 'wirelessOperator', label: 'אלחוטן' },
                        { value: 'academia', label: 'אקדמיה' },
                        { value: 'acoustician', label: 'אקוסטיקאי' },
                        { value: 'dataScience', label: 'דאטה סיינס' },
                        { value: 'devops', label: 'דבאופס' },
                        { value: 'projectManager', label: 'מנהל פרויקט' },
                        { value: 'track', label: 'מסלול' },
                        { value: 'kaman', label: 'קמ"ן' },
                        { value: 'kamatz', label: 'קמב"ץ' },
                        { value: 'teamLead', label: 'ראש צוות' },
                        {
                            value: 'algorithmTeamLead',
                            label: 'ראש צוות אלגוריתמיקה',
                        },
                        { value: 'softwareTeamLead', label: 'ראש צוות תוכנה' },
                        { value: 'partnerships', label: 'שותפויות' },
                        { value: 'operations', label: 'אופרציה' },
                        { value: 'other', label: 'אחר' },
                    ],
                },

                {
                    id: 'assignedProjectsFilter',
                    label: 'שיוך לפרויקט',
                    fieldName: 'assignedProjects',
                    type: 'multiSelect',
                    placeholder: 'בחר פרויקט',
                    foreignFormName: 'project_management',
                    foreignField: 'projectName',
                },
                {
                    id: 'reserveCategoryFilter',
                    label: 'סוג העסקה',
                    fieldName: 'reserveCategory',
                    type: 'multiSelect',
                    placeholder: 'בחר סוג העסקה',
                    options: [
                        { value: 'reserves', label: 'מילואים' },
                        { value: 'consultant', label: 'יועץ' },
                        { value: 'permanentService', label: 'קבע' },
                        { value: 'mandatoryMilitaryService', label: 'סדיר' },
                        { value: 'Other', label: 'אחר' },
                    ],
                },
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
