import { z } from 'zod'
import {
    ClassificationClass,
    Experience,
    FieldOfExpertise,
    ReserveCategory,
    StudioRole,
} from './enums'
import { ObjectIdString } from './common'

export const PersonnelSchema = z.object({
    firstName: z.string().min(1, 'שם פרטי הוא שדה חובה'),
    lastName: z.string().min(1, 'שם משפחה הוא שדה חובה'),
    userId: z.string().optional(),
    personalNumber: z.string().min(1, 'מספר אישי הוא שדה חובה'),
    phone: z.string().optional(),
    email: z.string().email().optional().or(z.literal('')),
    city: z.string().optional(),
    linkedin: z.string().optional(),
    vehicleNumber: z.string().optional(),
    note: z.string().optional(),
    isActive: z.boolean().default(true),

    reserveUnit: z.string().optional(),
    studioRole: StudioRole.optional(),
    reserveRole: z.string().optional(),
    directBoss: z.string().optional(),
    rank: z.string().optional(),
    classificationClass: ClassificationClass.optional(),
    canBeRecited: z.boolean().optional(),
    reserveCategory: ReserveCategory.optional(),
    assignedProjects: ObjectIdString.nullable().default(null),
    vehicleEntry: z.boolean().default(false),

    degree: z.string().optional(),
    university: z.string().optional(),
    studyArea: z.string().optional(),
    yearOfGradation: z.coerce.date().optional(),
    workExperience: z.string().optional(),
    talentAndSkills: z.string().optional(),
    referralSource: z.string().optional(),
    fieldOfExpertise: FieldOfExpertise.optional(),
    experience: Experience.optional(),
    workPlace: z.string().optional(),
    currentPosition: z.string().optional(),
    resumeFileUrl: z.string().optional(),
})
export type Personnel = z.infer<typeof PersonnelSchema>

export const PERSONNEL_DEFAULT_VALUES: Pick<Personnel, 'isActive' | 'vehicleEntry' | 'assignedProjects'> = {
    isActive: true,
    vehicleEntry: false,
    assignedProjects: null,
}
