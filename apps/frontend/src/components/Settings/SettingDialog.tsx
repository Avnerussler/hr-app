import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Box, Button, Flex, Text } from '@chakra-ui/react'
import {
    DialogRoot,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogBody,
    DialogFooter,
    DialogCloseTrigger,
} from '@/components/ui/dialog'
import { SettingUpdateFormSchema, SettingFormValues } from './settingSchema'
import { SettingForm } from './SettingForm'
import { SettingRecord } from '@/hooks/queries/useSettingQueries'
import { useUpdateSetting } from '@/hooks/mutations/useSettingMutations'

interface SettingDialogProps {
    isOpen: boolean
    onClose: () => void
    setting?: SettingRecord
}

// Settings are pre-created by the backend (seeded per real select field) — end users
// only edit an existing setting's options and active status, never create/delete one.
export function SettingDialog({ isOpen, onClose, setting }: SettingDialogProps) {
    const {
        control,
        handleSubmit,
        reset,
        formState: { isDirty: hasChanges },
    } = useForm<SettingFormValues>({
        resolver: zodResolver(SettingUpdateFormSchema),
    })

    const updateMutation = useUpdateSetting()

    useEffect(() => {
        if (isOpen && setting) {
            reset(setting)
        }
    }, [isOpen, setting, reset])

    const onSubmit = (data: SettingFormValues) => {
        if (!setting) return
        updateMutation.mutate({ id: setting._id, body: data }, { onSuccess: onClose })
    }

    if (!setting) return null

    return (
        <DialogRoot size="lg" open={isOpen} onOpenChange={(e) => !e.open && onClose()} scrollBehavior="inside">
            <DialogContent maxH="80vh" overflow="auto">
                <DialogHeader>
                    <DialogTitle>{setting.label}</DialogTitle>
                    <DialogCloseTrigger />
                </DialogHeader>
                <Box as="form" onSubmit={handleSubmit(onSubmit)}>
                    <DialogBody>
                        {setting.category && (
                            <Text color="muted.foreground" fontSize="sm" mb={2}>
                                {setting.category}
                            </Text>
                        )}
                        <SettingForm control={control} />
                    </DialogBody>
                    <DialogFooter>
                        <Flex justify="flex-end" width="100%" gap={3}>
                            <Button variant="outline" onClick={onClose}>
                                ביטול
                            </Button>
                            <Button type="submit" colorScheme="blue" disabled={!hasChanges}>
                                שמור
                            </Button>
                        </Flex>
                    </DialogFooter>
                </Box>
            </DialogContent>
        </DialogRoot>
    )
}
