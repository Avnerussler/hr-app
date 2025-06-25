import { Box, Grid, createListCollection } from '@chakra-ui/react'

import { FaUsers, FaUserCheck, FaUserTimes, FaPlus } from 'react-icons/fa'
import { useState, useEffect } from 'react'
import { useDisclosure } from '@chakra-ui/react'
import { PageHeader } from '../common/PageHeader'
import { MetricCard } from '../common/MetricCard'
import { SearchAndFilters } from '../common/SearchAndFilters'
import { DataTable } from '../common/DataTable'
import { DetailsDrawer, Section } from '../common/DetailsDrawer'
import { createEmployeeFormSections } from '@/utils/employeeFormSections'
import { employeesData, Employee } from '@/data/employeeData'

type EmployeeType = 'Consultant' | 'Reserve' | 'All Types'

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


export default function PersonnelPage() {
    const [searchTerm, setSearchTerm] = useState('')
    const [statusFilter, setStatusFilter] = useState('all')
    const [typeFilter, setTypeFilter] = useState('all')
    const [selectedEmployee, setSelectedEmployee] = useState<Employee>()
    const [formSections, setFormSections] = useState<Section[]>([])
    console.log(' typeFilter:', typeFilter)
    const { open, onOpen, onClose } = useDisclosure()

    const [employees] = useState<Employee[]>(employeesData)

    // Initialize form sections based on Employee interface
    useEffect(() => {
        setFormSections(createEmployeeFormSections())
    }, [])

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

    const filters = [
        {
            label: 'Status',
            collection: employeeStatusOptions,
            onValueChange: (value: any) => {
                setStatusFilter(
                    Array.isArray(value) ? value[0]?.value : value.value[0]
                )
            },
            placeholder: 'All Status',
        },
        {
            label: 'Type',
            collection: employeeTypeOptions,
            onValueChange: (value: any) => {
                setTypeFilter(
                    Array.isArray(value) ? value[0]?.value : value.value[0]
                )
            },
            placeholder: 'All Types',
        },
    ]

    return (
        <Box p={6}>
            <PageHeader
                title="Personnel"
                description="Manage your team members and their information."
                action={{
                    label: 'Add Employee',
                    icon: <FaPlus />,
                    onClick: () => {},
                }}
            />

            <Grid
                templateColumns={{ base: '1fr', md: 'repeat(3, 1fr)' }}
                gap={4}
                mb={6}
            >
                <MetricCard
                    icon={FaUsers}
                    label="Total Employees"
                    value={employees.length}
                    color="blue.500"
                />
                <MetricCard
                    icon={FaUserCheck}
                    label="Active"
                    value={
                        employees.filter((e) => e.status === 'Active').length
                    }
                    color="green.500"
                />
                <MetricCard
                    icon={FaUserTimes}
                    label="Inactive"
                    value={
                        employees.filter((e) => e.status === 'Inactive').length
                    }
                    color="red.500"
                />
            </Grid>

            <SearchAndFilters
                searchTerm={searchTerm}
                onSearchChange={setSearchTerm}
                filters={filters}
            />

            <DataTable
                employees={filteredEmployees}
                onEmployeeClick={handleOpenDrawer}
                formatDateTime={formatDateTime}
            />

            <DetailsDrawer
                isOpen={open}
                onClose={onClose}
                title={selectedEmployee ? `${selectedEmployee.firstName} ${selectedEmployee.lastName}` : 'Employee Details'}
                sections={formSections}
                initialData={selectedEmployee || {}}
                onSubmit={(data) => {
                    console.log('Updated employee data:', data)
                    console.log('Employee ID:', selectedEmployee?.id)
                    // Here you would typically make an API call to update the employee
                }}
            />
        </Box>
    )
}
