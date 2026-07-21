import { Control, FieldValues } from 'react-hook-form'
import { VStack } from '@chakra-ui/react'
import { ControlledRadioField } from '@/components/ControlledFields/ControlledRadioField'
import { SettingOptionsEditor } from './SettingOptionsEditor'
import { SettingFormValues } from './settingSchema'

const ACTIVE_STATUS_ITEMS = [
    { value: 'true', label: 'פעיל' },
    { value: 'false', label: 'לא פעיל' },
]

interface SettingFormProps {
    control: Control<SettingFormValues>
}

function useUntypedControl(control: Control<SettingFormValues>) {
    return control as unknown as Control<FieldValues>
}

// key/category/label are set up by a developer when a new select is wired to the
// Settings collection (see apps/server/src/migrations/seedSettings) — end users only
// manage the option list and whether the whole list is active.
export function SettingForm({ control: typedControl }: SettingFormProps) {
    const control = useUntypedControl(typedControl)
    return (
        <VStack gap={4} align="stretch" p={6}>
            <ControlledRadioField
                control={control}
                name="isActive"
                id="isActive"
                label="סטטוס"
                items={ACTIVE_STATUS_ITEMS}
            />
            <SettingOptionsEditor control={typedControl} />
        </VStack>
    )
}
