import { hasMoreThan1ConsecutiveDay, isEmployeeEndingToday } from './dateUtils'

describe('dateUtils', () => {
    const d = (s: string) => new Date(s)

    describe('hasMoreThan1ConsecutiveDay', () => {
        it('should return false for empty array', () => {
            expect(hasMoreThan1ConsecutiveDay([])).toBe(false)
        })

        it('should return false for null or undefined', () => {
            expect(hasMoreThan1ConsecutiveDay(null as any)).toBe(false)
            expect(hasMoreThan1ConsecutiveDay(undefined as any)).toBe(false)
        })

        it('should return false for single date', () => {
            expect(hasMoreThan1ConsecutiveDay([d('2025-12-16')])).toBe(false)
        })

        it('should return true for 2 consecutive days', () => {
            expect(hasMoreThan1ConsecutiveDay([d('2025-12-16'), d('2025-12-17')])).toBe(true)
        })

        it('should return true for 3 consecutive days', () => {
            expect(hasMoreThan1ConsecutiveDay([d('2025-12-16'), d('2025-12-17'), d('2025-12-18')])).toBe(true)
        })

        it('should return false for 2 days with a gap', () => {
            expect(hasMoreThan1ConsecutiveDay([d('2025-12-16'), d('2025-12-18')])).toBe(false)
        })

        it('should return true even with unsorted dates', () => {
            expect(hasMoreThan1ConsecutiveDay([d('2025-12-18'), d('2025-12-16'), d('2025-12-17')])).toBe(true)
        })

        it('should return true for some consecutive in mixed array', () => {
            expect(hasMoreThan1ConsecutiveDay([d('2025-12-16'), d('2025-12-17'), d('2025-12-20')])).toBe(true)
        })

        it('should return false for multiple single days with gaps', () => {
            expect(hasMoreThan1ConsecutiveDay([d('2025-12-16'), d('2025-12-18'), d('2025-12-20'), d('2025-12-22')])).toBe(false)
        })

        it('should handle dates across month boundaries', () => {
            expect(hasMoreThan1ConsecutiveDay([d('2025-12-31'), d('2026-01-01')])).toBe(true)
        })

        it('should handle dates across year boundaries', () => {
            expect(hasMoreThan1ConsecutiveDay([d('2025-12-31'), d('2026-01-01')])).toBe(true)
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
            startDate,
            endDate,
        })

        describe('basic ending scenarios', () => {
            it('should return false when today is not the end date', () => {
                const reservation = createReservation('res1', '2025-12-16', '2025-12-18')
                const result = isEmployeeEndingToday(
                    reservation,
                    [reservation],
                    new Date('2025-12-17'), // Not end date
                    true
                )
                expect(result).toBe(false)
            })

            it('should return false for single-day reservation (less than 2 days)', () => {
                const reservation = createReservation('res1', '2025-12-16', '2025-12-16')
                const result = isEmployeeEndingToday(
                    reservation,
                    [reservation],
                    new Date('2025-12-16'),
                    false // No consecutive days (single day)
                )
                expect(result).toBe(false)
            })

            it('should return true when ending today with no consecutive order', () => {
                const reservation = createReservation('res1', '2025-12-16', '2025-12-18')
                const result = isEmployeeEndingToday(
                    reservation,
                    [reservation],
                    new Date('2025-12-18'), // End date
                    true
                )
                expect(result).toBe(true)
            })
        })

        describe('consecutive order detection', () => {
            it('should return false when there is a consecutive order starting next day', () => {
                const reservation1 = createReservation('res1', '2025-12-16', '2025-12-18')
                const reservation2 = createReservation('res2', '2025-12-19', '2025-12-21')

                const result = isEmployeeEndingToday(
                    reservation1,
                    [reservation1, reservation2],
                    new Date('2025-12-18'), // End date of first reservation
                    true
                )
                expect(result).toBe(false)
            })

            it('should return true when next order has a gap', () => {
                const reservation1 = createReservation('res1', '2025-12-16', '2025-12-18')
                const reservation2 = createReservation('res2', '2025-12-20', '2025-12-22')

                const result = isEmployeeEndingToday(
                    reservation1,
                    [reservation1, reservation2],
                    new Date('2025-12-18'),
                    true
                )
                expect(result).toBe(true)
            })

            it('should handle multiple reservations and find consecutive one', () => {
                const reservation1 = createReservation('res1', '2025-12-16', '2025-12-18')
                const reservation2 = createReservation('res2', '2025-12-20', '2025-12-22')
                const reservation3 = createReservation('res3', '2025-12-19', '2025-12-21')

                const result = isEmployeeEndingToday(
                    reservation1,
                    [reservation1, reservation2, reservation3],
                    new Date('2025-12-18'),
                    true
                )
                expect(result).toBe(false)
            })
        })

        describe('real-world scenario from requirements', () => {
            it('should not report ending on 18/12 when order continues on 19/12', () => {
                const order1 = createReservation('order1', '2025-12-16', '2025-12-18')
                const order2 = createReservation('order2', '2025-12-19', '2025-12-19')

                const result = isEmployeeEndingToday(
                    order1,
                    [order1, order2],
                    new Date('2025-12-18'),
                    true
                )
                expect(result).toBe(false)
            })

            it('should return false for single-day reservation even with no continuation', () => {
                const order2 = createReservation('order2', '2025-12-19', '2025-12-19')

                const result = isEmployeeEndingToday(
                    order2,
                    [order2],
                    new Date('2025-12-19'),
                    false // Single day
                )
                expect(result).toBe(false)
            })

            it('should report ending on last day of multi-day final order', () => {
                const order = createReservation('order', '2025-12-19', '2025-12-21')

                const result = isEmployeeEndingToday(
                    order,
                    [order],
                    new Date('2025-12-21'),
                    true
                )
                expect(result).toBe(true)
            })

            it('should return false for single-day reservation regardless of continuation', () => {
                const order1 = createReservation('order1', '2025-12-16', '2025-12-18')
                const order2 = createReservation('order2', '2025-12-19', '2025-12-19')
                const order3 = createReservation('order3', '2025-12-20', '2025-12-20')

                const result = isEmployeeEndingToday(
                    order2,
                    [order1, order2, order3],
                    new Date('2025-12-19'),
                    false // Single day
                )
                expect(result).toBe(false)
            })
        })

        describe('edge cases', () => {
            it('should ignore the current reservation when checking for consecutive orders', () => {
                const reservation = createReservation('res1', '2025-12-16', '2025-12-18')

                const result = isEmployeeEndingToday(
                    reservation,
                    [reservation],
                    new Date('2025-12-18'),
                    true
                )
                expect(result).toBe(true)
            })

            it('should handle empty allEmployeeReservations array', () => {
                const reservation = createReservation('res1', '2025-12-16', '2025-12-18')

                const result = isEmployeeEndingToday(
                    reservation,
                    [],
                    new Date('2025-12-18'),
                    true
                )
                expect(result).toBe(true)
            })

            it('should handle reservations across month boundaries', () => {
                const reservation1 = createReservation('res1', '2025-12-30', '2025-12-31')
                const reservation2 = createReservation('res2', '2026-01-01', '2026-01-03')

                const result = isEmployeeEndingToday(
                    reservation1,
                    [reservation1, reservation2],
                    new Date('2025-12-31'),
                    true
                )
                expect(result).toBe(false)
            })

            it('should handle reservations across year boundaries', () => {
                const reservation1 = createReservation('res1', '2025-12-30', '2025-12-31')
                const reservation2 = createReservation('res2', '2026-01-01', '2026-01-03')

                const result = isEmployeeEndingToday(
                    reservation1,
                    [reservation1, reservation2],
                    new Date('2025-12-31'),
                    true
                )
                expect(result).toBe(false)
            })
        })
    })
})
