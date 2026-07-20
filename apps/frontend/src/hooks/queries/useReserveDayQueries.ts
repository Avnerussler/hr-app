import { useQuery } from '@tanstack/react-query'
import axios from 'axios'
import { BASE_URL } from '@/config'
import { ReserveDay } from '@hr-app/shared-types'

export interface EmployeeSummary {
    _id: string
    firstName: string
    lastName: string
    personalNumber: string
}

export interface VehicleStatus {
    hasVehicleApproval: boolean
    hasPartialVehicleApproval: boolean
    vehicleNumber: string | null
}

export interface ReserveDayRecord extends Omit<ReserveDay, 'employeeName' | 'startDate' | 'endDate'> {
    _id: string
    employeeName: EmployeeSummary | null
    startDate: string
    endDate: string
    vehicleStatus: VehicleStatus | null
    createdAt: string
    updatedAt: string
}

export interface ReserveDayListParams {
    page: number
    limit: number
    search?: string
    filters?: Record<string, unknown>
    sortField?: string
    sortOrder?: 'asc' | 'desc'
}

export interface ReserveDayListResponse {
    items: ReserveDayRecord[]
    pagination: { page: number; limit: number; total: number; pages: number }
}

export function useReserveDayListQuery(params: ReserveDayListParams) {
    return useQuery<ReserveDayListResponse>({
        queryKey: ['reserveDays', 'list', params],
        queryFn: async () => {
            const { data } = await axios.get(`${BASE_URL}/reserve-days`, {
                params: { ...params, filters: params.filters ? JSON.stringify(params.filters) : undefined },
            })
            return data
        },
    })
}

export function useReserveDayDetailQuery(id: string | undefined) {
    return useQuery<ReserveDayRecord>({
        queryKey: ['reserveDays', 'detail', id],
        queryFn: async () => {
            const { data } = await axios.get(`${BASE_URL}/reserve-days/${id}`)
            return data
        },
        enabled: !!id,
    })
}

export interface CalculatedMetric {
    id: string
    title: string
    value: number
    icon?: string
    color?: string
}

export function useReserveDayMetricsQuery() {
    return useQuery<CalculatedMetric[]>({
        queryKey: ['reserveDays', 'metrics'],
        queryFn: async () => {
            const { data } = await axios.get(`${BASE_URL}/reserve-days/metrics`)
            return data
        },
    })
}

/**
 * Live vehicle-approval lookup for the currently-selected employee and date range in the form — no save required.
 * Approval holds when the personnel's vehicle-entry range covers the reserve day's start/end dates.
 */
export function useEmployeeVehicleStatusQuery(
    employeeId: string | null | undefined,
    startDate: string | null | undefined,
    endDate: string | null | undefined
) {
    return useQuery<VehicleStatus | null>({
        queryKey: ['personnel', 'detail', employeeId, 'vehicleStatus', startDate, endDate],
        queryFn: async () => {
            const { data } = await axios.get(`${BASE_URL}/personnel/${employeeId}`)
            const approvalStart = data.entryStartDate ? new Date(data.entryStartDate) : null
            const approvalEnd = data.entryEndDate ? new Date(data.entryEndDate) : null
            const rangeStart = startDate ? new Date(startDate) : null
            const rangeEnd = endDate ? new Date(endDate) : null
            const hasVehicleApproval = !!(
                approvalStart &&
                approvalEnd &&
                rangeStart &&
                rangeEnd &&
                approvalStart <= rangeStart &&
                approvalEnd >= rangeEnd
            )
            const hasPartialVehicleApproval =
                !hasVehicleApproval &&
                !!(approvalStart && approvalEnd && rangeStart && rangeEnd && approvalStart <= rangeEnd && approvalEnd >= rangeStart)
            return { hasVehicleApproval, hasPartialVehicleApproval, vehicleNumber: data.vehicleNumber ?? null }
        },
        enabled: !!employeeId && !!startDate && !!endDate,
    })
}

export interface ReservedDateRange {
    startDate: string
    endDate: string
}

/** All existing reserve-day windows for an employee — used to block already-reserved days in the date-range picker. */
export function useEmployeeReservedRangesQuery(employeeId: string | null | undefined, excludeId?: string) {
    return useQuery<ReservedDateRange[]>({
        queryKey: ['reserveDays', 'employeeRanges', employeeId],
        queryFn: async () => {
            const { data } = await axios.get<ReserveDayListResponse>(`${BASE_URL}/reserve-days`, {
                params: { page: 1, limit: 1000, filters: JSON.stringify({ employeeName: employeeId }) },
            })
            return data.items
                .filter((item) => item._id !== excludeId)
                .map((item) => ({ startDate: item.startDate, endDate: item.endDate }))
        },
        enabled: !!employeeId,
    })
}
