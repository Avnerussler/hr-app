import {
    VStack,
    HStack,
    Text,
    Badge,
    Box,
    Button,
    Spinner,
    Center,
} from '@chakra-ui/react'
import { format } from 'date-fns'
import { HoursInputCell } from './HoursInputCell'

interface Employee {
    id: string
    name: string
}

interface Project {
    id: string
    name: string
}

interface WorkHourEntry {
    employeeId: string
    date: string
    hours: number
    projectId?: string
    notes?: string
}

interface WeeklyHoursGridProps {
    employees: Employee[]
    projects: Project[]
    weekDates: Date[]
    workHoursData: WorkHourEntry[]
    onHoursChange: (
        employeeId: string,
        date: string,
        hours: number,
        projectId?: string,
        notes?: string
    ) => void
    onEmployeeToggle?: (employeeId: string) => void
    selectedEmployees?: Set<string>
    isLoading?: boolean
}

export const WeeklyHoursGrid: React.FC<WeeklyHoursGridProps> = ({
    employees,
    projects,
    weekDates,
    workHoursData,
    onHoursChange,
    onEmployeeToggle,
    selectedEmployees = new Set(),
    isLoading = false,
}) => {
    // Show loading state
    if (isLoading) {
        return (
            <Center p={8}>
                <VStack gap={3}>
                    <Spinner size="lg" />
                    <Text>טוען נתוני שעות עבודה...</Text>
                </VStack>
            </Center>
        )
    }

    // Helper function to get work hours for specific employee and date
    const getWorkHourEntry = (
        employeeId: string,
        date: Date
    ): WorkHourEntry | undefined => {
        const dateStr = format(date, 'yyyy-MM-dd')
        return workHoursData.find(
            (entry) => entry.employeeId === employeeId && entry.date === dateStr
        )
    }

    // Calculate daily totals
    const getDailyTotal = (date: Date): number => {
        const dateStr = format(date, 'yyyy-MM-dd')
        return workHoursData
            .filter((entry) => entry.date === dateStr)
            .reduce((sum, entry) => sum + entry.hours, 0)
    }

    // Calculate employee weekly total
    const getEmployeeWeeklyTotal = (employeeId: string): number => {
        return workHoursData
            .filter((entry) => entry.employeeId === employeeId)
            .reduce((sum, entry) => sum + entry.hours, 0)
    }

    // Calculate grand total
    const getGrandTotal = (): number => {
        return workHoursData.reduce((sum, entry) => sum + entry.hours, 0)
    }

    // Toggle employee selection
    const toggleEmployeeSelection = (employeeId: string) => {
        onEmployeeToggle?.(employeeId)
    }

    const getDayName = (date: Date): string => {
        const dayNames = ['א׳', 'ב׳', 'ג׳', 'ד׳', 'ה׳', 'ו׳', 'שבת']
        return dayNames[date.getDay()]
    }

    const formatDate = (date: Date): string => {
        return date.toLocaleDateString('he-IL', {
            day: 'numeric',
            month: 'numeric',
        })
    }

    return (
        <VStack align="stretch" gap={4}>
            {/* Filter Controls */}
            <HStack justify="space-between" wrap="wrap">
                <HStack>
                    <Text fontSize="sm" color="muted">
                        {employees.length} עובדים | {selectedEmployees.size}{' '}
                        נבחרו
                    </Text>
                    {selectedEmployees.size > 0 && (
                        <Button
                            size="sm"
                            variant="ghost"
                            onClick={() =>
                                selectedEmployees.forEach((id) =>
                                    toggleEmployeeSelection(id)
                                )
                            }
                        >
                            בטל בחירה
                        </Button>
                    )}
                </HStack>

                <HStack>
                    <Badge colorScheme="blue" fontSize="sm">
                        סה״כ שעות: {getGrandTotal()}
                    </Badge>
                </HStack>
            </HStack>

            {/* Main Hours Table */}
            <Box overflowX="auto">
                <Box as="table" w="full" fontSize="sm">
                    <Box as="thead">
                        <Box as="tr">
                            <Box
                                as="th"
                                width="200px"
                                position="sticky"
                                right={0}
                                bg="background"
                                zIndex={1}
                                p={3}
                                borderBottom="1px"
                                borderColor="border"
                            >
                                עובד
                            </Box>
                            {weekDates.map((date, index) => (
                                <Box
                                    key={index}
                                    as="th"
                                    textAlign="center"
                                    minW="120px"
                                    p={3}
                                    borderBottom="1px"
                                    borderColor="border"
                                >
                                    <VStack gap={1}>
                                        <Text fontWeight="bold">
                                            {getDayName(date)}
                                        </Text>
                                        <Text fontSize="xs" color="muted">
                                            {formatDate(date)}
                                        </Text>
                                        <Badge size="sm" colorScheme="gray">
                                            {getDailyTotal(date)}ש׳
                                        </Badge>
                                    </VStack>
                                </Box>
                            ))}
                            <Box
                                as="th"
                                textAlign="center"
                                width="100px"
                                p={3}
                                borderBottom="1px"
                                borderColor="border"
                            >
                                <VStack gap={1}>
                                    <Text fontWeight="bold">סה״כ</Text>
                                    <Text fontSize="xs" color="muted">
                                        שבועי
                                    </Text>
                                </VStack>
                            </Box>
                        </Box>
                    </Box>
                    <Box as="tbody">
                        {employees.map((employee) => {
                            const isSelected = selectedEmployees.has(
                                employee.id
                            )
                            const weeklyTotal = getEmployeeWeeklyTotal(
                                employee.id
                            )

                            return (
                                <Box
                                    key={employee.id}
                                    as="tr"
                                    bg={isSelected ? 'blue.50' : undefined}
                                    _hover={{ bg: 'gray.50' }}
                                >
                                    {/* Employee Name Cell */}
                                    <Box
                                        as="td"
                                        position="sticky"
                                        right={0}
                                        bg={
                                            isSelected
                                                ? 'blue.50'
                                                : 'background'
                                        }
                                        borderLeft="1px"
                                        borderColor="border"
                                        cursor="pointer"
                                        onClick={() =>
                                            toggleEmployeeSelection(employee.id)
                                        }
                                        p={3}
                                    >
                                        <HStack>
                                            <Box
                                                w={3}
                                                h={3}
                                                borderRadius="full"
                                                bg={
                                                    isSelected
                                                        ? 'blue.500'
                                                        : 'gray.300'
                                                }
                                            />
                                            <VStack align="start" gap={0}>
                                                <Text
                                                    fontWeight="medium"
                                                    fontSize="sm"
                                                >
                                                    {employee.name}
                                                </Text>
                                                {weeklyTotal > 0 && (
                                                    <Text
                                                        fontSize="xs"
                                                        color="muted"
                                                    >
                                                        {weeklyTotal} שעות השבוע
                                                    </Text>
                                                )}
                                            </VStack>
                                        </HStack>
                                    </Box>

                                    {/* Hours Input Cells */}
                                    {weekDates.map((date, dateIndex) => {
                                            const entry = getWorkHourEntry(
                                                employee.id,
                                                date
                                            )

                                            return (
                                                <Box
                                                    key={`${employee.id}-${dateIndex}`}
                                                    as="td"
                                                    p={1}
                                                >
                                                    <HoursInputCell
                                                        employeeName={
                                                            employee.name
                                                        }
                                                        date={date}
                                                        initialHours={
                                                            entry?.hours || 0
                                                        }
                                                        initialProjectId={
                                                            entry?.projectId
                                                        }
                                                        initialNotes={
                                                            entry?.notes
                                                        }
                                                        projects={projects}
                                                        onChange={(
                                                            hours,
                                                            projectId,
                                                            notes
                                                        ) =>
                                                            onHoursChange(
                                                                employee.id,
                                                                format(
                                                                    date,
                                                                    'yyyy-MM-dd'
                                                                ),
                                                                hours,
                                                                projectId,
                                                                notes
                                                            )
                                                        }
                                                    />
                                                </Box>
                                            )
                                        })}

                                    {/* Weekly Total Cell */}
                                    <Box as="td" textAlign="center" p={3}>
                                        <Badge
                                            colorScheme={
                                                weeklyTotal > 40
                                                    ? 'orange'
                                                    : weeklyTotal > 0
                                                      ? 'green'
                                                      : 'gray'
                                            }
                                            fontSize="sm"
                                        >
                                            {weeklyTotal}
                                        </Badge>
                                    </Box>
                                </Box>
                            )
                        })}
                    </Box>
                </Box>
            </Box>

            {/* Summary Footer */}
            <HStack
                justify="space-between"
                p={4}
                bg="gray.50"
                borderRadius="md"
            >
                <HStack gap={4}>
                    <Text fontSize="sm">
                        <strong>סה״כ עובדים:</strong> {employees.length}
                    </Text>
                    <Text fontSize="sm">
                        <strong>עובדים פעילים:</strong>{' '}
                        {
                            new Set(
                                workHoursData.map((entry) => entry.employeeId)
                            ).size
                        }
                    </Text>
                </HStack>

                <HStack gap={4}>
                    <Text fontSize="sm">
                        <strong>סה״כ שעות:</strong> {getGrandTotal()}
                    </Text>
                    <Text fontSize="sm">
                        <strong>ממוצע לעובד:</strong>{' '}
                        {employees.length > 0
                            ? Math.round(
                                  (getGrandTotal() / employees.length) * 10
                              ) / 10
                            : 0}
                    </Text>
                </HStack>
            </HStack>
        </VStack>
    )
}
