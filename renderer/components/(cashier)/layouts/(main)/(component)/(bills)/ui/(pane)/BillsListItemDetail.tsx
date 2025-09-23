// (components)/BillListItemDetail.tsx
'use client'

import * as React from 'react'
import {
    Box, Paper, Stack, Typography, Chip, Button, TextField, InputAdornment,
    ButtonBase, Divider, Tooltip
} from '@mui/material'
import PrintRounded from '@mui/icons-material/PrintRounded'
import RequestQuoteRounded from '@mui/icons-material/RequestQuoteRounded'
import LocalMallRounded from '@mui/icons-material/LocalMallRounded'
import AccessTimeRounded from '@mui/icons-material/AccessTimeRounded'
import AttachMoneyRounded from '@mui/icons-material/AttachMoneyRounded'
import QrCode2Rounded from '@mui/icons-material/QrCode2Rounded'
import CreditCardRounded from '@mui/icons-material/CreditCardRounded'
import TakeoutDiningRounded from '@mui/icons-material/TakeoutDiningRounded'
import RestaurantRounded from '@mui/icons-material/RestaurantRounded'
import PerfectScrollbar from 'react-perfect-scrollbar'
import 'react-perfect-scrollbar/dist/css/styles.css'

import Image, { ImageLoader } from 'next/image'
import Skeleton from '@mui/material/Skeleton'
import { TransactionBill, TransactionBillTransactionItem } from '../../types/transaction.bill.type'
import {useTabNavigationHandlerContext} from "../../../(transaction)/context/TabNavigationHandlerContext";

/* ================================= THEME ACCENTS ================================= */
const PURPLE_GRAD = 'linear-gradient(90deg, #6366F1, #8B5CF6 35%, #EC4899)'
const GRAND_GRAD = 'linear-gradient(90deg,rgba(10,224,7,1) 0%, rgba(7,168,61,1) 51%, rgba(44,135,138,1) 100%)'
const ACCENT = 'linear-gradient(90deg, #7C3AED, #6366F1 45%, #8B5CF6)'

/* ================================= HELPERS ================================= */
const fmtIDR = (n?: number | string) =>
    typeof n === 'number' || (typeof n === 'string' && n !== '')
        ? new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(Number(n))
        : 'Rp —'

const fmtTimeShort = (iso?: string) =>
    iso ? new Date(iso).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : '—'

const statusChip = (bill: TransactionBill) => {
    const paid = (bill as any).paid
    if (!paid) return { color: 'warning' as const, label: 'Unpaid' }
    return paid.is_paid ? { color: 'success' as const, label: 'Paid' } : { color: 'warning' as const, label: 'Unpaid' }
}

const first = <T,>(a?: T[] | T | null): T | undefined =>
    Array.isArray(a) ? a[0] : (a as T | undefined)

/* ------------ Image helpers ------------- */
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
            <Box sx={{ position: 'absolute', inset: 0, pointerEvents: 'none', background: (t) => `linear-gradient(to bottom, ${t.palette.action.hover}00 0%, ${t.palette.action.hover}40 70%, ${t.palette.action.hover}66 100%)` }} />
        </Box>
    )
}

/* ================================= DATA DERIVERS ================================= */
const getInvoice = (b: TransactionBill) => (b as any).transaction?.invoice ?? String((b as any).number ?? '')
const getIssuedAt = (b: TransactionBill) => (b as any).time_created || (b as any).transaction?.time_created
const getPaidAt = (b: TransactionBill) => (b as any).paid?.time
const getRef = (b: TransactionBill) =>
    (b as any).transaction?.table?.name
    || (b as any).transaction?.table?.code
    || (b as any).transaction?.order_type?.name
    || (b as any).transaction?.order_type?.code
    || undefined

const deriveLineItems = (bill: TransactionBill): TransactionBillTransactionItem[] =>
    (bill.items ?? []).map((wrap) => {
        const it = wrap.transactionItem ?? {}
        return {
            id: String(wrap.id ?? it.id ?? Math.random()),
            qty: Number(wrap.qty ?? it.qty ?? 0),
            price: Number((wrap.price ?? it.price ?? 0) as number),
            sub_total: Number((wrap.sub_total ?? it.sub_total ?? 0) as number),
            note: it.note ?? undefined,
            number: bill.number ?? "# -",
            time_created: it.time_created,
            time_updated: it.time_updated,
            void: it.void,
            reference: it.reference,
            product: it.product,
            variant: it.variant,
        } as TransactionBillTransactionItem
    })

