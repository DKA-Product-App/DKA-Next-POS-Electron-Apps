'use client'

import * as React from 'react'
import {
    Box,
    Stack,
    Typography,
    IconButton,
    Chip,
    Divider,
    Button,
    Tooltip,
    TextField,
    Popper,
    ClickAwayListener,
    Paper as MuiPaper,
} from '@mui/material'
import { Add, Remove, DeleteOutline } from '@mui/icons-material'
import PerfectScrollbar from 'react-perfect-scrollbar'
import 'react-perfect-scrollbar/dist/css/styles.css'

import { useCart, useCartActions } from '../../../context/CartContext'
import type { CartItem } from '../../../context/CartContext'

export type DetailItemHandle = {
    open: (anchorEl: HTMLElement, item: CartItem) => void
    close: () => void
}

const GRADIENT_BAR = 'linear-gradient(90deg, #6366F1, #8B5CF6 30%, #EC4899)'
const BUS_EVENT = 'detailitem:close-all'

const currency = (n: number) =>
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n)

const DetailItemWidget = React.forwardRef<DetailItemHandle, {}>(function DetailItem(_props, ref) {
    const { items } = useCart()
    const { inc, dec, setDescription } = useCartActions()

    const [open, setOpen] = React.useState(false)
    const [anchorEl, setAnchorEl] = React.useState<HTMLElement | null>(null)
    const [key, setKey] = React.useState<string | null>(null)
    const [draft, setDraft] = React.useState('')

    // === Event Bus: close-all listener ===
    React.useEffect(() => {
        const handler = () => {
            setOpen(false)
            setAnchorEl(null)
            setKey(null)
            setDraft('')
        }
        window.addEventListener(BUS_EVENT, handler)
        return () => window.removeEventListener(BUS_EVENT, handler)
    }, [])

    // Imperative API
    React.useImperativeHandle(ref, () => ({
        open: (anchor, item) => {
            // Tutup semua popup lain sebelum buka
            window.dispatchEvent(new CustomEvent(BUS_EVENT))
            setAnchorEl(anchor)
            setKey(item.key)
            setDraft(item.description ?? '')
            setOpen(true)
        },
        close: () => {
            setOpen(false)
            setAnchorEl(null)
            setKey(null)
            setDraft('')
        },
    }))

    const activeItem = key ? items.find(i => i.key === key) : undefined
    const activeSubtotal = activeItem ? activeItem.unitPrice * activeItem.qty : 0

    // Auto-close jika item hilang (qty 0 / dihapus)
    React.useEffect(() => {
        if (open && key && !activeItem) {
            setOpen(false)
            setAnchorEl(null)
            setKey(null)
            setDraft('')
        }
    }, [open, key, activeItem])

    const handleSave = () => {
        if (!key) return
        setDescription(key, draft.trim())
        setOpen(false)
    }

    const clearNote = () => {
        if (!key) return
        setDescription(key, '')
        setDraft('')
    }

    return (
        <Popper
            open={open}
            anchorEl={anchorEl}
            placement="left-start"
            modifiers={[
                { name: 'offset', options: { offset: [12, 0] } },
                { name: 'flip', options: { fallbackPlacements: ['right-start', 'bottom-start'] } },
                { name: 'preventOverflow', options: { padding: 12, boundary: 'clippingParents' } },
            ]}
            sx={{ zIndex: (t) => t.zIndex.modal + 1 }}
        >
            <ClickAwayListener onClickAway={() => setOpen(false)}>
                <MuiPaper
                    elevation={8}
                    sx={(t) => ({
                        width: 420,
                        maxWidth: '90vw',
                        [t.breakpoints.up('sm')]: { width: 480 },
                        [t.breakpoints.up('md')]: { width: 560 },
                        maxHeight: '72vh',
                        borderRadius: 2,
                        border: '1px solid',
                        borderColor: 'divider',
                        display: 'flex',
                        flexDirection: 'column',
                        overflow: 'hidden',
                        background:
                            t.palette.mode === 'dark'
                                ? `linear-gradient(180deg, rgba(23,23,35,1) 0%, rgba(15,15,25,1) 100%)`
                                : `linear-gradient(180deg, #fff 0%, #f9f9ff 100%)`,
                        boxShadow: '0 0 12px rgba(139,92,246,0.25)',
                    })}
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Ornamen ungu atas */}
                    <Box sx={{ height: 4, background: GRADIENT_BAR }} />

                    <PerfectScrollbar style={{ maxHeight: 'calc(72vh - 8px)' }} options={{ suppressScrollX: true, wheelPropagation: false }}>
                        <Box sx={{ p: 1.75, pb: 1.25 }}>
                            {/* Info Produk */}
                            <Stack spacing={0.75}>
                                <Typography variant="subtitle1" fontWeight={900} sx={{ lineHeight: 1.1 }}>
                                    {activeItem?.name ?? 'Produk'}
                                </Typography>
                                <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
                                    {activeItem?.variantLabel && (
                                        <Chip size="small" label={activeItem.variantLabel} variant="outlined" sx={{ borderRadius: 1 }} />
                                    )}
                                    <Typography variant="body2" color="text.secondary">
                                        Harga: <b>{activeItem ? currency(activeItem.unitPrice) : '-'}</b>
                                    </Typography>
                                </Stack>
                            </Stack>

                            <Divider sx={{ my: 1.25 }} />

                            {/* Kuantitas & Subtotal */}
                            <Stack direction="row" alignItems="center" justifyContent="space-between">
                                <Stack direction="row" alignItems="center" spacing={0.75}>
                                    <Tooltip title="Kurangi">
                                        <IconButton size="medium" onClick={() => activeItem && dec(activeItem.key)}>
                                            <Remove />
                                        </IconButton>
                                    </Tooltip>
                                    <Typography
                                        fontWeight={900}
                                        sx={{ fontVariantNumeric: 'tabular-nums', minWidth: 28, textAlign: 'center', fontSize: 16 }}
                                    >
                                        {activeItem?.qty ?? 0}
                                    </Typography>
                                    <Tooltip title="Tambah">
                                        <IconButton size="medium" onClick={() => activeItem && inc(activeItem.key)}>
                                            <Add />
                                        </IconButton>
                                    </Tooltip>
                                </Stack>

                                <Stack direction="row" spacing={1} alignItems="baseline">
                                    <Typography variant="body2" color="text.secondary">Subtotal:</Typography>
                                    <Typography fontWeight={900}>{currency(activeSubtotal)}</Typography>
                                </Stack>
                            </Stack>

                            <Divider sx={{ my: 1.25 }} />

                            {/* Catatan */}
                            <Stack spacing={0.75}>
                                <Stack direction="row" justifyContent="space-between" alignItems="center">
                                    <Typography variant="subtitle2" fontWeight={800}>Catatan</Typography>
                                    <Tooltip title="Hapus catatan">
                    <span>
                      <IconButton size="small" onClick={clearNote} disabled={!activeItem?.description}>
                        <DeleteOutline fontSize="small" />
                      </IconButton>
                    </span>
                                    </Tooltip>
                                </Stack>
                                <TextField
                                    value={draft}
                                    onChange={(e) => setDraft(e.target.value)}
                                    size="medium"
                                    fullWidth
                                    placeholder="cth: hot / no onion / less ice"
                                    multiline
                                    minRows={3}
                                    maxRows={10}
                                    autoFocus
                                />
                                <Stack direction="row" justifyContent="flex-end">
                                    <Button
                                        variant="contained"
                                        size="medium"
                                        onClick={handleSave}
                                        sx={{ textTransform: 'none', fontWeight: 800 }}
                                    >
                                        Simpan
                                    </Button>
                                </Stack>
                            </Stack>
                        </Box>
                    </PerfectScrollbar>

                    {/* Ornamen ungu bawah */}
                    <Box sx={{ height: 4, background: GRADIENT_BAR }} />
                </MuiPaper>
            </ClickAwayListener>
        </Popper>
    )
})

export default DetailItemWidget
