// Left: TransactionListItem.tsx (full revisi, dengan precompute agg)
'use client'

import * as React from 'react'
import {
    Box, List, Divider, IconButton, Stack, Typography, Button, Alert
} from '@mui/material'
import PerfectScrollbar from 'react-perfect-scrollbar'
import 'react-perfect-scrollbar/dist/css/styles.css'
import dynamic from 'next/dynamic'

import ShimmerLoading from '../../../../../../../(shared)/(loading)/ShimmerLoading'
import { useLayoutManipulatorResizable } from '../../../../../../../../contexts/LayoutManipulatorResizableContext'

import CloseRounded from '@mui/icons-material/CloseRounded'
import ReplayRounded from '@mui/icons-material/ReplayRounded'

import type { Filters } from './widgets/TransactionListItemHeaderWidget'
import ShimmerLoadingTransactionListItemRow from '../(loading)/ShimmerLoadingTransactionListItemRow'
import ShimmerLoadingTransactionContainer from '../(loading)/ShimmerLoadingTransactionContainer'
import { useTransactionEventTrigger } from './context/TransactionEventTriggerContext'
import { useSession } from '../../../../../../../../contexts/SessionProviderContext'
import { Transaction, TransactionBills } from '../types/api.transaction.type'

// ===== Const =====
const TZ_OFFSET = '+08:00' // Asia/Makassar
const GRADIENT_PURPLE = 'linear-gradient(90deg, #6366F1, #8B5CF6 30%, #EC4899)'

// ===== Utils =====
const shortId = (s?: string) => (s ? `${s.slice(0, 8)}…` : '-')
const toErrorMessage = (err: any) =>
    typeof err === 'string' ? err : (err?.message || err?.error || 'Terjadi kesalahan pada server. Mohon coba lagi beberapa saat lagi.')

// ===== Dynamic chunks =====
const TransactionListItemRow = dynamic(() => import('./(components)/TransactionListItemRow'), {
    loading: () => <ShimmerLoadingTransactionListItemRow />,
    ssr: true,
})

const NewOrderModal = dynamic(() => import('./(components)/NewOrderModal'), { ssr: true })

const TransactionContainer = dynamic(() => import('./TransactionContainer'), {
    ssr: true,
    loading: () => <ShimmerLoadingTransactionContainer />,
})

const TransactionButtonJoinBillWidget = dynamic(() => import('./widgets/TransactionButtonJoinBillWidget'), { ssr: true })

const TransactionListItemHeaderWidget = dynamic(() => import('./widgets/TransactionListItemHeaderWidget'), {
    loading: () => <ShimmerLoading />, ssr: false,
})

const TransactionListItemNotFound = dynamic(() => import('./(components)/TransactionListItemNotFound'), { ssr: true })

/* =========================
 * ======== AGG ===========
 * =======================*/
type TxAgg = {
    id: string
    qtySum: number         // total qty (untuk slider & chip)
    itemCount: number      // jumlah baris item
    batchCount: number     // jumlah batch
    paidCount: number
    pendingCount: number
    activeCount: number
    subtotal: number       // total harga yg BELUM void-approved & BELUM success-paid
    cashierLabel: string
    hasClosed: boolean
    searchText: string     // invoice|table|batches (lowercased)
}

const buildVersion = (t: Transaction) =>
    [
        t.time_updated ?? t.time_created ?? '',
        t.batches?.length ?? 0,
        (t.batches ?? []).reduce((a, b) => a + (b.items?.length ?? 0), 0),
    ].join('|')

const makeCashierLabel = (t: Transaction) =>
    t.reference?.name?.first_name ?? t.reference?.username ?? shortId(t.reference?.id)

const pickBills = (o: any): TransactionBills[] => o?.bills ?? o?.transaction?.bills ?? []

const txAggCache = new Map<string, { ver: string, agg: TxAgg }>()

