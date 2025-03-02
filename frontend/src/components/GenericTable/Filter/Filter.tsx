import { Input } from '@chakra-ui/react'
import { Table } from '@tanstack/react-table'
import { ChangeEvent, FC } from 'react'
import { FormFields } from '@/types/fieldsType'

interface FilterProps {
    table: Table<FormFields>
    globalFilter: string
}
export const Filter: FC<FilterProps> = ({ globalFilter, table }) => {
    const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
        table.setGlobalFilter(String(e.target.value))
    }
    return (
        <Input
            placeholder="חפש..."
            value={globalFilter}
            onChange={handleChange}
        />
    )
}
