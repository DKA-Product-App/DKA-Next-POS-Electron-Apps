'use client'

import * as React from 'react'
import PerfectScrollbar from 'react-perfect-scrollbar'
import 'react-perfect-scrollbar/dist/css/styles.css'
import {Box, Chip, List, ListItemButton, Stack, Typography, Button, Alert, Skeleton} from '@mui/material'
import LayersRounded from '@mui/icons-material/LayersRounded'
import LocalMallRounded from '@mui/icons-material/LocalMallRounded'
import { useTx } from '../context/TransactionContext'
import LeftContainerBatchListNewOrder from './(components)/LeftContainerBatchListNewOrder'
import LeftContainerBatchPrintChecker from './(components)/LeftContainerBatchPrintChecker'
import ShimmerLoadingBatchItemCard from './(loading)/ShimmerLoadingBatchItemCard'

export type Name = { first_name: string; last_name?: string }
export type Reference = { id: string; name?: Name; username?: string }
export type OrderType = { id: string; code: string; name: string }
export type Table = { id: string; code: string; name: string }
export type Product = { id: string; name: string; description?: string; image?: string }
export type Variant = { id: string; code?: string; name?: string; price?: string }
export type Item = { id: string; qty: number; price: string; sub_total: string; note?: string | null; reference?: Reference | null; product: Product; variant?: Variant }
export type Batch = { id: string; batch: number; note?: string | null; time_created?: string; time_updated?: string; items: Item[] }
export type TransactionHeader = {
    id: string; invoice: string; total: string; time_closed?: string | null;
    reference?: Reference; shift?: { id: string; name: string }; order_type: OrderType; table?: Table
}

const rupiah = (n: number | string) =>
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 })
        .format(typeof n === 'string' ? parseFloat(n) : n)
const fmtDT = (iso?: string) =>
    iso ? new Intl.DateTimeFormat('id-ID', { dateStyle: 'medium', timeStyle: 'short', hour12: false, timeZone: 'Asia/Jakarta' }).format(new Date(iso)) : '-'
const totalItem = (b: Batch) => b.items.length
const totalQty = (b: Batch) => b.items.reduce((a, i) => a + i.qty, 0)
const batchTotal = (b: Batch) => b.items.reduce((a, i) => a + (parseFloat(i.sub_total || '0')), 0)

const totalPrices = (o: any) =>
    (o.batches ?? []).reduce((acc, b) =>
        acc + (b.items ?? []).reduce((a, i) =>
            a + (i?.void?.is_approved === true ? 0 : (+i.sub_total || 0)), 0), 0)

