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
import { useEffect, useMemo, useState } from 'react'
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
    const [activeTab, setActiveTab] = useState<string | undefined>(undefined)

    const { formName, formId, formState, itemId } = useRouteContext()
    // Initialize mutation hooks
    const createEmployeeMutation = useCreateFormSubmission()
    const updateEmployeeMutation = useUpdateFormSubmission()
    const { data: submittedData } = useQuery<AllFormSubmission>({
        queryKey: ['formSubmission', formId],
    })

    const { data: formFields, isLoading: formFieldsLoading } = useQuery<IForm>({
        queryKey: ['formFields/get', formId, { limit: 10 }],
        staleTime: 1000 * 60 * 5,
    })

    useEffect(() => {
        if (formState === 'edit' && itemId && submittedData?.forms && formFields) {
            const formData = submittedData.forms.find(
                (form) => form._id === itemId
            )?.formData
            if (formData) {
                // Normalize formData to extract IDs from enhanced select fields
                const normalizedData = { ...formData }

                // Flatten all fields from all sections
                const allFields = formFields.sections?.flatMap(section => section.fields) || []

                // Process each field
                allFields.forEach(field => {
                    const value = normalizedData[field.name as keyof typeof normalizedData]

                    // Handle enhancedSelect - extract _id from object
                    if (field.type === 'enhancedSelect' && value && typeof value === 'object' && '_id' in value) {
                        (normalizedData as any)[field.name] = (value as any)._id
                    }

                    // Handle enhancedMultipleSelect - extract _id from array of objects
                    if (field.type === 'enhancedMultipleSelect' && Array.isArray(value)) {
                        (normalizedData as any)[field.name] = value.map((item: any) =>
                            typeof item === 'object' && '_id' in item ? item._id : item
                        )
                    }
                })

                reset(normalizedData)
            }
        } else if (formState === 'new') {
            reset({})
        }
    }, [formState, reset, itemId, submittedData?.forms, formFields])

    // Function to find the first tab containing validation errors
    const findTabWithErrors = (
        errors: any,
        sections: Section[]
    ): string | null => {
        for (const section of sections) {
            for (const field of section.fields) {
                if (errors[field.name]) {
                    return section.id
                }
            }
        }
        return null
    }

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

    const handleFormError = (errors: any) => {
        const errorTab = findTabWithErrors(errors, sections)
        if (errorTab) {
            setActiveTab(errorTab)
        }
    }

    const sections: Section[] = useMemo(
        () => formFields?.sections || [],
        [formFields]
    )

    if (formFieldsLoading) {
        return null
    }
    return (
        <DrawerRoot size="lg" open={isOpen} onOpenChange={onClose}>
            <DrawerContent display="flex" flexDirection="column" h="100%">
                <DrawerHeader borderBottomWidth="1px" flexShrink={0}>
                    {title}
                </DrawerHeader>
                <FormProvider {...methods}>
                    <Box
                        as="form"
                        onSubmit={handleSubmit(
                            handleFormSubmit,
                            handleFormError
                        )}
                    >
                        <DrawerBody>
                            <Tabs.Root
                                defaultValue={sections[0]?.id}
                                value={activeTab}
                            >
                                <Tabs.List position="sticky">
                                    {sections.map((section) => (
                                        <Tabs.Trigger
                                            key={section.id}
                                            value={section.id}
                                            onClick={() =>
                                                setActiveTab(section.id)
                                            }
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
                                        minH={'calc(100vh - 155px)'}
                                        maxH={'calc(100vh - 155px)'}
                                    >
                                        <VStack gap={4} align="stretch" pb={4}>
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
