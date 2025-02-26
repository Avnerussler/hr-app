import { createContext, RefObject } from 'react'

const ContentRefContext = createContext<RefObject<HTMLElement | null> | null>(
    null
)
export default ContentRefContext
