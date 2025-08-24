import { Box, VStack, Text, Button, Alert } from '@chakra-ui/react'
import { FiAlertCircle, FiRefreshCw, FiHome } from 'react-icons/fi'
import {
    useRouteError,
    useNavigate,
    isRouteErrorResponse,
} from 'react-router-dom'

type NormalizedError = {
    status: number
    statusText: string
    message: string
    stack: string
}

function normalizeError(err: unknown): NormalizedError {
    if (isRouteErrorResponse(err)) {
        const msg =
            (typeof err.data === 'object' && err.data && 'message' in err.data
                ? String(err.data.message)
                : '') || ''
        return {
            status: err.status ?? 0,
            statusText: err.statusText ?? '',
            message: msg,
            stack: '',
        }
    }
    if (err instanceof Error) {
        return {
            status: 0,
            statusText: '',
            message: err.message ?? '',
            stack: err.stack ?? '',
        }
    }
    if (typeof err === 'object' && err !== null) {
        const e = err as {
            status?: number
            statusText?: string
            message?: string
            stack?: string
        }
        return {
            status: e.status ?? 0,
            statusText: e.statusText ?? '',
            message: e.message ?? '',
            stack: e.stack ?? '',
        }
    }
    return { status: 0, statusText: '', message: String(err ?? ''), stack: '' }
}

export default function ErrorElement() {
    const rawError = useRouteError()
    const { status, statusText, message, stack } = normalizeError(rawError)
    const navigate = useNavigate()

    const handleRetry = () => window.location.reload()
    const handleGoHome = () => navigate('/')

    // Extract meaningful error message
    let errorMessage = 'אירעה שגיאה בלתי צפויה'
    let errorDetails = ''

    if (status === 404) {
        errorMessage = 'העמוד לא נמצא'
        errorDetails = 'הדף שחיפשת לא קיים במערכת'
    } else if (status >= 500 && status !== 0) {
        errorMessage = 'שגיאת שרת'
        errorDetails = 'יש בעיה בשרת, אנא נסה שוב מאוחר יותר'
    } else if (message) {
        errorDetails = message
    } else if (statusText) {
        errorDetails = statusText
    }

    return (
        <Box p={6} maxW="600px" mx="auto" mt={8}>
            <VStack gap={4} align="stretch">
                <Alert.Root status="error" variant="subtle">
                    <Alert.Indicator>
                        <FiAlertCircle />
                    </Alert.Indicator>
                    <Box>
                        <Alert.Title>{errorMessage}</Alert.Title>
                        {errorDetails && (
                            <Alert.Description>
                                {errorDetails}
                            </Alert.Description>
                        )}
                    </Box>
                </Alert.Root>

                <VStack gap={2}>
                    <Button onClick={handleRetry} colorScheme="blue" size="sm">
                        <FiRefreshCw />
                        נסה שוב
                    </Button>

                    <Button onClick={handleGoHome} variant="ghost" size="sm">
                        <FiHome />
                        חזור לעמוד הבית
                    </Button>
                </VStack>

                {process.env.NODE_ENV === 'development' && !!rawError && (
                    <Box
                        bg="gray.50"
                        p={4}
                        borderRadius="md"
                        fontSize="sm"
                        fontFamily="mono"
                        mt={4}
                    >
                        <Text fontWeight="bold" mb={2}>
                            Error Details (Development Only):
                        </Text>
                        <Text whiteSpace="pre-wrap" color="red.600">
                            Status: {status || 'Unknown'}
                        </Text>
                        <Text whiteSpace="pre-wrap" color="red.600">
                            StatusText: {statusText || 'Unknown'}
                        </Text>
                        {message && (
                            <Text whiteSpace="pre-wrap" color="red.600">
                                Message: {message}
                            </Text>
                        )}
                        {stack && (
                            <>
                                <Text fontWeight="bold" mt={4} mb={2}>
                                    Stack Trace:
                                </Text>
                                <Text
                                    whiteSpace="pre-wrap"
                                    color="gray.700"
                                    fontSize="xs"
                                >
                                    {stack}
                                </Text>
                            </>
                        )}
                    </Box>
                )}
            </VStack>
        </Box>
    )
}
