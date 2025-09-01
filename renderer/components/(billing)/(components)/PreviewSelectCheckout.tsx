import React, {FC} from "react";
import {
    Box,
    Button,
    Chip,
    Divider,
    IconButton,
    List,
    ListItem,
    ListItemText,
    Paper,
    Stack,
    Typography
} from "@mui/material";
import {Add, DeleteForever, Remove} from "@mui/icons-material";
import PerfectScrollbar from 'react-perfect-scrollbar';
import 'react-perfect-scrollbar/dist/css/styles.css';

export type CartItem = {
    key: string; productId: string; name: string; variantLabel?: string; unitPrice: number; qty: number
}

export interface PreviewSelectCheckoutProps {
    items: CartItem[]
    onInc: (key: string) => void
    onDec: (key: string) => void
    onRemove: (key: string) => void
    onClear: () => void
    taxRate?: number
}
export const PreviewSelectCheckout : FC<PreviewSelectCheckoutProps> = ({items, onInc, onDec, onRemove, onClear, taxRate = 0.11}) => {
    const subtotal = React.useMemo(
        () => items.reduce((acc, it) => acc + it.unitPrice * it.qty, 0),
        [items]
    )
    const rupiah = (n: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n)
    const tax = Math.round(subtotal * taxRate)
    const total = subtotal + tax

    return (
        <Paper sx={{ height: '100%', display: 'flex', flexDirection: 'column' }} elevation={0}>
            <Box sx={{ p: 2 }}>
                <Stack direction="row" alignItems="center" justifyContent="space-between">
                    <Typography variant="h6" fontWeight={700}>Checkout</Typography>
                    <Button size="small" color="error" startIcon={<DeleteForever />} onClick={onClear}>
                        Kosongkan
                    </Button>
                </Stack>
            </Box>

            <Divider />

            {/* Grid produk: kartu persegi */}
            <PerfectScrollbar style={{ flex: 1 }} options={{ suppressScrollX: true }}>
                <List>
                    {items.map(it => (
                        <ListItem
                            key={it.key}
                            secondaryAction={
                                <Stack direction="row" alignItems="center" spacing={0.5}>
                                    <IconButton size="small" onClick={() => onDec(it.key)}><Remove fontSize="small" /></IconButton>
                                    <Typography width={28} textAlign="center">{it.qty}</Typography>
                                    <IconButton size="small" onClick={() => onInc(it.key)}><Add fontSize="small" /></IconButton>
                                    <IconButton size="small" color="error" onClick={() => onRemove(it.key)}>
                                        <DeleteForever fontSize="small" />
                                    </IconButton>
                                </Stack>
                            }
                        >
                            <ListItemText
                                primary={
                                    <Stack direction="row" spacing={1} alignItems="center">
                                        <Typography fontWeight={700}>{it.name}</Typography>
                                        {it.variantLabel && <Chip size="small" label={it.variantLabel} />}
                                    </Stack>
                                }
                                secondary={
                                    <Typography variant="caption" color="text.secondary">
                                        {rupiah(it.unitPrice)} × {it.qty}
                                    </Typography>
                                }
                            />
                        </ListItem>
                    ))}
                    {items.length === 0 && (
                        <Box sx={{ p: 2, color: 'text.secondary' }}>
                            Keranjang masih kosong. Ayo jualan—biar mesin EDC nggak nganggur 😄
                        </Box>
                    )}
                </List>
            </PerfectScrollbar>

            <Divider />

            <Box sx={{ p: 2 }}>
                <Stack spacing={0.5}>
                    <Stack direction="row" justifyContent="space-between">
                        <Typography color="text.secondary">Subtotal</Typography>
                        <Typography>{rupiah(subtotal)}</Typography>
                    </Stack>
                    <Stack direction="row" justifyContent="space-between">
                        <Typography color="text.secondary">Pajak (11%)</Typography>
                        <Typography>{rupiah(tax)}</Typography>
                    </Stack>
                    <Divider sx={{ my: 1 }} />
                    <Stack direction="row" justifyContent="space-between">
                        <Typography variant="h6" fontWeight={800}>Total</Typography>
                        <Typography variant="h6" fontWeight={800}>{rupiah(total)}</Typography>
                    </Stack>
                </Stack>

                <Button
                    sx={{ mt: 2 }}
                    size="large"
                    fullWidth
                    variant="contained"
                    disabled={items.length === 0}
                    onClick={() => alert(`Lanjut pembayaran: ${rupiah(total)}`)}
                >
                    Bayar
                </Button>
            </Box>
        </Paper>
    )
}

export default PreviewSelectCheckout;