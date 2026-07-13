import { hasMoreThan1ConsecutiveDay, isEmployeeEndingToday } from './dateUtils'
import { IFormSubmissions } from '../models/FormSubmissions'

describe('dateUtils', () => {
    describe('hasMoreThan1ConsecutiveDay', () => {
        it('should return false for empty array', () => {
            expect(hasMoreThan1ConsecutiveDay([])).toBe(false)
        })

        it('should return false for null or undefined', () => {
            expect(hasMoreThan1ConsecutiveDay(null as any)).toBe(false)
            expect(hasMoreThan1ConsecutiveDay(undefined as any)).toBe(false)
        })

        it('should return false for single date', () => {
            expect(hasMoreThan1ConsecutiveDay(['2025-12-16'])).toBe(false)
        })

        it('should return true for 2 consecutive days', () => {
            expect(
                hasMoreThan1ConsecutiveDay(['2025-12-16', '2025-12-17'])
            ).toBe(true)
        })

        it('should return true for 3 consecutive days', () => {
            expect(
                hasMoreThan1ConsecutiveDay([
                    '2025-12-16',
                    '2025-12-17',
                    '2025-12-18',
                ])
            ).toBe(true)
        })

        it('should return false for non-consecutive days', () => {
            expect(
                hasMoreThan1ConsecutiveDay(['2025-12-16', '2025-12-18'])
            ).toBe(false)
        })

        it('should return false for days with gaps', () => {
            expect(
                hasMoreThan1ConsecutiveDay([
                    '2025-12-16',
                    '2025-12-18',
                    '2025-12-20',
                ])
            ).toBe(false)
        })

        it('should work with unsorted dates', () => {
            expect(
                hasMoreThan1ConsecutiveDay([
                    '2025-12-18',
                    '2025-12-16',
                    '2025-12-17',
                ])
            ).toBe(true)
        })

        it('should return true for consecutive days with gaps in between', () => {
            // Has 2 consecutive days (16-17), then gap, then single day
            expect(
                hasMoreThan1ConsecutiveDay([
                    '2025-12-16',
                    '2025-12-17',
                    '2025-12-20',
                ])
            ).toBe(true)
        })

        it('should return false for multiple single days with gaps', () => {
            expect(
                hasMoreThan1ConsecutiveDay([
                    '2025-12-16',
                    '2025-12-18',
                    '2025-12-20',
                    '2025-12-22',
                ])
            ).toBe(false)
        })

        it('should handle dates across month boundaries', () => {
            expect(
                hasMoreThan1ConsecutiveDay(['2025-12-31', '2026-01-01'])
            ).toBe(true)
        })

        it('should handle dates across year boundaries', () => {
            expect(
                hasMoreThan1ConsecutiveDay(['2025-12-31', '2026-01-01'])
            ).toBe(true)
        })
    })

    describe('isEmployeeEndingToday', () => {
        const createReservation = (
            id: string,
            startDate: string,
            endDate: string
        ) => ({
            _id: {
                toString: () => id,
            },
            formData: {
                startDate,
                endDate,
            },
        }) as unknown as IFormSubmissions

        describe('basic ending scenarios', () => {
            it('should return false when today is not the end date', () => {
                const reservation = createReservation(
                    'res1',
                    '2025-12-16',
                    '2025-12-18'
                )
                const result = isEmployeeEndingToday(
                    reservation,
                    [reservation],
                    '2025-12-17', // Not end date
                    true
                )
                expect(result).toBe(false)
            })

            it('should return false for single-day reservation (less than 2 days)', () => {
                const reservation = createReservation(
                    'res1',
                    '2025-12-16',
                    '2025-12-16'
                )
                const result = isEmployeeEndingToday(
                    reservation,
                    [reservation],
                    '2025-12-16',
                    false // No consecutive days (single day)
                )
                expect(result).toBe(false) // Single-day reservations never count as ending today
            })

            it('should return true when ending today with no consecutive order', () => {
                const reservation = createReservation(
                    'res1',
                    '2025-12-16',
                    '2025-12-18'
                )
                const result = isEmployeeEndingToday(
                    reservation,
                    [reservation],
                    '2025-12-18', // End date
                    true // Has consecutive days
                )
                expect(result).toBe(true)
            })
        })

        describe('consecutive order detection', () => {
            it('should return false when there is a consecutive order starting next day', () => {
                const reservation1 = createReservation(
                    'res1',
                    '2025-12-16',
                    '2025-12-18'
                )
                const reservation2 = createReservation(
                    'res2',
                    '2025-12-19', // Starts next day
                    '2025-12-21'
                )

                const result = isEmployeeEndingToday(
                    reservation1,
                    [reservation1, reservation2],
                    '2025-12-18', // End date of first reservation
                    true
                )
                expect(result).toBe(false) // Not ending because continues next day
            })

            it('should return true when next order has a gap', () => {
                const reservation1 = createReservation(
                    'res1',
                    '2025-12-16',
                    '2025-12-18'
                )
                const reservation2 = createReservation(
                    'res2',
                    '2025-12-20', // Gap of one day
                    '2025-12-22'
                )

                const result = isEmployeeEndingToday(
                    reservation1,
                    [reservation1, reservation2],
                    '2025-12-18',
                    true
                )
                expect(result).toBe(true) // Is ending because next order has gap
            })

            it('should handle multiple reservations and find consecutive one', () => {
                const reservation1 = createReservation(
                    'res1',
                    '2025-12-16',
                    '2025-12-18'
                )
                const reservation2 = createReservation(
                    'res2',
                    '2025-12-20', // Not consecutive
                    '2025-12-22'
                )
                const reservation3 = createReservation(
                    'res3',
                    '2025-12-19', // Consecutive!
                    '2025-12-21'
                )

                const result = isEmployeeEndingToday(
                    reservation1,
                    [reservation1, reservation2, reservation3],
                    '2025-12-18',
                    true
                )
                expect(result).toBe(false) // Not ending because res3 is consecutive
            })
        })

        describe('real-world scenario from requirements', () => {
            it('should not report ending on 18/12 when order continues on 19/12', () => {
                // Order 1: 16-18/12/25
                const order1 = createReservation(
                    'order1',
                    '2025-12-16',
                    '2025-12-18'
                )
                // Order 2: 19/12/25 (consecutive)
                const order2 = createReservation(
                    'order2',
                    '2025-12-19',
                    '2025-12-19'
                )

                const result = isEmployeeEndingToday(
                    order1,
                    [order1, order2],
                    '2025-12-18', // Checking 18/12
                    true
                )
                expect(result).toBe(false) // Should NOT report as ending
            })

            it('should return false for single-day reservation even with no continuation', () => {
                // Order 2: 19/12/25 (single-day, no continuation)
                const order2 = createReservation(
                    'order2',
                    '2025-12-19',
                    '2025-12-19'
                )

                const result = isEmployeeEndingToday(
                    order2,
                    [order2],
                    '2025-12-19',
                    false // Single day, less than 2 days
                )
                expect(result).toBe(false) // Single-day reservations never count as ending today
            })

            it('should report ending on last day of multi-day final order', () => {
                // Order: 19-21/12/25 (last order, no continuation)
                const order = createReservation(
                    'order',
                    '2025-12-19',
                    '2025-12-21'
                )

                const result = isEmployeeEndingToday(
                    order,
                    [order],
                    '2025-12-21',
                    true // Has consecutive days
                )
                expect(result).toBe(true) // Should report as ending
            })

            it('should return false for single-day reservation regardless of continuation', () => {
                // Order 1: 16-18/12/25
                const order1 = createReservation(
                    'order1',
                    '2025-12-16',
                    '2025-12-18'
                )
                // Order 2: 19/12/25 (single day)
                const order2 = createReservation(
                    'order2',
                    '2025-12-19',
                    '2025-12-19'
                )
                // Order 3: 20/12/25 (continuation)
                const order3 = createReservation(
                    'order3',
                    '2025-12-20',
                    '2025-12-20'
                )

                const result = isEmployeeEndingToday(
                    order2,
                    [order1, order2, order3],
                    '2025-12-19',
                    false // Single day — less than 2 days
                )
                expect(result).toBe(false) // Single-day reservations never count as ending today
            })
        })

        describe('edge cases', () => {
            it('should ignore the current reservation when checking for consecutive orders', () => {
                const reservation = createReservation(
                    'res1',
                    '2025-12-16',
                    '2025-12-18'
                )

                // Only one reservation (itself)
                const result = isEmployeeEndingToday(
                    reservation,
                    [reservation],
                    '2025-12-18',
                    true
                )
                expect(result).toBe(true) // Should end because no OTHER consecutive order
            })

            it('should handle empty allEmployeeReservations array', () => {
                const reservation = createReservation(
                    'res1',
                    '2025-12-16',
                    '2025-12-18'
                )

                const result = isEmployeeEndingToday(
                    reservation,
                    [],
                    '2025-12-18',
                    true
                )
                expect(result).toBe(true)
            })

            it('should handle reservations across month boundaries', () => {
                const reservation1 = createReservation(
                    'res1',
                    '2025-12-30',
                    '2025-12-31'
                )
                const reservation2 = createReservation(
                    'res2',
                    '2026-01-01', // Next day, next month
                    '2026-01-03'
                )

                const result = isEmployeeEndingToday(
                    reservation1,
                    [reservation1, reservation2],
                    '2025-12-31',
                    true
                )
                expect(result).toBe(false) // Continues into new month
            })

            it('should handle reservations across year boundaries', () => {
                const reservation1 = createReservation(
                    'res1',
                    '2025-12-30',
                    '2025-12-31'
                )
                const reservation2 = createReservation(
                    'res2',
                    '2026-01-01', // Next day, next year
                    '2026-01-03'
                )

                const result = isEmployeeEndingToday(
                    reservation1,
                    [reservation1, reservation2],
                    '2025-12-31',
                    true
                )
                expect(result).toBe(false) // Continues into new year
            })
        })
    })
})
