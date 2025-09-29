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
import { useTx } from '../../context/TransactionContext'
import { Batch } from '../LeftContainerBatchList'
import { useDiningMode } from '../../../../context/DiningModeContext'
import { CartItem } from '../../../../../../../(select-product)/context/CartContext'
import { useTheme } from '@mui/material/styles'
import { useThemeCharger } from '../../../../../../../../context/ThemeCharger'
import {useTransactionEventTrigger} from "../../context/TransactionEventTriggerContext";
import {useSession} from "../../../../../../../../../../contexts/SessionProviderContext";
import {Transaction} from "../../../types/api.transaction.type";

const Billing = dynamic(() => import('../../../../../../../(select-product)'), { ssr: true })

const rupiah = (n: number | string) =>
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 })
        .format(typeof n === 'string' ? parseFloat(n) : n)

const LeftContainerBatchListNewOrder: React.FC<{ tx: Transaction }> = ({ tx }) => {
    const { txId, grandTotal, setGrandTotal, selectedBatchId, setSelectedBatchId, reloadKey,setReloadKey } = useTx()
    const { setDefaultValue, setDisableOtherDefault } = useDiningMode();
    const { Session } = useSession();
    const { bump } = useTransactionEventTrigger()
    const [batches, setBatches] = React.useState<Batch[]>([])
    const isClosed = Boolean(tx?.time_closed)
    const [open, setOpen] = React.useState(false)
    const [fullScreen, setFullScreen] = React.useState(false)

    // theme stuff
    const muiTheme = useTheme()
    const isDark = (muiTheme.palette as any)?.mode === 'dark' || (muiTheme.palette as any)?.colorScheme === 'dark'
    const { toggleMode } = useThemeCharger()

    React.useEffect(() => {
        const id = tx?.order_type?.id ?? null
        if (open && id) {
            setDefaultValue(id)
            setDisableOtherDefault(true)
        } else {
            setDefaultValue(null)
            setDisableOtherDefault(false)
        }
    }, [open, tx?.order_type?.id])

// (opsional) extra safety saat unmount komponen
    React.useEffect(() => () => {
        setDefaultValue(null)
        setDisableOtherDefault(false)
    }, [])

    const openDialog = () => { console.log(tx); setOpen(true) }
    const closeDialog = () => setOpen(false)

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
        window.api.invoke('api.transaction.batch:create', {
            transaction: { id: txId },
            branch: Session.branches,
            reference: Session.id,
            items: itemRefactor,
        })
            .then((res: any) => {
                // 1) map response ke tipe Batch lokal kita (tanpa refetch total)
                const b = res?.data
                const mapped: Batch = {
                    id: String(b.id),
                    batch: Number(b.batch),
                    note: b.note ?? null,
                    items: Array.isArray(b.items) ? b.items : [],
                }

                // 2) langsung inject ke state —> layout tetep, gak lost
                setBatches(prev => [...prev, mapped])

                // 3) set selection ke batch yang baru dibuat (opsional)
                setSelectedBatchId(mapped.id)

                // 4) ping global kalau ada listener lain (boleh dipertahankan)
                bump('batch')

                // 5) tutup dialog — layout di belakang tetap stay
                closeDialog()
            })
            .catch((error: any) => {
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
    }, [txId, reloadKey])

    return (
        <>
            {/* Trigger */}
            <Button
                size="large"
                variant="contained"
                color={'success'}
                startIcon={<AddRounded />}
                disabled={Boolean(isClosed)}
                sx={(t) => {
                    const light = t.palette.mode === 'light'
                    return {
                        // --- BIG BUTTON vibes ---
                        textTransform:'none',
                        minHeight: 26,         // jumbo
                        fontSize: '1rem',   // ~20px
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
                {`Order Lanjutan  `}
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
                        Tambah Pesanan Untuk Transaksi {tx?.invoice} — Batch Ke #{batches.length + 1}
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
        </>
    )
}

export default LeftContainerBatchListNewOrder
