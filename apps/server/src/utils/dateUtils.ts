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
