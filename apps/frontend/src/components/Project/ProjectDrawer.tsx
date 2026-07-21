import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Box, Button, Flex, Heading, VStack } from '@chakra-ui/react'
import { IoClose } from 'react-icons/io5'
import { DrawerRoot, DrawerContent, DrawerHeader, DrawerBody, DrawerFooter } from '@/components/ui/drawer'
import { IconButton } from '@chakra-ui/react'
import { useRouteContext } from '@/hooks/useRouteContext'
import { ProjectForm } from './ProjectForm'
import { buildProjectFormSchema, ProjectFormValues, PROJECT_DEFAULT_VALUES } from './projectSchema'
import { useProjectDetailQuery } from '@/hooks/queries/useProjectQueries'
import { useSettingOptions } from '@/hooks/queries/useSettingQueries'
import { useCreateProject, useUpdateProject, useDeleteProject } from '@/hooks/mutations/useProjectMutations'

interface ProjectDrawerProps {
    isOpen: boolean
    onClose: () => void
}

export function ProjectDrawer({ isOpen, onClose }: ProjectDrawerProps) {
    const { formState, itemId } = useRouteContext()
    const { data: project } = useProjectDetailQuery(formState === 'edit' ? itemId : undefined)
    const projectStatus = useSettingOptions('projectStatus')

    const {
        control,
        handleSubmit,
        reset,
        setError,
        formState: { isDirty: hasChanges },
    } = useForm<ProjectFormValues>({
        resolver: zodResolver(buildProjectFormSchema(projectStatus.allowedValues)),
        defaultValues: PROJECT_DEFAULT_VALUES,
    })

    const createMutation = useCreateProject((field, message) =>
        setError(field as keyof ProjectFormValues, { type: 'server', message })
    )
    const updateMutation = useUpdateProject((field, message) =>
        setError(field as keyof ProjectFormValues, { type: 'server', message })
    )
    const deleteMutation = useDeleteProject()

    useEffect(() => {
        if (formState === 'edit' && project) {
            reset({
                projectName: project.projectName,
                projectManager: project.projectManager?._id ?? null,
                projectPersonnel: project.projectPersonnel.map((p) => p._id),
                projectStatus: project.projectStatus,
            })
        } else if (formState === 'new') {
            reset(PROJECT_DEFAULT_VALUES)
        }
    }, [formState, project, reset])

    const onSubmit = (data: ProjectFormValues) => {
        if (itemId) {
            updateMutation.mutate({ id: itemId, body: data }, { onSuccess: onClose })
            return
        }
        createMutation.mutate(data, { onSuccess: onClose })
    }

    const handleDelete = () => {
        if (itemId) {
            deleteMutation.mutate(itemId, { onSuccess: onClose })
        }
    }

    return (
        <DrawerRoot size="lg" open={isOpen} onOpenChange={onClose}>
            <DrawerContent display="flex" flexDirection="column" h="100%" bg="gray.50" _dark={{ bg: 'gray.900' }}>
                <DrawerHeader
                    flexShrink={0}
                    py={5}
                    px={6}
                    bg="white"
                    _dark={{ bg: 'gray.800' }}
                    borderBottom="1px"
                    borderColor="gray.200"
                >
                    <Flex width="100%" justify="space-between" align="center" gap={4}>
                        <Heading size="lg" fontWeight="bold" color="gray.900" _dark={{ color: 'white' }}>
                            {formState === 'new' ? 'ניהול פרויקטים' : project?.projectName}
                        </Heading>
                        <IconButton aria-label="Close drawer" onClick={onClose} variant="ghost" size="sm">
                            <IoClose />
                        </IconButton>
                    </Flex>
                </DrawerHeader>
                <Box as="form" onSubmit={handleSubmit(onSubmit)} display="flex" flexDirection="column" flex="1" overflow="hidden">
                    <DrawerBody bg="white" _dark={{ bg: 'gray.800' }} p={0} flex="1" overflow="auto">
                        <VStack gap={0} align="stretch">
                            <ProjectForm control={control} projectStatusOptions={projectStatus.options} />
                        </VStack>
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
                    >
                        <Flex justify="space-between" width="100%" gap={3}>
                            <Flex gap={3}>
                                <Button variant="outline" onClick={onClose} size="lg" px={6} fontWeight="semibold">
                                    Cancel
                                </Button>
                                {formState === 'edit' && itemId && (
                                    <Button variant="outline" colorScheme="red" onClick={handleDelete} size="lg" px={6} fontWeight="semibold">
                                        Delete
                                    </Button>
                                )}
                            </Flex>
                            <Button type="submit" colorScheme="blue" disabled={!hasChanges} size="lg" px={8} fontWeight="bold">
                                {formState === 'new' ? '✨ Create' : '💾 Update'}
                            </Button>
                        </Flex>
                    </DrawerFooter>
                </Box>
            </DrawerContent>
        </DrawerRoot>
    )
}
