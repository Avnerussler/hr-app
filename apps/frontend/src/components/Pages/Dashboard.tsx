import { Box, Grid, Stack, Flex, Button, Text } from '@chakra-ui/react'
import { useState, useEffect } from 'react'
import { format } from 'date-fns'
import {
    FiCalendar,
    FiClock,
    FiBarChart2,
    FiTrendingUp,
    FiRefreshCw,
    FiUsers,
} from 'react-icons/fi'
import { HiFolderOpen } from 'react-icons/hi'
import { PageHeader } from '../common/PageHeader'
import { MetricCard } from '../common/MetricCard'
import { StatisticsTable } from '../common/StatisticsTable'
import {
    useDailySummaryQuery,
    useDateRangeSummaryQuery,
    useProjectAnalyticsQuery,
    useExternalByUnitQuery,
    useEmployeesOnReserveQuery,
} from '../../hooks/queries/useStatisticsQueries'

// Reserve-day dates are stored as UTC-midnight and reports query by UTC date
// boundaries, so "today"/date-range defaults must use the UTC calendar date —
// not the browser's local timezone, which can be a day ahead/behind UTC near
// midnight (e.g. Israel is UTC+3).
const todayUtc = () => new Date().toISOString().split('T')[0]
const daysAgoUtc = (n: number) => {
    const d = new Date()
    d.setUTCDate(d.getUTCDate() - n)
    return d.toISOString().split('T')[0]
}

