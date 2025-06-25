import { VStack, Tabs, Button, Flex, SimpleGrid } from '@chakra-ui/react'
import {
    DrawerRoot,
    DrawerContent,
    DrawerHeader,
    DrawerBody,
    DrawerFooter,
} from '../ui/drawer'
import { useForm, FormProvider } from 'react-hook-form'
import { useEffect, useState } from 'react'
import { FormGenerator } from '../FormGenerator/FormGenerator'
import { FormFields } from '@/types/fieldsType'

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
    initialData?: Record<string, any>
    onSubmit: (data: any, sectionId?: string) => void
}

export function DetailsDrawer({
    isOpen,
    onClose,
    title,
    sections,
    initialData = {},
    onSubmit,
}: DetailsDrawerProps) {
    const methods = useForm()
    const {
        reset,
        handleSubmit,
        formState: { isDirty },
    } = methods
    const [hasChanges, setHasChanges] = useState(false)

    useEffect(() => {
        if (initialData && Object.keys(initialData).length > 0) {
            const formData: any = {}

            // Map initial data to form fields across all sections
            sections.forEach((section) => {
                section.fields.forEach((field) => {
                    if (initialData[field.name] !== undefined) {
                        formData[field.name] = initialData[field.name]
                    }
                })
            })

            reset(formData)
            setHasChanges(false)
        }
    }, [initialData, sections, reset])

    useEffect(() => {
        setHasChanges(isDirty)
    }, [isDirty])

    const handleFormSubmit = (data: any) => {
        onSubmit(data)
        setHasChanges(false)
        reset(data)
    }

    // Get default active tab (first section)
    const defaultTab = sections.length > 0 ? sections[0].id : ''

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
                                                        defaultValue={
                                                            initialData[
                                                                field.name
                                                            ] || ''
                                                        }
                                                    />
                                                ))}
                                            </SimpleGrid>
                                        </VStack>
                                    </Tabs.Content>
                                ))}
                            </Tabs.Root>
                        </DrawerBody>

                        {hasChanges && (
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
                        )}
                    </form>
                </FormProvider>
            </DrawerContent>
        </DrawerRoot>
    )
}
