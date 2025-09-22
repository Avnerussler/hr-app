import { Box, VStack, HStack, Button, Text, Flex, Grid, useDisclosure } from '@chakra-ui/react'
import { ProgressRoot, ProgressBar } from '../ui/progress'
import {
    FaCalendarAlt,
    FaChevronLeft,
    FaChevronRight,
    FaTable,
    FaCalendarWeek,
    FaCog,
    FaCheckCircle,
    FaStar,
    FaPlus,
    FaTimes,
} from 'react-icons/fa'
import { useState, useMemo, useEffect } from 'react'
import {
    startOfWeek,
    endOfWeek,
    addWeeks,
    subWeeks,
    format,
    startOfMonth,
    endOfMonth,
    addMonths,
    subMonths,
    eachDayOfInterval,
    isSameMonth,
    isToday,
    isWeekend,
} from 'date-fns'
import { he } from 'date-fns/locale'
import { PageHeader } from '../common/PageHeader'
import { ContextMenu } from '../common/ContextMenu'
import { MetricCard } from '../common/MetricCard'
import {
    CalendarView,
    CalendarDay,
    CalendarWeek,
    CalendarMonth,
    DailyQuota,
} from '@/types/workHoursType'
import {
    QuotaModal,
    DailyAttendanceDrawer,
    HolidayManagementModal,
} from '../QuotaManagement'
import {
    useQuotasWithOccupancyRangeQuery,
    useAttendanceSummaryQuery,
    useQuotasQuery,
} from '@/hooks/queries'
import {
    getOccupancyColorPalette,
    formatQuotaDisplay,
} from '@/utils/quotaUtils'
import { getHolidaysByDate } from '@/utils/israelHolidays'

