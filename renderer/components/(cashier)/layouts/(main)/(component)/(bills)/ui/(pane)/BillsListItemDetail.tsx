// (components)/BillListItemDetail.tsx
'use client'

import * as React from 'react'
import {
    Box, Paper, Stack, Typography, Chip, Divider, IconButton, Button,
} from '@mui/material'
import PrintRounded from '@mui/icons-material/PrintRounded'
import MoreVertRounded from '@mui/icons-material/MoreVertRounded'
import RequestQuoteRounded from '@mui/icons-material/RequestQuoteRounded'
import LocalMallRounded from '@mui/icons-material/LocalMallRounded'
import PerfectScrollbar from 'react-perfect-scrollbar'
import 'react-perfect-scrollbar/dist/css/styles.css'

export type BillDetailStub = {
    id: string
    invoice: string
    status?: 'paid' | 'unpaid' | 'partial'
    issuedAt?: string
    ref?: string
    total?: number | string
    items?: Array<{ id: string | number; name: string; qty: number; price?: number; note?: string }>
}

type Props = { bill: BillDetailStub }

const fmtIDR = (n?: number | string) =>
    typeof n === 'number' || (typeof n === 'string' && n !== '')
        ? new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(Number(n))
        : 'Rp —'

const statusChip = (s?: BillDetailStub['status']) => {
    switch (s) {
        case 'paid':    return { color: 'success' as const, label: 'Paid' }
        case 'partial': return { color: 'info' as const,    label: 'Partial' }
        default:        return { color: 'warning' as const, label: 'Unpaid' }
    }
}

