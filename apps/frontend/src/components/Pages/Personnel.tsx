import {
    Box,
    Button,
    Flex,
    Grid,
    Heading,
    Icon,
    Input,
    Text,
    Textarea,
    useDisclosure,
    Tabs,
    Badge,
    VStack,
    Table,
    createListCollection,
} from '@chakra-ui/react'

import { FaUsers, FaUserCheck, FaUserTimes, FaPlus } from 'react-icons/fa'
import { useState } from 'react'
import {
    SelectRoot,
    SelectTrigger,
    SelectValueText,
    SelectContent,
    SelectItem,
} from '../ui/select'
import {
    DrawerRoot,
    DrawerContent,
    DrawerHeader,
    DrawerBody,
} from '../ui/drawer'
import { Field } from '../ui/field'

type EmployeeType = 'Consultant' | 'Reserve' | 'All Types'
type Employee = {
    id: string
    firstName: string
    lastName: string
    email: string
    phone: string
    address: string
    role: string
    project: string
    manager: string
    type: EmployeeType
    status: 'Active' | 'Inactive'
    lastActiveTime: string
    nextActiveTime: string
}

const employeeTypeOptions = createListCollection({
    items: [
        { value: 'all', label: 'All Types' },
        { value: 'consultant', label: 'Consultant' },
        { value: 'reserve', label: 'Reserve' },
    ],
})
const employeeStatusOptions = createListCollection({
    items: [
        { value: 'all', label: 'All Status' },
        { value: 'active', label: 'Active' },
        { value: 'inactive', label: 'Inactive' },
    ],
})

const employeesTempData: Employee[] = [
    {
        id: '1',
        firstName: 'Alice',
        lastName: 'Johnson',
        email: 'alice.johnson@example.com',
        phone: '555-123-4567',
        address: '123 Main St, Cityville',
        role: 'Frontend Developer',
        project: 'Website Redesign',
        manager: 'Bob Smith',
        type: 'Consultant',
        status: 'Active',
        lastActiveTime: '2025-06-24T09:00:00',
        nextActiveTime: '2025-06-25T09:00:00',
    },
    {
        id: '2',
        firstName: 'Mark',
        lastName: 'Davis',
        email: 'mark.davis@example.com',
        phone: '555-234-5678',
        address: '456 Oak Ave, Townsville',
        role: 'Backend Developer',
        project: 'API Platform',
        manager: 'Susan Lee',
        type: 'Reserve',
        status: 'Inactive',
        lastActiveTime: '2025-06-20T10:00:00',
        nextActiveTime: '2025-06-26T09:00:00',
    },
    {
        id: '3',
        firstName: 'Lena',
        lastName: 'Wong',
        email: 'lena.wong@example.com',
        phone: '555-345-6789',
        address: '789 Pine St, Tech City',
        role: 'UX Designer',
        project: 'Mobile App',
        manager: 'Carlos Hernandez',
        type: 'Consultant',
        status: 'Active',
        lastActiveTime: '2025-06-23T11:00:00',
        nextActiveTime: '2025-06-25T09:00:00',
    },
    {
        id: '4',
        firstName: 'James',
        lastName: 'Miller',
        email: 'james.miller@example.com',
        phone: '555-456-7890',
        address: '321 Elm Dr, Devtown',
        role: 'Product Manager',
        project: 'AI Integration',
        manager: 'Diana King',
        type: 'Consultant',
        status: 'Active',
        lastActiveTime: '2025-06-24T08:30:00',
        nextActiveTime: '2025-06-25T09:30:00',
    },
    {
        id: '5',
        firstName: 'Eva',
        lastName: 'Nguyen',
        email: 'eva.nguyen@example.com',
        phone: '555-567-8901',
        address: '654 Birch Blvd, UXville',
        role: 'QA Engineer',
        project: 'E2E Testing',
        manager: 'Aaron Blake',
        type: 'Reserve',
        status: 'Inactive',
        lastActiveTime: '2025-06-22T10:15:00',
        nextActiveTime: '2025-06-28T09:45:00',
    },
    {
        id: '6',
        firstName: 'Omar',
        lastName: 'Ali',
        email: 'omar.ali@example.com',
        phone: '555-678-9012',
        address: '987 Spruce Way, Cloudport',
        role: 'Cloud Engineer',
        project: 'Infra as Code',
        manager: 'Laura Scott',
        type: 'Consultant',
        status: 'Active',
        lastActiveTime: '2025-06-24T09:45:00',
        nextActiveTime: '2025-06-25T09:00:00',
    },
    {
        id: '7',
        firstName: 'Nina',
        lastName: 'Petrov',
        email: 'nina.petrov@example.com',
        phone: '555-789-0123',
        address: '852 Cedar Lane, Designton',
        role: 'UI Engineer',
        project: 'Component Library',
        manager: 'Victor Hugo',
        type: 'Consultant',
        status: 'Active',
        lastActiveTime: '2025-06-23T09:00:00',
        nextActiveTime: '2025-06-25T09:00:00',
    },
    {
        id: '8',
        firstName: 'Robert',
        lastName: 'Chen',
        email: 'robert.chen@example.com',
        phone: '555-890-1234',
        address: '753 Aspen Ct, Codeville',
        role: 'Data Analyst',
        project: 'KPI Dashboard',
        manager: 'Sophia Reed',
        type: 'Reserve',
        status: 'Inactive',
        lastActiveTime: '2025-06-21T08:45:00',
        nextActiveTime: '2025-06-29T09:30:00',
    },
    {
        id: '9',
        firstName: 'Samantha',
        lastName: 'Garcia',
        email: 'samantha.garcia@example.com',
        phone: '555-901-2345',
        address: '159 Redwood Cir, Dataville',
        role: 'DevOps Engineer',
        project: 'CI/CD Pipelines',
        manager: 'Tom Rivera',
        type: 'Consultant',
        status: 'Active',
        lastActiveTime: '2025-06-24T09:15:00',
        nextActiveTime: '2025-06-25T09:00:00',
    },
    {
        id: '10',
        firstName: 'Daniel',
        lastName: 'Smith',
        email: 'daniel.smith@example.com',
        phone: '555-012-3456',
        address: '258 Maple Dr, Backendburg',
        role: 'Database Administrator',
        project: 'Data Migration',
        manager: 'Jill Carter',
        type: 'Reserve',
        status: 'Inactive',
        lastActiveTime: '2025-06-20T09:00:00',
        nextActiveTime: '2025-06-27T09:00:00',
    },
]

