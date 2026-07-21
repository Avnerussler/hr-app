import { useState } from 'react'
import { Badge, Box, Table, Text, VStack } from '@chakra-ui/react'
import { PageHeader } from '@/components/common/PageHeader'
import { useSettingListQuery, SettingRecord } from '@/hooks/queries/useSettingQueries'
import { SettingDialog } from '@/components/Settings/SettingDialog'

// End users only edit an existing setting's options/active status — settings themselves
// are pre-created by the backend (see apps/server/src/migrations/seedSettings), so this
// page has no "new"/"delete" actions, only a list that opens an edit dialog per row.
export function SettingsListPage() {
    const { data: settings = [], isLoading } = useSettingListQuery()

    const [editingSetting, setEditingSetting] = useState<SettingRecord | undefined>(undefined)

    const handleDialogClose = () => {
        setEditingSetting(undefined)
    }

    return (
        <Box display="flex" flexDirection="column" h="full">
            <PageHeader
                title="הגדרות"
                description="ניהול רשימות בחירה (selects) הנמצאות בשימוש בטפסים"
            />

            <VStack align="stretch" gap={4} w="full" flex="1" overflow="auto">
                {!isLoading && settings.length === 0 && (
                    <Text color="muted.foreground">אין הגדרות עדיין</Text>
                )}

                {!isLoading && settings.length > 0 && (
                    <Table.Root variant="outline">
                        <Table.Header>
                            <Table.Row>
                                <Table.ColumnHeader>תווית</Table.ColumnHeader>
                                <Table.ColumnHeader>קטגוריה</Table.ColumnHeader>
                                <Table.ColumnHeader>אפשרויות</Table.ColumnHeader>
                                <Table.ColumnHeader>סטטוס</Table.ColumnHeader>
                            </Table.Row>
                        </Table.Header>
                        <Table.Body>
                            {settings.map((setting) => (
                                <Table.Row
                                    key={setting._id}
                                    onClick={() => setEditingSetting(setting)}
                                    cursor="pointer"
                                    _hover={{ bg: 'sidebar.accent' }}
                                >
                                    <Table.Cell>{setting.label}</Table.Cell>
                                    <Table.Cell>{setting.category || '—'}</Table.Cell>
                                    <Table.Cell>{setting.options.length}</Table.Cell>
                                    <Table.Cell>
                                        <Badge colorPalette={setting.isActive ? 'green' : 'gray'}>
                                            {setting.isActive ? 'פעיל' : 'לא פעיל'}
                                        </Badge>
                                    </Table.Cell>
                                </Table.Row>
                            ))}
                        </Table.Body>
                    </Table.Root>
                )}
            </VStack>

            <SettingDialog isOpen={!!editingSetting} onClose={handleDialogClose} setting={editingSetting} />
        </Box>
    )
}
