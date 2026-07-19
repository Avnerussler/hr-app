import mongoose from 'mongoose'
import { ProjectModel, ProjectDocument } from '../models/Project'
import { ProjectSchema } from '@hr-app/shared-types'
import { PROJECT_STATUS_LABELS } from '@hr-app/shared-types'
import { buildLabelSortKeyExpr } from '../utils/labelSortKey'
import { NotFoundError } from '../middleware/errorHandler'
import {
    syncPersonnelOnProjectUpdate,
    clearProjectFromAllPersonnel,
} from './bidirectionalSync.service'

export interface ListProjectsParams {
    page: number
    limit: number
    search?: string
    filters?: Record<string, unknown>
    sortField?: string
    sortOrder?: 'asc' | 'desc'
}

function choicesForProjectStatus(): { value: unknown; label?: string }[] {
    return Object.entries(PROJECT_STATUS_LABELS).map(([value, label]) => ({
        value,
        label,
    }))
}

export async function listProjects(params: ListProjectsParams) {
    const {
        page,
        limit,
        search,
        filters,
        sortField,
        sortOrder = 'asc',
    } = params
    const query: Record<string, unknown> = {}
    const andClauses: Record<string, unknown>[] = []

    if (search) {
        andClauses.push({ projectName: { $regex: search, $options: 'i' } })
    }

    if (filters) {
        for (const [field, value] of Object.entries(filters)) {
            if (value === undefined || value === 'all' || value === '') continue
            if (Array.isArray(value) && value.length === 0) continue
            if (Array.isArray(value)) {
                andClauses.push({ [field]: { $in: value } })
            } else {
                andClauses.push({ [field]: value })
            }
        }
    }

    if (andClauses.length > 0) query.$and = andClauses

    const skip = (page - 1) * limit
    const sortKeyDir = sortOrder === 'desc' ? -1 : 1
    const labelSortKeyExpr =
        sortField === 'projectStatus'
            ? buildLabelSortKeyExpr(sortField, choicesForProjectStatus())
            : undefined

    let items: ProjectDocument[]
    let total: number

    if (sortField === 'projectManager') {
        // Sort by the populated manager's name (relation field — no scalar to sort on directly)
        ;[items, total] = await Promise.all([
            ProjectModel.aggregate([
                { $match: query },
                {
                    $lookup: {
                        from: 'personnel',
                        localField: 'projectManager',
                        foreignField: '_id',
                        as: '__manager',
                    },
                },
                {
                    $addFields: {
                        __sortKey: {
                            $concat: [
                                {
                                    $ifNull: [
                                        {
                                            $arrayElemAt: [
                                                '$__manager.lastName',
                                                0,
                                            ],
                                        },
                                        '',
                                    ],
                                },
                                {
                                    $ifNull: [
                                        {
                                            $arrayElemAt: [
                                                '$__manager.firstName',
                                                0,
                                            ],
                                        },
                                        '',
                                    ],
                                },
                            ],
                        },
                    },
                },
                { $sort: { __sortKey: sortKeyDir } },
                { $skip: skip },
                { $limit: limit },
                { $project: { __manager: 0, __sortKey: 0 } },
            ]).collation({ locale: 'he', numericOrdering: true }),
            ProjectModel.countDocuments(query),
        ])
        items = await ProjectModel.populate(items, [
            {
                path: 'projectManager',
                select: 'firstName lastName personalNumber',
            },
            {
                path: 'projectPersonnel',
                select: 'firstName lastName personalNumber',
            },
        ])
    } else if (sortField === 'projectPersonnel') {
        // No meaningful per-name order for a multi-value field — sort by team size instead
        ;[items, total] = await Promise.all([
            ProjectModel.aggregate([
                { $match: query },
                {
                    $addFields: {
                        __sortKey: {
                            $size: { $ifNull: ['$projectPersonnel', []] },
                        },
                    },
                },
                { $sort: { __sortKey: sortKeyDir } },
                { $skip: skip },
                { $limit: limit },
                { $project: { __sortKey: 0 } },
            ]),
            ProjectModel.countDocuments(query),
        ])
        items = await ProjectModel.populate(items, [
            {
                path: 'projectManager',
                select: 'firstName lastName personalNumber',
            },
            {
                path: 'projectPersonnel',
                select: 'firstName lastName personalNumber',
            },
        ])
    } else if (labelSortKeyExpr) {
        ;[items, total] = await Promise.all([
            ProjectModel.aggregate([
                { $match: query },
                { $addFields: { __sortKey: labelSortKeyExpr } },
                { $sort: { __sortKey: sortKeyDir } },
                { $skip: skip },
                { $limit: limit },
                { $project: { __sortKey: 0 } },
            ]).collation({ locale: 'he', numericOrdering: true }),
            ProjectModel.countDocuments(query),
        ])
    } else {
        const sortSpec: Record<string, 1 | -1> = sortField
            ? { [sortField]: sortKeyDir }
            : { createdAt: -1 }
        ;[items, total] = await Promise.all([
            ProjectModel.find(query)
                .collation({ locale: 'he', numericOrdering: true })
                .sort(sortSpec)
                .skip(skip)
                .limit(limit)
                .populate('projectManager', 'firstName lastName personalNumber')
                .populate(
                    'projectPersonnel',
                    'firstName lastName personalNumber'
                )
                .lean() as unknown as Promise<ProjectDocument[]>,
            ProjectModel.countDocuments(query),
        ])
    }

    return { items, total }
}

