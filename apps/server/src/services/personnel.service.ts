import mongoose from 'mongoose'
import { PersonnelModel, PersonnelDocument } from '../models/Personnel'
import { PersonnelSchema } from '@hr-app/shared-types'
import {
    RESERVE_CATEGORY_LABELS,
    STUDIO_ROLE_LABELS,
    FIELD_OF_EXPERTISE_LABELS,
    EXPERIENCE_LABELS,
    CLASSIFICATION_CLASS_LABELS,
} from '@hr-app/shared-types'
import { buildLabelSortKeyExpr } from '../utils/labelSortKey'
import { buildLabelSearchClauses } from '../utils/searchQueryBuilder'
import { NotFoundError } from '../middleware/errorHandler'
import { syncProjectOnPersonnelUpdate, removePersonnelFromAllProjects } from './bidirectionalSync.service'

export interface ListPersonnelParams {
    page: number
    limit: number
    search?: string
    filters?: Record<string, unknown>
    sortField?: string
    sortOrder?: 'asc' | 'desc'
}

const LABEL_MAPS: Record<string, Record<string, string>> = {
    reserveCategory: RESERVE_CATEGORY_LABELS,
    studioRole: STUDIO_ROLE_LABELS,
    fieldOfExpertise: FIELD_OF_EXPERTISE_LABELS,
    experience: EXPERIENCE_LABELS,
    classificationClass: CLASSIFICATION_CLASS_LABELS,
}

function choicesFor(field: string): { value: unknown; label?: string }[] {
    const map = LABEL_MAPS[field]
    if (!map) return []
    return Object.entries(map).map(([value, label]) => ({ value, label }))
}

export async function listPersonnel(params: ListPersonnelParams) {
    const { page, limit, search, filters, sortField, sortOrder = 'asc' } = params
    const query: Record<string, unknown> = {}
    const andClauses: Record<string, unknown>[] = []

    if (search) {
        const orClauses: Record<string, unknown>[] = [
            { firstName: { $regex: search, $options: 'i' } },
            { lastName: { $regex: search, $options: 'i' } },
            { personalNumber: { $regex: search, $options: 'i' } },
        ]
        const tokens = search.trim().split(/\s+/).filter(Boolean)
        if (tokens.length > 1) {
            orClauses.push({
                $expr: {
                    $and: tokens.map((t) => ({
                        $regexMatch: {
                            input: {
                                $toLower: { $concat: ['$firstName', ' ', '$lastName'] },
                            },
                            regex: t,
                            options: 'i',
                        },
                    })),
                },
            })
        }
        andClauses.push({ $or: orClauses })
    }

    if (filters) {
        for (const [field, value] of Object.entries(filters)) {
            if (value === undefined || value === 'all' || value === '') continue
            if (Array.isArray(value) && value.length === 0) continue
            if (Array.isArray(value)) {
                andClauses.push({ [field]: { $in: value } })
            } else if (typeof value === 'boolean') {
                andClauses.push({ [field]: value })
            } else if (value === 'true' || value === 'false') {
                andClauses.push({ [field]: value === 'true' })
            } else {
                andClauses.push({ [field]: { $regex: `^${value}$`, $options: 'i' } })
            }
        }
    }

    if (andClauses.length > 0) query.$and = andClauses

    const skip = (page - 1) * limit
    const sortKeyDir = sortOrder === 'desc' ? -1 : 1
    const labelSortKeyExpr = sortField ? buildLabelSortKeyExpr(sortField, choicesFor(sortField)) : undefined

    let items: PersonnelDocument[]
    let total: number

    if (sortField === 'assignedProjects') {
        // Sort by the populated project's name (relation field — no scalar to sort on directly)
        ;[items, total] = await Promise.all([
            PersonnelModel.aggregate([
                { $match: query },
                {
                    $lookup: {
                        from: 'projects',
                        localField: 'assignedProjects',
                        foreignField: '_id',
                        as: '__project',
                    },
                },
                {
                    $addFields: {
                        __sortKey: { $ifNull: [{ $arrayElemAt: ['$__project.projectName', 0] }, ''] },
                    },
                },
                { $sort: { __sortKey: sortKeyDir } },
                { $skip: skip },
                { $limit: limit },
                { $project: { __project: 0, __sortKey: 0 } },
            ]).collation({ locale: 'he', numericOrdering: true }),
            PersonnelModel.countDocuments(query),
        ])
        items = await PersonnelModel.populate(items, [{ path: 'assignedProjects', select: 'projectName' }])
    } else if (labelSortKeyExpr) {
        ;[items, total] = await Promise.all([
            PersonnelModel.aggregate([
                { $match: query },
                { $addFields: { __sortKey: labelSortKeyExpr } },
                { $sort: { __sortKey: sortKeyDir } },
                { $skip: skip },
                { $limit: limit },
                { $project: { __sortKey: 0 } },
            ]).collation({ locale: 'he', numericOrdering: true }),
            PersonnelModel.countDocuments(query),
        ])
    } else {
        const sortSpec: Record<string, 1 | -1> = sortField
            ? { [sortField]: sortKeyDir }
            : { createdAt: -1 }
        ;[items, total] = await Promise.all([
            PersonnelModel.find(query)
                .collation({ locale: 'he', numericOrdering: true })
                .sort(sortSpec)
                .skip(skip)
                .limit(limit)
                .populate('assignedProjects', 'projectName')
                .lean() as unknown as Promise<PersonnelDocument[]>,
            PersonnelModel.countDocuments(query),
        ])
    }

    return { items, total }
}

