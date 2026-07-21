import { Text } from '@chakra-ui/react'
import { useNavigate } from 'react-router-dom'
import { generateEditPath } from '@/types/routeTypes'

interface EntityLinkProps {
    formName: string
    itemId: string
    children: React.ReactNode
    formId?: string
}

export function EntityLink({ formName, itemId, children, formId = 'default' }: EntityLinkProps) {
    const navigate = useNavigate()

    return (
        <Text
            as="span"
            color="primary"
            textDecoration="underline"
            cursor="pointer"
            _hover={{ opacity: 0.8 }}
            onClick={(e) => {
                e.stopPropagation()
                navigate(generateEditPath(formName, formId, itemId))
            }}
        >
            {children}
        </Text>
    )
}
