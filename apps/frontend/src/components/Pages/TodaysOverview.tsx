import { useState } from 'react'
import {
    Box,
    Flex,
    Text,
    Badge,
    Icon,
    VStack,
    HStack,
    Button,
} from '@chakra-ui/react'
import {
    FiUsers,
    FiCheckCircle,
    FiMapPin,
    FiAlertCircle,
    FiDownload,
} from 'react-icons/fi'

export function TodaysOverview() {
    // const toast = useToastStyles()

    const [activePeople, setActivePeople] = useState([
        {
            id: 1,
            name: 'Sarah Johnson',
            role: 'Senior Developer',
            status: 'expected',
        },
        {
            id: 2,
            name: 'Mike Chen',
            role: 'Product Manager',
            status: 'confirmed',
        },
        {
            id: 3,
            name: 'Lisa Rodriguez',
            role: 'UX Designer',
            status: 'expected',
        },
        {
            id: 4,
            name: 'David Kim',
            role: 'Marketing Specialist',
            status: 'expected',
        },
        {
            id: 5,
            name: 'Emma Wilson',
            role: 'HR Coordinator',
            status: 'confirmed',
        },
    ])

    const [openTasks, setOpenTasks] = useState([
        {
            id: 1,
            title: 'Review Q2 Performance Reports',
            assignee: 'Sarah Johnson',
            dueDate: '2025-06-23',
            priority: 'high',
            status: 'pending',
        },
        {
            id: 2,
            title: 'Onboard New Marketing Intern',
            assignee: 'David Kim',
            dueDate: '2025-06-21',
            priority: 'medium',
            status: 'pending',
        },
        {
            id: 3,
            title: 'Update Employee Handbook',
            assignee: 'Emma Wilson',
            dueDate: '2025-06-25',
            priority: 'low',
            status: 'pending',
        },
        {
            id: 4,
            title: 'Conduct Team Building Workshop',
            assignee: 'Lisa Rodriguez',
            dueDate: '2025-06-24',
            priority: 'medium',
            status: 'pending',
        },
        {
            id: 5,
            title: 'Prepare Monthly Budget Report',
            assignee: 'Mike Chen',
            dueDate: '2025-06-22',
            priority: 'high',
            status: 'pending',
        },
    ])

    const confirmArrival = (id: number) => {
        setActivePeople((prev) =>
            prev.map((p) => (p.id === id ? { ...p, status: 'confirmed' } : p))
        )
    }

    const markTaskComplete = (id: number) => {
        setOpenTasks((prev) =>
            prev.map((t) => (t.id === id ? { ...t, status: 'completed' } : t))
        )
    }

    const getPriorityColor = (priority: string) => {
        switch (priority) {
            case 'high':
                return 'red'
            case 'medium':
                return 'yellow'
            case 'low':
                return 'gray'
            default:
                return 'gray'
        }
    }

    const getDaysUntilDue = (dueDate: string) => {
        const today = new Date()
        const due = new Date(dueDate)
        return Math.ceil(
            (due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
        )
    }

    const exportCSV = (data: string[], filename: string) => {
        const blob = new Blob([data.join('\n')], { type: 'text/csv' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = filename
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)

        // toast({
        //     title: 'Export Successful',
        //     description: `${filename} has been downloaded.`,
        //     status: 'success',
        //     duration: 3000,
        //     isClosable: true,
        // })
    }

    const exportActivePeople = () => {
        const rows = [
            'Name,Role,Status',
            ...activePeople.map((p) => `${p.name},${p.role},${p.status}`),
        ]
        exportCSV(
            rows,
            `active-people-${new Date().toISOString().split('T')[0]}.csv`
        )
    }

    const exportOpenTasks = () => {
        const rows = [
            'Title,Assignee,Due Date,Priority,Status',
            ...openTasks.map(
                (t) =>
                    `"${t.title}",${t.assignee},${t.dueDate},${t.priority},${t.status}`
            ),
        ]
        exportCSV(
            rows,
            `open-tasks-${new Date().toISOString().split('T')[0]}.csv`
        )
    }

    const confirmedCount = activePeople.filter(
        (p) => p.status === 'confirmed'
    ).length
    const expectedCount = activePeople.filter(
        (p) => p.status === 'expected'
    ).length
    const pendingTasks = openTasks.filter((t) => t.status === 'pending')
    const dueSoonCount = pendingTasks.filter(
        (t) => getDaysUntilDue(t.dueDate) <= 1
    ).length

    return (
        <Box p={6}>
            <Text fontSize="2xl" fontWeight="bold">
                Dashboard
            </Text>
            <Text mb={6} color="gray.500">
                Today’s overview -{' '}
                {new Date().toLocaleDateString('en-US', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                })}
            </Text>

            <Flex direction={{ base: 'column', lg: 'row' }} gap={6}>
                {/* Active People */}
                <Box flex="1" p={5} borderWidth="1px" rounded="md" bg="white">
                    <Flex justify="space-between" mb={4}>
                        <HStack>
                            <Box p={2} bg="blue.100" rounded="xl">
                                <Icon
                                    as={FiUsers}
                                    color="blue.600"
                                    boxSize={5}
                                />
                            </Box>
                            <Box>
                                <Text fontSize="xl" fontWeight="bold">
                                    {activePeople.length}
                                </Text>
                                <Text fontSize="sm" color="gray.500">
                                    Active People Today
                                </Text>
                            </Box>
                        </HStack>
                        <HStack>
                            <Badge colorScheme="green">
                                {confirmedCount} Confirmed
                            </Badge>
                            <Button
                                size="sm"
                                variant="outline"
                                onClick={exportActivePeople}
                            >
                                <FiDownload style={{ marginRight: 4 }} />
                                Export
                            </Button>
                        </HStack>
                    </Flex>
                    <VStack gap={3} align="stretch">
                        {activePeople.map((person) => (
                            <Flex
                                key={person.id}
                                justify="space-between"
                                p={3}
                                bg="gray.50"
                                rounded="md"
                            >
                                <Box>
                                    <Text fontWeight="medium">
                                        {person.name}
                                    </Text>
                                    <Text fontSize="sm" color="gray.500">
                                        {person.role}
                                    </Text>
                                </Box>
                                {person.status === 'confirmed' ? (
                                    <Badge
                                        colorScheme="green"
                                        display="flex"
                                        alignItems="center"
                                    >
                                        <FiCheckCircle
                                            style={{ marginRight: 4 }}
                                        />
                                        Confirmed
                                    </Badge>
                                ) : (
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() =>
                                            confirmArrival(person.id)
                                        }
                                    >
                                        <FiCheckCircle
                                            style={{ marginRight: 4 }}
                                        />
                                        Confirm Arrival
                                    </Button>
                                )}
                            </Flex>
                        ))}
                    </VStack>
                </Box>

                {/* Open Tasks */}
                <Box flex="1" p={5} borderWidth="1px" rounded="md" bg="white">
                    <Flex justify="space-between" mb={4}>
                        <HStack>
                            <Box p={2} bg="orange.100" rounded="xl">
                                <Icon
                                    as={FiAlertCircle}
                                    color="orange.600"
                                    boxSize={5}
                                />
                            </Box>
                            <Box>
                                <Text fontSize="xl" fontWeight="bold">
                                    {pendingTasks.length}
                                </Text>
                                <Text fontSize="sm" color="gray.500">
                                    Open Tasks
                                </Text>
                            </Box>
                        </HStack>
                        <HStack>
                            <Badge colorScheme="red">
                                {dueSoonCount} Due Soon
                            </Badge>
                            <Button
                                size="sm"
                                variant="outline"
                                onClick={exportOpenTasks}
                            >
                                <FiDownload style={{ marginRight: 4 }} />
                                Export
                            </Button>
                        </HStack>
                    </Flex>
                    <VStack gap={3} align="stretch">
                        {pendingTasks.map((task) => {
                            const daysLeft = getDaysUntilDue(task.dueDate)
                            return (
                                <Box
                                    key={task.id}
                                    p={3}
                                    bg="gray.50"
                                    rounded="md"
                                >
                                    <Flex justify="space-between">
                                        <Box>
                                            <Text fontWeight="medium">
                                                {task.title}
                                            </Text>
                                            <HStack gap={2} mt={1}>
                                                <Badge
                                                    colorScheme={getPriorityColor(
                                                        task.priority
                                                    )}
                                                >
                                                    {task.priority}
                                                </Badge>
                                                <Text
                                                    fontSize="sm"
                                                    color="gray.500"
                                                >
                                                    {new Date(
                                                        task.dueDate
                                                    ).toLocaleDateString()}
                                                </Text>
                                                {daysLeft <= 1 && (
                                                    <Badge colorScheme="red">
                                                        {daysLeft === 0
                                                            ? 'Due Today'
                                                            : 'Due Tomorrow'}
                                                    </Badge>
                                                )}
                                            </HStack>
                                            <HStack
                                                gap={1}
                                                mt={1}
                                                fontSize="sm"
                                                color="gray.500"
                                            >
                                                <Icon
                                                    as={FiMapPin}
                                                    boxSize={4}
                                                />
                                                <Text>
                                                    Assigned to {task.assignee}
                                                </Text>
                                            </HStack>
                                        </Box>
                                        <Button
                                            size="sm"
                                            onClick={() =>
                                                markTaskComplete(task.id)
                                            }
                                        >
                                            <FiCheckCircle
                                                style={{ marginRight: 4 }}
                                            />
                                            Complete
                                        </Button>
                                    </Flex>
                                </Box>
                            )
                        })}
                    </VStack>
                </Box>
            </Flex>
        </Box>
    )
}
