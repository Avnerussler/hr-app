import {
    VStack,
    Tabs,
    Button,
    Flex,
    SimpleGrid,
    Select,
} from '@chakra-ui/react'
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
import { RefObject, useContext, useEffect } from 'react'
import { FormGenerator } from '../FormGenerator/FormGenerator'
import { FormFields } from '@/types/fieldsType'
import { useLocation, useParams } from 'react-router-dom'
import { AllFormSubmission } from '@/types/formType'
import {
    useCreateFormSubmission,
    useUpdateFormSubmission,
} from '@/hooks/mutations'
import { ControlledSelectField } from '../ControlledFields'
import ContentRefContext from '@/providers/ContentRefContext'

export interface Section {
    id: string
    name: string
    fields: FormFields[]
}

interface DetailsDrawerProps {
    isOpen: boolean
    onClose: () => void
    title: string
    sections: Section[]
    initialData?: AllFormSubmission
}

export function DetailsDrawer({
    isOpen,
    onClose,
    title,
    sections,
    initialData,
}: DetailsDrawerProps) {
    const methods = useForm()
    const { reset, handleSubmit } = methods

    const { employeeId } = useParams<{ employeeId?: string }>()
    const location = useLocation()
    const formName = location.pathname.split('/')[1]
    const EMPLOYEE_FORM_ID = '685ec2b38ee85d51bd55233b'
    // Initialize mutation hooks
    const createEmployeeMutation = useCreateFormSubmission()
    const updateEmployeeMutation = useUpdateFormSubmission()
    useEffect(() => {
        // Reset form with initial data if provided

        if (initialData?.forms.length && employeeId) {
            const employeeData = initialData.forms.find(
                (item) => item._id === employeeId
            )

            // Reset the form with the initial
            if (employeeData?.formData) {
                reset(employeeData.formData)
            }
        }
    }, [initialData, employeeId, reset])

    const handleFormSubmit: SubmitHandler<FieldValues> = (data) => {
        if (employeeId) {
            // Update existing employee
            updateEmployeeMutation.mutate(
                {
                    formData: data,
                    formId: EMPLOYEE_FORM_ID,
                    id: employeeId,
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
                formId: EMPLOYEE_FORM_ID,
                formData: data,
                formName: formName,
            })
        }
        reset(data)
    }

    // Get default active tab (first section)
    const defaultTab = sections.length > 0 ? sections[0].id : ''
    const contentRef = useContext(ContentRefContext)

    return (
        <DrawerRoot size="lg" open={isOpen} onOpenChange={onClose}>
            <DrawerContent>
                <DrawerHeader borderBottomWidth="1px">{title}</DrawerHeader>
                <FormProvider {...methods}>
                    <form onSubmit={handleSubmit(handleFormSubmit)}>
                        <DrawerBody>
                            <Tabs.Root defaultValue={defaultTab}>
                                <Tabs.List>
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
                                        ref={
                                            contentRef as RefObject<HTMLDivElement>
                                        }
                                    >
                                        <VStack gap={4} align="stretch" mt={4}>
                                            <SimpleGrid
                                                columns={{ base: 1, md: 2 }}
                                                gap={4}
                                            >
                                                {section.fields.map((field) => (
                                                    <FormGenerator
                                                        key={field._id}
                                                        control={
                                                            methods.control
                                                        }
                                                        id={field._id}
                                                        name={field.name}
                                                        type={field.type}
                                                        label={field.label}
                                                        placeholder={
                                                            field.placeholder
                                                        }
                                                        options={field.options}
                                                        items={field.items}
                                                        defaultValue={''}
                                                    />
                                                ))}
                                            </SimpleGrid>
                                        </VStack>
                                    </Tabs.Content>
                                ))}
                            </Tabs.Root>
                        </DrawerBody>

                        {/* {hasChanges && ( */}
                        <DrawerFooter borderTopWidth="1px">
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
                    </form>
                </FormProvider>
            </DrawerContent>
        </DrawerRoot>
    )
}