export default function PersonnelPage() {
    const [searchTerm, setSearchTerm] = useState('')
    const [statusFilter, setStatusFilter] = useState('all')
    const [typeFilter, setTypeFilter] = useState('all')
    const [selectedEmployee, setSelectedEmployee] = useState<Employee>()
    console.log(' typeFilter:', typeFilter)
    const { open, onOpen, onClose } = useDisclosure()

    const [employees] = useState<Employee[]>(employeesTempData)

    const handleOpenDrawer = (emp: Employee) => {
        setSelectedEmployee(emp)
        onOpen()
    }

    const formatDateTime = (datetime: string) => {
        const date = new Date(datetime)
        return date.toLocaleString()
    }

    const filteredEmployees = employees.filter((emp) => {
        const matchSearch =
            searchTerm === '' ||
            `${emp.firstName} ${emp.lastName}`
                .toLowerCase()
                .includes(searchTerm.toLowerCase()) ||
            emp.role.toLowerCase().includes(searchTerm.toLowerCase())

        const matchStatus =
            statusFilter === 'all' || emp.status.toLowerCase() === statusFilter
        const matchType =
            typeFilter === 'all' || emp.type.toLowerCase() === typeFilter
        return matchSearch && matchStatus && matchType
    })

    return (
        <Box p={6}>
            <Flex justify="space-between" align="center" mb={6}>
                <Box>
                    <Heading size="lg">Personnel</Heading>
                    <Text color="gray.500">
                        Manage your team members and their information.
                    </Text>
                </Box>
                <Button>
                    <FaPlus />
                    Add Employee
                </Button>
            </Flex>

            <Grid
                templateColumns={{ base: '1fr', md: 'repeat(3, 1fr)' }}
                gap={4}
                mb={6}
            >
                <StatCard
                    icon={FaUsers}
                    label="Total Employees"
                    value={employees.length}
                    color="blue.500"
                />
                <StatCard
                    icon={FaUserCheck}
                    label="Active"
                    value={
                        employees.filter((e) => e.status === 'Active').length
                    }
                    color="green.500"
                />
                <StatCard
                    icon={FaUserTimes}
                    label="Inactive"
                    value={
                        employees.filter((e) => e.status === 'Inactive').length
                    }
                    color="red.500"
                />
            </Grid>

            <Flex mb={4} direction={{ base: 'column', md: 'row' }} gap={4}>
                <Input
                    placeholder="Search by name, role..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />

                <SelectRoot
                    collection={employeeStatusOptions}
                    onValueChange={(value) => {
                        setStatusFilter(
                            Array.isArray(value)
                                ? value[0]?.value
                                : value.value[0]
                        )
                    }}
                >
                    <SelectTrigger>
                        <SelectValueText placeholder="All Types" />
                    </SelectTrigger>
                    <SelectContent>
                        {employeeStatusOptions.items.map((framework) => (
                            <SelectItem item={framework} key={framework.value}>
                                {framework.label}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </SelectRoot>

                <SelectRoot
                    collection={employeeTypeOptions}
                    onValueChange={(value) => {
                        setTypeFilter(
                            Array.isArray(value)
                                ? value[0]?.value
                                : value.value[0]
                        )
                    }}
                >
                    <SelectTrigger>
                        <SelectValueText placeholder="All Types" />
                    </SelectTrigger>
                    <SelectContent>
                        {employeeTypeOptions.items.map((framework) => (
                            <SelectItem item={framework} key={framework.value}>
                                {framework.label}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </SelectRoot>
            </Flex>

            <Text color="gray.500" fontSize="sm" mb={2}>
                Showing {filteredEmployees.length} of {employees.length}{' '}
                employees
            </Text>

            <Box borderWidth="1px" borderRadius="md" overflowX="auto">
                <Table.Root>
                    <Table.Header>
                        <Table.Row>
                            <Table.ColumnHeader>Name</Table.ColumnHeader>
                            <Table.ColumnHeader>Role</Table.ColumnHeader>
                            <Table.ColumnHeader>Project</Table.ColumnHeader>
                            <Table.ColumnHeader>Manager</Table.ColumnHeader>
                            <Table.ColumnHeader>Type</Table.ColumnHeader>
                            <Table.ColumnHeader>Status</Table.ColumnHeader>
                            <Table.ColumnHeader>Last Active</Table.ColumnHeader>
                            <Table.ColumnHeader>Next Active</Table.ColumnHeader>
                        </Table.Row>
                    </Table.Header>
                    <Table.Body>
                        {filteredEmployees.map((emp) => (
                            <Table.Row
                                key={emp.id}
                                onClick={() => handleOpenDrawer(emp)}
                                style={{ cursor: 'pointer' }}
                            >
                                <Table.Cell>
                                    {emp.firstName} {emp.lastName}
                                </Table.Cell>
                                <Table.Cell>{emp.role}</Table.Cell>
                                <Table.Cell>{emp.project}</Table.Cell>
                                <Table.Cell>{emp.manager}</Table.Cell>
                                <Table.Cell>
                                    <Badge
                                        colorScheme={
                                            emp.type === 'Consultant'
                                                ? 'blue'
                                                : 'gray'
                                        }
                                    >
                                        {emp.type}
                                    </Badge>
                                </Table.Cell>
                                <Table.Cell>
                                    <Badge
                                        colorScheme={
                                            emp.status === 'Active'
                                                ? 'green'
                                                : 'red'
                                        }
                                    >
                                        {emp.status}
                                    </Badge>
                                </Table.Cell>
                                <Table.Cell>
                                    {formatDateTime(emp.lastActiveTime)}
                                </Table.Cell>
                                <Table.Cell>
                                    {formatDateTime(emp.nextActiveTime)}
                                </Table.Cell>
                            </Table.Row>
                        ))}
                    </Table.Body>
                </Table.Root>
            </Box>

            <DrawerRoot open={open} onOpenChange={onClose}>
                <DrawerContent>
                    <DrawerHeader borderBottomWidth="1px">
                        {selectedEmployee?.firstName}{' '}
                        {selectedEmployee?.lastName}
                    </DrawerHeader>
                    <DrawerBody>
                        <Tabs.Root defaultValue="general">
                            <Tabs.List>
                                <Tabs.Trigger value="general">
                                    General
                                </Tabs.Trigger>
                                <Tabs.Trigger value="professional">
                                    Professional
                                </Tabs.Trigger>
                                <Tabs.Trigger value="org">Org</Tabs.Trigger>
                                <Tabs.Indicator />
                            </Tabs.List>

                            <Tabs.Content value="general">
                                <VStack gap={4} align="stretch">
                                    <Box>
                                        <Field>Email</Field>
                                        <Input
                                            value={
                                                selectedEmployee?.email || ''
                                            }
                                            readOnly
                                        />
                                    </Box>
                                    <Box>
                                        <Field>Phone</Field>
                                        <Input
                                            value={
                                                selectedEmployee?.phone || ''
                                            }
                                            readOnly
                                        />
                                    </Box>
                                    <Box>
                                        <Field>Address</Field>
                                        <Textarea
                                            value={
                                                selectedEmployee?.address || ''
                                            }
                                            readOnly
                                        />
                                    </Box>
                                </VStack>
                            </Tabs.Content>

                            <Tabs.Content value="professional">
                                <Text>TODO: Professional tab info</Text>
                            </Tabs.Content>

                            <Tabs.Content value="org">
                                <Text>TODO: Organizational tab info</Text>
                            </Tabs.Content>
                        </Tabs.Root>
                    </DrawerBody>
                </DrawerContent>
            </DrawerRoot>
        </Box>
    )
}

type StatCardProps = {
    icon: React.ElementType
    label: string
    value: number
    color: string
}

const StatCard = ({ icon, label, value, color }: StatCardProps) => (
    <Box p={4} borderWidth="1px" borderRadius="md">
        <Flex align="center" gap={3}>
            <Icon as={icon} boxSize={6} color={color} />
            <Box>
                <Text fontSize="sm" color="gray.500">
                    {label}
                </Text>
                <Text fontSize="lg" fontWeight="bold">
                    {value}
                </Text>
            </Box>
        </Flex>
    </Box>
)
