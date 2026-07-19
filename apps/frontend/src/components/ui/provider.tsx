'use client'

import { ChakraProvider, LocaleProvider } from '@chakra-ui/react'
import { ColorModeProvider, type ColorModeProviderProps } from './color-mode'
import { system } from '@/theme'

export function Provider(props: ColorModeProviderProps) {
    return (
        <ChakraProvider value={system}>
            <LocaleProvider locale="he-IL" dir="rtl">
                <ColorModeProvider {...props} />
            </LocaleProvider>
        </ChakraProvider>
    )
}
