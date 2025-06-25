import { Box, Grid, Stack } from '@chakra-ui/react'

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

import { FiCalendar, FiClock, FiUsers } from 'react-icons/fi'
import { HiFolderOpen } from 'react-icons/hi'
import { PageHeader } from '../common/PageHeader'
import { MetricCard } from '../common/MetricCard'
import { ChartCard } from '../common/ChartCard'
import { SummaryCard } from '../common/SummaryCard'

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

    return (
        <Box p={6}>
            <Stack gap={6}>
                <PageHeader
                    title="Dashboard"
                    description="Analytics and insights for project management and resource allocation."
                />

                {/* Key Metrics */}
                <Grid
                    templateColumns={{ base: '1fr', md: 'repeat(3, 1fr)' }}
                    gap={4}
                >
                    <MetricCard
                        icon={FiClock}
                        label="Total Days Allocated"
                        value={totalDays}
                        color="blue.600"
                    />
                    <MetricCard
                        icon={HiFolderOpen}
                        label="Active Projects"
                        value={activeProjects}
                        color="green.600"
                    />
                    <MetricCard
                        icon={FiUsers}
                        label="Active Employees"
                        value={activeEmployees}
                        color="purple.600"
                    />
                </Grid>

                {/* Charts Row */}
                <Grid
                    templateColumns={{ base: '1fr', lg: 'repeat(2, 1fr)' }}
                    gap={6}
                >
                    <ChartCard
                        title="Active Days Across Time"
                        description="Weekly active days by project over the past month"
                        icon={<FiCalendar className="w-5 h-5" />}
                    >
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
                    </ChartCard>

                    <ChartCard
                        title="Days Per Project"
                        description="Total allocated days across all projects"
                        icon={<HiFolderOpen className="w-5 h-5" />}
                    >
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
                    </ChartCard>
                </Grid>

                <SummaryCard
                    title="Funded by Other Companies"
                    description="Projects receiving external funding and support"
                    icon={<HiFolderOpen className="w-5 h-5" />}
                    items={fundedProjectsData.map((item, index) => ({
                        id: index,
                        title: item.project,
                        subtitle: `Funded by ${item.company}`,
                        value: item.days,
                        valueLabel: 'days funded',
                    }))}
                    summaryItem={{
                        title: 'Funding Summary',
                        subtitle: `${fundedProjectsData.length} funded projects • ${fundedProjectsData.length} partner companies`,
                        value: fundedProjectsData.reduce(
                            (sum, p) => sum + p.days,
                            0
                        ),
                        valueLabel: 'total days funded',
                    }}
                />
            </Stack>
        </Box>
    )
}
