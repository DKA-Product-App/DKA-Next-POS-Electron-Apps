'use client'

import * as React from 'react'
import {
    Box, Chip, List, ListItemButton, Stack, Typography, Divider
} from '@mui/material'
import PerfectScrollbar from 'react-perfect-scrollbar'
import 'react-perfect-scrollbar/dist/css/styles.css'
import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'

import type { Filters } from './widgets/TransactionListItemHeaderWidget'
import TransactionListItemPrintTransaction from './(components)/TransactionListItemPrintTransaction' // sesuaikan path

// Icons
import ReceiptLongRounded from '@mui/icons-material/ReceiptLongRounded'
import TableRestaurantRounded from '@mui/icons-material/TableRestaurantRounded'
import LocalMallRounded from '@mui/icons-material/LocalMallRounded'
import LayersRounded from '@mui/icons-material/LayersRounded'
import PersonOutlineRounded from '@mui/icons-material/PersonOutlineRounded'
import AccessTimeRounded from '@mui/icons-material/AccessTimeRounded'
import PrintRounded from '@mui/icons-material/PrintRounded'
import dynamic from "next/dynamic";
import ShimmerMenuSelectLoading from "../(loading)/ShimmerMenuSelectLoading";
import ShimmerLoading from '../../../../../(shared)/(loading)/ShimmerLoading'

// ===== Types =====
export type Name = { first_name: string; last_name?: string }
export type Reference = { id: string; name?: Name; username?: string }
export type OrderType = { id: string; code: string; name: string }
export type Table = { id: string; code: string; name: string }
export type Product = { id: string; name: string; description?: string; image?: string }
export type Variant = { id: string; code?: string; name?: string; price?: string }
export type Item = { id: string; qty: number; price: string; sub_total: string; note?: string | null; reference?: Reference | null; product: Product; variant?: Variant }
export type Batch = { id: string; batch: number; note?: string | null; items: Item[] }
export type Transaction = {
    id: string; invoice: string; total: string; time_created: string; time_updated: string; time_closed?: string | null;
    reference?: Reference; shift?: { id: string; name: string }; order_type: OrderType; table?: Table; batches: Batch[]
}

// ===== Utils & TZ =====
const TZ_OFFSET = '+08:00' // Asia/Makassar
const rupiah = (n: number | string) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(typeof n === 'string' ? parseFloat(n) : n)
const fmtDT = (iso: string) => new Intl.DateTimeFormat('id-ID', { dateStyle: 'medium', timeStyle: 'short', hour12: false, timeZone: 'Asia/Makassar' }).format(new Date(iso))
const totalItems = (o: Transaction) => o.batches.reduce((acc, b) => acc + b.items.reduce((a, i) => a + i.qty, 0), 0)
const totalBatches = (o: Transaction) => o.batches.length
const shortId = (s?: string) => s ? `${s.slice(0, 8)}…` : '-'
const matchesQuery = (o: Transaction, q: string) => {
    const s = q.trim().toLowerCase()
    if (!s) return true
    const inv = o.invoice?.toLowerCase() ?? ''
    const table = o.table?.code?.toLowerCase() ?? ''
    const anyBatch = o.batches.some(b => String(b.batch).toLowerCase().includes(s))
    return inv.includes(s) || table.includes(s) || anyBatch
}
const getPrinterIdsFromItem = (it: Item): string[] => {
    const cats: any[] = Array.isArray((it as any)?.product?.category) ? (it as any).product.category : []
    const ids: string[] = []
    cats.forEach(c => {
        const printers: any[] = Array.isArray(c?.printer) ? c.printer : []
        printers.forEach(p => { if (p?.id) ids.push(String(p.id)) })
    })
    return ids.length ? Array.from(new Set(ids)) : ['__no_printer__']
}
const groupTxItemsByPrinter = (tx: Transaction) => {
    const map = new Map<string, Item[]>()
    const allItems: Item[] = tx.batches.flatMap(b => Array.isArray(b.items) ? b.items : [])
    allItems.forEach(it => {
        const pids = getPrinterIdsFromItem(it)
        pids.forEach(pid => {
            const list = map.get(pid) ?? []
            list.push(it)
            map.set(pid, list)
        })
    })
    return map
}

