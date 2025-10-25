import { Button, VStack, HStack, Box } from '@chakra-ui/react'
import {
    DialogRoot,
    DialogContent,
    DialogHeader,
    DialogBody,
    DialogFooter,
    DialogTitle,
    DialogCloseTrigger,
} from '../ui/dialog'
import { useForm, SubmitHandler } from 'react-hook-form'
import { ControlledCheckboxGroup } from '../ControlledFields/ControlledCheckboxGroup'
import { ControlledSelectField } from '../ControlledFields/ControlledSelectField'
import { ControlledInputField } from '../ControlledFields/ControlledInputField'
import { useState, useEffect } from 'react'
import { FiDownload } from 'react-icons/fi'
import { exportReportsToExcel } from './utils/exportReportsToExcel'
import { useQueryClient } from '@tanstack/react-query'
import { toaster } from '../ui/toaster'

interface ReportDownloadDialogProps {
    isOpen: boolean
    onClose: () => void
}

interface ReportFormData {
    selectedReports: string[]
    timeFrame: string
    startDate: string
    endDate: string
}

// Define available reports based on backend statistics service
const AVAILABLE_REPORTS = [
    { label: 'סכימת ימי מילואים יומית', value: 'daily_summary' },
    { label: 'סכימת ימי מילואים לפי טווח תאריכים', value: 'date_range_summary' },
    { label: 'סכימה לפי פרויקטים', value: 'project_analytics' },
    { label: 'סכימת ימי מילואים חיצוניים לפי יחידות', value: 'external_by_unit' },
]

const TIME_FRAME_OPTIONS = [
    { label: 'היום', value: 'today' },
    { label: '7 ימים אחרונים', value: 'last_7_days' },
    { label: '30 ימים אחרונים', value: 'last_30_days' },
    { label: 'טווח מותאם', value: 'custom' },
]

export function ReportDownloadDialog({
    isOpen,
    onClose,
}: ReportDownloadDialogProps) {
    const [isDownloading, setIsDownloading] = useState(false)
    const queryClient = useQueryClient()

    const {
        control,
        handleSubmit,
        watch,
        setValue,
        reset,
        formState: { isValid },
    } = useForm<ReportFormData>({
        mode: 'onChange',
        defaultValues: {
            selectedReports: [],
            timeFrame: 'today',
            startDate: new Date().toISOString().split('T')[0],
            endDate: new Date().toISOString().split('T')[0],
        },
    })

    const watchedTimeFrame = watch('timeFrame')
    const watchedStartDate = watch('startDate')
    const watchedSelectedReports = watch('selectedReports')

    // Update date range based on time frame selection
    useEffect(() => {
        const today = new Date()
        const formatDate = (date: Date) => date.toISOString().split('T')[0]

        switch (watchedTimeFrame) {
            case 'today':
                setValue('startDate', formatDate(today))
                setValue('endDate', formatDate(today))
                break
            case 'last_7_days': {
                const sevenDaysAgo = new Date(today)
                sevenDaysAgo.setDate(today.getDate() - 7)
                setValue('startDate', formatDate(sevenDaysAgo))
                setValue('endDate', formatDate(today))
                break
            }
            case 'last_30_days': {
                const thirtyDaysAgo = new Date(today)
                thirtyDaysAgo.setDate(today.getDate() - 30)
                setValue('startDate', formatDate(thirtyDaysAgo))
                setValue('endDate', formatDate(today))
                break
            }
            case 'custom':
                // Keep current dates for custom range
                break
        }
    }, [watchedTimeFrame, setValue])

    const onSubmit: SubmitHandler<ReportFormData> = async (data) => {
        if (data.selectedReports.length === 0) {
            toaster.create({
                title: 'שגיאה',
                description: 'יש לבחור לפחות דוח אחד',
                type: 'error',
                duration: 5000,
            })
            return
        }

        setIsDownloading(true)
        try {
            await exportReportsToExcel({
                selectedReports: data.selectedReports,
                startDate: data.startDate,
                endDate: data.endDate,
                queryClient,
            })

            toaster.create({
                title: 'הצלחה',
                description: 'הדוחות יוצאו בהצלחה',
                type: 'success',
                duration: 5000,
            })

            handleClose()
        } catch (error) {
            console.error('Error exporting reports:', error)

            const errorMessage =
                error instanceof Error ? error.message : 'שגיאה בייצוא הדוחות'

            toaster.create({
                title: 'שגיאה',
                description: errorMessage,
                type: 'error',
                duration: 7000,
            })
        } finally {
            setIsDownloading(false)
        }
    }

    const handleClose = () => {
        reset()
        onClose()
    }

    const isCustomRange = watchedTimeFrame === 'custom'
    const hasSelectedReports = watchedSelectedReports?.length > 0

    return (
        <DialogRoot
            open={isOpen}
            onOpenChange={(details) => details.open || handleClose()}
        >
            <DialogContent maxW="lg">
                <DialogHeader>
                    <DialogTitle>הורדת דוחות לאקסל</DialogTitle>
                    <DialogCloseTrigger />
                </DialogHeader>

                <DialogBody>
                    <form onSubmit={handleSubmit(onSubmit)} id="report-form">
                        <VStack gap={6} align="stretch">
                            {/* Report Selection */}
                            <Box>
                                <ControlledCheckboxGroup
                                    control={control as any}
                                    name="selectedReports"
                                    label="בחר דוחות לייצוא"
                                    options={AVAILABLE_REPORTS}
                                />
                            </Box>

                            {/* Time Frame Selection */}
                            <Box>
                                <ControlledSelectField
                                    control={control as any}
                                    name="timeFrame"
                                    label="טווח תאריכים"
                                    options={TIME_FRAME_OPTIONS}
                                    placeholder="בחר טווח תאריכים"
                                />
                            </Box>

                            {/* Custom Date Range */}
                            {isCustomRange && (
                                <HStack gap={4} align="flex-start">
                                    <Box flex={1}>
                                        <ControlledInputField
                                            control={control as any}
                                            name="startDate"
                                            type="date"
                                            label="תאריך התחלה"
                                            required
                                            rules={{
                                                required: 'שדה חובה',
                                            }}
                                        />
                                    </Box>
                                    <Box flex={1}>
                                        <ControlledInputField
                                            control={control as any}
                                            name="endDate"
                                            type="date"
                                            label="תאריך סיום"
                                            required
                                            rules={{
                                                required: 'שדה חובה',
                                                validate: (value: string) => {
                                                    if (
                                                        value &&
                                                        watchedStartDate &&
                                                        new Date(value) <
                                                            new Date(
                                                                watchedStartDate
                                                            )
                                                    ) {
                                                        return 'תאריך סיום חייב להיות אחרי תאריך התחלה'
                                                    }
                                                    return true
                                                },
                                            }}
                                        />
                                    </Box>
                                </HStack>
                            )}
                        </VStack>
                    </form>
                </DialogBody>

                <DialogFooter>
                    <HStack gap={3} w="full" justify="space-between">
                        <Button variant="ghost" onClick={handleClose}>
                            ביטול
                        </Button>
                        <Button
                            colorScheme="blue"
                            type="submit"
                            form="report-form"
                            disabled={!isValid || !hasSelectedReports}
                            loading={isDownloading}
                        >
                            <FiDownload />
                            הורד קובץ אקסל
                        </Button>
                    </HStack>
                </DialogFooter>
            </DialogContent>
        </DialogRoot>
    )
}