/* ================================== SUB-COMPONENTS ================================== */
type PaymentMethod = {
    id: string
    icon?: string
    name: string
    description?: string
    need_tender?: boolean
    status?: boolean
}
type ApiResponse<T> = { status: boolean; code: number; msg: string; data: T }

const iconFromMethod = (m?: PaymentMethod) => {
    const key = (m?.icon || '').toLowerCase()
    const nm = (m?.name || '').toLowerCase()
    if (key.includes('qr') || nm.includes('qris')) return <QrCode2Rounded fontSize="medium" />
    if (key.includes('card') || nm.includes('kartu')) return <CreditCardRounded fontSize="medium" />
    if (key.includes('takeout')) return <TakeoutDiningRounded fontSize="medium" />
    if (key.includes('restaurant')) return <RestaurantRounded fontSize="medium" />
    if (key.includes('cash') || nm.includes('tunai') || nm.includes('cash')) return <AttachMoneyRounded fontSize="medium" />
    return <AttachMoneyRounded fontSize="medium" />
}

const MethodCard: React.FC<{
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
        <Box sx={(t) => ({ width: 56, height: 56, borderRadius: '50%', display: 'grid', placeItems: 'center', bgcolor: t.palette.action.hover })}>
            {icon}
        </Box>
        <Typography variant="subtitle1" fontWeight={800} sx={{ letterSpacing: .2 }}>{title}</Typography>
        {subtitle && <Typography variant="caption" color="text.secondary">{subtitle}</Typography>}
    </Box>
)

const PaymentMethodsPicker: React.FC<{
    disabled?: boolean
    selectedId?: string
    onSelect: (m: PaymentMethod) => void
}> = ({ disabled, selectedId, onSelect }) => {
    const [methods, setMethods] = React.useState<PaymentMethod[]>([])
    const [loading, setLoading] = React.useState(true)
    const [err, setErr] = React.useState<string | null>(null)

    React.useEffect(() => {
        let alive = true
        setLoading(true)
        // @ts-ignore
        window.api.invoke('api.config.data.payment.method:read.all', {})
            .then((res: ApiResponse<PaymentMethod[]> | { data: PaymentMethod[] } | undefined) => {
                const arr = Array.isArray((res as any)?.data) ? (res as any).data as PaymentMethod[] : []
                if (!alive) return
                setMethods(arr.filter(m => m.status !== false))
                setErr(null)
            })
            .catch((e: any) => {
                alive && setMethods([])
                alive && setErr(typeof e?.message === 'string' ? e.message : 'Gagal memuat metode pembayaran')
            })
            .finally(() => { alive && setLoading(false) })
        return () => { alive = false }
    }, [])

    return (
        <Stack direction="row" spacing={1.5} flexWrap="wrap">
            {methods.map(m => (
                <MethodCard
                    key={m.id}
                    selected={selectedId === m.id}
                    title={m.name}
                    subtitle={m.description}
                    icon={iconFromMethod(m)}
                    onClick={() => onSelect(m)}
                    disabled={disabled || loading}
                />
            ))}
            {err && (
                <Tooltip title={err}><Chip size="small" color="error" label="Gagal memuat metode" /></Tooltip>
            )}
        </Stack>
    )
}

/* ================================= MAIN ================================= */
type TenderMode = 'idle' | 'entry' | 'ready'

