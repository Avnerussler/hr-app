import { Box, HStack, VStack, Text, Badge, Flex } from '@chakra-ui/react'
import { Checkbox } from '../ui/checkbox'
import { UnapprovedReserveDaysWarning } from '../common/UnapprovedReserveDaysWarning'
import {
    FaIdBadge,
    FaUsers,
    FaBuilding,
    FaFileAlt,
    FaPhone,
} from 'react-icons/fa'
import { format } from 'date-fns'
import type { EmployeeAttendance } from '@/hooks/queries'

interface EmployeeAttendanceCardProps {
    employee: EmployeeAttendance
    currentAttendance: boolean
    onAttendanceToggle: (employeeId: string, attended: boolean) => void
}

export function EmployeeAttendanceCard({
    employee,
    currentAttendance,
    onAttendanceToggle,
}: EmployeeAttendanceCardProps) {
    const isExternalFunding = employee.fundingSource === 'external'

    return (
        <Box
            p={3}
            borderRadius="lg"
            borderWidth="1px"
            borderColor={isExternalFunding ? 'cyan.400' : 'gray.200'}
            borderLeftWidth={isExternalFunding ? '4px' : '1px'}
            borderLeftColor={isExternalFunding ? 'cyan.500' : 'gray.200'}
            bg={currentAttendance ? 'green.50' : 'white'}
            transition="all 0.2s"
            _hover={{
                borderColor: isExternalFunding ? 'cyan.500' : 'gray.300',
                shadow: 'sm',
            }}
        >
            <Flex justify="space-between" align="center" gap={3}>
                <HStack gap={3} align="center" flex={1}>
                    <Checkbox
                        size="md"
                        checked={currentAttendance}
                        onCheckedChange={(details) =>
                            onAttendanceToggle(
                                employee._id,
                                Boolean(details.checked)
                            )
                        }
                    />
                    <VStack align="start" gap={1} flex={1}>
                        {/* Name and Badges Row */}
                        <HStack gap={2} flexWrap="wrap" align="center">
                            <Text fontWeight="semibold" fontSize="md">
                                {employee.name}{' '}
                                {employee.lastName && employee.lastName}
                            </Text>
                            {isExternalFunding && (
                                <Badge
                                    colorScheme="cyan"
                                    size="sm"
                                    variant="subtle"
                                >
                                    חיצוני
                                </Badge>
                            )}
                            {employee.isStartingToday && (
                                <Badge
                                    colorScheme="green"
                                    size="sm"
                                    variant="subtle"
                                >
                                    מתחיל
                                </Badge>
                            )}
                            {employee.isEndingToday && (
                                <Badge
                                    colorScheme="orange"
                                    size="sm"
                                    variant="subtle"
                                >
                                    מסיים
                                </Badge>
                            )}
                            {employee.requestStatus &&
                                employee.requestStatus !== 'approved' && (
                                    <UnapprovedReserveDaysWarning
                                        employeeName={employee.name}
                                        requestStatus={employee.requestStatus}
                                        iconSize={12}
                                    />
                                )}
                        </HStack>

                        {/* Compact Details Row */}
                        <HStack
                            gap={3}
                            fontSize="xs"
                            color="gray.600"
                            flexWrap="wrap"
                        >
                            {employee.personalNumber && (
                                <HStack gap={1}>
                                    <FaIdBadge size={10} />
                                    <Text>{employee.personalNumber}</Text>
                                </HStack>
                            )}
                            {employee.phone && (
                                <HStack gap={1}>
                                    <FaPhone size={10} />
                                    <Text>{employee.phone}</Text>
                                </HStack>
                            )}
                            {employee.reserveUnit && (
                                <HStack gap={1}>
                                    <FaUsers size={10} />
                                    <Text>{employee.reserveUnit}</Text>
                                </HStack>
                            )}
                            {employee.workPlace && (
                                <HStack gap={1}>
                                    <FaBuilding size={10} />
                                    <Text>{employee.workPlace}</Text>
                                </HStack>
                            )}
                            {employee.orderNumber && (
                                <HStack gap={1}>
                                    <FaFileAlt size={10} />
                                    <Text>{employee.orderNumber}</Text>
                                </HStack>
                            )}
                            {employee.startDate && employee.endDate && (
                                <Text color="purple.600">
                                    {format(
                                        new Date(employee.startDate),
                                        'dd/MM'
                                    )}{' '}
                                    -{' '}
                                    {format(
                                        new Date(employee.endDate),
                                        'dd/MM'
                                    )}
                                </Text>
                            )}
                        </HStack>
                    </VStack>
                </HStack>

                <Badge
                    colorScheme={currentAttendance ? 'green' : 'gray'}
                    size="sm"
                    px={2}
                >
                    {currentAttendance ? 'נוכח' : 'לא הגיע'}
                </Badge>
            </Flex>
        </Box>
    )
}
