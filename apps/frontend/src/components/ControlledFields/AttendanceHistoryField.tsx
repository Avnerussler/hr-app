import {
    Box,
    VStack,
    HStack,
    Text,
    Badge,
    Flex,
    Spinner,
} from '@chakra-ui/react'
import { format } from 'date-fns'
import { he } from 'date-fns/locale'
import { FaCheckCircle, FaTimesCircle, FaCalendarAlt } from 'react-icons/fa'
import { useEmployeeAttendanceHistoryQuery } from '@/hooks/queries'
import { useParams } from 'react-router-dom'

interface AttendanceHistoryFieldProps {
    label?: string
    maxRecords?: number
}

export function AttendanceHistoryField({
    label = 'היסטוריית נוכחות',
    maxRecords = 20,
}: AttendanceHistoryFieldProps) {
    // Use the attendance history query hook
    const { itemId } = useParams()
    const {
        data: attendanceHistory,
        isLoading,
        error,
    } = useEmployeeAttendanceHistoryQuery(itemId || '', maxRecords)

    const formatDateDisplay = (dateStr: string) => {
        try {
            return format(new Date(dateStr), 'dd/MM/yyyy', { locale: he })
        } catch {
            return dateStr
        }
    }

    const getAttendanceColor = (hasAttended: boolean, isReported: boolean) => {
        if (!isReported) return 'gray'
        return hasAttended ? 'green' : 'red'
    }

    const getAttendanceIcon = (hasAttended: boolean, isReported: boolean) => {
        if (!isReported) return <FaCalendarAlt size={12} />
        return hasAttended ? (
            <FaCheckCircle size={12} />
        ) : (
            <FaTimesCircle size={12} />
        )
    }

    if (isLoading) {
        return (
            <Box>
                <Text fontSize="sm" fontWeight="medium" mb={2}>
                    {label}
                </Text>
                <Flex
                    align="center"
                    justify="center"
                    p={4}
                    borderRadius="md"
                    bg="gray.50"
                >
                    <Spinner size="sm" />
                    <Text ml={2} fontSize="sm" color="gray.500">
                        טוען...
                    </Text>
                </Flex>
            </Box>
        )
    }

    if (error) {
        return (
            <Box>
                <Text fontSize="sm" fontWeight="medium" mb={2}>
                    {label}
                </Text>
                <Box
                    p={3}
                    borderRadius="md"
                    bg="red.50"
                    borderColor="red.200"
                    borderWidth="1px"
                >
                    <Text fontSize="sm" color="red.600">
                        שגיאה בטעינת נתונים
                    </Text>
                </Box>
            </Box>
        )
    }

    if (!attendanceHistory || attendanceHistory.records.length === 0) {
        return (
            <Box>
                <Text fontSize="sm" fontWeight="medium" mb={2}>
                    {label}
                </Text>
                <Box
                    p={3}
                    borderRadius="md"
                    bg="gray.50"
                    borderColor="gray.200"
                    borderWidth="1px"
                >
                    <Text fontSize="sm" color="gray.500">
                        אין נתוני נוכחות
                    </Text>
                </Box>
            </Box>
        )
    }

    return (
        <Box>
            <Text fontSize="sm" fontWeight="medium" mb={2}>
                {label}
            </Text>

            {/* Summary */}
            <Box
                mb={3}
                p={2}
                borderRadius="md"
                bg="blue.50"
                borderWidth="1px"
                borderColor="blue.200"
            >
                <HStack justify="space-between" fontSize="sm">
                    <Text>
                        סה״כ:{' '}
                        <Text as="span" fontWeight="bold">
                            {attendanceHistory.totalDays}
                        </Text>
                    </Text>
                    <Text>
                        נוכח:{' '}
                        <Text as="span" fontWeight="bold" color="green.600">
                            {attendanceHistory.attendedDays}
                        </Text>
                    </Text>
                    <Text>
                        אחוז:{' '}
                        <Text
                            as="span"
                            fontWeight="bold"
                            color={
                                attendanceHistory.attendanceRate >= 90
                                    ? 'green.600'
                                    : attendanceHistory.attendanceRate >= 70
                                      ? 'orange.500'
                                      : 'red.500'
                            }
                        >
                            {attendanceHistory.attendanceRate}%
                        </Text>
                    </Text>
                </HStack>
            </Box>

            {/* Attendance Records - Read Only */}
            <VStack
                gap={1}
                align="stretch"
                maxH="200px"
                overflowY="auto"
                borderRadius="md"
                borderWidth="1px"
                borderColor="gray.200"
                p={2}
                bg="gray.50"
            >
                {attendanceHistory.records.map((record) => (
                    <HStack
                        key={record.date}
                        justify="space-between"
                        p={2}
                        borderRadius="sm"
                        bg="white"
                        fontSize="sm"
                    >
                        <HStack gap={2}>
                            {getAttendanceIcon(
                                record.hasAttended,
                                record.isReported
                            )}
                            <Text>{formatDateDisplay(record.date)}</Text>
                        </HStack>
                        <Badge
                            size="sm"
                            colorScheme={getAttendanceColor(
                                record.hasAttended,
                                record.isReported
                            )}
                        >
                            {!record.isReported
                                ? 'לא דווח'
                                : record.hasAttended
                                  ? 'נוכח'
                                  : 'לא הגיע'}
                        </Badge>
                    </HStack>
                ))}
            </VStack>

            {attendanceHistory.records.length >= maxRecords && (
                <Text mt={2} fontSize="xs" color="gray.500" textAlign="center">
                    מוצגים {maxRecords} רשומות אחרונות
                </Text>
            )}
        </Box>
    )
}
