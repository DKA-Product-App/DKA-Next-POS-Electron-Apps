'use client'

import * as React from 'react'
import PerfectScrollbar from 'react-perfect-scrollbar'
import 'react-perfect-scrollbar/dist/css/styles.css'
import { Box } from '@mui/material'
import Grid from '@mui/material/Grid'
import dynamic from "next/dynamic"
import { useTx } from '../context/TransactionContext'

/** 🔽 NEW: filter context */
import { useFilterOrderHeader } from '../context/FilterOrderHeaderContext'
import { useMemo } from "react";
import {TransactionBatch} from "../../../../../../../../../types/transaction/batch/transaction.batch.type";
import {TransactionBatchItem} from "../../../../../../../../../types/transaction/batch/transaction.batch.item.type";

const RightContainerBatchDetailRowSkeleton = dynamic(() => import('../../(loading)/RightContainerBatchDetailRowSkeleton'), { ssr: false })
const RightContainerBatchDetailRow = dynamic(() => import('./(components)/RightContainerBatchDetailRow'), { ssr: false })

const rupiah = (n: number | string) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(typeof n === 'string' ? parseFloat(n) : n)

/** 🔧 Helper kecil */
const sid = (v?: unknown) => v != null ? String(v) : ""
const notNull = <T,>(x: T | null | undefined): x is T => x != null

const RightContainerTransactionList: React.FC<{ transactionId: string }> = ({ transactionId }) => {
    const { selectedItemIds, selectedItemIdsGod, toggleItemGod, toggleItem, registerItems, reloadKey } = useTx()
    const [items, setItems] = React.useState<TransactionBatchItem[]>([])
    const fetchSeqRef = React.useRef(0)

    // 🔽 NEW: dari context
    const { matchItem } = useFilterOrderHeader()

    const fetchItems = (seq: number) => {
        window.api.invoke('api.transaction.batch.item:read.all', { transaction: transactionId, limit: 500 })
            .then((res: any) => {
                if (seq !== fetchSeqRef.current) return
                const arr: TransactionBatchItem[] = res?.data ?? []
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
        fetchItems(seq)
    }, [transactionId, reloadKey])

    /** =========================================
     *  STATUS MAP di tingkat TRANSACTION (batches)
     *  ========================================= */
    const statusSets = useMemo(() => {
        // Semua bills dari transaction (ambil dari salah satu item)
        const bills = items?.[0]?.batch?.transaction?.bills ?? []

        // Item transaksi yang valid (punya variantId) dan tidak di-void
        const voidPendingIds = new Set(
            items.filter(it => Boolean(it?.void) && it.void!.is_approved !== true).map(it => sid(it.id)).filter(Boolean)
        )
        const voidApprovedIds = new Set(
            items.filter(it => Boolean(it?.void) && it.void!.is_approved === true).map(it => sid(it.id)).filter(Boolean)
        )
        const notVoided = (id: string) => !voidPendingIds.has(id) && !voidApprovedIds.has(id)

        // Bucket per variantId: urut by time_created (deterministik)
        type BucketItem = { id: string; t: string }
        const buckets = items
            .map(it => ({
                id: sid(it.id),
                variantId: sid(it?.variant?.id),
                t: it?.time_created ?? ""
            }))
            .filter(r => r.id && r.variantId && notVoided(r.id))
            .reduce<Record<string, BucketItem[]>>((acc, r) => {
                (acc[r.variantId] ??= []).push({ id: r.id, t: r.t })
                return acc
            }, {})

        Object.values(buckets).forEach(arr => arr.sort((a, b) => (a.t || "").localeCompare(b.t || "") || a.id.localeCompare(b.id)))

        // Hitung billed/paid per variantId dari bill.items
        // Catatan: jika b.paid?.status TIDAK ada -> treat as pending
        const billTallies = bills
            .flatMap(b => (b?.items ?? []).map(bi => ({ variantId: sid(bi?.productVariant?.id), isPaid: !!b?.paid?.status })))
            .filter(x => x.variantId)
            .reduce<Record<string, { paid: number; pending: number; billed: number }>>((acc, r) => {
                const got = acc[r.variantId] ?? { paid: 0, pending: 0, billed: 0 }
                got.billed += 1
                r.isPaid ? (got.paid += 1) : (got.pending += 1)
                acc[r.variantId] = got
                return acc
            }, {})

        const paid = new Set<string>()
        const pending = new Set<string>()
        const billed = new Set<string>() // total yang pernah masuk bill (paid + pending)

        Object.entries(buckets).forEach(([variantId, arr]) => {
            const t = billTallies[variantId] ?? { paid: 0, pending: 0, billed: 0 }
            const n = arr.length
            const paidN = Math.min(t.paid, n)
            const pendN = Math.min(t.pending, Math.max(0, n - paidN))
            const billedN = Math.min(t.billed, n)

            // alokasi deterministik: first paidN -> paid, next pendN -> pending
            arr.slice(0, paidN).forEach(x => paid.add(x.id))
            arr.slice(paidN, paidN + pendN).forEach(x => pending.add(x.id))
            arr.slice(0, billedN).forEach(x => billed.add(x.id))
        })

        // return juga set void buat dipakai di UI
        return { paid, pending, billed, voidPendingIds, voidApprovedIds }
    }, [items])

    const hasNote = (it: TransactionBatchItem) => Boolean(it.note?.trim()?.length)
    const isPendingVoid = (it: TransactionBatchItem) => statusSets.voidPendingIds.has(sid(it.id))
    const isApprovedVoid = (it: TransactionBatchItem) => statusSets.voidApprovedIds.has(sid(it.id))

    /** ✅ FIX: cek paid/pendingPaid pakai hasil alokasi per-variant, bukan nyocokkan ke id item */
    const isPendingPaid = (it: TransactionBatchItem) => statusSets.pending.has(sid(it.id))
    const isPaid        = (it: TransactionBatchItem) => statusSets.paid.has(sid(it.id))

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

                            // ❗️ Disabled jika closed / void / sudah billed (pending atau paid)
                            const disabled = closed || isPendingVoid(it) || isApprovedVoid(it) || isPendingPaid(it) || isPaid(it)

                            const qtyPriceLabel = `${it.qty} x ${rupiah(it.price)}`
                            const totalLabel = rupiah(it.sub_total || it.price || 0)

                            return (
                                <Grid key={it.id} size={{ xs: 12, sm: 6, md: 3, lg: 2.4 }}>
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
