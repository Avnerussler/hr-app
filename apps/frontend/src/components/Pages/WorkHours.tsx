import { Box, VStack, HStack, Button, Text, Flex } from '@chakra-ui/react'
import {
    FaClock,
    FaUsers,
    FaChartLine,
    FaChevronLeft,
    FaChevronRight,
    FaCalendarAlt,
    FaCopy,
} from 'react-icons/fa'
import { useState, useMemo } from 'react'
import {
    startOfWeek,
    endOfWeek,
    addWeeks,
    subWeeks,
    format,
    addDays,
    getWeek,
} from 'date-fns'
import { PageHeader } from '../common/PageHeader'
import { MetricCard } from '../common/MetricCard'
import { WeeklyHoursGrid } from '../WorkHours'
import {
    useWorkHoursRangeQuery,
    useWorkHoursMetricsQuery,
    useFormSubmissionsQuery,
} from '@/hooks/queries'
import { useUpdateWorkHourByEmployeeDate } from '@/hooks/mutations'

export default function WorkHoursPage() {
    const [selectedWeek, setSelectedWeek] = useState(() => {
        return startOfWeek(new Date(), { weekStartsOn: 1 }) // Monday as start of week
    })

    const [selectedEmployees, setSelectedEmployees] = useState<Set<string>>(
        new Set()
    )

    // Calculate week start and end dates for API queries
    const { weekStartISO, weekEndISO } = useMemo(() => {
        const weekStart = startOfWeek(selectedWeek, { weekStartsOn: 1 })
        const weekEnd = endOfWeek(selectedWeek, { weekStartsOn: 1 })

        return {
            weekStartISO: format(weekStart, 'yyyy-MM-dd'),
            weekEndISO: format(weekEnd, 'yyyy-MM-dd'),
        }
    }, [selectedWeek])

    // TanStack Query hooks for real-time data
    const { data: workHoursData, isLoading: isLoadingWorkHours } =
        useWorkHoursRangeQuery(weekStartISO, weekEndISO)

    const { data: metricsData } = useWorkHoursMetricsQuery(
        weekStartISO,
        weekEndISO
    )

    // Mutations
    const updateWorkHourMutation = useUpdateWorkHourByEmployeeDate()

    // Query for employees (Personnel forms)
    const { data: employeesData, isLoading: isLoadingEmployees } =
        useFormSubmissionsQuery({
            formName: 'Personnel',
        })

    // Query for projects
    const { data: projectsData } = useFormSubmissionsQuery({
        formName: 'Project%20Management',
    })

    // Get employees list
    const employees = useMemo(() => {
        console.log('employeesData:', employeesData) // Debug logxw
        if (!employeesData?.forms?.length) return []

        return employeesData.forms.map((employee: any) => ({
            id: employee._id || '',
            name:
                employee.formData?.name ||
                employee.formData?.firstName ||
                'Unknown Employee',
        }))
    }, [employeesData])

    // Get projects list
    const projects = useMemo(() => {
        console.log('projectsData:', projectsData) // Debug log
        if (!projectsData?.forms?.length) return []

        return projectsData.forms.map((project: any) => ({
            id: project._id || '',
            name:
                project.formData?.name ||
                project.formData?.projectName ||
                'Unknown Project',
        }))
    }, [projectsData])

    // Calculate week dates using date-fns
    const weekDates = useMemo(() => {
        const weekStart = startOfWeek(selectedWeek, { weekStartsOn: 1 })
        const dates = []

        for (let i = 0; i < 7; i++) {
            dates.push(addDays(weekStart, i))
        }
        return dates
    }, [selectedWeek])

    // Use metrics from API or fallback to defaults
    const weekMetrics = useMemo(() => {
        if (metricsData?.metrics) {
            return {
                totalHours: metricsData.metrics.totalHours,
                activeEmployees: metricsData.metrics.activeEmployees,
                averageHours: metricsData.metrics.avgHoursPerEmployee,
            }
        }
        return {
            totalHours: 0,
            activeEmployees: 0,
            averageHours: 0,
        }
    }, [metricsData])

    const handlePreviousWeek = () => {
        setSelectedWeek(subWeeks(selectedWeek, 1))
    }

    const handleNextWeek = () => {
        setSelectedWeek(addWeeks(selectedWeek, 1))
    }

    const handleToday = () => {
        setSelectedWeek(startOfWeek(new Date(), { weekStartsOn: 1 }))
    }

    const handleCopyPreviousWeek = async () => {
        if (!workHoursData?.workHours?.length) return

        // Get previous week's data
        const previousWeekStart = format(
            subWeeks(selectedWeek, 1),
            'yyyy-MM-dd'
        )
        const previousWeekEnd = format(
            endOfWeek(subWeeks(selectedWeek, 1), { weekStartsOn: 1 }),
            'yyyy-MM-dd'
        )

        try {
            // This would typically fetch previous week's data and copy it
            // For now, just show a placeholder
            console.log(
                'Copy previous week from:',
                previousWeekStart,
                'to',
                previousWeekEnd
            )
        } catch (error) {
            console.error('Error copying previous week:', error)
        }
    }

    const handleHoursChange = async (
        employeeId: string,
        date: string,
        hours: number,
        projectId?: string,
        notes?: string
    ) => {
        const employee = employees.find((emp) => emp.id === employeeId)
        const project = projects.find((proj) => proj.id === projectId)

        try {
            await updateWorkHourMutation.mutateAsync({
                employeeId,
                date,
                hours,
                projectId,
                projectName: project?.name,
                notes,
                employeeName: employee?.name || 'Unknown Employee',
            })
        } catch (error) {
            console.error('Error updating work hours:', error)
        }
    }

    const handleEmployeeToggle = (employeeId: string) => {
        setSelectedEmployees((prev) => {
            const newSet = new Set(prev)
            if (newSet.has(employeeId)) {
                newSet.delete(employeeId)
            } else {
                newSet.add(employeeId)
            }
            return newSet
        })
    }

    const formatWeekRange = (startDate: Date) => {
        const weekStart = startOfWeek(startDate, { weekStartsOn: 1 })
        const weekEnd = endOfWeek(startDate, { weekStartsOn: 1 })

        const startStr = format(weekStart, 'd MMM')
        const endStr = format(weekEnd, 'd MMM yyyy')

        return `${startStr} - ${endStr}`
    }

    // Show loading state if employees are loading
    if (isLoadingEmployees) {
        return (
            <VStack gap={6} align="stretch">
                <PageHeader
                    title="ניהול שעות עבודה"
                    description="מילוי שעות עבודה יומיות לכל העובדים"
                    icon={FaClock}
                />
                <Box textAlign="center" p={8}>
                    <Text>טוען נתוני עובדים...</Text>
                </Box>
            </VStack>
        )
    }

    // Show debug info if no employees found
    if (employees.length === 0) {
        return (
            <VStack gap={6} align="stretch">
                <PageHeader
                    title="ניהול שעות עבודה"
                    description="מילוי שעות עבודה יומיות לכל העובדים"
                    icon={FaClock}
                />
                <Box textAlign="center" p={8}>
                    <Text>לא נמצאו עובדים במערכת</Text>

                    <Text fontSize="sm" color="muted">
                        Raw data: {JSON.stringify(employeesData, null, 2)}
                    </Text>
                </Box>
            </VStack>
        )
    }

    return (
        <VStack gap={6} align="stretch">
            {/* <PageHeader
                title="ניהול שעות עבודה"
                description="מילוי שעות עבודה יומיות לכל העובדים"
                icon={FaClock}
                actions={[
                    {
                        label: 'העתק שבוע קודם',
                        icon: FaCopy,
                        variant: 'outline',
                        onClick: handleCopyPreviousWeek,
                    },
                ]}
            /> */}

            {/* Metrics Cards */}
            <Box
                display="grid"
                gridTemplateColumns="repeat(auto-fit, minmax(240px, 1fr))"
                gap={4}
            >
                <MetricCard
                    label="סה״כ שעות השבוע"
                    value={weekMetrics.totalHours}
                    icon={FaClock}
                    color="blue"
                />
                <MetricCard
                    label="עובדים פעילים"
                    value={weekMetrics.activeEmployees}
                    icon={FaUsers}
                    color="green"
                />
                <MetricCard
                    label="ממוצע שעות לעובד"
                    value={weekMetrics.averageHours}
                    icon={FaChartLine}
                    color="purple"
                />
            </Box>

            {/* Week Navigation */}
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
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={handlePreviousWeek}
                    >
                        <FaChevronLeft />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={handleNextWeek}>
                        <FaChevronRight />
                    </Button>
                </HStack>

                <VStack gap={1}>
                    <Text fontSize="lg" fontWeight="bold">
                        {formatWeekRange(selectedWeek)}
                    </Text>
                    <Text fontSize="sm" color="muted">
                        שבוע {getWeek(selectedWeek, { weekStartsOn: 1 })}
                    </Text>
                </VStack>

                <Button variant="outline" size="sm" onClick={handleToday}>
                    <FaCalendarAlt />
                    השבוע הנוכחי
                </Button>
            </Flex>

            {/* Main Work Hours Grid */}
            <Box
                p={4}
                bg="card"
                borderRadius="md"
                borderWidth="1px"
                borderColor="border"
            >
                <WeeklyHoursGrid
                    employees={employees}
                    projects={projects}
                    weekDates={weekDates}
                    workHoursData={(workHoursData?.workHours || []).map(
                        (entry) => ({
                            employeeId: entry.employeeId,
                            date: format(new Date(entry.date), 'yyyy-MM-dd'),
                            hours: entry.hours,
                            projectId: entry.projectId,
                            notes: entry.notes,
                        })
                    )}
                    onHoursChange={handleHoursChange}
                    onEmployeeToggle={handleEmployeeToggle}
                    selectedEmployees={selectedEmployees}
                    isLoading={isLoadingWorkHours}
                />
            </Box>
        </VStack>
    )
}
