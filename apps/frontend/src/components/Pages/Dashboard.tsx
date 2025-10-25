import { Box, Grid, Stack, Flex, Button, Text } from '@chakra-ui/react'
import { useState, useEffect } from 'react'
import { format, subDays } from 'date-fns'
import {
    FiCalendar,
    FiClock,
    FiBarChart2,
    FiTrendingUp,
    FiRefreshCw,
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
} from '../../hooks/queries/useStatisticsQueries'

export function Dashboard() {
    // Date range state - default to last 30 days
    const [dateRange, setDateRange] = useState({
        startDate: format(subDays(new Date(), 30), 'yyyy-MM-dd'),
        endDate: format(new Date(), 'yyyy-MM-dd'),
    })

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

    // Auto-refresh logic
    useEffect(() => {
        if (!autoRefresh) return

        const interval = setInterval(() => {
            dailySummary.refetch()
            dateRangeSummary.refetch()
            projectAnalytics.refetch()
            externalByUnit.refetch()
            setLastRefreshed(new Date())
        }, 60 * 1000) // 5 minutes

        return () => clearInterval(interval)
    }, [
        autoRefresh,
        dailySummary,
        dateRangeSummary,
        projectAnalytics,
        externalByUnit,
    ])

    // Manual refresh
    const handleRefresh = () => {
        dailySummary.refetch()
        dateRangeSummary.refetch()
        projectAnalytics.refetch()
        externalByUnit.refetch()
        setLastRefreshed(new Date())
    }

    // Calculate key metrics from the data
    const getDailyMetrics = () => {
        if (!dailySummary.data?.data) {
            return { totalOrders: 0, studioOrders: 0, externalOrders: 0 }
        }

        const rows = dailySummary.data.data.rows
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

    const getProjectCount = () => {
        if (!projectAnalytics.data?.data) return 0
        // Subtract 1 for the totals row
        return Math.max(0, projectAnalytics.data.data.rows.length - 1)
    }

    const metrics = getDailyMetrics()

    return (
        <Box p={6} w="full">
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
                        value={getProjectCount()}
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
                    headers={dailySummary.data?.data.headers || []}
                    rows={dailySummary.data?.data.rows || []}
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
                                    startDate: format(
                                        subDays(new Date(), 7),
                                        'yyyy-MM-dd'
                                    ),
                                    endDate: format(new Date(), 'yyyy-MM-dd'),
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
                                    startDate: format(
                                        subDays(new Date(), 30),
                                        'yyyy-MM-dd'
                                    ),
                                    endDate: format(new Date(), 'yyyy-MM-dd'),
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
                        headers={dateRangeSummary.data?.data.headers || []}
                        rows={dateRangeSummary.data?.data.rows || []}
                        isLoading={dateRangeSummary.isLoading}
                        minHeight="400px"
                    />

                    {/* Report 3: Project Analytics */}
                    <StatisticsTable
                        title="ניתוח פרויקטים"
                        description="סטטיסטיקות מפורטות לכל פרויקט"
                        icon={<HiFolderOpen size={20} />}
                        headers={projectAnalytics.data?.data.headers || []}
                        rows={projectAnalytics.data?.data.rows || []}
                        isLoading={projectAnalytics.isLoading}
                        minHeight="400px"
                    />
                </Grid>

                {/* Report 4: External by Unit - Full Width */}
                <StatisticsTable
                    title="מימון חיצוני לפי יחידות"
                    description="ימי מילואים ממומנים חיצונית מקובצים לפי יחידת מימון"
                    icon={<FiTrendingUp size={20} />}
                    headers={externalByUnit.data?.data.headers || []}
                    rows={externalByUnit.data?.data.rows || []}
                    isLoading={externalByUnit.isLoading}
                    minHeight="400px"
                />
            </Stack>
        </Box>
    )
}
