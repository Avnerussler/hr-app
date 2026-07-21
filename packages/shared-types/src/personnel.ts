import { z } from 'zod'
import { ObjectIdString } from './common'

export const PersonnelObjectSchema = z.object({
    firstName: z.string().min(1, 'שם פרטי הוא שדה חובה'),
    lastName: z.string().min(1, 'שם משפחה הוא שדה חובה'),
    userId: z.string().nullish(),
    personalNumber: z.string().min(1, 'מספר אישי הוא שדה חובה'),
    phone: z.string().nullish(),
    email: z.string().email().nullish().or(z.literal('')),
    city: z.string().nullish(),
    linkedin: z.string().nullish(),
    vehicleNumber: z.string().nullish(),
    note: z.string().nullish(),
    details: z.string().nullish(),
    layer: z.string().nullish(),
    isActive: z.boolean().default(true),

    reserveUnit: z.string().nullish(),
    studioRole: z.string().nullish(),
    reserveRole: z.string().nullish(),
    directBoss: z.string().nullish(),
    rank: z.string().nullish(),
    classificationClass: z.string().nullish(),
    canBeRecited: z.boolean().nullish(),
    reserveCategory: z.string().nullish(),
    assignedProjects: ObjectIdString.nullable().default(null),
    entryStartDate: z.coerce.date().nullish(),
    entryEndDate: z.coerce.date().nullish(),
    hasVehicleApproval: z.boolean().nullish(),

    degree: z.string().nullish(),
    university: z.string().nullish(),
    studyArea: z.string().nullish(),
    yearOfGradation: z.coerce.date().nullish(),
    workExperience: z.string().nullish(),
    talentAndSkills: z.string().nullish(),
    referralSource: z.string().nullish(),
    fieldOfExpertise: z.string().nullish(),
    experience: z.string().nullish(),
    workPlace: z.string().nullish(),
    currentPosition: z.string().nullish(),
    resumeFileUrl: z.string().nullish(),
})

export const PersonnelSchema = PersonnelObjectSchema.refine(
    (data) =>
        !data.entryStartDate ||
        !data.entryEndDate ||
        data.entryEndDate >= data.entryStartDate,
    {
        message: 'תאריך סיום חייב להיות אחרי תאריך התחלה',
        path: ['entryEndDate'],
    }
)
export type Personnel = z.infer<typeof PersonnelSchema>

export const PersonnelUpdateSchema = PersonnelObjectSchema.partial().refine(
    (data) =>
        !data.entryStartDate ||
        !data.entryEndDate ||
        data.entryEndDate >= data.entryStartDate,
    {
        message: 'תאריך סיום חייב להיות אחרי תאריך התחלה',
        path: ['entryEndDate'],
    }
)

export const PERSONNEL_DEFAULT_VALUES: Pick<Personnel, 'isActive' | 'assignedProjects'> = {
    isActive: true,
    assignedProjects: null,
}
