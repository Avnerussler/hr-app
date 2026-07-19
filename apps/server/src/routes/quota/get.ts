import Quota from '../../models/Quota'
import { ReserveDayModel } from '../../models/ReserveDay'
import { PersonnelModel } from '../../models/Personnel'
import { Request, Response, Router } from 'express'
import logger from '../../config/logger'
import { asyncHandler, validate, schemas } from '../../middleware'
import { isEmployeeEndingToday, isSameDay } from '../../utils'
import { eachDayOfInterval } from 'date-fns'

const router = Router()

// List quotas with filtering and pagination
router.get(
    '/',
    asyncHandler(async (req: Request, res: Response) => {
        try {
            const {
                page = 1,
                limit = 100,
                startDate,
                endDate,
                ...filters
            } = req.query

            let query: any = {}

            // Date range filter
            if (startDate || endDate) {
                query.date = {}
                if (startDate) query.date.$gte = startDate
                if (endDate) query.date.$lte = endDate
            }

            // Apply other filters
            Object.assign(query, filters)

            const quotas = await Quota.find(query)
                .sort({ date: 1 })
                .limit(Number(limit))
                .skip((Number(page) - 1) * Number(limit))

            const total = await Quota.countDocuments(query)
            const pages = Math.ceil(total / Number(limit))

            res.status(200).json({
                data: { quotas },
                pagination: {
                    page: Number(page),
                    limit: Number(limit),
                    total,
                    pages,
                },
            })
        } catch (error) {
            logger.error('Error getting quotas:', error)
            res.status(500).json({ message: 'Error getting quotas', error })
        }
    })
)

// Get single quota by ID
router.get(
    '/:id',
    asyncHandler(async (req: Request, res: Response) => {
        try {
            const quota = await Quota.findById(req.params.id)

            if (!quota) {
                return res.status(404).json({ message: 'Quota not found' })
            }

            res.status(200).json({ data: quota })
        } catch (error) {
            logger.error('Error getting quota:', error)
            res.status(500).json({ message: 'Error getting quota', error })
        }
    })
)

// Get quota with occupancy for a specific date
router.get(
    '/date/:date',
    asyncHandler(async (req: Request, res: Response) => {
        try {
            const date = String(req.params.date)

            const result = await Quota.getQuotaWithOccupancy(date)

            res.status(200).json({
                data: {
                    date,
                    ...result,
                },
            })
        } catch (error) {
            logger.error('Error getting quota with occupancy:', error)
            res.status(500).json({
                message: 'Error getting quota with occupancy',
                error,
            })
        }
    })
)

// Get quotas for a date range (lightweight)
router.get(
    '/range/:startDate/:endDate',
    asyncHandler(async (req: Request, res: Response) => {
        try {
            const startDate = String(req.params.startDate)
            const endDate = String(req.params.endDate)

            const quotas = await Quota.findByDateRange(startDate, endDate)

            res.status(200).json({
                data: { quotas },
            })
        } catch (error) {
            logger.error('Error getting quotas for range:', error)
            res.status(500).json({
                message: 'Error getting quotas for range',
                error,
            })
        }
    })
)

// Get quotas with occupancy for date range (main calendar endpoint)
router.get(
    '/occupancy/range/:startDate/:endDate',
    asyncHandler(async (req: Request, res: Response) => {
        try {
            const startDate = String(req.params.startDate)
            const endDate = String(req.params.endDate)
            const { occupancyOnly } = req.query

            if (occupancyOnly === 'true') {
                // Return only occupancy data (lightweight)
                const occupancyData = await Quota.getOccupancyForDateRange(
                    startDate,
                    endDate
                )
                return res.status(200).json({ data: occupancyData })
            }

            // Return full quota + occupancy data for calendar
            const quotasWithOccupancy =
                await Quota.getQuotasWithOccupancyForRange(startDate, endDate)

            // Calculate summary statistics
            // Calculate average quota across all days in the date range
            const totalQuotaSum = quotasWithOccupancy.reduce(
                (sum, item) => sum + (item.quota || 0),
                0
            )
            const averageQuota =
                quotasWithOccupancy.length > 0
                    ? Math.round(totalQuotaSum / quotasWithOccupancy.length)
                    : 0

            const summary = {
                averageQuota,
                totalOccupancy: quotasWithOccupancy.reduce(
                    (sum, item) => sum + item.currentOccupancy,
                    0
                ),
                totalCapacityLeft: quotasWithOccupancy.reduce(
                    (sum, item) => sum + item.capacityLeft,
                    0
                ),
                averageOccupancyRate:
                    Math.round(
                        quotasWithOccupancy.reduce(
                            (sum, item) => sum + (item.occupancyRate || 0),
                            0
                        ) /
                            quotasWithOccupancy.filter(
                                (item) => item.occupancyRate !== undefined
                            ).length
                    ) || 0,
            }

            res.status(200).json({
                data: quotasWithOccupancy,
                summary,
            })
        } catch (error) {
            logger.error(
                'Error getting quotas with occupancy for range:',
                error
            )
            res.status(500).json({
                message: 'Error getting quotas with occupancy for range',
                error,
            })
        }
    })
)

