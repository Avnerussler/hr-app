import { VStack, HStack, Button, Text, Box } from '@chakra-ui/react'
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
import { NativeSelectRoot, NativeSelectField } from '../ui/native-select'
import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { format } from 'date-fns'

interface HolidayFormData {
    date: string
    endDate?: string
    name: string
    description?: string
}

interface HolidayModalProps {
    isOpen: boolean
    onClose: () => void
    onSave: (holiday: HolidayFormData) => void
    selectedDate?: string
    dateRange?: { start: string; end: string }
}

export function HolidayModal({ isOpen, onClose, onSave, selectedDate, dateRange }: HolidayModalProps) {
    const {
        register,
        handleSubmit,
        reset,
        watch,
        setValue,
        formState: { errors, isValid }
    } = useForm<HolidayFormData>()
    
    const [isLoading, setIsLoading] = useState(false)
    const [hasEndDate, setHasEndDate] = useState(false)

    // Reset form when modal opens/closes
    useEffect(() => {
        if (isOpen) {
            const isRange = Boolean(dateRange)
            setHasEndDate(isRange)
            reset({
                date: dateRange?.start || selectedDate || format(new Date(), 'yyyy-MM-dd'),
                endDate: dateRange?.end || '',
                name: '',
                description: ''
            })
        }
    }, [isOpen, reset, selectedDate, dateRange])

    const onSubmit = async (data: HolidayFormData) => {
        setIsLoading(true)
        try {
            await onSave(data)
            onClose()
        } catch (error) {
            console.error('Error saving holiday:', error)
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <DialogRoot 
            size="md" 
            open={isOpen} 
            onOpenChange={(details) => !details.open && onClose()}
        >
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>הוסף חג חדש</DialogTitle>
                    <DialogCloseTrigger />
                </DialogHeader>

                <form onSubmit={handleSubmit(onSubmit)}>
                    <DialogBody>
                        <VStack gap={4} align="stretch">
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
                                        required: 'תאריך החג נדרש'
                                    })}
                                    style={{
                                        width: '100%',
                                        padding: '8px 12px',
                                        border: '1px solid #E2E8F0',
                                        borderRadius: '6px',
                                        fontSize: '14px'
                                    }}
                                />
                            </Field>

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
                                            message: 'שם החג חייב להכיל לפחות 2 תווים'
                                        }
                                    })}
                                    style={{
                                        width: '100%',
                                        padding: '8px 12px',
                                        border: '1px solid #E2E8F0',
                                        borderRadius: '6px',
                                        fontSize: '14px'
                                    }}
                                />
                            </Field>

                            {/* End Date Toggle */}
                            {!dateRange && (
                                <Box>
                                    <HStack justify="space-between" mb={2}>
                                        <Text fontWeight="medium">
                                            הגדר תאריך סיום (טווח ימי חג)
                                        </Text>
                                        <Switch
                                            checked={hasEndDate}
                                            onCheckedChange={(details) => {
                                                setHasEndDate(details.checked)
                                                if (!details.checked) {
                                                    setValue('endDate', '')
                                                }
                                            }}
                                        />
                                    </HStack>
                                </Box>
                            )}

                            {/* End Date Field */}
                            {(hasEndDate || dateRange) && (
                                <Field
                                    label="תאריך סיום החג"
                                    invalid={!!errors.endDate}
                                    errorText={errors.endDate?.message}
                                    required={hasEndDate}
                                >
                                    <input
                                        type="date"
                                        {...register('endDate', {
                                            required: hasEndDate ? 'תאריך סיום נדרש' : false,
                                            validate: (value) => {
                                                const startDate = watch('date')
                                                if (hasEndDate && value && startDate && new Date(value) < new Date(startDate)) {
                                                    return 'תאריך סיום חייב להיות אחרי תאריך ההתחלה'
                                                }
                                                return true
                                            }
                                        })}
                                        style={{
                                            width: '100%',
                                            padding: '8px 12px',
                                            border: '1px solid #E2E8F0',
                                            borderRadius: '6px',
                                            fontSize: '14px'
                                        }}
                                    />
                                </Field>
                            )}

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
                                        resize: 'vertical'
                                    }}
                                />
                            </Field>

                            {/* Range Info */}
                            {dateRange && (
                                <Box
                                    p={3}
                                    bg="blue.50"
                                    borderRadius="md"
                                    borderWidth="1px"
                                    borderColor="blue.200"
                                >
                                    <Text fontSize="sm" color="blue.800">
                                        🗓️ החג יתווסף לכל הימים בטווח: {dateRange.start} עד {dateRange.end}
                                    </Text>
                                </Box>
                            )}
                        </VStack>
                    </DialogBody>

                    <DialogFooter>
                        <HStack gap={3}>
                            <Button 
                                variant="ghost" 
                                onClick={onClose}
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
                                {isLoading ? 'שומר...' : 'שמור חג'}
                            </Button>
                        </HStack>
                    </DialogFooter>
                </form>
            </DialogContent>
        </DialogRoot>
    )
}