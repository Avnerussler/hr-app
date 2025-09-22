import { Button, VStack, HStack, Text, Box } from '@chakra-ui/react'
import {
    DialogRoot,
    DialogContent,
    DialogHeader,
    DialogBody,
    DialogFooter,
    DialogTitle,
    DialogCloseTrigger,
} from '../ui/dialog'
import { Switch } from '../ui/switch'
import { useState, useEffect } from 'react'
import { useForm, SubmitHandler } from 'react-hook-form'
import { format } from 'date-fns'
import { he } from 'date-fns/locale'
import { ControlledInputField } from '../ControlledFields/ControlledInputField'
import { ControlledDateField } from '../ControlledFields/ControlledDateField'
import { ControlledTextareaField } from '../ControlledFields/ControlledTextareaField'
import {
    useCreateQuotaRange,
    useUpdateQuota,
    useDeleteQuota,
} from '@/hooks/mutations'
import { DailyQuota } from '@/types/workHoursType'

interface QuotaModalProps {
    isOpen: boolean
    onClose: () => void
    selectedDate: string
    selectedRange?: { start: string; end: string }
    existingQuota: DailyQuota
}

interface QuotaFormData {
    quota: number
    startDate: string
    endDate: string
    notes: string
}

export function QuotaModal({
    isOpen,
    onClose,
    selectedDate,
    selectedRange,
    existingQuota,
}: QuotaModalProps) {
    const [hasEndDate, setHasEndDate] = useState(false)
    const createQuotaMutation = useCreateQuotaRange()
    const updateQuotaMutation = useUpdateQuota()
    const deleteQuotaMutation = useDeleteQuota()
    const isEditing = Boolean(existingQuota._id) // Check if _id exists to determine if it's editing

    const {
        control,
        handleSubmit,
        reset,
        watch,
        setValue,
        formState: { isValid },
    } = useForm<QuotaFormData>({
        mode: 'onChange',
        defaultValues: {
            quota: existingQuota.quota || 0,
            startDate:
                selectedDate ||
                existingQuota.date ||
                format(new Date(), 'yyyy-MM-dd'),
            endDate: '',
            notes: existingQuota.notes || '',
        },
    })

    const watchedStartDate = watch('startDate')
    const watchedEndDate = watch('endDate')

    useEffect(() => {
        if (selectedDate || existingQuota || selectedRange) {
            setValue(
                'startDate',
                selectedRange?.start ||
                    selectedDate ||
                    existingQuota.date ||
                    format(new Date(), 'yyyy-MM-dd')
            )
            setValue('endDate', selectedRange?.end || '')
            setValue('quota', existingQuota.quota || 0)
            setValue('notes', existingQuota.notes || '')
            setHasEndDate(Boolean(selectedRange?.end))
        }
    }, [selectedDate, selectedRange, existingQuota, setValue])

    const onSubmit: SubmitHandler<QuotaFormData> = async (data) => {
        try {
            if (isEditing && existingQuota) {
                // Update existing quota
                await updateQuotaMutation.mutateAsync({
                    id: existingQuota._id,
                    quota: data.quota,
                    notes: data.notes.trim() || undefined,
                })
            } else {
                // Create new quota(s)
                await createQuotaMutation.mutateAsync({
                    startDate: data.startDate,
                    endDate: hasEndDate ? data.endDate : undefined,
                    quota: data.quota,
                    notes: data.notes.trim() || undefined,
                    createdBy: 'current-user', // TODO: Get from user context
                })
            }
            handleClose()
        } catch (error) {
            // Error is handled by the mutation hook
            console.error('Error saving quota:', error)
        }
    }

    const handleDelete = async () => {
        if (isEditing && existingQuota) {
            try {
                await deleteQuotaMutation.mutateAsync(existingQuota._id)
                handleClose()
            } catch (error) {
                console.error('Error deleting quota:', error)
            }
        }
    }

    const handleClose = () => {
        reset()
        setHasEndDate(false)
        onClose()
    }

    const formatDateForDisplay = (dateStr: string) => {
        if (!dateStr) return ''
        try {
            return format(new Date(dateStr), 'dd/MM/yyyy', { locale: he })
        } catch {
            return dateStr
        }
    }

    return (
        <DialogRoot
            open={isOpen}
            onOpenChange={(details) => details.open || handleClose()}
        >
            <DialogContent maxW="md">
                <DialogHeader>
                    <DialogTitle>
                        {isEditing ? 'עריכת כמות יומית' : 'קביעת כמות יומית'}
                    </DialogTitle>
                    <DialogCloseTrigger />
                </DialogHeader>

                <DialogBody>
                    <form onSubmit={handleSubmit(onSubmit)} id="quota-form">
                        <VStack gap={4} align="stretch">
                            <ControlledInputField
                                control={control as any}
                                name="quota"
                                label="כמות מותרת"
                                type="number"
                                min={1}
                                max={10000}
                                placeholder="הכנס כמות..."
                                required
                                rules={{
                                    required: 'שדה חובה',
                                    min: {
                                        value: 1,
                                        message: 'כמות חייבת להיות לפחות 1',
                                    },
                                    max: {
                                        value: 10000,
                                        message:
                                            'כמות לא יכולה לעלות על 10,000',
                                    },
                                    valueAsNumber: true,
                                }}
                            />

                            {!isEditing && (
                                <ControlledDateField
                                    control={control as any}
                                    name="startDate"
                                    label="תאריך התחלה"
                                    required
                                    rules={{
                                        required: 'שדה חובה',
                                    }}
                                    helperText="הכמות תיושם החל מתאריך זה (ברירת המחדל: היום)"
                                />
                            )}

                            {!isEditing && (
                                <>
                                    <Box>
                                        <HStack justify="space-between" mb={2}>
                                            <Text fontWeight="medium">
                                                הגדר תאריך סיום
                                            </Text>
                                            <Switch
                                                checked={hasEndDate}
                                                onCheckedChange={(details) => {
                                                    setHasEndDate(
                                                        details.checked
                                                    )
                                                    if (!details.checked) {
                                                        setValue('endDate', '')
                                                    }
                                                }}
                                            />
                                        </HStack>
                                    </Box>

                                    {hasEndDate && (
                                        <ControlledDateField
                                            control={control as any}
                                            name="endDate"
                                            label="תאריך סיום"
                                            rules={{
                                                required: hasEndDate
                                                    ? 'שדה חובה כאשר מוגדר תאריך סיום'
                                                    : false,
                                                validate: (value: string) => {
                                                    if (
                                                        hasEndDate &&
                                                        value &&
                                                        watchedStartDate &&
                                                        new Date(value) <
                                                            new Date(
                                                                watchedStartDate
                                                            )
                                                    ) {
                                                        return 'תאריך סיום חייב להיות אחרי תאריך ההתחלה'
                                                    }
                                                    return true
                                                },
                                            }}
                                            helperText="אם לא מוגדר, הכמות תיושם לזמן בלתי מוגבל"
                                        />
                                    )}
                                </>
                            )}

                            <ControlledTextareaField
                                control={control as any}
                                name="notes"
                                label="הערות (אופציונלי)"
                                placeholder="הכנס הערות או הסבר על הכמות..."
                                rows={3}
                                rules={{
                                    maxLength: {
                                        value: 500,
                                        message:
                                            'הערות לא יכולות לעלות על 500 תווים',
                                    },
                                }}
                            />

                            {!isEditing && (
                                <Box
                                    p={3}
                                    bg="blue.50"
                                    borderRadius="md"
                                    borderWidth="1px"
                                    borderColor="blue.200"
                                >
                                    <Text fontSize="sm" color="blue.800">
                                        💡 הכמות תוגדר עבור כל הימים בטווח
                                        התאריכים שנבחר
                                        {hasEndDate && watchedEndDate
                                            ? ` (${formatDateForDisplay(watchedStartDate)} - ${formatDateForDisplay(watchedEndDate)})`
                                            : ` (החל מ-${formatDateForDisplay(watchedStartDate)} ללא הגבלת זמן)`}
                                    </Text>
                                </Box>
                            )}

                            {isEditing && existingQuota && (
                                <Box
                                    p={3}
                                    bg="orange.50"
                                    borderRadius="md"
                                    borderWidth="1px"
                                    borderColor="orange.200"
                                >
                                    <Text fontSize="sm" color="orange.800">
                                        ✏️ עורך כמות עבור תאריך{' '}
                                        {formatDateForDisplay(
                                            existingQuota.date
                                        )}
                                    </Text>
                                </Box>
                            )}
                        </VStack>
                    </form>
                </DialogBody>

                <DialogFooter>
                    <HStack gap={3} w="full" justify="space-between">
                        <HStack gap={3}>
                            <Button variant="ghost" onClick={handleClose}>
                                ביטול
                            </Button>
                            {isEditing && (
                                <Button
                                    variant="outline"
                                    colorScheme="red"
                                    onClick={handleDelete}
                                    loading={deleteQuotaMutation.isPending}
                                >
                                    מחק כמות
                                </Button>
                            )}
                        </HStack>
                        <Button
                            colorScheme="blue"
                            type="submit"
                            form="quota-form"
                            disabled={!isValid}
                            loading={
                                createQuotaMutation.isPending ||
                                updateQuotaMutation.isPending
                            }
                        >
                            {isEditing ? 'עדכן כמות' : 'שמור כמות'}
                        </Button>
                    </HStack>
                </DialogFooter>
            </DialogContent>
        </DialogRoot>
    )
}
