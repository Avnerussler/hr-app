import { useEffect, useMemo } from 'react'
import { FormProvider, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Box, Button, Flex, Heading, Badge, VStack } from '@chakra-ui/react'
import { IoClose } from 'react-icons/io5'
import { DrawerRoot, DrawerContent, DrawerHeader, DrawerBody, DrawerFooter } from '@/components/ui/drawer'
import { IconButton } from '@chakra-ui/react'
import { useRouteContext } from '@/hooks/useRouteContext'
import { ReserveDayInfoSection } from './ReserveDayForm'
import {
    buildReserveDayFormSchema,
    ReserveDayFormValues,
    RESERVE_DAY_DEFAULT_VALUES,
    ReserveDaySelectFieldKey,
} from './reserveDaySchema'
import { useReserveDayDetailQuery } from '@/hooks/queries/useReserveDayQueries'
import { useSettingOptions } from '@/hooks/queries/useSettingQueries'
import { useCreateReserveDay, useUpdateReserveDay, useDeleteReserveDay } from '@/hooks/mutations/useReserveDayMutations'

interface ReserveDayDrawerProps {
    isOpen: boolean
    onClose: () => void
}

export function ReserveDayDrawer({ isOpen, onClose }: ReserveDayDrawerProps) {
    const { formState, itemId } = useRouteContext()
    const { data: reserveDay } = useReserveDayDetailQuery(formState === 'edit' ? itemId : undefined)

    const fundingSource = useSettingOptions('fundingSource')
    const orderType = useSettingOptions('orderType')
    const requestStatus = useSettingOptions('requestStatus')
    const baseAccessApproval = useSettingOptions('baseAccessApproval')

    const selectOptions: Record<ReserveDaySelectFieldKey, { value: string; label: string }[]> = useMemo(
        () => ({
            fundingSource: fundingSource.options,
            orderType: orderType.options,
            requestStatus: requestStatus.options,
            baseAccessApproval: baseAccessApproval.options,
        }),
        [fundingSource.options, orderType.options, requestStatus.options, baseAccessApproval.options]
    )

    const allowedSelectValues: Record<ReserveDaySelectFieldKey, string[]> = useMemo(
        () => ({
            fundingSource: fundingSource.allowedValues,
            orderType: orderType.allowedValues,
            requestStatus: requestStatus.allowedValues,
            baseAccessApproval: baseAccessApproval.allowedValues,
        }),
        [fundingSource.allowedValues, orderType.allowedValues, requestStatus.allowedValues, baseAccessApproval.allowedValues]
    )

    const methods = useForm<ReserveDayFormValues>({
        resolver: zodResolver(buildReserveDayFormSchema(allowedSelectValues)),
        defaultValues: RESERVE_DAY_DEFAULT_VALUES,
    })
    const {
        control,
        handleSubmit,
        reset,
        setError,
        formState: { isDirty: hasChanges },
    } = methods

    const createMutation = useCreateReserveDay((field, message) =>
        setError(field as keyof ReserveDayFormValues, { type: 'server', message })
    )
    const updateMutation = useUpdateReserveDay((field, message) =>
        setError(field as keyof ReserveDayFormValues, { type: 'server', message })
    )
    const deleteMutation = useDeleteReserveDay()

    useEffect(() => {
        if (formState === 'edit' && reserveDay) {
            reset({
                ...reserveDay,
                employeeName: reserveDay.employeeName?._id ?? '',
            } as unknown as ReserveDayFormValues)
        } else if (formState === 'new') {
            reset(RESERVE_DAY_DEFAULT_VALUES as ReserveDayFormValues)
        }
    }, [formState, reserveDay, reset])

    const onSubmit = (data: ReserveDayFormValues) => {
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

    const employeeDisplay = reserveDay?.employeeName
        ? `${reserveDay.employeeName.firstName} ${reserveDay.employeeName.lastName}`
        : ''

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
                                {formState === 'new' ? 'צווי מילואים' : employeeDisplay}
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
                <FormProvider {...methods}>
                    <Box as="form" onSubmit={handleSubmit(onSubmit)} display="flex" flexDirection="column" flex="1" overflow="hidden">
                        <DrawerBody bg="white" _dark={{ bg: 'gray.800' }} p={0} flex="1" overflow="auto">
                            <VStack gap={0} align="stretch">
                                <ReserveDayInfoSection
                                    control={control}
                                    excludeId={formState === 'edit' ? itemId : undefined}
                                    selectOptions={selectOptions}
                                />
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
                </FormProvider>
            </DrawerContent>
        </DrawerRoot>
    )
}
