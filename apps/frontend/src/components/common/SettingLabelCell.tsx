import { Text } from '@chakra-ui/react'
import { useSettingOptions } from '@/hooks/queries/useSettingQueries'

interface SettingLabelCellProps {
    settingKey: string
    value: string | null | undefined
}

/** Table-cell display for a DB-driven select field: resolves the stored value to its
 * current Settings label, falling back to the raw value if the option is missing. */
export function SettingLabelCell({ settingKey, value }: SettingLabelCellProps) {
    const { options } = useSettingOptions(settingKey)
    if (!value) return <Text color="foreground">—</Text>
    const label = options.find((o) => o.value === value)?.label ?? value
    return <Text color="foreground">{label}</Text>
}
