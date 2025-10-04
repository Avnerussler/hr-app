/**
 * Type definitions for query hooks
 * Extracted from query files for better organization
 */

// ============================================
// Employee Attendance Types
// ============================================

export interface EmployeeAttendance {
    _id: string
    name: string
    personalNumber?: string
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
    requestStatus?: string // Status of the reserve days request (pending, approved, denied)
}

export interface DailyAttendanceData {
    employees: EmployeeAttendance[]
    statistics: {
        startingToday: number
        endingToday: number
        totalRequired: number
        totalAttended: number
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
    occupancyRate?: number
    capacityLeft: number
    capacityLeftPercent: number
}

export interface QuotasWithOccupancyResponse {
    data: QuotaWithOccupancy[]
    summary: {
        totalQuotas: number
        totalOccupancy: number
        totalCapacityLeft: number
        averageOccupancyRate: number
    }
}
