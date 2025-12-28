import * as React from 'react'
import { Box, Button, Dialog, IconButton, Typography } from '@mui/material'
import AddRounded from '@mui/icons-material/AddRounded'
import RemoveRounded from '@mui/icons-material/RemoveRounded'

type Props = {
    open: boolean
    onClose: () => void
    onConfirm: (qty: number) => void
    maxQty: number
    initialQty?: number
    itemName?: string
}

const SplitQtyDialog: React.FC<Props> = ({ open, onClose, onConfirm, maxQty, initialQty = 1, itemName }) => {
    const [qty, setQty] = React.useState(initialQty)

    // Sync initialQty when open changes
    React.useEffect(() => {
        if (open) setQty(initialQty || 1)
    }, [open, initialQty])

    const handleSubmit = (e?: React.FormEvent) => {
        e?.preventDefault()
        e?.stopPropagation()
        if (qty > 0 && qty <= maxQty) {
            onConfirm(qty)
            onClose()
        }
    }

    const handleIncrement = (e: React.MouseEvent) => {
        e.stopPropagation()
        if (qty < maxQty) setQty(prev => prev + 1)
    }

    const handleDecrement = (e: React.MouseEvent) => {
        e.stopPropagation()
        if (qty > 1) setQty(prev => prev - 1)
    }

    return (
        <Box onClick={(e) => e.stopPropagation()} onMouseDown={(e) => e.stopPropagation()} onMouseUp={(e) => e.stopPropagation()}>
            <Dialog
                open={open}
                onClose={(e, r) => {
                    // Prevent bubbling if closing via backdrop click
                    onClose()
                }}
                maxWidth="xs"
                fullWidth
                PaperProps={{
                    onClick: (e) => e.stopPropagation(), // Stop clicks inside dialog from bubbling
                    component: 'form',
                    onSubmit: handleSubmit,
                    sx: {
                        borderRadius: 3,
                        overflow: 'hidden',
                        bgcolor: 'background.paper',
                        backgroundImage: 'none',
                        boxShadow: 24
                    }
                }}
            >
                <Box sx={{ p: 3, textAlign: 'center' }}>
                    <Typography variant="h6" fontWeight={800} gutterBottom>
                        Split Quantity
                    </Typography>

                    {itemName && (
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                            {itemName}
                        </Typography>
                    )}

                    <Box
                        sx={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: 2,
                            mb: 4
                        }}
                    >
                        <IconButton
                            onClick={handleDecrement}
                            disabled={qty <= 1}
                            sx={{
                                border: '1px solid',
                                borderColor: 'divider',
                                bgcolor: 'background.default',
                                '&:hover': { bgcolor: 'action.hover' }
                            }}
                        >
                            <RemoveRounded />
                        </IconButton>

                        <Typography variant="h3" fontWeight={900} sx={{ minWidth: 60 }}>
                            {qty}
                        </Typography>

                        <IconButton
                            onClick={handleIncrement}
                            disabled={qty >= maxQty}
                            sx={{
                                border: '1px solid',
                                borderColor: 'divider',
                                bgcolor: 'background.default',
                                '&:hover': { bgcolor: 'action.hover' }
                            }}
                        >
                            <AddRounded />
                        </IconButton>
                    </Box>

                    <Box sx={{ display: 'flex', gap: 1.5 }}>
                        <Button
                            fullWidth
                            onClick={(e) => {
                                e.stopPropagation()
                                onClose()
                            }}
                            size="large"
                            color="inherit"
                            sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 700 }}
                        >
                            Cancel
                        </Button>
                        <Button
                            fullWidth
                            type="submit"
                            variant="contained"
                            size="large"
                            disabled={qty <= 0 || qty > maxQty}
                            onClick={(e) => e.stopPropagation()}
                            sx={{
                                borderRadius: 2,
                                textTransform: 'none',
                                fontWeight: 800,
                                boxShadow: 'none'
                            }}
                        >
                            Confirm
                        </Button>
                    </Box>
                </Box>
            </Dialog>
        </Box>
    )
}

export default SplitQtyDialog
