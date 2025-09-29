'use client'

import * as React from 'react'
import PerfectScrollbar from 'react-perfect-scrollbar'
import 'react-perfect-scrollbar/dist/css/styles.css'
import {Box, Chip, Stack, Typography, Paper, Tooltip} from '@mui/material'
import Grid from '@mui/material/Grid'
import Image, { ImageLoader } from 'next/image'
import Skeleton from '@mui/material/Skeleton'
import { motion } from 'framer-motion'
import { useTx } from '../context/TransactionContext'
import dynamic from "next/dynamic";
import {Transaction, TransactionBatchesItems} from "../../types/api.transaction.type";

const RightContainerBatchDetailRowSkeleton = dynamic(() => import('../../(loading)/RightContainerBatchDetailRowSkeleton'), {
    ssr: false,
})

const RightContainerBatchDetailRow = dynamic(() => import('./(components)/RightContainerBatchDetailRow'), {
    ssr: false,
})

const MotionPaper = motion(Paper)
const GRADIENT = 'linear-gradient(90deg, #6366F1, #8B5CF6 35%, #EC4899)'
const rupiah = (n: number | string) => new Intl.NumberFormat('id-ID',{style:'currency',currency:'IDR',maximumFractionDigits:0}).format(typeof n==='string'?parseFloat(n):n)

const uploadsLoader: ImageLoader = ({ src }) => {
    if (src?.startsWith('uploads:///')) {
        const base = process.env.NEXT_PUBLIC_UPLOADS_BASE_URL || ''
        const path = src.replace('uploads:///', '').replace(/^\/+/, '')
        return base ? `${base.replace(/\/+$/, '')}/${path}` : `/${path}`
    }
    return src
}
const toUploadUrl = (s?: string) => (!s ? undefined : /^(uploads|http|https):\/\//i.test(s) ? s : `uploads:///${s.replace(/^\/+/, '')}`)
const ph = (name?: string, img?: string) => toUploadUrl(img) ?? `https://placehold.co/600x400/png?text=${encodeURIComponent(name || 'Item')}`

const ImgWithSkeleton: React.FC<{ src: string; alt: string; loader?: ImageLoader }> = ({ src, alt, loader }) => {
    const [loaded, setLoaded] = React.useState(false)
    const [err, setErr] = React.useState(false)
    const finalSrc = err ? 'https://placehold.co/600x400/png?text=No%20Image' : src
    return (
        <Box sx={{ position:'relative', width:'100%', aspectRatio:'4 / 3', bgcolor:'action.hover', overflow:'hidden' }}>
            {!loaded && <Skeleton variant="rectangular" sx={{ position:'absolute', inset:0 }} />}
            <Image loader={loader} src={finalSrc} alt={alt} fill unoptimized sizes="(max-width: 600px) 50vw, (max-width: 1200px) 25vw, 200px"
                   onLoad={()=>setLoaded(true)} onError={()=>{setErr(true); setLoaded(true)}} style={{objectFit:'cover', opacity:loaded?1:0, transition:'opacity .2s ease'}} />
            <Box sx={{ position:'absolute', inset:0, pointerEvents:'none', background:(t)=>`linear-gradient(to bottom, ${t.palette.action.hover}00 0%, ${t.palette.action.hover}40 70%, ${t.palette.action.hover}66 100%)` }} />
        </Box>
    )
}

const RightContainerBatchDetail: React.FC<{ transaction : Transaction}> = ({ transaction }) => {
    const { selectedBatchId, selectedItemIds, toggleItem, registerItems, reloadKey } = useTx()
    const [items, setItems] = React.useState<TransactionBatchesItems[]>([])
    const fetchSeqRef = React.useRef(0)

    React.useEffect(() => {
        if (!selectedBatchId) { setItems([]); return }
        setItems([]) // kosongkan dulu agar tidak tercampur

        const seq = ++fetchSeqRef.current

        // @ts-ignore
        window.api.invoke('api.transaction.batch.item:read.all', { batch: selectedBatchId })
            .then((res: any) => {
                if (seq !== fetchSeqRef.current) return
                const arr: TransactionBatchesItems[] = res?.data ?? []
                setItems(arr)
                registerItems(selectedBatchId, arr)
            })
            .catch(() => {
                if (seq !== fetchSeqRef.current) return
                setItems([])
            })
    }, [selectedBatchId, reloadKey])

    const isClosed = Boolean(transaction?.time_closed)

    const hasNote = (it: TransactionBatchesItems) => Boolean(it.note?.trim()?.length)
    const isPendingVoid = (it: TransactionBatchesItems) => Boolean(it?.void) && it.void!.is_approved !== true
    const isApprovedVoid = (it: TransactionBatchesItems) => Boolean(it?.void) && it.void!.is_approved === true

    /** ✅ Item dianggap “Pending Paid” jika ada bill dan paid.is_paid === true */
    /** ✅ Pending jika: bill.paid == null DAN bill.items[*].transactionItem.id === it.id */
    const isPendingPaid = (it: TransactionBatchesItems) => {
        const bills = it?.batch?.transaction?.bills ?? [];
        return bills.some((b: any) =>
            (b?.paid === null || b?.paid?.status === false) &&
            (b?.items ?? []).some((bi: any) => bi?.transactionItem?.id === it.id)
        );
    };

    const isPaid = (it: TransactionBatchesItems) => {
        const bills = it?.batch?.transaction?.bills ?? [];
        return bills.some((b: any) =>
            (b?.paid?.status === true) &&
            (b?.items ?? []).some((bi: any) => bi?.transactionItem?.id === it.id)
        );
    };

    if (!selectedBatchId) return <Box sx={{ p:2, color:'text.secondary' }}>Pilih batch untuk melihat detail item…</Box>

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
                            const closed = Boolean(transaction?.time_closed)
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
