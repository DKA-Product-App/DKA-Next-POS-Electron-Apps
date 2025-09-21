// TransactionListItemRow.tsx
'use client'

import * as React from 'react'
import { Box, Chip, ListItemButton, Stack, Typography, Checkbox } from '@mui/material'
import { alpha } from '@mui/material/styles'

import ReceiptLongRounded from '@mui/icons-material/ReceiptLongRounded'
import LocalMallRounded from '@mui/icons-material/LocalMallRounded'
import StorageIcon from '@mui/icons-material/Storage';
import LayersRounded from '@mui/icons-material/LayersRounded'
import PersonOutlineRounded from '@mui/icons-material/PersonOutlineRounded'
import AccessTimeRounded from '@mui/icons-material/AccessTimeRounded'
import CheckRounded from '@mui/icons-material/CheckRounded'

import TransactionListItemPrintTransaction from './TransactionListItemPrintTransaction'

/* ========= Types (mirror dari parent, biar gak ubah struktur) ========= */
export type Name = { first_name: string; last_name?: string }
export type Reference = { id: string; name?: Name; username?: string }
export type OrderType = { id: string; code: string; name: string }
export type Table = { id: string; code: string; name: string }
export type Product = { id: string; name: string; description?: string; image?: string }
export type Variant = { id: string; code?: string; name?: string; price?: string }
export type Item = { id: number; price: string; qty: number; sub_total: string; note?: string | null; reference?: Reference | null; product: Product; variant?: Variant }
export type Batch = { id: string; batch: number; note?: string | null; items: Item[] }
export type Transaction = {
    id?: string; invoice?: string; total?: string; time_created?: string; time_updated?: string; time_closed?: string | null;
    reference?: Reference; shift?: { id?: string; name?: string }; order_type?: OrderType; table?: Table; batches: Batch[]
}

/* ========= Utils khusus Row (copy ringan agar parent gak berubah) ========= */
const rupiah = (n: number | string) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(typeof n === 'string' ? parseFloat(n) : n)
const fmtDT = (iso?: string) => iso ? new Intl.DateTimeFormat('id-ID', { dateStyle: 'medium', timeStyle: 'short', hour12: false, timeZone: 'Asia/Makassar' }).format(new Date(iso)) : '-'
const totalQty = (o: Transaction) => o.batches.reduce((acc, b) => acc + b.items.reduce((a, i) => a + i.qty, 0), 0)
const totalItems = (o: Transaction) => (o.batches ?? []).reduce((acc, b) => acc + (b.items ?? []).length, 0)
const totalBatches = (o: Transaction) => o.batches.length
// ⬇️ helper: dianggap void kalau sudah disetujui
const isVoided = (i: Item) => i?.['void']?.is_approved === true
const totalPrices = (o: Transaction) =>
    (o.batches ?? []).reduce((acc, b) =>
            acc + (b.items ?? []).reduce((a, i) =>
                    a + (isVoided(i) ? 0 : (+i.sub_total || 0))
                , 0)
        , 0)