const LeftContainerBatchList: React.FC = () => {
    const { txId, header, setHeader, grandTotal, setGrandTotal, selectedBatchId, setSelectedBatchId, reloadKey, setReloadKey } = useTx()
    const [batches, setBatches] = React.useState<Batch[]>([])
    const [loading, setLoading] = React.useState(false)
    const [error, setError] = React.useState<string | null>(null)

    const parseErr = (err: any) =>
        err?.message || err?.data?.message || err?.error || (typeof err === 'string' ? err : 'Gagal memuat data batch.')

    const fetchBatches = React.useCallback(() => {
        if (!txId) { setBatches([]); setError(null); return }
        setLoading(true)
        setError(null)
        // @ts-ignore
        return window.api.invoke('api.transaction.batch:read.all', { transaction: txId })
            .then((res: any) => {
                const list = (res?.data ?? []) as any[]
                const t = list[0]?.transaction
                setHeader({ ...t })
                setGrandTotal(totalPrices(t))
                const mapped: Batch[] = list
                    .map(b => ({
                        id: String(b.id),
                        batch: Number(b.batch),
                        note: b.note ?? null,
                        time_created: b.time_created,
                        time_updated: b.time_updated,
                        items: Array.isArray(b.items) ? b.items : [],
                    }))
                    .sort((a, b) => b.batch - a.batch)
                setBatches(mapped)
                !selectedBatchId && mapped.length ? setSelectedBatchId(mapped[0].id) : null
            })
            .catch((err: any) => setError(parseErr(err)))
            .finally(() => setLoading(false))
    }, [txId, selectedBatchId, setGrandTotal, setHeader, setSelectedBatchId])

    // fetch semua batch utk transaksi ini
    React.useEffect(() => {
        fetchBatches()
    }, [fetchBatches, reloadKey])

    const isClosed = Boolean(header?.time_closed)

    if (!txId) return (
        <Box sx={{ display: 'grid', placeItems: 'center', height: '100%', color: 'text.secondary' }}>
            <Typography variant="body2">Pilih transaksi dulu.</Typography>
        </Box>
    )

    if (loading) return <ShimmerLoadingBatchItemCard />

    if (error) return (
        <Box sx={{ height: '100%', display: 'grid', placeItems: 'center', p: 2 }}>
            <Stack spacing={2} sx={{ maxWidth: 520 }}>
                <Alert severity="error" variant="outlined">{error}</Alert>
                <Stack direction="row" spacing={1} justifyContent="flex-end">
                    <Button variant="outlined" onClick={() => setReloadKey((k: number) => k + 1)}>Coba lagi</Button>
                </Stack>
            </Stack>
        </Box>
    )

    if (batches.length === 0) return (
        <Box sx={{ display: 'grid', placeItems: 'center', height: '100%', color: 'text.secondary', p: 2 }}>
            <Stack spacing={1} alignItems="center">
                <Typography variant="body2">Belum ada batch.</Typography>
                <Button variant="outlined" size="small" onClick={() => setReloadKey((k: number) => k + 1)}>Muat ulang</Button>
            </Stack>
        </Box>
    )
    if (loading) return (
        <Box sx={{ height:'100%', display:'flex', flexDirection:'column' }}>
            {/* Header normal tetap tampil */}
            <Box sx={{
                px: 1.25, py: 1, borderBottom: '1px solid', borderColor: 'divider',
                bgcolor: 'background.paper', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1
            }}>
                <Stack direction="row" spacing={1} alignItems="center" minWidth={0} />
                <Skeleton variant="rounded" width={140} height={36} sx={{ borderRadius: 2 }} />
            </Box>

            <Box sx={{ flex:1, minHeight:0, overflow:'hidden' }}>
                <PerfectScrollbar options={{ suppressScrollX:true, wheelPropagation:false, swipeEasing:true }}>
                    <List disablePadding sx={{ py:1, pr:1 }}>
                        {Array.from({ length: 3 }).map((_, i) => <ShimmerLoadingBatchItemCard key={i} />)}
                    </List>
                </PerfectScrollbar>
            </Box>
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
                                                    : (isClosed ? 'linear-gradient(90deg, #ef4444, #dc2626 35%, #b91c1c)' : 'transparent'),
                                            },
                                        }}
                                    >
                                        <Stack spacing={1.1} width="100%">
                                            {/* Baris 1: Judul + Harga */}
                                            <Stack direction="row" alignItems="center" justifyContent="space-between" gap={1}>
                                                <Stack direction="row" spacing={1} alignItems="center" minWidth={0}>
                                                    <LayersRounded fontSize="small" />
                                                    <Typography variant="h6" fontWeight={800}># {String(b.batch)}</Typography>
                                                    <Chip size="small" label={isClosed ? 'Selesai' : 'Aktif'} color={isClosed ? 'error' : 'success'} variant="filled" />
                                                </Stack>
                                                <Typography variant="subtitle1" fontWeight={800} title={rupiah(batchTotal(b))}>{rupiah(batchTotal(b))}</Typography>
                                            </Stack>

                                            {/* Baris 2: item/qty kiri, PRINT kanan */}
                                            <Stack direction="row" alignItems="center" gap={0.75}>
                                                <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap sx={{ flex: 1, minWidth: 0 }}>
                                                    <Chip size="small" icon={<LocalMallRounded />} label={`${totalItem(b)} item`} />
                                                    <Chip size="small" icon={<LocalMallRounded />} label={`${totalQty(b)} Qty`} />
                                                </Stack>
                                                <LeftContainerBatchPrintChecker header={header} batch={b} />
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
                                            bgcolor: isClosed ? 'error.main' : 'success.main',
                                            color: isClosed ? 'error.contrastText' : 'success.contrastText',
                                            px: 1.4,
                                            py: 0.75,
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'space-between',
                                            gap: 1,
                                            mb: 1,
                                        }}
                                    >
                                        {/* ⬇️ pakai TimerText dari file kamu */}
                                        {/* @ts-ignore */}
                                        <TimerText startIso={b.time_created} endIso={header?.time_closed} active={!isClosed} />
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
