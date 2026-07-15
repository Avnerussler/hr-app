import { addDays } from 'date-fns'
import { IFormSubmissions } from '../models/FormSubmissions'

export const isSameDay = (a: Date, b: Date): boolean =>
    a.getUTCFullYear() === b.getUTCFullYear() &&
    a.getUTCMonth() === b.getUTCMonth() &&
    a.getUTCDate() === b.getUTCDate()

const toDate = (val: unknown): Date | null => {
    if (!val) return null
    const d = val instanceof Date ? val : new Date(val as string)
    return isNaN(d.getTime()) ? null : d
}

export const hasMoreThan1ConsecutiveDay = (reserveDays: Date[]): boolean => {
    if (!reserveDays || reserveDays.length < 2) return false

    const sorted = [...reserveDays].sort((a, b) => a.getTime() - b.getTime())

    let consecutiveCount = 1
    for (let i = 1; i < sorted.length; i++) {
        const diffInDays = Math.round(
            (sorted[i].getTime() - sorted[i - 1].getTime()) / (1000 * 60 * 60 * 24)
        )
        if (diffInDays === 1) {
            consecutiveCount++
            if (consecutiveCount > 1) return true
        } else {
            consecutiveCount = 1
        }
    }
    return false
}

export const isEmployeeEndingToday = (
    currentReservation: IFormSubmissions,
    allEmployeeReservations: IFormSubmissions[],
    date: Date,
    hasConsecutiveDays: boolean
): boolean => {
    if (!hasConsecutiveDays) return false

    const endDate = toDate(currentReservation.formData.endDate)
    if (!endDate || !isSameDay(endDate, date)) return false

    const nextDay = addDays(date, 1)

    const hasConsecutiveOrder = allEmployeeReservations.some((otherRes: any) => {
        if (otherRes._id.toString() === (currentReservation._id as unknown as { toString(): string }).toString()) {
            return false
        }
        const startDate = toDate(otherRes.formData.startDate)
        return startDate !== null && isSameDay(startDate, nextDay)
    })

    return !hasConsecutiveOrder
}
