import { Box, Grid, Flex, Text, Stack, Card } from '@chakra-ui/react'

import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    LineChart,
    Line,
    Legend,
} from 'recharts'

import { useColorModeValue } from '../ui/color-mode'
import { FiCalendar, FiClock, FiUsers } from 'react-icons/fi'
import { HiFolderOpen } from 'react-icons/hi'

export function Dashboard() {
    const activeDaysData = [
        {
            week: 'Week 1',
            'Project Alpha': 25,
            'Project Beta': 18,
            'Project Gamma': 12,
            'Project Delta': 8,
        },
        {
            week: 'Week 2',
            'Project Alpha': 28,
            'Project Beta': 22,
            'Project Gamma': 15,
            'Project Delta': 10,
        },
        {
            week: 'Week 3',
            'Project Alpha': 32,
            'Project Beta': 19,
            'Project Gamma': 18,
            'Project Delta': 14,
        },
        {
            week: 'Week 4',
            'Project Alpha': 30,
            'Project Beta': 24,
            'Project Gamma': 20,
            'Project Delta': 16,
        },
    ]

    const daysPerProjectData = [
        { project: 'Project Alpha', days: 115, color: '#8884d8' },
        { project: 'Project Beta', days: 83, color: '#82ca9d' },
        { project: 'Project Gamma', days: 65, color: '#ffc658' },
        { project: 'Project Delta', days: 48, color: '#ff7c7c' },
        { project: 'Project Echo', days: 36, color: '#8dd1e1' },
        { project: 'Project Foxtrot', days: 29, color: '#d084d0' },
    ]

    const fundedProjectsData = [
        { project: 'Project Alpha', days: 45, company: 'TechCorp Inc.' },
        { project: 'Project Beta', days: 32, company: 'Innovation Labs' },
        { project: 'Project Gamma', days: 58, company: 'Digital Solutions' },
        { project: 'Project Delta', days: 23, company: 'Future Systems' },
        { project: 'Project Echo', days: 35, company: 'Smart Ventures' },
        { project: 'Project Foxtrot', days: 28, company: 'NextGen Tech' },
    ]

    const totalDays = daysPerProjectData.reduce((sum, p) => sum + p.days, 0)
    const activeProjects = 12
    const activeEmployees = 58

    const projectColors = {
        'Project Alpha': '#8884d8',
        'Project Beta': '#82ca9d',
        'Project Gamma': '#ffc658',
        'Project Delta': '#ff7c7c',
    }

    const mutedBg = useColorModeValue('gray.50', 'gray.700')

    return (
        <Box p={6}>
            <Stack gap={6}>
                <Box>
                    <Text fontSize="3xl" fontWeight="bold">
                        Dashboard
                    </Text>
                    <Text color="gray.500">
                        Analytics and insights for project management and
                        resource allocation.
                    </Text>
                </Box>

                {/* Key Metrics */}
                <Grid
                    templateColumns={{ base: '1fr', md: 'repeat(3, 1fr)' }}
                    gap={4}
                >
                    <Card.Root>
                        <Card.Header pb={3}>
                            <Flex justify="space-between" align="center">
                                <Card.Title fontSize="sm">
                                    Total Days Allocated
                                </Card.Title>
                                <FiClock className="w-4 h-4 text-blue-600" />
                            </Flex>
                        </Card.Header>
                        <Card.Body>
                            <Text
                                fontSize="3xl"
                                fontWeight="bold"
                                color="blue.600"
                            >
                                {totalDays.toLocaleString()}
                            </Text>
                            <Text fontSize="sm" color="gray.500" mt={1}>
                                Across all active projects
                            </Text>
                        </Card.Body>
                    </Card.Root>

                    <Card.Root>
                        <Card.Header pb={3}>
                            <Flex justify="space-between" align="center">
                                <Card.Title fontSize="sm">
                                    Active Projects
                                </Card.Title>
                                <HiFolderOpen className="w-4 h-4 text-green-600" />
                            </Flex>
                        </Card.Header>
                        <Card.Body>
                            <Text
                                fontSize="3xl"
                                fontWeight="bold"
                                color="green.600"
                            >
                                {activeProjects}
                            </Text>
                            <Text fontSize="sm" color="gray.500" mt={1}>
                                Currently in progress
                            </Text>
                        </Card.Body>
                    </Card.Root>

                    <Card.Root>
                        <Card.Header pb={3}>
                            <Flex justify="space-between" align="center">
                                <Card.Title fontSize="sm">
                                    Active Employees
                                </Card.Title>
                                <FiUsers className="w-4 h-4 text-purple-600" />
                            </Flex>
                        </Card.Header>
                        <Card.Body>
                            <Text
                                fontSize="3xl"
                                fontWeight="bold"
                                color="purple.600"
                            >
                                {activeEmployees}
                            </Text>
                            <Text fontSize="sm" color="gray.500" mt={1}>
                                Working on projects
                            </Text>
                        </Card.Body>
                    </Card.Root>
                </Grid>

                {/* Charts Row */}
                <Grid
                    templateColumns={{ base: '1fr', lg: 'repeat(2, 1fr)' }}
                    gap={6}
                >
                    <Card.Root>
                        <Card.Header>
                            <Card.Title
                                display="flex"
                                alignItems="center"
                                gap={2}
                            >
                                <FiCalendar className="w-5 h-5" />
                                Active Days Across Time
                            </Card.Title>
                            <Card.Description>
                                Weekly active days by project over the past
                                month
                            </Card.Description>
                        </Card.Header>
                        <Card.Body>
                            <ResponsiveContainer width="100%" height={350}>
                                <LineChart data={activeDaysData}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="week" />
                                    <YAxis
                                        label={{
                                            value: 'Active Days',
                                            angle: -90,
                                            position: 'insideLeft',
                                        }}
                                    />
                                    <Tooltip />
                                    <Legend />
                                    {Object.entries(projectColors).map(
                                        ([key, color]) => (
                                            <Line
                                                key={key}
                                                type="monotone"
                                                dataKey={key}
                                                stroke={color}
                                                strokeWidth={2}
                                                dot={{ r: 4 }}
                                            />
                                        )
                                    )}
                                </LineChart>
                            </ResponsiveContainer>
                        </Card.Body>
                    </Card.Root>

                    <Card.Root>
                        <Card.Header>
                            <Card.Title
                                display="flex"
                                alignItems="center"
                                gap={2}
                            >
                                <HiFolderOpen className="w-5 h-5" />
                                Days Per Project
                            </Card.Title>
                            <Card.Description>
                                Total allocated days across all projects
                            </Card.Description>
                        </Card.Header>
                        <Card.Body>
                            <ResponsiveContainer width="100%" height={350}>
                                <BarChart data={daysPerProjectData}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis
                                        dataKey="project"
                                        angle={-45}
                                        textAnchor="end"
                                        height={80}
                                    />
                                    <YAxis
                                        label={{
                                            value: 'Days',
                                            angle: -90,
                                            position: 'insideLeft',
                                        }}
                                    />
                                    <Tooltip />
                                    <Bar dataKey="days" radius={[4, 4, 0, 0]}>
                                        {daysPerProjectData.map((entry) => (
                                            <Bar
                                                key={entry.project}
                                                dataKey="days"
                                                fill={entry.color}
                                            />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </Card.Body>
                    </Card.Root>
                </Grid>

                {/* Funded by Other Companies */}
                <Card.Root>
                    <Card.Header>
                        <Card.Title display="flex" alignItems="center" gap={2}>
                            <HiFolderOpen className="w-5 h-5" />
                            Funded by Other Companies
                        </Card.Title>
                        <Card.Description>
                            Projects receiving external funding and support
                        </Card.Description>
                    </Card.Header>
                    <Card.Body>
                        <Stack gap={4}>
                            {fundedProjectsData.map((item, index) => (
                                <Flex
                                    key={index}
                                    justify="space-between"
                                    p={4}
                                    borderWidth="1px"
                                    borderRadius="lg"
                                    bg={mutedBg}
                                >
                                    <Box>
                                        <Text fontWeight="medium">
                                            {item.project}
                                        </Text>
                                        <Text fontSize="sm" color="gray.500">
                                            Funded by {item.company}
                                        </Text>
                                    </Box>
                                    <Box textAlign="right">
                                        <Text
                                            fontSize="xl"
                                            fontWeight="bold"
                                            color="green.600"
                                        >
                                            {item.days}
                                        </Text>
                                        <Text fontSize="sm" color="gray.500">
                                            days funded
                                        </Text>
                                    </Box>
                                </Flex>
                            ))}

                            <Flex
                                justify="space-between"
                                p={4}
                                borderWidth="2px"
                                borderRadius="lg"
                                borderColor="blue.200"
                                bg="blue.50"
                            >
                                <Box>
                                    <Text fontWeight="semibold">
                                        Funding Summary
                                    </Text>
                                    <Text fontSize="sm" color="gray.500">
                                        {fundedProjectsData.length} funded
                                        projects • {fundedProjectsData.length}{' '}
                                        partner companies
                                    </Text>
                                </Box>
                                <Box textAlign="right">
                                    <Text
                                        fontSize="xl"
                                        fontWeight="bold"
                                        color="blue.600"
                                    >
                                        {fundedProjectsData.reduce(
                                            (sum, p) => sum + p.days,
                                            0
                                        )}
                                    </Text>
                                    <Text fontSize="sm" color="gray.500">
                                        total days funded
                                    </Text>
                                </Box>
                            </Flex>
                        </Stack>
                    </Card.Body>
                </Card.Root>
            </Stack>
        </Box>
    )
}
