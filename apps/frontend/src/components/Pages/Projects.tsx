import { useState } from 'react'
import {
    Box,
    Flex,
    Heading,
    Icon,
    Text,
    VStack,
    HStack,
    Stack,
    SimpleGrid,
    Input,
    Card,
    Button,
} from '@chakra-ui/react'

import {
    FaSearch as Search,
    FaPlus as Plus,
    FaFolder as Folder,
    FaFolderOpen as FolderOpen,
    FaPause as Pause,
} from 'react-icons/fa'
import { LuFolderCheck } from 'react-icons/lu'

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
            <Flex justify="space-between" align="center">
                <Box>
                    <Heading size="lg">Projects</Heading>
                    <Text color="gray.500">
                        Track and manage all your team projects.
                    </Text>
                </Box>
                <Button>
                    <Plus />
                    New Project
                </Button>
            </Flex>

            <SimpleGrid columns={{ base: 2, md: 4 }} gap={4}>
                <ProjectStat
                    icon={<Folder />}
                    label="Total Projects"
                    value={totalProjects}
                />
                <ProjectStat
                    icon={<FolderOpen />}
                    label="Active"
                    value={activeProjects}
                />
                <ProjectStat
                    icon={<Pause />}
                    label="Paused"
                    value={pausedProjects}
                />
                <ProjectStat
                    icon={<LuFolderCheck />}
                    label="Completed"
                    value={doneProjects}
                />
            </SimpleGrid>

            <Stack
                direction={{ base: 'column', sm: 'row' }}
                gap={4}
                align="center"
                justify="space-between"
            >
                <Box position="relative" flex={1}>
                    <Icon
                        as={Search}
                        position="absolute"
                        left={3}
                        top={3}
                        color="gray.400"
                    />
                    <Input
                        placeholder="Search projects by name..."
                        pl={10}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </Box>
                {/* <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger width="32">
                        <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                       <SelectItem value="all">All Status</SelectItem>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="paused">Paused</SelectItem>
                        <SelectItem value="done">Done</SelectItem>
                        <SelectItem value="inactive">Inactive</SelectItem> 
                    </SelectContent>
                </Select> */}
            </Stack>

            <Text fontSize="sm" color="gray.500">
                Showing {filteredProjects.length} of {totalProjects} projects
            </Text>

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

function ProjectStat({
    icon,
    label,
    value,
}: {
    icon: React.ReactNode
    label: string
    value: number
}) {
    return (
        <Card.Root>
            <Card.Body>
                <HStack gap={2} align="center">
                    <Box
                        w={8}
                        h={8}
                        bg="gray.100"
                        borderRadius="lg"
                        display="flex"
                        alignItems="center"
                        justifyContent="center"
                    >
                        {icon}
                    </Box>
                    <Box>
                        <Text fontSize="sm" color="gray.500">
                            {label}
                        </Text>
                        <Text fontWeight="semibold">{value}</Text>
                    </Box>
                </HStack>
            </Card.Body>
        </Card.Root>
    )
}
