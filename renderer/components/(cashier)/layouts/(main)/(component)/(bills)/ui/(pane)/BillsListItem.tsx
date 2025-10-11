// BillsListItem.tsx
'use client'

import * as React from 'react'
import { useMemo, useState, useLayoutEffect, useEffect } from 'react'
import {
    Box, Divider, List, Typography, TextField, InputAdornment, IconButton, Stack, Alert, CircularProgress
} from '@mui/material'
import PerfectScrollbar from 'react-perfect-scrollbar'
import 'react-perfect-scrollbar/dist/css/styles.css'
import dynamic from 'next/dynamic'

import SearchRounded from '@mui/icons-material/SearchRounded'
import ClearRounded from '@mui/icons-material/ClearRounded'

import { useLayoutManipulatorResizable } from '../../../../../../../../contexts/LayoutManipulatorResizableContext'
import BillListItemDetail from './BillsListItemDetail'
import { ApiResponseTransactionBill, TransactionBill, TransactionBills } from '../../types/transaction.bill.type'
import { useTabNavigationHandlerContext } from '../../../(transaction)/context/TabNavigationHandlerContext'
import ShimmerLoading from '../../../../../../../(shared)/(loading)/ShimmerLoading'
import { useGodModeProvider } from '../../../../../../context/GodModeProviderContext'

/* ====== Dynamic chunks ====== */
const Shimmer = () => (
    <Box sx={{ p: 2, color: 'text.secondary' }}>
        <Typography variant="body2">Memuat…</Typography>
    </Box>
)

const BillsListItemRowModel1 = dynamic(() => import('./(components)/BillsListItemRowModel1'), {
    ssr: true,
    loading: () => <Shimmer />,
})

const BillsRightEmpty = dynamic(() => import('./(components)/BillsListItemNotFound'), {
    ssr: true,
    loading: () => <Shimmer />,
})

const BillListItemHeaderWidget = dynamic(() => import('./widgets/BillListItemHeaderWidget'), {
    loading: () => <ShimmerLoading />, ssr: false,
})

/* ====== Types sinkron dengan widget ====== */
export type BillFilters = {
    startAt: string
    endAt: string
    paid: 'all' | 'paid' | 'unpaid'
    cashierName: string     // 'all' artinya semua
    totalRange: number[]    // [min, max] IDR
}

/* ====== Utils ====== */
const nameJoin = (n?: { first_name?: string; last_name?: string }) =>
    [n?.first_name, n?.last_name].filter(Boolean).join(' ').trim()

/** drop semua key "password" di nested object */
const stripSecrets = <T,>(obj: T): T => JSON.parse(JSON.stringify(obj, (k, v) => (k === 'password' ? undefined : v)))

const isPaidExtractor = (b: TransactionBill): boolean => {
    const anyB = b as any
    return (
        anyB?.paid?.status ??
        anyB?.status?.paid ??
        anyB?.is_paid ??
        anyB?.paid ??
        anyB?.transaction?.is_paid ??
        anyB?.transaction?.status?.paid ??
        false
    ) as boolean
}

const getCashierName = (b: TransactionBill) =>
    nameJoin(b.reference?.name) || b.reference?.username || '—'

const getTotal = (b: TransactionBill): number => {
    const anyB = b as any
    if (typeof anyB?.total === 'number') return anyB.total
    if (typeof anyB?.total === 'string') return Number(anyB.total) || 0
    const items = Array.isArray(b.items) ? b.items : []
    return items.map(i => Number((i as any)?.sub_total || 0)).reduce((a, c) => a + c, 0)
}

/** pastikan start <= end; kembalikan ISO UTC */
const normalizeRangeToIsoUtc = (startAt?: string, endAt?: string) => {
    const s = startAt ? new Date(startAt) : undefined
    const e = endAt   ? new Date(endAt)   : undefined
    if (!s && !e) return [undefined, undefined] as const
    let sMs = s ? s.getTime() : Number.NEGATIVE_INFINITY
    let eMs = e ? e.getTime() : Number.POSITIVE_INFINITY
    if (sMs > eMs) [sMs, eMs] = [eMs, sMs] // swap kalau kebalik
    return [
        isFinite(sMs) ? new Date(sMs).toISOString() : undefined,
        isFinite(eMs) ? new Date(eMs).toISOString() : undefined
    ] as const
}

/** in-range untuk ISO apa pun (server bisa balikin UTC) */
const inDateRange = (iso?: string, startIso?: string, endIso?: string) => {
    if (!startIso && !endIso) return true
    if (!iso) return false
    const t  = new Date(iso).getTime()
    const s  = startIso ? new Date(startIso).getTime() : Number.NEGATIVE_INFINITY
    const e  = endIso   ? new Date(endIso).getTime()   : Number.POSITIVE_INFINITY
    const [minT, maxT] = s > e ? [e, s] : [s, e]
    return t >= minT && t <= maxT
}

