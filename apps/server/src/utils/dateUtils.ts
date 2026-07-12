import { format, addDays, parseISO } from 'date-fns'
import { IFormSubmissions } from '../models/FormSubmissions'

/**
 * Check if an array of date strings contains more than 1 consecutive day
 * @param reserveDays - Array of date strings in ISO format (YYYY-MM-DD)
 * @returns true if there are more than 1 consecutive day, false otherwise
 */
export const hasMoreThan1ConsecutiveDay = (reserveDays: string[]): boolean => {
    if (!reserveDays || reserveDays.length < 2) return false

    // Sort dates and convert to Date objects
    const sortedDates = reserveDays
        .map((d) => new Date(d))
        .sort((a, b) => a.getTime() - b.getTime())

    // Check for 2 or more consecutive days
    let consecutiveCount = 1
    for (let i = 1; i < sortedDates.length; i++) {
        const prevDate = sortedDates[i - 1]
        const currDate = sortedDates[i]
        const diffInDays = Math.round(
            (currDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24)
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

/**
 * Check if an employee has a consecutive reserve order starting the next day
 * Used to determine if today is truly an "ending" day or if the reservation continues
 *
 * @param currentReservation - The current reservation being checked
 * @param allEmployeeReservations - All reservations for this employee
 * @param date - The date being checked (YYYY-MM-DD)
 * @param hasConsecutiveDays - Whether the current reservation has consecutive days
 * @returns true if this is an ending day (no consecutive order), false if reservation continues
 */
export const isEmployeeEndingToday = (
    currentReservation: IFormSubmissions,
    allEmployeeReservations: IFormSubmissions[],
    date: string,
    hasConsecutiveDays: boolean
): boolean => {
    // Single-day reservations never count as "ending today"
    if (!hasConsecutiveDays) {
        return false
    }

    const formData = currentReservation.formData

    // First check: is today the end date?
    if (formData.endDate !== date) {
        return false
    }

    // Calculate the next day
    const nextDay = format(addDays(parseISO(date), 1), 'yyyy-MM-dd')

    // Check if any other reservation for this employee starts on the next day
    const hasConsecutiveOrder = allEmployeeReservations.some(
        (otherRes: any) => {
            const isCurrentRes =
                otherRes._id.toString() === (currentReservation._id as unknown as { toString(): string }).toString()

            // Skip the current reservation
            if (isCurrentRes) {
                return false
            }

            const otherFormData = otherRes.formData
            const startsNextDay = otherFormData.startDate === nextDay
            // Check if the other reservation starts on the next day
            return startsNextDay
        }
    )

    // If there's a consecutive order, this is NOT ending today (continuation)
    // If there's NO consecutive order, this IS ending today
    return !hasConsecutiveOrder
}
