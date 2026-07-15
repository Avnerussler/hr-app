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
import { CalculatedMetric } from '@/types/formType'
import { GenericTable } from '../GenericTable'
import { useRouteContext, useDrawerState } from '@/hooks/useRouteContext'
import { generateEditPath, generateNewPath } from '@/types/routeTypes'
import { IForm } from '@/types/fieldsType'

interface DynamicFormPageProps {
    formId: string
    formName: string
    displayName: string
}

export function DynamicFormPage({
    formId,
    formName,
    displayName,
}: DynamicFormPageProps) {
    const [searchParams] = useSearchParams()
    const navigate = useNavigate()

    const { data: formFields } = useQuery<IForm>({
        queryKey: ['formFields/get', formId],
        staleTime: 1000 * 60 * 5,
    })

    const { data: calculatedMetrics = [] } = useQuery<CalculatedMetric[]>({
        queryKey: ['formSubmission/metrics', formId],
        enabled: !!formFields?.metrics?.length,
    })

    const { formState, itemId } = useRouteContext()
    const IS_DRAWER_OPEN = useDrawerState()

    useEffect(() => {
        const selectedRecord = searchParams.get('selectedRecord')
        if (selectedRecord) {
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
            const editPath = generateEditPath(
                formName,
                formId,
                rowData._id as string
            )
            const searchParamsString = searchParams.toString()
            const fullPath = searchParamsString
                ? `${editPath}?${searchParamsString}`
                : editPath
            navigate(fullPath)
        }
    }

    const handleAddNew = () => {
        navigate(generateNewPath(formName, formId))
    }

    const onClose = () => {
        navigate(-1)
    }

    const iconMap: Record<string, React.ElementType> = {
        FaUsers,
        FaUserCheck,
        FaUserTimes,
        FaPlus,
        FaList,
        FaCheck,
        FaTimes,
        FaCalendar,
        FaProjectDiagram,
    }

    return (
        <Box display="flex" flexDirection="column" h="full">
            <PageHeader
                title={displayName}
                description={` ${displayName} `}
                action={{
                    label: `${displayName}`,
                    onClick: handleAddNew,
                    icon: FaPlus,
                }}
            />

            {calculatedMetrics.length > 0 && (
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
                    {calculatedMetrics.map((metric, index) => (
                        <MetricCard
                            key={index}
                            icon={iconMap[metric.icon ?? 'FaList'] ?? FaUsers}
                            label={metric.title}
                            value={metric.value}
                            color={metric.color ?? 'blue.500'}
                        />
                    ))}
                </Grid>
            )}

            <GenericTable
                key={formId}
                id={formId}
                onRowClick={(rowId) => handleRowAction('view', { _id: rowId })}
                filters={formFields?.filters}
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
