import { Box, Grid, createListCollection } from '@chakra-ui/react'
import { useQuery } from '@tanstack/react-query'
import { FaUsers, FaUserCheck, FaUserTimes, FaPlus } from 'react-icons/fa'
import { useState } from 'react'
import { useDisclosure } from '@chakra-ui/react'
import { useNavigate, useParams } from 'react-router-dom'
import { PageHeader } from '../common/PageHeader'
import { MetricCard } from '../common/MetricCard'
import { DetailsDrawer } from '../common/DetailsDrawer'

import { AllFormSubmission, Filter, FilterOption } from '@/types/formType'
import { SearchAndFilters } from '../common/SearchAndFilters'
import { GenericTable } from '../GenericTable'
import { IForm } from '@/types/fieldsType'

// Employee form configuration
const EMPLOYEE_FORM_ID = '685ec2b38ee85d51bd55233b'

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

    const navigate = useNavigate()
    const { employeeId } = useParams<{ employeeId?: string }>()

    const { open, onOpen, onClose } = useDisclosure()

    // Query for form fields (table columns)
    const { data: formFields } = useQuery<IForm>({
        queryKey: ['formFields/get', EMPLOYEE_FORM_ID],
        staleTime: 1000 * 60 * 5,
    })

    // Query for submitted data (table rows)
    const { data: submittedData } = useQuery<AllFormSubmission>({
        queryKey: ['formSubmission/get', EMPLOYEE_FORM_ID],
    })

    // Initialize form sections based on Employee interface

    const handleAddNewEmployee = () => {
        navigate('/personnel/new')
        onOpen()
    }

    const handleRowClick = (employeeId: string) => {
        navigate(`/personnel/${employeeId}`)
        onOpen()
    }

    const handleCloseDrawer = () => {
        navigate('/personnel')

        onClose()
    }

    // Calculate metrics from submitted data
    const totalEmployees = submittedData?.forms?.length || 0
    const activeEmployees =
        submittedData?.forms?.filter(
            (form) => (form.formData as any)?.personnelStatus === 'active'
        ).length || 0
    const inactiveEmployees = totalEmployees - activeEmployees

    // If you need to count inactive employees by 'personnelStatus', use this:

    // Helper function to render cell value based on field type

    // const filteredEmployees =
    //     // employees
    //     [].filter((emp) => {
    //         const matchSearch =
    //             searchTerm === '' ||
    //             `${emp.firstName} ${emp.lastName}`
    //                 .toLowerCase()
    //                 .includes(searchTerm.toLowerCase()) ||
    //             emp.role.toLowerCase().includes(searchTerm.toLowerCase())

    //         const matchStatus =
    //             statusFilter === 'all' ||
    //             emp.status.toLowerCase() === statusFilter
    //         const matchType =
    //             typeFilter === 'all' || emp.type.toLowerCase() === typeFilter
    //         return matchSearch && matchStatus && matchType
    //     })

    const filters: Filter[] = [
        {
            label: 'Status',
            collection: employeeStatusOptions,
            onValueChange: (value: FilterOption[] | { value: string[] }) => {
                setStatusFilter(
                    Array.isArray(value) ? value[0]?.value : value.value[0]
                )
            },
            placeholder: 'All Status',
        },
        {
            label: 'Type',
            collection: employeeTypeOptions,
            onValueChange: (value: FilterOption[] | { value: string[] }) => {
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
                    onClick: handleAddNewEmployee,
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
                    value={totalEmployees}
                    color="blue.500"
                />
                <MetricCard
                    icon={FaUserCheck}
                    label="Active"
                    value={activeEmployees}
                    color="green.500"
                />
                <MetricCard
                    icon={FaUserTimes}
                    label="Inactive"
                    value={inactiveEmployees}
                    color="red.500"
                />
            </Grid>

            <SearchAndFilters
                searchTerm={searchTerm}
                onSearchChange={setSearchTerm}
                filters={filters}
            />

            <GenericTable onRowClick={handleRowClick} id={EMPLOYEE_FORM_ID} />

            <DetailsDrawer
                isOpen={open}
                onClose={handleCloseDrawer}
                title={
                    employeeId && employeeId !== 'new'
                        ? 'Employee Details'
                        : 'Add New Employee'
                }
                sections={formFields?.sections || []}
                initialData={submittedData}
            />
        </Box>
    )
}
