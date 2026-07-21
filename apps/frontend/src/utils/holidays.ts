import Holidays from 'date-holidays'

const hd = new Holidays('IL', { languages: ['he'] })

export const getHolidayNamesByDate = (date: string): string[] => {
    const holidays = hd.isHoliday(new Date(date))
    if (!holidays) return []
    return holidays.map((h) => h.name)
}
