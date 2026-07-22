import { DatePicker, useDatePickerContext } from '@chakra-ui/react'
import { HEBREW_WEEKDAYS } from './dateFieldUtils'

// Hebrew month names, January → December.
const HEBREW_MONTH_NAMES = [
    'ינואר',
    'פברואר',
    'מרץ',
    'אפריל',
    'מאי',
    'יוני',
    'יולי',
    'אוגוסט',
    'ספטמבר',
    'אוקטובר',
    'נובמבר',
    'דצמבר',
]

/**
 * Replaces `DatePicker.RangeText` in the day view header — Zag derives the month/year label
 * from the picker's pinned `locale="en-GB"` (needed for the "/" date-separator input mask),
 * which renders "July 2026" instead of a Hebrew month name.
 */
export function HebrewRangeText() {
    const ctx = useDatePickerContext()
    const { month, year } = ctx.focusedValue

    return (
        <>
            {HEBREW_MONTH_NAMES[month - 1]} {year}
        </>
    )
}

/**
 * Same rendering as `DatePicker.DayTable`, except the header row shows Hebrew weekday
 * initials instead of the English narrow labels Zag derives from the picker's pinned
 * `locale="en-GB"` (that locale is pinned for the "/" date-separator input mask, not display).
 */
export function HebrewDayTable() {
    const ctx = useDatePickerContext()

    return (
        <DatePicker.Table>
            <DatePicker.TableHead>
                <DatePicker.TableRow>
                    {HEBREW_WEEKDAYS.map((label, id) => (
                        <DatePicker.TableHeader key={id}>{label}</DatePicker.TableHeader>
                    ))}
                </DatePicker.TableRow>
            </DatePicker.TableHead>
            <DatePicker.TableBody>
                {ctx.weeks.map((week, weekIndex) => (
                    <DatePicker.TableRow key={weekIndex}>
                        {week.map((day, id) => (
                            <DatePicker.TableCell key={id} value={day}>
                                <DatePicker.TableCellTrigger>{day.day}</DatePicker.TableCellTrigger>
                            </DatePicker.TableCell>
                        ))}
                    </DatePicker.TableRow>
                ))}
            </DatePicker.TableBody>
        </DatePicker.Table>
    )
}

/**
 * Same rendering as `DatePicker.MonthTable`, except cell labels show Hebrew month names
 * instead of the English abbreviations Zag derives from the picker's pinned `locale="en-GB"`.
 */
export function HebrewMonthTable({ columns = 4 }: { columns?: number }) {
    const ctx = useDatePickerContext()
    const monthRows = ctx.getMonthsGrid({ columns })

    return (
        <DatePicker.Table>
            <DatePicker.TableBody>
                {monthRows.map((months, rowIndex) => (
                    <DatePicker.TableRow key={rowIndex}>
                        {months.map((month) => (
                            <DatePicker.TableCell key={month.value} value={month.value}>
                                <DatePicker.TableCellTrigger>
                                    {HEBREW_MONTH_NAMES[month.value - 1]}
                                </DatePicker.TableCellTrigger>
                            </DatePicker.TableCell>
                        ))}
                    </DatePicker.TableRow>
                ))}
            </DatePicker.TableBody>
        </DatePicker.Table>
    )
}
