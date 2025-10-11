// LeftContainerBatchListNewOrder.tsx
'use client'

import * as React from 'react'
import {
    Box, Button, Dialog, DialogTitle, DialogContent,
    IconButton, Stack, Typography
} from '@mui/material'
import AddRounded from '@mui/icons-material/AddRounded'
import CloseRounded from '@mui/icons-material/CloseRounded'
import DarkModeRounded from '@mui/icons-material/DarkModeRounded'
import LightModeRounded from '@mui/icons-material/LightModeRounded'
import FullscreenRounded from '@mui/icons-material/FullscreenRounded'
import FullscreenExitRounded from '@mui/icons-material/FullscreenExitRounded'
import dynamic from 'next/dynamic'
import SweetAlert2, {SweetAlert2Props} from 'react-sweetalert2';
import { useTx } from '../../context/TransactionContext'
import { useDiningMode } from '../../../../context/DiningModeContext'
import { CartItem } from '../../../../../../../(select-product)/context/CartContext'
import { useTheme } from '@mui/material/styles'
import { useThemeCharger } from '../../../../../../../../../../contexts/ThemeCharger'
import {useTransactionEventTrigger} from "../../context/TransactionEventTriggerContext";
import {useSession} from "../../../../../../../../../../contexts/SessionProviderContext";
import {AxiosResponse} from "axios";
import {useEffect, useState} from "react";
import {useFunctionKeyCtx} from "../../../../../../../../../../contexts/FunctionKeyProviderContext";
import {useUserConfig} from "../../../../../../../../../../contexts/UserConfigContext";
import {TransactionBatchItem} from "../../../../../../../../../../types/transaction/batch/transaction.batch.item.type";
import {Transaction} from "../../../../../../../../../../types/transaction/transaction.type";
import {TransactionBatch} from "../../../../../../../../../../types/transaction/batch/transaction.batch.type";

const Billing = dynamic(() => import('../../../../../../../(select-product)'), { ssr: true })

const rupiah = (n: number | string) =>
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 })
        .format(typeof n === 'string' ? parseFloat(n) : n)

/* ===== Printer grouping ===== */
type PrinterBucket = { id: string; name: string; description: string; items: TransactionBatchItem[] }
function groupItemsByPrinter(items: TransactionBatchItem[]): PrinterBucket[] {
    const map = new Map<string, PrinterBucket>()
    items.forEach(it => {
        const cats: any[] = Array.isArray(it?.product?.category) ? (it as any).product.category : []
        const seen = new Set<string>()
        cats.forEach(c => {
            const printers: any[] = Array.isArray(c?.printer) ? c.printer : []
            printers.forEach(p => {
                const pid = String(p?.id ?? '')
                if (!pid || seen.has(pid)) return
                seen.add(pid)
                const name = String(p?.name ?? pid)
                const description = String(p?.description ?? pid)
                const bucket = map.get(pid) ?? { id: pid, name, description, items: [] }
                bucket.items.push(it)
                map.set(pid, bucket)
            })
        })
    })
    return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name))
}

const isApprovedVoid = (it: TransactionBatchItem) => Boolean(it?.void) && it.void!.is_approved === true
const isPendingVoid = (it: TransactionBatchItem) => Boolean(it?.void) && it.void!.is_approved !== true
/* ===== Merge helpers (UI only) ===== */
type MergedItem = { sample: TransactionBatchItem; qty: number; hasPending: boolean }
const keyOf = (it: TransactionBatchItem) => `${it.product?.id ?? ''}::${it.variant?.id ?? it.product?.id ?? ''}`

function mergeItemsByVariant(items: TransactionBatchItem[]): MergedItem[] {
    const rec = items.reduce((acc, it) => {
        const key = keyOf(it)
        const cur = acc[key]
        const q = Number(it.qty ?? 0)
        const pending = isPendingVoid(it)
        acc[key] = cur
            ? { sample: cur.sample, qty: cur.qty + q, hasPending: cur.hasPending || pending }
            : { sample: it, qty: q, hasPending: pending }
        return acc
    }, {} as Record<string, MergedItem>)
    return Object.values(rec)
}

