// Left: TransactionListItem.tsx (full revisi)
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
import { Transaction } from '../types/api.transaction.type'
import {useEffect} from "react";
import {useFunctionKeyCtx} from "../../../../../../../../contexts/FunctionKeyProviderContext";

// ===== Const =====
const TZ_OFFSET = '+08:00' // Asia/Makassar
const GRADIENT_PURPLE = 'linear-gradient(90deg, #6366F1, #8B5CF6 30%, #EC4899)'

// ===== Utils (parent-only) =====
const shortId = (s?: string) => (s ? `${s.slice(0, 8)}…` : '-')
const totalItems = (o: Transaction) =>
    o.batches.reduce((acc, b) => acc + b.items.reduce((a, i) => a + i.qty, 0), 0)
const totalBatches = (o: Transaction) => o.batches.length
const matchesQuery = (o: Transaction, q: string) => {
    const s = q.trim().toLowerCase()
    if (!s) return true
    const inv = o.invoice?.toLowerCase() ?? ''
    const table = o.table?.code?.toLowerCase() ?? ''
    const anyBatch = o.batches.some(b => String(b.batch).toLowerCase().includes(s))
    return inv.includes(s) || table.includes(s) || anyBatch
}
const toErrorMessage = (err: any) =>
    typeof err === 'string'
        ? err
        : (err?.message || err?.error || 'Terjadi kesalahan pada server. Mohon coba lagi beberapa saat lagi.')

const TransactionListItemRow = dynamic(() => import('./(components)/TransactionListItemRow'), {
    loading: () => <ShimmerLoadingTransactionListItemRow />,
    ssr: true,
})

const NewOrderModal = dynamic(() => import('./(components)/NewOrderModal'), {
    ssr: true,
})

const TransactionContainer = dynamic(() => import('./TransactionContainer'), {
    ssr: true,
    loading: () => <ShimmerLoadingTransactionContainer />,
})

const TransactionContainerItems = dynamic(() => import('./TransactionContainerItems'), {
    ssr: true,
    loading: () => <ShimmerLoadingTransactionContainer />,
})

const TransactionButtonJoinBillWidget = dynamic(() => import('./widgets/TransactionButtonJoinBillWidget'), {
    ssr: true,
})

const TransactionListItemHeaderWidget = dynamic(() => import('./widgets/TransactionListItemHeaderWidget'), {
    loading: () => <ShimmerLoading />, ssr: false,
})

const TransactionListItemNotFound = dynamic(() => import('./(components)/TransactionListItemNotFound'), {
    ssr: true,
})

/* =========================
 * ======== MAIN ===========
 * =======================*/
