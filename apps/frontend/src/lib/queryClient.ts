import { BASE_URL } from '@/config'
import { MutationVariables } from '@/types/mutationTypes'
import { MutationFunction, QueryClient } from '@tanstack/react-query'
import axios from 'axios'

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

export const queryClient = new QueryClient({
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
