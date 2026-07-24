import { Table } from '@tanstack/react-table'
import { Button } from '@chakra-ui/react'
import { FiColumns } from 'react-icons/fi'
import {
    MenuRoot,
    MenuTrigger,
    MenuContent,
    MenuCheckboxItem,
} from '@/components/ui/menu'

interface ColumnVisibilityMenuProps<TData> {
    table: Table<TData>
}

export const ColumnVisibilityMenu = <TData,>({
    table,
}: ColumnVisibilityMenuProps<TData>) => {
    const columns = table
        .getAllLeafColumns()
        .filter((column) => column.getCanHide())

    return (
        <MenuRoot closeOnSelect={false}>
            <MenuTrigger asChild>
                <Button
                    variant="outline"
                    size="sm"
                    bg="card"
                    borderColor="border"
                    color="foreground"
                    _hover={{ bg: 'muted' }}
                >
                    <FiColumns />
                    עמודות
                </Button>
            </MenuTrigger>
            <MenuContent>
                {columns.map((column) => (
                    <MenuCheckboxItem
                        key={column.id}
                        value={column.id}
                        checked={column.getIsVisible()}
                        onCheckedChange={() => column.toggleVisibility()}
                    >
                        {column.columnDef.meta?.label ?? column.id}
                    </MenuCheckboxItem>
                ))}
            </MenuContent>
        </MenuRoot>
    )
}