const TransactionListItem: React.FC = () => {
    const { setLayout } = useLayoutManipulatorResizable()
    const { Session } = useSession()
    const { setMenu, remove,  key, seq } = useFunctionKeyCtx()
    const [transaction, setTransaction] = React.useState<Array<Transaction>>([])

    // ✅ Pisah state: single vs multi
    const [singleSelectedId, setSingleSelectedId] = React.useState<string>()
    const [multiSelectedIds, setMultiSelectedIds] = React.useState<Set<string>>(new Set())

    // 🔑 Refresh key dari tombol "Coba lagi" atau event lain
    const [reloadKey, setReloadKey] = React.useState(0)

    const { token, reason } = useTransactionEventTrigger()
    const lastReasonRef = React.useRef<string | null>(null)

    // ⏳ & ❌ State untuk fetch
    const [isFetching, setIsFetching] = React.useState(false)
    const [fetchError, setFetchError] = React.useState<string | null>(null)

    const [filters, setFilters] = React.useState<Filters>({
        query: '', status: 'all', shiftName: 'all', cashierName: 'all',
        startAt: '', endAt: '',
        itemRange: [0, 0], batchRange: [0, 0],
    })
    const onFiltersChange = (patch: Partial<Filters>) => setFilters(prev => ({ ...prev, ...patch }))

    const refetch = () => {
        setFetchError(null)
        setReloadKey(k => k + 1)
    }

    // === Soft refetch (tanpa menyentuh reloadKey) ===
    const softRefetch = React.useCallback(async () => {
        const { startAt, endAt } = filters
        if (!startAt || !endAt) return
        const payload = {
            startAt: `${startAt}:00${TZ_OFFSET}`, endAt: `${endAt}:59${TZ_OFFSET}`,
            reference: Session.id
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
    }, [filters, Session?.id, reloadKey])

    // === FETCH by date range ===
    React.useEffect(() => {
        const { startAt, endAt } = filters
        if (!startAt || !endAt) return
        const payload = {
            startAt: `${startAt}:00${TZ_OFFSET}`,
            endAt: `${endAt}:59${TZ_OFFSET}`,
            reference: Session.id
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
    }, [filters.startAt, filters.endAt, reloadKey, Session?.id])

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

    // ====== HARD MAX (puncak maksimum selama date-range aktif)
    const hardMaxItemsRef = React.useRef(0)
    const hardMaxBatchesRef = React.useRef(0)

    // Nilai max berdasarkan data fetch TERKINI
    const computedMaxItems = React.useMemo(
        () => transaction.length ? Math.max(...transaction.map(totalItems)) : 0,
        [transaction]
    )
    const computedMaxBatches = React.useMemo(
        () => transaction.length ? Math.max(...transaction.map(totalBatches)) : 0,
        [transaction]
    )

    // Update puncak jika ada nilai lebih tinggi
    React.useEffect(() => {
        if (computedMaxItems > hardMaxItemsRef.current) hardMaxItemsRef.current = computedMaxItems
        if (computedMaxBatches > hardMaxBatchesRef.current) hardMaxBatchesRef.current = computedMaxBatches
    }, [computedMaxItems, computedMaxBatches])

    // Reset puncak saat ganti rentang tanggal
    React.useEffect(() => {
        hardMaxItemsRef.current = 0
        hardMaxBatchesRef.current = 0
    }, [filters.startAt, filters.endAt])

    // Nilai max untuk slider (pakai puncak)
    const maxItems = hardMaxItemsRef.current
    const maxBatches = hardMaxBatchesRef.current

    // a) token berubah → refetch tanpa ngapa-ngapain ke filter
    React.useEffect(() => {
        if (!token) return
        lastReasonRef.current = reason ?? null
        setFetchError(null)
    }, [token, reason, softRefetch])



    // b) kalau reason === 'batch' → set ujung slider ke puncak (bukan computed)
    React.useEffect(() => {
        if (lastReasonRef.current === 'batch') {
            const mi = Math.max(0, hardMaxItemsRef.current)
            const mb = Math.max(0, hardMaxBatchesRef.current)
            setFilters(prev => ({ ...prev, itemRange: [prev.itemRange[0], mi], batchRange: [prev.batchRange[0], mb] }))
            lastReasonRef.current = null
        }
    }, [computedMaxItems, computedMaxBatches])

    // Jaga range tetap valid thd data terbaru, TANPA menurunkan ujung kanan
    React.useEffect(() => {
        setFilters(prev => {
            const patch: Partial<Filters> = {}
            let changed = false
            const clamp = (v: number, max: number) => Math.min(Math.max(v, 0), Math.max(0, max))
            const maxI = hardMaxItemsRef.current
            const maxB = hardMaxBatchesRef.current

            const [i0, i1] = prev.itemRange
            if (i0 === 0 && i1 === 0) {
                patch.itemRange = [0, maxI]; changed = true
            } else {
                const ni0 = clamp(i0, maxI)
                const ni1 = i1 === 0 ? maxI : Math.max(i1, maxI) // ⬅️ jangan menurunkan ujung kanan
                if (ni0 !== i0 || ni1 !== i1) { patch.itemRange = [ni0, ni1]; changed = true }
            }

            const [b0, b1] = prev.batchRange
            if (b0 === 0 && b1 === 0) {
                patch.batchRange = [0, maxB]; changed = true
            } else {
                const nb0 = clamp(b0, maxB)
                const nb1 = b1 === 0 ? maxB : Math.max(b1, maxB) // ⬅️ jangan menurunkan ujung kanan
                if (nb0 !== b0 || nb1 !== b1) { patch.batchRange = [nb0, nb1]; changed = true }
            }

            return changed ? { ...prev, ...patch } : prev
        })
    }, [computedMaxItems, computedMaxBatches])

    // Urut terbaru
    const transactions = React.useMemo(
        () => [...transaction].sort((a, b) => new Date(b.time_created as string).getTime() - new Date(a.time_created as string).getTime()),
        [transaction]
    )

    // Apply filter kombo
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

    // ====== Selection Helpers ======
    const txById = React.useMemo(() => new Map(filtered.map(t => [t.id, t] as const)), [filtered])
    const selectedTxs = React.useMemo(
        () => Array.from(multiSelectedIds).map(id => txById.get(id)).filter(Boolean) as Transaction[],
        [multiSelectedIds, txById]
    )
    const hasClosed = React.useMemo(() => selectedTxs.some(t => Boolean(t.time_closed)), [selectedTxs])
    const selectedCount = multiSelectedIds.size

    // Sinkronisasi selection terhadap filtered TANPA remount right pane
    React.useEffect(() => {
        // bersihkan multi yang tak lagi ada di list, dan EXCLUDE yang sudah closed
        setMultiSelectedIds(prev => {
            const idsInList = new Set(filtered.filter(t => !t.time_closed).map(t => t.id))
            const cleaned = Array.from(prev).filter(id => idsInList.has(id))
            return cleaned.length === prev.size ? prev : new Set(cleaned)
        })

        // single: kalau item yang dipilih hilang baru reset; kalau masih ada, DIAM.
        if (singleSelectedId) {
            const stillExists = filtered.some(t => t.id === singleSelectedId)
            if (!stillExists) {
                setSingleSelectedId(undefined)
                setLayout(prev => ({ ...prev, right: <TransactionListItemNotFound /> }))
            }
        }
    }, [filtered, singleSelectedId, setLayout])

    React.useEffect(() => {
        softRefetch();
    }, [token, reason]);
    // Handler single select via row click (TOGGLE on second click)
    const onRowClick = (id: string) => {
        softRefetch();
        setSingleSelectedId(prev => {
            if (prev === id) {
                setLayout(p => ({ ...p, right: <TransactionListItemNotFound /> }))
                return undefined
            }
            setLayout(p => ({ ...p, right: <TransactionContainerItems id={id} transaction={transactions.find((data) => data.id === id)} /> }))
            // setLayout(p => ({ ...p, right: <TransactionContainer id={id} transaction={transactions.find((data) => data.id === id)}  /> }))
            return id
        })
    }

    React.useEffect(() => {
        setMenu((prev) => {
            return [
                ...prev,
                { key : "F2", label: `Order baru` }
            ]
        })
        return () => {
            remove("F2")
        }
    }, [])

    // Handler multi-select via checkbox ONLY (guard: cegah add jika closed)
    const onToggleMulti = (id: string, checked: boolean) =>
        setMultiSelectedIds(prev => {
            const tx = txById.get(id)
            if (!tx || tx.time_closed) return prev // hard guard
            const next = new Set(prev)
            checked ? next.add(id) : next.delete(id)
            return next
        })

    // Clear all multi-select
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

            {/* Multi-Select Header muncul HANYA saat ada pilihan (≥1) */}
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
                    // ===== Server error: tampilkan alert + tombol Coba lagi =====
                    <Box sx={{ display: 'grid', placeItems: 'center', height: '100%', p: 2 }}>
                        <Stack spacing={1.25} maxWidth={640} width="100%">
                            <Alert severity="error" variant="outlined">
                                <Typography variant="body2" sx={{ mb: 0.5, fontWeight: 700 }}>
                                    Gagal memuat data transaksi.
                                </Typography>
                                <Typography variant="body2">
                                    {fetchError}
                                </Typography>
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
                    // ===== Kosong karena filter: teks formal + tombol Coba lagi =====
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

            {/* Footer Actions — fokus: Order & Join */}
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
                    {/* pakai softRefetch biar tidak bikin remount */}
                    <NewOrderModal onCreated={softRefetch}  />
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
