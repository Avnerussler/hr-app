import {
    VStack,
    Tabs,
    Button,
    Flex,
    Box,
    IconButton,
    Text,
    Heading,
    Badge,
} from '@chakra-ui/react'
import {
    DrawerRoot,
    DrawerContent,
    DrawerHeader,
    DrawerBody,
    DrawerFooter,
} from '../ui/drawer'
import { IoClose } from 'react-icons/io5'
import {
    useForm,
    FormProvider,
    FieldValues,
    SubmitHandler,
} from 'react-hook-form'
import { useEffect, useMemo, useState } from 'react'
import { FormGenerator } from '../FormGenerator/FormGenerator'
import { FormFields, IForm } from '@/types/fieldsType'
import { SubmissionDetail } from '@/types/formType'
import {
    useCreateFormSubmission,
    useUpdateFormSubmission,
    useDeleteFormSubmission,
} from '@/hooks/mutations'
import { useQuery } from '@tanstack/react-query'
import { useRouteContext } from '@/hooks/useRouteContext'
import { Avatar } from '../ui/avatar'

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
    const {
        reset,
        handleSubmit,
        formState: { isDirty: hasChanges },
    } = methods
    const [activeTab, setActiveTab] = useState<string | undefined>(undefined)

    const { formName, formId, formState, itemId } = useRouteContext()
    // Initialize mutation hooks
    const createEmployeeMutation = useCreateFormSubmission()
    const updateEmployeeMutation = useUpdateFormSubmission()
    const deleteEmployeeMutation = useDeleteFormSubmission()
    const { data: submissionDetail } = useQuery<SubmissionDetail>({
        queryKey: ['formSubmission/detail', itemId],
        enabled: formState === 'edit' && !!itemId,
    })

    const { data: formFields, isLoading: formFieldsLoading } = useQuery<IForm>({
        queryKey: ['formFields/get', formId],
        staleTime: 1000 * 60 * 5,
    })

    // Get employee data for header display
    const employeeData = useMemo(() => {
        if (formState === 'edit' && itemId && submissionDetail?.formData) {
            const formData = submissionDetail.formData

            if (formData) {
                // Helper to extract string from possible object/array values
                const extractString = (value: any): string => {
                    if (!value) return ''
                    if (typeof value === 'string') return value
                    if (typeof value === 'object' && value.display)
                        return value.display
                    if (typeof value === 'object' && value.label)
                        return value.label
                    return String(value)
                }

                // Try different possible name field combinations
                const firstName = extractString((formData as any).firstName)
                const lastName = extractString((formData as any).lastName)
                const fullName = extractString((formData as any).fullName)
                const name = extractString((formData as any).name)
                const employeeName = extractString(
                    (formData as any).employeeName
                )
                const projectName = extractString((formData as any).projectName)
                const role = extractString(
                    (formData as any).studioRole || (formData as any).role
                )
                const department = extractString((formData as any).department)

                // Get full name
                let displayName = ''
                if (firstName || lastName) {
                    displayName = `${firstName} ${lastName}`.trim()
                } else {
                    displayName =
                        fullName || name || employeeName || projectName
                }

                // Get initials
                let initials = ''
                if (firstName && lastName) {
                    initials =
                        `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase()
                } else if (displayName && typeof displayName === 'string') {
                    const nameParts = displayName.split(' ')
                    if (nameParts.length >= 2) {
                        initials =
                            `${nameParts[0].charAt(0)}${nameParts[1].charAt(0)}`.toUpperCase()
                    } else if (nameParts[0]) {
                        initials = nameParts[0].substring(0, 2).toUpperCase()
                    }
                }

                return {
                    name: displayName,
                    initials,
                    role,
                    department,
                }
            }
        }
        return null
    }, [formState, itemId, submissionDetail])

    useEffect(() => {
        if (
            formState === 'edit' &&
            itemId &&
            submissionDetail?.formData &&
            formFields
        ) {
            const formData = submissionDetail.formData
            if (formData) {
                // Normalize formData to extract IDs from enhanced select fields
                const normalizedData = { ...formData }

                // Flatten all fields from all sections
                const allFields =
                    formFields.sections?.flatMap((section) => section.fields) ||
                    []

                // Process each field
                allFields.forEach((field) => {
                    const value =
                        normalizedData[
                            field.name as keyof typeof normalizedData
                        ]

                    // Handle enhancedSelect - extract _id from object
                    if (
                        field.type === 'enhancedSelect' &&
                        value &&
                        typeof value === 'object' &&
                        '_id' in value
                    ) {
                        ;(normalizedData as any)[field.name] = (
                            value as any
                        )._id
                    }

                    // Handle enhancedMultipleSelect - extract _id from array of objects
                    if (
                        field.type === 'enhancedMultipleSelect' &&
                        Array.isArray(value)
                    ) {
                        ;(normalizedData as any)[field.name] = value.map(
                            (item: any) =>
                                typeof item === 'object' && '_id' in item
                                    ? item._id
                                    : item
                        )
                    }
                })

                reset(normalizedData)
            }
        } else if (formState === 'new') {
            reset({})
        }
    }, [formState, reset, itemId, submissionDetail, formFields])

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
            return
        }
        // Create new employee
        createEmployeeMutation.mutate(
            { formId: formId, formData: data, formName: formName },
            {
                onSuccess: () => {
                    onClose()
                    reset(data)
                },
            }
        )
    }

    const handleFormError = (errors: any) => {
        const errorTab = findTabWithErrors(errors, sections)
        if (errorTab) {
            setActiveTab(errorTab)
        }
    }

    const handleDelete = () => {
        if (itemId) {
            deleteEmployeeMutation.mutate(
                {
                    id: itemId,
                    formId: formId,
                },
                {
                    onSuccess: () => {
                        onClose()
                    },
                }
            )
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
            <DrawerContent
                display="flex"
                flexDirection="column"
                h="100%"
                bg="gray.50"
                _dark={{ bg: 'gray.900' }}
            >
                <DrawerHeader
                    flexShrink={0}
                    py={5}
                    px={6}
                    bg="white"
                    _dark={{ bg: 'gray.800' }}
                    borderBottom="1px"
                    borderColor="gray.200"
                >
                    <Flex
                        width="100%"
                        justify="space-between"
                        align="center"
                        gap={4}
                    >
                        <Flex align="center" gap={4} flex={1}>
                            {employeeData ? (
                                <>
                                    <Avatar
                                        name={employeeData.name}
                                        bg="gray.200"
                                        _dark={{ bg: 'gray.600' }}
                                        color="gray.700"
                                        fontWeight="bold"
                                        fontSize="xl"
                                    ></Avatar>

                                    <Box>
                                        <Flex align="center" gap={2} mb={0.5}>
                                            <Heading
                                                size="lg"
                                                fontWeight="bold"
                                                color="gray.900"
                                                _dark={{ color: 'white' }}
                                            >
                                                {employeeData.name}
                                            </Heading>
                                            {formState === 'new' && (
                                                <Badge
                                                    colorScheme="green"
                                                    variant="solid"
                                                    px={2}
                                                    py={0.5}
                                                    borderRadius="md"
                                                    fontSize="xs"
                                                >
                                                    NEW
                                                </Badge>
                                            )}
                                        </Flex>
                                        {(employeeData.role ||
                                            employeeData.department) && (
                                            <Text
                                                fontSize="md"
                                                color="gray.600"
                                                _dark={{ color: 'gray.400' }}
                                            >
                                                {[
                                                    employeeData.role,
                                                    employeeData.department,
                                                ]
                                                    .filter(Boolean)
                                                    .join(' • ')}
                                            </Text>
                                        )}
                                    </Box>
                                </>
                            ) : (
                                <Box>
                                    <Heading
                                        size="lg"
                                        fontWeight="bold"
                                        color="gray.900"
                                        _dark={{ color: 'white' }}
                                    >
                                        {title}
                                    </Heading>
                                    {formState === 'new' && (
                                        <Badge
                                            colorScheme="green"
                                            variant="solid"
                                            px={2}
                                            py={0.5}
                                            borderRadius="md"
                                            fontSize="xs"
                                            mt={1}
                                        >
                                            NEW
                                        </Badge>
                                    )}
                                </Box>
                            )}
                        </Flex>
                        <IconButton
                            aria-label="Close drawer"
                            onClick={onClose}
                            variant="ghost"
                            size="sm"
                        >
                            <IoClose />
                        </IconButton>
                    </Flex>
                </DrawerHeader>
                <FormProvider {...methods}>
                    <Box
                        as="form"
                        onSubmit={handleSubmit(
                            handleFormSubmit,
                            handleFormError
                        )}
                        display="flex"
                        flexDirection="column"
                        flex="1"
                        overflow="hidden"
                    >
                        <DrawerBody
                            bg="white"
                            _dark={{ bg: 'gray.800' }}
                            p={0}
                            flex="1"
                            overflow="hidden"
                        >
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
                                            px={5}
                                            py={3}
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
                                        maxH={'calc(100vh - 190px)'}
                                        minH={'calc(100vh - 190px)'}
                                    >
                                        <VStack
                                            gap={4}
                                            align="stretch"
                                            p={6}
                                            pb={4}
                                        >
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

                        <DrawerFooter
                            borderTopWidth="1px"
                            borderColor="gray.200"
                            _dark={{ borderColor: 'gray.700' }}
                            bg="white"
                            py={6}
                            px={6}
                            shadow="md"
                            flexShrink={0}
                            position="sticky"
                            bottom={0}
                        >
                            <Flex justify="space-between" width="100%" gap={3}>
                                <Flex gap={3}>
                                    <Button
                                        variant="outline"
                                        onClick={onClose}
                                        size="lg"
                                        px={6}
                                        fontWeight="semibold"
                                    >
                                        Cancel
                                    </Button>
                                    {formState === 'edit' && itemId && (
                                        <Button
                                            variant="outline"
                                            colorScheme="red"
                                            onClick={handleDelete}
                                            size="lg"
                                            px={6}
                                            fontWeight="semibold"
                                        >
                                            Delete
                                        </Button>
                                    )}
                                </Flex>
                                <Button
                                    type="submit"
                                    colorScheme="blue"
                                    disabled={!hasChanges}
                                    size="lg"
                                    px={8}
                                    fontWeight="bold"
                                    bgGradient={
                                        hasChanges
                                            ? 'linear(to-r, blue.500, purple.600)'
                                            : undefined
                                    }
                                    _hover={
                                        hasChanges
                                            ? {
                                                  bgGradient:
                                                      'linear(to-r, blue.600, purple.700)',
                                                  transform: 'translateY(-2px)',
                                                  shadow: 'lg',
                                              }
                                            : {}
                                    }
                                >
                                    {formState === 'new'
                                        ? '✨ Create'
                                        : '💾 Update'}
                                </Button>
                            </Flex>
                        </DrawerFooter>
                    </Box>
                </FormProvider>
            </DrawerContent>
        </DrawerRoot>
    )
}
