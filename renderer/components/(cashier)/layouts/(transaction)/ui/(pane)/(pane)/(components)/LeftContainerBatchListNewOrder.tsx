'use client'

import * as React from 'react'
import {
    Box, Button, Chip, Dialog, DialogTitle, DialogContent, DialogActions,
    Stack, TextField, Typography, IconButton, Divider, Paper
} from '@mui/material'
import AddRounded from '@mui/icons-material/AddRounded'
import CloseRounded from '@mui/icons-material/CloseRounded'
import dynamic from "next/dynamic";
import {useTx} from "../../context/TransactionContext";
import {Batch, TransactionHeader} from "../LeftContainerBatchList";
import {useDiningMode} from "../../../../context/DiningModeContext";
import {useEffect} from "react";
import {CartItem} from "../../../../../(billing)/context/CartContext";
import { useLayoutManipulatorResizable } from '../../../../../../../../contexts/LayoutManipulatorResizableContext'
import TransactionListItem from '../../TransactionListItem'

const Billing = dynamic(() => import("../../../../../(billing)"), {
    ssr: true,
})

const rupiah = (n: number | string) =>
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 })
        .format(typeof n === 'string' ? parseFloat(n) : n)

const LeftContainerBatchListNewOrder: React.FC<{tx : string }> = ({ tx }) => {
    const { txId, setTxId, header, setHeader, selectedBatchId, setSelectedBatchId, reloadKey } = useTx()
    const { setDefaultValue, setDisableOtherDefault } = useDiningMode();
    const [batches, setBatches] = React.useState<Batch[]>([])
    const isClosed = Boolean(header?.time_closed)
    const [open, setOpen] = React.useState(false)

    useEffect(() => {
        setDefaultValue(header.order_type.id);
        setDisableOtherDefault(true);
        return () => {
            setDefaultValue(header.order_type.id);
            setDisableOtherDefault(false);
        }
    }, [header]);

    const openDialog = () => {
        console.log(header);
        setOpen(true)
    }
    const closeDialog = () => setOpen(false)


    const submitNewBatchTransaction = (item : CartItem[]) => {
        console.table(item);
        const itemRefactor = item.map((item) => {
            return {
                ...item.variant,
                product: item.variant.product,
                variant: item.variant,
                qty : Number(item.qty),
                price: Number(item.price),
                sub_total: Number(Number(item.price) * Number(item.qty))
            }
        });
        console.table(itemRefactor)
        window.api.invoke('api.transaction.batch:create', {
            transaction: {
                id: txId
            },
            branch: {
              id : header
            },
            reference: header.reference,
            batch: batches.length + 1,
            items: itemRefactor,
        })
            .then((res) => {
                closeDialog();
                setTxId(tx);
                console.log(res)
            })
            .catch((error) => {
                console.error(error)
            })
    }

    // fetch semua batch utk transaksi ini
    React.useEffect(() => {
        if (!txId) { setBatches([]); return }
        // @ts-ignore
        window.api.invoke('api.transaction.batch:read.all', { transaction: txId })
            .then((res: any) => {
                const list = (res?.data ?? []) as any[]
                const t = list[0]?.transaction
                setHeader({
                    ...t
                })
                const mapped: Batch[] = list.map(b => ({
                    id: String(b.id),
                    batch: Number(b.batch),
                    note: b.note ?? null,
                    time_created: b.time_created,
                    time_updated: b.time_updated,
                    items: Array.isArray(b.items) ? b.items : [],
                }))
                setBatches(mapped)
                if (!selectedBatchId && mapped.length) setSelectedBatchId(mapped[0].id)
            })
            .catch(() => setBatches([]))
    }, [txId, reloadKey]) // refetch on reload/bayar/split

    return (
        <>
            {/* Trigger Button (ganti posisi tombol lamamu dengan ini) */}
            <Button
                size="small"
                variant="outlined"
                startIcon={<AddRounded />}
                disabled={Boolean(isClosed)}
                onClick={(e) => { e.stopPropagation(); openDialog() }}
            >
                {`Pesanan Meja ${header?.table?.code ?? '—'}`}
            </Button>

            {/* Dialog MD */}
            <Dialog
                open={open}
                onClose={closeDialog}
                fullWidth
                maxWidth="xl"
                slotProps={{
                    paper : {
                        sx: {
                            display: 'flex',
                            flexDirection: 'column',
                            height: '85vh',      // ⬅️ kasih tinggi deterministik
                            overflow: 'hidden',
                        },
                    }
                }}
            >
                <DialogTitle sx={{ display: 'flex', alignItems: 'center', pr: 1.5 }}>
                    <Typography variant="h6" fontWeight={800}>Tambah Pesanan Untuk Transaksi {header.invoice}  - Batch Ke #{batches.length + 1}</Typography>
                    <Box sx={{ ml: 'auto' }}>
                        <IconButton onClick={closeDialog} size="small">
                            <CloseRounded fontSize="small" />
                        </IconButton>
                    </Box>
                </DialogTitle>

                <DialogContent
                    dividers
                    sx={{ p: 0, flex: 1, overflow: 'hidden' }} // ⬅️ biar isi ikut tinggi Paper
                >
                    {/* Hindari nested Paper yang bikin height auto; kalau mau, pastikan 100% */}
                    <Box sx={{ height: '100%', overflow: 'hidden' }}>
                        <Billing onSubmit={submitNewBatchTransaction} />
                    </Box>
                </DialogContent>
            </Dialog>

        </>
    )
}

export default LeftContainerBatchListNewOrder
