import {
    VStack,
    HStack,
    Button,
    Text,
    Box,
    Badge,
    Flex,
    IconButton,
} from '@chakra-ui/react'
import {
    DialogRoot,
    DialogContent,
    DialogHeader,
    DialogBody,
    DialogFooter,
    DialogTitle,
    DialogCloseTrigger,
} from '../ui/dialog'
import { Field } from '../ui/field'
import { Switch } from '../ui/switch'
import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { format, eachDayOfInterval } from 'date-fns'
import { FaEdit, FaTrash, FaPlus, FaSave } from 'react-icons/fa'
import {
    getHolidaysByDate,
    addCustomHoliday,
    removeCustomHoliday,
    updateCustomHoliday,
    Holiday,
} from '@/utils/israelHolidays'

interface HolidayFormData {
    date: string
    endDate?: string
    name: string
    description?: string
}

interface HolidayManagementModalProps {
    isOpen: boolean
    onClose: () => void
    selectedDate?: string
    dateRange?: { start: string; end: string }
}

export function HolidayManagementModal({
    isOpen,
    onClose,
    selectedDate,
    dateRange,
}: HolidayManagementModalProps) {
    const [isLoading, setIsLoading] = useState(false)
    const [hasEndDate, setHasEndDate] = useState(false)
    const [editingHoliday, setEditingHoliday] = useState<Holiday | null>(null)
    const [showAddForm, setShowAddForm] = useState(false)

    const {
        register,
        handleSubmit,
        reset,
        watch,
        setValue,
        formState: { errors, isValid },
    } = useForm<HolidayFormData>()

    // Get holidays for the selected date(s)
    const getRelevantHolidays = (): Holiday[] => {
        if (dateRange) {
            const dates = eachDayOfInterval({
                start: new Date(dateRange.start),
                end: new Date(dateRange.end),
            })
            const holidayMap = new Map<string, Holiday>()
            dates.forEach((date) => {
                const dateStr = format(date, 'yyyy-MM-dd')
                getHolidaysByDate(dateStr).forEach((holiday) => {
                    holidayMap.set(holiday.id, holiday)
                })
            })
            return Array.from(holidayMap.values()).sort((a, b) =>
                a.date.localeCompare(b.date)
            )
        } else if (selectedDate) {
            return getHolidaysByDate(selectedDate)
        }
        return []
    }

    const [relevantHolidays, setRelevantHolidays] = useState<Holiday[]>([])

    // Update holidays when modal opens or date changes
    useEffect(() => {
        if (isOpen) {
            setRelevantHolidays(getRelevantHolidays())
            resetForm()
        }
    }, [isOpen, selectedDate, dateRange])

    const resetForm = () => {
        const isRange = Boolean(dateRange)
        setHasEndDate(isRange)
        setEditingHoliday(null)
        setShowAddForm(false)
        reset({
            date:
                dateRange?.start ||
                selectedDate ||
                format(new Date(), 'yyyy-MM-dd'),
            endDate: dateRange?.end || '',
            name: '',
            description: '',
        })
    }

    const handleAddHoliday = async (data: HolidayFormData) => {
        setIsLoading(true)
        try {
            if (data.endDate && data.endDate !== data.date) {
                // Create holiday for each day in range
                const dates = eachDayOfInterval({
                    start: new Date(data.date),
                    end: new Date(data.endDate),
                })
                dates.forEach((date) => {
                    addCustomHoliday({
                        date: format(date, 'yyyy-MM-dd'),
                        name: data.name,
                        nameHebrew: data.name,
                        isWorkingDay: false,
                        description: data.description,
                    })
                })
            } else {
                // Single day holiday
                addCustomHoliday({
                    date: data.date,
                    name: data.name,
                    nameHebrew: data.name,
                    isWorkingDay: false,
                    description: data.description,
                })
            }

            // Refresh holidays list
            setTimeout(() => setRelevantHolidays(getRelevantHolidays()), 100)
            setShowAddForm(false)
            resetForm()
        } catch (error) {
            console.error('Error adding holiday:', error)
        } finally {
            setIsLoading(false)
        }
    }

    const handleUpdateHoliday = async (data: HolidayFormData) => {
        if (!editingHoliday) return

        setIsLoading(true)
        try {
            updateCustomHoliday(editingHoliday.id, {
                name: data.name,
                nameHebrew: data.name,
                description: data.description,
            })

            // Refresh holidays list
            setTimeout(() => setRelevantHolidays(getRelevantHolidays()), 100)
            setEditingHoliday(null)
            resetForm()
        } catch (error) {
            console.error('Error updating holiday:', error)
        } finally {
            setIsLoading(false)
        }
    }

    const handleDeleteHoliday = async (holiday: Holiday) => {
        if (holiday.type !== 'custom') {
            alert('לא ניתן למחוק חגים מובנים')
            return
        }

        if (
            !confirm(
                `האם אתה בטוח שברצונך למחוק את החג "${holiday.nameHebrew}"?`
            )
        ) {
            return
        }

        try {
            removeCustomHoliday(holiday.id)
            setTimeout(() => setRelevantHolidays(getRelevantHolidays()), 100)
        } catch (error) {
            console.error('Error deleting holiday:', error)
        }
    }

    const handleEditHoliday = (holiday: Holiday) => {
        if (holiday.type !== 'custom') {
            alert('ניתן לערוך רק חגים מותאמים אישית')
            return
        }

        setEditingHoliday(holiday)
        setShowAddForm(true)
        setValue('name', holiday.name)
        setValue('description', holiday.description || '')
        setValue('date', holiday.date)
        setValue('endDate', '')
        setHasEndDate(false)
    }

    const onSubmit = async (data: HolidayFormData) => {
        if (editingHoliday) {
            await handleUpdateHoliday(data)
        } else {
            await handleAddHoliday(data)
        }
    }

    const getHolidayTypeColor = (type: Holiday['type']) => {
        switch (type) {
            case 'jewish':
                return 'blue'
            case 'civil':
                return 'green'
            case 'custom':
                return 'purple'
            default:
                return 'gray'
        }
    }

    const getHolidayTypeName = (type: Holiday['type']) => {
        switch (type) {
            case 'jewish':
                return 'יהודי'
            case 'civil':
                return 'אזרחי'
            case 'custom':
                return 'מותאם'
            default:
                return 'אחר'
        }
    }

    return (
        <DialogRoot
            size="lg"
            open={isOpen}
            onOpenChange={(details) => !details.open && onClose()}
        >
            <DialogContent maxH="80vh" overflow="auto">
                <DialogHeader>
                    <DialogTitle>ניהול חגים</DialogTitle>
                    <DialogCloseTrigger />
                </DialogHeader>

                <DialogBody>
                    <VStack gap={4} align="stretch">
                        {/* Date Range Info */}
                        <Box
                            p={3}
                            bg="blue.50"
                            borderRadius="md"
                            borderWidth="1px"
                            borderColor="blue.200"
                        >
                            <Text
                                fontSize="sm"
                                color="blue.800"
                                fontWeight="medium"
                            >
                                {dateRange
                                    ? `ניהול חגים לטווח: ${dateRange.start} עד ${dateRange.end}`
                                    : selectedDate
                                      ? `ניהול חגים לתאריך: ${selectedDate}`
                                      : 'ניהול חגים'}
                            </Text>
                        </Box>

                        {/* Existing Holidays List */}
                        <Box>
                            <Flex justify="space-between" align="center" mb={3}>
                                <Text fontSize="md" fontWeight="semibold">
                                    חגים קיימים ({relevantHolidays.length})
                                </Text>
                                <Button
                                    size="sm"
                                    onClick={() => setShowAddForm(!showAddForm)}
                                    variant={showAddForm ? 'outline' : 'solid'}
                                >
                                    <FaPlus />
                                    {showAddForm ? 'ביטול' : 'הוסף חג חדש'}
                                </Button>
                            </Flex>

                            {relevantHolidays.length === 0 ? (
                                <Box
                                    p={4}
                                    textAlign="center"
                                    color="gray.500"
                                    bg="gray.50"
                                    borderRadius="md"
                                >
                                    אין חגים מוגדרים לתאריכים שנבחרו
                                </Box>
                            ) : (
                                <VStack gap={2} align="stretch">
                                    {relevantHolidays.map((holiday) => (
                                        <Box
                                            key={holiday.id}
                                            p={3}
                                            bg="white"
                                            borderRadius="md"
                                            borderWidth="1px"
                                            borderColor="gray.200"
                                        >
                                            <Flex
                                                justify="space-between"
                                                align="start"
                                            >
                                                <Box flex={1}>
                                                    <Flex
                                                        align="center"
                                                        gap={2}
                                                        mb={1}
                                                    >
                                                        <Text fontWeight="semibold">
                                                            {holiday.nameHebrew}
                                                        </Text>
                                                        <Badge
                                                            colorScheme={getHolidayTypeColor(
                                                                holiday.type
                                                            )}
                                                            size="sm"
                                                        >
                                                            {getHolidayTypeName(
                                                                holiday.type
                                                            )}
                                                        </Badge>
                                                        {!holiday.isWorkingDay && (
                                                            <Badge
                                                                colorScheme="red"
                                                                size="sm"
                                                            >
                                                                יום לא עבודה
                                                            </Badge>
                                                        )}
                                                    </Flex>
                                                    <Text
                                                        fontSize="sm"
                                                        color="gray.600"
                                                        mb={1}
                                                    >
                                                        {holiday.date}
                                                    </Text>
                                                    {holiday.description && (
                                                        <Text
                                                            fontSize="sm"
                                                            color="gray.500"
                                                        >
                                                            {
                                                                holiday.description
                                                            }
                                                        </Text>
                                                    )}
                                                </Box>

                                                {holiday.type === 'custom' && (
                                                    <HStack gap={1}>
                                                        <IconButton
                                                            size="sm"
                                                            variant="ghost"
                                                            colorScheme="blue"
                                                            onClick={() =>
                                                                handleEditHoliday(
                                                                    holiday
                                                                )
                                                            }
                                                        >
                                                            <FaEdit />
                                                        </IconButton>
                                                        <IconButton
                                                            size="sm"
                                                            variant="ghost"
                                                            colorScheme="red"
                                                            onClick={() =>
                                                                handleDeleteHoliday(
                                                                    holiday
                                                                )
                                                            }
                                                        >
                                                            <FaTrash />
                                                        </IconButton>
                                                    </HStack>
                                                )}
                                            </Flex>
                                        </Box>
                                    ))}
                                </VStack>
                            )}
                        </Box>

                        {/* Add/Edit Holiday Form */}
                        {showAddForm && (
                            <Box
                                p={4}
                                bg="gray.50"
                                borderRadius="md"
                                borderWidth="1px"
                                borderColor="gray.200"
                            >
                                <form onSubmit={handleSubmit(onSubmit)}>
                                    <VStack gap={4} align="stretch">
                                        <Text
                                            fontSize="md"
                                            fontWeight="semibold"
                                        >
                                            {editingHoliday
                                                ? 'ערוך חג'
                                                : 'הוסף חג חדש'}
                                        </Text>

                                        {/* Date Field */}
                                        <Field
                                            label="תאריך החג"
                                            invalid={!!errors.date}
                                            errorText={errors.date?.message}
                                            required
                                        >
                                            <input
                                                type="date"
                                                {...register('date', {
                                                    required: 'תאריך החג נדרש',
                                                })}
                                                disabled={!!editingHoliday}
                                                style={{
                                                    width: '100%',
                                                    padding: '8px 12px',
                                                    border: '1px solid #E2E8F0',
                                                    borderRadius: '6px',
                                                    fontSize: '14px',
                                                    opacity: editingHoliday
                                                        ? 0.6
                                                        : 1,
                                                }}
                                            />
                                        </Field>

                                        {/* End Date Toggle */}
                                        {!dateRange && !editingHoliday && (
                                            <Box>
                                                <HStack
                                                    justify="space-between"
                                                    mb={2}
                                                >
                                                    <Text fontWeight="medium">
                                                        הגדר תאריך סיום (טווח
                                                        ימי חג)
                                                    </Text>
                                                    <Switch
                                                        checked={hasEndDate}
                                                        onCheckedChange={(
                                                            details
                                                        ) => {
                                                            setHasEndDate(
                                                                details.checked
                                                            )
                                                            if (
                                                                !details.checked
                                                            ) {
                                                                setValue(
                                                                    'endDate',
                                                                    ''
                                                                )
                                                            }
                                                        }}
                                                    />
                                                </HStack>
                                            </Box>
                                        )}

                                        {/* End Date Field */}
                                        {hasEndDate && !editingHoliday && (
                                            <Field
                                                label="תאריך סיום החג"
                                                invalid={!!errors.endDate}
                                                errorText={
                                                    errors.endDate?.message
                                                }
                                                required={hasEndDate}
                                            >
                                                <input
                                                    type="date"
                                                    {...register('endDate', {
                                                        required: hasEndDate
                                                            ? 'תאריך סיום נדרש'
                                                            : false,
                                                        validate: (value) => {
                                                            const startDate =
                                                                watch('date')
                                                            if (
                                                                hasEndDate &&
                                                                value &&
                                                                startDate &&
                                                                new Date(
                                                                    value
                                                                ) <
                                                                    new Date(
                                                                        startDate
                                                                    )
                                                            ) {
                                                                return 'תאריך סיום חייב להיות אחרי תאריך ההתחלה'
                                                            }
                                                            return true
                                                        },
                                                    })}
                                                    style={{
                                                        width: '100%',
                                                        padding: '8px 12px',
                                                        border: '1px solid #E2E8F0',
                                                        borderRadius: '6px',
                                                        fontSize: '14px',
                                                    }}
                                                />
                                            </Field>
                                        )}

                                        {/* Holiday Name Field */}
                                        <Field
                                            label="שם החג"
                                            invalid={!!errors.name}
                                            errorText={errors.name?.message}
                                            required
                                        >
                                            <input
                                                type="text"
                                                placeholder="הזן שם החג"
                                                {...register('name', {
                                                    required: 'שם החג נדרש',
                                                    minLength: {
                                                        value: 2,
                                                        message:
                                                            'שם החג חייב להכיל לפחות 2 תווים',
                                                    },
                                                })}
                                                style={{
                                                    width: '100%',
                                                    padding: '8px 12px',
                                                    border: '1px solid #E2E8F0',
                                                    borderRadius: '6px',
                                                    fontSize: '14px',
                                                }}
                                            />
                                        </Field>

                                        {/* Description Field (Optional) */}
                                        <Field
                                            label="תיאור (אופציונלי)"
                                            helperText="תיאור קצר של החג"
                                        >
                                            <textarea
                                                placeholder="הזן תיאור החג..."
                                                rows={3}
                                                {...register('description')}
                                                style={{
                                                    width: '100%',
                                                    padding: '8px 12px',
                                                    border: '1px solid #E2E8F0',
                                                    borderRadius: '6px',
                                                    fontSize: '14px',
                                                    resize: 'vertical',
                                                }}
                                            />
                                        </Field>

                                        {/* Form Buttons */}
                                        <HStack gap={3}>
                                            <Button
                                                variant="ghost"
                                                onClick={() => {
                                                    setShowAddForm(false)
                                                    resetForm()
                                                }}
                                                disabled={isLoading}
                                            >
                                                ביטול
                                            </Button>
                                            <Button
                                                type="submit"
                                                colorScheme="blue"
                                                loading={isLoading}
                                                disabled={!isValid || isLoading}
                                            >
                                                <FaSave />
                                                {isLoading
                                                    ? 'שומר...'
                                                    : editingHoliday
                                                      ? 'עדכן חג'
                                                      : 'שמור חג'}
                                            </Button>
                                        </HStack>
                                    </VStack>
                                </form>
                            </Box>
                        )}
                    </VStack>
                </DialogBody>

                <DialogFooter>
                    <Button variant="ghost" onClick={onClose}>
                        סגור
                    </Button>
                </DialogFooter>
            </DialogContent>
        </DialogRoot>
    )
}
