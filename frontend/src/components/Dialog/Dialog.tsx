import { FC, ReactNode, RefObject } from 'react'
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

interface DialogProps {
    buttonText?: string
    title?: string
    children?: ReactNode
    contentRef?: RefObject<HTMLDivElement | null>
}
export const Dialog: FC<DialogProps> = ({
    buttonText,
    title,
    children,
    contentRef,
}) => {
    return (
        <DialogRoot
            size="sm"
            placement="center"
            scrollBehavior={['inside']}
            // motionPreset="slide-in-bottom"
        >
            <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                    {buttonText}
                </Button>
            </DialogTrigger>
            <DialogContent ref={contentRef}>
                <DialogHeader>
                    <DialogTitle>{title}</DialogTitle>
                    <DialogCloseTrigger />
                </DialogHeader>
                <DialogBody>{children}</DialogBody>
            </DialogContent>
        </DialogRoot>
    )
}