export default function QuotaManagement() {
    const [currentDate, setCurrentDate] = useState(new Date())
    const [calendarView, setCalendarView] = useState<CalendarView>('monthly')
    const quotaModal = useDisclosure()
    const [isAttendanceDrawerOpen, setIsAttendanceDrawerOpen] = useState(false)
    const [isHolidayModalOpen, setIsHolidayModalOpen] = useState(false)
    const [selectedDate, setSelectedDate] = useState<string>('')
    const [selectedQuota, setSelectedQuota] = useState<DailyQuota | undefined>(
        undefined
    )
    const [contextMenu, setContextMenu] = useState<{
        isOpen: boolean
        x: number
        y: number
        date: string
    }>({ isOpen: false, x: 0, y: 0, date: '' })
    const [clickedDate, setClickedDate] = useState<string>('')
    const [shouldOpenModalAfterLoad, setShouldOpenModalAfterLoad] = useState(false)
    const [selectedRange, setSelectedRange] = useState<{
        start: string | null
        end: string | null
        isSelecting: boolean
    }>({ start: null, end: null, isSelecting: false })

    // Calculate the date range for current view
    const { dateRange } = useMemo(() => {
        if (calendarView === 'monthly') {
            const monthStart = startOfMonth(currentDate)
            const monthEnd = endOfMonth(currentDate)
            const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 })
            const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 })
            return {
                dateRange: {
                    start: format(calendarStart, 'yyyy-MM-dd'),
                    end: format(calendarEnd, 'yyyy-MM-dd'),
                },
            }
        } else {
            const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 })
            const weekEnd = endOfWeek(currentDate, { weekStartsOn: 1 })
            return {
                dateRange: {
                    start: format(weekStart, 'yyyy-MM-dd'),
                    end: format(weekEnd, 'yyyy-MM-dd'),
                },
            }
        }
    }, [currentDate, calendarView])

    // Fetch quota and occupancy data using TanStack Query
    const {
        data: quotaData,
        isLoading: isLoadingQuotas,
        error: quotaError,
    } = useQuotasWithOccupancyRangeQuery(dateRange.start, dateRange.end)

    // Fetch attendance summary data for calendar indicators
    const { data: attendanceSummary } = useAttendanceSummaryQuery(
        dateRange.start,
        dateRange.end
    )

    // Fetch full quota details for the clicked date
    const { data: clickedQuotaData, isLoading: isLoadingClickedQuota } =
        useQuotasQuery(
            clickedDate
                ? {
                      startDate: clickedDate,
                      endDate: clickedDate,
                  }
                : undefined
        )

    // Convert API data to maps for easy lookup
    const { quotas, currentOccupancy, capacityData } = useMemo(() => {
        const quotasMap: Record<string, number> = {}
        const occupancyMap: Record<string, number> = {}
        const capacityMap: Record<
            string,
            { left: number; leftPercent: number; occupancyRate: number }
        > = {}

        // Process real data from API
        if (quotaData?.data) {
            quotaData.data.forEach((item) => {
                if (item.quota) quotasMap[item.date] = item.quota
                occupancyMap[item.date] = item.currentOccupancy
                capacityMap[item.date] = {
                    left: item.capacityLeft,
                    leftPercent: item.capacityLeftPercent,
                    occupancyRate: item.occupancyRate || 0,
                }
            })
        }

        return {
            quotas: quotasMap,
            currentOccupancy: occupancyMap,
            capacityData: capacityMap,
        }
    }, [quotaData])

    const generateCalendarData = (): CalendarMonth | CalendarWeek[] => {
        if (calendarView === 'monthly') {
            const monthStart = startOfMonth(currentDate)
            const monthEnd = endOfMonth(currentDate)
            const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 })
            const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 })

            const allDays = eachDayOfInterval({
                start: calendarStart,
                end: calendarEnd,
            })

            const weeks: CalendarWeek[] = []
            for (let i = 0; i < allDays.length; i += 7) {
                const weekDays = allDays
                    .slice(i, i + 7)
                    .map((date): CalendarDay => {
                        const dateStr = format(date, 'yyyy-MM-dd')
                        return {
                            date: dateStr,
                            isToday: isToday(date),
                            isCurrentMonth: isSameMonth(date, currentDate),
                            quota: quotas[dateStr],
                            currentOccupancy: currentOccupancy[dateStr] || 0,
                            isWeekend: isWeekend(date),
                        }
                    })

                weeks.push({
                    days: weekDays,
                    weekNumber: Math.floor(i / 7) + 1,
                })
            }

            return {
                weeks,
                monthName: format(currentDate, 'MMMM', { locale: he }),
                year: currentDate.getFullYear(),
                month: currentDate.getMonth(),
            }
        } else {
            // Weekly view
            const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 })
            const weekEnd = endOfWeek(currentDate, { weekStartsOn: 1 })

            const days = eachDayOfInterval({
                start: weekStart,
                end: weekEnd,
            }).map((date): CalendarDay => {
                const dateStr = format(date, 'yyyy-MM-dd')
                return {
                    date: dateStr,
                    isToday: isToday(date),
                    isCurrentMonth: true,
                    quota: quotas[dateStr],
                    currentOccupancy: currentOccupancy[dateStr] || 0,
                    isWeekend: isWeekend(date),
                }
            })

            return [
                {
                    days,
                    weekNumber: 1,
                },
            ]
        }
    }

    const calendarData = generateCalendarData()

    const handlePrevious = () => {
        if (calendarView === 'monthly') {
            setCurrentDate(subMonths(currentDate, 1))
        } else {
            setCurrentDate(subWeeks(currentDate, 1))
        }
    }

    const handleNext = () => {
        if (calendarView === 'monthly') {
            setCurrentDate(addMonths(currentDate, 1))
        } else {
            setCurrentDate(addWeeks(currentDate, 1))
        }
    }

    const handleToday = () => {
        setCurrentDate(new Date())
    }

    const handleDayClick = (date: string, event?: React.MouseEvent) => {
        console.log('Day clicked:', date, {
            shiftKey: event?.shiftKey,
            ctrlKey: event?.ctrlKey,
            metaKey: event?.metaKey,
            currentRange: selectedRange,
        })

        if (event?.shiftKey && selectedRange.start) {
            // Complete range selection
            const startDate = selectedRange.start
            const endDate = date
            const newRange = {
                start: startDate < endDate ? startDate : endDate,
                end: startDate < endDate ? endDate : startDate,
                isSelecting: false,
            }
            console.log('Setting range:', newRange)
            setSelectedRange(newRange)
        } else if (event?.ctrlKey || event?.metaKey) {
            // Start or modify range selection
            const newRange = { start: date, end: null, isSelecting: true }
            console.log('Starting range:', newRange)
            setSelectedRange(newRange)
        } else if (selectedRange.start || selectedRange.end) {
            // Clear selection and open attendance drawer
            console.log('Clearing selection')
            setSelectedRange({ start: null, end: null, isSelecting: false })
            setSelectedDate(date)
            setIsAttendanceDrawerOpen(true)
        } else {
            // Normal click - open attendance drawer
            console.log('Normal click - opening drawer')
            setSelectedDate(date)
            setIsAttendanceDrawerOpen(true)
        }
    }

    const handleRightClick = (event: React.MouseEvent, date: string) => {
        event.preventDefault()

        // Set clicked date to trigger the quota query
        setClickedDate(date)

        setContextMenu({
            isOpen: true,
            x: event.clientX,
            y: event.clientY,
            date,
        })
    }

    // Update selected quota when clicked quota data is available
    useEffect(() => {
        if (clickedDate && !isLoadingClickedQuota) {
            
            if (
                clickedQuotaData?.quotas &&
                clickedQuotaData.quotas.length > 0
            ) {
                setSelectedQuota(clickedQuotaData.quotas[0])
            } else if (
                clickedQuotaData?.data?.quotas &&
                Array.isArray(clickedQuotaData.data.quotas) &&
                clickedQuotaData.data.quotas.length > 0
            ) {
                console.log('✅ Found existing quota:', clickedQuotaData.data.quotas[0])
                setSelectedQuota(clickedQuotaData.data.quotas[0])
            } else {
                // Create default quota for new entries
                const defaultQuota: DailyQuota = {
                    _id: '',
                    date: clickedDate,
                    quota: 0,
                    notes: '',
                    createdBy: '',
                    createdAt: '',
                    updatedAt: '',
                }
                setSelectedQuota(defaultQuota)
            }
        }
    }, [clickedDate, isLoadingClickedQuota, clickedQuotaData])
    
    // Separate effect to handle modal opening after data loads
    useEffect(() => {
        if (shouldOpenModalAfterLoad && !isLoadingClickedQuota && selectedQuota) {
            quotaModal.onOpen()
            setShouldOpenModalAfterLoad(false)
        }
    }, [shouldOpenModalAfterLoad, isLoadingClickedQuota, selectedQuota])

    const handleContextMenuClose = () => {
        setContextMenu({ isOpen: false, x: 0, y: 0, date: '' })
    }

    const handleClearSelection = () => {
        setSelectedRange({ start: null, end: null, isSelecting: false })
        handleContextMenuClose()
    }

    const getContextMenuItems = () => {
        const hasRange = selectedRange.start && selectedRange.end
        const items = []

        if (hasRange) {
            items.push({
                label: `ניהול כמויות (${selectedRange.start} - ${selectedRange.end})`,
                icon: <FaCog />,
                onClick: handleContextSetQuota,
            })
            items.push({
                label: `נהל חגים (${selectedRange.start} - ${selectedRange.end})`,
                icon: <FaPlus />,
                onClick: handleContextAddHoliday,
            })
            items.push({
                label: 'נקה בחירה',
                icon: <FaTimes />,
                onClick: handleClearSelection,
            })
        } else {
            items.push({
                label: 'ניהול כמויות',
                icon: <FaCog />,
                onClick: handleContextSetQuota,
            })
            items.push({
                label: 'נהל חגים',
                icon: <FaPlus />,
                onClick: handleContextAddHoliday,
            })
        }

        return items
    }

    const handleContextSetQuota = () => {
        if (selectedRange.start && selectedRange.end) {
            // Handle range quota setting
            setSelectedDate(`${selectedRange.start}:${selectedRange.end}`)
            quotaModal.onOpen() // Range doesn't need to wait for quota loading
        } else {
            setSelectedDate(contextMenu.date)
            // Check if we already have quota data for this date or if we need to wait
            if (clickedDate === contextMenu.date && !isLoadingClickedQuota && selectedQuota) {
                // Data is already loaded for this date
                quotaModal.onOpen()
            } else {
                // Need to wait for loading to complete
                setShouldOpenModalAfterLoad(true)
            }
        }
        handleContextMenuClose()
    }

    const handleContextAddHoliday = () => {
        if (selectedRange.start && selectedRange.end) {
            // Handle range holiday adding
            setSelectedDate(`${selectedRange.start}:${selectedRange.end}`)
        } else {
            setSelectedDate(contextMenu.date)
        }
        setIsHolidayModalOpen(true)
        handleContextMenuClose()
    }

    const isDateInRange = (date: string): boolean => {
        if (!selectedRange.start) return false
        if (!selectedRange.end) return date === selectedRange.start
        return date >= selectedRange.start && date <= selectedRange.end
    }

    const isDateRangeStart = (date: string): boolean => {
        return selectedRange.start === date
    }

    const isDateRangeEnd = (date: string): boolean => {
        return selectedRange.end === date
    }

    const getDateBackgroundColor = (day: CalendarDay) => {
        if (isDateInRange(day.date)) {
            if (isDateRangeStart(day.date) || isDateRangeEnd(day.date)) {
                return 'blue.300'
            }
            return 'blue.200'
        }

        if (day.isToday) return 'blue.50'
        if (!day.isCurrentMonth) return 'gray.100'
        if (day.isWeekend) return 'gray.50'
        return 'white'
    }

    const formatDateRange = () => {
        if (calendarView === 'monthly') {
            return format(currentDate, 'MMMM yyyy', { locale: he })
        } else {
            const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 })
            const weekEnd = endOfWeek(currentDate, { weekStartsOn: 1 })
            return `${format(weekStart, 'd MMM', { locale: he })} - ${format(weekEnd, 'd MMM yyyy', { locale: he })}`
        }
    }

    // Use summary from API if available, otherwise calculate from maps
    const totalQuotas =
        quotaData?.summary?.totalQuotas ||
        Object.values(quotas).reduce((sum, quota) => sum + quota, 0)
    const totalOccupancy =
        quotaData?.summary?.totalOccupancy ||
        Object.values(currentOccupancy).reduce((sum, occ) => sum + occ, 0)
    const totalCapacityLeft =
        quotaData?.summary?.totalCapacityLeft ||
        Object.values(capacityData).reduce((sum, data) => sum + data.left, 0)
    const averageOccupancyRate =
        quotaData?.summary?.averageOccupancyRate ||
        (totalQuotas > 0 ? Math.round((totalOccupancy / totalQuotas) * 100) : 0)

    // Show loading state
    if (isLoadingQuotas) {
        return (
            <VStack gap={6} align="stretch">
                <PageHeader
                    title="ניהול כמויות יומיות"
                    description="ניהול כמויות אנשים מותרות ליום בקלנדר"
                    icon={FaCalendarAlt}
                />
                <Box textAlign="center" p={8}>
                    <Text>טוען נתוני כמויות...</Text>
                </Box>
            </VStack>
        )
    }

    // Show error state
    if (quotaError) {
        return (
            <VStack gap={6} align="stretch">
                <PageHeader
                    title="ניהול כמויות יומיות"
                    description="ניהול כמויות אנשים מותרות ליום בקלנדר"
                    icon={FaCalendarAlt}
                />
                <Box textAlign="center" p={8}>
                    <Text color="red.500">
                        שגיאה בטעינת נתונים. אנא נסה שוב.
                    </Text>
                </Box>
            </VStack>
        )
    }

    return (
        <VStack gap={6} align="stretch">
            <PageHeader
                title="נוכחות ומעקב יומי"
                description="מעקב נוכחות עובדים ומידע יומי על כמויות"
                icon={FaCalendarAlt}
                actions={[
                    {
                        label: 'ניהול כמויות',
                        icon: FaCog,
                        variant: 'outline',
                        onClick: () => {
                            setSelectedDate(format(new Date(), 'yyyy-MM-dd'))
                            quotaModal.onOpen()
                        },
                    },
                    {
                        label: 'נהל חגים',
                        icon: FaPlus,
                        variant: 'outline',
                        onClick: () => {
                            setSelectedDate(format(new Date(), 'yyyy-MM-dd'))
                            setIsHolidayModalOpen(true)
                        },
                    },
                ]}
            />

            {/* Metrics Cards */}
            <Grid
                templateColumns="repeat(auto-fit, minmax(200px, 1fr))"
                gap={4}
            >
                <MetricCard
                    label="סה״כ כמות מותרת"
                    value={totalQuotas}
                    icon={FaCalendarAlt}
                    color="blue"
                />
                <MetricCard
                    label="תפוסה נוכחית"
                    value={totalOccupancy}
                    icon={FaCalendarWeek}
                    color="green"
                />
                <MetricCard
                    label="מקומות פנויים"
                    value={totalCapacityLeft}
                    icon={FaTable}
                    color={
                        totalCapacityLeft > totalQuotas * 0.2
                            ? 'green'
                            : 'orange'
                    }
                />
                <MetricCard
                    label="אחוז תפוסה"
                    value={averageOccupancyRate}
                    icon={FaTable}
                    color={
                        averageOccupancyRate > 80
                            ? 'red'
                            : averageOccupancyRate > 60
                              ? 'orange'
                              : 'purple'
                    }
                />
            </Grid>

            {/* Range Selection Help Text */}
            {(selectedRange.start || selectedRange.end) && (
                <Box
                    p={3}
                    bg="blue.50"
                    borderRadius="md"
                    borderWidth="1px"
                    borderColor="blue.200"
                >
                    <Text fontSize="sm" color="blue.700">
                        {selectedRange.start && selectedRange.end
                            ? `נבחרו תאריכים: ${selectedRange.start} עד ${selectedRange.end} - לחץ ימין לפעולות טווח`
                            : selectedRange.start
                              ? `תאריך התחלה: ${selectedRange.start} - לחץ Shift+קליק לבחירת טווח`
                              : 'החזק Ctrl/Cmd+קליך לבחירת תאריך התחלה, Shift+קליך לסיום טווח'}
                    </Text>
                </Box>
            )}

            {/* Calendar Navigation and View Toggle */}
            <Flex
                justify="space-between"
                align="center"
                p={4}
                bg="card"
                borderRadius="md"
                borderWidth="1px"
                borderColor="border"
            >
                <HStack gap={2}>
                    <Button variant="ghost" size="sm" onClick={handleNext}>
                        <FaChevronLeft />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={handlePrevious}>
                        <FaChevronRight />
                    </Button>
                </HStack>

                <VStack gap={1}>
                    <Text fontSize="lg" fontWeight="bold">
                        {formatDateRange()}
                    </Text>
                </VStack>

                <HStack gap={2}>
                    <Button
                        variant={
                            calendarView === 'weekly' ? 'solid' : 'outline'
                        }
                        size="sm"
                        onClick={() => setCalendarView('weekly')}
                    >
                        שבועי
                    </Button>
                    <Button
                        variant={
                            calendarView === 'monthly' ? 'solid' : 'outline'
                        }
                        size="sm"
                        onClick={() => setCalendarView('monthly')}
                    >
                        חודשי
                    </Button>
                    <Button variant="ghost" size="sm" onClick={handleToday}>
                        היום
                    </Button>
                </HStack>
            </Flex>

            {/* Calendar Grid */}
            <Box
                p={4}
                bg="card"
                borderRadius="md"
                borderWidth="1px"
                borderColor="border"
            >
                {/* Day Headers */}
                <Grid templateColumns="repeat(7, 1fr)" gap={1} mb={2}>
                    {['ב׳', 'ג׳', 'ד׳', 'ה׳', 'ו׳', 'ש׳', 'א׳'].map((day) => (
                        <Box key={day} textAlign="center" py={2}>
                            <Text fontSize="sm" fontWeight="bold" color="muted">
                                {day}
                            </Text>
                        </Box>
                    ))}
                </Grid>

                {/* Calendar Days */}
                {Array.isArray(calendarData) ? (
                    // Weekly view
                    <Grid templateColumns="repeat(7, 1fr)" gap={1}>
                        {calendarData[0].days.map((day) => (
                            <Box
                                key={day.date}
                                p={3}
                                minH="120px"
                                borderRadius="md"
                                borderWidth={
                                    isDateInRange(day.date) ? '2px' : '1px'
                                }
                                borderColor={
                                    isDateInRange(day.date)
                                        ? 'blue.500'
                                        : day.isToday
                                          ? 'blue.500'
                                          : day.quota
                                            ? 'green.300'
                                            : 'border'
                                }
                                bg={getDateBackgroundColor(day)}
                                cursor="pointer"
                                onClick={(e) => handleDayClick(day.date, e)}
                                onContextMenu={(e) =>
                                    handleRightClick(e, day.date)
                                }
                                _hover={{
                                    bg: isDateInRange(day.date)
                                        ? 'blue.300'
                                        : 'gray.100',
                                }}
                            >
                                <VStack align="start" gap={2} w="full">
                                    <HStack justify="space-between" w="full">
                                        <Text
                                            fontSize="sm"
                                            fontWeight={
                                                day.isToday ? 'bold' : 'normal'
                                            }
                                        >
                                            {format(new Date(day.date), 'd')}
                                        </Text>
                                        <HStack gap={1}>
                                            {/* Holiday Indicator */}
                                            {getHolidaysByDate(day.date)
                                                .length > 0 && (
                                                <FaStar
                                                    size={8}
                                                    color="gold"
                                                    title={`חגים: ${getHolidaysByDate(
                                                        day.date
                                                    )
                                                        .map(
                                                            (h) => h.nameHebrew
                                                        )
                                                        .join(', ')}`}
                                                />
                                            )}
                                            {/* Attendance Status Indicator - Only show if attendance was reported */}
                                            {attendanceSummary?.[day.date]
                                                ?.hasData && (
                                                <FaCheckCircle
                                                    size={10}
                                                    color="green"
                                                    title={`נוכחות: ${attendanceSummary[day.date].attendanceRate}%`}
                                                />
                                            )}
                                        </HStack>
                                    </HStack>

                                    {day.quota && (
                                        <VStack align="start" gap={2} w="full">
                                            {/* Top: (assigned)/(capacity) (percent) */}
                                            <Text
                                                fontSize="xs"
                                                fontWeight="semibold"
                                                textAlign="center"
                                                w="full"
                                            >
                                                {formatQuotaDisplay(
                                                    day.currentOccupancy,
                                                    day.quota,
                                                    capacityData[day.date]
                                                        ?.occupancyRate || 0
                                                )}
                                            </Text>

                                            {/* Bottom: Progress bar */}
                                            <ProgressRoot
                                                value={Math.min(
                                                    capacityData[day.date]
                                                        ?.occupancyRate || 0,
                                                    100
                                                )}
                                                size="sm"
                                                w="full"
                                                colorPalette={getOccupancyColorPalette(
                                                    capacityData[day.date]
                                                        ?.occupancyRate || 0
                                                )}
                                            >
                                                <ProgressBar />
                                            </ProgressRoot>
                                        </VStack>
                                    )}

                                    {!day.quota && day.currentOccupancy > 0 && (
                                        <Text fontSize="xs" color="gray.600">
                                            תפוס: {day.currentOccupancy} (אין
                                            מגבלה)
                                        </Text>
                                    )}
                                </VStack>
                            </Box>
                        ))}
                    </Grid>
                ) : (
                    // Monthly view
                    <VStack gap={1}>
                        {calendarData.weeks.map((week, weekIndex) => (
                            <Grid
                                key={weekIndex}
                                templateColumns="repeat(7, 1fr)"
                                gap={1}
                                w="full"
                            >
                                {week.days.map((day) => (
                                    <Box
                                        key={day.date}
                                        p={2}
                                        minH="80px"
                                        borderRadius="md"
                                        borderWidth={
                                            isDateInRange(day.date)
                                                ? '2px'
                                                : '1px'
                                        }
                                        borderColor={
                                            isDateInRange(day.date)
                                                ? 'blue.500'
                                                : day.isToday
                                                  ? 'blue.500'
                                                  : day.quota
                                                    ? 'green.300'
                                                    : 'border'
                                        }
                                        bg={getDateBackgroundColor(day)}
                                        opacity={day.isCurrentMonth ? 1 : 0.5}
                                        cursor="pointer"
                                        onClick={(e) =>
                                            handleDayClick(day.date, e)
                                        }
                                        onContextMenu={(e) =>
                                            handleRightClick(e, day.date)
                                        }
                                        _hover={{
                                            bg: isDateInRange(day.date)
                                                ? 'blue.300'
                                                : 'gray.100',
                                        }}
                                    >
                                        <VStack align="start" gap={1} w="full">
                                            <HStack
                                                justify="space-between"
                                                w="full"
                                            >
                                                <Text
                                                    fontSize="xs"
                                                    fontWeight={
                                                        day.isToday
                                                            ? 'bold'
                                                            : 'normal'
                                                    }
                                                >
                                                    {format(
                                                        new Date(day.date),
                                                        'd'
                                                    )}
                                                </Text>
                                                <HStack gap={1}>
                                                    {/* Holiday Indicator */}
                                                    {getHolidaysByDate(day.date)
                                                        .length > 0 && (
                                                        <FaStar
                                                            size={8}
                                                            color="gold"
                                                            title={`חגים: ${getHolidaysByDate(
                                                                day.date
                                                            )
                                                                .map(
                                                                    (h) =>
                                                                        h.nameHebrew
                                                                )
                                                                .join(', ')}`}
                                                        />
                                                    )}
                                                    {/* Attendance Status Indicator - Only show if attendance was reported */}
                                                    {attendanceSummary?.[
                                                        day.date
                                                    ]?.hasData && (
                                                        <FaCheckCircle
                                                            size={8}
                                                            color="green"
                                                            title={`נוכחות: ${attendanceSummary[day.date].attendanceRate}%`}
                                                        />
                                                    )}
                                                </HStack>
                                            </HStack>

                                            {day.quota && (
                                                <VStack
                                                    align="start"
                                                    gap={1}
                                                    w="full"
                                                >
                                                    {/* Top: (assigned)/(capacity) (percent) */}
                                                    <Text
                                                        fontSize="2xs"
                                                        fontWeight="semibold"
                                                        textAlign="center"
                                                        w="full"
                                                    >
                                                        {formatQuotaDisplay(
                                                            day.currentOccupancy,
                                                            day.quota,
                                                            capacityData[
                                                                day.date
                                                            ]?.occupancyRate ||
                                                                0
                                                        )}
                                                    </Text>

                                                    {/* Bottom: Progress bar */}
                                                    <ProgressRoot
                                                        value={Math.min(
                                                            capacityData[
                                                                day.date
                                                            ]?.occupancyRate ||
                                                            0,
                                                            100
                                                        )}
                                                        size="xs"
                                                        w="full"
                                                        colorPalette={getOccupancyColorPalette(
                                                            capacityData[
                                                                day.date
                                                            ]?.occupancyRate ||
                                                                0
                                                        )}
                                                    >
                                                        <ProgressBar />
                                                    </ProgressRoot>
                                                </VStack>
                                            )}

                                            {!day.quota &&
                                                day.currentOccupancy > 0 && (
                                                    <Text
                                                        fontSize="2xs"
                                                        color="gray.500"
                                                    >
                                                        תפוס:{' '}
                                                        {day.currentOccupancy}
                                                    </Text>
                                                )}
                                        </VStack>
                                    </Box>
                                ))}
                            </Grid>
                        ))}
                    </VStack>
                )}
            </Box>

            <QuotaModal
                isOpen={quotaModal.open}
                onClose={() => {
                    quotaModal.onClose()
                    setSelectedQuota(undefined)
                    setClickedDate('')
                    setShouldOpenModalAfterLoad(false)
                    setSelectedRange({
                        start: null,
                        end: null,
                        isSelecting: false,
                    })
                }}
                selectedDate={
                    selectedDate.includes(':')
                        ? selectedDate.split(':')[0]
                        : selectedDate
                }
                selectedRange={
                    selectedDate.includes(':')
                        ? {
                              start: selectedDate.split(':')[0],
                              end: selectedDate.split(':')[1],
                          }
                        : selectedRange.start && selectedRange.end
                          ? {
                                start: selectedRange.start,
                                end: selectedRange.end,
                            }
                          : undefined
                }
                existingQuota={
                    selectedQuota || {
                        _id: '',
                        date: selectedDate.includes(':')
                            ? selectedDate.split(':')[0]
                            : selectedDate,
                        quota: 0,
                        notes: '',
                        createdBy: '',
                        createdAt: '',
                        updatedAt: '',
                    }
                }
            />

            <DailyAttendanceDrawer
                isOpen={isAttendanceDrawerOpen}
                onClose={() => setIsAttendanceDrawerOpen(false)}
                selectedDate={selectedDate}
            />

            <HolidayManagementModal
                isOpen={isHolidayModalOpen}
                onClose={() => {
                    setIsHolidayModalOpen(false)
                    setSelectedRange({
                        start: null,
                        end: null,
                        isSelecting: false,
                    })
                }}
                selectedDate={
                    selectedDate.includes(':')
                        ? selectedDate.split(':')[0]
                        : selectedDate
                }
                dateRange={
                    selectedDate.includes(':')
                        ? {
                              start: selectedDate.split(':')[0],
                              end: selectedDate.split(':')[1],
                          }
                        : selectedRange.start && selectedRange.end
                          ? {
                                start: selectedRange.start,
                                end: selectedRange.end,
                            }
                          : undefined
                }
            />

            <ContextMenu
                isOpen={contextMenu.isOpen}
                x={contextMenu.x}
                y={contextMenu.y}
                onClose={handleContextMenuClose}
                items={getContextMenuItems()}
            />
        </VStack>
    )
}