export function Dashboard() {
    // Date range state - default to last 30 days
    const [dateRange, setDateRange] = useState({
        startDate: daysAgoUtc(30),
        endDate: todayUtc(),
    })

    // Selected date for employees on reserve report - default to today
    const [selectedDate, setSelectedDate] = useState(todayUtc())

    // Auto-refresh interval (5 minutes)
    const [lastRefreshed, setLastRefreshed] = useState(new Date())
    const [autoRefresh, setAutoRefresh] = useState(true)

    // Fetch all reports
    const dailySummary = useDailySummaryQuery()
    const dateRangeSummary = useDateRangeSummaryQuery(
        dateRange.startDate,
        dateRange.endDate
    )
    const projectAnalytics = useProjectAnalyticsQuery(
        dateRange.startDate,
        dateRange.endDate
    )
    const externalByUnit = useExternalByUnitQuery(
        dateRange.startDate,
        dateRange.endDate
    )
    const employeesOnReserve = useEmployeesOnReserveQuery(selectedDate)

    // Auto-refresh logic
    useEffect(() => {
        if (!autoRefresh) return

        const interval = setInterval(() => {
            dailySummary.refetch()
            dateRangeSummary.refetch()
            projectAnalytics.refetch()
            externalByUnit.refetch()
            employeesOnReserve.refetch()
            setLastRefreshed(new Date())
        }, 60 * 1000) // 1 minute

        return () => clearInterval(interval)
    }, [
        autoRefresh,
        dailySummary,
        dateRangeSummary,
        projectAnalytics,
        externalByUnit,
        employeesOnReserve,
    ])

    // Manual refresh
    const handleRefresh = () => {
        dailySummary.refetch()
        dateRangeSummary.refetch()
        projectAnalytics.refetch()
        externalByUnit.refetch()
        employeesOnReserve.refetch()
        setLastRefreshed(new Date())
    }

    // Calculate key metrics from the data
    const getDailyMetrics = () => {
        if (!dailySummary.data?.report) {
            return { totalOrders: 0, studioOrders: 0, externalOrders: 0 }
        }

        const rows = dailySummary.data.report.rows
        const totalsRow = rows[rows.length - 1]

        if (!totalsRow) {
            return { totalOrders: 0, studioOrders: 0, externalOrders: 0 }
        }

        return {
            totalOrders: totalsRow[4] || 0, // Total column
            studioOrders: totalsRow[1] || 0, // Studio column
            externalOrders: totalsRow[2] || 0, // External column
        }
    }

    const metrics = getDailyMetrics()
    const activeProjectCount = projectAnalytics.data?.report.activeProjectCount ?? 0

    return (
        <Box p={6} w="full" h="full" overflow="auto">
            <Stack gap={6} w="full">
                {/* Header with Refresh Controls */}
                <Flex
                    justify="space-between"
                    align="center"
                    wrap="wrap"
                    gap={4}
                >
                    <PageHeader
                        title="לוח בקרה - סטטיסטיקות מילואים"
                        description="נתונים בזמן אמת על ימי מילואים, פרויקטים ומימון חיצוני"
                    />
                    <Flex gap={3} align="center">
                        <Text fontSize="xs" color="gray.500">
                            עדכון אחרון: {format(lastRefreshed, 'HH:mm:ss')}
                        </Text>
                        <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setAutoRefresh(!autoRefresh)}
                            colorScheme={autoRefresh ? 'green' : 'gray'}
                        >
                            {autoRefresh
                                ? 'רענון אוטומטי פעיל'
                                : 'רענון אוטומטי כבוי'}
                        </Button>
                        <Button
                            size="sm"
                            colorScheme="blue"
                            onClick={handleRefresh}
                            disabled={
                                dailySummary.isRefetching ||
                                dateRangeSummary.isRefetching
                            }
                        >
                            <FiRefreshCw />
                        </Button>
                    </Flex>
                </Flex>

                {/* Key Metrics - Today's Summary */}
                <Grid
                    templateColumns={{ base: '1fr', md: 'repeat(3, 1fr)' }}
                    gap={4}
                >
                    <MetricCard
                        icon={FiClock}
                        label="סה״כ צווים היום"
                        value={metrics.totalOrders}
                        color="blue.600"
                    />
                    <MetricCard
                        icon={HiFolderOpen}
                        label="פרויקטים פעילים"
                        value={activeProjectCount}
                        color="green.600"
                    />
                    <MetricCard
                        icon={FiTrendingUp}
                        label="צווים חיצוניים היום"
                        value={metrics.externalOrders}
                        color="purple.600"
                    />
                </Grid>

                {/* Report 1: Daily Summary */}
                <StatisticsTable
                    title="דוח יומי - סיכום צווים לפי פרויקטים"
                    description="סיכום צווי מילואים להיום לפי פרויקטים"
                    icon={<FiCalendar size={20} />}
                    headers={dailySummary.data?.report.headers || []}
                    rows={dailySummary.data?.report.rows || []}
                    isLoading={dailySummary.isLoading}
                />

                {/* Date Range Controls */}
                <Box
                    bg="gray.50"
                    p={4}
                    borderRadius="md"
                    borderWidth="1px"
                    borderColor="gray.200"
                >
                    <Flex gap={4} align="center" wrap="wrap">
                        <Text fontWeight="semibold" color="gray.700">
                            טווח תאריכים לדוחות:
                        </Text>
                        <Flex gap={2} align="center">
                            <input
                                type="date"
                                value={dateRange.startDate}
                                onChange={(e) =>
                                    setDateRange({
                                        ...dateRange,
                                        startDate: e.target.value,
                                    })
                                }
                                style={{
                                    padding: '0.5rem',
                                    borderRadius: '0.375rem',
                                    border: '1px solid #E2E8F0',
                                }}
                            />
                            <Text color="gray.500">עד</Text>
                            <input
                                type="date"
                                value={dateRange.endDate}
                                onChange={(e) =>
                                    setDateRange({
                                        ...dateRange,
                                        endDate: e.target.value,
                                    })
                                }
                                style={{
                                    padding: '0.5rem',
                                    borderRadius: '0.375rem',
                                    border: '1px solid #E2E8F0',
                                }}
                            />
                        </Flex>
                        <Button
                            size="sm"
                            variant="outline"
                            onClick={() =>
                                setDateRange({
                                    startDate: daysAgoUtc(7),
                                    endDate: todayUtc(),
                                })
                            }
                        >
                            7 ימים אחרונים
                        </Button>
                        <Button
                            size="sm"
                            variant="outline"
                            onClick={() =>
                                setDateRange({
                                    startDate: daysAgoUtc(30),
                                    endDate: todayUtc(),
                                })
                            }
                        >
                            30 ימים אחרונים
                        </Button>
                    </Flex>
                </Box>

                {/* Reports Grid - 2 columns on large screens */}
                <Grid
                    templateColumns={{ base: '1fr', xl: 'repeat(2, 1fr)' }}
                    gap={6}
                    w="full"
                >
                    {/* Report 2: Date Range Summary */}
                    <StatisticsTable
                        title="סיכום לפי טווח תאריכים"
                        description={`${dateRange.startDate} עד ${dateRange.endDate}`}
                        icon={<FiBarChart2 size={20} />}
                        headers={dateRangeSummary.data?.report.headers || []}
                        rows={dateRangeSummary.data?.report.rows || []}
                        isLoading={dateRangeSummary.isLoading}
                        minHeight="400px"
                    />

                    {/* Report 3: Project Analytics */}
                    <StatisticsTable
                        title="ניתוח פרויקטים"
                        description="סטטיסטיקות מפורטות לכל פרויקט"
                        icon={<HiFolderOpen size={20} />}
                        headers={projectAnalytics.data?.report.headers || []}
                        rows={projectAnalytics.data?.report.rows || []}
                        isLoading={projectAnalytics.isLoading}
                        minHeight="400px"
                    />
                </Grid>

                {/* Report 4: External by Unit - Full Width */}
                <StatisticsTable
                    title="מימון חיצוני לפי יחידות"
                    description="ימי מילואים ממומנים חיצונית מקובצים לפי יחידת מימון"
                    icon={<FiTrendingUp size={20} />}
                    headers={externalByUnit.data?.report.headers || []}
                    rows={externalByUnit.data?.report.rows || []}
                    isLoading={externalByUnit.isLoading}
                    minHeight="400px"
                />

                {/* Report 5: Employees on Reserve */}
                <Box>
                    <Flex gap={4} align="center" mb={4}>
                        <Text fontWeight="semibold" color="gray.700">
                            בחר תאריך לדוח עובדים על צו:
                        </Text>
                        <input
                            type="date"
                            value={selectedDate}
                            onChange={(e) => setSelectedDate(e.target.value)}
                            style={{
                                padding: '0.5rem',
                                borderRadius: '0.375rem',
                                border: '1px solid #E2E8F0',
                            }}
                        />
                    </Flex>
                    <StatisticsTable
                        title="עובדים על צו בתאריך מוגדר"
                        description={`רשימת כל העובדים על צו ביום ${selectedDate}`}
                        icon={<FiUsers size={20} />}
                        headers={employeesOnReserve.data?.report.headers || []}
                        rows={employeesOnReserve.data?.report.rows || []}
                        isLoading={employeesOnReserve.isLoading}
                        minHeight="400px"
                    />
                </Box>
            </Stack>
        </Box>
    )
}
