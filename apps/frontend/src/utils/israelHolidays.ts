/**
 * Israeli holidays utility - offline storage and management
 */

export interface Holiday {
    id: string // Unique identifier
    date: string // YYYY-MM-DD format
    name: string
    nameHebrew: string
    type: 'jewish' | 'civil' | 'custom'
    isWorkingDay: boolean
    description?: string
}

// Israeli holidays for 2025 (built-in)
export const ISRAELI_HOLIDAYS_2025: Holiday[] = [
    {
        id: 'new-year-2025',
        date: '2025-01-01',
        name: 'New Year',
        nameHebrew: 'ראש השנה הגרגוריאני',
        type: 'civil',
        isWorkingDay: true
    },
    {
        id: 'passover-2025-1',
        date: '2025-04-13',
        name: 'Passover',
        nameHebrew: 'פסח',
        type: 'jewish',
        isWorkingDay: false
    },
    {
        id: 'passover-2025-2',
        date: '2025-04-14',
        name: 'Passover (Day 2)',
        nameHebrew: 'פסח (יום ב׳)',
        type: 'jewish',
        isWorkingDay: false
    },
    {
        id: 'passover-2025-7',
        date: '2025-04-19',
        name: 'Passover (Day 7)',
        nameHebrew: 'פסח (יום ז׳)',
        type: 'jewish',
        isWorkingDay: false
    },
    {
        id: 'independence-day-2025',
        date: '2025-05-01',
        name: 'Independence Day',
        nameHebrew: 'יום העצמאות',
        type: 'civil',
        isWorkingDay: false
    },
    {
        id: 'lag-baomer-2025',
        date: '2025-05-14',
        name: 'Lag BaOmer',
        nameHebrew: 'ל״ג בעומר',
        type: 'jewish',
        isWorkingDay: true
    },
    {
        id: 'shavuot-2025',
        date: '2025-06-02',
        name: 'Shavuot',
        nameHebrew: 'שבועות',
        type: 'jewish',
        isWorkingDay: false
    },
    {
        id: 'fast-tammuz-2025',
        date: '2025-07-13',
        name: 'Fast of Tammuz',
        nameHebrew: 'צום תמוז',
        type: 'jewish',
        isWorkingDay: true
    },
    {
        id: 'tisha-bav-2025',
        date: '2025-08-03',
        name: 'Tisha BAv',
        nameHebrew: 'תשעה באב',
        type: 'jewish',
        isWorkingDay: true
    },
    {
        id: 'rosh-hashanah-2025-1',
        date: '2025-09-23',
        name: 'Rosh Hashanah',
        nameHebrew: 'ראש השנה',
        type: 'jewish',
        isWorkingDay: false
    },
    {
        id: 'rosh-hashanah-2025-2',
        date: '2025-09-24',
        name: 'Rosh Hashanah (Day 2)',
        nameHebrew: 'ראש השנה (יום ב׳)',
        type: 'jewish',
        isWorkingDay: false
    },
    {
        id: 'yom-kippur-2025',
        date: '2025-10-02',
        name: 'Yom Kippur',
        nameHebrew: 'יום כיפור',
        type: 'jewish',
        isWorkingDay: false
    },
    {
        id: 'sukkot-2025-1',
        date: '2025-10-07',
        name: 'Sukkot',
        nameHebrew: 'סוכות',
        type: 'jewish',
        isWorkingDay: false
    },
    {
        id: 'sukkot-2025-7',
        date: '2025-10-13',
        name: 'Sukkot (Day 7)',
        nameHebrew: 'סוכות (יום ז׳)',
        type: 'jewish',
        isWorkingDay: false
    },
    {
        id: 'simchat-torah-2025',
        date: '2025-10-14',
        name: 'Simchat Torah',
        nameHebrew: 'שמחת תורה',
        type: 'jewish',
        isWorkingDay: false
    }
]

const CUSTOM_HOLIDAYS_KEY = 'customHolidays'

/**
 * Get custom holidays from localStorage
 */
export const getCustomHolidays = (): Holiday[] => {
    try {
        const stored = localStorage.getItem(CUSTOM_HOLIDAYS_KEY)
        return stored ? JSON.parse(stored) : []
    } catch (error) {
        console.error('Error loading custom holidays:', error)
        return []
    }
}

/**
 * Save custom holidays to localStorage
 */
export const saveCustomHolidays = (holidays: Holiday[]): void => {
    try {
        localStorage.setItem(CUSTOM_HOLIDAYS_KEY, JSON.stringify(holidays))
    } catch (error) {
        console.error('Error saving custom holidays:', error)
    }
}

/**
 * Add a custom holiday
 */
export const addCustomHoliday = (holiday: Omit<Holiday, 'type' | 'id'>): void => {
    const customHolidays = getCustomHolidays()
    const newHoliday: Holiday = {
        ...holiday,
        id: `custom-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
        type: 'custom'
    }
    
    const updatedHolidays = [...customHolidays, newHoliday]
    saveCustomHolidays(updatedHolidays)
}

/**
 * Remove a custom holiday by ID
 */
export const removeCustomHoliday = (id: string): void => {
    const customHolidays = getCustomHolidays()
    const filtered = customHolidays.filter(h => h.id !== id)
    saveCustomHolidays(filtered)
}

/**
 * Update a custom holiday
 */
export const updateCustomHoliday = (id: string, updates: Partial<Omit<Holiday, 'id' | 'type'>>): void => {
    const customHolidays = getCustomHolidays()
    const updated = customHolidays.map(h => 
        h.id === id ? { ...h, ...updates } : h
    )
    saveCustomHolidays(updated)
}

/**
 * Get all holidays (built-in + custom)
 */
export const getAllHolidays = (): Holiday[] => {
    const builtInHolidays = ISRAELI_HOLIDAYS_2025
    const customHolidays = getCustomHolidays()
    return [...builtInHolidays, ...customHolidays]
}

/**
 * Get holidays by specific date (multiple holidays per date supported)
 */
export const getHolidaysByDate = (date: string): Holiday[] => {
    const allHolidays = getAllHolidays()
    return allHolidays.filter(holiday => holiday.date === date)
}

/**
 * Get first holiday by specific date (for backward compatibility)
 */
export const getHolidayByDate = (date: string): Holiday | null => {
    const holidays = getHolidaysByDate(date)
    return holidays.length > 0 ? holidays[0] : null
}

/**
 * Get holiday by ID
 */
export const getHolidayById = (id: string): Holiday | null => {
    const allHolidays = getAllHolidays()
    return allHolidays.find(holiday => holiday.id === id) || null
}

/**
 * Get holiday color based on type
 */
export const getHolidayColor = (holiday: Holiday): string => {
    switch (holiday.type) {
        case 'jewish':
            return 'gold'
        case 'civil':
            return 'blue'
        case 'custom':
            return 'gold'
        default:
            return 'gold'
    }
}

/**
 * Check if a date is a holiday
 */
export const isHoliday = (date: string): boolean => {
    return getHolidayByDate(date) !== null
}

/**
 * Get holidays in a date range
 */
export const getHolidaysInRange = (startDate: string, endDate: string): Holiday[] => {
    const allHolidays = getAllHolidays()
    return allHolidays.filter(holiday => 
        holiday.date >= startDate && holiday.date <= endDate
    )
}