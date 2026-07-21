import { Control, Controller, useFieldArray } from 'react-hook-form'
import { Box, Button, HStack, IconButton, Input, Text, VStack } from '@chakra-ui/react'
import { FiArrowDown, FiArrowUp, FiPlus, FiTrash2 } from 'react-icons/fi'
import { Switch } from '@/components/ui/switch'
import { SettingFormValues } from './settingSchema'

interface SettingOptionsEditorProps {
    control: Control<SettingFormValues>
}

export function SettingOptionsEditor({ control }: SettingOptionsEditorProps) {
    const { fields, append, remove, move } = useFieldArray({
        control,
        name: 'options',
    })

    const handleAdd = () => {
        append({ value: '', label: '', order: fields.length, isActive: true })
    }

    const handleMoveUp = (index: number) => {
        if (index === 0) return
        move(index, index - 1)
    }

    const handleMoveDown = (index: number) => {
        if (index === fields.length - 1) return
        move(index, index + 1)
    }

    return (
        <VStack align="stretch" gap={3}>
            <HStack justify="space-between">
                <Text fontWeight="semibold">אפשרויות</Text>
                <Button size="sm" onClick={handleAdd}>
                    <FiPlus /> הוסף אפשרות
                </Button>
            </HStack>

            {fields.length === 0 && (
                <Text color="muted.foreground" fontSize="sm">
                    אין אפשרויות עדיין
                </Text>
            )}

            {fields.map((field, index) => (
                <HStack key={field.id} gap={2} align="center" data-field-name={`options.${index}`}>
                    <VStack gap={0}>
                        <IconButton
                            aria-label="Move up"
                            size="xs"
                            variant="ghost"
                            disabled={index === 0}
                            onClick={() => handleMoveUp(index)}
                        >
                            <FiArrowUp />
                        </IconButton>
                        <IconButton
                            aria-label="Move down"
                            size="xs"
                            variant="ghost"
                            disabled={index === fields.length - 1}
                            onClick={() => handleMoveDown(index)}
                        >
                            <FiArrowDown />
                        </IconButton>
                    </VStack>
                    <Controller
                        control={control}
                        name={`options.${index}.value`}
                        render={({ field: valueField }) => (
                            <Input placeholder="ערך (value)" {...valueField} />
                        )}
                    />
                    <Controller
                        control={control}
                        name={`options.${index}.label`}
                        render={({ field: labelField }) => (
                            <Input placeholder="תווית (label)" {...labelField} />
                        )}
                    />
                    <Box>
                        <Controller
                            control={control}
                            name={`options.${index}.isActive`}
                            render={({ field: activeField }) => (
                                <Switch
                                    checked={activeField.value}
                                    onCheckedChange={(e) => activeField.onChange(e.checked)}
                                >
                                    פעיל
                                </Switch>
                            )}
                        />
                    </Box>
                    <IconButton
                        aria-label="Delete option"
                        size="sm"
                        variant="ghost"
                        colorScheme="red"
                        onClick={() => remove(index)}
                    >
                        <FiTrash2 />
                    </IconButton>
                </HStack>
            ))}
        </VStack>
    )
}
