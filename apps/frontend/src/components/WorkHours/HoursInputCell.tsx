import React, { useEffect } from 'react'
import {
    VStack,
    HStack,
    Text,
    Button,
    Badge,
    Box,
    useDisclosure,
} from '@chakra-ui/react'
import { PopoverRoot, PopoverTrigger, PopoverContent } from '../ui/popover'
import { FaComment, FaProjectDiagram } from 'react-icons/fa'
import { useForm } from 'react-hook-form'
import { ControlledInputField } from '../ControlledFields/ControlledInputField'
import { ControlledSelectField } from '../ControlledFields/ControlledSelectField'
import { ControlledTextareaField } from '../ControlledFields/ControlledTextareaField'

interface Project {
    id: string
    name: string
}

interface HoursFormData {
    hours: number
    projectId: string
    notes: string
}

interface HoursInputCellProps {
    employeeName: string
    date: Date
    initialHours: number
    initialProjectId?: string
    initialNotes?: string
    projects: Project[]
    onChange: (hours: number, projectId?: string, notes?: string) => void
}

export const HoursInputCell: React.FC<HoursInputCellProps> = ({
    employeeName,
    date,
    initialHours,
    initialProjectId,
    initialNotes,
    projects,
    onChange,
}) => {
    const { open, onOpen, onClose } = useDisclosure()

    const { control, watch, reset, handleSubmit } = useForm<HoursFormData>({
        defaultValues: {
            hours: initialHours,
            projectId: initialProjectId || '',
            notes: initialNotes || '',
        },
    })

    const watchedValues = watch()

    // Convert projects to options format for ControlledSelectField
    const projectOptions = projects.map((project) => ({
        label: project.name,
        value: project.id,
    }))

    // Update form values when props change
    useEffect(() => {
        reset({
            hours: initialHours,
            projectId: initialProjectId || '',
            notes: initialNotes || '',
        })
    }, [initialHours, initialProjectId, initialNotes, reset])

    // Trigger onChange when hours change (immediate for hours input)
    useEffect(() => {
        try {
            if (watchedValues.hours !== initialHours) {
                // Validate hours before sending
                const hours = parseFloat(watchedValues.hours)
                if (!isNaN(hours) && hours >= 0 && hours <= 24) {
                    onChange(
                        hours,
                        watchedValues.projectId || undefined,
                        watchedValues.notes || undefined
                    )
                }
            }
        } catch (error) {
            console.error('Error updating hours:', error)
        }
    }, [watchedValues.hours])

    // Handle save for popover changes (project and notes)
    const onSubmit = (data: HoursFormData) => {
        try {
            // Validate hours before saving
            const hours = parseFloat(data.hours.toString())
            if (isNaN(hours) || hours < 0 || hours > 24) {
                console.error('Invalid hours value:', data.hours)
                return
            }

            onChange(
                hours,
                data.projectId || undefined,
                data.notes || undefined
            )
            onClose()
        } catch (error) {
            console.error('Error submitting hours data:', error)
        }
    }

    // Get selected project name for display
    const selectedProject = projects.find(
        (p) => p.id === watchedValues.projectId
    )

    // Check if there are changes
    const hasChanges =
        watchedValues.hours !== initialHours ||
        watchedValues.projectId !== (initialProjectId || '') ||
        watchedValues.notes !== (initialNotes || '')

    // Format date for display
    const formatDate = (date: Date) => {
        return date.toLocaleDateString('he-IL', {
            day: 'numeric',
            month: 'short',
        })
    }

    return (
        <Box position="relative" w="full">
            {/* Hours Input - Always visible */}
            <Box textAlign="center" mb={1}>
                <ControlledInputField
                    control={control}
                    name="hours"
                    type="number"
                    min={0}
                    max={24}
                    step="0.5"
                    size="sm"
                    textAlign="center"
                    fontWeight={watchedValues.hours > 0 ? 'bold' : 'normal'}
                    bg={watchedValues.hours > 0 ? 'green.50' : 'gray.50'}
                    borderColor={
                        watchedValues.hours > 0 ? 'green.300' : 'gray.300'
                    }
                    w="60px"
                    placeholder="0"
                    rules={{
                        min: { value: 0, message: 'מינימום 0 שעות' },
                        max: { value: 24, message: 'מקסימום 24 שעות' },
                        validate: (value: number) => {
                            if (value < 0 || value > 24) {
                                return 'שעות חייבות להיות בין 0 ל-24'
                            }
                            return true
                        },
                    }}
                />
            </Box>

            {/* Project and Notes Indicators */}
            {(selectedProject || watchedValues.notes) && (
                <HStack justify="center" gap={1} mb={1}>
                    {selectedProject && (
                        <Badge size="sm" colorScheme="blue" fontSize="xs">
                            <FaProjectDiagram />
                        </Badge>
                    )}
                    {watchedValues.notes && (
                        <Badge size="sm" colorScheme="purple" fontSize="xs">
                            <FaComment />
                        </Badge>
                    )}
                </HStack>
            )}

            {/* Popover for Project and Notes */}
            <PopoverRoot
                open={open}
                onOpenChange={({ open: isOpen }) =>
                    isOpen ? onOpen() : onClose()
                }
                positioning={{ placement: 'bottom' }}
            >
                <PopoverTrigger asChild>
                    <Button
                        variant="ghost"
                        size="xs"
                        w="full"
                        h="auto"
                        p={1}
                        fontSize="xs"
                        opacity={0.7}
                        _hover={{ opacity: 1, bg: 'gray.100' }}
                    >
                        פרטים
                    </Button>
                </PopoverTrigger>

                <PopoverContent p={4} minW="300px">
                    <VStack align="stretch" gap={4}>
                        <Box>
                            <Text fontSize="sm" fontWeight="bold" mb={2}>
                                {employeeName} - {formatDate(date)}
                            </Text>
                        </Box>

                        {/* Project Selection */}
                        <Box>
                            <ControlledSelectField
                                control={control}
                                name="projectId"
                                label="פרויקט"
                                placeholder="בחר פרויקט"
                                options={projectOptions}
                                size="sm"
                            />
                        </Box>

                        {/* Notes */}
                        <Box>
                            <ControlledTextareaField
                                control={control}
                                name="notes"
                                label="הערות"
                                placeholder="הוסף הערות..."
                                rows={3}
                                size="sm"
                            />
                        </Box>

                        {/* Action Buttons */}
                        <HStack justify="end" gap={2}>
                            <Button size="sm" variant="ghost" onClick={onClose}>
                                ביטול
                            </Button>
                            <Button
                                size="sm"
                                colorScheme="blue"
                                onClick={handleSubmit(onSubmit)}
                                disabled={!hasChanges}
                            >
                                שמור
                            </Button>
                        </HStack>
                    </VStack>
                </PopoverContent>
            </PopoverRoot>

            {/* Change indicator */}
            {hasChanges && (
                <Box
                    position="absolute"
                    top={-1}
                    right={-1}
                    w={2}
                    h={2}
                    bg="orange.400"
                    borderRadius="full"
                />
            )}
        </Box>
    )
}
