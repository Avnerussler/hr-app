import { parseDate } from '@chakra-ui/react'
import type { DateValue } from '@chakra-ui/react'

export const toCalendarDate = (value: unknown): DateValue | null => {
    if (typeof value === 'string' && value) {
        try {
            return parseDate(value.slice(0, 10))
        } catch {
            return null
        }
    }
    if (value instanceof Date && !isNaN(value.getTime())) {
        try {
            return parseDate(value.toISOString().slice(0, 10))
        } catch {
            return null
        }
    }
    return null
}

// dd/mm/yyyy display format — see https://chakra-ui.com/docs/components/date-picker#localization
export const formatDate = (date: DateValue) => {
    const day = date.day.toString().padStart(2, '0')
    const month = date.month.toString().padStart(2, '0')
    return `${day}/${month}/${date.year}`
}

export const parseDateInput = (value: string): DateValue | undefined => {
    const match = value.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/)
    if (!match) return undefined
    const [, day, month, year] = match
    try {
        return parseDate(
            `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`
        )
    } catch {
        return undefined
    }
}
