import { useMutation, useQueryClient } from '@tanstack/react-query'
import axios from 'axios'
import { BASE_URL } from '@/config'
import { toaster } from '@/components/ui/toaster'
import { Setting } from '@hr-app/shared-types'

function mapMutationError(error: unknown) {
    const err = error as { response?: { data?: { message?: string } } }
    toaster.error({
        title: 'שגיאה',
        description: err.response?.data?.message ?? 'הפעולה נכשלה. אנא נסה שוב.',
        duration: 5000,
        closable: true,
    })
}

export function useUpdateSetting() {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: async ({ id, body }: { id: string; body: Partial<Setting> }) => {
            const { data } = await axios.patch(`${BASE_URL}/settings/${id}`, body)
            return data
        },
        onSuccess: (_, { id }) => {
            queryClient.invalidateQueries({ queryKey: ['settings'] })
            queryClient.invalidateQueries({ queryKey: ['settings', 'detail', id] })
            toaster.success({ title: 'Success', description: 'ההגדרה עודכנה בהצלחה', duration: 3000, closable: true })
        },
        onError: mapMutationError,
    })
}
