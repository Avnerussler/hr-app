import { Card } from '@chakra-ui/react'
import { ReactNode } from 'react'

interface ChartCardProps {
    title: string
    description?: string
    icon?: ReactNode
    children: ReactNode
}

export function ChartCard({ title, description, icon, children }: ChartCardProps) {
    return (
        <Card.Root>
            <Card.Header>
                <Card.Title display="flex" alignItems="center" gap={2}>
                    {icon}
                    {title}
                </Card.Title>
                {description && (
                    <Card.Description>{description}</Card.Description>
                )}
            </Card.Header>
            <Card.Body>
                {children}
            </Card.Body>
        </Card.Root>
    )
}