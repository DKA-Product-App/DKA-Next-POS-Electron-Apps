// (components)/BillsListItemRowModel1.tsx
'use client'

import * as React from 'react'
import { ListItemButton, Stack, Typography, Chip, Box } from '@mui/material'
import { alpha } from '@mui/material/styles'
import ReceiptLongRounded from '@mui/icons-material/ReceiptLongRounded'
import LocalMallRounded from '@mui/icons-material/LocalMallRounded'
import LayersRounded from '@mui/icons-material/LayersRounded'
import AccessTimeRounded from '@mui/icons-material/AccessTimeRounded'
import ScheduleRounded from '@mui/icons-material/ScheduleRounded'
import {useMemo} from "react";
import {TransactionBill} from "../../../../../../../../../types/transaction/bill/transaction.bill.type";
import moment from "moment-timezone";
import "moment/locale/id"
moment.locale('id')
type Props = {
    bill: TransactionBill
    selected?: boolean
    onRowClick?: () => void
}

const toIDR = (money?: string) =>
    money ? new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(Number(money)) : 'Rp 0'

const nameJoin = (n?: { first_name?: string; last_name?: string }) =>
    [n?.first_name, n?.last_name].filter(Boolean).join(' ').trim()

const sum = (arr: number[]) => arr.reduce((a, b) => a + b, 0)
const fmtTime = (iso?: string) => iso ? new Date(iso).toLocaleString('id-ID', { hour: '2-digit', minute: '2-digit' }) : '-'

const BillsListItemRowModel1: React.FC<Props> = ({ bill, selected, onRowClick }) => {
    // ====== derive semua dari bill ======
    const invoice = String(bill.bill ?? '')
    const cashier = nameJoin(bill.reference?.name) || bill.reference?.username || '—'

    // order type, shift, meja
    const orderLabel = bill.transaction?.order_type?.name || bill.transaction?.order_type?.code || '—'
    const shiftLabel = bill.transaction?.shift?.name
        ? bill.transaction?.shift?.name
        : '—'
    const tableLabel = bill.transaction?.table?.name || bill.transaction?.table?.code || '—'

    // status: unpaid kalau paid undefined; kalau ada pakai paid.status
    const isPaid = bill.paid ? !!bill.paid.status : false
    const statusLabel: 'paid' | 'unpaid' = isPaid ? 'paid' : 'unpaid'
    const chipColor = isPaid ? 'success' : 'error'

    // waktu tampil: prioritas paid.time; fallback time_created/transaction/time item
    const paidAt = moment(bill.paid?.time_updated).format("HH:mm dddd, DD-MM-YYYY")
    const issuedAt = moment(bill.time_created).format("HH:mm dddd, DD-MM-YYYY")
    const displayTime = paidAt ?? issuedAt

    const subTotal = sum(bill.items.map(i => Number(i.sub_total)));
    const taxRate = 0.10
    const tax = useMemo(() => Math.max(0, Math.round(subTotal * taxRate)), [subTotal])
    // total: ambil dari server, fallback hitung items
    const displayTotal = toIDR((bill.items?.length ? String(tax + subTotal) : '0'))

    // jumlah items (panjang array items)
    const itemsCount = bill.items?.length ?? 0

    return (
        <ListItemButton
            onClick={onRowClick}
            selected={!!selected}
            sx={(t) => ({
                alignItems: 'flex-start',
                mb: 0.75,
                px: 1.25,
                py: 1,
                borderRadius: 1.5,
                border: '1px solid',
                borderColor: selected ? t.palette.primary.main : 'divider',
                bgcolor: selected ? alpha(t.palette.primary.main, 0.06) : 'background.paper',
                transition: 'transform 120ms ease',
                '&:active': { transform: 'scale(0.99)' },
            })}
        >
            <Stack direction="row" spacing={1.25} sx={{ width: '100%', minWidth: 0 }}>
                {/* ikon */}
                <Box sx={(t) => ({
                    mt: 0.2,
                    p: 0.8,
                    borderRadius: 1,
                    bgcolor: isPaid ? alpha(t.palette.success.main, 0.08) : alpha(t.palette.error.main, 0.08),
                    color: isPaid ? t.palette.success.main : t.palette.error.main,
                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                })}>
                    <ReceiptLongRounded fontSize="small" />
                </Box>

                {/* konten */}
                <Stack spacing={0.5} sx={{ flex: 1, minWidth: 0 }}>
                    {/* baris atas: invoice, status, count, total */}
                    <Stack direction="row" spacing={1} alignItems="center" sx={{ minWidth: 0 }}>
                        <Typography variant="h6" fontWeight={800} noWrap title={invoice}>#{invoice}</Typography>
                        <Chip size="small" sx={{ borderRadius: 0, fontWeight: 900 }} label={statusLabel} color={chipColor as any} />
                        <Chip
                            size="small"
                            variant="outlined"
                            icon={<LocalMallRounded sx={{ fontSize: 14 }} />}
                            label={`${itemsCount} item${itemsCount === 1 ? '' : 's'}`}
                            sx={{ ml: 0.25, borderRadius: 0, fontWeight: 900 }}
                        />
                        <Box sx={{ flex: 1 }} />
                        <Typography variant="h6" fontWeight={800}>{displayTotal}</Typography>
                    </Stack>

                    {/* baris info: order type, shift, meja, waktu, cashier */}
                    <Stack direction="row" spacing={1.25} sx={{ color: 'text.secondary', alignItems: 'center', flexWrap: 'wrap' }}>
                        {/* Order Type */}
                        <Stack direction="row" spacing={0.75} alignItems="center" sx={{ minWidth: 0 }}>
                            <LocalMallRounded sx={{ fontSize: 16 }} />
                            <Typography variant="body2" noWrap title={orderLabel}>{orderLabel}</Typography>
                        </Stack>

                        {/* Shift */}
                        <Stack direction="row" spacing={0.75} alignItems="center" sx={{ minWidth: 0 }}>
                            <ScheduleRounded sx={{ fontSize: 16 }} />
                            <Typography variant="body2" noWrap title={shiftLabel}>{shiftLabel}</Typography>
                        </Stack>

                        {/* Meja */}
                        <Stack direction="row" spacing={0.75} alignItems="center" sx={{ minWidth: 0 }}>
                            <LayersRounded sx={{ fontSize: 16 }} />
                            <Typography variant="body2" noWrap title={tableLabel}>{tableLabel}</Typography>
                        </Stack>



                        <Box sx={{ flex: 1 }} />

                        {/* Kasir */}
                        <Typography variant="body2" noWrap title={cashier}>{cashier}</Typography>
                    </Stack>
                    <Stack direction="row" spacing={1.25} sx={{ color: 'text.secondary', alignItems: 'center', flexWrap: 'wrap' }}>
                        {/* Waktu (paid/issued) */}
                        <Stack direction="row" spacing={0.75} alignItems="center" sx={{ minWidth: 0 }}>
                            <Chip size="small" sx={{ borderRadius: 0, fontWeight: 900 }} icon={<AccessTimeRounded sx={{ fontSize: 16 }} />} label={displayTime} />
                        </Stack>
                    </Stack>
                </Stack>
            </Stack>
        </ListItemButton>
    )
}

export default React.memo(BillsListItemRowModel1)
