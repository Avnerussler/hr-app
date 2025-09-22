/**
 * Utility functions for quota management
 */

/**
 * Get color palette based on occupancy rate
 * @param occupancyRate - The occupancy rate percentage (0-100)
 * @returns Color palette name for the progress bar
 */
export const getOccupancyColorPalette = (occupancyRate: number): string => {
    if (occupancyRate >= 100) return 'red'
    if (occupancyRate >= 80) return 'orange' 
    if (occupancyRate >= 60) return 'yellow'
    return 'green'
}

/**
 * Get occupancy status text based on rate
 * @param occupancyRate - The occupancy rate percentage (0-100)
 * @returns Status description
 */
export const getOccupancyStatus = (occupancyRate: number): string => {
    if (occupancyRate >= 100) return 'מלא'
    if (occupancyRate >= 80) return 'כמעט מלא'
    if (occupancyRate >= 60) return 'גבוה'
    if (occupancyRate > 0) return 'זמין'
    return 'פנוי'
}

/**
 * Format quota display text
 * @param currentOccupancy - Current number of people assigned
 * @param quota - Maximum capacity
 * @param occupancyRate - Occupancy rate percentage
 * @returns Formatted display text
 */
export const formatQuotaDisplay = (
    currentOccupancy: number,
    quota: number,
    occupancyRate: number
): string => {
    return `${currentOccupancy}/${quota} (${occupancyRate}%)`
}

/**
 * Get attendance status color based on attendance rate
 */
export const getAttendanceStatusColor = (attendanceRate: number, hasData: boolean) => {
    if (!hasData) return 'gray.100' // No attendance data recorded
    
    if (attendanceRate >= 90) return 'green.100' // Excellent attendance
    if (attendanceRate >= 75) return 'yellow.100' // Good attendance  
    if (attendanceRate >= 50) return 'orange.100' // Poor attendance
    return 'red.100' // Very poor attendance
}

/**
 * Get attendance status icon color
 */
export const getAttendanceIconColor = (attendanceRate: number, hasData: boolean) => {
    if (!hasData) return 'gray.500'
    
    if (attendanceRate >= 90) return 'green.600'
    if (attendanceRate >= 75) return 'yellow.600'
    if (attendanceRate >= 50) return 'orange.600'
    return 'red.600'
}