/* ========= Timer ========= */
const addMonths = (d: Date, months: number) => {
    const nd = new Date(d.getTime())
    const targetMonth = nd.getMonth() + months
    const targetYear = nd.getFullYear() + Math.floor(targetMonth / 12)
    const month = ((targetMonth % 12) + 12) % 12
    const day = nd.getDate()
    const end = new Date(targetYear, month + 1, 0).getDate()
    nd.setFullYear(targetYear, month, Math.min(day, end))
    return nd
}
const diffParts = (start: Date, end: Date) => {
    if (end < start) return { years: 0, months: 0, days: 0, hours: 0, minutes: 0, seconds: 0 }
    let years = end.getFullYear() - start.getFullYear()
    const yAnchor = new Date(start.getTime()); yAnchor.setFullYear(start.getFullYear() + years)
    if (yAnchor > end) { years--; yAnchor.setFullYear(start.getFullYear() + years) }
    let months = (end.getMonth() - yAnchor.getMonth()) + (end.getFullYear() - yAnchor.getFullYear()) * 12
    let ymAnchor = addMonths(yAnchor, months)
    if (ymAnchor > end) { months--; ymAnchor = addMonths(yAnchor, months) }
    const ms = end.getTime() - ymAnchor.getTime()
    const sec = Math.floor(ms / 1000)
    const days = Math.floor(sec / 86400)
    const hours = Math.floor((sec % 86400) / 3600)
    const minutes = Math.floor((sec % 3600) / 60)
    const seconds = Math.floor(sec % 60)
    return { years, months, days, hours, minutes, seconds }
}
const formatReadable = (p: ReturnType<typeof diffParts>) => {
    const { years, months, days, hours, minutes, seconds } = p
    if (years > 0)   return `${years} tahun, ${months} bulan, ${days} hari, ${hours} jam, ${minutes} menit`
    if (months > 0)  return `${months} bulan, ${days} hari, ${hours} jam, ${minutes} menit, ${seconds} detik`
    if (days > 0)    return `${days} hari, ${hours} jam, ${minutes} menit, ${seconds} detik`
    return `${hours} jam, ${minutes} menit, ${seconds} detik`
}
const TimerText: React.FC<{ startIso?: string; endIso?: string | null; active: boolean }> = ({ startIso, endIso, active }) => {
    const [now, setNow] = React.useState(() => Date.now())
    React.useEffect(() => { if (!active) return; const id = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(id) }, [active])
    const label = React.useMemo(() => {
        const zero = '0 jam, 0 menit, 0 detik'
        if (!startIso) return zero
        const start = new Date(startIso)
        if (isNaN(start.getTime())) return zero
        if (active) return formatReadable(diffParts(start, new Date(now)))
        if (endIso) {
            const end = new Date(endIso)
            if (!isNaN(end.getTime())) return formatReadable(diffParts(start, end))
        }
        return zero
    }, [active, startIso, endIso, now])
    return (
        <Typography
            variant="caption"
            sx={{
                fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
                fontWeight: 800, letterSpacing: 0.6, color: 'inherit', textAlign: 'right', whiteSpace: 'normal', overflowWrap: 'anywhere',
                '@keyframes tPulse': { '0%': { opacity: 0.9 }, '50%': { opacity: 1 }, '100%': { opacity: 0.9 } },
                animation: active ? 'tPulse 1.8s ease-in-out infinite' : 'none', userSelect: 'none',
            }}
            aria-label={active ? 'Durasi transaksi aktif' : 'Durasi saat transaksi ditutup'}
        >
            {label}
        </Typography>
    )
}