interface EmployeeAttendanceRecord {
    _id: string
    employeeId: string
    name: string
    lastName: string
    personalNumber: string
    phone: string
    reserveUnit: string
    workPlace: string
    orderNumber: string
    orderType: string
    isActive: boolean
    startDate: string
    endDate: string
    isStartingToday: boolean
    isEndingToday: boolean
    isAttendanceRequired: boolean
    hasAttended: boolean
    workDays: Date[]
    reserveDays: Date[]
    requestStatus: string
    fundingSource: string
    hasExpiredVehicleApproval: boolean
}

// Get employees scheduled for a specific date
router.get(
    '/employees/:date',
    validate(schemas.dateParam),
    asyncHandler(async (req: Request, res: Response) => {
        try {
            const date = (req.params as unknown as { date: Date }).date
            const {
                filter = 'all',
                search = '',
                page = '1',
                limit = '30',
            } = req.query as {
                filter?: string
                search?: string
                page?: string
                limit?: string
            }
            const pageNum = Math.max(1, parseInt(page, 10) || 1)
            const limitNum = Math.max(1, Math.min(10000, parseInt(limit, 10) || 30))

            // First, find all reservations that include this specific date to get the employee IDs
            const reservationsForDate = await ReserveDayModel.find({
                isDeleted: false,
                requestStatus: { $ne: 'denied' },
                $or: [
                    {
                        startDate: { $lte: date },
                        endDate: { $gte: date },
                    },
                    {
                        startDate: date,
                        endDate: { $exists: false },
                    },
                ],
            }).lean()

            // Get unique employee document IDs
            const employeeDocIds = Array.from(
                new Set(
                    reservationsForDate
                        .map((r: any) => r.employeeName?.toString() ?? null)
                        .filter((id: any) => id)
                )
            )

            // Fetch full employee data AND all their reservations in parallel
            const [employeeRecords, allEmployeeReservations] =
                await Promise.all([
                    PersonnelModel.find({
                        _id: { $in: employeeDocIds },
                    }).lean(),
                    ReserveDayModel.find({
                        isDeleted: false,
                        requestStatus: { $ne: 'denied' },
                        employeeName: { $in: employeeDocIds },
                    }).lean(),
                ])

            // Create a map of employee data by document ID
            const employeeDataMap = new Map()
            employeeRecords.forEach((record: any) => {
                employeeDataMap.set(record._id.toString(), record)
            })

            // Create a map of reservations by employee ID for checking consecutive orders
            const reservationsByEmployee = new Map<string, any[]>()
            allEmployeeReservations.forEach((reservation: any) => {
                const employeeId = reservation.employeeName?.toString() ?? null

                if (employeeId) {
                    if (!reservationsByEmployee.has(employeeId)) {
                        reservationsByEmployee.set(employeeId, [])
                    }
                    reservationsByEmployee.get(employeeId)!.push(reservation)
                }
            })

            const dateStr = date.toISOString().slice(0, 10)

            // Map reservations to employee attendance data
            const employees = reservationsForDate
                .map((reservation: any): EmployeeAttendanceRecord | null => {
                    const employeeId = reservation.employeeName?.toString() ?? null

                    // Skip this reservation if no valid employee ID
                    if (!employeeId) {
                        logger.warn(
                            `Skipping reservation ${reservation._id} - no valid employeeName`
                        )
                        return null
                    }

                    // Handle employee name - get from personnel data
                    let employeeName = 'Unknown Employee'
                    let lastName = ''
                    let personalNumber = ''
                    let phone = ''
                    let reserveUnit = ''
                    let workPlace = ''
                    let hasExpiredVehicleApproval = false

                    const fullEmployeeData = employeeDataMap.get(employeeId)
                    if (fullEmployeeData) {
                        employeeName = fullEmployeeData.firstName || 'Unknown Employee'
                        lastName = fullEmployeeData.lastName || ''
                        personalNumber =
                            fullEmployeeData.personalNumber?.toString() ||
                            fullEmployeeData.userId?.toString() ||
                            ''
                        phone = fullEmployeeData.phone || ''
                        reserveUnit = fullEmployeeData.reserveUnit || ''
                        workPlace = fullEmployeeData.workPlace || ''
                        // Only flag when an approval range IS set but has already passed by this date.
                        // No range set, or date still within/before the range, is not a warning case.
                        hasExpiredVehicleApproval = !!(
                            fullEmployeeData.vehicleEntryStartDate &&
                            fullEmployeeData.vehicleEntryEndDate &&
                            new Date(fullEmployeeData.vehicleEntryEndDate) < date
                        )
                    }

                    const reserveDaysArray: Date[] = []
                    if (reservation.startDate && reservation.endDate) {
                        try {
                            reserveDaysArray.push(
                                ...eachDayOfInterval({
                                    start: new Date(reservation.startDate),
                                    end: new Date(reservation.endDate),
                                })
                            )
                        } catch (dateError) {
                            logger.warn(
                                `Invalid date range for reservation ${reservation._id}: startDate=${reservation.startDate}, endDate=${reservation.endDate}`,
                                dateError
                            )
                            if (reservation.startDate) {
                                reserveDaysArray.push(new Date(reservation.startDate))
                            }
                        }
                    }
                    const hasConsecutiveDays = reserveDaysArray.length > 1

                    // Check if this employee is truly ending today or if reservation continues
                    const employeeReservations =
                        reservationsByEmployee.get(employeeId) || []
                    const isEndingToday = isEmployeeEndingToday(
                        reservation,
                        employeeReservations,
                        date,
                        hasConsecutiveDays
                    )

                    const startDate = reservation.startDate ? new Date(reservation.startDate) : null

                    return {
                        _id: employeeId,
                        employeeId: employeeId,
                        name: employeeName,
                        lastName: lastName,
                        personalNumber: personalNumber,
                        phone: phone,
                        reserveUnit,
                        workPlace,
                        orderNumber: '',
                        orderType: reservation.orderType || '',
                        isActive: true,
                        startDate: reservation.startDate,
                        endDate: reservation.endDate,
                        isStartingToday: startDate !== null && isSameDay(startDate, date),
                        isEndingToday: isEndingToday,
                        isAttendanceRequired: true,
                        hasAttended: reservation.attendance?.get?.(dateStr) === true ||
                            reservation.attendance?.[dateStr] === true,
                        workDays: [], // Could be calculated from the date range
                        reserveDays: reserveDaysArray,
                        requestStatus: reservation.requestStatus || '',
                        fundingSource: reservation.fundingSource || '',
                        hasExpiredVehicleApproval,
                    }
                })
                .filter((emp): emp is EmployeeAttendanceRecord => emp !== null) as EmployeeAttendanceRecord[]

            // Calculate statistics from full unfiltered array
            const statistics = {
                startingToday: employees.filter((emp) => emp.isStartingToday).length,
                endingToday: employees.filter((emp) => emp.isEndingToday).length,
                totalRequired: employees.length,
                totalAttended: employees.filter((emp) => emp.hasAttended).length,
                internalCount: employees.filter((emp) => emp.fundingSource === 'internal').length,
                externalCount: employees.filter((emp) => emp.fundingSource === 'external').length,
            }

            // Apply filter
            let filtered = employees
            switch (filter) {
                case 'starting':
                    filtered = filtered.filter((emp) => emp.isStartingToday)
                    break
                case 'ending':
                    filtered = filtered.filter((emp) => emp.isEndingToday)
                    break
                case 'attended':
                    filtered = filtered.filter((emp) => emp.hasAttended)
                    break
                case 'internal':
                    filtered = filtered.filter((emp) => emp.fundingSource === 'internal')
                    break
                case 'external':
                    filtered = filtered.filter((emp) => emp.fundingSource === 'external')
                    break
            }

            // Apply text search
            if (search && typeof search === 'string' && search.trim()) {
                const q = search.trim().toLowerCase()
                filtered = filtered.filter((emp) => {
                    const haystack = [
                        emp.name,
                        emp.lastName,
                        emp.personalNumber,
                        emp.phone,
                        emp.reserveUnit,
                        emp.workPlace,
                        emp.orderNumber,
                        emp.orderType,
                    ]
                        .filter(Boolean)
                        .join(' ')
                        .toLowerCase()
                    return haystack.includes(q)
                })
            }

            // Sort by last name
            filtered.sort((a, b) => a.lastName.localeCompare(b.lastName, 'he'))

            // Paginate
            const total = filtered.length
            const totalPages = Math.ceil(total / limitNum) || 1
            const pagedEmployees = filtered.slice((pageNum - 1) * limitNum, pageNum * limitNum)

            res.status(200).json({
                data: {
                    date: dateStr,
                    employees: pagedEmployees,
                    statistics,
                    pagination: {
                        page: pageNum,
                        limit: limitNum,
                        total,
                        totalPages,
                    },
                },
            })
        } catch (error) {
            logger.error('Error getting employees for date:', error)
            res.status(500).json({
                message: 'Error getting employees for date',
                error,
            })
        }
    })
)

export { router as GetQuotaRouter }
