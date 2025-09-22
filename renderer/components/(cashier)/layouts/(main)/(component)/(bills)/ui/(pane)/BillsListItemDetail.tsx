// (components)/BillListItemDetail.tsx
'use client'

import * as React from 'react'
import {
    Box, Paper, Stack, Typography, Chip, Button, TextField, InputAdornment,
    ButtonBase, Divider
} from '@mui/material'
import PrintRounded from '@mui/icons-material/PrintRounded'
import RequestQuoteRounded from '@mui/icons-material/RequestQuoteRounded'
import LocalMallRounded from '@mui/icons-material/LocalMallRounded'
import AccessTimeRounded from '@mui/icons-material/AccessTimeRounded'
import AttachMoneyRounded from '@mui/icons-material/AttachMoneyRounded'
import QrCode2Rounded from '@mui/icons-material/QrCode2Rounded'
import CreditCardRounded from '@mui/icons-material/CreditCardRounded'
import PerfectScrollbar from 'react-perfect-scrollbar'
import 'react-perfect-scrollbar/dist/css/styles.css'

import Image, { ImageLoader } from 'next/image'
import Skeleton from '@mui/material/Skeleton'

import type { ApiBill } from './BillsListItem'

/* ====== Theme accents (selaras contohmu) ====== */
const PURPLE_GRAD = 'linear-gradient(90deg, #6366F1, #8B5CF6 35%, #EC4899)'
const COLOR_GRAND_TOTAL_GRAD = 'linear-gradient(90deg,rgba(10, 224, 7, 1) 0%, rgba(7, 168, 61, 1) 51%, rgba(44, 135, 138, 1) 100%)';
const ACCENT = 'linear-gradient(90deg, #7C3AED, #6366F1 45%, #8B5CF6)'

/* ===== Helpers ===== */
const fmtIDR = (n?: number | string) =>
    typeof n === 'number' || (typeof n === 'string' && n !== '')
        ? new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(Number(n))
        : 'Rp —'

const fmtTimeLong = (iso?: string) =>
    iso ? new Date(iso).toLocaleString('id-ID', { hour: '2-digit', minute: '2-digit' }) : '—'

const statusChip = (bill: ApiBill) => {
    const paid = (bill as any).paid
    if (!paid) return { color: 'warning' as const, label: 'Unpaid' }
    return paid.status ? { color: 'success' as const, label: 'Paid' } : { color: 'warning' as const, label: 'Unpaid' }
}

const first = <T,>(a?: T[] | T | null): T | undefined =>
    Array.isArray(a) ? a[0] : (a as T | undefined)

