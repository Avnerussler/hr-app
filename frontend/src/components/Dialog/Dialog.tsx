import { FC, ReactNode, RefObject, useContext } from 'react'
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
import ContentRefContext from '@/providers/ContentRefContext'

interface DialogProps {
    buttonText?: string
    title?: string
    children?: ReactNode
}
export const Dialog: FC<DialogProps> = ({ buttonText, title, children }) => {
    const contentRef = useContext(ContentRefContext)

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
            <DialogContent ref={contentRef as RefObject<HTMLDivElement>}>
                <DialogHeader>
                    <DialogTitle>{title}</DialogTitle>
                    <DialogCloseTrigger />
                </DialogHeader>
                <DialogBody>{children}</DialogBody>
            </DialogContent>
        </DialogRoot>
    )
}
