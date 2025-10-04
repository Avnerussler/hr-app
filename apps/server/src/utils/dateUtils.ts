/**
 * Check if an array of date strings contains more than 2 consecutive days
 * @param reserveDays - Array of date strings in ISO format (YYYY-MM-DD)
 * @returns true if there are more than 2 consecutive days, false otherwise
 */
export const hasMoreThan2ConsecutiveDays = (reserveDays: string[]): boolean => {
    if (!reserveDays || reserveDays.length < 3) return false

    // Sort dates and convert to Date objects
    const sortedDates = reserveDays
        .map(d => new Date(d))
        .sort((a, b) => a.getTime() - b.getTime())

    // Check for 3 or more consecutive days
    let consecutiveCount = 1
    for (let i = 1; i < sortedDates.length; i++) {
        const prevDate = sortedDates[i - 1]
        const currDate = sortedDates[i]
        const diffInDays = Math.round((currDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24))

        if (diffInDays === 1) {
            consecutiveCount++
            if (consecutiveCount > 2) return true
        } else {
            consecutiveCount = 1
        }
    }
    return false
}
