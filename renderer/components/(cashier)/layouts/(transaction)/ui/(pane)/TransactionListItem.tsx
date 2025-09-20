'use client'

import * as React from 'react'
import {
    Box, Chip, List, ListItemButton, Stack, Typography, Divider, Button
} from '@mui/material'
import PerfectScrollbar from 'react-perfect-scrollbar'
import 'react-perfect-scrollbar/dist/css/styles.css'
import dynamic from 'next/dynamic'

import ShimmerLoading from '../../../../../(shared)/(loading)/ShimmerLoading'
import { useLayoutManipulatorResizable } from '../../../../../../contexts/LayoutManipulatorResizableContext'
import TransactionContainer from './TransactionContainer'

import ReceiptLongRounded from '@mui/icons-material/ReceiptLongRounded'
import LocalMallRounded from '@mui/icons-material/LocalMallRounded'
import LayersRounded from '@mui/icons-material/LayersRounded'
import PersonOutlineRounded from '@mui/icons-material/PersonOutlineRounded'
import AccessTimeRounded from '@mui/icons-material/AccessTimeRounded'
import CallMergeRounded from '@mui/icons-material/CallMergeRounded'

import type { Filters } from './widgets/TransactionListItemHeaderWidget'
import TransactionListItemPrintTransaction from './(components)/TransactionListItemPrintTransaction'
import NewOrderModal from './(components)/NewOrderModal'

// ===== Types =====
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

// ===== Utils & TZ =====
const TZ_OFFSET = '+08:00' // Asia/Makassar
const GRADIENT_PURPLE = 'linear-gradient(90deg, #6366F1, #8B5CF6 30%, #EC4899)'
const rupiah = (n: number | string) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(typeof n === 'string' ? parseFloat(n) : n)
const fmtDT = (iso?: string) => iso ? new Intl.DateTimeFormat('id-ID', { dateStyle: 'medium', timeStyle: 'short', hour12: false, timeZone: 'Asia/Makassar' }).format(new Date(iso)) : '-'
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
    cats.forEach(c => (Array.isArray(c?.printer) ? c.printer : []).forEach(p => p?.id ? ids.push(String(p.id)) : undefined))
    return ids.length ? Array.from(new Set(ids)) : ['__no_printer__']
}
const groupTxItemsByPrinter = (tx: Transaction) => {
    const map = new Map<string, Item[]>()
    const allItems: Item[] = tx.batches.flatMap(b => Array.isArray(b.items) ? b.items : [])
    allItems.forEach(it => {
        const pids = getPrinterIdsFromItem(it)
        pids.forEach(pid => map.set(pid, (map.get(pid) ?? []).concat(it)))
    })
    return map
}

// ===== Timer Utils: diff tahun/bulan/hari/jam/menit/detik (tanpa minggu) =====
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
                fontWeight: 800,
                letterSpacing: 0.6,
                color: 'inherit',
                textAlign: 'right',
                whiteSpace: 'normal',
                overflowWrap: 'anywhere',
                '@keyframes tPulse': { '0%': { opacity: 0.9 }, '50%': { opacity: 1 }, '100%': { opacity: 0.9 } },
                animation: active ? 'tPulse 1.8s ease-in-out infinite' : 'none',
                userSelect: 'none',
            }}
            aria-label={active ? 'Durasi transaksi aktif' : 'Durasi saat transaksi ditutup'}
        >
            {label}
        </Typography>
    )
}