const computeAgg = (t: Transaction): TxAgg => {
    const ver = buildVersion(t)
    const hit = txAggCache.get(t.id)
    if (hit?.ver === ver) return hit.agg

    const bills = pickBills(t)

    const allBillIdSet = new Set(
        bills.flatMap(b => Array.isArray(b?.items) ? b.items : [])
            .map(bi => bi?.transactionItem?.id)
            .filter(Boolean)
    )

    const pendingBillIds = new Set(
        bills
            .filter(b => (b?.paid == null) || (b?.paid?.status === false))
            .flatMap(b => Array.isArray(b?.items) ? b.items : [])
            .map(bi => bi?.transactionItem?.id)
            .filter(Boolean)
    )

    const paidBillIds = new Set(
        bills
            .filter(b => (b?.paid?.status === true))
            .flatMap(b => Array.isArray(b?.items) ? b.items : [])
            .map(bi => bi?.transactionItem?.id)
            .filter(Boolean)
    )

    let qtySum = 0, itemCount = 0, batchCount = t.batches?.length ?? 0
    let paid = 0, pending = 0, active = 0
    let subtotal = 0

    ;(t.batches ?? []).forEach(b => {
        (b.items ?? []).forEach(i => {
            itemCount += 1
            qtySum += i.qty

            const id = i.id
            const voidApproved = i?.void?.is_approved === true
            const successPaid = paidBillIds.has(id)

            // subtotal: include hanya yang BELUM void-approved & BELUM success-paid
            subtotal += (!voidApproved && !successPaid) ? (+i.sub_total || 0) : 0

            // status di bills
            paid    += paidBillIds.has(id)    ? 1 : 0
            pending += pendingBillIds.has(id) ? 1 : 0
            active  += (!allBillIdSet.has(id)) ? 1 : 0
        })
    })

    const searchText = [
        t.invoice ?? '',
        t.table?.code ?? '',
        ...(t.batches ?? []).map(b => String(b.batch ?? '')),
    ].join('|').toLowerCase()

    const agg: TxAgg = {
        id: t.id,
        qtySum, itemCount, batchCount,
        paidCount: paid, pendingCount: pending, activeCount: active,
        subtotal,
        cashierLabel: makeCashierLabel(t),
        hasClosed: Boolean(t.time_closed),
        searchText,
    }

    txAggCache.set(t.id, { ver, agg })
    return agg
}

/* =========================
 * ======== MAIN ===========
 * =======================*/
