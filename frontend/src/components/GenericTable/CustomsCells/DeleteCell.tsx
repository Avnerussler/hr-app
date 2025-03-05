import { FormFields } from '@/types/fieldsType'
import { Button } from '@chakra-ui/react'
import { ColumnHelper } from '@tanstack/react-table'

interface deleteCellProps {
    onClick: (id: string) => void
    columnHelper: ColumnHelper<FormFields>
}
export const DeleteCell = ({ columnHelper, onClick }: deleteCellProps) => {
    return columnHelper.display({
        id: 'delete',
        header: 'מחיקה',
        cell: (info) => {
            return (
                <Button
                    onClick={() => onClick(info.row.id)}
                    variant="outline"
                    colorScheme="red"
                >
                    מחיקה
                </Button>
            )
        },
    })
}
