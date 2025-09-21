// BillsListItem.tsx
'use client'

import * as React from 'react'
import {useMemo, useState, useLayoutEffect, useEffect} from 'react'
import { Box, Divider, List, Typography, TextField, InputAdornment, IconButton, Stack } from '@mui/material'
import PerfectScrollbar from 'react-perfect-scrollbar'
import 'react-perfect-scrollbar/dist/css/styles.css'
import dynamic from 'next/dynamic'

import SearchRounded from '@mui/icons-material/SearchRounded'
import ClearRounded from '@mui/icons-material/ClearRounded'
import { useLayoutManipulatorResizable } from '../../../../../../../../contexts/LayoutManipulatorResizableContext'
import BillListItemDetail from "./BillsListItemDetail";

// shimmer placeholder (opsional)
const Shimmer = () => (
    <Box sx={{ p: 2, color: 'text.secondary' }}>
        <Typography variant="body2">Memuat…</Typography>
    </Box>
)

// Row UI-only (menerima { bill, selected, onRowClick })
const BillsListItemRowModel1 = dynamic(() => import('./(components)/BillsListItemRowModel1'), {
    ssr: true,
    loading: () => <Shimmer />,
})

// Right pane kosong (UI only)
const BillsRightEmpty = dynamic(() => import('./(components)/BillsListItemNotFound'), {
    ssr: true,
    loading: () => <Shimmer />,
})

export type BillStub = {
    id: string
    invoice: string
    customer?: string
    ref?: string
    issuedAt?: string
    total?: string
    status?: 'paid' | 'unpaid' | 'partial'
}

const DUMMY_BILLS: BillStub[] = [
    { id: 'b1', invoice: 'INV-001234', customer: 'Andi',   ref: 'Meja A1', issuedAt: '2025-02-01T09:15:00+08:00', total: '125000', status: 'unpaid' },
    { id: 'b2', invoice: 'INV-001235', customer: 'Budi',   ref: 'Meja B3', issuedAt: '2025-02-01T09:25:00+08:00', total: '87000',  status: 'paid' },
    { id: 'b3', invoice: 'INV-001236', customer: 'Cici',   ref: 'Takeaway',issuedAt: '2025-02-01T09:40:00+08:00', total: '43000',  status: 'unpaid' },
    { id: 'b4', invoice: 'INV-001237', customer: 'Dewi',   ref: 'Meja C2', issuedAt: '2025-02-01T10:05:00+08:00', total: '156000', status: 'partial' },
    { id: 'b5', invoice: 'INV-001238', customer: 'Eko',    ref: 'Delivery',issuedAt: '2025-02-01T10:10:00+08:00', total: '99000',  status: 'unpaid' },
    { id: 'b6', invoice: 'INV-001239', customer: 'Farhan', ref: 'Meja D4', issuedAt: '2025-02-01T10:30:00+08:00', total: '212000', status: 'paid' },
]

const BillsListItem: React.FC = () => {
    const { setLayout } = useLayoutManipulatorResizable()

    const [query, setQuery] = useState('')
    const [activeId, setActiveId] = useState<string | null>(null)
    const [selectedBill, setSelectedBill] = useState<BillStub | null>(null) // ⬅️ simpan objek bill terpilih (dump-only)

    const filtered = useMemo(() => {
        const s = query.trim().toLowerCase()
        if (!s) return DUMMY_BILLS
        return DUMMY_BILLS.filter(b =>
            b.invoice.toLowerCase().includes(s) ||
            (b.customer ?? '').toLowerCase().includes(s) ||
            (b.ref ?? '').toLowerCase().includes(s)
        )
    }, [query])

    // Set right: Empty saat mount (biar langsung tampil)
    useLayoutEffect(() => {
        setLayout(prev => ({ ...(prev ?? {}), right: <BillsRightEmpty /> }))
    }, [setLayout])

    // Jika tidak ada yang terseleksi atau list kosong ⇒ tetap Empty
    useEffect(() => {
        if (activeId === null || filtered.length < 1) {
            setLayout(prev => ({ ...(prev ?? {}), right: <BillsRightEmpty /> }))
            setSelectedBill(null)
        }
    }, [activeId, filtered.length, setLayout])

    const handleSelect = (bill: BillStub) => {
        setActiveId(prev => {
            const next = prev === bill.id ? null : bill.id
            setLayout(p => ({ ...(p ?? {}), right: next ? <BillListItemDetail bill={bill} /> : <BillsRightEmpty /> }))
            return next
        })
    }

    const onSubmitSearch = (e: React.FormEvent) => e.preventDefault()
    const onClear = () => setQuery('')

    return (
        <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            {/* Header + Search (UI only) */}
            <Box sx={{ px: 1.5, py: 1, bgcolor: 'background.paper', borderBottom: '1px solid', borderColor: 'divider' }}>
                <Stack direction="row" spacing={1} alignItems="center">
                    <Box component="form" onSubmit={onSubmitSearch} sx={{ flex: 1, minWidth: 0 }}>
                        <TextField
                            fullWidth
                            size="small"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder="Cari invoice, customer, atau ref…"
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

            {/* Area list (scrollable) */}
            <Box sx={{ flex: 1, minHeight: 0, overflow: 'hidden' }}>
                <PerfectScrollbar options={{ suppressScrollX: true, wheelPropagation: false }}>
                    <List sx={{ py: 1, pr: 1 }}>
                        {filtered.map(b => (
                            <BillsListItemRowModel1
                                key={b.id}
                                bill={b}                               // ⬅️ kirim objek bill
                                selected={activeId === b.id}
                                onRowClick={() => handleSelect(b)}     // ⬅️ klik kirim bill ke handler
                            />
                        ))}

                        {filtered.length === 0 && (
                            <Box sx={{ px: 1.5, py: 2, color: 'text.secondary' }}>
                                <Typography variant="body2">
                                    Nggak ketemu nih. Coba ganti kata kunci-nya ✨
                                </Typography>
                            </Box>
                        )}
                    </List>
                </PerfectScrollbar>
            </Box>

            {/* Footer blank */}
            <Divider />
            <Box sx={{ px: 1.5, py: 1, bgcolor: 'background.paper', minHeight: 48 }} />
        </Box>
    )
}

export default React.memo(BillsListItem)