export async function getPersonnelById(id: string) {
    const doc = await PersonnelModel.findById(id).populate('assignedProjects', 'projectName').lean()
    if (!doc) throw new NotFoundError('Personnel')
    return doc
}

export async function createPersonnel(body: unknown) {
    const validated = PersonnelSchema.parse(body)
    const created = await PersonnelModel.create(validated)
    if (created.assignedProjects) {
        await syncProjectOnPersonnelUpdate(String(created._id), null, String(created.assignedProjects))
    }
    return created.toObject()
}

export async function updatePersonnel(id: string, body: unknown) {
    const existing = await PersonnelModel.findById(id)
    if (!existing) throw new NotFoundError('Personnel')

    const validated = PersonnelSchema.parse(body)
    const previousProjectId = existing.assignedProjects ? String(existing.assignedProjects) : null

    Object.assign(existing, validated)
    await existing.save()

    const nextProjectId = existing.assignedProjects ? String(existing.assignedProjects) : null
    if (previousProjectId !== nextProjectId) {
        await syncProjectOnPersonnelUpdate(id, previousProjectId, nextProjectId)
    }

    return existing.toObject()
}

export async function deletePersonnel(id: string) {
    const doc = await PersonnelModel.findByIdAndDelete(id)
    if (!doc) throw new NotFoundError('Personnel')
    await removePersonnelFromAllProjects(id)
    return doc.toObject()
}

export async function searchPersonnelOptions(search: string | undefined, page: number, limit: number) {
    const query: Record<string, unknown> = {}
    if (search) {
        query.$or = [
            { firstName: { $regex: search, $options: 'i' } },
            { lastName: { $regex: search, $options: 'i' } },
            { personalNumber: { $regex: search, $options: 'i' } },
        ]
    }
    const skip = (page - 1) * limit
    const [docs, total] = await Promise.all([
        PersonnelModel.find(query).skip(skip).limit(limit).lean(),
        PersonnelModel.countDocuments(query),
    ])
    const options = docs.map((d) => ({
        value: String(d._id),
        label: `${d.firstName} ${d.lastName} (${d.personalNumber})`,
        metadata: { isActive: d.isActive ?? false },
    }))
    return {
        options,
        pagination: { page, limit, total, hasMore: skip + docs.length < total },
    }
}

export async function getPersonnelMetrics() {
    const [active, notActive, total] = await Promise.all([
        PersonnelModel.countDocuments({ isActive: true }),
        PersonnelModel.countDocuments({ isActive: false }),
        PersonnelModel.countDocuments({}),
    ])

    return [
        { id: 'active', title: 'משאבי אנוש פעילים', icon: 'FaUserCheck', color: 'green.500', value: active },
        { id: 'notActive', title: 'משאבי אנוש לא פעילים', icon: 'FaUserCheck', color: 'red.500', value: notActive },
        { id: 'TotalPersonnel', title: 'סה"כ משאבי אנוש', icon: 'FaUserCheck', color: 'blue.500', value: total },
    ]
}

export async function getPersonnelByIds(ids: string[]) {
    const objectIds = ids.filter((id) => mongoose.isValidObjectId(id))
    const docs = await PersonnelModel.find({ _id: { $in: objectIds } }).lean()
    return docs.map((d) => ({
        value: String(d._id),
        label: `${d.firstName} ${d.lastName} (${d.personalNumber})`,
        metadata: { isActive: d.isActive ?? false },
    }))
}
