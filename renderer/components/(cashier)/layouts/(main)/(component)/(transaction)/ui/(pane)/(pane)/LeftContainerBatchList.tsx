'use client'

import * as React from 'react'
import PerfectScrollbar from 'react-perfect-scrollbar'
import 'react-perfect-scrollbar/dist/css/styles.css'
import { Box, Chip, List, ListItemButton, Stack, Typography } from '@mui/material'
import LayersRounded from '@mui/icons-material/LayersRounded'
import LocalMallRounded from '@mui/icons-material/LocalMallRounded'
import { useTx } from '../context/TransactionContext'
import LeftContainerBatchListNewOrder from './(components)/LeftContainerBatchListNewOrder'
import LeftContainerBatchPrintChecker from './(components)/LeftContainerBatchPrintChecker'

export type Name = { first_name: string; last_name?: string }
export type Reference = { id: string; name?: Name; username?: string }
export type OrderType = { id: string; code: string; name: string }
export type Table = { id: string; code: string; name: string }
export type Product = { id: string; name: string; description?: string; image?: string }
export type Variant = { id: string; code?: string; name?: string; price?: string }
export type Item = { id: string; qty: number; price: string; sub_total: string; note?: string | null; reference?: Reference | null; product: Product; variant?: Variant }

// ⬇️ Tambah __bills agar batch bisa bawa konteks tagihan pending
export type Batch = {
    id: string
    batch: number
    note?: string | null
    time_created?: string
    time_updated?: string
    items: Item[]
    __bills?: any[] // <<— NEW
}

export type TransactionHeader = {
    id: string; invoice: string; total: string; time_closed?: string | null;
    reference?: Reference; shift?: { id: string; name: string }; order_type: OrderType; table?: Table; bills?: any[];
}

const rupiah = (n: number | string) =>
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 })
        .format(typeof n === 'string' ? parseFloat(n) : n)

const fmtDT = (iso?: string) =>
    iso
        ? new Intl.DateTimeFormat('id-ID', { dateStyle: 'medium', timeStyle: 'short', hour12: false, timeZone: 'Asia/Jakarta' })
            .format(new Date(iso))
        : '-'

const totalItem = (b: Batch) => b.items.length
const totalQty = (b: Batch) => b.items.reduce((a, i) => a + i.qty, 0)

// ===== Timer utils (tahun/bulan/hari + jam/menit/detik, tanpa minggu) =====
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
    let ms = end.getTime() - ymAnchor.getTime()
    const sec = Math.floor(ms / 1000)
    const days = Math.floor(sec / 86400)
    const hours = Math.floor((sec % 86400) / 3600)
    const minutes = Math.floor((sec % 3600) / 60)
    const seconds = Math.floor(sec % 60)
    return { years, months, days, hours, minutes, seconds }
}
const formatReadable = (p: ReturnType<typeof diffParts>) => {
    const { years, months, days, hours, minutes, seconds } = p
    if (years > 0) return `${years} tahun, ${months} bulan, ${days} hari, ${hours} jam, ${minutes} menit`
    if (months > 0) return `${months} bulan, ${days} hari, ${hours} jam, ${minutes} menit, ${seconds} detik`
    if (days > 0) return `${days} hari, ${hours} jam, ${minutes} menit, ${seconds} detik`
    return `${hours} jam, ${minutes} menit, ${seconds} detik`
}
const TimerText: React.FC<{ startIso?: string; endIso?: string | null; active: boolean }> = ({ startIso, endIso, active }) => {
    const [now, setNow] = React.useState(() => Date.now())
    React.useEffect(() => {
        if (!active) return
        const id = setInterval(() => setNow(Date.now()), 1000)
        return () => clearInterval(id)
    }, [active])

    const label = React.useMemo(() => {
        const zero = '0 jam, 0 menit, 0 detik'
        if (!startIso) return zero
        const start = new Date(startIso)
        if (isNaN(start.getTime())) return zero

        if (active) {
            return formatReadable(diffParts(start, new Date(now)))
        } else if (endIso) {
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
                fontWeight: 800,
                letterSpacing: 0.5,
                color: 'inherit',
                textAlign: 'right',
                whiteSpace: 'normal',
                overflowWrap: 'anywhere',
                '@keyframes tPulse': { '0%': { opacity: 0.9 }, '50%': { opacity: 1 }, '100%': { opacity: 0.9 } },
                animation: active ? 'tPulse 1.8s ease-in-out infinite' : 'none',
                userSelect: 'none',
            }}
            aria-label={active ? 'Durasi batch aktif' : 'Durasi saat transaksi ditutup'}
        >
            {label}
        </Typography>
    )
}

