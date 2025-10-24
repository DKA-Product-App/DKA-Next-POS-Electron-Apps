'use client'

import * as React from 'react'
import ResizableGrid from '../ResizableContainer'
import {
    Box, Chip, Paper, Stack, Typography, Button,
    Tooltip,
} from '@mui/material'
import ReceiptLongRounded from '@mui/icons-material/ReceiptLongRounded'
import PersonOutlineRounded from '@mui/icons-material/PersonOutlineRounded'
import AccessTimeRounded from '@mui/icons-material/AccessTimeRounded'
import TableRestaurantRounded from '@mui/icons-material/TableRestaurantRounded'
import {
    CancelRounded,
    ClearRounded,
    DoneAllRounded,
    HourglassEmptyRounded,
    LayersRounded,
    PendingActionsRounded,
    ReportGmailerrorredRounded
} from '@mui/icons-material'

import { TxProvider, useTx } from './context/TransactionContext'
import dynamic from 'next/dynamic'
import ShimmerMenuSelectLoading from '../(loading)/ShimmerMenuSelectLoading'
import OrderVoidModal from './(components)/OrderVoidModal'
import NewOrderBillModal from './(components)/NewOrderBillModal'
import { LayoutManipulatorBatchProvider } from "../../context/LayoutManipulatorBatchContext"
import LeftContainerBatchListNewOrder from './(pane)/(components)/LeftContainerBatchListNewOrder'

/** 🔽 NEW: Filter context & button */
import { FilterOrderHeaderProvider } from './context/FilterOrderHeaderContext'
import FilterOrderHeader from './(components)/FilterOrderHeader'
import TaskAltRounded from "@mui/icons-material/TaskAltRounded";
import {useFunctionKeyCtx} from "../../../../../../../../contexts/FunctionKeyProviderContext";
import {SummarizeTxReturn} from "../../types/transaction.read.one.type";
import {Transaction} from "../../../../../../../../types/transaction/transaction.type";
import {TransactionBatchItem} from "../../../../../../../../types/transaction/batch/transaction.batch.item.type";
import {TransactionBill} from "../../../../../../../../types/transaction/bill/transaction.bill.type";

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