const TransactionListItem: React.FC = () => {
    const { setLayout } = useLayoutManipulatorResizable()
    const { Session } = useSession()
    const [transaction, setTransaction] = React.useState<Array<Transaction>>([])

    // Selection
    const [singleSelectedId, setSingleSelectedId] = React.useState<string>()
    const [multiSelectedIds, setMultiSelectedIds] = React.useState<Set<string>>(new Set())

    // Refresh key
    const [reloadKey, setReloadKey] = React.useState(0)

    const { token, reason } = useTransactionEventTrigger()
    const lastReasonRef = React.useRef<string | null>(null)

    // Fetch state
    const [isFetching, setIsFetching] = React.useState(false)
    const [fetchError, setFetchError] = React.useState<string | null>(null)

    const [filters, setFilters] = React.useState<Filters>({
        query: '', status: 'all', shiftName: 'all', cashierName: 'all',
        startAt: '', endAt: '',
        itemRange: [0, 0], batchRange: [0, 0],
    })
    const onFiltersChange = (patch: Partial<Filters>) => setFilters(prev => ({ ...prev, ...patch }))

    const refetch = () => { setFetchError(null); setReloadKey(k => k + 1) }

    // === Soft refetch ===
    const softRefetch = React.useCallback(() => {
        const { startAt, endAt } = filters
        if (!startAt || !endAt) return
        const payload = {
            startAt: `${startAt}:00${TZ_OFFSET}`,
            endAt: `${endAt}:59${TZ_OFFSET}`,
            reference: Session.id,
        }

        setIsFetching(true)
        setFetchError(null)
        // @ts-ignore (ipc from Electron)
        return window.api.invoke('api.transaction:read.all', payload)
            .then((result: { data: Transaction[] }) => {
                setTransaction(result?.data ?? [])
                setFetchError(null)
                return undefined
            })
            .catch((err: any) => {
                setTransaction([])
                setFetchError(toErrorMessage(err))
                return undefined
            })
            .finally(() => setIsFetching(false))
    }, [filters, Session.id])

    // === FETCH by date range ===
    React.useEffect(() => {
        const { startAt, endAt } = filters
        if (!startAt || !endAt) return
        const payload = {
            startAt: `${startAt}:00${TZ_OFFSET}`,
            endAt: `${endAt}:59${TZ_OFFSET}`,
            reference: Session.id,
        }

        setIsFetching(true)
        setFetchError(null)
        // @ts-ignore (ipc from Electron)
        window.api.invoke('api.transaction:read.all', payload)
            .then((result: { data: Transaction[] }) => {
                setTransaction(result?.data ?? [])
                setFetchError(null)
            })
            .catch((err: any) => {
                setTransaction([])
                setFetchError(toErrorMessage(err))
            })
            .finally(() => setIsFetching(false))
    }, [filters.startAt, filters.endAt, reloadKey, Session.id])

    // ==== Precompute agg (sekali per transaksi) ====
    const transactions = React.useMemo(
        () => [...transaction].sort((a, b) => new Date(b.time_created as string).getTime() - new Date(a.time_created as string).getTime()),
        [transaction]
    )

    const txAggs = React.useMemo(() => transactions.map(computeAgg), [transactions])

    const aggById = React.useMemo(() => {
        const m = new Map<string, TxAgg>()
        txAggs.forEach(a => m.set(a.id, a))
        return m
    }, [txAggs])

    // Opsi filter (distinct)
    const shiftOptions = React.useMemo(() => {
        const set = new Set<string>()
        transaction.forEach(t => t.shift?.name ? set.add(t.shift.name) : undefined)
        return Array.from(set).sort()
    }, [transaction])

    const cashierOptions = React.useMemo(() => {
        const set = new Set<string>()
        transaction.forEach(t => {
            const label = makeCashierLabel(t)
            label ? set.add(label) : undefined
        })
        return Array.from(set).sort()
    }, [transaction])

    // Slider max: pakai agg
    const maxItems = React.useMemo(() => txAggs.length ? Math.max(...txAggs.map(a => a.qtySum)) : 0, [txAggs])
    const maxBatches = React.useMemo(() => txAggs.length ? Math.max(...txAggs.map(a => a.batchCount)) : 0, [txAggs])

    // a) token berubah → refetch
    React.useEffect(() => {
        if (!token) return
        lastReasonRef.current = reason ?? null
        setFetchError(null)
        setReloadKey(k => k + 1)
    }, [token, reason])

    // b) kalau reason === 'batch' → set slider ke maksimal setelah max* update
    React.useEffect(() => {
        if (lastReasonRef.current === 'batch') {
            const mi = Math.max(0, maxItems)
            const mb = Math.max(0, maxBatches)
            setFilters(prev => ({ ...prev, itemRange: [prev.itemRange[0], mi], batchRange: [prev.batchRange[0], mb] }))
            lastReasonRef.current = null
        }
    }, [maxItems, maxBatches])

    // Jaga range tetap valid
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

    // Apply filter kombo (pakai agg → hemat)
    const filtered = React.useMemo(() => {
        const { query, status, shiftName, cashierName, itemRange, batchRange } = filters
        const q = query.trim().toLowerCase()

        return transactions.filter(t => {
            const a = aggById.get(t.id)
            if (!a) return false

            if (q && !a.searchText.includes(q)) return false
            if (status !== 'all') {
                if (status === 'active' && a.hasClosed) return false
                if (status === 'selesai' && !a.hasClosed) return false
            }
            if (shiftName !== 'all' && t.shift?.name !== shiftName) return false
            if (cashierName !== 'all' && a.cashierLabel !== cashierName) return false

            // itemRange berdasarkan qtySum (sesuai versi lama kamu)
            if (a.qtySum < itemRange[0] || a.qtySum > itemRange[1]) return false
            return !(a.batchCount < batchRange[0] || a.batchCount > batchRange[1]);


        })
    }, [transactions, aggById, filters])

    // ====== Selection Helpers ======
    const txById = React.useMemo(() => new Map(filtered.map(t => [t.id, t] as const)), [filtered])
    const selectedTxs = React.useMemo(
        () => Array.from(multiSelectedIds).map(id => txById.get(id)).filter(Boolean) as Transaction[],
        [multiSelectedIds, txById]
    )
    const hasClosed = React.useMemo(() => selectedTxs.some(t => Boolean(t.time_closed)), [selectedTxs])
    const selectedCount = multiSelectedIds.size

    // Sinkronisasi selection
    React.useEffect(() => {
        setMultiSelectedIds(prev => {
            const idsInList = new Set(filtered.filter(t => !t.time_closed).map(t => t.id))
            const cleaned = Array.from(prev).filter(id => idsInList.has(id))
            return cleaned.length === prev.size ? prev : new Set(cleaned)
        })

        if (singleSelectedId) {
            const stillExists = filtered.some(t => t.id === singleSelectedId)
            if (!stillExists) {
                setSingleSelectedId(undefined)
                setLayout(prev => ({ ...prev, right: <TransactionListItemNotFound /> }))
            }
        }
    }, [filtered, singleSelectedId, setLayout])

    // Handlers
    const onRowClick = (id: string) => {
        setSingleSelectedId(prev => {
            if (prev === id) {
                setLayout(p => ({ ...p, right: <TransactionListItemNotFound /> }))
                return undefined
            }
            setLayout(p => ({ ...p, right: <TransactionContainer id={id} transaction={transactions.find((d) => d.id === id)} /> }))
            return id
        })
    }

    const onToggleMulti = (id: string, checked: boolean) =>
        setMultiSelectedIds(prev => {
            const tx = txById.get(id)
            if (!tx || tx.time_closed) return prev
            const next = new Set(prev)
            checked ? next.add(id) : next.delete(id)
            return next
        })

    const clearMultiSelect = () => setMultiSelectedIds(new Set())

    return (
        <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            {/* Header Filter */}
            <TransactionListItemHeaderWidget
                filters={filters}
                onFiltersChange={onFiltersChange}
                shiftOptions={shiftOptions}
                cashierOptions={cashierOptions}
                maxItems={maxItems}
                maxBatches={maxBatches}
                filteredCount={filtered.length}
            />

            {/* Multi-Select Header */}
            {selectedCount > 0 && (
                <Box
                    sx={{
                        position: 'sticky', top: 0, zIndex: 5, px: 1.5, py: 1,
                        bgcolor: 'background.paper', borderBottom: '1px solid', borderColor: 'divider',
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1,
                    }}
                >
                    <Typography variant="body2" fontWeight={700}>
                        {selectedCount === 1 ? '1 transaksi terpilih' : `${selectedCount} transaksi terpilih`}
                    </Typography>
                    <IconButton size="small" onClick={clearMultiSelect} aria-label="Bersihkan pilihan" color="inherit">
                        <CloseRounded fontSize="small" />
                    </IconButton>
                </Box>
            )}

            <Divider />

            {/* List Area */}
            <Box sx={{ flex: 1, minHeight: 0, overflow: 'hidden' }}>
                {fetchError ? (
                    <Box sx={{ display: 'grid', placeItems: 'center', height: '100%', p: 2 }}>
                        <Stack spacing={1.25} maxWidth={640} width="100%">
                            <Alert severity="error" variant="outlined">
                                <Typography variant="body2" sx={{ mb: 0.5, fontWeight: 700 }}>
                                    Gagal memuat data transaksi.
                                </Typography>
                                <Typography variant="body2">{fetchError}</Typography>
                            </Alert>
                            <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                                <Button
                                    onClick={refetch}
                                    startIcon={<ReplayRounded />}
                                    variant="contained"
                                    disabled={isFetching}
                                    sx={{ textTransform: 'none', fontWeight: 800, borderRadius: 1.5 }}
                                >
                                    {isFetching ? 'Memuat…' : 'Coba lagi'}
                                </Button>
                            </Box>
                        </Stack>
                    </Box>
                ) : filtered.length === 0 ? (
                    <Box sx={{ display: 'grid', placeItems: 'center', height: '100%', p: 2, color: 'text.secondary' }}>
                        <Stack spacing={1.25} alignItems="center">
                            <Typography variant="body2" textAlign="center">
                                Data tidak ditemukan untuk filter saat ini. Silakan sesuaikan kata kunci atau parameter pencarian Anda, kemudian coba lagi.
                            </Typography>
                            <Button
                                onClick={refetch}
                                startIcon={<ReplayRounded />}
                                variant="outlined"
                                disabled={isFetching}
                                sx={{ textTransform: 'none', fontWeight: 800, borderRadius: 1.5 }}
                            >
                                {isFetching ? 'Memuat…' : 'Coba lagi'}
                            </Button>
                        </Stack>
                    </Box>
                ) : (
                    <PerfectScrollbar options={{ suppressScrollX: true, wheelPropagation: false, swipeEasing: true }}>
                        <List sx={{ py: 1, pr: 1 }}>
                            {filtered.map(o => (
                                <TransactionListItemRow
                                    key={o.id}
                                    o={o}
                                    agg={aggById.get(o.id)!}                  // <<=== pass agg ke Row
                                    singleSelected={singleSelectedId === o.id}
                                    multiChecked={multiSelectedIds.has(o.id as string)}
                                    onRowClick={() => onRowClick(o.id as string)}
                                    onMultiToggle={(checked) => onToggleMulti(o.id as string, checked)}
                                />
                            ))}
                        </List>
                    </PerfectScrollbar>
                )}
            </Box>

            {/* Footer Actions */}
            <Divider />
            <Box
                sx={{
                    px: 1.5, py: 1.25, minHeight: 72, display: 'flex', alignItems: 'center', gap: 2,
                    bgcolor: 'background.paper', position: 'relative', boxShadow: '0 -8px 24px rgba(0,0,0,0.08)',
                    '&::after': { content: '""', position: 'absolute', left: 0, right: 0, bottom: 0, height: 6, background: GRADIENT_PURPLE, borderBottomLeftRadius: 8, borderBottomRightRadius: 8 },
                    '&::before': { content: '""', position: 'absolute', left: 0, right: 0, top: 0, height: 1 },
                    justifyContent: 'flex-end',
                }}
            >
                <Stack direction="row" spacing={1.25} alignItems="center" justifyContent="flex-end" sx={{ flexShrink: 0 }}>
                    <NewOrderModal onCreated={softRefetch} />
                    <TransactionButtonJoinBillWidget
                        key={`join-${selectedCount}`}
                        selectedIds={Array.from(multiSelectedIds)}
                        selectedTxs={selectedTxs}
                        hasClosed={hasClosed}
                        onPick={(payload) => console.log('[JOIN PICKED]', payload)}
                    />
                </Stack>
            </Box>
        </Box>
    )
}

export default React.memo(TransactionListItem)