const buildPayload = (q: string, f: BillFilters, godMode: boolean) => {
    const [startIso, endIso] = normalizeRangeToIsoUtc(f.startAt, f.endAt)

    // total range: kirim hanya kalau bukan [0,0]
    let minTotal: number | undefined
    let maxTotal: number | undefined
    if (Array.isArray(f.totalRange) && (f.totalRange[0] !== 0 || f.totalRange[1] !== 0)) {
        const a = Number(f.totalRange[0] ?? 0)
        const b = Number(f.totalRange[1] ?? 0)
        minTotal = Math.min(a, b)
        maxTotal = Math.max(a, b)
    }

    return {
        query: q || undefined,
        offset: 0,
        sort: { time_created: 'desc' as const },
        startAt: startIso,
        endAt: endIso,
        god_mode: godMode,
        isPaid: f.paid === 'all' ? undefined : f.paid === 'paid',
        cashierName: f.cashierName === 'all' ? undefined : f.cashierName,
        minTotal,
        maxTotal,
    }
}

const toKey = (o: unknown) => {
    try { return JSON.stringify(o) } catch { return String(o) }
}

/* ====== Component ====== */
const BillsListItem: React.FC = () => {
    const { setLayout } = useLayoutManipulatorResizable()
    const { state } = useTabNavigationHandlerContext()
    const { godMode } = useGodModeProvider()

    const [query, setQuery] = useState('')
    const [activeId, setActiveId] = useState<string | null>(null)
    const [reloadKey, setReloadKey] = useState(1)

    // filters default kosong — HeaderWidget yang akan hydrate/persist-in
    const [filters, setFilters] = useState<BillFilters>({
        startAt: '',
        endAt: '',
        paid: 'all',
        cashierName: 'all',
        totalRange: [0, 0],
    })

    const [bills, setBills] = useState<TransactionBill[]>([])
    const [isFetching, setIsFetching] = useState(false)
    const [fetchError, setFetchError] = useState<string | null>(null)

    // NEW: tunggu sampai widget menyatakan “hydrated”, baru boleh fetch
    const [filtersReady, setFiltersReady] = useState(false)

    const payload = useMemo(() => buildPayload(query, filters, godMode), [query, filters, godMode])
    const lastKeyRef = React.useRef<string>('')

    // Right pane default
    useLayoutEffect(() => {
        setLayout(prev => ({ ...(prev ?? {}), right: <BillsRightEmpty /> }))
    }, [setLayout])

    // Ambil data — dedup by payload key + debounce — skip sebelum filtersReady
    useEffect(() => {
        if (!filtersReady) return
        if (!window?.api?.invoke) {
            setFetchError('IPC bridge tidak tersedia (window.api.invoke). Pastikan preload expose API.')
            setBills([])
            return
        }

        const key = toKey(payload)
        if (key === lastKeyRef.current) return
        lastKeyRef.current = key

        let alive = true
        setIsFetching(true)
        setFetchError(null)

        const t = setTimeout(() => {
            window.api.invoke('api.transaction.bills:read.all', payload)
                .then((result: ApiResponseTransactionBill | { data: TransactionBills } | undefined) => {
                    const arr = Array.isArray((result as ApiResponseTransactionBill)?.data)
                        ? (result as ApiResponseTransactionBill).data
                        : (result as any)?.data
                    return alive ? (arr ?? []) : []
                })
                .then(arr => arr.map(stripSecrets))
                .then(arr => alive ? setBills(arr) : undefined)
                .then(() => alive ? setFetchError(null) : undefined)
                .catch(err => {
                    alive && setBills([])
                    alive && setFetchError(typeof err?.message === 'string' ? err.message : 'Gagal memuat data')
                })
                .finally(() => alive && setIsFetching(false))
        }, 50)

        return () => { alive = false; clearTimeout(t) }
    }, [payload, filtersReady])

    // Auto-select dari TabNavigationHandlerContext
    useEffect(() => {
        if (state.id !== undefined) {
            const billSelect = bills.find((bill) => bill.id.match(state.id))
            if (billSelect !== undefined) handleSelect(billSelect)
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [state, bills])

    // Derive opsi kasir & max total (berdasarkan data saat ini)
    const cashierOptions = useMemo(() => {
        const set = new Set<string>()
        bills.forEach(b => set.add(getCashierName(b)))
        return Array.from(set).filter(Boolean).sort((a, b) => a.localeCompare(b))
    }, [bills])

    const maxTotal = useMemo(() => {
        const totals = bills.map(getTotal)
        return totals.length ? Math.max(...totals) : 0
    }, [bills])

    // Normalized start/end untuk filter client-side (ISO UTC)
    const [normStartIso, normEndIso] = useMemo(
        () => normalizeRangeToIsoUtc(filters.startAt, filters.endAt),
        [filters.startAt, filters.endAt]
    )

    // Client-side filter
    const filtered = useMemo(() => {
        const s = query.trim().toLowerCase()
        const hit = (v?: string) => (s ? v?.toLowerCase().includes(s) : true)

        return bills.filter(b => {
            const bySearch =
                (!s) ||
                hit(String(b.bill ?? '')) ||
                hit(getCashierName(b)) ||
                hit(b.transaction?.table?.name || b.transaction?.table?.code || '') ||
                hit(b.transaction?.order_type?.name ?? '') ||
                hit(b.transaction?.order_type?.code ?? '') ||
                hit(b.branch?.[0]?.name ?? '')

            const byDate = inDateRange(b.transaction?.time_created, normStartIso, normEndIso)

            const paidFlag = isPaidExtractor(b)
            const byPaid =
                !filters.paid || filters.paid === 'all'
                    ? true
                    : (filters.paid === 'paid' ? paidFlag === true : paidFlag === false)

            const cashier = getCashierName(b)
            const byCashier = filters.cashierName === 'all' ? true : cashier === filters.cashierName

            const total = getTotal(b)
            const [minT, maxT] = Array.isArray(filters.totalRange) ? filters.totalRange : [0, Number.POSITIVE_INFINITY]
            const byTotal = (() => {
                const tr = Array.isArray(filters.totalRange) ? filters.totalRange : [0, 0]
                const a = Number(tr[0] ?? 0)
                const b = Number(tr[1] ?? 0)
                // Matikan filter jika [0,0]
                if (a === 0 && b === 0) return true
                const minT = Math.min(a, b)
                const maxT = Math.max(a, b)
                return total >= minT && total <= maxT
            })()

            return bySearch && byDate && byPaid && byCashier && byTotal
        })
    }, [bills, query, filters.paid, filters.cashierName, filters.totalRange, normStartIso, normEndIso])

    // Reset right pane saat list kosong / tak ada pilihan
    useEffect(() => {
        if (activeId === null || filtered.length < 1) {
            setLayout(prev => ({ ...(prev ?? {}), right: <BillsRightEmpty /> }))
        }
    }, [activeId, filtered.length, setLayout])

    useEffect(() => {
        console.log(filtered);
    },[filtered])

    const handleSelect = (bill: TransactionBill) => {
        setActiveId(prev => {
            const next = prev === bill.id ? null : bill.id
            setLayout(p => ({ ...(p ?? {}), right: next ?
                    <BillListItemDetail
                        billId={bill.id}
                        onPaySuccess={() => setReloadKey(k => k + 1)}
                    /> :
                    <BillsRightEmpty /> }))
            return next
        })
    }

    const onSubmitSearch = (e: React.FormEvent) => e.preventDefault()
    const onClear = () => setQuery('')

    return (
        <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            {/* Header + Search */}
            <Box sx={{ px: 1.5, py: 1, bgcolor: 'background.paper', borderBottom: '1px solid', borderColor: 'divider' }}>
                <Stack direction="row" spacing={1} alignItems="center">
                    <Box component="form" onSubmit={onSubmitSearch} sx={{ flex: 1, minWidth: 0 }}>
                        <TextField
                            fullWidth
                            size="small"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder="Cari invoice, kasir, meja, atau order type…"
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <SearchRounded fontSize="small" />
                                    </InputAdornment>
                                ),
                                endAdornment: query ? (
                                    <InputAdornment position="end">
                                        <IconButton size="small" onClick={onClear} aria-label="Bersihkan pencarian">
                                            <ClearRounded fontSize="small" />
                                        </IconButton>
                                    </InputAdornment>
                                ) : null,
                            }}
                        />
                    </Box>

                    {/* Filter popover */}
                    <BillListItemHeaderWidget
                        value={filters}
                        onChange={(patch) => setFilters(prev => ({ ...prev, ...patch }))}
                        cashierOptions={cashierOptions}
                        maxTotal={maxTotal}
                        filteredCount={filtered.length}
                        onHydrated={() => setFiltersReady(true)} // <<< NEW
                    />
                </Stack>
            </Box>

            {/* Alerts */}
            {fetchError && (
                <Box sx={{ px: 1.5, py: 1 }}>
                    <Alert severity="error">{fetchError}</Alert>
                </Box>
            )}

            {/* Area list */}
            <Box sx={{ flex: 1, minHeight: 0, overflow: 'hidden' }}>
                {isFetching ? (
                    <Stack alignItems="center" justifyContent="center" sx={{ height: '100%' }}>
                        <CircularProgress size={24} />
                        <Typography variant="caption" sx={{ mt: 1 }}>Mengambil data…</Typography>
                    </Stack>
                ) : (
                    <PerfectScrollbar options={{ suppressScrollX: true, wheelPropagation: false }}>
                        <List sx={{ py: 1, pr: 1 }}>
                            {filtered.map(b => (
                                <BillsListItemRowModel1
                                    key={b.id}
                                    bill={b}
                                    selected={activeId === b.id}
                                    onRowClick={() => handleSelect(b)}
                                />
                            ))}

                            {filtered.length === 0 && !isFetching && !fetchError && (
                                <Box sx={{ px: 1.5, py: 2, color: 'text.secondary' }}>
                                    <Typography variant="body2">Nggak ketemu nih. Coba ubah filter atau kata kunci ✨</Typography>
                                </Box>
                            )}
                        </List>
                    </PerfectScrollbar>
                )}
            </Box>

            <Divider />
            <Box sx={{ px: 1.5, py: 1, bgcolor: 'background.paper', minHeight: 48 }} />
        </Box>
    )
}

export default React.memo(BillsListItem)
