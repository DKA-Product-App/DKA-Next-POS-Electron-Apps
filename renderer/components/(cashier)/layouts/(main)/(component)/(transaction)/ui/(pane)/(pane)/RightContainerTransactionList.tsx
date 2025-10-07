'use client'

import * as React from 'react'
import PerfectScrollbar from 'react-perfect-scrollbar'
import 'react-perfect-scrollbar/dist/css/styles.css'
import { Box } from '@mui/material'
import Grid from '@mui/material/Grid'
import dynamic from "next/dynamic"
import { useTx } from '../context/TransactionContext'
import { TransactionBatchesItems } from "../../types/api.transaction.type"

/** 🔽 NEW: filter context */
import { useFilterOrderHeader } from '../context/FilterOrderHeaderContext'
import {useState} from "react";

const RightContainerBatchDetailRowSkeleton = dynamic(() => import('../../(loading)/RightContainerBatchDetailRowSkeleton'), { ssr: false })
const RightContainerBatchDetailRow = dynamic(() => import('./(components)/RightContainerBatchDetailRow'), { ssr: false })

const rupiah = (n: number | string) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(typeof n === 'string' ? parseFloat(n) : n)

const RightContainerTransactionList: React.FC<{ transactionId: string }> = ({ transactionId }) => {
    const { selectedItemIds, selectedItemIdsGod, toggleItemGod, toggleItem, registerItems, reloadKey, selectedBatchId } = useTx()
    const [items, setItems] = React.useState<TransactionBatchesItems[]>([])
    const fetchSeqRef = React.useRef(0)

    // 🔽 NEW: dari context
    const { matchItem } = useFilterOrderHeader()

    const fetchItems = (seq: number) => {
        window.api.invoke('api.transaction.batch.item:read.all', { transaction: transactionId })
            .then((res: any) => {
                if (seq !== fetchSeqRef.current) return
                const arr: TransactionBatchesItems[] = res?.data ?? []
                setItems(arr)
                registerItems(transactionId, arr)
            })
            .catch(() => {
                if (seq !== fetchSeqRef.current) return
                setItems([])
            })
    }

    React.useEffect(() => {
        if (!transactionId) { setItems([]); return }
        setItems([])

        const seq = ++fetchSeqRef.current
        fetchItems(seq);
    }, [transactionId, reloadKey])

    const hasNote = (it: TransactionBatchesItems) => Boolean(it.note?.trim()?.length)
    const isPendingVoid = (it: TransactionBatchesItems) => Boolean(it?.void) && it.void!.is_approved !== true
    const isApprovedVoid = (it: TransactionBatchesItems) => Boolean(it?.void) && it.void!.is_approved === true

    const isPendingPaid = (it: TransactionBatchesItems) => {
        const bills = it?.batch?.transaction?.bills ?? []
        return bills.some((b) =>
            (b?.paid === null || b?.paid?.status === false) &&
            (b?.items ?? []).some((bi) => bi?.productVariant?.id === it.id)
        )
    }

    const isPaid = (it: TransactionBatchesItems) => {
        const bills = it?.batch?.transaction?.bills ?? []
        return bills.some((b) =>
            (b?.paid?.status === true) &&
            (b?.items ?? []).some((bi) => bi?.productVariant?.id === it.id)
        )
    }

    if (!transactionId) return <Box sx={{ p: 2, color: 'text.secondary' }}>Pilih Transaction untuk melihat detail item…</Box>

    // 🔽 NEW: apply filter sebelum render
    const filteredItems = items.filter(matchItem)


    return (
        <Box sx={{ flex: 1, minHeight: 0, px: 1.5, height: '100%' }}>
            <PerfectScrollbar options={{ suppressScrollX: true, wheelPropagation: false }}>
                <Grid container spacing={2} sx={{ py: 1, pr: 2 }}>
                    {filteredItems.length === 0 ? (
                        Array.from({ length: 4 }).map((_, i) => (
                            <Grid key={`skel-${i}`} size={{ xs: 12, sm: 6, md: 3, lg: 2 }}>
                                <RightContainerBatchDetailRowSkeleton />
                            </Grid>
                        ))
                    ) : (
                        filteredItems.map(it => {
                            const selected = selectedItemIds.has(it.id)
                            const selectedGodeModeBol = selectedItemIdsGod.has(it.id)
                            const closed = Boolean(it.batch.transaction?.time_closed)
                            const disabled = closed || isPendingVoid(it) || isApprovedVoid(it) || isPendingPaid(it) || isPaid(it)
                            const qtyPriceLabel = `${it.qty} x ${rupiah(it.price)}`
                            const totalLabel = rupiah(it.sub_total || it.price || 0)

                            return (
                                <Grid key={it.id} size={{ xs: 12, sm: 6, md: 3, lg: 2.2 }}>
                                    <RightContainerBatchDetailRow
                                        item={it}
                                        totalLabel={totalLabel}
                                        qtyPriceLabel={qtyPriceLabel}
                                        selected={selected}
                                        selectedGodMode={selectedGodeModeBol}
                                        disabled={disabled}
                                        isClosed={closed}
                                        isPendingVoid={isPendingVoid(it)}
                                        isApprovedVoid={isApprovedVoid(it)}
                                        isPendingPaid={isPendingPaid(it)}
                                        isPaid={isPaid(it)}
                                        onToggle={toggleItem}
                                        onToggleGod={toggleItemGod}
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

export default React.memo(RightContainerTransactionList)