/* ========= Checkbox bulat + animasi zoom out 3x ========= */
const RoundCheckbox: React.FC<{
    checked: boolean
    onChange: (checked: boolean) => void
    onClick?: (e: React.MouseEvent) => void
    'aria-label'?: string
    sizePx?: number
    colorKey?: 'success' | 'primary' | 'info'
    outScale?: number
    overshootScale?: number
    durationMs?: number
}> = ({
          checked,
          onChange,
          onClick,
          'aria-label': ariaLabel,
          sizePx = 22,
          colorKey = 'success',
          outScale = 0.33,          // 3× lebih kecil saat zoom out
          overshootScale = 1.18,
          durationMs = 360,
      }) => {
    const baseSx = { width: sizePx, height: sizePx, borderRadius: '50%', display: 'grid', placeItems: 'center', transition: 'all .22s ease' } as const
    const uncheckedIcon = <span className="round-unchecked" style={{ ...baseSx, border: '2px solid', borderColor: 'currentColor' }} />
    const checkedIcon = (
        <span className="round-checked" style={{ ...baseSx, ['--outScale' as any]: outScale, ['--overScale' as any]: overshootScale, ['--dur' as any]: `${durationMs}ms` } as React.CSSProperties }>
      <CheckRounded fontSize="inherit" />
    </span>
    )

    return (
        <Checkbox
            checked={checked}
            onChange={(e) => onChange(e.target.checked)}
            onClick={onClick}
            inputProps={{ 'aria-label': ariaLabel }}
            icon={uncheckedIcon}
            checkedIcon={checkedIcon}
            disableRipple
            sx={(theme) => ({
                p: 0, color: theme.palette.text.disabled,
                '& .round-unchecked': { color: theme.palette.action.disabled, transform: 'scale(1)', background: theme.palette.background.paper },
                '& .round-checked': {
                    color: theme.palette.common.white,
                    backgroundColor: theme.palette[colorKey].main,
                    border: `2px solid ${theme.palette[colorKey].main}`,
                    boxShadow: `0 0 0 6px ${alpha(theme.palette[colorKey].main, 0.16)} inset, 0 3px 10px ${alpha(theme.palette[colorKey].main, 0.35)}`,
                    transform: 'scale(1)', animation: 'zoomOutIn var(--dur) cubic-bezier(.2,.9,.1,1.2)', transformOrigin: 'center',
                    '& .MuiSvgIcon-root': { fontSize: sizePx * 0.78 },
                },
                '&:hover .round-unchecked': { boxShadow: `0 0 0 4px ${alpha(theme.palette[colorKey].main, 0.08)} inset` },
                '&:hover .round-checked': { boxShadow: `0 0 0 6px ${alpha(theme.palette[colorKey].main, 0.22)} inset, 0 3px 12px ${alpha(theme.palette[colorKey].main, 0.45)}` },
                '@media (prefers-reduced-motion: reduce)': { '& .round-checked': { animation: 'none' } },
                '@keyframes zoomOutIn': {
                    '0%': { transform: 'scale(1)' },
                    '35%': { transform: 'scale(var(--outScale))' },
                    '65%': { transform: 'scale(var(--overScale))' },
                    '100%': { transform: 'scale(1)' },
                },
            })}
        />
    )
}

