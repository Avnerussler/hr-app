import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Provider } from '@/components/ui/provider'

import './index.css'
import App from './App.tsx'
import {
    MutationFunction,
    QueryClient,
    QueryClientProvider,
} from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import axios, { AxiosRequestConfig } from 'axios'
import { BASE_URL } from './config'

// Define the shape of the variables object
interface MutationVariables {
    url: string
    method?: AxiosRequestConfig['method']
    params?: string
    data?: unknown
}

// Default mutation function
const defaultMutationFn: MutationFunction<unknown, MutationVariables> = async (
    variables
) => {
    const { url, method = 'POST', params, data } = variables

    const response = await axios({
        method,
        baseURL: BASE_URL,
        url: params ? `${url.toLowerCase()}/${params}` : `${url.toLowerCase()}`,

        data,
    })
    return response.data
}

const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            refetchOnWindowFocus: true,
            retry: false,
            queryFn: async ({ queryKey: [url, params] }) => {
                if (typeof url === 'string') {
                    const { data } = await axios({
                        method: 'get',
                        baseURL: BASE_URL,
                        url: params
                            ? `${url.toLowerCase()}/${params}`
                            : `${url.toLowerCase()}`,
                    })

                    return data
                }
                throw new Error('Invalid QueryKey')
            },
        },
        mutations: {
            onError: (error) => {
                console.error('Mutation Error:', error)
            },
            onSuccess: () => {
                console.log('Mutation Success')
            },
            throwOnError: true,
            mutationFn: defaultMutationFn as MutationFunction<unknown, unknown>,
        },
    },
})

createRoot(document.getElementById('root')!).render(
    <StrictMode>
        <Provider>
            <QueryClientProvider client={queryClient}>
                <App />
                <ReactQueryDevtools initialIsOpen={false} />
            </QueryClientProvider>
        </Provider>
    </StrictMode>
)
