'use client'

import * as React from 'react'
import PerfectScrollbar from 'react-perfect-scrollbar'
import 'react-perfect-scrollbar/dist/css/styles.css'
import { Box, Chip, List, ListItemButton, Stack, Typography, Button } from '@mui/material'
import LayersRounded from '@mui/icons-material/LayersRounded'
import LocalMallRounded from '@mui/icons-material/LocalMallRounded'
import PrintRounded from '@mui/icons-material/PrintRounded'
import AddRounded from '@mui/icons-material/AddRounded'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useTx } from '../context/TransactionContext'
import LeftContainerBatchListNewOrder from './(components)/LeftContainerBatchListNewOrder'
import {DiningModeProvider} from "../../../context/DiningModeContext";
import LeftContainerBatchPrintChecker from './(components)/LeftContainerBatchPrintChecker'

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
    new Intl.NumberFormat('id-ID',{style:'currency',currency:'IDR',maximumFractionDigits:0})
        .format(typeof n==='string'?parseFloat(n):n)
const fmtDT = (iso?: string) =>
    iso ? new Intl.DateTimeFormat('id-ID',{dateStyle:'medium',timeStyle:'short',hour12:false,timeZone:'Asia/Jakarta'}).format(new Date(iso)) : '-'
const totalItem = (b: Batch) => b.items.length
const totalQty = (b: Batch) => b.items.reduce((a,i)=>a+i.qty,0)
const batchTotal = (b: Batch) => b.items.reduce((a,i)=>a+(parseFloat(i.sub_total||'0')),0)

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

