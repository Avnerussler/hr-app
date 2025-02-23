import { Button, Card } from '@chakra-ui/react'
import { FC } from 'react'

interface NavigationTilesProps {
    formId: string
    fomName: string
    description?: string
}
export const NavigationTiles: FC<NavigationTilesProps> = ({
    fomName,
    formId,
    description,
}) => {
    const handleClick = () => {
        console.log('clicked', formId)
    }
    return (
        <Card.Root width="320px" variant={'elevated'}>
            <Card.Body gap="2">
                <Card.Title mb="2">{fomName}</Card.Title>
                {description && (
                    <Card.Description>{description}</Card.Description>
                )}
            </Card.Body>
            <Card.Footer justifyContent="flex-end">
                <Button variant="outline" onClick={handleClick}>
                    View
                </Button>
            </Card.Footer>
        </Card.Root>
    )
}
