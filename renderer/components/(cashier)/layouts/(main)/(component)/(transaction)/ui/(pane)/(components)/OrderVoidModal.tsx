'use client'

import * as React from 'react'
import {
    Button, Dialog, DialogTitle, DialogContent, DialogActions,
    Typography, Alert, TextField, Tooltip, IconButton
} from '@mui/material'
import type { ButtonProps, IconButtonProps } from '@mui/material'
import { DoneAllRounded, DeleteRounded } from '@mui/icons-material'
import { useTx } from '../context/TransactionContext'
import { useSession } from '../../../../../../../../../contexts/SessionProviderContext'
import {Transaction} from "../../types/api.transaction.type";


const rupiah = (n: number | string) =>
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 })
        .format(typeof n === 'string' ? parseFloat(n) : n)

const toButtonColor = (c: IconButtonProps['color']): ButtonProps['color'] =>
    c === 'default' ? 'primary' : (c as ButtonProps['color'])

export default function OrderVoidModal({ transaction } : { transaction?: Transaction }) {
    const { txId, selectedItemIds, selectedTotal, clearSelection, bumpReload } = useTx()
    const { Session } = useSession();
    const [open, setOpen] = React.useState(false)
    const [reason, setReason] = React.useState('')

    const isClosed = Boolean(transaction?.time_closed)
    const disabled = selectedItemIds.size === 0 || isClosed

    const kasirName = React.useMemo(() => {
        const n = transaction?.reference?.name
        return [n?.first_name, n?.last_name].filter(Boolean).join(' ') || '-'
    }, [transaction?.reference])

    const handleOpen  = () => setOpen(true)
    const handleClose = () => { setOpen(false); setReason('') }

    const handleConfirm = () => {
        return window.api.invoke('api.transaction.batch.item:update.many', {
            query : {
                ids: Array.from(selectedItemIds),
            },
            data: {
                void: {
                    reason: reason || undefined,
                }
            }
        })
            .then((result) => {
                console.log(result)
                clearSelection(); bumpReload(); handleClose()
            })
            .catch((error) => {
                console.error(error);
                clearSelection(); bumpReload(); handleClose()
            })
    }

    return (
        <>
            <Button
                variant="contained"
                size="large"
                startIcon={<DeleteRounded />}
                color={'error'}
                disabled={disabled}
                sx={(t) => {
                    const light = t.palette.mode === 'light'
                    return {
                        // --- BIG BUTTON vibes ---
                        textTransform:'none',
                        minHeight: 23,         // jumbo
                        fontSize: '1rem',   // ~20px
                        fontWeight: 900,
                        letterSpacing: .5,
                        borderRadius: 3,       // sudut mantap
                        py:1.1,
                        px:2.2,
                        // pastikan ikon ikut mewarisi warna
                        '& .MuiButton-startIcon': { mr: 1.25 }
                    }
                }}
                onClick={handleOpen}
            >
                Request Void
            </Button>

            <Dialog open={open} onClose={handleClose} fullWidth maxWidth="sm">
                <DialogTitle sx={{ fontWeight: 900 }}>Void Item Terpilih</DialogTitle>
                <DialogContent sx={{ pt: 1, display: 'grid', gap: 1.25 }}>
                    <Typography variant="body2" sx={{ m: 0, display: 'flex', alignItems: 'center', gap: 1 }}>
                        <DoneAllRounded fontSize="small" />
                        {selectedItemIds.size} item akan dibatalkan. Nilai total: <b>{rupiah(selectedTotal)}</b>
                    </Typography>

                    <Alert severity="warning" variant="outlined">
                        <Typography variant="body2">
                            Saya <b>{kasirName}</b> yang bertugas pada <b>{transaction?.shift?.name ?? '-'}</b> ingin mengajukan void
                            dengan alasan di bawah ini. Segala macam risiko yang timbul akan menjadi tanggung jawab saya selama bertugas.
                            Yakin ingin mengajukan void?
                        </Typography>
                    </Alert>

                    <TextField
                        autoFocus
                        margin="dense"
                        label="Alasan pembatalan (opsional)"
                        fullWidth
                        multiline
                        minRows={2}
                        value={reason}
                        onChange={(e)=>setReason(e.target.value)}
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleClose} sx={{ textTransform:'none' }}>Batal</Button>
                    <Button onClick={handleConfirm} color="error" variant="contained" sx={{ textTransform:'none', fontWeight:800 }}>
                        Void
                    </Button>
                </DialogActions>
            </Dialog>
        </>
    )
}
