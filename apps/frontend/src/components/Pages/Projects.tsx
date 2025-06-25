import { useState } from 'react'
import { Box, VStack, SimpleGrid, Card, Text } from '@chakra-ui/react'

import {
    FaPlus as Plus,
    FaFolder as Folder,
    FaFolderOpen as FolderOpen,
    FaPause as Pause,
} from 'react-icons/fa'
import { LuFolderCheck } from 'react-icons/lu'
import { PageHeader } from '../common/PageHeader'
import { MetricCard } from '../common/MetricCard'
import { SearchAndFilters } from '../common/SearchAndFilters'

interface Project {
    id: number
    name: string
    daysAllocated: number
    futureDaysAllocated: number
    peopleAssigned: number
    startDate: string
    status: 'Active' | 'Paused' | 'Done' | 'Inactive'
}

export function Projects() {
    const [searchTerm, setSearchTerm] = useState('')
    const [statusFilter] = useState<string>('all')

    const [projects] = useState<Project[]>([
        /* same mock data */
    ])

    const filteredProjects = projects.filter((project) => {
        const matchesSearch =
            searchTerm === '' ||
            project.name.toLowerCase().includes(searchTerm.toLowerCase())
        const matchesStatus =
            statusFilter === 'all' ||
            project.status.toLowerCase() === statusFilter.toLowerCase()
        return matchesSearch && matchesStatus
    })

    const totalProjects = projects.length
    const activeProjects = projects.filter((p) => p.status === 'Active').length
    const pausedProjects = projects.filter((p) => p.status === 'Paused').length
    const doneProjects = projects.filter((p) => p.status === 'Done').length

    return (
        <VStack gap={6} align="stretch" p={6}>
            <PageHeader
                title="Projects"
                description="Track and manage all your team projects."
                action={{
                    label: 'New Project',
                    icon: <Plus />,
                    onClick: () => {},
                }}
            />

            <SimpleGrid columns={{ base: 2, md: 4 }} gap={4}>
                <MetricCard
                    icon={Folder}
                    label="Total Projects"
                    value={totalProjects}
                    color="blue.500"
                />
                <MetricCard
                    icon={FolderOpen}
                    label="Active"
                    value={activeProjects}
                    color="green.500"
                />
                <MetricCard
                    icon={Pause}
                    label="Paused"
                    value={pausedProjects}
                    color="yellow.500"
                />
                <MetricCard
                    icon={LuFolderCheck}
                    label="Completed"
                    value={doneProjects}
                    color="gray.500"
                />
            </SimpleGrid>

            <SearchAndFilters
                searchTerm={searchTerm}
                onSearchChange={setSearchTerm}
            />

            <Box>
                <Text fontSize="sm" color="gray.500">
                    Showing {filteredProjects.length} of {totalProjects}{' '}
                    projects
                </Text>
            </Box>

            <Card.Root>
                <Card.Header>
                    <Card.Title>Project Directory</Card.Title>
                    <Card.Description>
                        Complete list of all projects and their details
                    </Card.Description>
                </Card.Header>
                <Card.Body>
                    <Box borderWidth={1} borderRadius="md" overflowX="auto">
                        {/* <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Name</TableHead>
                                    <TableHead>Days Allocated</TableHead>
                                    <TableHead>Future Days</TableHead>
                                    <TableHead>People Assigned</TableHead>
                                    <TableHead>Start Date</TableHead>
                                    <TableHead>Status</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredProjects.length === 0 ? (
                                    <TableRow>
                                        <TableCell
                                            colSpan={6}
                                            textAlign="center"
                                            py={8}
                                            color="gray.500"
                                        >
                                            No projects found matching your
                                            criteria
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    filteredProjects.map((project) => (
                                        <TableRow
                                            key={project.id}
                                            _hover={{ bg: 'gray.50' }}
                                        >
                                            <TableCell fontWeight="medium">
                                                {project.name}
                                            </TableCell>
                                            <TableCell>
                                                {project.daysAllocated}
                                            </TableCell>
                                            <TableCell>
                                                {project.futureDaysAllocated}
                                            </TableCell>
                                            <TableCell>
                                                {project.peopleAssigned}
                                            </TableCell>
                                            <TableCell color="gray.500">
                                                {formatDate(project.startDate)}
                                            </TableCell>
                                            <TableCell>
                                                <Badge
                                                    variant={
                                                        project.status ===
                                                        'Active'
                                                            ? 'solid'
                                                            : project.status ===
                                                                'Done'
                                                              ? 'subtle'
                                                              : project.status ===
                                                                  'Paused'
                                                                ? 'outline'
                                                                : 'plain'
                                                    }
                                                >
                                                    {project.status}
                                                </Badge>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table> */}
                    </Box>
                </Card.Body>
            </Card.Root>
        </VStack>
    )
}