export async function getProjectById(id: string) {
    const doc = await ProjectModel.findById(id)
        .populate('projectManager', 'firstName lastName personalNumber')
        .populate('projectPersonnel', 'firstName lastName personalNumber')
        .lean()
    if (!doc) throw new NotFoundError('Project')
    return doc
}

export async function createProject(body: unknown) {
    const validated = ProjectSchema.parse(body)
    const created = await ProjectModel.create(validated)
    if (created.projectPersonnel.length > 0) {
        await syncPersonnelOnProjectUpdate(
            String(created._id),
            [],
            created.projectPersonnel.map(String)
        )
    }
    return created.toObject()
}

export async function updateProject(id: string, body: unknown) {
    const existing = await ProjectModel.findById(id)
    if (!existing) throw new NotFoundError('Project')

    const validated = ProjectSchema.parse(body)
    const previousPersonnelIds = existing.projectPersonnel.map(String)

    Object.assign(existing, validated)
    await existing.save()

    const nextPersonnelIds = existing.projectPersonnel.map(String)
    await syncPersonnelOnProjectUpdate(
        id,
        previousPersonnelIds,
        nextPersonnelIds
    )

    return existing.toObject()
}

export async function deleteProject(id: string) {
    const doc = await ProjectModel.findByIdAndDelete(id)
    if (!doc) throw new NotFoundError('Project')
    await clearProjectFromAllPersonnel(id)
    return doc.toObject()
}

export async function getProjectMetrics() {
    const [total, active, inactive, pending] = await Promise.all([
        ProjectModel.countDocuments({}),
        ProjectModel.countDocuments({ projectStatus: 'active' }),
        ProjectModel.countDocuments({ projectStatus: 'inactive' }),
        ProjectModel.countDocuments({ projectStatus: 'pending' }),
    ])

    return [
        {
            id: 'total',
            title: 'סה"כ פרויקטים',
            icon: 'FaProjectDiagram',
            color: 'blue.500',
            value: total,
        },
        {
            id: 'active',
            title: 'פרויקטים פעילים',
            icon: 'FaCheck',
            color: 'green.500',
            value: active,
        },
        {
            id: 'inactive',
            title: 'פרויקטים לא פעילים',
            icon: 'FaUserTimes',
            color: 'red.500',
            value: inactive,
        },
        {
            id: 'pending',
            title: 'בהשהיה',
            icon: 'FaHourglassHalf',
            color: 'orange.500',
            value: pending,
        },
    ]
}

export async function searchProjectOptions(
    search: string | undefined,
    page: number,
    limit: number
) {
    const query: Record<string, unknown> = {}
    if (search) {
        query.projectName = { $regex: search, $options: 'i' }
    }
    const skip = (page - 1) * limit
    const [docs, total] = await Promise.all([
        ProjectModel.find(query).skip(skip).limit(limit).lean(),
        ProjectModel.countDocuments(query),
    ])
    const options = docs.map((d) => ({
        value: String(d._id),
        label: d.projectName,
    }))
    return {
        options,
        pagination: { page, limit, total, hasMore: skip + docs.length < total },
    }
}

export async function getProjectsByIds(ids: string[]) {
    const objectIds = ids.filter((id) => mongoose.isValidObjectId(id))
    const docs = await ProjectModel.find({ _id: { $in: objectIds } }).lean()
    return docs.map((d) => ({ value: String(d._id), label: d.projectName }))
}
