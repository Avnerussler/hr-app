import { VStack, HStack, Text, Box, Button, Input } from '@chakra-ui/react'
import {
    DrawerRoot,
    DrawerContent,
    DrawerHeader,
    DrawerBody,
    DrawerFooter,
    DrawerTitle,
    DrawerCloseTrigger,
} from '../ui/drawer'
import { useMemo, useState } from 'react'
import { format } from 'date-fns'
import { he } from 'date-fns/locale'
import {
    FaUsers,
    FaSignInAlt,
    FaSignOutAlt,
    FaCalendarCheck,
    FaBuilding,
} from 'react-icons/fa'
import { MetricCard } from '../common/MetricCard'
import { EmployeeAttendanceCard } from './EmployeeAttendanceCard'
import {
    useEmployeeAttendanceQuery,
    useManagerReportStatusQuery,
} from '@/hooks/queries'
import {
    useUpdateIndividualAttendanceMutation,
    useManagerReportMutation,
} from '@/hooks/mutations'

import type { EmployeeAttendance } from '@/hooks/queries'

interface DailyAttendanceDrawerProps {
    isOpen: boolean
    onClose: () => void
    selectedDate: string
}

type FilterType =
    | 'all'
    | 'starting'
    | 'ending'
    | 'total'
    | 'attended'
    | 'internal'
    | 'external'

