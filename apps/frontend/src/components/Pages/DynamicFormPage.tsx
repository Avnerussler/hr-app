import { Box, Grid } from '@chakra-ui/react'
import { useQuery } from '@tanstack/react-query'
import {
    FaUsers,
    FaUserCheck,
    FaUserTimes,
    FaPlus,
    FaList,
    FaCheck,
    FaTimes,
    FaCalendar,
    FaProjectDiagram,
} from 'react-icons/fa'
import { useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { PageHeader } from '../common/PageHeader'
import { MetricCard } from '../common/MetricCard'
import { DetailsDrawer } from '../common/DetailsDrawer'
import { AllFormSubmission } from '@/types/formType'
// import { SearchAndFilters } from '../common/SearchAndFilters'
import { GenericTable } from '../GenericTable'
import { useRouteContext, useDrawerState } from '@/hooks/useRouteContext'
import { generateEditPath, generateNewPath } from '@/types/routeTypes'
import { useMetrics } from '@/hooks/useMetrics'
import { IForm } from '@/types/fieldsType'

interface DynamicFormPageProps {
    formId: string
    formName: string
}

export function DynamicFormPage({ formId, formName }: DynamicFormPageProps) {
    // const [searchTerm, setSearchTerm] = useState('')
    const [searchParams] = useSearchParams()
    const navigate = useNavigate()

    // Query for form fields (including metrics config)
    const { data: formFields } = useQuery<IForm>({
        queryKey: ['formFields/get', formId],
        staleTime: 1000 * 60 * 5,
    })

    // Query for submitted data (table rows)
    const { data: submittedData } = useQuery<AllFormSubmission>({
        queryKey: ['formSubmission', formId],
    })

    // Calculate metrics using the generic hook
    const metricsConfig = formFields?.metrics
    const calculatedMetrics = useMetrics(
        submittedData?.forms?.map((form) => form.formData),
        metricsConfig
    )

    // const statusOptions = createListCollection({
    //     items: [
    //         { value: 'all', label: 'All Status' },
    //         { value: 'active', label: 'Active' },
    //         { value: 'inactive', label: 'Inactive' },
    //     ],
    // })

    // const typeOptions = createListCollection({
    //     items: [
    //         { value: 'all', label: 'All Types' },
    //         { value: 'consultant', label: 'Consultant' },
    //         { value: 'reserve', label: 'Reserve' },
    //     ],
    // })

    const { formState, itemId } = useRouteContext()
    const IS_DRAWER_OPEN = useDrawerState()

    // Handle selectedRecord query parameter for foreign table navigation
    useEffect(() => {
        const selectedRecord = searchParams.get('selectedRecord')
        if (selectedRecord) {
            // Navigate to edit route for the selected record
            navigate(generateEditPath(formName, formId, selectedRecord), {
                replace: true,
            })
        }
    }, [searchParams, formName, formId, navigate])

    const handleRowAction = (
        action: string,
        rowData: Record<string, unknown>
    ) => {
        if (action === 'view') {
            navigate(generateEditPath(formName, formId, rowData._id as string))
        }
    }

    const handleAddNew = () => {
        navigate(generateNewPath(formName, formId))
    }

    const onClose = () => {
        navigate(-1)
    }
    // const filters: Filter[] = [
    //     {
    //         label: 'Status',
    //         collection: statusOptions,
    //         onValueChange: (value: FilterOption[] | { value: string[] }) => {
    //             // Filter logic handled by GenericTable
    //         },
    //         placeholder: 'Select status',
    //     },
    //     {
    //         label: 'Type',
    //         collection: typeOptions,
    //         onValueChange: (value: FilterOption[] | { value: string[] }) => {
    //             // Filter logic handled by GenericTable
    //         },
    //         placeholder: 'Select type',
    //     },
    // ]

    // Icon mapping for metrics
    const iconMap: Record<string, any> = {
        FaUsers: FaUsers,
        FaUserCheck: FaUserCheck,
        FaUserTimes: FaUserTimes,
        FaPlus: FaPlus,
        FaList: FaList,
        FaCheck: FaCheck,
        FaTimes: FaTimes,
        FaCalendar: FaCalendar,
        FaProjectDiagram: FaProjectDiagram,
    }

    // Transform calculated metrics for MetricCard component
    const metrics = calculatedMetrics.map((metric) => ({
        title: metric.title,
        value: metric.value,
        icon: iconMap[metric.icon || 'FaList'] || FaUsers,
        color: metric.color || 'blue.500',
    }))

    return (
        <Box p={6}>
            <PageHeader
                title={formName}
                description={`Manage ${formName.toLowerCase()} records`}
                action={{
                    label: `Add ${formName}`,
                    onClick: handleAddNew,
                    icon: FaPlus,
                }}
            />

            <Grid
                templateColumns={{
                    base: 'repeat(1, 1fr)',
                    md: 'repeat(2, 1fr)',
                    lg: 'repeat(3, 1fr)',
                    xl: 'repeat(4, 1fr)',
                }}
                gap={6}
                mb={6}
            >
                {metrics.map((metric, index) => (
                    <MetricCard
                        key={index}
                        icon={metric.icon}
                        label={metric.title}
                        value={metric.value}
                        color={metric.color}
                    />
                ))}
            </Grid>
            {/* 
            <SearchAndFilters
                searchTerm={searchTerm}
                onSearchChange={setSearchTerm}
                filters={filters}
            /> */}

            <GenericTable
                id={formId}
                onRowClick={(rowId) => handleRowAction('view', { _id: rowId })}
            />

            <DetailsDrawer
                key={`${formState}-${itemId || 'new'}`}
                isOpen={IS_DRAWER_OPEN}
                onClose={onClose}
                title={formName}
            />
        </Box>
    )
}
