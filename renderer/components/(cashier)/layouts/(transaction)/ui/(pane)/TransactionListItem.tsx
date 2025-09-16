'use client'

import * as React from 'react'
import { Box, Chip, List, ListItemButton, Stack, Typography, TextField, InputAdornment, IconButton, Popover, ToggleButtonGroup, ToggleButton, Divider } from '@mui/material'
import PerfectScrollbar from 'react-perfect-scrollbar'
import 'react-perfect-scrollbar/dist/css/styles.css'
import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'

// Icons
import ReceiptLongRounded from '@mui/icons-material/ReceiptLongRounded'
import TableRestaurantRounded from '@mui/icons-material/TableRestaurantRounded'
import LocalMallRounded from '@mui/icons-material/LocalMallRounded'
import LayersRounded from '@mui/icons-material/LayersRounded'
import SearchRoundedIcon from '@mui/icons-material/SearchRounded'
import ClearRoundedIcon from '@mui/icons-material/ClearRounded'
import TuneRoundedIcon from '@mui/icons-material/TuneRounded'
import PersonOutlineRounded from '@mui/icons-material/PersonOutlineRounded'
import AccessTimeRounded from '@mui/icons-material/AccessTimeRounded'

// ===== Types minimal sesuai payload =====
export type Name = { first_name: string; last_name?: string }
export type Reference = { id: string; name?: Name; username?: string }
export type OrderType = { id: string; code: string; name: string }
export type Table = { id: string; code: string; name: string }
export type Product = { id: string; name: string; description?: string; image?: string }
export type Variant = { id: string; code?: string; name?: string; price?: string }
export type Item = {
    id: string
    qty: number
    price: string
    sub_total: string
    note?: string | null
    reference?: Reference | null
    product: Product
    variant?: Variant
}
export type Batch = { id: string; batch: number; note?: string | null; items: Item[] }
export type Transaction = {
    id: string
    invoice: string
    total: string
    time_created: string
    time_updated: string
    time_closed?: string | null
    reference?: Reference
    shift?: { id: string; name: string }
    order_type: OrderType
    table?: Table
    batches: Batch[]
}

// ===== Utils =====
const rupiah = (n: number | string) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(typeof n === 'string' ? parseFloat(n) : n)
const fmtDT = (iso: string) => new Intl.DateTimeFormat('id-ID', { dateStyle: 'medium', timeStyle: 'short', hour12: false, timeZone: 'Asia/Jakarta' }).format(new Date(iso))
const totalItems = (o: Transaction) => o.batches.reduce((acc, b) => acc + b.items.reduce((a, i) => a + i.qty, 0), 0)
const totalBatches = (o: Transaction) => o.batches.length
const shortId = (s?: string) => s ? `${s.slice(0, 8)}…` : '-'
const ymdJakarta = (iso: string) => {
    const d = new Date(iso)
    const y = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Jakarta', year: 'numeric' }).format(d)
    const m = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Jakarta', month: '2-digit' }).format(d)
    const day = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Jakarta', day: '2-digit' }).format(d)
    return `${y}-${m}-${day}`
}

const matchesQuery = (o: Transaction, q: string) => {
    const s = q.trim().toLowerCase()
    if (!s) return true
    const inv = o.invoice?.toLowerCase() ?? ''
    const table = o.table?.code?.toLowerCase() ?? ''
    const anyBatch = o.batches.some(b => String(b.batch).toLowerCase().includes(s))
    return inv.includes(s) || table.includes(s) || anyBatch
}