// ===== Row =====
const TransactionListItemRow: React.FC<{ o: Transaction; selected?: boolean; onClick?: () => void }> = ({ o, selected = false, onClick }) => {
    const items = totalItems(o)
    const batches = totalBatches(o)
    const isClosed = Boolean(o.time_closed)

    const sendPrintWholeTransaction = () => {
        const groups = groupTxItemsByPrinter(o)
        const header = {
            id: o.id, invoice: o.invoice, total: o.total,
            time_closed: o.time_closed ?? null, reference: o.reference,
            shift: o.shift, order_type: o.order_type, table: o.table,
        }
        const bulk = Array.from(groups.entries())
            .filter(([pid]) => pid !== '__no_printer__')
            .map(([pid, items]) => ({ id: pid, header, items }))
        console.log(bulk)
        // @ts-ignore
        // window.api.invoke('api.transaction.printer:send', bulk)
    }

    return (
        <ListItemButton
            onClick={onClick}
            selected={selected}
            sx={{
                position: 'relative',
                alignItems: 'flex-start',
                py: 1.25, px: 1.5, mb: 1, borderRadius: 2,
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
                    content: '""', position: 'absolute', left: 0, top: 0, bottom: 0, width: 4,
                    borderTopLeftRadius: 8, borderBottomLeftRadius: 8,
                    background: selected
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
                    <Typography variant="subtitle1" fontWeight={900}>{rupiah(o.total)}</Typography>
                </Stack>

                {/* Baris 2 */}
                <Stack direction="row" alignItems="center" gap={0.75}>
                    <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap sx={{ flex: 1, minWidth: 0 }}>
                        <Chip size="small" label={isClosed ? 'Selesai' : 'Aktif'} color={isClosed ? 'error' : 'success'} variant="filled" />
                        <Chip size="small" icon={<LocalMallRounded />} label={`${items} item`} />
                        <Chip size="small" icon={<LayersRounded />} label={`${batches} batch`} />
                    </Stack>
                    <TransactionListItemPrintTransaction tx={o} />
                </Stack>

                {/* Baris 3 */}
                <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap>
                    <Chip size="small" icon={<PersonOutlineRounded />} label={o.reference?.name?.first_name ?? o.reference?.username ?? shortId(o.reference?.id)} title={o.reference?.id ?? ''} />
                    <Chip size="small" icon={<AccessTimeRounded />} label={o.shift?.name ?? '-'} />
                </Stack>

                <Typography variant="caption" color="text.secondary">{fmtDT(o.time_created)}</Typography>
            </Stack>
        </ListItemButton>
    )
}

const TransactionListItemHeaderWidget = dynamic(() => import('./widgets/TransactionListItemHeaderWidget'), {
    loading : () => <ShimmerLoading/>,
    ssr: false,
})


// ===== Main =====
const TransactionListItem: React.FC = () => {
    const [transaction, setTransaction] = useState<Array<Transaction>>([])
    const [selectedId, setSelectedId] = useState<string | undefined>()

    const router = useRouter()
    const pathname = usePathname()
    const searchParams = useSearchParams()

    // Filters state (dikontrol header widget)
    const [filters, setFilters] = useState<Filters>({
        query: '',
        status: 'all',
        shiftName: 'all',
        cashierName: 'all',
        startAt: '', endAt: '',
        itemRange: [0, 0],
        batchRange: [0, 0],
    })
    const onFiltersChange = (patch: Partial<Filters>) => setFilters(prev => ({ ...prev, ...patch }))

    // Sync selected from URL ?id=
    useEffect(() => {
        const fromUrl = searchParams?.get('id') || undefined
        setSelectedId(fromUrl)
    }, [searchParams])

    // === FETCH: minta data sesuai range waktu ke server (tidak read-all) ===
    useEffect(() => {
        const { startAt, endAt } = filters
        if (!startAt || !endAt) return
        const payload = {
            // kirim dengan offset Asia/Makassar (detik diset untuk presisi server)
            startAt: `${startAt}:00${TZ_OFFSET}`,
            endAt: `${endAt}:59${TZ_OFFSET}`,
        }
        // @ts-ignore
        window.api.invoke('api.transaction:read.all', payload)
            .then((result: { data: Transaction[] }) => {
                setTransaction(result?.data ?? []);
                console.log(result);
            })
            .catch((error) => {
                console.error(error);
                setTransaction([])
            })
    }, [filters.startAt, filters.endAt])

    // Opsi select
    const shiftOptions = useMemo(() => {
        const set = new Set<string>()
        transaction.forEach(t => { if (t.shift?.name) set.add(t.shift.name) })
        return Array.from(set).sort()
    }, [transaction])

    const cashierOptions = useMemo(() => {
        const set = new Set<string>()
        transaction.forEach(t => {
            const label = t.reference?.name?.first_name ?? t.reference?.username ?? shortId(t.reference?.id)
            if (label) set.add(label)
        })
        return Array.from(set).sort()
    }, [transaction])

    // Slider max
    const maxItems = useMemo(() => transaction.length ? Math.max(...transaction.map(totalItems)) : 0, [transaction])
    const maxBatches = useMemo(() => transaction.length ? Math.max(...transaction.map(totalBatches)) : 0, [transaction])

    // …setelah const maxItems = useMemo(...), const maxBatches = useMemo(...)
    useEffect(() => {
        setFilters(prev => {
            const patch: Partial<Filters> = {}
            let changed = false

            const clamp = (v: number, max: number) => Math.min(Math.max(v, 0), Math.max(0, max))
            const maxI = Math.max(0, maxItems)
            const maxB = Math.max(0, maxBatches)

            // ITEM RANGE
            const [i0, i1] = prev.itemRange
            if (i0 === 0 && i1 === 0) {
                // default ketika belum pernah diset
                patch.itemRange = [0, maxI]
                changed = true
            } else {
                // jaga-jaga kalau max berubah turun/naik
                const ni0 = clamp(i0, maxI)
                const ni1 = clamp(i1 === 0 ? maxI : i1, maxI)
                if (ni0 !== i0 || ni1 !== i1) {
                    patch.itemRange = [ni0, ni1]
                    changed = true
                }
            }

            // BATCH RANGE
            const [b0, b1] = prev.batchRange
            if (b0 === 0 && b1 === 0) {
                patch.batchRange = [0, maxB]
                changed = true
            } else {
                const nb0 = clamp(b0, maxB)
                const nb1 = clamp(b1 === 0 ? maxB : b1, maxB)
                if (nb0 !== b0 || nb1 !== b1) {
                    patch.batchRange = [nb0, nb1]
                    changed = true
                }
            }

            return changed ? { ...prev, ...patch } : prev
        })
    }, [maxItems, maxBatches])


    const transactions = useMemo(
        () => [...transaction].sort((a, b) => new Date(b.time_created).getTime() - new Date(a.time_created).getTime()),
        [transaction]
    )

    // Filter final (query/status/shift/kasir/range item & batch).
    // Catatan: range waktu sudah di-handle server via payload di atas.
    const filtered = useMemo(() => {
        const { query, status, shiftName, cashierName, itemRange, batchRange } = filters
        return transactions
            .filter(o => matchesQuery(o, query))
            .filter(o => status === 'all' ? true : status === 'active' ? !o.time_closed : Boolean(o.time_closed))
            .filter(o => shiftName === 'all' ? true : (o.shift?.name === shiftName))
            .filter(o => {
                const label = o.reference?.name?.first_name ?? o.reference?.username ?? shortId(o.reference?.id)
                return cashierName === 'all' ? true : (label === cashierName)
            })
            .filter(o => {
                const n = totalItems(o)
                return n >= itemRange[0] && n <= itemRange[1]
            })
            .filter(o => {
                const n = totalBatches(o)
                return n >= batchRange[0] && n <= batchRange[1]
            })
    }, [transactions, filters])

    useEffect(() => {
        const norm = (pathname || '').replace(/\/+$/, '')
        const root = norm.replace(/\/batch$/, '') // path tanpa /batch

        if (filtered.length === 0) {
            // kosong: unselect & hapus ?id lalu balik ke root (pakai replace biar ga nambah history)
            if (selectedId) setSelectedId(undefined)
            const params = new URLSearchParams(searchParams?.toString() || '')
            if (params.has('id') || norm !== root) {
                params.delete('id')
                const qs = params.toString()
                router.replace(qs ? `${root}?${qs}` : root, { scroll: false })
            }
            return
        }

        // ada data tapi id sekarang nggak ada di hasil (misal ganti filter): unselect & rapikan URL
        if (selectedId && !filtered.some(t => t.id === selectedId)) {
            setSelectedId(undefined)
            const params = new URLSearchParams(searchParams?.toString() || '')
            if (params.has('id') || norm !== root) {
                params.delete('id')
                const qs = params.toString()
                router.replace(qs ? `${root}?${qs}` : root, { scroll: false })
            }
        }
    }, [filtered, selectedId, pathname, router, searchParams])



    return (
        <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', gap: 1 }}>
            {/* Header (search + filter) */}
            <TransactionListItemHeaderWidget
                filters={filters}
                onFiltersChange={onFiltersChange}
                shiftOptions={shiftOptions}
                cashierOptions={cashierOptions}
                maxItems={maxItems}
                maxBatches={maxBatches}
                filteredCount={filtered.length}
            />

            <Divider />

            <Box sx={{ flex: 1, minHeight: 0 }}>
                {filtered.length === 0 ? (
                    <Box sx={{ display: 'grid', placeItems: 'center', height: '100%', color: 'text.secondary' }}>
                        <Typography variant="body2">Data nggak ketemu. Coba filter/kata kunci lain ya~</Typography>
                    </Box>
                ) : (
                    <PerfectScrollbar options={{ suppressScrollX: true }}>
                        <List sx={{
                            py : 1,
                            pr: 1
                        }}>
                            {filtered.map(o => (
                                <TransactionListItemRow
                                    key={o.id}
                                    o={o}
                                    selected={o.id === selectedId}
                                    onClick={() => {
                                        const norm = (pathname || '').replace(/\/+$/, '')
                                        const root = norm.replace(/\/batch$/, '')
                                        const base = norm.split('/').pop() === 'batch' ? norm : `${norm}/batch`
                                        const params = new URLSearchParams(searchParams?.toString() || '')

                                        if (o.id === selectedId) {
                                            // klik kedua: unselect
                                            setSelectedId(undefined)
                                            params.delete('id')
                                            router.push(params.toString() ? `${root}?${params.toString()}` : root, { scroll: false })
                                        } else {
                                            // select
                                            setSelectedId(o.id)
                                            params.set('id', o.id)
                                            router.push(`${base}?${params.toString()}`, { scroll: false })
                                        }
                                    }}
                                />
                            ))}
                        </List>
                    </PerfectScrollbar>
                )}
            </Box>
        </Box>
    )
}

export default React.memo(TransactionListItem)