const getStatusSummary = (o: Transaction) => {
    const bills = pickBills(o);
    const allTxItems = (o?.batches ?? []).flatMap(b => b?.items ?? []).filter(Boolean);

    // ---------- Helper ----------
    const sid = (v?: unknown) => v != null ? String(v) : "";
    const notNull = <T,>(x: T | null | undefined): x is T => x != null;

    // ---------- Kumpulan ID item transaksi ----------
    const allItemIdsSet = new Set(allTxItems.map(it => sid(it.id)).filter(Boolean));

    // ---------- VOID ----------
    const voidPendingIdsSet  = new Set(allTxItems.filter(it => it?.void?.is_approved === false).map(it => sid(it.id)).filter(Boolean));
    const voidApprovedIdsSet = new Set(allTxItems.filter(it => it?.void?.is_approved === true).map(it => sid(it.id)).filter(Boolean));
    const notVoided = (id: string) => !voidPendingIdsSet.has(id) && !voidApprovedIdsSet.has(id);

    // ---------- Group transaksi per variantId (yang tidak di-void) ----------
    type TxBucket = { variantId: string; items: { id: string; t: string }[] };
    const txBucketsMap = allTxItems
        .map(it => ({ id: sid(it.id), t: it?.time_created ?? "", variantId: sid(it?.variant?.id) }))
        .filter(r => r.id && r.variantId && notVoided(r.id))
        .reduce<Map<string, TxBucket>>((acc, r) => {
            const got = acc.get(r.variantId) ?? { variantId: r.variantId, items: [] };
            got.items.push({ id: r.id, t: r.t });
            acc.set(r.variantId, got);
            return acc;
        }, new Map());

    // Urutkan item dalam setiap bucket biar alokasi deterministik
    txBucketsMap.forEach(b => b.items.sort((a, b2) => (a.t || "").localeCompare(b2.t || "") || a.id.localeCompare(b2.id)));

    // ---------- Hitung billed/paid per variant ----------
    // Catatan: jika TIDAK ada field b.paid/status, treat semua sebagai "pendingPaid"
    const billAllItems = bills.flatMap(b => (b?.items ?? []).map(it => ({ billPaid: !!b?.paid?.status, it })));

    const countByVariant = billAllItems.reduce<Record<string, { paid: number; billed: number; pending: number }>>((acc, r) => {
        const variantId = sid(r.it?.productVariant?.id);
        if (!variantId) return acc;

        const got = acc[variantId] ?? { paid: 0, billed: 0, pending: 0 };
        got.billed += 1;

        if (r.billPaid) got.paid += 1;
        else got.pending += 1;

        acc[variantId] = got;
        return acc;
    }, {});

    // ---------- Alokasi ke item transaksi ----------
    const paidIdsSet        = new Set<string>();
    const pendingPaidIdsSet = new Set<string>();
    const billedIdsSet      = new Set<string>(); // semua yang masuk bill (paid+pending)

    Array.from(txBucketsMap.values()).forEach(bucket => {
        const stats = countByVariant[bucket.variantId] ?? { paid: 0, billed: 0, pending: 0 };
        const { paid, pending, billed } = stats;

        // clamp biar nggak over-assign
        const n = bucket.items.length;
        const paidN    = Math.min(paid, n);
        const pendN    = Math.min(pending, Math.max(0, n - paidN));
        const billedN  = Math.min(billed, n);

        // assign: paid → pending → sisanya unpaid
        const paidChunk    = bucket.items.slice(0, paidN);
        const pendingChunk = bucket.items.slice(paidN, paidN + pendN);
        const billedChunk  = bucket.items.slice(0, billedN); // total yang dianggap "sudah ditagih"

        paidChunk.forEach(x => paidIdsSet.add(x.id));
        pendingChunk.forEach(x => pendingPaidIdsSet.add(x.id));
        billedChunk.forEach(x => billedIdsSet.add(x.id));
    });

    // ---------- Hasil akhir ----------
    const allIds       = Array.from(allItemIdsSet);
    const pendingVoid  = Array.from(voidPendingIdsSet);
    const voided       = Array.from(voidApprovedIdsSet);

    // keluarkan yang void dari perhitungan bayar
    const notVoidedIds = allIds.filter(notVoided);

    const paidIds      = notVoidedIds.filter(id => paidIdsSet.has(id));
    const pendingIds   = notVoidedIds.filter(id => pendingPaidIdsSet.has(id) && !paidIdsSet.has(id));
    const unpaidIds    = notVoidedIds.filter(id => !billedIdsSet.has(id)); // belum pernah masuk bill sama sekali

    return {
        counts: {
            pendingVoid: pendingVoid.length,
            void: voided.length,
            pendingPaid: pendingIds.length,
            paid: paidIds.length,
            unpaid: unpaidIds.length,
        },
        ids: {
            pendingVoid,
            void: voided,
            pendingPaid: pendingIds,
            paid: paidIds,
            unpaid: unpaidIds,
        },
    };
};