// Row =====
const TransactionListItemRow: React.FC<{ o: Transaction; selected?: boolean; onClick?: () => void }> = ({ o, selected = false, onClick }) => {
    const items = totalItems(o)
    const batches = totalBatches(o)
    const isClosed = Boolean(o.time_closed)

    return (
        <ListItemButton
            onClick={onClick}
            selected={selected}
            // HAPUS: disabled={o.time_closed !== null}
            sx={{
                position: 'relative',
                alignItems: 'flex-start',
                py: 1.25,
                px: 1.5,
                mb: 1,
                borderRadius: 2,
                border: '1px solid',
                borderColor: selected ? 'primary.outlinedBorder' : (isClosed ? 'error.light' : 'divider'),
                bgcolor: selected ? 'action.selected' : (isClosed ? 'action.hover' : 'background.paper'),
                boxShadow: selected ? '0 10px 24px rgba(0,0,0,0.12)' : '0 2px 8px rgba(0,0,0,0.04)',
                transition: 'transform .15s ease, box-shadow .2s ease, border-color .2s ease, background-color .2s ease',
                transform: 'translateY(0)',
                '&:hover': {
                    transform: 'translateY(-1px)',
                    boxShadow: '0 12px 28px rgba(0,0,0,0.12)',
                    bgcolor: selected ? 'action.selected' : (isClosed ? 'action.hover' : 'action.hover')
                },
                '&::before': {
                    content: '""',
                    position: 'absolute',
                    left: 0,
                    top: 0,
                    bottom: 0,
                    width: 4,
                    borderTopLeftRadius: 8,
                    borderBottomLeftRadius: 8,
                    background: selected
                        ? 'linear-gradient(180deg, #6366F1, #8B5CF6 35%, #EC4899)'
                        : (isClosed
                            ? 'linear-gradient(180deg, #ef4444, #dc2626 60%, #b91c1c)' // bis merah untuk closed
                            : 'transparent'),
                },
            }}
        >
            <Stack spacing={0.75} width="100%">
                {/* Baris atas: invoice + total */}
                <Stack direction="row" alignItems="center" justifyContent="space-between" gap={1}>
                    <Stack direction="row" spacing={1} alignItems="center" minWidth={0}>
                        <ReceiptLongRounded fontSize="small" />
                        <Typography variant="h6" fontWeight={900} noWrap sx={{ letterSpacing: 0.2, lineHeight: 1.2, fontFeatureSettings: '"tnum" 1, "lnum" 1' }}>
                            # {o.invoice}
                        </Typography>
                        <Chip size="small" label={o.order_type?.name ?? '-'} variant="outlined" />
                    </Stack>
                    <Typography variant="subtitle1" fontWeight={900}>{rupiah(o.total)}</Typography>
                </Stack>

                {/* Chips ringkas (+ status) */}
                <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap>
                    <Chip
                        size="small"
                        label={isClosed ? 'Selesai' : 'Aktif'}
                        color={isClosed ? 'error' : 'success'}
                        variant={isClosed ? 'filled' : 'filled'}
                    />
                    <Chip size="small" icon={<TableRestaurantRounded />} label={o.table?.code ? `Table ${o.table.code}` : 'No table'} />
                    <Chip size="small" icon={<LocalMallRounded />} label={`${items} item`} />
                    <Chip size="small" icon={<LayersRounded />} label={`${batches} batch`} />
                    <Chip size="small" icon={<PersonOutlineRounded />} label={`Kasir ${shortId(o.reference?.id)}`} title={o.reference?.id ?? ''} />
                    <Chip size="small" icon={<AccessTimeRounded />} label={o.shift?.name ?? '-'} />
                </Stack>

                {/* Timestamp */}
                <Typography variant="caption" color="text.secondary">{fmtDT(o.time_created)}</Typography>
            </Stack>
        </ListItemButton>
    )
}


