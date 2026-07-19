import mongoose, { Schema, Document } from 'mongoose'
import {
    ClassificationClass,
    Experience,
    FieldOfExpertise,
    Personnel,
    ReserveCategory,
    StudioRole,
} from '@hr-app/shared-types'

export type PersonnelDocument = Omit<Personnel, 'assignedProjects'> &
    Document & {
        assignedProjects: mongoose.Types.ObjectId | null
    }

const PersonnelSchema = new Schema<PersonnelDocument>(
    {
        firstName: { type: String, required: true },
        lastName: { type: String, required: true },
        userId: { type: String },
        personalNumber: { type: String, required: true },
        phone: { type: String },
        email: { type: String },
        city: { type: String },
        linkedin: { type: String },
        vehicleNumber: { type: String },
        note: { type: String },
        isActive: { type: Boolean, default: true },

        reserveUnit: { type: String },
        studioRole: { type: String, enum: StudioRole.options },
        reserveRole: { type: String },
        directBoss: { type: String },
        rank: { type: String },
        classificationClass: { type: String, enum: ClassificationClass.options },
        canBeRecited: { type: Boolean },
        reserveCategory: { type: String, enum: ReserveCategory.options },
        assignedProjects: { type: Schema.Types.ObjectId, ref: 'projects', default: null },
        vehicleEntry: { type: Boolean, default: false },

        degree: { type: String },
        university: { type: String },
        studyArea: { type: String },
        yearOfGradation: { type: Date },
        workExperience: { type: String },
        talentAndSkills: { type: String },
        referralSource: { type: String },
        fieldOfExpertise: { type: String, enum: FieldOfExpertise.options },
        experience: { type: String, enum: Experience.options },
        workPlace: { type: String },
        currentPosition: { type: String },
        resumeFileUrl: { type: String },
    },
    { timestamps: true, collection: 'personnel' }
)

PersonnelSchema.index({ personalNumber: 1 }, { unique: true, sparse: true })

export const PersonnelModel = mongoose.model<PersonnelDocument>('personnel', PersonnelSchema)
