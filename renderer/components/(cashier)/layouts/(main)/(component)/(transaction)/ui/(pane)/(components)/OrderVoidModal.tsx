'use client'

import * as React from 'react'
import {
    Button, Dialog, DialogTitle, DialogContent, DialogActions,
    Typography, Alert, TextField, Tooltip, IconButton
} from '@mui/material'
import type { ButtonProps, IconButtonProps } from '@mui/material'
import { DoneAllRounded, DeleteRounded } from '@mui/icons-material'
import { useTx } from '../context/TransactionContext'

type Props = {
    /** Render trigger sebagai icon-only (opsional, default false). Untuk sekarang kita pakai teks. */
    iconOnly?: boolean
    /** Mode icon-only: 'icon' | 'contained' */
    iconMode?: 'icon' | 'contained'
    tooltip?: React.ReactNode
    icon?: React.ReactElement
    /** Boleh 'default' (ikut IconButton). Nanti dinormalisasi ke Button saat contained. */
    color?: IconButtonProps['color']
    size?: 'small' | 'medium' | 'large'
    /** Variant tombol jika bukan iconOnly. Default: 'contained' */
    buttonVariant?: 'outlined' | 'contained' | 'text'
    /** Label tombol jika bukan iconOnly. Default: 'Void' */
    label?: string
    /** Ukuran tombol (px) saat iconOnly + contained. Default: 56 (lebih kecil karena sekarang pakai teks by default) */
    buttonSizePx?: number
    /** Ukuran font ikon (px). Default: 36 (≈1.5x) */
    iconFontSizePx?: number
}

const rupiah = (n: number | string) =>
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 })
        .format(typeof n === 'string' ? parseFloat(n) : n)

const toButtonColor = (c: IconButtonProps['color']): ButtonProps['color'] =>
    c === 'default' ? 'primary' : (c as ButtonProps['color'])

export default function OrderVoidModal({
                                           iconOnly = false,
                                           iconMode = 'icon',
                                           tooltip = 'Ajukan Void Item Terpilih',
                                           icon,
                                           color = 'error',
                                           size = 'large',
                                           buttonVariant = 'contained',
                                           label = 'Void',
                                           buttonSizePx = 56,
                                           iconFontSizePx = 36,
                                       }: Props) {
    const { header, txId, selectedItemIds, selectedTotal, clearSelection, bumpReload } = useTx()

    const [open, setOpen] = React.useState(false)
    const [reason, setReason] = React.useState('')

    const isClosed = Boolean(header.time_closed)
    const disabled = selectedItemIds.size === 0 || isClosed

    const kasirName = React.useMemo(() => {
        const n = header.reference?.name
        return [n?.first_name, n?.last_name].filter(Boolean).join(' ') || '-'
    }, [header.reference])

    const handleOpen  = () => setOpen(true)
    const handleClose = () => { setOpen(false); setReason('') }

    const handleConfirm = () =>
        // @ts-ignore – sesuaikan channel IPC kalau namanya beda
        window.api.invoke('api.transaction.item:void', {
            transaction_id: txId,
            item_ids: Array.from(selectedItemIds),
            reason: reason || undefined,
        })
            .then(() => { clearSelection(); bumpReload(); handleClose() })
            .catch(() => {})

    const triggerIcon = icon ?? <DeleteRounded />

    const Trigger = iconOnly ? (
        <Tooltip title={tooltip} arrow>
      <span>
        {iconMode === 'contained' ? (
            <Button
                variant="contained"
                color={toButtonColor(color)}
                disabled={disabled}
                onClick={handleOpen}
                size={size}
                sx={{ minWidth: 0, width: buttonSizePx, height: buttonSizePx, borderRadius: 2, p: 0 }}
            >
                {React.cloneElement(triggerIcon, { sx: { fontSize: iconFontSizePx } })}
            </Button>
        ) : (
            <IconButton
                color={color}
                disabled={disabled}
                onClick={handleOpen}
                size={size}
                sx={{ borderRadius: 2 }}
            >
                {React.cloneElement(triggerIcon, { sx: { fontSize: iconFontSizePx } })}
            </IconButton>
        )}
      </span>
        </Tooltip>
    ) : (
        <Button
            variant={buttonVariant}
            color={toButtonColor(color)}
            disabled={disabled}
            onClick={handleOpen}
            size="large"
            startIcon={React.cloneElement(triggerIcon, { sx: { fontSize: iconFontSizePx } })}
            sx={{ textTransform: 'none', fontWeight: 800, borderRadius: 2, py: 1.1, px: 2 }}
        >
            {label}
        </Button>
    )

    return (
        <>
            {Trigger}

            <Dialog open={open} onClose={handleClose} fullWidth maxWidth="sm">
                <DialogTitle sx={{ fontWeight: 900 }}>Void Item Terpilih</DialogTitle>
                <DialogContent sx={{ pt: 1, display: 'grid', gap: 1.25 }}>
                    <Typography variant="body2" sx={{ m: 0, display: 'flex', alignItems: 'center', gap: 1 }}>
                        <DoneAllRounded fontSize="small" />
                        {selectedItemIds.size} item akan dibatalkan. Nilai total: <b>{rupiah(selectedTotal)}</b>
                    </Typography>

                    <Alert severity="warning" variant="outlined">
                        <Typography variant="body2">
                            Saya <b>{kasirName}</b> yang bertugas pada <b>{header.shift?.name ?? '-'}</b> ingin mengajukan void
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