// ===== Main component (left list) =====
const TransactionListItem: React.FC = () => {
    const [transaction, setTransaction] = useState<Array<Transaction>>([])
    const [selectedId, setSelectedId] = useState<string | undefined>()

    // Next.js navigation
    const router = useRouter()
    const pathname = usePathname()
    const searchParams = useSearchParams()

    // Filters
    const [query, setQuery] = useState<string>('')
    const [status, setStatus] = useState<'all' | 'active' | 'selesai'>('all')
    const [startDate, setStartDate] = useState<string>('') // YYYY-MM-DD
    const [endDate, setEndDate] = useState<string>('')
    const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null)
    const open = Boolean(anchorEl)

    // Sync selected from URL ?id=
    React.useEffect(() => {
        const fromUrl = searchParams?.get('id') || undefined
        setSelectedId(fromUrl)
    }, [searchParams])

    const transactions = useMemo(() => [...transaction].sort((a, b) => new Date(b.time_created).getTime() - new Date(a.time_created).getTime()), [transaction])

    const filtered = useMemo(() => {
        return transactions
            .filter(o => matchesQuery(o, query))
            .filter(o => status === 'all' ? true : status === 'active' ? !o.time_closed : Boolean(o.time_closed))
            .filter(o => {
                const d = ymdJakarta(o.time_created)
                const afterStart = startDate ? d >= startDate : true
                const beforeEnd = endDate ? d <= endDate : true
                return afterStart && beforeEnd
            })
    }, [transactions, query, status, startDate, endDate])

    useEffect(() => {
        // Promise-based tanpa try/catch (sesuai preferensi)
        // @ts-ignore — asumsi window.api sudah disiapkan di preload
        window.api.invoke('api.transaction:read.all', {})
            .then((result: { data: Transaction[] }) => setTransaction(result?.data ?? []))
            .catch(() => setTransaction([]))
    }, [])

    return (
        <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', gap: 1 }}>
            {/* Top filter bar (tanpa header judul) */}
            <Stack direction={{ xs: 'column', sm: 'row' }} alignItems={{ xs: 'stretch', sm: 'center' }} gap={1} sx={{ px: 1.5, pt: 1 }}>
                <TextField
                    size="small"
                    placeholder="Cari invoice, batch, table…"
                    value={query}
                    fullWidth
                    onChange={(e) => setQuery(e.target.value)}
                    sx={{ minWidth: { xs: '100%', sm: 280 } }}
                    InputProps={{
                        startAdornment: (
                            <InputAdornment position="start">
                                <SearchRoundedIcon fontSize="small" />
                            </InputAdornment>
                        ),
                        endAdornment: query ? (
                            <InputAdornment position="end">
                                <IconButton size="small" onClick={() => setQuery('')}>
                                    <ClearRoundedIcon fontSize="small" />
                                </IconButton>
                            </InputAdornment>
                        ) : undefined,
                    }}
                />

                <IconButton
                    size="small"
                    onClick={(e) => setAnchorEl(e.currentTarget)}
                    sx={{ ml: 'auto', border: '1px solid', borderColor: 'divider', borderRadius: 2 }}
                >
                    <TuneRoundedIcon />
                </IconButton>

                <Popover
                    open={open}
                    anchorEl={anchorEl}
                    onClose={() => setAnchorEl(null)}
                    anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                    transformOrigin={{ vertical: 'top', horizontal: 'right' }}
                    slotProps={{ paper: { sx: { p: 2, width: 320 } } }}
                >
                    <Stack spacing={1.5}>
                        <Box>
                            <Typography variant="overline">Status</Typography>
                            <ToggleButtonGroup
                                color="primary"
                                exclusive
                                value={status}
                                onChange={(_, v) => setStatus(v ?? status)}
                                size="small"
                            >
                                <ToggleButton value="all">Semua</ToggleButton>
                                <ToggleButton value="active">Aktif</ToggleButton>
                                <ToggleButton value="selesai">Selesai</ToggleButton>
                            </ToggleButtonGroup>
                        </Box>

                        <Box>
                            <Typography variant="overline">Rentang tanggal (time_created)</Typography>
                            <Stack direction="row" gap={1}>
                                <TextField label="Dari" type="date" size="small" value={startDate} onChange={(e) => setStartDate(e.target.value)} InputLabelProps={{ shrink: true }} fullWidth />
                                <TextField label="Sampai" type="date" size="small" value={endDate} onChange={(e) => setEndDate(e.target.value)} InputLabelProps={{ shrink: true }} fullWidth />
                            </Stack>
                        </Box>

                        <Stack direction="row" justifyContent="space-between" alignItems="center" pt={0.5}>
                            <Typography variant="caption" color="text.secondary">{filtered.length} hasil</Typography>
                            <Stack direction="row" gap={1}>
                                <IconButton size="small" onClick={() => { setStatus('all'); setStartDate(''); setEndDate('') }} title="Reset filter">
                                    <ClearRoundedIcon fontSize="small" />
                                </IconButton>
                                <IconButton size="small" color="primary" onClick={() => setAnchorEl(null)} title="Terapkan">
                                    <TuneRoundedIcon fontSize="small" />
                                </IconButton>
                            </Stack>
                        </Stack>
                    </Stack>
                </Popover>
            </Stack>

            <Divider />

            <Box sx={{ flex: 1, minHeight: 0 }}>
                {filtered.length === 0 ? (
                    <Box sx={{ display: 'grid', placeItems: 'center', height: '100%', color: 'text.secondary' }}>
                        <Typography variant="body2">Data nggak ketemu. Coba filter/kata kunci lain ya~</Typography>
                    </Box>
                ) : (
                    <PerfectScrollbar options={{ suppressScrollX: true }}>
                        <List disablePadding>
                            {filtered.map(o => (
                                <TransactionListItemRow key={o.id} o={o} selected={o.id === selectedId} onClick={() => {
                                    setSelectedId(o.id)
                                    const norm = (pathname || '').replace(/\/+$/, '')
                                    const base = norm.split('/').pop() === 'batch' ? norm : `${norm}/batch`
                                    const params = new URLSearchParams(searchParams?.toString() || '')
                                    console.log(`${base}?${params.toString()}`);
                                    params.set('id', o.id)
                                    router.push(`${base}?${params.toString()}`, { scroll: false })
                                }} />
                            ))}
                        </List>
                    </PerfectScrollbar>
                )}
            </Box>
        </Box>
    )
}

export default React.memo(TransactionListItem)
