import { useRef, ReactNode, FC } from 'react'
import ContentRefContext from './ContentRefContext'

interface DialogRefProviderProps {
    children: ReactNode
}

const DialogRefProvider: FC<DialogRefProviderProps> = ({ children }) => {
    const contentRef = useRef<HTMLDivElement>(null)

    return (
        <ContentRefContext.Provider value={contentRef}>
            {children}
        </ContentRefContext.Provider>
    )
}

export default DialogRefProvider
