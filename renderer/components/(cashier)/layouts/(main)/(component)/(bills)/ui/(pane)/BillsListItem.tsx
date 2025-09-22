// BillsListItem.tsx
'use client'

import * as React from 'react'
import { useMemo, useState, useLayoutEffect, useEffect } from 'react'
import { Box, Divider, List, Typography, TextField, InputAdornment, IconButton, Stack, Alert, CircularProgress } from '@mui/material'
import PerfectScrollbar from 'react-perfect-scrollbar'
import 'react-perfect-scrollbar/dist/css/styles.css'
import dynamic from 'next/dynamic'

import SearchRounded from '@mui/icons-material/SearchRounded'
import ClearRounded from '@mui/icons-material/ClearRounded'
import { useLayoutManipulatorResizable } from '../../../../../../../../contexts/LayoutManipulatorResizableContext'
import BillListItemDetail from './BillsListItemDetail'

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

/* =========================
   ===== Types (API) =======
   ========================= */
type ISO8601 = string
type Money = string

type ApiName = { last_name?: string; first_name?: string }
type ApiReference = {
    id: string
    name?: ApiName
    username?: string
    password?: string | null
    time_created?: ISO8601
    time_updated?: ISO8601
}

type ApiPrinter = {
    id: string
    name: string
    description?: string | null
    options?: { mode?: string; port?: number; timeout?: number; ip_address?: string }
    time_created?: ISO8601
    time_updated?: ISO8601
    status?: boolean
}

type ApiCategory = {
    id: string
    name: string
    description?: string
    time_created?: ISO8601
    time_updated?: ISO8601
    status?: boolean
    printer?: ApiPrinter[]
}

type ApiProduct = {
    id: string
    name: string
    description?: string
    image?: string
    time_created?: ISO8601
    time_updated?: ISO8601
    status?: boolean
    category?: ApiCategory[]
}

type ApiVariant = {
    id: string
    code?: string
    name?: string
    description?: string
    price?: Money
    time_created?: ISO8601
    time_updated?: ISO8601
}

type ApiBatchItem = {
    id: string
    qty: number
    price: Money
    sub_total: Money
    note?: string | null
    time_created?: ISO8601
    time_updated?: ISO8601
    void?: unknown | null
    reference?: ApiReference
    product?: ApiProduct
    variant?: ApiVariant
}

type ApiBatch = {
    id: string
    batch: number
    note?: string | null
    time_created?: ISO8601
    time_updated?: ISO8601
    reference?: ApiReference | null
    items?: ApiBatchItem[]
}

type ApiFloor = {
    id: string
    code?: string
    name?: string
    status?: boolean
    time_created?: ISO8601
    time_updated?: ISO8601
    reference?: ApiReference
}

type ApiTable = {
    id: string
    code?: string
    name?: string
    shape?: string
    capacity?: number
    coordinate?: { x?: number; y?: number }
    dimension?: { width?: number; height?: number; rotate?: number }
    state?: string
    status?: boolean
    time_created?: ISO8601
    time_updated?: ISO8601
    reference?: ApiReference
    floor?: ApiFloor
}

type ApiOrderType = {
    id: string
    code?: string
    name?: string
    icon?: string
    description?: string
    status?: boolean
    time_created?: ISO8601
    time_updated?: ISO8601
    reference?: ApiReference
}

type ApiShift = {
    id: string
    name?: string
    start_time?: string
    end_time?: string
    status?: boolean
    time_created?: ISO8601
    time_updated?: ISO8601
    reference?: ApiReference
}

type ApiBranch = {
    id: string
    name: string
    address?: string
    phone?: string
    email?: string
    website?: string | null
    time_created?: ISO8601
    time_updated?: ISO8601
    reference?: ApiReference
}

type ApiTransactionInfo = {
    id: string
    invoice?: string
    time_created?: ISO8601
    time_updated?: ISO8601
    time_closed?: ISO8601
    reference?: ApiReference
    branch?: ApiBranch[]
}

type ApiPaymentMethod = {
    id: string
    icon?: string
    name?: string
    description?: string
    time_created?: ISO8601
    time_updated?: ISO8601
    status?: boolean
    reference?: ApiReference
}

type ApiLineItem = {
    id: string
    qty: number
    price: Money
    sub_total: Money
    time_created?: ISO8601
    time_updated?: ISO8601
}

