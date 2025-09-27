import { Box, VStack, Text } from '@chakra-ui/react'
import { useEffect, useRef } from 'react'

interface ContextMenuItem {
    label: string
    icon: React.ReactNode
    onClick: () => void
}

interface ContextMenuProps {
    x: number
    y: number
    items: ContextMenuItem[]
    onClose: () => void
    isOpen: boolean
}

export function ContextMenu({
    x,
    y,
    items,
    onClose,
    isOpen,
}: ContextMenuProps) {
    const menuRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (
                menuRef.current &&
                !menuRef.current.contains(event.target as Node)
            ) {
                onClose()
            }
        }

        const handleEscape = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                onClose()
            }
        }

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside)
            document.addEventListener('keydown', handleEscape)
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside)
            document.removeEventListener('keydown', handleEscape)
        }
    }, [isOpen, onClose])

    if (!isOpen) return null

    return (
        <Box
            ref={menuRef}
            position="fixed"
            top={`${y}px`}
            left={`${x}px`}
            bg="white"
            borderRadius="md"
            borderWidth="1px"
            borderColor="border"
            boxShadow="lg"
            py={2}
            minW="150px"
            zIndex={1000}
        >
            <VStack gap={0} align="stretch">
                {items.map((item, index) => (
                    <Box
                        key={index}
                        px={3}
                        py={2}
                        cursor="pointer"
                        _hover={{ bg: 'gray.100' }}
                        onClick={() => {
                            item.onClick()
                            onClose()
                        }}
                    >
                        <Box display="flex" alignItems="center" gap={3}>
                            <Box fontSize="sm" color="gray.600">
                                {item.icon}
                            </Box>
                            <Text fontSize="sm" fontWeight="medium">
                                {item.label}
                            </Text>
                        </Box>
                    </Box>
                ))}
            </VStack>
        </Box>
    )
}