const BillListItemDetail: React.FC<{ bill: TransactionBill }> = ({ bill }) => {
    const st = statusChip(bill)
    const isPaid = !!(bill as any).paid?.is_paid
    const items = deriveLineItems(bill)

    const sum = (arr: number[]) => arr.reduce((a, b) => a + b, 0)
    const itemsSubtotal = items.length ? sum(items.map(i => Number(i.sub_total ?? 0))) : 0
    const [taxRate] = React.useState<number>(0.10)
    const tax = Math.max(0, Math.round(itemsSubtotal * taxRate))
    const grandTotal = Math.max(0, itemsSubtotal + tax)

    const invoice = getInvoice(bill)
    const ref = getRef(bill)
    const itemsCount = items.length
    const qtyTotal = items.reduce((a, it) => a + Number(it.qty ?? 0), 0)

    /* ---------------- PAYMENT STATE ---------------- */
    const [method, setMethod] = React.useState<PaymentMethod | null>(null)
    const [needTender, setNeedTender] = React.useState<boolean>(false)
    const [tenderMode, setTenderMode] = React.useState<TenderMode>('idle')
    const [showTotals, setShowTotals] = React.useState<boolean>(true)
    const [cashStr, setCashStr] = React.useState<string>('')
    const cash = cashStr === '' ? 0 : Number(cashStr.replaceAll('.', '').replaceAll(',', ''))
    const change = Math.max(0, cash - grandTotal)
    const shortage = Math.max(0, grandTotal - cash)
    const cashRef = React.useRef<HTMLInputElement>(null)

    React.useEffect(() => {
        const nt = !!method?.need_tender
        setNeedTender(nt)
        if (isPaid) {
            setTenderMode('idle')
            setShowTotals(true)
            return
        }
        if (nt) {
            setTenderMode('entry')
            setShowTotals(false)
            setTimeout(() => cashRef.current?.focus(), 50)
        } else {
            setTenderMode('idle')
            setCashStr('')
            setShowTotals(true)
        }
    }, [method, isPaid])

    const onCashKeyDown: React.KeyboardEventHandler<HTMLInputElement> = (e) => {
        if (e.key === 'Enter' && cash >= grandTotal) {
            setTenderMode('ready')
            setShowTotals(true)
        }
        if (e.key === 'Escape') {
            setTenderMode('entry')
            setShowTotals(false)
            setCashStr('')
        }
    }

    React.useEffect(() => {
        if (tenderMode === 'ready' && cash < grandTotal && needTender && !isPaid) {
            setTenderMode('entry')
            setShowTotals(false)
        }
    }, [cash, grandTotal, needTender, isPaid, tenderMode])

    const helper = needTender
        ? (cash > 0 ? (cash < grandTotal ? `Kurang ${fmtIDR(shortage)}` : 'Uang cukup • tekan Enter') : 'Masukkan nominal tunai')
        : 'Pilih metode pembayaran'

    const canPay = !isPaid && (!needTender || tenderMode === 'ready')

    /* ---------------- ITEM GRID ---------------- */
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

    const printLabel = isPaid ? 'Print Bukti Pembayaran' : 'Print Tagihan'

    return (
        <Box sx={{ height: '100%', width: '100%' }}>
            <Paper elevation={0} sx={{ height: '100%', width: '100%', border: '1px solid', borderColor: 'divider', bgcolor: 'background.paper', borderRadius: 0, display: 'flex', flexDirection: 'column' }}>
                {/* ===== Header ===== */}
                <Box sx={{ p: { xs: 2, md: 2.5 }, borderBottom: '1px solid', borderColor: 'divider', flexShrink: 0 }}>
                    <Stack direction="row" justifyContent="space-between" alignItems="flex-start" gap={1.5}>
                        <Stack spacing={0.75} minWidth={0}>
                            <Stack direction="row" spacing={1.25} alignItems="center" minWidth={0}>
                                <RequestQuoteRounded sx={{ fontSize: { xs: 18, md: 20 } }} />
                                <Typography variant="h5" fontWeight={900} noWrap sx={{ letterSpacing: 0.2 }}>
                                    #{' '}{bill.number}
                                </Typography>
                                <Chip size="small" color={st.color} label={st.label} sx={{ borderRadius: 0, fontSize: { xs: 12, md: 13 } }} />
                                <Chip size="small" variant="outlined" label={`${itemsCount} item${itemsCount === 1 ? '' : 's'} • ${qtyTotal} qty`} sx={{ borderRadius: 0, fontSize: { xs: 12, md: 13 } }} />
                            </Stack>

                            <Stack direction="row" spacing={2} flexWrap="wrap" sx={{ color: 'text.secondary' }}>
                                <Stack direction="row" spacing={0.75} alignItems="center">
                                    <AccessTimeRounded sx={{ fontSize: 18 }} />
                                    <Typography variant="body1">
                                        {isPaid ? `Paid — ${fmtTimeShort(getPaidAt(bill))}` : `Issued — ${fmtTimeShort(getIssuedAt(bill))}`}
                                    </Typography>
                                </Stack>
                                <Typography variant="body1">Ref — {ref ?? '—'}</Typography>
                            </Stack>
                        </Stack>
                    </Stack>
                </Box>

                {/* ===== Items header ===== */}
                <Box sx={{ px: { xs: 2, md: 2.5 }, pt: 1, pb: 1, flexShrink: 0 }}>
                    <Stack direction="row" alignItems="center" spacing={1.25} sx={{ mb: 1 }}>
                        <LocalMallRounded sx={{ fontSize: { xs: 18, md: 20 } }} />
                        <Typography variant="subtitle1" fontWeight={800}>Ringkasan Item</Typography>
                    </Stack>

                    <Box sx={(t) => ({ display: 'grid', gridTemplateColumns: { xs: ITEM_COLS.xs, md: ITEM_COLS.md }, gap: 0, border: '1px solid', borderColor: 'divider', bgcolor: t.palette.action.hover })}>
                        <Box sx={{ ...colCell(false), px: 1.25, py: 1 }}><Typography variant="body2" fontWeight={900} textAlign="center">#</Typography></Box>
                        <Box sx={{ ...colCell(true), px: 1.25, py: 1 }}><Typography variant="body2" fontWeight={900}>Produk</Typography></Box>
                        <Box sx={{ ...colCell(true), px: 1.25, py: 1 }}><Typography variant="body2" fontWeight={900} textAlign="right">Qty</Typography></Box>
                        <Box sx={{ ...colCell(true), px: 1.25, py: 1 }}><Typography variant="body2" fontWeight={900} textAlign="right">Subtotal</Typography></Box>
                    </Box>
                </Box>

                {/* ===== Items (scroll) ===== */}
                <Box sx={{ flex: 1, minHeight: 0 }}>
                    <PerfectScrollbar options={{ suppressScrollX: true, wheelPropagation: false }}>
                        <Box sx={{ px: { xs: 2, md: 2.5 }, pb: 2 }}>
                            <Stack spacing={1}>
                                {items.map((it, idx) => {
                                    const imgSrc = ph(it.product?.name ?? '', it.product?.image ?? '')
                                    return (
                                        <Paper key={it.id} variant="outlined" sx={{ borderRadius: 2, overflow: 'hidden', position: 'relative', '&::before': { content: '""', position: 'absolute', left: 0, top: 0, bottom: 0, width: 4, background: ACCENT } }}>
                                            <ButtonBase sx={{ width: '100%', display: 'grid', alignItems: 'stretch', textAlign: 'left', gridTemplateColumns: { xs: ITEM_COLS.xs, md: ITEM_COLS.md }, p: 0, '&:hover': { backgroundColor: 'action.hover' } }}>
                                                {/* # */}
                                                <Box sx={{ ...colCell(false), px: 1.25, py: 1.1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                    <Chip size="small" label={idx + 1} sx={{ fontWeight: 800, background: PURPLE_GRAD, color: '#fff' }} />
                                                </Box>
                                                {/* Produk */}
                                                <Box sx={{ ...colCell(true), px: 1.25, py: 1.1, display: 'flex', alignItems: 'flex-start', gap: 1.25 }}>
                                                    <Box sx={{ width: 56, flexShrink: 0 }}>
                                                        <ImgWithSkeleton loader={uploadsLoader} src={imgSrc} alt={it.product?.name ?? ''} radius={8} />
                                                    </Box>
                                                    <Box sx={{ minWidth: 0 }}>
                                                        <Typography variant="body1" fontWeight={900} noWrap title={it.product?.name ?? ''}>{it.product?.name ?? ''}</Typography>
                                                        <Stack direction="row" spacing={0.75} alignItems="center" sx={{ mt: 0.25, minWidth: 0, flexWrap: 'wrap' }}>
                                                            {it.product?.category && (
                                                                <Typography variant="caption" sx={(t) => ({ px: 0.75, py: 0.25, border: '1px solid', borderColor: 'divider', bgcolor: t.palette.action.hover, fontWeight: 700, textTransform: 'uppercase', letterSpacing: .3 })} noWrap title={first(it.product?.category)?.name ?? ''}>{first(it.product?.category)?.name ?? ''}</Typography>
                                                            )}
                                                            {it.variant && (<><Typography variant="caption" color="text.disabled">•</Typography><Typography variant="caption" color="text.secondary" noWrap title={it.variant.name}>{it.variant.name}</Typography></>)}
                                                        </Stack>
                                                        {it.note && <Typography variant="body2" color="text.secondary" noWrap sx={{ mt: 0.25 }} title={it.note}>{it.note}</Typography>}
                                                    </Box>
                                                </Box>
                                                {/* Qty */}
                                                <Box sx={{ ...colCell(true), px: 1.25, py: 1.1, display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
                                                    <Typography variant="body1">{it.qty}</Typography>
                                                </Box>
                                                {/* Subtotal */}
                                                <Box sx={{ ...colCell(true), px: 1.25, py: 1.1, display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
                                                    <Typography variant="body1" fontWeight={900}>{fmtIDR(it.sub_total)}</Typography>
                                                </Box>
                                            </ButtonBase>
                                        </Paper>
                                    )
                                })}
                            </Stack>
                        </Box>
                    </PerfectScrollbar>
                </Box>

                {/* ===== Bottom: Payment + Totals/Tender ===== */}
                <Box sx={{ px: 2.5, py: 1.5, borderTop: '1px solid', borderColor: 'divider', flexShrink: 0 }}>
                    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 560px' }, gap: 2, alignItems: 'start' }}>
                        {/* LEFT: Methods */}
                        <Box sx={{ minWidth: 0 }}>
                            <Typography variant="subtitle1" fontWeight={900} sx={{ mb: 1 }}>Pilih Pembayaran</Typography>
                            <PaymentMethodsPicker
                                disabled={isPaid}
                                selectedId={method?.id}
                                onSelect={(m) => setMethod(m)}
                            />
                            {isPaid && <Typography variant="caption" color="text.secondary" sx={{ mt: 0.75, display: 'block' }}>Bill sudah dibayar — metode dikunci mengikuti data server.</Typography>}
                        </Box>

                        {/* RIGHT: Card */}
                        <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                            <Paper variant="outlined" sx={{ width: 700, maxWidth: '100%', p: 1.25, borderRadius: 2, position: 'relative', '&::before': { content: '""', position: 'absolute', inset: 0, pointerEvents: 'none', boxShadow: '0 0 0 1px rgba(124,58,237,.35), 0 10px 28px rgba(0,0,0,.06)' } }}>
                                {/* Tender (ENTRY) */}
                                {!isPaid && !!method?.need_tender && tenderMode === 'entry' && (
                                    <>
                                        <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                                            <Typography variant="subtitle2" fontWeight={800} sx={{ mb: 0.75 }}>
                                                Masukkan Nilai Uang Pelanggan
                                            </Typography>

                                            <Box
                                                sx={{
                                                    p: 1.25,
                                                    border: '1px dashed',
                                                    borderColor: 'divider',
                                                    borderRadius: 2,
                                                    bgcolor: 'action.hover',
                                                    flex: 1,
                                                    display: 'flex',
                                                    alignItems: 'center'
                                                }}
                                            >
                                                <TextField
                                                    inputRef={cashRef}
                                                    label="Uang Diterima"
                                                    value={cashStr}
                                                    onChange={(e) => setCashStr(e.target.value.replace(/[^\d.,]/g, ''))}
                                                    onKeyDown={onCashKeyDown}
                                                    inputMode="numeric"
                                                    placeholder="contoh: 100000"
                                                    variant="outlined"
                                                    fullWidth
                                                    InputProps={{ startAdornment: <InputAdornment position="start">Rp</InputAdornment> }}
                                                    helperText={!!cash ? (cash < grandTotal ? `Kurang ${fmtIDR(grandTotal - cash)}` : 'Uang cukup • tekan Enter') : 'Masukkan nominal tunai'}
                                                    FormHelperTextProps={{ sx: { fontWeight: 700 } }}
                                                />
                                            </Box>

                                            {/* Footer: minus merah kalau kurang */}
                                            <Box sx={{ mt: 'auto' }}>
                                                <Divider sx={{ my: 1.25 }} />
                                                <Stack direction="row" alignItems="center">
                                                    <Typography variant="subtitle1" sx={{ flex: 1 }} fontWeight={900}>
                                                        {(cash - grandTotal) < 0 ? 'Kekurangan' : 'Kembalian'}
                                                    </Typography>
                                                    <Typography
                                                        variant="h5"
                                                        fontWeight={900}
                                                        sx={{ color: (t) => (cash - grandTotal < 0 ? t.palette.error.main : t.palette.success.main) }}
                                                    >
                                                        {(cash - grandTotal) < 0
                                                            ? `- ${fmtIDR(Math.max(0, grandTotal - cash))}`
                                                            : fmtIDR(Math.max(0, cash - grandTotal))}
                                                    </Typography>
                                                </Stack>
                                            </Box>
                                        </Box>
                                    </>
                                )}

                                {/* Totals (IDLE/READY/Non-tender/Paid) */}
                                {showTotals && (
                                    <>
                                        <Stack direction="row" alignItems="center" sx={{ py: 0.5 }}>
                                            <Typography variant="subtitle1" sx={{ flex: 1 }} fontWeight={900}>Subtotal</Typography>
                                            <Typography variant="h6" fontWeight={900}>{fmtIDR(itemsSubtotal)}</Typography>
                                        </Stack>
                                        <Divider />
                                        <Stack direction="row" alignItems="center" sx={{ py: 0.5 }}>
                                            <Typography variant="subtitle1" sx={{ flex: 1 }} fontWeight={900}>Pajak (10%)</Typography>
                                            <Typography variant="h6" fontWeight={900}>{fmtIDR(tax)}</Typography>
                                        </Stack>
                                        <Divider sx={{ my: 1 }} />
                                        <Stack direction="row" alignItems="center" sx={{ py: 0.75, px: 1, background: (t) => t.palette.mode === 'dark' ? '#3db108' : GRAND_GRAD }}>
                                            <Typography variant="h6" sx={{ flex: 1, color: '#fff' }} fontWeight={900}>Grand Total</Typography>
                                            <Typography variant="h4" fontWeight={900} sx={{ color: '#fff' }}>{fmtIDR(grandTotal)}</Typography>
                                        </Stack>
                                        {!isPaid && !!method?.need_tender && tenderMode === 'ready' && (
                                            <>
                                                <Divider sx={{ my: 1.25 }} />
                                                <Stack direction="row" alignItems="center">
                                                    <Typography variant="subtitle1" sx={{ flex: 1 }} fontWeight={900}>Kembalian</Typography>
                                                    <Typography variant="h5" fontWeight={900}>{fmtIDR(Math.max(0, change))}</Typography>
                                                </Stack>
                                            </>
                                        )}
                                    </>
                                )}
                            </Paper>
                        </Box>
                    </Box>
                </Box>

                {/* ===== Footer ===== */}
                <Box sx={{ p: { xs: 2, md: 2.5 }, borderTop: '1px solid', borderColor: 'divider', display: 'flex', gap: 1.25, justifyContent: 'flex-end', flexShrink: 0 }}>
                    <Button
                        variant="contained"
                        color="success"
                        disabled={!(!isPaid && (!method?.need_tender || tenderMode === 'ready'))}
                        startIcon={<AttachMoneyRounded sx={{ fontSize: 36 }} />}
                        sx={{ textTransform: 'none', fontWeight: 800, borderRadius: 2, fontSize: { xs: 14, md: 15 }, py: 1.1, px: 2.2 }}
                        title={isPaid ? 'Sudah dibayar' : (method?.need_tender ? (tenderMode === 'ready' ? 'Bayar sekarang' : 'Masukkan & konfirmasi nominal (Enter)') : (method ? 'Bayar sekarang' : 'Pilih metode'))}
                    >
                        Bayar
                    </Button>

                    <Button
                        variant="outlined"
                        color={(isPaid) ? 'success' : 'warning'}
                        startIcon={<PrintRounded sx={{ fontSize: 36 }} />}
                        sx={{ textTransform: 'none', fontWeight: 800, borderRadius: 2, fontSize: { xs: 14, md: 15 }, py: 1.1, px: 2.2 }}
                    >
                        {printLabel}
                    </Button>
                </Box>
            </Paper>
        </Box>
    )
}

export default React.memo(BillListItemDetail)