// ambil printerId dari product.category[].printer[]
const getPrinterIdsFromItem = (it: Item): string[] => {
    const cats: any[] = Array.isArray((it as any)?.product?.category) ? (it as any).product.category : []
    const ids: string[] = []
    cats.forEach(c => {
        const printers: any[] = Array.isArray(c?.printer) ? c.printer : []
        printers.forEach(p => { if (p?.id) ids.push(String(p.id)) })
    })
    return ids.length ? Array.from(new Set(ids)) : ['__no_printer__']
}

// kelompokkan item per printerId
const groupItemsByPrinter = (items: Item[]) => {
    const map = new Map<string, Item[]>()
    items.forEach(it => {
        const pids = getPrinterIdsFromItem(it)
        pids.forEach(pid => {
            const list = map.get(pid) ?? []
            list.push(it)
            map.set(pid, list)
        })
    })
    return map
}

// ===== Bills-aware totals =====

// helper: ambil bills dari beberapa kemungkinan shape
const pickBills = (o: any) => o?.transaction?.bills ?? o?.bills ?? []

// pending paid checker yang langsung pakai bills terpilih
const isPendingPaidItem = (item: any, bills: any[]) =>
    bills?.some((bill: any) =>
        (bill?.paid == null || bill?.paid?.status === false) &&
        (bill?.items ?? []).some((bi: any) => bi?.transactionItem?.id === item?.id)
    )

const isSuccessPaidItem = (item: any, bills: any[]) =>
    bills?.some((bill: any) =>
        (bill?.paid == null || bill?.paid?.status === true) &&
        (bill?.items ?? []).some((bi: any) => bi?.transactionItem?.id === item?.id)
    )
// total price: skip kalau void approved atau pending paid
const totalPrices = (o: any) => {
    const bills = pickBills(o)
    return (o?.batches ?? []).reduce(
        (acc, b) =>
            acc +
            (b?.items ?? []).reduce(
                (a, i) => a + ((i?.void?.is_approved === true || isPendingPaidItem(i, bills) || isSuccessPaidItem(i, bills)) ? 0 : (+i?.sub_total || 0)),
                0
            ),
        0
    )
}

// --- utils kecil untuk batch ---
const pickBillsFromBatch = (b: any) =>
    b?.__bills
    ?? b?.transaction?.bills
    ?? b?.bills
    ?? b?.parent?.transaction?.bills
    ?? []

// --- HANYA terima Batch ---
export const batchTotal = (b: Batch) => {
    const bills = pickBillsFromBatch(b)
    return (b?.items ?? []).reduce(
        (acc: number, i: any) =>
            acc + ((i?.void?.is_approved === true || isPendingPaidItem(i, bills) || isSuccessPaidItem(i, bills)) ? 0 : (+i?.sub_total || 0)),
        0
    )
}

