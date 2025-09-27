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
import {Transaction} from "./(components)/TransactionListItemRow";

const rupiah = (n: number | string) =>
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 })
        .format(typeof n === 'string' ? parseFloat(n) : n)

const LeftContainerBatchList = dynamic(() => import('./(pane)/LeftContainerBatchList'), {
    loading: () => <ShimmerMenuSelectLoading />,
    ssr: false,
})

const RightContainerBatchDetail = dynamic(() => import('./(pane)/RightContainerBatchList'), {
    loading: () => <ShimmerMenuSelectLoading />,
    ssr: false,
})

const totalItems = (o: Transaction) => (o.batches ?? []).reduce((acc, b) => acc + (b.items ?? []).length, 0)
const pickBills = (o: any) => o?.bills ?? o?.transaction?.bills ?? []
const getPendingActive = (o: Transaction) => {
    const bills = pickBills(o);

    // Kumpulin semua id item transaksi (o.batches[].items[].id)
    const ids =
        (o?.batches ?? [])
            .flatMap((bt: any) => Array.isArray(bt?.items) ? bt.items : [])
            .map((it: any) => it?.id)
            .filter(Boolean);

    // Set semua id item yang SUDAH masuk bill (paid apapun)
    const allBillIdSet = new Set(
        bills
            .flatMap((b: any) => Array.isArray(b?.items) ? b.items : [])
            .map((bi: any) => bi?.transactionItem?.id)
            .filter(Boolean)
    );

    // Set id item yang masuk bill PENDING (paid null/false)
    const pendingBillIdSet = new Set(
        bills
            .filter((b: any) => (b?.paid == null) || (b?.paid?.status === false))
            .flatMap((b: any) => Array.isArray(b?.items) ? b.items : [])
            .map((bi: any) => bi?.transactionItem?.id)
            .filter(Boolean)
    );

    const paidBillIdSet = new Set(
        bills
            .filter((b: any) => (b?.paid == null) || (b?.paid?.status === true))
            .flatMap((b: any) => Array.isArray(b?.items) ? b.items : [])
            .map((bi: any) => bi?.transactionItem?.id)
            .filter(Boolean)
    );

    const pending = ids.filter((id: any) => pendingBillIdSet.has(id)).length;
    const paid  = ids.filter((id: any) => paidBillIdSet.has(id)).length;
    const active  = ids.filter((id: any) => !allBillIdSet.has(id)).length;


    return { pending, active, paid };
};

/* ===== Header + Grid + Footer composed with Context ===== */
function Body({ transaction } : { transaction : Transaction }) {
    const {
        grandTotal,
        selectedItemIds,
        selectedTotal,
        clearSelection,
        bumpReload,
        reloadKey
    } = useTx()

    const isClosed = Boolean(transaction.time_closed)
    const itemQty = totalItems(transaction);
    const { active, pending, paid } = getPendingActive(transaction);



    // normalizer id → string
    const toId = (v: unknown) => `${v ?? ''}`.trim()

    /**
     * Ambil semua **ID item** dari transaksi.
     * Support:
     *  - transaction.items[]
     *  - transaction.batches[].items[]
     */
    const allItemIds: string[] = React.useMemo(() => {
        if (Array.isArray(transaction?.items))
            return transaction.items
                .map((it: any) => toId(it.id ?? it._id ?? it.item_id))
                .filter(Boolean)

        if (Array.isArray(transaction?.batches))
            return transaction.batches
                .flatMap((b: any) => Array.isArray(b.items) ? b.items : [])
                .map((it: any) => toId(it.id ?? it._id ?? it.item_id))
                .filter(Boolean)

        return []
    }, [transaction])

    // Konversi Set → string[]
    const selectedIdList: string[] = React.useMemo(
        () => Array.from(selectedItemIds || []).map(toId).filter(Boolean),
        [selectedItemIds]
    )

    const isSplitMode = (selectedItemIds?.size || 0) > 0

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
                    background: transaction.time_closed
                        ? 'linear-gradient(90deg, #ef4444, #dc2626 35%, #b91c1c)'
                        : 'linear-gradient(90deg, #22c55e, #16a34a 35%, #15803d)',
                    opacity: t.palette.mode === 'dark' ? 0.18 : 0.12,
                },
                '& > *': { position: 'relative', zIndex: 1 },
            })}
        >
            <ReceiptLongRounded fontSize="small" />
            <Typography variant="subtitle1" fontWeight={900} sx={{ mr: 1 }}># {transaction.invoice ?? '—'}</Typography>
            <Chip size="small" label={transaction.order_type?.name ?? '-'} variant="outlined" />
            {transaction.table?.code ? <Chip size="small" icon={<TableRestaurantRounded />} label={`Table ${transaction.table.code}`} /> : null}
            <Chip size="small" icon={<PersonOutlineRounded />} label={`${transaction.reference?.name?.first_name ?? '-'}`} />
            <Chip size="small" icon={<AccessTimeRounded />} label={transaction.shift?.name ?? '-'} />
            <Box sx={{ flex: 1 }} />
            {selectedItemIds.size > 0 && (
                <Stack direction="row" alignItems="center" spacing={1}>
                    <DoneAllRounded fontSize="small" />
                    <Typography variant="body2" fontWeight={700}>{selectedItemIds.size} item dipilih</Typography>
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
                        {isSplitMode ? rupiah(selectedTotal) : (grandTotal > 0 ? rupiah(grandTotal) : 0)}
                    </Typography>

                    <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap mt={0.5}>
                        <Chip size="small" label={`Invoice #${transaction.invoice ?? '—'}`} />
                        <Chip
                            size="small"
                            variant="outlined"
                            label={isClosed ? 'Status: Tertutup' : 'Status: Aktif'}
                            color={isClosed ? 'error' : 'success'}
                        />
                        {isSplitMode ? <Chip size="small" icon={<DoneAllRounded />} label={`${selectedItemIds.size} item`} /> : null}
                    </Stack>
                </Box>

                {/* Kanan: Aksi */}
                <Stack direction="row" gap={1.25} alignItems="center" sx={{ pr: 4 }}>
                    {/* Void */}
                    <OrderVoidModal transaction={transaction} />

                    {/* Buat Tagihan — kirim array **ID** item */}
                    <NewOrderBillModal
                        items={isSplitMode ? selectedIdList : allItemIds} // ⬅️ string[]
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
                    right={<RightContainerBatchDetail transaction={transaction}  />}
                />
            </Box>
            {Footer}
        </Box>
    )
}

export default function TransactionContainer({ id, transaction }) {
    return (
        <TxProvider key={id} txId={id}>
            <Body transaction={transaction}/>
        </TxProvider>
    )
}
