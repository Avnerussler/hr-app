import { format, addDays, parseISO } from 'date-fns'

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
    currentReservation: any,
    allEmployeeReservations: any[],
    date: string,
    hasConsecutiveDays: boolean
): boolean => {
    const formData = currentReservation.formData

    // First check: is today the end date?
    if (formData.endDate !== date) {
        return false
    }

    // If this is a single-day reservation (no consecutive days),
    // we still need to check if there's a continuation the next day
    // For multi-day reservations, only report ending if it has consecutive days
    if (!hasConsecutiveDays && formData.startDate !== formData.endDate) {
        // Multi-day reservation but doesn't have consecutive days (shouldn't happen)
        return false
    }

    // Calculate the next day
    const nextDay = format(addDays(parseISO(date), 1), 'yyyy-MM-dd')

    // Check if any other reservation for this employee starts on the next day
    const hasConsecutiveOrder = allEmployeeReservations.some(
        (otherRes: any) => {
            const isCurrentRes =
                otherRes._id.toString() === currentReservation._id.toString()
            console.log('Checking reservation:', {
                id: otherRes._id,
                startDate: otherRes.formData.startDate,
                endDate: otherRes.formData.endDate,
                isCurrent: isCurrentRes,
            })

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
