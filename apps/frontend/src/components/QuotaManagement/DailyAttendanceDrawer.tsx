import {
    VStack,
    HStack,
    Text,
    Box,
    Button,
    Badge,
    Flex,
    Separator,
} from '@chakra-ui/react'
import {
    DrawerRoot,
    DrawerContent,
    DrawerHeader,
    DrawerBody,
    DrawerFooter,
    DrawerTitle,
    DrawerCloseTrigger,
} from '../ui/drawer'
import { useMemo } from 'react'
import { format } from 'date-fns'
import { he } from 'date-fns/locale'
import { Checkbox } from '../ui/checkbox'
import {
    FaUsers,
    FaSignInAlt,
    FaSignOutAlt,
    FaCalendarCheck,
    FaCalendarAlt,
    FaIdBadge,
    FaBuilding,
    FaFileAlt,
} from 'react-icons/fa'
import { MetricCard } from '../common/MetricCard'
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

export function DailyAttendanceDrawer({
    isOpen,
    onClose,
    selectedDate,
}: DailyAttendanceDrawerProps) {
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
                                />
                                <MetricCard
                                    label="מסיימים היום"
                                    value={stats.endingToday}
                                    icon={FaSignOutAlt}
                                    color="orange"
                                />
                                <MetricCard
                                    label="סה״כ נדרשים"
                                    value={stats.totalRequired}
                                    icon={FaUsers}
                                    color="blue"
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
                                />
                            </HStack>
                        </Box>

                        {/* Employee List */}
                        <Box>
                            <Text fontSize="lg" fontWeight="bold" mb={4}>
                                רשימת עובדים ({employees.length})
                            </Text>

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
                            ) : employees.length === 0 ? (
                                <Box textAlign="center" p={8}>
                                    <Text color="gray.500">
                                        אין עובדים שצריכים להגיע היום
                                    </Text>
                                </Box>
                            ) : (
                                <VStack gap={3} align="stretch">
                                    {employees.map((employee) => {
                                        const currentAttendance =
                                            employee.hasAttended

                                        return (
                                            <Box
                                                key={employee._id}
                                                p={4}
                                                borderRadius="md"
                                                borderWidth="1px"
                                                borderColor="border"
                                                bg={
                                                    currentAttendance
                                                        ? 'green.50'
                                                        : 'gray.50'
                                                }
                                            >
                                                <Flex
                                                    justify="space-between"
                                                    align="start"
                                                >
                                                    <HStack
                                                        gap={3}
                                                        align="start"
                                                    >
                                                        <Checkbox
                                                            size="lg"
                                                            checked={
                                                                currentAttendance
                                                            }
                                                            onCheckedChange={(
                                                                details
                                                            ) =>
                                                                handleAttendanceToggle(
                                                                    employee._id,
                                                                    Boolean(
                                                                        details.checked
                                                                    )
                                                                )
                                                            }
                                                            mt={1}
                                                        />
                                                        <VStack
                                                            align="start"
                                                            gap={2}
                                                            flex={1}
                                                        >
                                                            <Text
                                                                fontWeight="medium"
                                                                fontSize="md"
                                                            >
                                                                {employee.name}
                                                            </Text>

                                                            {/* Employee Details */}
                                                            <VStack
                                                                align="start"
                                                                gap={1}
                                                                w="full"
                                                            >
                                                                {employee.personalNumber && (
                                                                    <HStack
                                                                        gap={2}
                                                                        fontSize="sm"
                                                                        color="gray.600"
                                                                    >
                                                                        <FaIdBadge
                                                                            size={
                                                                                12
                                                                            }
                                                                        />
                                                                        <Text>
                                                                            מס׳
                                                                            אישי:{' '}
                                                                            {
                                                                                employee.personalNumber
                                                                            }
                                                                        </Text>
                                                                    </HStack>
                                                                )}
                                                                {employee.reserveUnit && (
                                                                    <HStack
                                                                        gap={2}
                                                                        fontSize="sm"
                                                                        color="gray.600"
                                                                    >
                                                                        <FaUsers
                                                                            size={
                                                                                12
                                                                            }
                                                                        />
                                                                        <Text>
                                                                            יחידת
                                                                            מילואים:{' '}
                                                                            {
                                                                                employee.reserveUnit
                                                                            }
                                                                        </Text>
                                                                    </HStack>
                                                                )}
                                                                {employee.workPlace && (
                                                                    <HStack
                                                                        gap={2}
                                                                        fontSize="sm"
                                                                        color="gray.600"
                                                                    >
                                                                        <FaBuilding
                                                                            size={
                                                                                12
                                                                            }
                                                                        />
                                                                        <Text>
                                                                            מקום
                                                                            עבודה:{' '}
                                                                            {
                                                                                employee.workPlace
                                                                            }
                                                                        </Text>
                                                                    </HStack>
                                                                )}
                                                                {employee.orderNumber && (
                                                                    <HStack
                                                                        gap={2}
                                                                        fontSize="sm"
                                                                        color="gray.600"
                                                                    >
                                                                        <FaFileAlt
                                                                            size={
                                                                                12
                                                                            }
                                                                        />
                                                                        <Text>
                                                                            מס'
                                                                            פקודה:{' '}
                                                                            {
                                                                                employee.orderNumber
                                                                            }
                                                                        </Text>
                                                                    </HStack>
                                                                )}
                                                                {employee.orderType && (
                                                                    <HStack
                                                                        gap={2}
                                                                        fontSize="sm"
                                                                        color="gray.600"
                                                                    >
                                                                        <FaFileAlt
                                                                            size={
                                                                                12
                                                                            }
                                                                        />
                                                                        <Text>
                                                                            סוג
                                                                            פקודה:{' '}
                                                                            {
                                                                                employee.orderType
                                                                            }
                                                                        </Text>
                                                                    </HStack>
                                                                )}
                                                            </VStack>

                                                            {/* Date Range Information */}
                                                            {(employee.workDays ||
                                                                employee.reserveDays) && (
                                                                <>
                                                                    <Separator
                                                                        my={1}
                                                                    />
                                                                    <VStack
                                                                        align="start"
                                                                        gap={1}
                                                                        w="full"
                                                                    >
                                                                        <Text
                                                                            fontSize="sm"
                                                                            fontWeight="semibold"
                                                                            color="gray.700"
                                                                        >
                                                                            תקופות
                                                                            עבודה:
                                                                        </Text>
                                                                        {employee.workDays &&
                                                                            employee
                                                                                .workDays
                                                                                .length >
                                                                                0 && (
                                                                                <HStack
                                                                                    gap={
                                                                                        2
                                                                                    }
                                                                                    fontSize="xs"
                                                                                    color="blue.600"
                                                                                >
                                                                                    <FaCalendarAlt
                                                                                        size={
                                                                                            10
                                                                                        }
                                                                                    />
                                                                                    <Text>
                                                                                        עבודה
                                                                                        רגילה:{' '}
                                                                                        {employee.workDays
                                                                                            .slice(
                                                                                                0,
                                                                                                3
                                                                                            )
                                                                                            .map(
                                                                                                (
                                                                                                    date
                                                                                                ) =>
                                                                                                    format(
                                                                                                        new Date(
                                                                                                            date
                                                                                                        ),
                                                                                                        'dd/MM'
                                                                                                    )
                                                                                            )
                                                                                            .join(
                                                                                                ', '
                                                                                            )}
                                                                                        {employee
                                                                                            .workDays
                                                                                            .length >
                                                                                            3 &&
                                                                                            ` +${employee.workDays.length - 3} עוד`}
                                                                                    </Text>
                                                                                </HStack>
                                                                            )}
                                                                        {employee.reserveDays &&
                                                                            employee
                                                                                .reserveDays
                                                                                .length >
                                                                                0 && (
                                                                                <HStack
                                                                                    gap={
                                                                                        2
                                                                                    }
                                                                                    fontSize="xs"
                                                                                    color="orange.600"
                                                                                >
                                                                                    <FaCalendarAlt
                                                                                        size={
                                                                                            10
                                                                                        }
                                                                                    />
                                                                                    <Text>
                                                                                        מילואים:{' '}
                                                                                        {employee.reserveDays
                                                                                            .slice(
                                                                                                0,
                                                                                                3
                                                                                            )
                                                                                            .map(
                                                                                                (
                                                                                                    date
                                                                                                ) =>
                                                                                                    format(
                                                                                                        new Date(
                                                                                                            date
                                                                                                        ),
                                                                                                        'dd/MM'
                                                                                                    )
                                                                                            )
                                                                                            .join(
                                                                                                ', '
                                                                                            )}
                                                                                        {employee
                                                                                            .reserveDays
                                                                                            .length >
                                                                                            3 &&
                                                                                            ` +${employee.reserveDays.length - 3} עוד`}
                                                                                    </Text>
                                                                                </HStack>
                                                                            )}
                                                                        {employee.startDate &&
                                                                            employee.endDate && (
                                                                                <HStack
                                                                                    gap={
                                                                                        2
                                                                                    }
                                                                                    fontSize="xs"
                                                                                    color="purple.600"
                                                                                >
                                                                                    <FaCalendarCheck
                                                                                        size={
                                                                                            10
                                                                                        }
                                                                                    />
                                                                                    <Text>
                                                                                        תקופה:{' '}
                                                                                        {format(
                                                                                            new Date(
                                                                                                employee.startDate
                                                                                            ),
                                                                                            'dd/MM'
                                                                                        )}{' '}
                                                                                        -{' '}
                                                                                        {format(
                                                                                            new Date(
                                                                                                employee.endDate
                                                                                            ),
                                                                                            'dd/MM'
                                                                                        )}
                                                                                    </Text>
                                                                                </HStack>
                                                                            )}
                                                                    </VStack>
                                                                </>
                                                            )}

                                                            {/* Status Badges */}
                                                            <HStack
                                                                gap={2}
                                                                flexWrap="wrap"
                                                            >
                                                                {employee.isStartingToday && (
                                                                    <Badge
                                                                        colorScheme="green"
                                                                        size="sm"
                                                                    >
                                                                        מתחיל
                                                                        היום
                                                                    </Badge>
                                                                )}
                                                                {employee.isEndingToday && (
                                                                    <Badge
                                                                        colorScheme="orange"
                                                                        size="sm"
                                                                    >
                                                                        מסיים
                                                                        היום
                                                                    </Badge>
                                                                )}
                                                            </HStack>
                                                        </VStack>
                                                    </HStack>

                                                    <Badge
                                                        colorScheme={
                                                            currentAttendance
                                                                ? 'green'
                                                                : 'gray'
                                                        }
                                                        size="md"
                                                    >
                                                        {currentAttendance
                                                            ? 'נוכח'
                                                            : 'לא הגיע'}
                                                    </Badge>
                                                </Flex>
                                            </Box>
                                        )
                                    })}
                                </VStack>
                            )}
                        </Box>
                    </VStack>
                </DrawerBody>

                <DrawerFooter borderTopWidth="1px" flexShrink={0}>
                    <HStack gap={3} w="full" justify="space-between">
                        <Text fontSize="sm" color="muted">
                            {hasManagerReported
                                ? 'דיווח נשלח למנהל'
                                : 'לא דווח למנהל'}
                        </Text>
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
                                    ? 'מדווח למנהל...'
                                    : hasManagerReported
                                      ? 'דווח למנהל'
                                      : 'דווח למנהל'}
                            </Button>
                        </HStack>
                    </HStack>
                </DrawerFooter>
            </DrawerContent>
        </DrawerRoot>
    )
}