/* ===== Img helpers (mengikuti komponenmu) ===== */
const uploadsLoader: ImageLoader = ({ src }) => {
    if (src?.startsWith('uploads:///')) {
        const base = process.env.NEXT_PUBLIC_UPLOADS_BASE_URL || ''
        const path = src.replace('uploads:///', '').replace(/^\/+/, '')
        return base ? `${base.replace(/\/+$/, '')}/${path}` : `/${path}`
    }
    return src
}
const toUploadUrl = (s?: string) =>
    (!s ? undefined : /^(uploads|http|https):\/\//i.test(s) ? s : `uploads:///${s.replace(/^\/+/, '')}`)

const ph = (name?: string, img?: string) =>
    toUploadUrl(img) ?? `https://placehold.co/600x400/png?text=${encodeURIComponent(name || 'Item')}`

const ImgWithSkeleton: React.FC<{ src: string; alt: string; loader?: ImageLoader; radius?: number }> = ({ src, alt, loader, radius = 8 }) => {
    const [loaded, setLoaded] = React.useState(false)
    const [err, setErr] = React.useState(false)
    const finalSrc = err ? 'https://placehold.co/600x400/png?text=No%20Image' : src
    return (
        <Box sx={{ position: 'relative', width: '100%', aspectRatio: '1 / 1', bgcolor: 'action.hover', overflow: 'hidden', borderRadius: radius / 2 }}>
            {!loaded && <Skeleton variant="rectangular" sx={{ position: 'absolute', inset: 0 }} />}
            <Image
                loader={loader}
                src={finalSrc}
                alt={alt}
                fill
                unoptimized
                sizes="64px"
                onLoad={() => setLoaded(true)}
                onError={() => { setErr(true); setLoaded(true) }}
                style={{ objectFit: 'cover', opacity: loaded ? 1 : 0, transition: 'opacity .2s ease' }}
            />
            <Box
                sx={{
                    position: 'absolute', inset: 0, pointerEvents: 'none',
                    background: (t) => `linear-gradient(to bottom, ${t.palette.action.hover}00 0%, ${t.palette.action.hover}40 70%, ${t.palette.action.hover}66 100%)`
                }}
            />
        </Box>
    )
}

/* ===== Derive essentials dari bill ===== */
const getInvoice = (b: ApiBill) => (b as any).transaction?.invoice ?? String((b as any).number ?? '')
const getIssuedAt = (b: ApiBill) => (b as any).time_created || (b as any).transaction?.time_created
const getPaidAt = (b: ApiBill) => (b as any).paid?.time
const getRef = (b: ApiBill) =>
    (b as any).table?.name || (b as any).table?.code || (b as any).order_type?.name || (b as any).order_type?.code || undefined

/* ===== Payment picker mini-card ===== */
type PaymentMethod = 'cash' | 'qris' | 'card'
const PaymentOptionCard: React.FC<{
    selected?: boolean
    title: string
    subtitle?: string
    icon: React.ReactNode
    onClick?: () => void
    disabled?: boolean
}> = ({ selected, title, subtitle, icon, onClick, disabled }) => (
    <Box
        role="button"
        onClick={disabled ? undefined : onClick}
        sx={(t) => ({
            userSelect: 'none',
            cursor: disabled ? 'not-allowed' : 'pointer',
            width: 180,
            p: 1.5,
            border: '1px solid',
            borderColor: selected ? t.palette.primary.main : 'divider',
            borderRadius: 2,
            bgcolor: disabled ? t.palette.action.disabledBackground : 'background.paper',
            boxShadow: selected ? `0 0 0 3px ${t.palette.primary.main}22, 0 1px 2px rgba(0,0,0,.06)` : '0 1px 2px rgba(0,0,0,.06)',
            transition: 'all .15s ease',
            '&:hover': disabled ? {} : { boxShadow: '0 2px 6px rgba(0,0,0,.10)' },
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 1,
            textAlign: 'center',
            opacity: disabled ? 0.7 : 1,
        })}
    >
        <Box
            sx={(t) => ({
                width: 56, height: 56, borderRadius: '50%',
                display: 'grid', placeItems: 'center',
                bgcolor: t.palette.action.hover,
            })}
        >
            {icon}
        </Box>
        <Typography variant="subtitle1" fontWeight={800} sx={{ letterSpacing: .2 }}>{title}</Typography>
        {subtitle && <Typography variant="caption" color="text.secondary">{subtitle}</Typography>}
    </Box>
)

/* ===== Item flattener (sesuai JSON baru) ===== */
type FlatItem = {
    id: string
    productName: string
    variantName?: string
    categoryName?: string
    imageUrl?: string
    note?: string
    qty: number
    price: number
    subtotal: number
}
const deriveLineItems = (bill: ApiBill): FlatItem[] => {
    const items = ((bill as any).items ?? []) as any[]
    if (!items.length) return []
    return items.map((wrap) => {
        const it = wrap.transactionItem ?? {}
        const product = it.product ?? {}
        const variant = it.variant ?? {}
        const category = first(product?.category) as any
        const rawImg = product?.image ?? first(product?.images) ?? first(product?.photos)
        const imageUrl = typeof rawImg === 'string' ? rawImg : rawImg?.url

        const qty = Number(wrap.qty ?? 0)
        const price = Number(wrap.price ?? 0)
        const subtotal = Number(wrap.sub_total ?? 0)

        return {
            id: String(wrap.id ?? it.id ?? Math.random()),
            productName: String(product?.name ?? 'Item'),
            variantName: variant?.name,
            categoryName: category?.name,
            imageUrl,
            note: it.note ?? wrap.note ?? undefined,
            qty,
            price,
            subtotal,
        }
    })
}

/* ===================================================================================== */

const BillListItemDetail: React.FC<{ bill: ApiBill }> = ({ bill }) => {
    const st = statusChip(bill)
    const isPaid = !!(bill as any).paid?.status
    const paidAt = getPaidAt(bill)
    const issuedAt = getIssuedAt(bill)

    const items = deriveLineItems(bill)

    // Σ subtotal item (dari level atas)
    const itemsSubtotal = items.reduce((a, it) => a + (it.subtotal || 0), 0)

    // Pajak 10% dari subtotal item
    const [taxRate] = React.useState<number>(0.10)
    const tax = Math.max(0, Math.round(itemsSubtotal * taxRate))
    const grandTotal = Math.max(0, itemsSubtotal + tax)

    const invoice = getInvoice(bill)
    const ref = getRef(bill)

    const itemsCount = items.length
    const qtyTotal = items.reduce((a, it) => a + it.qty, 0)

    // Default payment method dari server
    const serverMethodName = (bill as any).payment_method?.name as string | undefined
    const mapMethod = (name?: string): PaymentMethod => {
        if (!name) return 'cash'
        const n = name.toLowerCase()
        if (n.includes('qris')) return 'qris'
        if (n.includes('card') || n.includes('kartu') || n.includes('debit') || n.includes('kredit')) return 'card'
        if (n.includes('cash') || n.includes('tunai')) return 'cash'
        return 'cash'
    }
    const [method, setMethod] = React.useState<PaymentMethod>(mapMethod(serverMethodName))

    // Cash input
    const [cashStr, setCashStr] = React.useState<string>('')
    const cash = cashStr === '' ? 0 : Number(cashStr.replaceAll('.', '').replaceAll(',', ''))
    const isCash = method === 'cash'
    const change = Math.max(0, cash - grandTotal)
    const shortage = Math.max(0, grandTotal - cash)
    const helper =
        isCash
            ? (cash > 0 ? (cash < grandTotal ? `Kurang ${fmtIDR(shortage)}` : 'Uang cukup ✅') : 'Masukkan nominal tunai')
            : 'Pilih metode pembayaran'

    /* Grid kolom:
       Col-0: # (increment)
       Col-1: Produk (gambar, judul, kategori + variant, note)
       Col-2: Qty
       Col-3: Subtotal
    */
    const ITEM_COLS = {
        xs: '56px 1.8fr 88px 140px',
        md: '64px 2fr 112px 180px',
    } as const

    const colCell = (leftBorder = false) => ({
        pl: leftBorder ? 1.25 : 0,
        borderLeft: leftBorder ? '1px solid' : 'none',
        borderColor: 'divider',
        minWidth: 0,
    })

    return (
        <Box sx={{ height: '100%', width: '100%' }}>
            <Paper
                elevation={0}
                sx={{
                    height: '100%',
                    width: '100%',
                    border: '1px solid', borderColor: 'divider',
                    bgcolor: 'background.paper',
                    borderRadius: 0,
                    display: 'flex', flexDirection: 'column',
                }}
            >
                {/* ===== Header ===== */}
                <Box sx={{ p: { xs: 2, md: 2.5 }, borderBottom: '1px solid', borderColor: 'divider', flexShrink: 0 }}>
                    <Stack direction="row" justifyContent="space-between" alignItems="flex-start" gap={1.5}>
                        <Stack spacing={0.75} minWidth={0}>
                            <Stack direction="row" spacing={1.25} alignItems="center" minWidth={0}>
                                <RequestQuoteRounded sx={{ fontSize: { xs: 18, md: 20 } }} />
                                <Typography variant="h5" fontWeight={900} noWrap sx={{ letterSpacing: 0.2 }}>
                                    #{' '}{invoice}
                                </Typography>
                                <Chip size="small" color={st.color} label={st.label} sx={{ borderRadius: 0, fontSize: { xs: 12, md: 13 } }} />
                                <Chip
                                    size="small"
                                    variant="outlined"
                                    label={`${itemsCount} item${itemsCount === 1 ? '' : 's'} • ${qtyTotal} qty`}
                                    sx={{ borderRadius: 0, fontSize: { xs: 12, md: 13 } }}
                                />
                            </Stack>

                            <Stack direction="row" spacing={2} flexWrap="wrap" sx={{ color: 'text.secondary' }}>
                                <Stack direction="row" spacing={0.75} alignItems="center">
                                    <AccessTimeRounded sx={{ fontSize: 18 }} />
                                    <Typography variant="body1">
                                        {isPaid ? `Paid — ${fmtTimeLong(paidAt)}` : `Issued — ${fmtTimeLong(issuedAt)}`}
                                    </Typography>
                                </Stack>
                                <Typography variant="body1">Ref — {ref ?? '—'}</Typography>
                            </Stack>
                        </Stack>
                    </Stack>
                </Box>

                {/* ===== Items header (fixed) ===== */}
                <Box sx={{ px: { xs: 2, md: 2.5 }, pt: 1, pb: 1, flexShrink: 0 }}>
                    <Box
                        sx={(t) => ({
                            display: 'grid',
                            gridTemplateColumns: { xs: ITEM_COLS.xs, md: ITEM_COLS.md },
                            gap: 0,
                            border: '1px solid', borderColor: 'divider',
                            bgcolor: t.palette.action.hover,
                        })}
                    >
                        <Box sx={{ ...colCell(false), px: 1.25, py: 1 }}>
                            <Typography variant="body2" fontWeight={900} textAlign="center">#</Typography>
                        </Box>
                        <Box sx={{ ...colCell(true), px: 1.25, py: 1 }}>
                            <Typography variant="body2" fontWeight={900}>Produk</Typography>
                        </Box>
                        <Box sx={{ ...colCell(true), px: 1.25, py: 1 }}>
                            <Typography variant="body2" fontWeight={900} textAlign="right">Qty</Typography>
                        </Box>
                        <Box sx={{ ...colCell(true), px: 1.25, py: 1 }}>
                            <Typography variant="body2" fontWeight={900} textAlign="right">Subtotal</Typography>
                        </Box>
                    </Box>
                </Box>

                {/* ===== Items (scroll) ===== */}
                <Box sx={{ flex: 1, minHeight: 0 }}>
                    <PerfectScrollbar options={{ suppressScrollX: true, wheelPropagation: false }}>
                        <Box sx={{ px: { xs: 2, md: 2.5 }, pb: 2 }}>
                            <Stack spacing={1}>
                                {items.map((it, idx) => {
                                    const imgSrc = ph(it.productName, it.imageUrl)
                                    return (
                                        <Paper
                                            key={it.id}
                                            variant="outlined"
                                            sx={{
                                                borderRadius: 2,
                                                overflow: 'hidden',
                                                position: 'relative',
                                                '&::before': { content: '""', position: 'absolute', left: 0, top: 0, bottom: 0, width: 4, background: ACCENT },
                                            }}
                                        >
                                            {/* Ripple area */}
                                            <ButtonBase
                                                onClick={() => {}}
                                                sx={{
                                                    width: '100%',
                                                    display: 'grid',
                                                    alignItems: 'stretch',
                                                    textAlign: 'left',
                                                    gridTemplateColumns: { xs: ITEM_COLS.xs, md: ITEM_COLS.md },
                                                    p: 0,
                                                    '&:hover': { backgroundColor: 'action.hover' }
                                                }}
                                            >
                                                {/* Col 0: nomor */}
                                                <Box sx={{ ...colCell(false), px: 1.25, py: 1.1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                    <Chip size="small" label={idx + 1} sx={{ fontWeight: 800, background: PURPLE_GRAD, color: '#fff' }} />
                                                </Box>

                                                {/* Col 1: Produk */}
                                                <Box sx={{ ...colCell(true), px: 1.25, py: 1.1, display: 'flex', alignItems: 'flex-start', gap: 1.25 }}>
                                                    <Box sx={{ width: 56, flexShrink: 0 }}>
                                                        <ImgWithSkeleton loader={uploadsLoader} src={imgSrc} alt={it.productName} radius={8} />
                                                    </Box>
                                                    <Box sx={{ minWidth: 0 }}>
                                                        <Typography variant="body1" fontWeight={900} noWrap title={it.productName}>
                                                            {it.productName}
                                                        </Typography>

                                                        {/* Kategori + Variant bersampingan */}
                                                        <Stack direction="row" spacing={0.75} alignItems="center" sx={{ mt: 0.25, minWidth: 0, flexWrap: 'wrap' }}>
                                                            {it.categoryName && (
                                                                <Typography
                                                                    variant="caption"
                                                                    sx={(t) => ({
                                                                        px: 0.75, py: 0.25,
                                                                        border: '1px solid', borderColor: 'divider',
                                                                        bgcolor: t.palette.action.hover, fontWeight: 700,
                                                                        textTransform: 'uppercase', letterSpacing: .3,
                                                                    })}
                                                                    noWrap
                                                                    title={it.categoryName}
                                                                >
                                                                    {it.categoryName}
                                                                </Typography>
                                                            )}
                                                            {it.variantName && (
                                                                <>
                                                                    {it.categoryName && <Typography variant="caption" color="text.disabled">•</Typography>}
                                                                    <Typography variant="caption" color="text.secondary" noWrap title={it.variantName}>
                                                                        {it.variantName}
                                                                    </Typography>
                                                                </>
                                                            )}
                                                        </Stack>

                                                        {it.note && (
                                                            <Typography variant="body2" color="text.secondary" noWrap sx={{ mt: 0.25 }} title={it.note}>
                                                                {it.note}
                                                            </Typography>
                                                        )}
                                                    </Box>
                                                </Box>

                                                {/* Col 2: Qty */}
                                                <Box sx={{ ...colCell(true), px: 1.25, py: 1.1, display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
                                                    <Typography variant="body1">{it.qty}</Typography>
                                                </Box>

                                                {/* Col 3: Subtotal */}
                                                <Box sx={{ ...colCell(true), px: 1.25, py: 1.1, display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
                                                    <Typography variant="body1" fontWeight={900}>
                                                        {fmtIDR(it.subtotal)}
                                                    </Typography>
                                                </Box>
                                            </ButtonBase>
                                        </Paper>
                                    )
                                })}
                            </Stack>
                        </Box>
                    </PerfectScrollbar>
                </Box>

                {/* ===== Bottom: Payment picker (kiri) + Totals (kanan) ===== */}
                <Box sx={{ px: 2.5, py: 1.5, borderTop: '1px solid', borderColor: 'divider', flexShrink: 0 }}>
                    <Box
                        sx={{
                            display: 'grid',
                            gridTemplateColumns: { xs: '1fr', md: '1fr 560px' },
                            gap: 2,
                            alignItems: 'start',
                        }}
                    >
                        {/* LEFT: Payment method picker */}
                        <Box sx={{ minWidth: 0 }}>
                            <Typography variant="subtitle1" fontWeight={900} sx={{ mb: 1 }}>Pilih Pembayaran</Typography>
                            <Stack direction="row" spacing={1.5} flexWrap="wrap">
                                <PaymentOptionCard
                                    selected={method === 'cash'}
                                    title="TUNAI"
                                    subtitle="Bayar pakai uang cash"
                                    icon={<AttachMoneyRounded fontSize="medium" />}
                                    onClick={() => setMethod('cash')}
                                    disabled={isPaid}
                                />
                                <PaymentOptionCard
                                    selected={method === 'qris'}
                                    title="QRIS"
                                    subtitle="Scan QR berbagai e-wallet"
                                    icon={<QrCode2Rounded fontSize="medium" />}
                                    onClick={() => setMethod('qris')}
                                    disabled={isPaid}
                                />
                                <PaymentOptionCard
                                    selected={method === 'card'}
                                    title="KARTU"
                                    subtitle="Debit / Kredit"
                                    icon={<CreditCardRounded fontSize="medium" />}
                                    onClick={() => setMethod('card')}
                                    disabled={isPaid}
                                />
                            </Stack>
                            {isPaid && (
                                <Typography variant="caption" color="text.secondary" sx={{ mt: 0.75, display: 'block' }}>
                                    Bill sudah dibayar — metode dikunci mengikuti data server.
                                </Typography>
                            )}
                        </Box>

                        {/* RIGHT: totals (boxed & divided) */}
                        <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                            <Paper
                                variant="outlined"
                                sx={{
                                    width: 540, maxWidth: '100%', p: 1.25, borderRadius: 2, position: 'relative',
                                    '&::before': { content: '""', position: 'absolute', inset: 0, pointerEvents: 'none', boxShadow: '0 0 0 1px rgba(124,58,237,.35), 0 10px 28px rgba(0,0,0,.06)' }
                                }}
                            >

                                {/* Subtotal */}
                                <Stack direction="row" alignItems="center" sx={{ py: 0.5 }}>
                                    <Typography variant="subtitle1" sx={{ flex: 1 }} fontWeight={900}>Subtotal</Typography>
                                    <Typography variant="h6" fontWeight={900}>{fmtIDR(itemsSubtotal)}</Typography>
                                </Stack>
                                <Divider />

                                {/* Pajak */}
                                <Stack direction="row" alignItems="center" sx={{ py: 0.5 }}>
                                    <Typography variant="subtitle1" sx={{ flex: 1 }} fontWeight={900}>Pajak (10%)</Typography>
                                    <Typography variant="h6" fontWeight={900}>{fmtIDR(tax)}</Typography>
                                </Stack>

                                <Divider sx={{ my: 1 }} />

                                {/* Grand Total */}
                                <Stack
                                    direction="row"
                                    alignItems="center"
                                    sx={{
                                        py: 0.75,
                                        px: 1,
                                        background: (t) => t.palette.mode === 'dark' ? '#3db108' : COLOR_GRAND_TOTAL_GRAD,
                                    }}
                                >
                                    <Typography variant="h6" sx={{ flex: 1, color: '#ffff' }} fontWeight={900}>Grand Total</Typography>
                                    <Typography variant="h4" fontWeight={900} sx={{ WebkitBackgroundClip: 'text', color: '#ffff' }}>
                                        {fmtIDR(grandTotal)}
                                    </Typography>
                                </Stack>

                                {/* Cash box */}
                                {!isPaid && isCash && (
                                    <Box sx={{ mt: 1.25, p: 1.25, border: '1px dashed', borderColor: 'divider', borderRadius: 2, bgcolor: 'action.hover' }}>
                                        <TextField
                                            label="Uang Diterima"
                                            value={cashStr}
                                            onChange={(e) => setCashStr(e.target.value.replace(/[^\d.,]/g, ''))}
                                            inputMode="numeric"
                                            placeholder="contoh: 100000"
                                            variant="outlined"
                                            fullWidth
                                            InputProps={{ startAdornment: <InputAdornment position="start">Rp</InputAdornment> }}
                                            helperText={helper}
                                            FormHelperTextProps={{ sx: { fontWeight: 700 } }}
                                        />
                                    </Box>
                                )}

                                {/* Kembalian */}
                                {!isPaid && isCash && cash >= grandTotal && (
                                    <>
                                        <Divider sx={{ my: 1.25 }} />
                                        <Stack direction="row" alignItems="center">
                                            <Typography variant="subtitle1" sx={{ flex: 1 }} fontWeight={900}>Kembalian</Typography>
                                            <Typography variant="h5" fontWeight={900}>{fmtIDR(change)}</Typography>
                                        </Stack>
                                    </>
                                )}
                            </Paper>
                        </Box>
                    </Box>
                </Box>

                {/* ===== Footer Actions ===== */}
                <Box
                    sx={{
                        p: { xs: 2, md: 2.5 },
                        borderTop: '1px solid', borderColor: 'divider',
                        display: 'flex', gap: 1.25, justifyContent: 'flex-end',
                        flexShrink: 0,
                    }}
                >
                    <Button
                        variant="contained"
                        disabled={isPaid || (isCash && cash < grandTotal)}
                        sx={{ textTransform: 'none', fontWeight: 800, borderRadius: 0, fontSize: { xs: 14, md: 15 } }}
                        title={
                            isPaid
                                ? 'Sudah dibayar'
                                : (isCash ? (cash < grandTotal ? 'Uang belum cukup' : 'Bayar sekarang') : 'Bayar sekarang')
                        }
                    >
                        Bayar
                    </Button>
                    <Button
                        variant="outlined"
                        startIcon={<PrintRounded />}
                        sx={{ textTransform: 'none', fontWeight: 800, borderRadius: 0, fontSize: { xs: 14, md: 15 } }}
                    >
                        Cetak
                    </Button>
                </Box>
            </Paper>
        </Box>
    )
}

export default React.memo(BillListItemDetail)
