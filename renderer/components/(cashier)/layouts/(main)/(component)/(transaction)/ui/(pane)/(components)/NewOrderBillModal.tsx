'use client'

import * as React from 'react'
import {
    Button, Badge, Tooltip, Dialog, DialogTitle, DialogContent,
    Box, Paper, Stack, Typography, IconButton, CircularProgress,
    GlobalStyles
} from '@mui/material'
import CallSplitRounded from '@mui/icons-material/CallSplitRounded'
import ReceiptLongRounded from '@mui/icons-material/ReceiptLongRounded'
import type { ButtonProps } from '@mui/material'
import { useTx } from '../context/TransactionContext'
import normalizeIpcError from '../../../../../../../../../helpers/electronMessageErrorEsctration'
import InfoOutlined from '@mui/icons-material/InfoOutlined'
import FullscreenExitRounded from '@mui/icons-material/FullscreenExitRounded'
import FullscreenRounded from '@mui/icons-material/FullscreenRounded'
import DarkModeRounded from '@mui/icons-material/DarkModeRounded'
import LightModeRounded from '@mui/icons-material/LightModeRounded'
import CloseRounded from '@mui/icons-material/CloseRounded'
import { useTheme } from '@mui/material/styles'
import { useThemeCharger } from '../../../../../../../../../contexts/ThemeCharger'
import dynamic from 'next/dynamic'
import { useTabNavigationHandlerContext } from '../../../context/TabNavigationHandlerContext'
import { useTransactionEventTrigger } from "../context/TransactionEventTriggerContext";
import { useSession } from "../../../../../../../../../contexts/SessionProviderContext";
import SweetAlert2, { SweetAlert2Props } from "react-sweetalert2";
import { useGodModeProvider } from "../../../../../../../context/GodModeProviderContext";
import {useEffect} from "react";
import {ConfigBranch} from "../../../../../../../../../types/config/base/branch.type";
import { TransactionBill } from '../../../../../../../../../types/transaction/bill/transaction.bill.type'
import {TransactionBatchItem} from "../../../../../../../../../types/transaction/batch/transaction.batch.item.type";
import {Transaction} from "../../../../../../../../../types/transaction/transaction.type";

// ⬇️ opsional: hindari reuse SSR
const BillListItemDetail = dynamic(
    () => import('./../../../../(bills)/ui/(pane)/BillsListItemDetail'),
    { ssr: false }
)

/* ---------- Mini error UI ---------- */
const ErrorDataLayout: React.FC<{
    status: boolean, code: number | string, msg: string, raw?: any, extra?: any
}> = ({ code, msg, extra }) => {
    const { setState } = useTabNavigationHandlerContext()
    return (
        <Box sx={{ height: '100%', display: 'grid', placeItems: 'center', p: 2 }}>
            <Paper elevation={0} sx={(t) => ({
                maxWidth: 640, width: '100%', p: 3, border: '1px dashed', borderColor: 'divider',
                bgcolor: t.palette.mode === 'dark' ? 'background.default' : 'background.paper', textAlign: 'center'
            })}>
                <Stack spacing={1.25} alignItems="center">
                    <InfoOutlined color="info" sx={{ fontSize: 36 }} />
                    <Typography variant="h6" fontWeight={900}>Gagal membuat Tagihan</Typography>
                    <Typography variant="body2" color="text.secondary">{msg} (code {code})</Typography>
                    {code === 402 && (
                        <Button
                            onClick={() => setState(prev => ({ ...prev, active: 'bills', id: extra?.data?.id ?? undefined }))}
                            variant="outlined" sx={{ textTransform: 'none', fontWeight: 800, borderRadius: 1.5 }}
                        >
                            Buka Tagihan
                        </Button>
                    )}
                </Stack>
            </Paper>
        </Box>
    )
}

type Props = {
    items: string[]
    itemsGod: string[]
    mode: 'split' | 'full'
    label?: string
    variant?: ButtonProps['variant']
    transaction: Transaction
}

