import { useEffect, useState } from 'react'
import { FieldErrors, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Box, Button, Flex, Heading, Badge, Tabs } from '@chakra-ui/react'
import { IoClose } from 'react-icons/io5'
import { DrawerRoot, DrawerContent, DrawerHeader, DrawerBody, DrawerFooter } from '@/components/ui/drawer'
import { IconButton } from '@chakra-ui/react'
import { useRouteContext } from '@/hooks/useRouteContext'
import {
    PersonalInformationSection,
    MilitaryInformationSection,
    AttendanceHistorySection,
    ProfessionalInformationSection,
} from './PersonnelForm'
import { PersonnelFormSchema, PersonnelFormValues, PERSONNEL_DEFAULT_VALUES } from './personnelSchema'
import { usePersonnelDetailQuery } from '@/hooks/queries/usePersonnelQueries'
import { useCreatePersonnel, useUpdatePersonnel, useDeletePersonnel } from '@/hooks/mutations/usePersonnelMutations'

const SECTIONS = [
    { id: 'personalInformation', name: 'מידע אישי', Component: PersonalInformationSection },
    { id: 'militaryInformation', name: 'מידע צבאי', Component: MilitaryInformationSection },
    { id: 'attendanceHistory', name: 'היסטוריית נוכחות', Component: AttendanceHistorySection },
    { id: 'professionalInformation', name: 'מידע מקצועי', Component: ProfessionalInformationSection },
]

const FIELD_TO_SECTION: Record<string, string> = {
    firstName: 'personalInformation',
    lastName: 'personalInformation',
    userId: 'personalInformation',
    personalNumber: 'personalInformation',
    phone: 'personalInformation',
    email: 'personalInformation',
    city: 'personalInformation',
    linkedin: 'personalInformation',
    vehicleNumber: 'personalInformation',
    note: 'personalInformation',
    isActive: 'personalInformation',

    reserveUnit: 'militaryInformation',
    studioRole: 'militaryInformation',
    reserveRole: 'militaryInformation',
    directBoss: 'militaryInformation',
    rank: 'militaryInformation',
    classificationClass: 'militaryInformation',
    canBeRecited: 'militaryInformation',
    reserveCategory: 'militaryInformation',
    assignedProjects: 'militaryInformation',
    vehicleEntry: 'militaryInformation',

    attendanceHistory: 'attendanceHistory',

    degree: 'professionalInformation',
    university: 'professionalInformation',
    studyArea: 'professionalInformation',
    yearOfGradation: 'professionalInformation',
    workExperience: 'professionalInformation',
    talentAndSkills: 'professionalInformation',
    referralSource: 'professionalInformation',
    fieldOfExpertise: 'professionalInformation',
    experience: 'professionalInformation',
    workPlace: 'professionalInformation',
    currentPosition: 'professionalInformation',
    resumeFileUrl: 'professionalInformation',
}

interface PersonnelDrawerProps {
    isOpen: boolean
    onClose: () => void
}

export function PersonnelDrawer({ isOpen, onClose }: PersonnelDrawerProps) {
    const { formState, itemId } = useRouteContext()
    const { data: personnel } = usePersonnelDetailQuery(formState === 'edit' ? itemId : undefined)
    const [activeTab, setActiveTab] = useState<string>(SECTIONS[0].id)

    const {
        control,
        handleSubmit,
        reset,
        setError,
        formState: { isDirty: hasChanges },
    } = useForm<PersonnelFormValues>({
        resolver: zodResolver(PersonnelFormSchema),
        defaultValues: PERSONNEL_DEFAULT_VALUES,
    })

    const createMutation = useCreatePersonnel((field, message) =>
        setError(field as keyof PersonnelFormValues, { type: 'server', message })
    )
    const updateMutation = useUpdatePersonnel((field, message) =>
        setError(field as keyof PersonnelFormValues, { type: 'server', message })
    )
    const deleteMutation = useDeletePersonnel()

    useEffect(() => {
        if (formState === 'edit' && personnel) {
            reset({
                ...personnel,
                assignedProjects: personnel.assignedProjects?._id ?? null,
            } as PersonnelFormValues)
        } else if (formState === 'new') {
            reset(PERSONNEL_DEFAULT_VALUES)
        }
    }, [formState, personnel, reset])

    const onSubmit = (data: PersonnelFormValues) => {
        if (itemId) {
            updateMutation.mutate({ id: itemId, body: data }, { onSuccess: onClose })
            return
        }
        createMutation.mutate(data, { onSuccess: onClose })
    }

    const onError = (formErrors: FieldErrors<PersonnelFormValues>) => {
        const firstErrorField = Object.keys(formErrors)[0]
        const section = firstErrorField && FIELD_TO_SECTION[firstErrorField]
        if (!section) return

        setActiveTab(section)
        setTimeout(() => {
            const target = document.querySelector(`[data-field-name="${firstErrorField}"]`)
            target?.scrollIntoView({ behavior: 'smooth', block: 'center' })
        }, 50)
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
                        <Flex align="center" gap={2}>
                            <Heading size="lg" fontWeight="bold" color="gray.900" _dark={{ color: 'white' }}>
                                {formState === 'new' ? 'משאבי אנוש' : personnel ? `${personnel.firstName} ${personnel.lastName}` : ''}
                            </Heading>
                            {formState === 'new' && (
                                <Badge colorScheme="green" variant="solid" px={2} py={0.5} borderRadius="md" fontSize="xs">
                                    NEW
                                </Badge>
                            )}
                        </Flex>
                        <IconButton aria-label="Close drawer" onClick={onClose} variant="ghost" size="sm">
                            <IoClose />
                        </IconButton>
                    </Flex>
                </DrawerHeader>
                <Box as="form" onSubmit={handleSubmit(onSubmit, onError)} display="flex" flexDirection="column" flex="1" overflow="hidden">
                    <DrawerBody bg="white" _dark={{ bg: 'gray.800' }} p={0} flex="1" overflow="hidden">
                        <Tabs.Root value={activeTab} onValueChange={(e) => setActiveTab(e.value)}>
                            <Tabs.List position="sticky">
                                {SECTIONS.map((section) => (
                                    <Tabs.Trigger key={section.id} value={section.id} px={5} py={3}>
                                        {section.name}
                                    </Tabs.Trigger>
                                ))}
                                <Tabs.Indicator />
                            </Tabs.List>
                            {SECTIONS.map((section) => (
                                <Tabs.Content
                                    key={section.id}
                                    value={section.id}
                                    flex="1"
                                    overflowY="auto"
                                    maxH="calc(100vh - 190px)"
                                    minH="calc(100vh - 190px)"
                                >
                                    <section.Component control={control} />
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
