import { useEffect } from 'react'
import { FormProvider, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button, HStack, VStack } from '@chakra-ui/react'
import {
    DialogRoot,
    DialogContent,
    DialogHeader,
    DialogBody,
    DialogFooter,
    DialogTitle,
    DialogCloseTrigger,
} from '@/components/ui/dialog'
import { ReserveDayInfoSection } from '@/components/ReserveDay/ReserveDayForm'
import {
    ReserveDayFormSchema,
    ReserveDayFormValues,
    RESERVE_DAY_DEFAULT_VALUES,
} from '@/components/ReserveDay/reserveDaySchema'
import { useCreateReserveDay } from '@/hooks/mutations/useReserveDayMutations'

interface QuickReserveDayModalProps {
    isOpen: boolean
    onClose: () => void
    selectedDate: string
    selectedRange?: { start: string; end: string }
}

export function QuickReserveDayModal({
    isOpen,
    onClose,
    selectedDate,
    selectedRange,
}: QuickReserveDayModalProps) {
    const methods = useForm<ReserveDayFormValues>({
        resolver: zodResolver(ReserveDayFormSchema),
        defaultValues: RESERVE_DAY_DEFAULT_VALUES as ReserveDayFormValues,
    })
    const {
        control,
        handleSubmit,
        reset,
        setError,
        formState: { isValid },
    } = methods

    const createMutation = useCreateReserveDay((field, message) =>
        setError(field as keyof ReserveDayFormValues, {
            type: 'server',
            message,
        })
    )

    useEffect(() => {
        if (!isOpen) return
        const startDate = selectedRange?.start ?? selectedDate
        const endDate = selectedRange?.end ?? selectedDate
        reset({
            ...RESERVE_DAY_DEFAULT_VALUES,
            startDate,
            endDate,
        } as ReserveDayFormValues)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isOpen, selectedDate, selectedRange])

    const handleClose = () => {
        reset(RESERVE_DAY_DEFAULT_VALUES as ReserveDayFormValues)
        onClose()
    }

    const onSubmit = (data: ReserveDayFormValues) => {
        createMutation.mutate(data, { onSuccess: handleClose })
    }

    return (
        <DialogRoot
            open={isOpen}
            onOpenChange={(details) => details.open || handleClose()}
        >
            <DialogContent maxW="lg">
                <DialogHeader>
                    <DialogTitle>צור צו מילואים</DialogTitle>
                    <DialogCloseTrigger />
                </DialogHeader>

                <FormProvider {...methods}>
                    <form
                        onSubmit={handleSubmit(onSubmit)}
                        id="quick-reserve-day-form"
                    >
                        <DialogBody>
                            <VStack gap={0} align="stretch">
                                <ReserveDayInfoSection control={control} />
                            </VStack>
                        </DialogBody>

                        <DialogFooter>
                            <HStack gap={3} justify="flex-end" w="full">
                                <Button variant="ghost" onClick={handleClose}>
                                    ביטול
                                </Button>
                                <Button
                                    colorScheme="blue"
                                    type="submit"
                                    form="quick-reserve-day-form"
                                    disabled={!isValid}
                                    loading={createMutation.isPending}
                                >
                                    שמור
                                </Button>
                            </HStack>
                        </DialogFooter>
                    </form>
                </FormProvider>
            </DialogContent>
        </DialogRoot>
    )
}