export default function NewOrderBillModal({ items, itemsGod, mode, label = 'Buat Tagihan', variant = 'contained', transaction }: Props) {
    const themes = useThemeCharger()
    const { godMode } = useGodModeProvider()
    const { bumpReload, clearSelection, clearSelectionGods } = useTx()
    const { bump } = useTransactionEventTrigger()
    const { Session } = useSession()

    const [err, setErr] = React.useState<{ status: boolean; code: number | string; msg: string; extra?: any } | null>(null);
    const [swalProps, setSwalProps] = React.useState<SweetAlert2Props>({})
    const [transactionBill, setTransactionBill] = React.useState<TransactionBill | undefined>(undefined)
    const [open, setOpen] = React.useState(false)
    const [loading, setLoading] = React.useState(false)

    // ==== Anti-race guard ====
    const reqIdRef = React.useRef(0)
    const openRef  = React.useRef(false)

    // ==== Snapshot payload ====
    const payloadRef = React.useRef<{
        txId?: string
        items: string[]
        itemsGod: string[]
        sessionId?: string
        branches?: ConfigBranch[]
    } | null>(null)

    // ==== Session timing & last ID (NEW) ====
    const openedAtRef     = React.useRef<number>(0)
    const lastBillIdRef   = React.useRef<string | undefined>(undefined)
    const didRetryRef     = React.useRef<boolean>(false)

    const [fullScreen, setFullScreen] = React.useState(false)
    const theme = useTheme()
    const isDark = (theme.palette as any)?.mode === 'dark' || (theme.palette as any)?.colorScheme === 'dark'

    const isSplitMode = mode === 'split'
    const baseIcon = isSplitMode ? <CallSplitRounded sx={{ fontSize: 36 }} /> : <ReceiptLongRounded sx={{ fontSize: 36 }} />
    const color: ButtonProps['color'] = (isSplitMode ? 'warning' : 'success')

    // ——— Button enable/tooltip
    const isClosed = Boolean(transaction?.time_closed)
    const disabled = isClosed || items.length === 0
    const tooltip = `Buat Tagihan (${isSplitMode ? 'Split' : 'Keseluruhan'}) — ${items.length} item`

    // helper: relaxed checksum (variantId→totalQty)
    const foldKey = <T extends { variant?: { id?: string }, productVariant?: { id?: string }, qty?: any }>(arr: T[]) =>
        Object.entries(
            (arr ?? []).reduce<Record<string, number>>((acc, d) => {
                const id = String(d?.variant?.id ?? d?.productVariant?.id ?? '')
                const q  = Number(d?.qty ?? 0) || 0
                acc[id] = (acc[id] || 0) + q
                return acc
            }, {})
        )
            .sort((a,b) => a[0].localeCompare(b[0]))
            .map(([id, q]) => `${id}:${q}`)
            .join('|')

    /* ---------- OPEN ---------- */
    const handleOpen = () => {
        if (disabled) return

        payloadRef.current = {
            txId: transaction?.id,
            items: [...items],
            itemsGod: [...itemsGod],
            sessionId: Session?.id,
            branches: Session?.branches ?? [],
        }

        openedAtRef.current = Date.now()
        didRetryRef.current = false

        reqIdRef.current += 1
        openRef.current = true
        setTransactionBill(undefined)
        setErr(null)
        setLoading(true)
        setOpen(true)
    }

    /* ---------- CLOSE ---------- */
    const closeWithDialog = React.useCallback(() => {
        setSwalProps({
            show: true,
            icon: 'warning',
            title: 'Yakin Ingin Menutup Bill Ini ?',
            text: 'Dengan Menutup Dialog Ini Berarti Bill Akan Berubah Menjadi Unpaid, perlu dibayar Manual. Kecuali Anda Menekan "Cancel Bill". Lanjutkan ?',
            showConfirmButton: true,
            confirmButtonText: 'Ya',
            showCancelButton: true,
            cancelButtonText: 'Batal',
            theme: themes.mode,
            reverseButtons: true,          // UX: Bikin Cancel di kiri, Confirm di kanan (atau kebalikan sesuai selera)
            allowOutsideClick: false,      // cegah klik luar nutup alert
            allowEscapeKey: false,         // cegah ESC nutup alert
            didOpen: (popupEl) => {
                const container = (popupEl as HTMLElement)?.closest('.swal2-container') as HTMLElement | null;
                container?.style.setProperty('z-index', '20000', 'important'); // top-most
            },
            // satu pintu handler: bedakan confirm vs cancel di sini
            onResolve: (result: { isConfirmed: any; isDismissed: any }) => {
                if (result?.isConfirmed) {
                    // === onConfirm ===
                    handleClose()
                } else if (result?.isDismissed) {
                    // === onCancel ===
                    // default: tidak melakukan apa-apa (dialog utama tetap terbuka)
                    // optional: kasih info kecil kalau perlu
                    // toast.info('Dibatalkan. Bill tetap seperti semula.')
                }
            },
        });

    }, [themes])

    const handleClose = React.useCallback(() => {
        // === onConfirm ===
        openRef.current = false;
        setOpen(false);
        setErr(null);
        setTransactionBill(undefined);
        setLoading(false);
        bump('split');
        bumpReload();
        clearSelection();
        clearSelectionGods();
    }, [])

    // helper: create bill sekali jalan
    const createBillOnce = (snap: NonNullable<typeof payloadRef.current>, myReq: number, expectedKey: string) =>
        window.api.invoke<typeof snap, { data: TransactionBatchItem[] }>(
            'api.transaction.batch.item:read.all',
            // @ts-ignore
            { ids: snap.items, transaction: snap.txId }
        )
            .then(({ data }) => {
                if (!openRef.current || myReq !== reqIdRef.current) return Promise.reject({ cancelled: true })
                const BillTemporary: TransactionBill = {
                    reference: { id: snap.sessionId },
                    branch: snap.branches ?? [],
                    transaction: { id: snap.txId },
                    tax: 0.10,
                    items: data.map((it) => ({
                        reference: { id: snap.sessionId },
                        qty: it.qty,
                        price: it.price,
                        sub_total: it.sub_total,
                        productVariant: it.variant,
                        status: !godMode ? snap.itemsGod.some((id) => id === it.id) : true
                    })),
                    paid: { status: false }
                }
                return window.api.invoke<typeof BillTemporary, { data: TransactionBill }>(
                    'api.transaction.bills:create',
                    BillTemporary
                )
            })
            .then(({ data }) => {
                if (!openRef.current || myReq !== reqIdRef.current) return Promise.reject({ cancelled: true })

                // ==== STALE GUARD: tolak jika ID sama dgn sesi sebelumnya ATAU terlalu tua dari waktu open ====
                const idSameAsLast = data?.id && data.id === lastBillIdRef.current
                const createdAtMs  = data?.time_created ? new Date(data.time_created).getTime() : Date.now()
                const tooOld       = createdAtMs + 500 < openedAtRef.current // toleransi 500ms

                if (idSameAsLast || tooOld) return Promise.reject({ stale: true, reason: idSameAsLast ? 'same_id_as_last' : 'older_than_open' })

                // boleh longgar terhadap checksum (server bisa merge)
                setTransactionBill(data)
                lastBillIdRef.current = data?.id
                setLoading(false)
            })

    React.useEffect(() => {
        if (!open) return

        const myReq = reqIdRef.current
        const snap  = payloadRef.current

        if (!snap?.txId || (snap.items?.length ?? 0) === 0) { setLoading(false); return }

        setTransactionBill(undefined)
        setErr(null)
        setLoading(true)

        // siapkan expectedKey (santai)
        window.api.invoke<{ ids?: string[]; transaction?: string }, { data: TransactionBatchItem[] }>(
            'api.transaction.batch.item:read.all',
            { ids: snap.items, transaction: snap.txId }
        )
            .then(({ data }) => {
                if (!openRef.current || myReq !== reqIdRef.current) return Promise.reject({ cancelled: true })
                const expectedKey = foldKey(data ?? [])
                return createBillOnce(snap, myReq, expectedKey)
                    .catch((err) => {
                        // sekali retry kalau stale
                        if (err?.stale && !didRetryRef.current) {
                            didRetryRef.current = true
                            return new Promise((r) => setTimeout(r, 120))
                                .then(() => createBillOnce(snap, myReq, expectedKey))
                        }
                        return Promise.reject(err)
                    })
            })
            .catch((error) => {
                if (error?.cancelled) { setLoading(false); return }
                const e = normalizeIpcError(error)
                if (!openRef.current || myReq !== reqIdRef.current) { setLoading(false); return }
                console.error(e);
                setTransactionBill(undefined)
                setErr({
                    status: Boolean(e?.status),
                    code: error?.stale ? 425 : (e?.code ?? 500), // 425 Too Early (ish) untuk signal stale
                    msg: error?.stale
                        ? 'Sinkronisasi tagihan belum konsisten. Coba klik lagi sebentar.'
                        : (e?.msg ?? 'Gagal Membuat Tagihan'),
                    extra: e?.extra
                })
                setLoading(false)
            })
    }, [open])

    const ButtonEl = (
        <Button
            variant={variant}
            color={color}
            disabled={disabled}
            onClick={(e) => { e.preventDefault(); handleOpen() }}
            size="large"
            startIcon={baseIcon}
            sx={(t) => {
                const light = t.palette.mode === 'light'
                return {
                    textTransform: 'none',
                    py: 1.1,
                    px: 2.2,
                    fontWeight: 800,
                    letterSpacing: .2,
                    minHeight: 24,
                    fontSize: '1rem',
                    borderRadius: 3,
                    bgcolor: !godMode ? (light ? '#000' : '#fff') : '#b7051a',
                    color: !godMode ? (light ? '#fff' : '#000') : '#efefef',
                    '&:hover': { bgcolor: light ? '#111' : '#f5f5f5' },
                    '&:active': { transform: 'translateY(1px)', boxShadow: 'none' },
                    '& .MuiButton-startIcon': { mr: 1.25 }
                }
            }}
        >
            {label}
        </Button>
    )

    useEffect(() => { console.log(transactionBill) }, [transactionBill])

    return (
        <>
            <Tooltip title={tooltip} arrow>
                <span>
                    {isSplitMode ? (
                        <Badge
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

            <Dialog
                key={`dlg-${reqIdRef.current}`}
                open={open}
                fullWidth
                maxWidth="xl"
                fullScreen={fullScreen}
                disableEscapeKeyDown={true}
                onClose={(event, reason) => {
                    if (reason === 'backdropClick' || reason === 'escapeKeyDown')
                        return;

                }}
                keepMounted={false}
                sx={{ zIndex: (t) => (t.zIndex?.modal ?? 1300) + 1000 }} // <- kunci z-index
                slotProps={{
                    paper: {
                        sx: {
                            display: 'flex', flexDirection: 'column',
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
                        {isSplitMode ? 'Preview Tagihan (Split)' : 'Preview Tagihan (Keseluruhan)'}
                    </Typography>
                    <Stack direction="row" spacing={0.5} alignItems="center" sx={{ ml: 'auto' }}>
                        <IconButton size="small" onClick={() => setFullScreen(v => !v)} aria-label={fullScreen ? 'Keluar layar penuh' : 'Layar penuh'}>
                            {fullScreen ? <FullscreenExitRounded fontSize="small" /> : <FullscreenRounded fontSize="small" />}
                        </IconButton>
                        <IconButton size="small" onClick={themes.toggleMode} aria-label={isDark ? 'Ganti ke tema terang' : 'Ganti ke tema gelap'}>
                            {isDark ? <DarkModeRounded fontSize="small" /> : <LightModeRounded fontSize="small" />}
                        </IconButton>
                        <IconButton size="small" onClick={closeWithDialog} aria-label="Tutup">
                            <CloseRounded fontSize="small" />
                        </IconButton>
                    </Stack>
                </DialogTitle>

                <DialogContent dividers sx={{ p: 0, display: 'flex', flexDirection: 'column' }}>
                    <Box sx={{ flex: 1, minHeight: 0, display: 'grid', placeItems: 'center' }}>
                        {loading ? (
                            <Stack spacing={1.25} alignItems="center" sx={{ py: 4 }}>
                                <CircularProgress size={28} />
                                <Typography variant="body2" color="text.secondary">Menyiapkan preview tagihan…</Typography>
                            </Stack>
                        ) : transactionBill ? (
                            <BillListItemDetail
                                key={`${transactionBill?.id ?? 'pending'}-${reqIdRef.current}`}
                                billId={transactionBill?.id}
                                cancelBill={handleClose}
                                onPaySuccess={handleClose}
                            />
                        ) : err ? (
                            <ErrorDataLayout
                                status={err.status}
                                code={err.code}
                                msg={err.msg}
                                extra={err.extra}
                            />
                        ) : null}
                    </Box>
                </DialogContent>
            </Dialog>
            <SweetAlert2
                {...swalProps}
                didClose={() => setSwalProps(prev => ({ ...prev, show: false }))}
            />
        </>
    )
}