export function DailyAttendanceDrawer({
    isOpen,
    onClose,
    selectedDate,
}: DailyAttendanceDrawerProps) {
    // Filter state
    const [activeFilter, setActiveFilter] = useState<FilterType>('all')

    // Initialize mutations
    const updateIndividualMutation = useUpdateIndividualAttendanceMutation()
    const managerReportMutation = useManagerReportMutation()

    // Fetch real employee data for the selected date
    const {
        data: attendanceData,
        isLoading,
        error,
    } = useEmployeeAttendanceQuery(selectedDate)

    // Check if manager has already reported for this date
    const { data: managerReportStatus, isLoading: isLoadingManagerStatus } =
        useManagerReportStatusQuery(selectedDate)

    const employees: EmployeeAttendance[] = attendanceData?.employees || []
    const apiStats = attendanceData?.statistics

    // Calculate internal and external counts
    const internalCount = useMemo(
        () =>
            employees.filter((emp) => emp.fundingSource === 'internal').length,
        [employees]
    )

    const externalCount = useMemo(
        () =>
            employees.filter((emp) => emp.fundingSource === 'external').length,
        [employees]
    )

    // Use API stats directly since we save immediately
    const stats = useMemo(() => {
        if (!apiStats) {
            return {
                startingToday: 0,
                endingToday: 0,
                totalRequired: 0,
                totalAttended: 0,
            }
        }

        return apiStats
    }, [apiStats])

    // Filter employees based on active filter
    const filteredEmployees = useMemo(() => {
        switch (activeFilter) {
            case 'starting':
                return employees.filter((emp) => emp.isStartingToday)
            case 'ending':
                return employees.filter((emp) => emp.isEndingToday)
            case 'attended':
                return employees.filter((emp) => emp.hasAttended)
            case 'internal':
                return employees.filter(
                    (emp) => emp.fundingSource === 'internal'
                )
            case 'external':
                return employees.filter(
                    (emp) => emp.fundingSource === 'external'
                )
            case 'total':
            case 'all':
            default:
                return employees
        }
    }, [employees, activeFilter])

    const handleFilterClick = (filter: FilterType) => {
        setActiveFilter(activeFilter === filter ? 'all' : filter)
    }

    // Search state for employees list
    const [searchQuery, setSearchQuery] = useState<string>('')

    const employeeToSearchString = (emp: any) => {
        if (!emp) return ''
        const parts: string[] = []
        if (emp.firstName) parts.push(emp.firstName)
        if (emp.lastName) parts.push(emp.lastName)
        if (emp.displayName) parts.push(emp.displayName)
        if (emp.employeeNumber) parts.push(String(emp.employeeNumber))
        if (emp.email) parts.push(emp.email)
        if (emp.position) parts.push(emp.position)
        if (emp.department) parts.push(emp.department)
        if (emp._id) parts.push(emp._id)
        // fallback: include any primitive values
        try {
            const extra = Object.values(emp)
                .filter((v) => typeof v === 'string' || typeof v === 'number')
                .map((v) => String(v))
            parts.push(...extra)
        } catch {
            /* ignore */
        }
        return parts.join(' ').toLowerCase()
    }

    const searchedEmployees = useMemo(() => {
        const q = searchQuery.trim().toLowerCase()
        if (!q) return filteredEmployees
        return filteredEmployees.filter((emp) =>
            employeeToSearchString(emp).includes(q)
        )
    }, [filteredEmployees, searchQuery])

    const handleAttendanceToggle = async (
        employeeId: string,
        attended: boolean
    ) => {
        try {
            // Update immediately in DB
            await updateIndividualMutation.mutateAsync({
                employeeId,
                date: selectedDate,
                hasAttended: attended,
            })
        } catch (error) {
            console.error('Failed to update attendance:', error)
        }
    }

    const handleManagerReport = async () => {
        try {
            await managerReportMutation.mutateAsync({
                date: selectedDate,
            })
        } catch (error) {
            console.error('Failed to submit manager report:', error)
            // Don't close drawer on error so user can retry
        }
    }

    // Manager has reported if we have the status and it's true
    const hasManagerReported = managerReportStatus?.hasReported ?? false
    const isManagerReporting = managerReportMutation.isPending

    const formatDateDisplay = (dateStr: string) => {
        try {
            return format(new Date(dateStr), 'dd/MM/yyyy (EEEE)', {
                locale: he,
            })
        } catch {
            return dateStr
        }
    }

    return (
        <DrawerRoot
            size="lg"
            open={isOpen}
            onOpenChange={(details) => details.open || onClose()}
        >
            <DrawerContent display="flex" flexDirection="column" h="100%">
                <DrawerHeader borderBottomWidth="1px" flexShrink={0}>
                    <DrawerTitle>
                        נוכחות יומית - {formatDateDisplay(selectedDate)}
                    </DrawerTitle>
                    <DrawerCloseTrigger />
                </DrawerHeader>

                <DrawerBody>
                    <VStack gap={6} align="stretch">
                        {/* Statistics Cards */}
                        <Box>
                            <Text fontSize="lg" fontWeight="bold" mb={4}>
                                סטטיסטיקות יומיות
                            </Text>
                            <HStack gap={4} wrap="wrap">
                                <MetricCard
                                    label="מתחילים היום"
                                    value={stats.startingToday}
                                    icon={FaSignInAlt}
                                    color="green"
                                    onClick={() =>
                                        handleFilterClick('starting')
                                    }
                                    isActive={activeFilter === 'starting'}
                                />
                                <MetricCard
                                    label="מסיימים היום"
                                    value={stats.endingToday}
                                    icon={FaSignOutAlt}
                                    color="orange"
                                    onClick={() => handleFilterClick('ending')}
                                    isActive={activeFilter === 'ending'}
                                />
                                <MetricCard
                                    label="סה״כ נדרשים"
                                    value={stats.totalRequired}
                                    icon={FaUsers}
                                    color="blue"
                                    onClick={() => handleFilterClick('total')}
                                    isActive={activeFilter === 'total'}
                                />
                                <MetricCard
                                    label="הגיעו בפועל"
                                    value={stats.totalAttended}
                                    icon={FaCalendarCheck}
                                    color={
                                        stats.totalAttended ===
                                        stats.totalRequired
                                            ? 'green'
                                            : 'purple'
                                    }
                                    onClick={() =>
                                        handleFilterClick('attended')
                                    }
                                    isActive={activeFilter === 'attended'}
                                />
                                <MetricCard
                                    label="מימון פנימי"
                                    value={internalCount}
                                    icon={FaBuilding}
                                    color="teal"
                                    onClick={() =>
                                        handleFilterClick('internal')
                                    }
                                    isActive={activeFilter === 'internal'}
                                />
                                <MetricCard
                                    label="מימון חיצוני"
                                    value={externalCount}
                                    icon={FaBuilding}
                                    color="cyan"
                                    onClick={() =>
                                        handleFilterClick('external')
                                    }
                                    isActive={activeFilter === 'external'}
                                />
                            </HStack>
                        </Box>

                        {/* Employee List */}
                        <Box>
                            <HStack justify="space-between" mb={4}>
                                <Text fontSize="lg" fontWeight="bold">
                                    רשימת עובדים ({searchedEmployees.length})
                                </Text>
                                {activeFilter !== 'all' && (
                                    <Button
                                        size="sm"
                                        variant="ghost"
                                        onClick={() => setActiveFilter('all')}
                                    >
                                        נקה סינון
                                    </Button>
                                )}
                            </HStack>

                            <Box mb={3}>
                                <Input
                                    placeholder="חפש עובדים (שם, ת.ז., מייל...)"
                                    size="sm"
                                    value={searchQuery}
                                    onChange={(e) =>
                                        setSearchQuery(e.target.value)
                                    }
                                />
                            </Box>

                            {isLoading ? (
                                <Box textAlign="center" p={8}>
                                    <Text>טוען נתוני עובדים...</Text>
                                </Box>
                            ) : error ? (
                                <Box textAlign="center" p={8}>
                                    <Text color="red.500">
                                        שגיאה בטעינת נתונים
                                    </Text>
                                </Box>
                            ) : searchedEmployees.length === 0 ? (
                                <Box textAlign="center" p={8}>
                                    <Text color="gray.500">
                                        {activeFilter === 'all' && !searchQuery
                                            ? 'אין עובדים שצריכים להגיע היום'
                                            : 'אין עובדים בסינון זה'}
                                    </Text>
                                </Box>
                            ) : (
                                <VStack gap={3} align="stretch">
                                    {searchedEmployees.map((employee) => (
                                        <EmployeeAttendanceCard
                                            key={employee._id}
                                            employee={employee}
                                            currentAttendance={
                                                employee.hasAttended
                                            }
                                            onAttendanceToggle={
                                                handleAttendanceToggle
                                            }
                                        />
                                    ))}
                                </VStack>
                            )}
                        </Box>
                    </VStack>
                </DrawerBody>

                <DrawerFooter borderTopWidth="1px" flexShrink={0}>
                    <HStack gap={3} w="full" justify="space-between">
                        <HStack gap={3}>
                            <Button variant="ghost" onClick={onClose}>
                                ביטול
                            </Button>
                            <Button
                                colorScheme="blue"
                                onClick={handleManagerReport}
                                disabled={
                                    hasManagerReported || isLoadingManagerStatus
                                }
                                loading={isManagerReporting}
                            >
                                {isManagerReporting
                                    ? 'מדווח לקישור...'
                                    : hasManagerReported
                                      ? 'דווח לקישור'
                                      : 'דווח לקישור'}
                            </Button>
                        </HStack>
                    </HStack>
                </DrawerFooter>
            </DrawerContent>
        </DrawerRoot>
    )
}
