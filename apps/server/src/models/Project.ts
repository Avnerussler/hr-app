import mongoose, { Schema, Document } from 'mongoose'
import { Project, ProjectStatus } from '@hr-app/shared-types'

export type ProjectDocument = Omit<Project, 'projectManager' | 'projectPersonnel'> &
    Document & {
        projectManager: mongoose.Types.ObjectId | null
        projectPersonnel: mongoose.Types.ObjectId[]
    }

const ProjectSchema = new Schema<ProjectDocument>(
    {
        projectName: { type: String, required: true },
        projectManager: { type: Schema.Types.ObjectId, ref: 'personnel', default: null },
        projectPersonnel: [{ type: Schema.Types.ObjectId, ref: 'personnel' }],
        projectStatus: { type: String, enum: ProjectStatus.options, default: 'active' },
    },
    { timestamps: true, collection: 'projects' }
)

export const ProjectModel = mongoose.model<ProjectDocument>('projects', ProjectSchema)