const LeftContainerBatchListNewOrder: React.FC<{ transactionId: string }> = ({ transactionId }) => {
    const { txId, grandTotal, setGrandTotal, selectedBatchId, setSelectedBatchId, reloadKey, clearSelection, bumpReload } = useTx();
    const { bump } = useTransactionEventTrigger()
    const { set, config } = useUserConfig();
    const { key, seq } = useFunctionKeyCtx()
    const [swalProps, setSwalProps] = useState<SweetAlert2Props>({});
    const { setDefaultValue, setDisableOtherDefault } = useDiningMode();
    const { Session } = useSession();
    const [ transaction, setTransaction] = React.useState<undefined | Transaction>(undefined)
    const [open, setOpen] = React.useState(false)
    const [isLoading, setIsLoading] = React.useState(false)
    const [fullScreen, setFullScreen] = React.useState(false)

    // theme stuff
    const muiTheme = useTheme()
    const isDark = (muiTheme.palette as any)?.mode === 'dark' || (muiTheme.palette as any)?.colorScheme === 'dark'
    const { mode, toggleMode } = useThemeCharger()


    useEffect(() => {
        switch (key) {
            case "F3" :
                setOpen((prevState) => {
                    if (transaction?.time_closed !== null) return null;
                    prevState ? closeDialog() : openDialog();
                    return null;
                })
                break;
        }
    }, [seq]);

    React.useEffect(() => {
        if (!transactionId) {
            return setTransaction(undefined);
        }
        setIsLoading(true)
        // @ts-ignore
        window.api.invoke<{ id: string }, AxiosResponse<Transaction>>('api.transaction:read.one', {
            id: transactionId,
        })
            .then(({ data }) => {
                setTransaction(data);
            })
            .catch(() => setTransaction(undefined))
            .finally(() => setIsLoading(false))
    }, [transactionId, reloadKey])

    React.useEffect(() => {
        const id = transaction?.order_type?.id ?? null
        if (open && id) {
            setDefaultValue(id)
            setDisableOtherDefault(true)
        } else {
            setDefaultValue(null)
            setDisableOtherDefault(false)
        }
    }, [open, transaction])

// (opsional) extra safety saat unmount komponen
    React.useEffect(() => () => {
        setDefaultValue(null)
        setDisableOtherDefault(false)
    }, [])

    const openDialog = () => { setOpen(true) }
    const closeDialog = () => setOpen(false)

    // ⬇️ hide items yang approved void, tampilkan normal + pending
    const buckets = (batch : TransactionBatch) => {
        const visible = (batch.items || []).filter(it => !isApprovedVoid(it))
        return groupItemsByPrinter(visible)
    }
    const handlePrintAll = (batch : TransactionBatch) => {
        const bucketsToPrint = buckets(batch).filter(b => (b.items?.length ?? 0) > 0)
        if (!bucketsToPrint.length) return

        const tasks = bucketsToPrint.map((b) => {
            const itemIds = b.items.map(it => String(it.id))
            const payload = { printer: b.id, batch: batch.id, invoice: batch?.transaction?.invoice, itemIds, merge_variant: true }
            // @ts-ignore
            return window.api.invoke('api.transaction.batch:print', payload)
                .then((res: any) =>  {
                    /*setSwalProps({
                        show: true,
                        icon: "success",
                        theme: mode,
                        title: 'Successfully Sending Printer',
                        text: `${res.msg}`,
                    });*/
                    console.log({ ok: true, id: b.id })
                    return { ok: true, id: b.id }
                })
                .catch((err: any) => {
                    /*setSwalProps({
                        show: true,
                        icon: "error",
                        theme: mode,
                        title: 'Gagal Mencetak Otomatis',
                        text: `${err?.msg ?? 'Gagal Mencetak. Printer Offline / Error.'}`,
                    });*/
                    console.error({ ok: false, id: b.id })
                    return { ok: false, id: b.id }
                })
        })

        Promise.all(tasks).then(() => null);
    }

    const submitNewBatchTransaction = (item: CartItem[]) => {
        const itemRefactor = item.map((i) => ({
            ...i.variant,
            product: i.variant.product,
            variant: i.variant,
            note: i.note,
            qty: Number(i.qty),
            price: Number(i.price),
            sub_total: Number(i.price) * Number(i.qty),
        }))

        // @ts-ignore
        window.api.invoke<any, AxiosResponse<TransactionBatches>>('api.transaction.batch:create', {
            transaction: { id: txId },
            branch: Session.branches,
            reference: Session.id,
            items: itemRefactor,
        })
            .then(({ data }) => {
                // 3) set selection ke batch yang baru dibuat (opsional)
                bumpReload()
                bump('batch')
                bump('pay')
                clearSelection()
                if (config?.printer?.isPrintAutomatically) handlePrintAll(data);
                // 5) tutup dialog — layout di belakang tetap stay
                closeDialog()
            })
            .catch((error: any) => {
                console.error(error)
            })
    }

    return (
        <>
            {/* Trigger */}
            <Button
                size="medium"
                variant="contained"
                color={'success'}
                startIcon={<AddRounded />}
                disabled={Boolean(transaction?.time_closed !== null)}
                sx={(t) => {
                    const light = t.palette.mode === 'light'
                    return {
                        // --- BIG BUTTON vibes ---
                        textTransform:'none',
                        minHeight: 22,         // jumbo
                        fontSize: '0.8rem',   // ~20px
                        fontWeight: 900,
                        letterSpacing: .5,
                        borderRadius: 3,       // sudut mantap

                        // --- Warna adaptif mode ---
                        bgcolor: light ? '#000' : '#fff',
                        color:   light ? '#fff' : '#000',

                        // --- Hover/active states ---
                        '&:hover': {
                            bgcolor: light ? '#111' : '#f5f5f5',
                        },
                        '&:active': {
                            transform: 'translateY(1px)',
                            boxShadow: 'none',
                        },

                        // pastikan ikon ikut mewarisi warna
                        '& .MuiButton-startIcon': { mr: 1.25 }
                    }
                }}
                onClick={(e) => { e.stopPropagation(); openDialog() }}
            >
                {`Order Lagi`}
            </Button>

            {/* Dialog */}
            <Dialog
                open={open}
                onClose={closeDialog}
                fullWidth
                maxWidth="xl"
                fullScreen={fullScreen}
                slotProps={{
                    paper: {
                        sx: {
                            display: 'flex',
                            flexDirection: 'column',
                            height: fullScreen ? '100vh' : '85vh',
                            overflow: 'hidden',
                        },
                    }
                }}
            >
                <DialogTitle sx={{ display: 'flex', alignItems: 'center', pr: 1.5, gap: 1 }}>
                    <Typography variant="h6" fontWeight={800}>
                        Tambah Pesanan Untuk Transaksi {transaction?.invoice} — Batch Ke #{transaction?.batches?.length + 1}
                    </Typography>

                    {/* Header actions: Fullscreen, Theme, Close */}
                    <Stack direction="row" spacing={0.5} alignItems="center" sx={{ ml: 'auto' }}>
                        <IconButton
                            size="small"
                            onClick={(e) => { e.stopPropagation(); setFullScreen(v => !v) }}
                            aria-label={fullScreen ? 'Keluar layar penuh' : 'Layar penuh'}
                            title={fullScreen ? 'Keluar layar penuh' : 'Layar penuh'}
                        >
                            {fullScreen ? <FullscreenExitRounded fontSize="small" /> : <FullscreenRounded fontSize="small" />}
                        </IconButton>

                        <IconButton
                            size="small"
                            onClick={(e) => { e.stopPropagation(); toggleMode() }}
                            aria-label={isDark ? 'Ganti ke tema terang' : 'Ganti ke tema gelap'}
                            title={isDark ? 'Tema gelap' : 'Tema terang'}
                        >
                            {isDark ? <DarkModeRounded fontSize="small" /> : <LightModeRounded fontSize="small" />}
                        </IconButton>

                        <IconButton
                            size="small"
                            onClick={(e) => { e.stopPropagation(); closeDialog() }}
                            aria-label="Tutup"
                            title="Tutup"
                        >
                            <CloseRounded fontSize="small" />
                        </IconButton>
                    </Stack>
                </DialogTitle>

                <DialogContent dividers sx={{ p: 0, flex: 1, overflow: 'hidden' }}>
                    <Box sx={{ height: '100%', overflow: 'hidden' }}>
                        <Billing onSubmit={submitNewBatchTransaction} />
                    </Box>
                </DialogContent>
            </Dialog>
            <SweetAlert2 {...swalProps} />
        </>
    )
}

export default LeftContainerBatchListNewOrder