const isSuccessPaidItem = (item: TransactionBatchItem, bills: TransactionBill[]) =>
    bills?.some((bill) =>
        (bill?.paid !== null || bill?.paid?.status === true) &&
        (bill?.items ?? []).some((bi) => bi?.productVariant?.id === item?.id)
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
function Body({ tr }: { tr: Transaction }) {
    const { selectedItemIds, selectedItemIdsGod, selectedTotal, clearSelection, clearSelectionGods, reloadKey } = useTx()
    const [transaction, setTransaction] = React.useState<Transaction>(undefined)
    const [transactionMeta, setTransactionMeta ] = React.useState<SummarizeTxReturn>(undefined);
    const { setMenu, remove,  key, seq } = useFunctionKeyCtx()
    const isClosed = React.useMemo(() => Boolean(transaction?.time_closed), [transaction])
    const itemQty = React.useMemo(() => totalItems(transaction), [transaction])
    const { counts, ids } =  React.useMemo(() => getStatusSummary(transaction), [transaction])


    const selectedIdList: string[] = React.useMemo(
        () => {
            return Array.from(selectedItemIds ?? []).map(toId).filter(Boolean)
        },
        [selectedItemIds]
    )
    const selectedIdListGod: string[] = React.useMemo(
        () => Array.from(selectedItemIdsGod ?? []).map(toId).filter(Boolean),
        [selectedItemIdsGod]
    )


    const isSplitMode = (selectedItemIds?.size ?? 0) > 0

    React.useEffect(() => {
        if (!isClosed){
            setMenu((prev) => {
                return [
                    ...prev,
                    { key : "F3", label: `Order Lagi` }
                ]
            })
            return () => {
                remove("F3")
            }
        }
    }, [isClosed, transaction])

    React.useEffect(() => {
        setTransaction(undefined);
        setTransactionMeta(undefined);
        window.api.invoke<{ id : string }, { data : Transaction, meta: SummarizeTxReturn }>('api.transaction:read.one', {
            id : tr.id
        })
            .then(({ data, meta }) => {
                setTransaction(data)
                setTransactionMeta(meta);
            })
            .catch((err: any) => {
                setTransaction(undefined)
                setTransactionMeta(undefined);
            })
    }, [tr, reloadKey])

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
                    <Button size="small" onClick={() => {
                        clearSelection();
                        clearSelectionGods();
                    }} title="Kosongkan" variant="text" sx={{ minWidth: 0, p: 0.5 }}>
                        <ClearRounded fontSize="small" />
                    </Button>
                </Stack>
            )}

            {/* 🔽 NEW: Tombol filter */}
            <FilterOrderHeader />

            <Stack direction="row" alignItems="center" spacing={1}>
                <LeftContainerBatchListNewOrder transactionId={transaction?.id} />
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
                        {isSplitMode ? rupiah(selectedTotal ?? 0) : rupiah(transactionMeta?.raw.batchItems.active.price ?? 0)}
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
                        <Stack direction="row" spacing={1}>
                            <Tooltip title="Total Item. Belum Termasuk Qty" arrow>
                                <Chip
                                    size="small"
                                    icon={<LayersRounded fontSize="small" />}
                                    label={String(itemQty)}
                                    variant="outlined"
                                    color="default"
                                    sx={{ pl: 0.5 }}
                                />
                            </Tooltip>
                            <Tooltip title="Unpaid · belum ada di bill mana pun" arrow>
                                <Chip
                                    size="small"
                                    icon={<HourglassEmptyRounded fontSize="small" />}
                                    label={String(transactionMeta?.raw.batchItems.active.count ?? 0)}
                                    variant="outlined"
                                    color="default"
                                    sx={{ pl: 0.5 }}
                                />
                            </Tooltip>

                            <Tooltip title="Pending Paid · sudah di bill tapi belum lunas" arrow>
                                <Chip
                                    size="small"
                                    icon={<PendingActionsRounded fontSize="small" />}
                                    label={String(counts.pendingPaid)}
                                    variant="outlined"
                                    color="warning"
                                    sx={{ pl: 0.5 }}
                                />
                            </Tooltip>

                            <Tooltip title="Paid · lunas" arrow>
                                <Chip
                                    size="small"
                                    icon={<TaskAltRounded fontSize="small" />}
                                    label={String(counts.paid)}
                                    variant="filled"
                                    color="success"
                                    sx={{ pl: 0.5 }}
                                />
                            </Tooltip>

                            <Tooltip title="Pending Void · diajukan void, belum approved" arrow>
                                <Chip
                                    size="small"
                                    icon={<ReportGmailerrorredRounded fontSize="small" />}
                                    label={String(counts.pendingVoid)}
                                    variant="outlined"
                                    color="error"
                                    sx={{ pl: 0.5 }}
                                />
                            </Tooltip>
                            {/* NEW: Voided */}
                            <Tooltip title="Voided · sudah disetujui void, tidak dihitung tagihan" arrow>
                                <Chip
                                    size="small"
                                    icon={<CancelRounded fontSize="small" />}
                                    label={String(counts.void)}
                                    variant="filled"
                                    color="error"
                                    sx={{ pl: 0.5 }}
                                />
                            </Tooltip>
                        </Stack>
                    </Stack>
                </Box>

                <Stack direction="row" gap={1.25} alignItems="center" sx={{ pr: 4 }}>
                    <OrderVoidModal transaction={transaction} />
                    <NewOrderBillModal
                        items={isSplitMode ? selectedIdList : ids.unpaid}
                        itemsGod={selectedIdListGod}
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
                <RightContainerTransactionList transactionId={transaction?.id} />
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
                    <Body tr={transaction} />
                </FilterOrderHeaderProvider>
            </LayoutManipulatorBatchProvider>
        </TxProvider>
    )
}