export type ApiBill = {
    id: string
    number: number
    total: Money
    paid?: { time?: ISO8601; status?: boolean }
    time_created?: ISO8601
    time_updated?: ISO8601
    reference?: ApiReference
    branch?: ApiBranch[]
    transaction?: ApiTransactionInfo
    shift?: ApiShift
    order_type?: ApiOrderType
    table?: ApiTable
    batches?: ApiBatch[]
    payment_method?: ApiPaymentMethod
    items?: ApiLineItem[]
}

type ApiResponse = { status: boolean; code: number; msg: string; data: ApiBill[] }

/* ============ Utils ============ */
const nameJoin = (n?: ApiName) => [n?.first_name, n?.last_name].filter(Boolean).join(' ').trim()

/** drop semua key "password" di nested object */
const stripSecrets = <T,>(obj: T): T => JSON.parse(JSON.stringify(obj, (k, v) => (k === 'password' ? undefined : v)))

const buildPayload = (q: string) => ({
    query: q || undefined,         // aktifkan server-side search jika mau
    limit: 100,
    offset: 0,
    sort: { time_created: 'desc' as const },
})

/* ============ Component ============ */
const BillsListItem: React.FC = () => {
    const { setLayout } = useLayoutManipulatorResizable()

    const [query, setQuery] = useState('')
    const [activeId, setActiveId] = useState<string | null>(null)

    const [bills, setBills] = useState<ApiBill[]>([])
    const [isFetching, setIsFetching] = useState(false)
    const [fetchError, setFetchError] = useState<string | null>(null)

    // Right pane default
    useLayoutEffect(() => {
        setLayout(prev => ({ ...(prev ?? {}), right: <BillsRightEmpty /> }))
    }, [setLayout])

    // === INVOKE IPC (tanpa fetch) ===
    useEffect(() => {
        if (!window?.api?.invoke) {
            setFetchError('IPC bridge tidak tersedia (window.api.invoke). Pastikan preload expose API.')
            setBills([])
            return
        }

        const payload = buildPayload(query)
        let alive = true
        setIsFetching(true)
        setFetchError(null)

        window.api.invoke('api.transaction.bills:read.all', payload)
            .then((result: ApiResponse | { data: ApiBill[] } | undefined) => {
                const arr = Array.isArray((result as ApiResponse)?.data) ? (result as ApiResponse).data : (result as any)?.data
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

        return () => { alive = false }
    }, [query]) // ← kalau gak mau server-side search, ganti ke [].

    // Client-side filter (biar tetap responsif kalau server belum support search)
    const filtered = useMemo(() => {
        const s = query.trim().toLowerCase()
        if (!s) return bills
        const hit = (v?: string) => v?.toLowerCase().includes(s)
        return bills.filter(b =>
            hit(b.transaction?.invoice ?? '') ||
            hit(nameJoin(b.reference?.name)) ||
            hit(b.reference?.username ?? '') ||
            hit(b.table?.name || b.table?.code || '') ||
            hit(b.order_type?.name ?? '') ||
            hit(b.order_type?.code ?? '') ||
            hit(b.branch?.[0]?.name ?? '') ||
            hit(String(b.number ?? ''))
        )
    }, [query, bills])

    useEffect(() => {
        if (activeId === null || filtered.length < 1) {
            setLayout(prev => ({ ...(prev ?? {}), right: <BillsRightEmpty /> }))
        }
    }, [activeId, filtered.length, setLayout])

    const handleSelect = (bill: ApiBill) => {
        setActiveId(prev => {
            const next = prev === bill.id ? null : bill.id
            setLayout(p => ({ ...(p ?? {}), right: next ? <BillListItemDetail bill={bill as any} /> : <BillsRightEmpty /> }))
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
                                    bill={b}                          // ← langsung objek dari server (post-sanitize)
                                    selected={activeId === b.id}      // ← id server
                                    onRowClick={() => handleSelect(b)}
                                />
                            ))}

                            {filtered.length === 0 && !isFetching && !fetchError && (
                                <Box sx={{ px: 1.5, py: 2, color: 'text.secondary' }}>
                                    <Typography variant="body2">Nggak ketemu nih. Coba ganti kata kunci-nya ✨</Typography>
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