/* ========= ROW ========= */
export const TransactionListItemRow: React.FC<{
    o: Transaction
    singleSelected?: boolean
    multiChecked?: boolean
    onRowClick?: () => void
    onMultiToggle?: (checked: boolean) => void
}> = ({ o, singleSelected = false, multiChecked = false, onRowClick, onMultiToggle }) => {
    const qtys = totalQty(o)
    const items = totalItems(o)
    const batches = totalBatches(o)
    const prices = totalPrices(o)
    const isClosed = Boolean(o.time_closed)
    const cardBorderColor = singleSelected ? 'primary.outlinedBorder' : (isClosed ? 'error.light' : 'divider')

    return (
        <>
            <ListItemButton
                onClick={onRowClick}
                selected={singleSelected}
                sx={{
                    position: 'relative', alignItems: 'flex-start', py: 1.25, px: 1.5, mb: 0,
                    border: '1px solid', borderColor: cardBorderColor,
                    bgcolor: singleSelected ? 'action.selected' : (isClosed ? 'action.hover' : 'background.paper'),
                    boxShadow: singleSelected ? '0 10px 24px rgba(0,0,0,0.12)' : '0 2px 8px rgba(0,0,0,0.04)',
                    transition: 'transform .15s ease, box-shadow .2s ease, border-color .2s ease, background-color .2s ease',
                    transform: 'translateY(0)',
                    '&:hover': { transform: 'translateY(-1px)', boxShadow: '0 12px 28px rgba(0,0,0,0.12)', bgcolor: singleSelected ? 'action.selected' : (isClosed ? 'action.hover' : 'action.hover') },
                    borderTopLeftRadius: 8, borderTopRightRadius: 8, borderBottomLeftRadius: 0, borderBottomRightRadius: 0,
                    '&::before': {
                        content: '""', position: 'absolute', left: 0, top: 0, bottom: 0, width: 4,
                        borderTopLeftRadius: 8, borderBottomLeftRadius: 0,
                        background: singleSelected
                            ? 'linear-gradient(180deg, #6366F1, #8B5CF6 35%, #EC4899)'
                            : (isClosed ? 'linear-gradient(180deg, #ef4444, #dc2626 60%, #b91c1c)' : 'transparent'),
                    },
                }}
            >
                <Stack spacing={0.75} width="100%">
                    {/* Baris 1 */}
                    <Stack direction="row" alignItems="center" justifyContent="space-between" gap={1}>
                        <Stack direction="row" spacing={1} alignItems="center" minWidth={0}>
                            <ReceiptLongRounded fontSize="small" />
                            <Typography variant="h6" fontWeight={900} noWrap sx={{ letterSpacing: 0.2, lineHeight: 1.2, fontFeatureSettings: '"tnum" 1, "lnum" 1' }}>
                                # {o.invoice}
                            </Typography>
                            <Chip size="small" color="info" label={o.order_type?.name ?? '-'} variant="filled" />
                            <Chip size="small" color="info" label={o.table?.code ? `${o.table.code}` : 'No table'} variant="filled" />
                        </Stack>
                        <Typography variant="subtitle1" fontWeight={900}>{rupiah(prices ?? 0)}</Typography>
                    </Stack>

                    {/* Baris 2 */}
                    <Stack direction="row" alignItems="center" gap={0.75}>
                        <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap sx={{ flex: 1, minWidth: 0 }}>
                            <Chip size="small" label={isClosed ? 'Selesai' : 'Aktif'} color={isClosed ? 'error' : 'success'} variant="filled" />
                            <Chip size="small" icon={<LocalMallRounded />} label={`${qtys} item`} />
                            <Chip size="small" icon={<LayersRounded />} label={`${batches} batch`} />
                        </Stack>
                        {/* @ts-ignore */}
                        <TransactionListItemPrintTransaction tx={o} />
                    </Stack>

                    {/* Baris 3 — kasir, shift, dan kode meja */}
                    <Stack direction="row" alignItems="center" gap={0.75}>
                        <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap sx={{ flex: 1, minWidth: 0 }}>
                            <Chip
                                size="small"
                                icon={<PersonOutlineRounded />}
                                label={o.reference?.name?.first_name ?? o.reference?.username ?? (o.reference?.id ? `${o.reference.id.slice(0,8)}…` : '-')}
                                title={o.reference?.id ?? ''}
                            />
                            <Chip size="small" icon={<AccessTimeRounded />} label={o.shift?.name ?? '-'} />
                            <Chip size="small" icon={<StorageIcon />} label={`${items} item`} />
                        </Stack>
                    </Stack>

                    {/* Timestamp asli + RoundCheckbox (kanan) */}
                    <Stack direction="row" alignItems="center" justifyContent="space-between">
                        <Typography variant="caption" color="text.secondary">{fmtDT(o.time_created)}</Typography>
                        {!isClosed && (
                            <RoundCheckbox
                                checked={!!multiChecked}
                                onChange={(c) => onMultiToggle ? onMultiToggle(c) : undefined}
                                onClick={(e) => e.stopPropagation()}
                                aria-label={`Pilih transaksi ${o.invoice} untuk multi-select`}
                                sizePx={22}
                                colorKey="success"
                                outScale={0.33}
                                overshootScale={1.2}
                                durationMs={400}
                            />
                        )}
                    </Stack>
                </Stack>
            </ListItemButton>

            {/* Footer nempel — TANPA checkbox lagi */}
            <Box
                sx={{
                    border: '1px solid', borderTop: 'none', borderColor: cardBorderColor,
                    borderBottomLeftRadius: 8, borderBottomRightRadius: 8,
                    bgcolor: isClosed ? 'error.main' : 'success.main',
                    color: isClosed ? 'error.contrastText' : 'success.contrastText',
                    px: 1.5, py: 0.8, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1, mb: 1,
                }}
            >
                <TimerText startIso={o.time_created} endIso={o.time_closed} active={!isClosed} />
            </Box>
        </>
    )
}

export default React.memo(TransactionListItemRow)