const LeftContainerBatchList: React.FC = () => {
    const { txId, header, setHeader, selectedBatchId, setSelectedBatchId, reloadKey } = useTx()
    const [batches, setBatches] = React.useState<Batch[]>([])

    const router = useRouter()
    const pathname = usePathname()
    const searchParams = useSearchParams()

    // fetch semua batch utk transaksi ini
    React.useEffect(() => {
        if (!txId) { setBatches([]); return }
        // @ts-ignore
        window.api.invoke('api.transaction.batch:read.all', { transaction: txId })
            .then((res: any) => {
                const list = (res?.data ?? []) as any[]
                const t = list[0]?.transaction
                if (t) {
                    setHeader({
                        id: t.id, invoice: t.invoice, total: t.total, time_closed: t.time_closed,
                        reference: t.reference, shift: t.shift, order_type: t.order_type, table: t.table,
                    } as TransactionHeader)
                }
                const mapped: Batch[] = list.map(b => ({
                    id: String(b.id),
                    batch: Number(b.batch),
                    note: b.note ?? null,
                    time_created: b.time_created,
                    time_updated: b.time_updated,
                    items: Array.isArray(b.items) ? b.items : [],
                }))
                setBatches(mapped)
                if (!selectedBatchId && mapped.length) setSelectedBatchId(mapped[0].id)
            })
            .catch(() => setBatches([]))
    }, [txId, reloadKey]) // refetch on reload/bayar/split

    const isClosed = Boolean(header?.time_closed)

    // kirim print per batch (pakai items dari hasil read.all)
    const sendPrintForBatch = React.useCallback((b: Batch) => {
        const latestItems = Array.isArray(b?.items) ? b.items : []
        const groups = groupItemsByPrinter(latestItems)
        const bulk = Array.from(groups.entries())
            .filter(([printerId]) => printerId !== '__no_printer__')
            .map(([printerId, items]) => ({ id: printerId, header, items }))

        // preview ke console
        console.log(bulk)
    }, [header])

    // ======= HEADER ACTION (callback via CustomEvent, tanpa ubah props/struktur) =======
    if (!txId) return (
        <Box sx={{ display:'grid', placeItems:'center', height:'100%', color:'text.secondary' }}>
            <Typography variant="body2">Pilih transaksi dulu.</Typography>
        </Box>
    )

    if (batches.length === 0) return (
        <Box sx={{ display:'grid', placeItems:'center', height:'100%', color:'text.secondary' }}>
            <Typography variant="body2">Belum ada batch.</Typography>
        </Box>
    )

    return (
        <Box sx={{ height:'100%', display:'flex', flexDirection:'column' }}>
            {/* ===== Header di atas PerfectScrollbar (TAMBAHAN) ===== */}
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
                <Stack direction="row" spacing={1} alignItems="center" minWidth={0}>
                </Stack>
                <LeftContainerBatchListNewOrder/>
            </Box>

            {/* ===== Area scroll (TETAP) ===== */}
            <Box sx={{ flex:1, minHeight:0 }}>
                <PerfectScrollbar options={{ suppressScrollX:true }}>
                    <List
                        disablePadding
                        sx={{
                            py : 1,
                            pr: 1
                        }}
                    >
                        {batches.map(b => {
                            const selected = b.id === selectedBatchId
                            return (
                                <ListItemButton
                                    key={b.id}
                                    selected={selected}
                                    onClick={() => {
                                        setSelectedBatchId(b.id)
                                        const base = (pathname || '').replace(/\/+$/, '')
                                        const params = new URLSearchParams(searchParams?.toString() || '')
                                        params.set('id', txId); params.set('batch', b.id)
                                        router.push(`${base}?${params.toString()}`, { scroll: false })
                                    }}
                                    sx={{
                                        position:'relative', alignItems:'flex-start', py:1.1, px:1.4, mb:1, borderRadius:2,
                                        border:'1px solid', borderColor: selected ? 'primary.outlinedBorder' : 'divider',
                                        bgcolor: selected ? 'action.selected' : 'background.paper',
                                        boxShadow: selected ? '0 10px 24px rgba(0,0,0,0.12)' : '0 2px 8px rgba(0,0,0,0.04)',
                                        transition:'transform .15s ease, box-shadow .2s ease, border-color .2s ease, background-color .2s ease',
                                        '&:hover':{ transform:'translateY(-1px)', boxShadow:'0 12px 28px rgba(0,0,0,0.12)', bgcolor: selected ? 'action.selected' : 'action.hover' },
                                        '&::before':{
                                            content:'""', position:'absolute', left:0, top:0, bottom:0, width:4,
                                            borderTopLeftRadius:8, borderBottomLeftRadius:8,
                                            background: selected
                                                ? 'linear-gradient(180deg, #6366F1, #8B5CF6 35%, #EC4899)'
                                                : (isClosed ? 'linear-gradient(90deg, #ef4444, #dc2626 35%, #b91c1c)' : 'transparent'),
                                        },
                                    }}
                                >
                                    <Stack spacing={1.1} width="100%">
                                        {/* Baris 1: Judul + Harga (total batch) */}
                                        <Stack direction="row" alignItems="center" justifyContent="space-between" gap={1}>
                                            <Stack direction="row" spacing={1} alignItems="center" minWidth={0}>
                                                <LayersRounded fontSize="small" />
                                                <Typography variant="h6" fontWeight={800}># {String(b.batch)}</Typography>
                                                <Chip
                                                    size="small"
                                                    label={isClosed ? 'Selesai' : 'Aktif'}
                                                    color={isClosed ? 'error' : 'success'}
                                                    variant="filled"
                                                />
                                            </Stack>
                                            <Typography variant="subtitle1" fontWeight={800} title={rupiah(batchTotal(b))}>{rupiah(batchTotal(b))}</Typography>
                                        </Stack>

                                        {/* Baris 2: kiri (item & qty), kanan (PRINT) — DI BAWAH HARGA */}
                                        <Stack direction="row" alignItems="center" gap={0.75}>
                                            <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap sx={{ flex:1, minWidth:0 }}>
                                                <Chip size="small" icon={<LocalMallRounded />} label={`${totalItem(b)} item`} />
                                                <Chip size="small" icon={<LocalMallRounded />} label={`${totalQty(b)} Qty`} />
                                            </Stack>

                                            <LeftContainerBatchPrintChecker header={header} batch={b} />
                                        </Stack>

                                        {/* Baris 3: waktu */}
                                        <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap>
                                            {fmtDT(b.time_created)}
                                        </Stack>
                                    </Stack>
                                </ListItemButton>
                            )
                        })}
                    </List>
                </PerfectScrollbar>
            </Box>
        </Box>
    )
}

export default LeftContainerBatchList
