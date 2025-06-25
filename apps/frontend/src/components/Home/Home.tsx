import { useState } from 'react'
import {
    AbsoluteCenter,
    Box,
    Spinner,
    Tabs,
    Text,
    VStack,
} from '@chakra-ui/react'
import { useQuery } from '@tanstack/react-query'

import { GenericTable } from '../GenericTable'

import { AllFormSubmission } from '@/types/formType'
import { Dialog } from '../Dialog'
import { GenericForm } from '../GenericForm'
export const Home = () => {
    const [selectedTab, setSelectedTab] = useState('')

    const { data, isSuccess, isLoading, isFetching } =
        useQuery<AllFormSubmission>({
            queryKey: ['formFields/get/partialData'],
            staleTime: 1000 * 60 * 5, // 5 minutes
        })

    const handleClick = (e: { value: string }) => {
        setSelectedTab(e.value)
    }

    const renderTable = (data?: AllFormSubmission) => {
        if (isLoading && isFetching) {
            return (
                <AbsoluteCenter>
                    <VStack colorPalette="teal">
                        <Spinner color="colorPalette.600" />
                        <Text color="colorPalette.600">Loading Tables...</Text>
                    </VStack>
                </AbsoluteCenter>
            )
        }
        if (!data?.forms.length) {
            return (
                <AbsoluteCenter>
                    <Text>No Forms Available :/</Text>
                </AbsoluteCenter>
            )
        }

        const formName = selectedTab
            ? data.forms.find((form) => form._id === selectedTab)?.formName
            : data?.forms[0].formName

        return (
            <>
                {isSuccess && (
                    <Tabs.Root
                        value={selectedTab || data?.forms[0]._id}
                        variant="outline"
                        size="sm"
                        width="fit-content"
                        onValueChange={handleClick}
                        defaultValue={data?.forms[0]._id}
                    >
                        <Tabs.List flex="1 1 auto">
                            {data.forms.map((form) => (
                                <Tabs.Trigger value={form._id} key={form._id}>
                                    {form.formName}
                                </Tabs.Trigger>
                            ))}
                        </Tabs.List>

                        <Tabs.ContentGroup>
                            <Tabs.Content
                                value={selectedTab || data?.forms[0]._id}
                                key={selectedTab}
                            >
                                <Dialog
                                    buttonText={`${formName}`}
                                    title={formName}
                                >
                                    <GenericForm
                                        formMode="create"
                                        formId={
                                            selectedTab || data?.forms[0]._id
                                        }
                                    />
                                </Dialog>

                                <Box mt="8">
                                    <GenericTable
                                        id={selectedTab || data?.forms[0]._id}
                                    />
                                </Box>
                            </Tabs.Content>
                        </Tabs.ContentGroup>
                    </Tabs.Root>
                )}
            </>
        )
    }

    return <>{renderTable(data)}</>
}
