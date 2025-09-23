'use client'

import * as React from 'react'
import {
    Button,
    Badge,
    Tooltip,
    Dialog,
    DialogTitle,
    DialogContent,
    Box, Paper, Stack, Typography, IconButton,
} from '@mui/material'
import CallSplitRounded from '@mui/icons-material/CallSplitRounded'
import ReceiptLongRounded from '@mui/icons-material/ReceiptLongRounded'
import type { ButtonProps } from '@mui/material'
import { useTx } from '../context/TransactionContext'
import {useEffect, useMemo, useState} from "react";
import normalizeIpcError from "../../../../../../../../../helpers/electronMessageErrorEsctration";
import InfoOutlined from "@mui/icons-material/InfoOutlined";
import FullscreenExitRounded from "@mui/icons-material/FullscreenExitRounded";
import FullscreenRounded from "@mui/icons-material/FullscreenRounded";
import DarkModeRounded from "@mui/icons-material/DarkModeRounded";
import LightModeRounded from "@mui/icons-material/LightModeRounded";
import CloseRounded from "@mui/icons-material/CloseRounded";
import {useTheme} from "@mui/material/styles";
import {useThemeCharger} from "../../../../../../../context/ThemeCharger";
import dynamic from "next/dynamic";
import {useTabNavigationHandlerContext} from "../../../context/TabNavigationHandlerContext";
import ReplayRounded from "@mui/icons-material/ReplayRounded";

const BillListItemDetail = dynamic(() => import('./../../../../(bills)/ui/(pane)/BillsListItemDetail'), { ssr: true })

const ErrorDataLayout: React.FC<{ status: boolean, code: number | string, msg : string, raw ?: any, extra ?: any}> = ({ status, code, msg, raw, extra }) => {
    const { state, setState } = useTabNavigationHandlerContext();

    return (
        <Box sx={{ height: '100%', display: 'grid', placeItems: 'center', p: 2 }}>
            <Paper
                elevation={0}
                sx={(t) => ({
                    maxWidth: 640,
                    width: '100%',
                    p: 3,
                    border: '1px dashed',
                    borderColor: 'divider',
                    bgcolor: t.palette.mode === 'dark' ? 'background.default' : 'background.paper',
                    textAlign: 'center',
                })}
            >
                <Stack spacing={1.25} alignItems="center">
                    <InfoOutlined color="info" sx={{ fontSize: 36 }} />
                    <Typography variant="h6" fontWeight={900}>
                        Harap Selesaikan Tagihan Terakhir
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        { msg }
                    </Typography>
                    {
                        code === 402 && (
                            <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                                <Button
                                    onClick={() =>
                                        setState((prev) => ({ ...prev, active: "bills", id: extra?.data?.id ?? undefined }))
                                    }
                                    variant="outlined"
                                    sx={{ textTransform: 'none', fontWeight: 800, borderRadius: 1.5 }}
                                >
                                    Menuju Ke Tagihan ({extra?.data?.number ?? '-'})
                                </Button>
                            </Box>
                        )
                    }
                </Stack>
            </Paper>
        </Box>
    )
}

type Props = {
    /** Array item yang akan dibuatkan tagihan (terpilih / keseluruhan) */
    items: string[]
    /** 'split' = buat tagihan dari item terpilih; 'full' = buat tagihan keseluruhan (berdasarkan items[] juga) */
    mode: 'split' | 'full'
    /** Optional: override label tombol (default: "Buat Tagihan") */
    label?: string
    /** Optional: dipanggil setelah sukses */
    onSuccess?: () => void
    /** Optional: tombol variant (default: 'contained') */
    variant?: ButtonProps['variant']
}

/**
 * Komponen tombol "Buat Tagihan" + PREVIEW modal BillListItemDetail
 * - mode='split' -> kirim item_ids dari props.items ke 'api.transaction:split_bill'
 * - mode='full'  -> kirim item_ids dari props.items ke channel pembayaran full-by-items
 * - Badge jumlah item hanya ditampilkan saat mode='split'
 */
