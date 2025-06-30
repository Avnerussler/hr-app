import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Provider } from '@/components/ui/provider'

import './index.css'
import './theme/globals.css'
import App from './App.tsx'
import { QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { queryClient } from './lib/queryClient.ts'
import { Toaster } from './components/ui/toaster.tsx'
// import { LocaleProvider } from '@chakra-ui/react'

createRoot(document.getElementById('root')!).render(
    <StrictMode>
        <Provider defaultTheme="light">
            {/* <LocaleProvider> */}
            <Toaster />
            <QueryClientProvider client={queryClient}>
                <App />
                <ReactQueryDevtools initialIsOpen={false} />
            </QueryClientProvider>
            {/* </LocaleProvider> */}
        </Provider>
    </StrictMode>
)