const BillListItemDetail: React.FC<Props> = ({ bill }) => {
    const st = statusChip(bill.status)
    const items = bill.items ?? [
        { id: 1, name: 'Item contoh A', qty: 2, price: 25000, note: 'tanpa pedas' },
        { id: 2, name: 'Item contoh B', qty: 1, price: 18000 },
        { id: 3, name: 'Item contoh C', qty: 3, price: 12000 },
        { id: 1, name: 'Item contoh A', qty: 2, price: 25000, note: 'tanpa pedas' },
        { id: 2, name: 'Item contoh B', qty: 1, price: 18000 },
        { id: 3, name: 'Item contoh C', qty: 3, price: 12000 },
        { id: 1, name: 'Item contoh A', qty: 2, price: 25000, note: 'tanpa pedas' },
        { id: 2, name: 'Item contoh B', qty: 1, price: 18000 },
        { id: 3, name: 'Item contoh C', qty: 3, price: 12000 },
        { id: 1, name: 'Item contoh A', qty: 2, price: 25000, note: 'tanpa pedas' },
        { id: 2, name: 'Item contoh B', qty: 1, price: 18000 },
        { id: 3, name: 'Item contoh C', qty: 3, price: 12000 },
        { id: 1, name: 'Item contoh A', qty: 2, price: 25000, note: 'tanpa pedas' },
        { id: 2, name: 'Item contoh B', qty: 1, price: 18000 },
        { id: 3, name: 'Item contoh C', qty: 3, price: 12000 },
        { id: 1, name: 'Item contoh A', qty: 2, price: 25000, note: 'tanpa pedas' },
        { id: 2, name: 'Item contoh B', qty: 1, price: 18000 },
        { id: 3, name: 'Item contoh C', qty: 3, price: 12000 },
        { id: 1, name: 'Item contoh A', qty: 2, price: 25000, note: 'tanpa pedas' },
        { id: 2, name: 'Item contoh B', qty: 1, price: 18000 },
        { id: 3, name: 'Item contoh C', qty: 3, price: 12000 },
        { id: 1, name: 'Item contoh A', qty: 2, price: 25000, note: 'tanpa pedas' },
        { id: 2, name: 'Item contoh B', qty: 1, price: 18000 },
        { id: 3, name: 'Item contoh C', qty: 3, price: 12000 },
        { id: 1, name: 'Item contoh A', qty: 2, price: 25000, note: 'tanpa pedas' },
        { id: 2, name: 'Item contoh B', qty: 1, price: 18000 },
        { id: 3, name: 'Item contoh C', qty: 3, price: 12000 },
        { id: 1, name: 'Item contoh A', qty: 2, price: 25000, note: 'tanpa pedas' },
        { id: 2, name: 'Item contoh B', qty: 1, price: 18000 },
        { id: 3, name: 'Item contoh C', qty: 3, price: 12000 },
    ]

    const subtotal = items.reduce((a, it) => a + (it.price ?? 0) * it.qty, 0)
    const total = subtotal
    const grandTotal = bill.total ?? total

    const payDisabled = bill.status === 'paid'

    return (
        <Box sx={{ height: '100%', width: '100%' }}>
            <Paper
                elevation={0}
                sx={{
                    height: '100%',
                    width: '100%',
                    border: '1px solid', borderColor: 'divider',
                    bgcolor: 'background.paper',
                    borderRadius: 0,
                    display: 'flex', flexDirection: 'column',
                }}
            >
                {/* ===== Header (fixed top) ===== */}
                <Box sx={{ p: { xs: 2, md: 2.5 }, borderBottom: '1px solid', borderColor: 'divider', flexShrink: 0 }}>
                    <Stack direction="row" justifyContent="space-between" alignItems="flex-start" gap={1.5}>
                        <Stack spacing={0.75} minWidth={0}>
                            <Stack direction="row" spacing={1.25} alignItems="center" minWidth={0}>
                                <RequestQuoteRounded sx={{ fontSize: { xs: 18, md: 20 } }} />
                                <Typography variant="h5" fontWeight={900} noWrap sx={{ letterSpacing: 0.2 }}>
                                    #{' '}{bill.invoice}
                                </Typography>
                                <Chip size="small" color={st.color} label={st.label} sx={{ borderRadius: 0, fontSize: { xs: 12, md: 13 } }} />
                            </Stack>
                            <Typography variant="body1" color="text.secondary">Issued — {bill.issuedAt ?? '—'}</Typography>
                            <Typography variant="body1" color="text.secondary">Ref — {bill.ref ?? '—'}</Typography>
                        </Stack>

                        <Stack direction="row" spacing={1}>
                            <IconButton aria-label="Opsi" size="large"><MoreVertRounded /></IconButton>
                            <IconButton aria-label="Cetak" size="large"><PrintRounded /></IconButton>
                        </Stack>
                    </Stack>
                </Box>

                {/* ===== Items (scroll only this area) ===== */}
                <Box sx={{ flex: 1, minHeight: 0 }}>
                    <PerfectScrollbar options={{ suppressScrollX: true, wheelPropagation: false }}>
                        <Box sx={{ p: { xs: 2, md: 2.5 } }}>
                            <Stack direction="row" alignItems="center" spacing={1.25} sx={{ mb: 1.25 }}>
                                <LocalMallRounded sx={{ fontSize: { xs: 18, md: 20 } }} />
                                <Typography variant="subtitle1" fontWeight={800}>Ringkasan Item</Typography>
                            </Stack>

                            {/* Header row (ikut scroll) */}
                            <Box
                                sx={{
                                    display: 'grid',
                                    gridTemplateColumns: '1fr 112px 180px',
                                    gap: 1.25,
                                    px: 1.25, py: 1,
                                    bgcolor: 'action.hover',
                                    border: '1px solid', borderColor: 'divider',
                                }}
                            >
                                <Typography variant="body2" fontWeight={800}>Item</Typography>
                                <Typography variant="body2" fontWeight={800} textAlign="right">Qty</Typography>
                                <Typography variant="body2" fontWeight={800} textAlign="right">Subtotal</Typography>
                            </Box>

                            {/* Rows */}
                            <Stack spacing={0}>
                                {items.map((it) => (
                                    <Box
                                        key={it.id}
                                        sx={{
                                            display: 'grid',
                                            gridTemplateColumns: '1fr 112px 180px',
                                            gap: 1.25,
                                            px: 1.25, py: 1.1,
                                            borderLeft: '1px solid', borderRight: '1px solid', borderBottom: '1px solid',
                                            borderColor: 'divider',
                                        }}
                                    >
                                        <Box sx={{ minWidth: 0 }}>
                                            <Typography variant="body1" fontWeight={700} noWrap>{it.name}</Typography>
                                            {it.note && (
                                                <Typography variant="body2" color="text.secondary" noWrap>{it.note}</Typography>
                                            )}
                                        </Box>
                                        <Typography variant="body1" textAlign="right">{it.qty}</Typography>
                                        <Typography variant="body1" textAlign="right">{fmtIDR((it.price ?? 0) * it.qty)}</Typography>
                                    </Box>
                                ))}
                            </Stack>
                        </Box>
                    </PerfectScrollbar>
                </Box>

                {/* ===== Totals (sticky bottom, di luar scroller) ===== */}
                <Box
                    sx={{
                        px: 2.5, py: 1.5,
                        borderTop: '1px solid', borderColor: 'divider',
                        flexShrink: 0,
                    }}
                >
                    <Stack spacing={0.75} alignItems="flex-end">
                        <Stack direction="row" spacing={2} alignItems="center" sx={{ width: 420, maxWidth: '100%' }}>
                            <Typography variant="body1" color="text.secondary" sx={{ flex: 1 }}>Subtotal</Typography>
                            <Typography variant="body1" fontWeight={700}>{fmtIDR(subtotal)}</Typography>
                        </Stack>
                        <Divider flexItem sx={{ my: 0.75 }} />
                        <Stack direction="row" spacing={2} alignItems="center" sx={{ width: 420, maxWidth: '100%' }}>
                            <Typography variant="h6" sx={{ flex: 1 }} fontWeight={900}>Total</Typography>
                            <Typography variant="h5" fontWeight={900}>{fmtIDR(total)}</Typography>
                        </Stack>
                        <Stack direction="row" spacing={2} alignItems="center" sx={{ width: 420, maxWidth: '100%' }}>
                            <Typography variant="h6" sx={{ flex: 1 }} fontWeight={900}>Grand Total</Typography>
                            <Typography variant="h4" fontWeight={900}>{fmtIDR(grandTotal)}</Typography>
                        </Stack>
                    </Stack>
                </Box>

                {/* ===== Footer actions (fixed bottom) ===== */}
                <Box
                    sx={{
                        p: { xs: 2, md: 2.5 },
                        borderTop: '1px solid', borderColor: 'divider',
                        display: 'flex', gap: 1.25, justifyContent: 'flex-end',
                        flexShrink: 0,
                    }}
                >
                    <Button
                        variant="contained"
                        disabled={payDisabled}
                        sx={{ textTransform: 'none', fontWeight: 800, borderRadius: 0, fontSize: { xs: 14, md: 15 } }}
                    >
                        Bayar
                    </Button>
                    <Button
                        variant="outlined"
                        startIcon={<PrintRounded />}
                        sx={{ textTransform: 'none', fontWeight: 800, borderRadius: 0, fontSize: { xs: 14, md: 15 } }}
                    >
                        Cetak
                    </Button>
                </Box>
            </Paper>
        </Box>
    )
}

export default React.memo(BillListItemDetail)