export default function NewOrderBillModal({ items, mode, label = 'Buat Tagihan', onSuccess, variant = 'contained' }: Props) {
    const { header, txId, bumpReload, clearSelection } = useTx();
    const isClosed = Boolean(header?.time_closed)

    // ==== GUARD: block kalau ada bill existing & paid.is_paid !== true ====
    // Cover berbagai bentuk paid: boolean, object { is_paid | status }, atau null
    const isPaidBool = (p: any) =>
        p === true || p?.is_paid === true || p?.status === true

    const hasBills = Array.isArray((header as any)?.bills) && (header as any).bills.length > 0
    const hasPaidField = typeof (header as any)?.paid !== 'undefined' && (header as any)?.paid !== null
    const blockedByUnpaidBill = hasBills && hasPaidField && !isPaidBool((header as any)?.paid)

    // default: tertutup, biar nggak auto kebuka pas reload
    const [open, setOpen] = React.useState(false)
    const [fullScreen, setFullScreen] = useState(false)
    const theme = useTheme()
    const isDark = (theme.palette as any)?.mode === 'dark' || (theme.palette as any)?.colorScheme === 'dark'
    const { toggleMode } = useThemeCharger()

    const isSplitMode = mode === 'split'
    const baseIcon = isSplitMode ? <CallSplitRounded sx={{ fontSize: 36 }} /> : <ReceiptLongRounded sx={{ fontSize: 36 }} />
    const color: ButtonProps['color'] = blockedByUnpaidBill ? 'error' : (isSplitMode ? 'warning' : 'success')

    const [ transactionBatchItems, setTransactionBatchItems] = React.useState<Array<any>>([])
    const [ layoutPaper, setLayoutPaper ] = React.useState<React.ReactNode>(<></>)

    // dua mode sama-sama butuh items
    const disabled = isClosed || items.length === 0 || blockedByUnpaidBill

    const tooltip = blockedByUnpaidBill
        ? 'Tidak bisa membuat tagihan: ada tagihan sebelumnya yang belum lunas.'
        : `Buat Tagihan (${isSplitMode ? 'Split' : 'Keseluruhan'}) — ${items.length} item`

    const openWithUnpaidBillNotice = () => {
        const firstBill = (header as any)?.bills?.[0] ?? null
        setLayoutPaper(
            <ErrorDataLayout
                status={false}
                code={402}
                msg={'Terdapat tagihan belum lunas untuk transaksi ini. Selesaikan dahulu sebelum membuat tagihan baru.'}
                extra={{ data: firstBill }}
            />
        )
        setOpen(true)
    }

    const handleOpen = () => {
        if (isClosed || items.length === 0) return
        if (blockedByUnpaidBill) return openWithUnpaidBillNotice()
        setOpen(true)
    }
    const handleClose = () => setOpen(false)

    const onClickCreateBilling = () => handleOpen()

    // Fetch items saat modal dibuka & tidak diblok
    useEffect(() => {
        if (!open || blockedByUnpaidBill) return
        window?.api?.invoke?.("api.transaction.batch.item:read.all", { ids : items })
            .then((onSuccessGetItem: any) => {
                setLayoutPaper(<></>)
                setTransactionBatchItems(onSuccessGetItem?.data ?? [])
            })
            .catch((error: any) => {
                setTransactionBatchItems([])
                const e = normalizeIpcError(error)
                setLayoutPaper(<ErrorDataLayout { ...e } />)
            })
    }, [open, blockedByUnpaidBill, items])

    // Setelah items didapat, buat bill -> tampilkan preview
    useEffect(() => {
        if (!open || blockedByUnpaidBill || transactionBatchItems.length === 0) return

        const arrayTramsactionBatchRefactor = transactionBatchItems.map((it: any) => {
            const { id, ...rest } = it
            return { ...rest, transactionItem: { id } }
        })

        const payload = {
            reference: {id: "00000000-0000-5000-a000-000000000000"},
            branch: [{id: "00000000-0000-5000-a000-000000000000"}],
            transaction: {id: txId},
            number: Date.now(),
            items: arrayTramsactionBatchRefactor
        }

        window?.api?.invoke?.("api.transaction.bills:create", payload)
            .then((result: any) => {
                setLayoutPaper(<BillListItemDetail bill={result.data} />)
                bumpReload();
            })
            .catch((error: any) => {
                const e = normalizeIpcError(error)
                setLayoutPaper(<ErrorDataLayout { ...e } />)
            })
    }, [transactionBatchItems, open, blockedByUnpaidBill, txId])

    const ButtonEl = (
        <Button
            variant={variant}
            color={color}
            disabled={disabled}
            onClick={onClickCreateBilling}
            size="large"
            startIcon={baseIcon}
            sx={{ textTransform: 'none', fontWeight: 800, borderRadius: 2, py: 1.1, px: 2.2 }}
        >
            {label}
        </Button>
    )

    return (
        <>
            <Tooltip title={tooltip} arrow>
                <span>
                    {isSplitMode ? (
                        <Badge
                            color={blockedByUnpaidBill ? 'error' : 'warning'}
                            badgeContent={items.length}
                            invisible={items.length === 0}
                            anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
                            overlap="rectangular"
                            sx={{ '& .MuiBadge-badge': { fontWeight: 800 } }}
                        >
                            {ButtonEl}
                        </Badge>
                    ) : ButtonEl}
                </span>
            </Tooltip>

            {/* ==================== MODAL PREVIEW / NOTICE ==================== */}
            <Dialog
                open={open}
                fullWidth
                maxWidth="xl"
                fullScreen={fullScreen}
                onClose={(event, reason) => {
                    if (reason === 'backdropClick' || reason === 'escapeKeyDown') return
                    handleClose()
                }}
                disableEscapeKeyDown
                slotProps={{
                    paper: {
                        sx: {
                            display: 'flex',
                            flexDirection: 'column',
                            height: fullScreen ? '100vh' : '85vh',
                            overflow: 'hidden',
                            transition: (t) => t.transitions.create('height', { duration: t.transitions.duration.standard }),
                        }
                    }
                }}
                PaperProps={{ sx: { height: { xs: '90vh', md: '85vh' } } }}
            >
                <DialogTitle sx={{ display: 'flex', alignItems: 'center', pr: 1.5, gap: 1 }}>
                    <Typography variant="h6" fontWeight={800}>
                        {blockedByUnpaidBill ? 'Tagihan Belum Lunas Ditemukan' : (isSplitMode ? 'Preview Tagihan (Split)' : 'Preview Tagihan (Keseluruhan)')}
                    </Typography>

                    <Stack direction="row" spacing={0.5} alignItems="center" sx={{ ml: 'auto' }}>
                        <IconButton size="small" onClick={() => setFullScreen(v => !v)} aria-label={fullScreen ? 'Keluar layar penuh' : 'Layar penuh'}>
                            {fullScreen ? <FullscreenExitRounded fontSize="small" /> : <FullscreenRounded fontSize="small" />}
                        </IconButton>

                        <IconButton size="small" onClick={() => toggleMode()} aria-label={isDark ? 'Ganti ke tema terang' : 'Ganti ke tema gelap'}>
                            {isDark ? <DarkModeRounded fontSize="small" /> : <LightModeRounded fontSize="small" />}
                        </IconButton>

                        <IconButton size="small" onClick={handleClose} aria-label="Tutup">
                            <CloseRounded fontSize="small" />
                        </IconButton>
                    </Stack>
                </DialogTitle>

                <DialogContent dividers sx={{ p: 0, display: 'flex', flexDirection: 'column' }}>
                    <Box sx={{ flex: 1, minHeight: 0 }}>
                        { layoutPaper }
                    </Box>
                </DialogContent>
            </Dialog>

            {/* ==================== TETAPKAN KODE KOMENTARMU — TIDAK DIHAPUS ==================== */}
            {/*
      if (isSplitMode) {
          // Split bill berdasarkan item terpilih
          // @ts-ignore
          const payload = {
              transaction_id: txId,
              item_ids: itemIds,
          };
          console.table(payload)
          !*window.api.invoke('api.transaction:split_bill', {
              transaction_id: txId,
              item_ids: itemIds,
          })
              .then(() => { bumpReload(); onSuccess?.() })
              .catch(() => {})*!
      } else {
          // FULL bill berbasis daftar item (BUKAN selectedBatch)
          // NOTE: sesuaikan dengan channel backend kamu untuk "pay by items"
          // contoh nama lain yang mungkin kamu pakai:
          //  - 'api.payment:items.pay'
          //  - 'api.transaction:make_bill'
          //  - 'api.transaction.items:pay'
          // @ts-ignore
          window.api.invoke('api.payment:items.pay', {
              transaction_id: txId,
              item_ids: itemIds,
          })
              .then(() => { bumpReload(); onSuccess?.() })
              .catch(() => {})
      }
      */}
        </>
    )
}
