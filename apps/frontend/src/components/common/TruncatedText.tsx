import { Text, TextProps } from '@chakra-ui/react'
import { Tooltip } from '@/components/ui/tooltip'

interface TruncatedTextProps extends TextProps {
    children: string
}

/** Clamps long cell text to a couple of lines with a "..." and shows the full
 *  value in a tooltip on hover, so wide free-text fields don't blow up row height. */
export function TruncatedText({ children, ...rest }: TruncatedTextProps) {
    if (!children) return <Text color="foreground">—</Text>

    return (
        <Tooltip content={children}>
            <Text
                color="foreground"
                overflow="hidden"
                display="-webkit-box"
                css={{ WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}
                {...rest}
            >
                {children}
            </Text>
        </Tooltip>
    )
}
