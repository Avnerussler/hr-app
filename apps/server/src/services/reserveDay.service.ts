import { ReserveDayModel, ReserveDayDocument } from '../models/ReserveDay'
import { PersonnelModel } from '../models/Personnel'
import { ReserveDaySchema, ReserveDayUpdateSchema } from '@hr-app/shared-types'
import {
    BASE_ACCESS_APPROVAL_LABELS,
    FUNDING_SOURCE_LABELS,
    ORDER_TYPE_LABELS,
    REQUEST_STATUS_LABELS,
} from '@hr-app/shared-types'
import { buildLabelSortKeyExpr } from '../utils/labelSortKey'
import { buildDateSearchClauses, buildLabelSearchClauses } from '../utils/searchQueryBuilder'
import { NotFoundError, ConflictError } from '../middleware/errorHandler'

export interface ListReserveDaysParams {
    page: number
    limit: number
    search?: string
    filters?: Record<string, unknown>
    sortField?: string
    sortOrder?: 'asc' | 'desc'
}

const LABEL_MAPS: Record<string, Record<string, string>> = {
    fundingSource: FUNDING_SOURCE_LABELS,
    orderType: ORDER_TYPE_LABELS,
    requestStatus: REQUEST_STATUS_LABELS,
    baseAccessApproval: BASE_ACCESS_APPROVAL_LABELS,
}

function choicesFor(field: string): { value: unknown; label?: string }[] {
    const map = LABEL_MAPS[field]
    if (!map) return []
    return Object.entries(map).map(([value, label]) => ({ value, label }))
}

const NO_OVERLAP_ERROR_MESSAGE = 'לעובד זה כבר קיים צו בתאריכים אלו'

async function assertNoOverlap(employeeName: string, startDate: Date, endDate: Date, excludeId?: string) {
    const query: Record<string, unknown> = {
        employeeName,
        isDeleted: false,
        startDate: { $lte: endDate },
        endDate: { $gte: startDate },
    }
    if (excludeId) {
        query._id = { $ne: excludeId }
    }
    const overlapping = await ReserveDayModel.exists(query)
    if (overlapping) {
        throw new ConflictError(NO_OVERLAP_ERROR_MESSAGE)
    }
}

/** vehicleStatus is never stored — always computed from the linked Personnel doc at read time. */
async function withVehicleStatus<T extends { employeeName: unknown; startDate: Date; endDate: Date }>(doc: T) {
    const personnel = await PersonnelModel.findById(doc.employeeName as string)
        .select('vehicleEntryStartDate vehicleEntryEndDate vehicleNumber')
        .lean()
    const hasVehicleApproval = !!(
        personnel?.vehicleEntryStartDate &&
        personnel?.vehicleEntryEndDate &&
        personnel.vehicleEntryStartDate <= doc.startDate &&
        personnel.vehicleEntryEndDate >= doc.endDate
    )
    return {
        ...doc,
        vehicleStatus: personnel ? { hasVehicleApproval, vehicleNumber: personnel.vehicleNumber ?? null } : null,
    }
}