// ===== Row =====
const TransactionListItemRow: React.FC<{ o: Transaction; selected?: boolean; onClick?: () => void }> = ({ o, selected = false, onClick }) => {
    const items = totalItems(o)
    const batches = totalBatches(o)
    const isClosed = Boolean(o.time_closed)
    const cardBorderColor = selected ? 'primary.outlinedBorder' : (isClosed ? 'error.light' : 'divider')

    return (
        <>
            <ListItemButton
                onClick={onClick}
                selected={selected}
                sx={{
                    position: 'relative',
                    alignItems: 'flex-start',
                    py: 1.25, px: 1.5, mb: 0,
                    border: '1px solid', borderColor: cardBorderColor,
                    bgcolor: selected ? 'action.selected' : (isClosed ? 'action.hover' : 'background.paper'),
                    boxShadow: selected ? '0 10px 24px rgba(0,0,0,0.12)' : '0 2px 8px rgba(0,0,0,0.04)',
                    transition: 'transform .15s ease, box-shadow .2s ease, border-color .2s ease, background-color .2s ease',
                    transform: 'translateY(0)',
                    '&:hover': { transform: 'translateY(-1px)', boxShadow: '0 12px 28px rgba(0,0,0,0.12)', bgcolor: selected ? 'action.selected' : (isClosed ? 'action.hover' : 'action.hover') },
                    borderTopLeftRadius: 8, borderTopRightRadius: 8, borderBottomLeftRadius: 0, borderBottomRightRadius: 0,
                    '&::before': {
                        content: '""', position: 'absolute', left: 0, top: 0, bottom: 0, width: 4,
                        borderTopLeftRadius: 8, borderBottomLeftRadius: 0,
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
                        <Typography variant="subtitle1" fontWeight={900}>{rupiah(o.total ?? 0)}</Typography>
                    </Stack>

                    {/* Baris 2 */}
                    <Stack direction="row" alignItems="center" gap={0.75}>
                        <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap sx={{ flex: 1, minWidth: 0 }}>
                            <Chip size="small" label={isClosed ? 'Selesai' : 'Aktif'} color={isClosed ? 'error' : 'success'} variant="filled" />
                            <Chip size="small" icon={<LocalMallRounded />} label={`${items} item`} />
                            <Chip size="small" icon={<LayersRounded />} label={`${batches} batch`} />
                        </Stack>
                        {/** @ts-ignore **/}
                        <TransactionListItemPrintTransaction tx={o} />
                    </Stack>

                    {/* Baris 3 — kasir & shift */}
                    <Stack direction="row" alignItems="center" gap={0.75}>
                        <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap sx={{ flex: 1, minWidth: 0 }}>
                            <Chip size="small" icon={<PersonOutlineRounded />} label={o.reference?.name?.first_name ?? o.reference?.username ?? shortId(o.reference?.id)} title={o.reference?.id ?? ''} />
                            <Chip size="small" icon={<AccessTimeRounded />} label={o.shift?.name ?? '-'} />
                        </Stack>
                    </Stack>

                    {/* Timestamp asli */}
                    <Typography variant="caption" color="text.secondary">{fmtDT(o.time_created)}</Typography>
                </Stack>
            </ListItemButton>

            {/* Footer nempel */}
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

const TransactionListItemHeaderWidget = dynamic(() => import('./widgets/TransactionListItemHeaderWidget'), {
    loading: () => <ShimmerLoading />,
    ssr: false,
})

/* =========================
 * ======== MAIN ===========
 * =======================*/
const TransactionListItem: React.FC = () => {
    const { setLayout } = useLayoutManipulatorResizable()

    const [transaction, setTransaction] = React.useState<Array<Transaction>>([])
    const [selectedIds, setSelectedIds] = React.useState<Set<string>>(new Set())

    // 🔑 KUNCI REFRESH: dipicu dari NewOrderModal.onCreated() tanpa mengubah filter
    const [reloadKey, setReloadKey] = React.useState(0)

    const [filters, setFilters] = React.useState<Filters>({
        query: '',
        status: 'all',
        shiftName: 'all',
        cashierName: 'all',
        startAt: '', endAt: '',
        itemRange: [0, 0],
        batchRange: [0, 0],
    })
    const onFiltersChange = (patch: Partial<Filters>) => setFilters(prev => ({ ...prev, ...patch }))

    // === FETCH by date range ===
    React.useEffect(() => {
        const { startAt, endAt } = filters
        if (!startAt || !endAt) return
        const payload = { startAt: `${startAt}:00${TZ_OFFSET}`, endAt: `${endAt}:59${TZ_OFFSET}` }
        // @ts-ignore
        window.api.invoke('api.transaction:read.all', payload)
            .then((result: { data: Transaction[] }) => setTransaction(result?.data ?? []))
            .catch(() => setTransaction([]))
        // ✅ reloadKey ikut dependency agar refetch setelah create; filter state TAK tersentuh
    }, [filters.startAt, filters.endAt, reloadKey])

    // Opsi filter
    const shiftOptions = React.useMemo(() => {
        const set = new Set<string>()
        transaction.forEach(t => t.shift?.name ? set.add(t.shift.name) : undefined)
        return Array.from(set).sort()
    }, [transaction])

    const cashierOptions = React.useMemo(() => {
        const set = new Set<string>()
        transaction.forEach(t => {
            const label = t.reference?.name?.first_name ?? t.reference?.username ?? shortId(t.reference?.id)
            label ? set.add(label) : undefined
        })
        return Array.from(set).sort()
    }, [transaction])

    // Slider max
    const maxItems = React.useMemo(() => transaction.length ? Math.max(...transaction.map(totalItems)) : 0, [transaction])
    const maxBatches = React.useMemo(() => transaction.length ? Math.max(...transaction.map(totalBatches)) : 0, [transaction])

    // Jaga range agar selalu valid thd data terbaru, tapi TIDAK ngereset pilihan user jika sudah bebeda dari default
    React.useEffect(() => {
        setFilters(prev => {
            const patch: Partial<Filters> = {}
            let changed = false
            const clamp = (v: number, max: number) => Math.min(Math.max(v, 0), Math.max(0, max))
            const maxI = Math.max(0, maxItems)
            const maxB = Math.max(0, maxBatches)

            const [i0, i1] = prev.itemRange
            if (i0 === 0 && i1 === 0) { patch.itemRange = [0, maxI]; changed = true }
            else {
                const ni0 = clamp(i0, maxI)
                const ni1 = clamp(i1 === 0 ? maxI : i1, maxI)
                if (ni0 !== i0 || ni1 !== i1) { patch.itemRange = [ni0, ni1]; changed = true }
            }

            const [b0, b1] = prev.batchRange
            if (b0 === 0 && b1 === 0) { patch.batchRange = [0, maxB]; changed = true }
            else {
                const nb0 = clamp(b0, maxB)
                const nb1 = clamp(b1 === 0 ? maxB : b1, maxB)
                if (nb0 !== b0 || nb1 !== b1) { patch.batchRange = [nb0, nb1]; changed = true }
            }

            return changed ? { ...prev, ...patch } : prev
        })
    }, [maxItems, maxBatches])

    const transactions = React.useMemo(
        () => [...transaction].sort((a, b) => new Date(b.time_created as string).getTime() - new Date(a.time_created as string).getTime()),
        [transaction]
    )

    const filtered = React.useMemo(() => {
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

    // ====== Selection State Helpers ======
    const txById = React.useMemo(() => new Map(filtered.map(t => [t.id, t] as const)), [filtered])
    const selectedTxs = React.useMemo(() => Array.from(selectedIds).map(id => txById.get(id)).filter(Boolean) as Transaction[], [selectedIds, txById])
    const hasClosed = React.useMemo(() => selectedTxs.some(t => Boolean(t.time_closed)), [selectedTxs])

    // Sinkronisasi selection & right pane terhadap filtered
    React.useEffect(() => {
        const idsInList = new Set(filtered.map(t => t.id))
        const cleaned = new Set<string>()
        selectedIds.forEach(id => idsInList.has(id) ? cleaned.add(id) : undefined)

        const changed = cleaned.size !== selectedIds.size
        if (changed) setSelectedIds(new Set(cleaned))

        const size = cleaned.size
        if (size === 1) {
            const onlyId = Array.from(cleaned)[0]
            setLayout(prev => ({ ...prev, right: <TransactionContainer id={onlyId} /> }))
        } else {
            setLayout(prev => ({ ...prev, right: undefined }))
        }

        if (filtered.length === 0 && selectedIds.size) setSelectedIds(new Set())
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [filtered])

    // Handler toggle selection per row
    const toggleSelection = (id: string) => {
        setSelectedIds(prev => {
            const next = new Set(prev)
            next.has(id) ? next.delete(id) : next.add(id)
            const size = next.size
            if (size === 0) setLayout(p => ({ ...p, right: undefined }))
            else if (size === 1) {
                const onlyId = Array.from(next)[0]
                setLayout(p => ({ ...p, right: <TransactionContainer id={onlyId} /> }))
            } else setLayout(p => ({ ...p, right: undefined }))
            return next
        })
    }

    // Join click stub
    const onJoin = () => {
        const ids = Array.from(selectedIds)
        console.log('[JOIN] selected ids:', ids)
        // TODO: implement gabung transaksi
    }

    // UI Footer State
    const selectedCount = selectedIds.size
    const joinEnabled = selectedCount > 1 && !hasClosed

    // Banner merah
    const showJoinAlert = selectedCount > 1 && hasClosed
    const joinAlertMsg = 'Tidak Bisa Join • Jika Ada Transaksi Selesai •'

    return (
        <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            {/* Header */}
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

            {/* List Area */}
            <Box sx={{ flex: 1, minHeight: 0, overflow: 'hidden' }}>
                {filtered.length === 0 ? (
                    <Box sx={{ display: 'grid', placeItems: 'center', height: '100%', color: 'text.secondary' }}>
                        <Typography variant="body2">Data nggak ketemu. Coba filter/kata kunci lain ya~</Typography>
                    </Box>
                ) : (
                    <PerfectScrollbar options={{ suppressScrollX: true, wheelPropagation: false, swipeEasing: true }}>
                        <List sx={{ py: 1, pr: 1 }}>
                            {filtered.map(o => (
                                <TransactionListItemRow
                                    key={o.id}
                                    o={o}
                                    selected={selectedIds.has(o.id as string)}
                                    onClick={() => toggleSelection(o.id as string)}
                                />
                            ))}
                        </List>
                    </PerfectScrollbar>
                )}
            </Box>

            {/* Banner merah tepat di atas footer */}
            {showJoinAlert && (
                <Box
                    role="alert"
                    sx={{ px: 1.5, py: 1, bgcolor: 'error.main', color: 'error.contrastText', borderTop: '1px solid', borderColor: 'error.dark' }}
                >
                    <Typography variant="body2" fontWeight={800} sx={{ textAlign: 'left', whiteSpace: 'nowrap' }}>
                        {joinAlertMsg}
                    </Typography>
                </Box>
            )}

            {/* Footer Actions */}
            <Divider />
            <Box
                sx={{
                    px: 1.5, py: 1.25, minHeight: 72, display: 'flex', alignItems: 'center', gap: 2,
                    bgcolor: 'background.paper', position: 'relative', boxShadow: '0 -8px 24px rgba(0,0,0,0.08)',
                    '&::after': { content: '""', position: 'absolute', left: 0, right: 0, bottom: 0, height: 6, background: GRADIENT_PURPLE, borderBottomLeftRadius: 8, borderBottomRightRadius: 8 },
                    '&::before': { content: '""', position: 'absolute', left: 0, right: 0, top: 0, height: 1 },
                }}
            >
                {/* Kiri: info */}
                <Typography variant="body1" color="text.secondary" sx={{ flex: 1, minWidth: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {selectedCount === 0 ? 'Tidak ada transaksi yang dipilih' : selectedCount === 1 ? '1 transaksi terpilih' : `${selectedCount} transaksi terpilih`}
                </Typography>

                {/* Kanan: aksi */}
                <Stack direction="row" spacing={1.25} alignItems="center" justifyContent="flex-end" sx={{ flexShrink: 0 }}>
                    {/* ⬇️ Penting: panggil onCreated agar parent refetch TANPA mengubah filter */}
                    <NewOrderModal onCreated={() => setReloadKey(k => k + 1)} />

                    <Button
                        variant="contained"
                        size="large"
                        startIcon={<CallMergeRounded />}
                        disabled={!joinEnabled}
                        onClick={onJoin}
                        sx={{ fontWeight: 800, letterSpacing: .2, opacity: joinEnabled ? 1 : .6 }}
                    >
                        Gabung
                    </Button>
                </Stack>
            </Box>
        </Box>
    )
}

export default React.memo(TransactionListItem)
