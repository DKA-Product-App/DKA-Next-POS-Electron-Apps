'use client'

import * as React from 'react'
import ResizableGrid from '../ResizableContainer'
import {
    Box, Chip, Paper, Stack, Typography, Button,
} from '@mui/material'
import ReceiptLongRounded from '@mui/icons-material/ReceiptLongRounded'
import PersonOutlineRounded from '@mui/icons-material/PersonOutlineRounded'
import AccessTimeRounded from '@mui/icons-material/AccessTimeRounded'
import TableRestaurantRounded from '@mui/icons-material/TableRestaurantRounded'
import { ClearRounded, DoneAllRounded } from '@mui/icons-material'

import { TxProvider, useTx } from './context/TransactionContext'
import dynamic from 'next/dynamic'
import ShimmerMenuSelectLoading from '../(loading)/ShimmerMenuSelectLoading'
import OrderVoidModal from './(components)/OrderVoidModal'
import NewOrderBillModal from './(components)/NewOrderBillModal'
import { Transaction } from '../types/api.transaction.type'
import { LayoutManipulatorBatchProvider, useLayoutManipulatorBatch } from "../../context/LayoutManipulatorBatchContext"
import LeftContainerBatchListNewOrder from './(pane)/(components)/LeftContainerBatchListNewOrder'

/** 🔽 NEW: Filter context & button */
import { FilterOrderHeaderProvider } from './context/FilterOrderHeaderContext'
import FilterOrderHeader from './(components)/FilterOrderHeader'

/* ========= Utils ========= */
const rupiah = (n: number | string) =>
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 })
        .format(typeof n === 'string' ? parseFloat(n) : n)

const toId = (v: unknown) => `${v ?? ''}`.trim()

/* ========= Lazy panes ========= */
const RightContainerTransactionList = dynamic(() => import('./(pane)/RightContainerTransactionList'), {
    loading: () => <ShimmerMenuSelectLoading />,
    ssr: false,
})

/* ========= Selectors & Counters (tetap) ========= */
const totalItems = (o: Transaction) =>
    (o?.batches ?? []).reduce((acc, b) => acc + (b?.items?.length ?? 0), 0)

const pickBills = (o: Transaction) => Array.isArray(o?.bills) ? o.bills : []

const getPendingActive = (o: Transaction) => {
    const bills = pickBills(o)
    const ids: string[] = (o?.batches ?? [])
        .flatMap(b => Array.isArray(b?.items) ? b!.items! : [])
        .map(it => toId(it?.id))
        .filter(Boolean)

    const allBillIdSet = new Set(
        bills.flatMap(b => Array.isArray(b?.items) ? b!.items! : [])
            .map(bi => toId(bi?.transactionItem?.id))
            .filter(Boolean)
    )

    const pendingBillIdSet = new Set(
        bills.filter(b => (b?.paid == null) || (b?.paid?.status === false))
            .flatMap(b => Array.isArray(b?.items) ? b!.items! : [])
            .map(bi => toId(bi?.transactionItem?.id))
            .filter(Boolean)
    )

    const paidBillIdSet = new Set(
        bills.filter(b => b?.paid?.status === true)
            .flatMap(b => Array.isArray(b?.items) ? b!.items! : [])
            .map(bi => toId(bi?.transactionItem?.id))
            .filter(Boolean)
    )

    const pending = ids.filter(id => pendingBillIdSet.has(id)).length
    const paid = ids.filter(id => paidBillIdSet.has(id)).length
    const active = ids.filter(id => !allBillIdSet.has(id)).length

    return { pending, active, paid }
}

const isSuccessPaidItem = (item: any, bills: any[]) =>
    bills?.some((bill: any) =>
        (bill?.paid !== null || bill?.paid?.status === true) &&
        (bill?.items ?? []).some((bi: any) => bi?.transactionItem?.id === item?.id)
    )

const totalPrices = (o: Transaction) => {
    const bills = pickBills(o)
    return (o?.batches ?? []).reduce(
        (acc, b) =>
            acc +
            (b?.items ?? []).reduce(
                (a, i) => a + ((i?.void?.is_approved === true || isSuccessPaidItem(i, bills)) ? 0 : (+i?.sub_total || 0)),
                0
            ),
        0
    )
}

