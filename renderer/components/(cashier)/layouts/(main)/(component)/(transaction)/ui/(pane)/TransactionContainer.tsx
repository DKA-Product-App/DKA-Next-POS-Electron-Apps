'use client'

import * as React from 'react'
import ResizableGrid from '../ResizableContainer'
import {
    Box,
    Chip,
    Paper,
    Stack,
    Typography,
    Button,
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

/* ========= Utils ========= */
const rupiah = (n: number | string) =>
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 })
        .format(typeof n === 'string' ? parseFloat(n) : n)

const toId = (v: unknown) => `${v ?? ''}`.trim()

/* ========= Lazy panes ========= */
const LeftContainerBatchList = dynamic(() => import('./(pane)/LeftContainerBatchList'), {
    loading: () => <ShimmerMenuSelectLoading />,
    ssr: false,
})

const RightContainerBatchDetail = dynamic(() => import('./(pane)/RightContainerBatchList'), {
    loading: () => <ShimmerMenuSelectLoading />,
    ssr: false,
})

/* ========= Selectors & Counters ========= */
const totalItems = (o: Transaction) =>
    (o?.batches ?? []).reduce((acc, b) => acc + (b?.items?.length ?? 0), 0)

const pickBills = (o: Transaction) => Array.isArray(o?.bills) ? o.bills : []

/**
 * Hitung jumlah item:
 * - active  : item yg belum pernah masuk bill manapun
 * - pending : item yg masuk bill dgn paid null/false
 * - paid    : item yg masuk bill dgn paid true
 */
const getPendingActive = (o: Transaction) => {
    const bills = pickBills(o)

    // semua id item di transaksi
    const ids: string[] = (o?.batches ?? [])
        .flatMap(b => Array.isArray(b?.items) ? b!.items! : [])
        .map(it => toId(it?.id))
        .filter(Boolean)

    // semua item yang pernah dibillin (pending ataupun paid)
    const allBillIdSet = new Set(
        bills
            .flatMap(b => Array.isArray(b?.items) ? b!.items! : [])
            .map(bi => toId(bi?.transactionItem?.id))
            .filter(Boolean)
    )

    // pending: paid null/false
    const pendingBillIdSet = new Set(
        bills
            .filter(b => (b?.paid == null) || (b?.paid?.status === false))
            .flatMap(b => Array.isArray(b?.items) ? b!.items! : [])
            .map(bi => toId(bi?.transactionItem?.id))
            .filter(Boolean)
    )

    // paid: paid true
    const paidBillIdSet = new Set(
        bills
            .filter(b => b?.paid?.status === true)
            .flatMap(b => Array.isArray(b?.items) ? b!.items! : [])
            .map(bi => toId(bi?.transactionItem?.id))
            .filter(Boolean)
    )

    const pending = ids.filter(id => pendingBillIdSet.has(id)).length
    const paid    = ids.filter(id => paidBillIdSet.has(id)).length
    const active  = ids.filter(id => !allBillIdSet.has(id)).length

    return { pending, active, paid }
}

/* ===== Header + Grid + Footer composed with Context ===== */
function Body({ transaction }: { transaction: Transaction }) {
    const {
        grandTotal,
        selectedItemIds,
        selectedTotal,
        clearSelection,
    } = useTx()

    const isClosed = Boolean(transaction?.time_closed)
    const itemQty = totalItems(transaction)
    const { active, pending, paid } = getPendingActive(transaction)

    // Semua ID item transaksi (untuk full-bill mode)
    const allItemIds: string[] = React.useMemo(() => {
        const fromBatches = (transaction?.batches ?? [])
            .flatMap(b => Array.isArray(b?.items) ? b!.items! : [])
            .map(it => toId(it?.id))
            .filter(Boolean)

        return fromBatches.length ? fromBatches : [];
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
                px: 1.5,
                py: 1,
                borderBottom: '1px solid',
                borderColor: 'divider',
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                flexWrap: 'wrap',
                position: 'relative',
                overflow: 'hidden',
                bgcolor: 'background.paper',
                '&::after': {
                    content: '""',
                    position: 'absolute',
                    inset: 0,
                    pointerEvents: 'none',
                    zIndex: 0,
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
        </Paper>
    )

    const Footer = (
        <Paper elevation={0} sx={{ px: 1.5, py: 1.25, borderTop: '1px solid', borderColor: 'divider' }}>
            <Stack direction="row" alignItems="center" justifyContent="space-between" flexWrap="wrap" gap={1.5}>
                {/* Kiri: Total + Info ringkas */}
                <Box sx={{ display: 'grid', gap: 0.5, minWidth: 260 }}>
                    <Typography variant="caption" color="text.secondary">
                        {isSplitMode ? 'Total Terpilih  (Sebelum PPN)' : 'Total Transaksi (Sebelum PPN)'}
                    </Typography>

                    <Typography sx={{ lineHeight: 1, fontWeight: 900, fontSize: { xs: '2.1rem', sm: '2.2rem', md: '3.1rem' } }}>
                        {isSplitMode ? rupiah(selectedTotal ?? 0) : (grandTotal && grandTotal > 0 ? rupiah(grandTotal) : 0)}
                    </Typography>

                    <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap mt={0.5}>
                        <Chip size="small" label={`Invoice #${transaction?.invoice ?? '—'}`} />
                        <Chip
                            size="small"
                            variant="outlined"
                            label={isClosed ? 'Status: Tertutup' : 'Status: Aktif'}
                            color={isClosed ? 'error' : 'success'}
                        />
                        {isSplitMode ? <Chip size="small" icon={<DoneAllRounded />} label={`${selectedItemIds?.size ?? 0} item`} /> : null}
                        {/* Info ringkes: jumlah item / active / pending / paid */}
                        <Chip size="small" label={`Item: ${itemQty}`} />
                        <Chip size="small" label={`Active: ${active}`} />
                        <Chip size="small" label={`Pending: ${pending}`} />
                        <Chip size="small" label={`Paid: ${paid}`} />
                    </Stack>
                </Box>

                {/* Kanan: Aksi */}
                <Stack direction="row" gap={1.25} alignItems="center" sx={{ pr: 4 }}>
                    {/* Void */}
                    <OrderVoidModal transaction={transaction} />

                    {/* Buat Tagihan — kirim array **ID** item */}
                    <NewOrderBillModal
                        items={isSplitMode ? selectedIdList : allItemIds} // string[]
                        mode={isSplitMode ? 'split' : 'full'}
                        label="Buat Tagihan"
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
                <ResizableGrid
                    defaultSize="25%"
                    minSize={330}
                    left={<LeftContainerBatchList transaction={transaction} />}
                    right={<RightContainerBatchDetail transaction={transaction} />}
                />
            </Box>
            {Footer}
        </Box>
    )
}

export default function TransactionContainer({ id, transaction }: { id?: string; transaction: Transaction }) {
    return (
        <TxProvider key={id ?? transaction?.id ?? 'tx'} txId={toId(id ?? transaction?.id)}>
            <Body transaction={transaction} />
        </TxProvider>
    )
}
