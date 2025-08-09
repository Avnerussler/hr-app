import { VStack, Tabs, Button, Flex, Box } from '@chakra-ui/react'
import {
    DrawerRoot,
    DrawerContent,
    DrawerHeader,
    DrawerBody,
    DrawerFooter,
} from '../ui/drawer'
import {
    useForm,
    FormProvider,
    FieldValues,
    SubmitHandler,
} from 'react-hook-form'
import { useEffect } from 'react'
import { FormGenerator } from '../FormGenerator/FormGenerator'
import { FormFields, IForm } from '@/types/fieldsType'
import { AllFormSubmission } from '@/types/formType'
import {
    useCreateFormSubmission,
    useUpdateFormSubmission,
} from '@/hooks/mutations'
import { useQuery } from '@tanstack/react-query'
import { useRouteContext } from '@/hooks/useRouteContext'

export interface Section {
    id: string
    name: string
    fields: FormFields[]
}

interface DetailsDrawerProps {
    isOpen: boolean
    onClose: () => void
    title: string
}

export function DetailsDrawer({ isOpen, onClose, title }: DetailsDrawerProps) {
    const methods = useForm()
    const { reset, handleSubmit } = methods

    const { formName, formId, formState, itemId } = useRouteContext()
    // Initialize mutation hooks
    const createEmployeeMutation = useCreateFormSubmission()
    const updateEmployeeMutation = useUpdateFormSubmission()
    const { data: submittedData } = useQuery<AllFormSubmission>({
        queryKey: ['formSubmission/get', formId],
    })

    const { data: formFields, isLoading: formFieldsLoading } = useQuery<IForm>({
        queryKey: ['formFields/get', formId],
        staleTime: 1000 * 60 * 5,
    })

    useEffect(() => {
        if (formState === 'edit' && itemId && submittedData?.forms) {
            const formData = submittedData.forms.find(
                (form) => form._id === itemId
            )?.formData
            if (formData) {
                reset(formData)
            }
        } else if (formState === 'new') {
            reset({})
        }
    }, [formState, reset, itemId, submittedData?.forms])

    const handleFormSubmit: SubmitHandler<FieldValues> = (data) => {
        if (itemId) {
            // Update existing employee
            updateEmployeeMutation.mutate(
                {
                    formData: data,
                    formId: formId,
                    id: itemId,
                },
                {
                    onSuccess: () => {
                        onClose()
                    },
                }
            )
        } else {
            // Create new employee
            createEmployeeMutation.mutate({
                formId: formId,
                formData: data,
                formName: formName,
            })
        }
        reset(data)
    }

    const sections: Section[] = formFields?.sections || []
    // Get default active tab (first section)
    const defaultTab = sections[0]?.id
    if (formFieldsLoading) {
        return null
    }
    return (
        <DrawerRoot size="lg" open={isOpen} onOpenChange={onClose}>
            <DrawerContent display="flex" flexDirection="column" h="100%">
                <DrawerHeader borderBottomWidth="1px" flexShrink={0}>{title}</DrawerHeader>
                <FormProvider {...methods}>
                    <Box as="form" onSubmit={handleSubmit(handleFormSubmit)} display="flex" flexDirection="column" flex="1">
                        <DrawerBody flex="1" minH={0} display="flex" flexDirection="column">
                            <Tabs.Root defaultValue={defaultTab} h="full" display="flex" flexDirection="column">
                                <Tabs.List flexShrink={0} position="sticky" top={0} bg="bg" zIndex={1} borderBottomWidth="1px">
                                    {sections.map((section) => (
                                        <Tabs.Trigger
                                            key={section.id}
                                            value={section.id}
                                        >
                                            {section.name}
                                        </Tabs.Trigger>
                                    ))}
                                    <Tabs.Indicator />
                                </Tabs.List>

                                {sections.map((section) => (
                                    <Tabs.Content
                                        key={section.id}
                                        value={section.id}
                                        flex="1"
                                        overflowY="auto"
                                        minH={0}
                                    >
                                        <VStack gap={4} align="stretch" mt={4} pb={4}>
                                            {section.fields.map((field) => (
                                                <FormGenerator
                                                    {...field}
                                                    key={field._id}
                                                    control={methods.control}
                                                    id={field._id}
                                                    name={field.name}
                                                    type={field.type}
                                                    label={field.label}
                                                    placeholder={
                                                        field.placeholder
                                                    }
                                                    options={field.options}
                                                    items={field.items}
                                                />
                                            ))}
                                        </VStack>
                                    </Tabs.Content>
                                ))}
                            </Tabs.Root>
                        </DrawerBody>

                        {/* {hasChanges && ( */}
                        <DrawerFooter borderTopWidth="1px" flexShrink={0}>
                            <Flex justify="space-between" width="100%">
                                <Button variant="outline" onClick={onClose}>
                                    Cancel
                                </Button>
                                <Button type="submit" colorScheme="blue">
                                    Update
                                </Button>
                            </Flex>
                        </DrawerFooter>
                        {/* )} */}
                    </Box>
                </FormProvider>
            </DrawerContent>
        </DrawerRoot>
    )
}