const LeftContainerBatchList: React.FC = () => {
    const { txId, header, setHeader, setGrandTotal, selectedBatchId, setSelectedBatchId, reloadKey } = useTx()
    const [batches, setBatches] = React.useState<Batch[]>([])
    const [isLoading, setIsLoading] = React.useState(false)

    // fetch semua batch utk transaksi ini
    React.useEffect(() => {
        if (!txId) { setBatches([]); return }

        setIsLoading(true) // start loading
        // @ts-ignore
        window.api.invoke('api.transaction.batch:read.all', { transaction: txId })
            .then((res: any) => {
                const list = (res?.data ?? []) as any[]
                const t = list[0]?.transaction
                setHeader({ ...t })
                setGrandTotal(totalPrices(t))

                // ⬇️ PRE-BIND bills ke tiap batch agar batchTotal bisa skip pending-paid
                const bills = t?.bills ?? []
                const mapped: Batch[] = list.map(b => ({
                    id: String(b.id),
                    batch: Number(b.batch),
                    note: b.note ?? null,
                    time_created: b.time_created,
                    time_updated: b.time_updated,
                    items: Array.isArray(b.items) ? b.items : [],
                    __bills: bills,
                })).sort((a, b) => b.batch - a.batch)

                setBatches(mapped)
                if (!selectedBatchId && mapped.length) setSelectedBatchId(mapped[0].id)
            })
            .catch(() => setBatches([]))
            .finally(() => setIsLoading(false)) // end loading
        // ⬇️ penting: JANGAN masukkan selectedBatchId di deps biar gak refetch saat klik
    }, [txId, reloadKey, setHeader, setGrandTotal, setSelectedBatchId])

    const isClosed = Boolean(header?.time_closed)

    // tampilkan skeleton hanya saat BELUM ada data
    const showSkeleton = isLoading && batches.length === 0

    // ===== Skeleton UI saat loading (no flicker) =====
    const LoadingSkeleton = (
        <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            {/* Header sama biar layout stabil */}
            <Box sx={{
                px: 1.25, py: 1,
                borderBottom: '1px solid',
                borderColor: 'divider',
                bgcolor: 'background.paper',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 1
            }}>
                <Stack direction="row" spacing={1} alignItems="center" minWidth={0} />
                {txId ? <LeftContainerBatchListNewOrder tx={txId} /> : <Box sx={{ width: 120, height: 32, borderRadius: 2, bgcolor: 'action.hover' }} />}
            </Box>

            <Box sx={{ flex: 1, minHeight: 0, overflow: 'hidden' }}>
                <PerfectScrollbar options={{ suppressScrollX: true, wheelPropagation: false, swipeEasing: true }}>
                    <List disablePadding sx={{ py: 1, pr: 1 }}>
                        {[1, 2, 3].map(key => (
                            <React.Fragment key={key}>
                                <Box
                                    sx={{
                                        position: 'relative',
                                        py: 1.1, px: 1.4, mb: 0,
                                        border: '1px solid',
                                        borderColor: 'divider',
                                        bgcolor: 'background.paper',
                                        boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                                        borderBottomLeftRadius: 0,
                                        borderBottomRightRadius: 0,
                                        borderTopLeftRadius: 8,
                                        borderTopRightRadius: 8,
                                        overflow: 'hidden',
                                    }}
                                >
                                    <Box sx={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 4, bgcolor: 'action.selected' }} />
                                    <Stack spacing={1.1} width="100%">
                                        <Stack direction="row" alignItems="center" justifyContent="space-between" gap={1}>
                                            <Stack direction="row" spacing={1} alignItems="center" minWidth={0}>
                                                <LayersRounded fontSize="small" />
                                                <Box sx={{ width: 120, height: 24, borderRadius: 1, bgcolor: 'action.hover' }} />
                                                <Box sx={{ width: 64, height: 22, borderRadius: 999, bgcolor: 'action.hover' }} />
                                            </Stack>
                                            <Box sx={{ width: 96, height: 20, borderRadius: 1, bgcolor: 'action.hover' }} />
                                        </Stack>
                                        <Stack direction="row" alignItems="center" gap={0.75}>
                                            <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap sx={{ flex: 1, minWidth: 0 }}>
                                                <Box sx={{ width: 90, height: 24, borderRadius: 999, bgcolor: 'action.hover' }} />
                                                <Box sx={{ width: 90, height: 24, borderRadius: 999, bgcolor: 'action.hover' }} />
                                            </Stack>
                                            <Box sx={{ width: 140, height: 28, borderRadius: 1, bgcolor: 'action.hover' }} />
                                        </Stack>
                                        <Box sx={{ width: 180, height: 16, borderRadius: 1, bgcolor: 'action.hover' }} />
                                    </Stack>
                                </Box>

                                <Box
                                    sx={{
                                        border: '1px solid',
                                        borderTop: 'none',
                                        borderColor: 'divider',
                                        borderBottomLeftRadius: 8,
                                        borderBottomRightRadius: 8,
                                        bgcolor: 'action.selected',
                                        px: 1.4, py: 0.75, mb: 1,
                                    }}
                                >
                                    <Box sx={{ width: 220, height: 14, borderRadius: 1, bgcolor: 'action.hover' }} />
                                </Box>
                            </React.Fragment>
                        ))}
                        <Typography variant="caption" sx={{ color: 'text.secondary', px: 1.5, py: 0.5 }}>
                            Memuat batch… sabar, server lagi ngocok data 🔄
                        </Typography>
                    </List>
                </PerfectScrollbar>
            </Box>
        </Box>
    )

    if (!txId) return (
        <Box sx={{ display: 'grid', placeItems: 'center', height: '100%', color: 'text.secondary' }}>
            <Typography variant="body2">Pilih transaksi dulu.</Typography>
        </Box>
    )

    // tampilkan skeleton hanya saat belum ada data
    if (showSkeleton) return LoadingSkeleton

    // pesan kosong hanya saat tidak loading
    if (!isLoading && batches.length === 0) return (
        <Box sx={{ display: 'grid', placeItems: 'center', height: '100%', color: 'text.secondary' }}>
            <Typography variant="body2">Belum ada batch.</Typography>
        </Box>
    )

    return (
        <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            {/* ===== Header di atas PerfectScrollbar ===== */}
            <Box sx={{
                px: 1.25, py: 1,
                borderBottom: '1px solid',
                borderColor: 'divider',
                bgcolor: 'background.paper',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 1
            }}>
                <Stack direction="row" spacing={1} alignItems="center" minWidth={0} />
                <LeftContainerBatchListNewOrder tx={txId} />
            </Box>

            {/* ===== Area scroll ===== */}
            <Box sx={{ flex: 1, minHeight: 0, overflow: 'hidden' }}>
                <PerfectScrollbar options={{ suppressScrollX: true, wheelPropagation: false, swipeEasing: true }}>
                    <List disablePadding sx={{ py: 1, pr: 1 }}>
                        {batches.map(b => {
                            const selected = b.id === selectedBatchId
                            const cardBorderColor = selected ? 'primary.outlinedBorder' : 'divider'
                            const price = batchTotal(b)

                            return (
                                <React.Fragment key={b.id}>
                                    <ListItemButton
                                        selected={selected}
                                        onClick={() => setSelectedBatchId(b.id)}
                                        sx={{
                                            position: 'relative',
                                            alignItems: 'flex-start',
                                            py: 1.1, px: 1.4,
                                            mb: 0,
                                            border: '1px solid',
                                            borderColor: cardBorderColor,
                                            bgcolor: selected ? 'action.selected' : 'background.paper',
                                            boxShadow: selected ? '0 10px 24px rgba(0,0,0,0.12)' : '0 2px 8px rgba(0,0,0,0.04)',
                                            transition: 'transform .15s ease, box-shadow .2s ease, border-color .2s ease, background-color .2s ease',
                                            '&:hover': { transform: 'translateY(-1px)', boxShadow: '0 12px 28px rgba(0,0,0,0.12)', bgcolor: selected ? 'action.selected' : 'action.hover' },
                                            borderBottomLeftRadius: 0,
                                            borderBottomRightRadius: 0,
                                            borderTopLeftRadius: 8,
                                            borderTopRightRadius: 8,
                                            '&::before': {
                                                content: '""', position: 'absolute', left: 0, top: 0, bottom: 0, width: 4,
                                                borderTopLeftRadius: 8,
                                                background: selected
                                                    ? 'linear-gradient(180deg, #6366F1, #8B5CF6 35%, #EC4899)'
                                                    : (Boolean(header?.time_closed) ? 'linear-gradient(90deg, #ef4444, #dc2626 35%, #b91c1c)' : 'transparent'),
                                            },
                                        }}
                                    >
                                        <Stack spacing={1.1} width="100%">
                                            {/* Baris 1: Judul + Harga */}
                                            <Stack direction="row" alignItems="center" justifyContent="space-between" gap={1}>
                                                <Stack direction="row" spacing={1} alignItems="center" minWidth={0}>
                                                    <LayersRounded fontSize="small" />
                                                    <Typography variant="h6" fontWeight={800}># {String(b.batch)}</Typography>
                                                    <Chip size="small" label={header?.time_closed ? 'Selesai' : 'Aktif'} color={header?.time_closed ? 'error' : 'success'} variant="filled" />
                                                </Stack>
                                                <Typography variant="subtitle1" fontWeight={800} title={rupiah(price)}>
                                                    {rupiah(price)}
                                                </Typography>
                                            </Stack>

                                            {/* Baris 2: item/qty kiri, PRINT kanan */}
                                            <Stack direction="row" alignItems="center" gap={0.75}>
                                                <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap sx={{ flex: 1, minWidth: 0 }}>
                                                    <Chip size="small" icon={<LocalMallRounded />} label={`${totalItem(b)} item`} />
                                                    <Chip size="small" icon={<LocalMallRounded />} label={`${totalQty(b)} Qty`} />
                                                </Stack>
                                                <LeftContainerBatchPrintChecker header={header as TransactionHeader} batch={b} />
                                            </Stack>

                                            {/* Baris 3: hanya time_created */}
                                            <Typography variant="caption" color="text.secondary">
                                                {fmtDT(b.time_created)}
                                            </Typography>
                                        </Stack>
                                    </ListItemButton>

                                    {/* ===== Footer di LUAR card (nempel di bawah) ===== */}
                                    <Box
                                        sx={{
                                            border: '1px solid',
                                            borderTop: 'none',
                                            borderColor: cardBorderColor,
                                            borderBottomLeftRadius: 8,
                                            borderBottomRightRadius: 8,
                                            bgcolor: header?.time_closed ? 'error.main' : 'success.main',
                                            color: header?.time_closed ? 'error.contrastText' : 'success.contrastText',
                                            px: 1.4,
                                            py: 0.75,
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'space-between',
                                            gap: 1,
                                            mb: 1,
                                        }}
                                    >
                                        <TimerText startIso={b.time_created} endIso={header?.time_closed ?? null} active={!header?.time_closed} />
                                    </Box>
                                </React.Fragment>
                            )
                        })}
                    </List>
                </PerfectScrollbar>
            </Box>
        </Box>
    )
}

export default LeftContainerBatchList
