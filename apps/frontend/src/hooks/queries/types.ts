/**
 * Type definitions for query hooks
 * Extracted from query files for better organization
 */

import type { RequestStatus } from '@hr-app/shared-types'

// ============================================
// Employee Attendance Types
// ============================================

export interface EmployeeAttendance {
    _id: string
    reserveDayId?: string
    name: string
    lastName?: string
    personalNumber?: string
    phone?: string
    reserveUnit?: string
    workPlace?: string
    orderNumber?: string
    orderType?: string
    isActive: boolean
    startDate?: string
    endDate?: string
    isStartingToday: boolean
    isEndingToday: boolean
    isAttendanceRequired: boolean
    hasAttended: boolean
    workDays?: string[] // Array of dates this employee should work
    reserveDays?: string[] // Array of reserve duty dates
    requestStatus?: RequestStatus // Status of the reserve days request (pending, approved, denied)
    fundingSource?: 'internal' | 'external' // Funding source (internal, external)
    projectId?: string | null
    projectName?: string | null
    // Only true when the employee HAS a vehicle-approval range configured and it has already
    // ended by this date. No range set, or the date still within/before the range, is false.
    hasExpiredVehicleApproval: boolean
}

export interface AvailableAttendanceFilters {
    requestStatuses: RequestStatus[]
    orderTypes: string[]
    projects: Array<{ value: string; label: string }>
}

export interface DailyAttendanceData {
    employees: EmployeeAttendance[]
    statistics: {
        startingToday: number
        endingToday: number
        totalRequired: number
        totalAttended: number
        internalCount: number
        externalCount: number
    }
    availableFilters: AvailableAttendanceFilters
    pagination?: {
        page: number
        limit: number
        total: number
        totalPages: number
    }
}

export interface AttendanceSummaryDay {
    totalRequired: number
    totalAttended: number
    attendanceRate: number
    managerReported: boolean
    hasUnapprovedReserveDays: boolean
    unapprovedEmployees: Array<{
        name: string
        status: string
    }>
    hasExpiredVehicleApproval: boolean
    expiredVehicleApprovalEmployees: Array<{
        name: string
        status: string
    }>
}

export type AttendanceSummary = Record<string, AttendanceSummaryDay>

export interface ManagerReportStatus {
    hasReported: boolean
    reportData?: {
        reportedAt: string
        reportedBy: string
        quotaId: string
    }
}

export interface AttendanceRecord {
    date: string
    hasAttended: boolean
    isReported: boolean
}

export interface AttendanceHistoryData {
    employeeId: string
    employeeName: string
    totalDays: number
    attendedDays: number
    attendanceRate: number
    records: AttendanceRecord[]
}

export interface EmployeeWorkRange {
    startDate?: string
    endDate?: string
    workDays: string[]
    reserveDays: string[]
}

// ============================================
// Quota Types
// ============================================

export interface QuotaWithOccupancy {
    date: string
    quota?: number
    currentOccupancy: number
    externalOccupancy: number
    occupancyRate?: number
    capacityLeft: number
    capacityLeftPercent: number
}

export interface QuotasWithOccupancyResponse {
    data: QuotaWithOccupancy[]
    summary: {
        averageQuota: number
        totalOccupancy: number
        totalCapacityLeft: number
        averageOccupancyRate: number
    }
}
