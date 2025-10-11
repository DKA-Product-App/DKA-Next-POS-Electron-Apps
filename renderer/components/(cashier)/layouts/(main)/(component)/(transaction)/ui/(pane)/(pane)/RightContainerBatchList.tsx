'use client'

import * as React from 'react'
import PerfectScrollbar from 'react-perfect-scrollbar'
import 'react-perfect-scrollbar/dist/css/styles.css'
import {Box, Chip, Stack, Typography, Paper, Tooltip} from '@mui/material'
import Grid from '@mui/material/Grid'
import { useTx } from '../context/TransactionContext'
import dynamic from "next/dynamic";
import { TransactionBatchItem } from '../../../../../../../../../types/transaction/batch/transaction.batch.item.type'

const RightContainerBatchDetailRowSkeleton = dynamic(() => import('../../(loading)/RightContainerBatchDetailRowSkeleton'), {
    ssr: false,
})

const RightContainerBatchDetailRow = dynamic(() => import('./(components)/RightContainerBatchDetailRow'), {
    ssr: false,
})

const rupiah = (n: number | string) => new Intl.NumberFormat('id-ID',{style:'currency',currency:'IDR',maximumFractionDigits:0}).format(typeof n==='string'?parseFloat(n):n)

const RightContainerBatchDetail: React.FC<{ batchId : string }> = ({  batchId }) => {
    const { selectedItemIds, toggleItem, registerItems, reloadKey } = useTx()
    const [items, setItems] = React.useState<TransactionBatchItem[]>([])
    const fetchSeqRef = React.useRef(0)

    React.useEffect(() => {
        if (!batchId) { setItems([]); return }
        setItems([]) // kosongkan dulu agar tidak tercampur

        const seq = ++fetchSeqRef.current

        // @ts-ignore
        window.api.invoke('api.transaction.batch.item:read.all', { batch: batchId })
            .then((res: any) => {
                if (seq !== fetchSeqRef.current) return
                const arr: TransactionBatchItem[] = res?.data ?? []
                setItems(arr)
                registerItems(batchId, arr)
            })
            .catch(() => {
                if (seq !== fetchSeqRef.current) return
                setItems([])
            })
    }, [batchId, reloadKey])

    const hasNote = (it: TransactionBatchItem) => Boolean(it.note?.trim()?.length)
    const isPendingVoid = (it: TransactionBatchItem) => Boolean(it?.void) && it.void!.is_approved !== true
    const isApprovedVoid = (it: TransactionBatchItem) => Boolean(it?.void) && it.void!.is_approved === true

    /** ✅ Item dianggap “Pending Paid” jika ada bill dan paid.is_paid === true */
    /** ✅ Pending jika: bill.paid == null DAN bill.items[*].transactionItem.id === it.id */
    const isPendingPaid = (it: TransactionBatchItem) => {
        const bills = it?.batch?.transaction?.bills ?? [];
        return bills.some((b: any) =>
            (b?.paid === null || b?.paid?.status === false) &&
            (b?.items ?? []).some((bi: any) => bi?.transactionItem?.id === it.id)
        );
    };

    const isPaid = (it: TransactionBatchItem) => {
        const bills = it?.batch?.transaction?.bills ?? [];
        return bills.some((b: any) =>
            (b?.paid?.status === true) &&
            (b?.items ?? []).some((bi: any) => bi?.transactionItem?.id === it.id)
        );
    };

    if (!batchId) return <Box sx={{ p:2, color:'text.secondary' }}>Pilih batch untuk melihat detail item…</Box>

    return (
        <Box sx={{ flex:1, minHeight:0, px:1.5, height: '100%' }}>
            <PerfectScrollbar options={{ suppressScrollX: true, wheelPropagation: false }}>
                <Grid container spacing={2} sx={{ py: 1, pr: 2 }}>
                    {/* Saat BELUM ada data setelah fetch dimulai: tampilkan skeleton */}
                    {items.length === 0 ? (
                        Array.from({ length: 4 }).map((_, i) => (
                            <Grid key={`skel-${i}`} size={{ xs: 12, sm: 12, md: 4, lg: 3 }}>
                                <RightContainerBatchDetailRowSkeleton />
                            </Grid>
                        ))
                    ) : (
                        items.map(it => {
                            const selected = selectedItemIds.has(it.id)
                            const closed = Boolean(it.batch.transaction?.time_closed)
                            const disabled = closed || isPendingVoid(it) || isApprovedVoid(it) || isPendingPaid(it) || isPaid(it)
                            const qtyPriceLabel = `${it.qty} x ${rupiah(it.price)}`
                            const totalLabel = rupiah(it.sub_total || it.price || 0)

                            return (
                                <Grid key={it.id} size={{ xs: 12, sm: 12, md: 4, lg: 3 }}>
                                    <RightContainerBatchDetailRow
                                        item={it}
                                        totalLabel={totalLabel}
                                        qtyPriceLabel={qtyPriceLabel}
                                        selected={selected}
                                        disabled={disabled}
                                        isClosed={closed}
                                        isPendingVoid={isPendingVoid(it)}
                                        isApprovedVoid={isApprovedVoid(it)}
                                        isPendingPaid={isPendingPaid(it)}
                                        isPaid={isPaid(it)}
                                        onToggle={toggleItem}
                                        // uploadsLoader (opsional): default sudah sesuai
                                    />
                                </Grid>
                            )
                        })
                    )}
                </Grid>
            </PerfectScrollbar>
        </Box>
    )
}

export default React.memo(RightContainerBatchDetail);