export async function listReserveDays(params: ListReserveDaysParams) {
    const { page, limit, search, filters, sortField, sortOrder = 'asc' } = params
    const query: Record<string, unknown> = { isDeleted: false }
    const andClauses: Record<string, unknown>[] = []

    if (search) {
        const orClauses: Record<string, unknown>[] = []
        orClauses.push(...buildDateSearchClauses('startDate', search))
        orClauses.push(...buildDateSearchClauses('endDate', search))

        for (const field of ['fundingSource', 'orderType', 'requestStatus', 'baseAccessApproval']) {
            orClauses.push(...buildLabelSearchClauses(field, search, choicesFor(field)))
        }

        const matchingPersonnel = await PersonnelModel.aggregate([
            {
                $addFields: {
                    __concat: {
                        $toLower: { $concat: ['$firstName', ' ', '$lastName', ' ', { $toString: '$personalNumber' }] },
                    },
                },
            },
            { $match: { __concat: { $regex: search, $options: 'i' } } },
            { $project: { _id: 1 } },
        ])
        if (matchingPersonnel.length > 0) {
            orClauses.push({ employeeName: { $in: matchingPersonnel.map((p) => p._id) } })
        }

        // No sub-search matched anything — the search term should filter to zero
        // results, not fall through to "no filter applied".
        andClauses.push(orClauses.length > 0 ? { $or: orClauses } : { _id: null })
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
    const labelSortKeyExpr = sortField ? buildLabelSortKeyExpr(sortField, choicesFor(sortField)) : undefined

    let rawItems: ReserveDayDocument[]
    let total: number

    if (sortField === 'employeeName') {
        // Sort by the populated employee's name (relation field — no scalar to sort on directly)
        ;[rawItems, total] = await Promise.all([
            ReserveDayModel.aggregate([
                { $match: query },
                {
                    $lookup: {
                        from: 'personnel',
                        localField: 'employeeName',
                        foreignField: '_id',
                        as: '__employee',
                    },
                },
                {
                    $addFields: {
                        __sortKey: {
                            $concat: [
                                { $ifNull: [{ $arrayElemAt: ['$__employee.lastName', 0] }, ''] },
                                { $ifNull: [{ $arrayElemAt: ['$__employee.firstName', 0] }, ''] },
                            ],
                        },
                    },
                },
                { $sort: { __sortKey: sortKeyDir } },
                { $skip: skip },
                { $limit: limit },
                { $project: { __employee: 0, __sortKey: 0 } },
            ]).collation({ locale: 'he', numericOrdering: true }),
            ReserveDayModel.countDocuments(query),
        ])
        rawItems = await ReserveDayModel.populate(rawItems, [{ path: 'employeeName', select: 'firstName lastName personalNumber' }])
    } else if (labelSortKeyExpr) {
        ;[rawItems, total] = await Promise.all([
            ReserveDayModel.aggregate([
                { $match: query },
                { $addFields: { __sortKey: labelSortKeyExpr } },
                { $sort: { __sortKey: sortKeyDir } },
                { $skip: skip },
                { $limit: limit },
                { $project: { __sortKey: 0 } },
            ]).collation({ locale: 'he', numericOrdering: true }),
            ReserveDayModel.countDocuments(query),
        ])
    } else {
        const sortSpec: Record<string, 1 | -1> = sortField ? { [sortField]: sortKeyDir } : { createdAt: -1 }
        ;[rawItems, total] = await Promise.all([
            ReserveDayModel.find(query)
                .collation({ locale: 'he', numericOrdering: true })
                .sort(sortSpec)
                .skip(skip)
                .limit(limit)
                .populate('employeeName', 'firstName lastName personalNumber')
                .lean() as unknown as Promise<ReserveDayDocument[]>,
            ReserveDayModel.countDocuments(query),
        ])
    }

    const items = await Promise.all(rawItems.map(withVehicleStatus))
    return { items, total }
}

export async function getReserveDayById(id: string) {
    const doc = await ReserveDayModel.findOne({ _id: id, isDeleted: false })
        .populate('employeeName', 'firstName lastName personalNumber')
        .lean()
    if (!doc) throw new NotFoundError('Reserve day')
    return withVehicleStatus(doc)
}

export async function createReserveDay(body: unknown) {
    const validated = ReserveDaySchema.parse(body)
    await assertNoOverlap(validated.employeeName, validated.startDate, validated.endDate)
    const created = await ReserveDayModel.create(validated)
    return created.toObject()
}

export async function updateReserveDay(id: string, body: unknown) {
    const existing = await ReserveDayModel.findOne({ _id: id, isDeleted: false })
    if (!existing) throw new NotFoundError('Reserve day')

    const validated = ReserveDayUpdateSchema.parse(body)

    const employeeName = validated.employeeName ?? String(existing.employeeName)
    const startDate = validated.startDate ?? existing.startDate
    const endDate = validated.endDate ?? existing.endDate
    await assertNoOverlap(employeeName, startDate, endDate, id)

    Object.assign(existing, validated)
    await existing.save()
    return existing.toObject()
}

export async function deleteReserveDay(id: string) {
    const doc = await ReserveDayModel.findOneAndUpdate(
        { _id: id, isDeleted: false },
        { $set: { isDeleted: true } },
        { new: true }
    )
    if (!doc) throw new NotFoundError('Reserve day')
    return doc.toObject()
}

export async function getReserveDayMetrics() {
    const [total, pending, approved, denied] = await Promise.all([
        ReserveDayModel.countDocuments({ isDeleted: false }),
        ReserveDayModel.countDocuments({ isDeleted: false, requestStatus: 'pending' }),
        ReserveDayModel.countDocuments({ isDeleted: false, requestStatus: 'approved' }),
        ReserveDayModel.countDocuments({ isDeleted: false, requestStatus: 'denied' }),
    ])

    return [
        { id: 'total', title: 'סה"כ צווים', icon: 'FaList', color: 'blue.500', value: total },
        { id: 'pending', title: 'ממתינים לאישור', icon: 'FaHourglassHalf', color: 'orange.500', value: pending },
        { id: 'approved', title: 'אושרו', icon: 'FaCheck', color: 'green.500', value: approved },
        { id: 'denied', title: 'נדחו', icon: 'FaTimes', color: 'red.600', value: denied },
    ]
}

export async function updateAttendance(employeeId: string, date: string, hasAttended: boolean) {
    const dayStart = new Date(`${date}T00:00:00.000Z`)
    const dayEnd = new Date(`${date}T23:59:59.999Z`)

    const matches = await ReserveDayModel.find({
        employeeName: employeeId,
        isDeleted: false,
        startDate: { $lte: dayEnd },
        endDate: { $gte: dayStart },
    })

    await Promise.all(
        matches.map((m) => {
            m.attendance.set(date, hasAttended)
            return m.save()
        })
    )

    return matches.map((m) => m.toObject())
}
