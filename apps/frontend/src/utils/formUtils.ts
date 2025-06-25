import { FormFields } from '@/types/fieldsType'
import { Section } from '@/components/common/DetailsDrawer'

// MongoDB form field interface to match your schema
export interface MongoFormField {
    _id: { $oid: string }
    name: string
    type: string
    label: string
    placeholder: string
    required: boolean
    defaultValue: string
    options?: { label: string; name: string; value: string }[]
    items?: { label: string; value: string }[]
    foreignFormId?: { $oid: string }
    foreignField?: string
}

export interface MongoFormSchema {
    formName: string
    formFields: MongoFormField[]
}

// Convert MongoDB field to FormFields type
const convertMongoFieldToFormField = (
    mongoField: MongoFormField
): FormFields => {
    return {
        _id: mongoField._id.$oid,
        name: mongoField.name,
        type: mongoField.type as any, // Type assertion since FieldType is more restrictive
        label: mongoField.label,
        placeholder: mongoField.placeholder,
        required: mongoField.required,
        options: mongoField.options?.map((opt) => ({
            label: opt.label,
            name: opt.name,
            value: opt.value,
        })),
        items: mongoField.items,
    }
}

// Organize fields by sections based on field names
export const organizeFieldsBySection = (
    mongoSchema: MongoFormSchema
): Section[] => {
    // Enhanced field organization for Employee interface
    const generalFields = [
        'employeeId', 'firstName', 'lastName', 'email', 'phone', 'address',
        'dateOfBirth', 'toBeContactedAt', 'fullName', 'userId', 'maritalStatus', 
        'City', 'Phone', 'Email', 'Linkedin'
    ]

    const employmentFields = [
        'role', 'department', 'hireDate', 'type', 'status', 'contractType',
        'workLocation', 'performance'
    ]

    const professionalFields = [
        'category', 'domain', 'technology', 'yearsOfExpertise', 'currentCompany',
        'currentRole', 'previousCompany', 'previousRole', 'Category', 'FieldOfExpertise',
        'Experience', 'workPlace', 'currentPosition', 'Resume', 'workExperience',
        'talentAndSkills', 'referralSource'
    ]

    const projectFields = [
        'project', 'manager', 'teamLead', 'lastActiveTime', 'nextActiveTime'
    ]

    const classificationFields = [
        'classificationRank', 'classificationType', 'classificationStatus',
        'hasClassification', 'classificationClass', 'canBeRecited'
    ]

    const skillsFields = [
        'skills', 'certifications', 'extraCourses'
    ]

    const educationFields = [
        'degree', 'University', 'studyArea', 'yearOfGradation'
    ]

    const militaryFields = [
        'RecruitmentYear', 'DismissYear', 'reserveUnit', 'reservesDates'
    ]

    const convertedFields = mongoSchema.formFields.map(
        convertMongoFieldToFormField
    )

    return [
        {
            id: 'general',
            name: 'General',
            fields: convertedFields.filter((field) =>
                generalFields.includes(field.name)
            ),
        },
        {
            id: 'employment',
            name: 'Employment',
            fields: convertedFields.filter((field) =>
                employmentFields.includes(field.name)
            ),
        },
        {
            id: 'professional',
            name: 'Professional',
            fields: convertedFields.filter((field) =>
                professionalFields.includes(field.name)
            ),
        },
        {
            id: 'project',
            name: 'Project & Team',
            fields: convertedFields.filter((field) =>
                projectFields.includes(field.name)
            ),
        },
        {
            id: 'classification',
            name: 'Classification',
            fields: convertedFields.filter((field) =>
                classificationFields.includes(field.name)
            ),
        },
        {
            id: 'skills',
            name: 'Skills & Development',
            fields: convertedFields.filter((field) =>
                skillsFields.includes(field.name)
            ),
        },
        {
            id: 'education',
            name: 'Education',
            fields: convertedFields.filter((field) =>
                educationFields.includes(field.name)
            ),
        },
        {
            id: 'military',
            name: 'Military',
            fields: convertedFields.filter((field) =>
                militaryFields.includes(field.name)
            ),
        },
    ].filter((section) => section.fields.length > 0) // Only include sections that have fields
}

// Create default sections for backwards compatibility
export const createDefaultSections = (): Section[] => {
    return [
        {
            id: 'general',
            name: 'General',
            fields: [
                {
                    _id: 'firstName',
                    name: 'firstName',
                    type: 'text',
                    label: 'First Name',
                    placeholder: 'Enter first name',
                    required: false,
                },
                {
                    _id: 'lastName',
                    name: 'lastName',
                    type: 'text',
                    label: 'Last Name',
                    placeholder: 'Enter last name',
                    required: false,
                },
                {
                    _id: 'email',
                    name: 'email',
                    type: 'email',
                    label: 'Email',
                    placeholder: 'Enter email',
                    required: false,
                },
                {
                    _id: 'phone',
                    name: 'phone',
                    type: 'tel',
                    label: 'Phone',
                    placeholder: 'Enter phone number',
                    required: false,
                },
                {
                    _id: 'address',
                    name: 'address',
                    type: 'textarea',
                    label: 'Address',
                    placeholder: 'Enter address',
                    required: false,
                },
            ],
        },
    ]
}