/* ===== Body ===== */
function Body({ transaction }: { transaction: Transaction }) {
    const { selectedItemIds, selectedTotal, clearSelection } = useTx()
    const { layout, setLayout } = useLayoutManipulatorBatch()

    const isClosed = Boolean(transaction?.time_closed)
    const itemQty = totalItems(transaction)
    const { active, pending, paid } = getPendingActive(transaction)

    const allItemIds: string[] = React.useMemo(() => {
        const fromBatches = (transaction?.batches ?? [])
            .flatMap(b => Array.isArray(b?.items) ? b!.items! : [])
            .map(it => toId(it?.id))
            .filter(Boolean)

        return fromBatches.length ? fromBatches : []
    }, [transaction])

    const selectedIdList: string[] = React.useMemo(
        () => Array.from(selectedItemIds ?? []).map(toId).filter(Boolean),
        [selectedItemIds]
    )

    const isSplitMode = (selectedItemIds?.size ?? 0) > 0

    const Header = (
        <Paper
            elevation={0}
            sx={(t) => ({
                px: 2, py: 2, borderBottom: '1px solid', borderColor: 'divider',
                display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap',
                position: 'relative', overflow: 'hidden', bgcolor: 'background.paper',
                '&::after': {
                    content: '""', position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 0,
                    background: transaction?.time_closed
                        ? 'linear-gradient(90deg, #ef4444, #dc2626 35%, #b91c1c)'
                        : 'linear-gradient(90deg, #22c55e, #16a34a 35%, #15803d)',
                    opacity: t.palette.mode === 'dark' ? 0.18 : 0.12,
                },
                '& > *': { position: 'relative', zIndex: 1 },
            })}
        >
            <ReceiptLongRounded fontSize="small" />
            <Typography variant="subtitle1" fontWeight={900} sx={{ mr: 1 }}>
                # {transaction?.invoice ?? '—'}
            </Typography>
            <Chip size="small" label={transaction?.order_type?.name ?? '-'} variant="outlined" />
            {transaction?.table?.code ? (
                <Chip size="small" icon={<TableRestaurantRounded />} label={`Table ${transaction.table.code}`} />
            ) : null}
            <Chip size="small" icon={<PersonOutlineRounded />} label={`${transaction?.reference?.name?.first_name ?? '-'}`} />
            <Chip size="small" icon={<AccessTimeRounded />} label={transaction?.shift?.name ?? '-'} />

            <Box sx={{ flex: 1 }} />
            {(selectedItemIds?.size ?? 0) > 0 && (
                <Stack direction="row" alignItems="center" spacing={1}>
                    <DoneAllRounded fontSize="small" />
                    <Typography variant="body2" fontWeight={700}>{selectedItemIds?.size} item dipilih</Typography>
                    <Button size="small" onClick={clearSelection} title="Kosongkan" variant="text" sx={{ minWidth: 0, p: 0.5 }}>
                        <ClearRounded fontSize="small" />
                    </Button>
                </Stack>
            )}

            {/* 🔽 NEW: Tombol filter */}
            <FilterOrderHeader />

            <Stack direction="row" alignItems="center" spacing={1}>
                <LeftContainerBatchListNewOrder transactionId={transaction.id} />
            </Stack>
        </Paper>
    )

    const Footer = (
        <Paper elevation={0} sx={{ px: 1.5, py: 1.25, borderTop: '1px solid', borderColor: 'divider' }}>
            <Stack direction="row" alignItems="center" justifyContent="space-between" flexWrap="wrap" gap={1.5}>
                <Box sx={{ display: 'grid', gap: 0.5, minWidth: 260 }}>
                    <Typography variant="caption" color="text.secondary">
                        {isSplitMode ? 'Total Terpilih  (Sebelum PPN)' : 'Total Transaksi (Sebelum PPN)'}
                    </Typography>
                    <Typography sx={{ lineHeight: 1, fontWeight: 900, fontSize: { xs: '2.1rem', sm: '2.2rem', md: '3.1rem' } }}>
                        {isSplitMode ? rupiah(selectedTotal ?? 0) : rupiah(totalPrices(transaction))}
                    </Typography>
                    <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap mt={0.5}>
                        <Chip size="small" label={`Invoice #${transaction?.invoice ?? '—'}`} />
                        <Chip
                            size="small"
                            variant="outlined"
                            label={isClosed ? 'Status: Tertutup' : 'Status: Aktif'}
                            color={isClosed ? 'error' : 'success'}
                        />
                        {isSplitMode ? <Chip size="small" label={`${selectedItemIds?.size ?? 0} item`} /> : null}
                        <Chip size="small" label={`Item: ${itemQty}`} />
                        <Chip size="small" label={`Active: ${active}`} />
                        <Chip size="small" label={`Pending: ${pending}`} />
                        <Chip size="small" label={`Paid: ${paid}`} />
                    </Stack>
                </Box>

                <Stack direction="row" gap={1.25} alignItems="center" sx={{ pr: 4 }}>
                    <OrderVoidModal transaction={transaction} />
                    <NewOrderBillModal
                        items={isSplitMode ? selectedIdList : allItemIds} // string[]
                        mode={isSplitMode ? 'split' : 'full'}
                        label={isSplitMode ? 'Checkout Split' : 'Checkout Semua'}
                        variant="contained"
                        transaction={transaction}
                    />
                </Stack>
            </Stack>
        </Paper>
    )

    return (
        <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            {Header}
            <Box sx={{ flex: 1, minHeight: 0 }}>
                <RightContainerTransactionList transactionId={transaction.id} />
            </Box>
            {Footer}
        </Box>
    )
}

export default function TransactionContainerList({ id, transaction }: { id?: string; transaction: Transaction }) {
    return (
        <TxProvider key={id} txId={id}>
            <LayoutManipulatorBatchProvider>
                {/* 🔽 NEW: Bungkus Body dengan Filter Provider */}
                <FilterOrderHeaderProvider transaction={transaction}>
                    <Body transaction={transaction} />
                </FilterOrderHeaderProvider>
            </LayoutManipulatorBatchProvider>
        </TxProvider>
    )
}
