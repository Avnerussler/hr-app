import { Button } from '@chakra-ui/react'
import {
    DialogBody,
    DialogCloseTrigger,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogContent,
    DialogRoot,
} from '../ui/dialog'
import { FC, ReactNode } from 'react'

interface DialogProps {
    buttonText?: string
    title?: string
    children?: ReactNode
}
export const Dialog: FC<DialogProps> = ({ buttonText, title, children }) => {
    return (
        <DialogRoot
            size="cover"
            placement="center"
            scrollBehavior={['inside']}
            // motionPreset="slide-in-bottom"
        >
            <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                    {buttonText}
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{title}</DialogTitle>
                    <DialogCloseTrigger />
                </DialogHeader>
                <DialogBody>{children}</DialogBody>
            </DialogContent>
        </DialogRoot>
    )
}
