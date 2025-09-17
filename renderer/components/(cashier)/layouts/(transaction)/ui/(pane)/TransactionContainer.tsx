'use client'

import * as React from 'react'
import ResizableGrid from './../../ui/ResizableContainer'
import {
    Box,
    Button,
    Chip,
    IconButton,
    Paper,
    Stack,
    Typography,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    Alert
} from '@mui/material'
import ReceiptLongRounded from '@mui/icons-material/ReceiptLongRounded'
import PersonOutlineRounded from '@mui/icons-material/PersonOutlineRounded'
import AccessTimeRounded from '@mui/icons-material/AccessTimeRounded'
import TableRestaurantRounded from '@mui/icons-material/TableRestaurantRounded'
import { useSearchParams, useRouter, usePathname } from 'next/navigation'
import { ClearRounded, DoneAllRounded } from '@mui/icons-material'

import { TxProvider, useTx } from './context/TransactionContext'
import dynamic from "next/dynamic";
import ShimmerMenuSelectLoading from "../(loading)/ShimmerMenuSelectLoading";

const rupiah = (n: number | string) =>
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 })
        .format(typeof n === 'string' ? parseFloat(n) : n)

const shortId = (s?: string) => (s ? `${s.slice(0, 8)}…` : '-')

// Taruh konstanta ini di atas component Body (file yang sama)
const GRAD_PURPLE = 'linear-gradient(90deg, #6366F1, #8B5CF6 35%, #EC4899)'
const GRAD_RED    = 'linear-gradient(90deg, #ef4444, #dc2626 35%, #b91c1c)'
const GRAD_GREEN  = 'linear-gradient(90deg, #22c55e, #16a34a 35%, #15803d)'


const LeftContainerBatchList = dynamic(() => import('./(pane)/LeftContainerBatchList'), {
    loading : () => <ShimmerMenuSelectLoading/>,
    ssr: false,
})

const RightContainerBatchDetail = dynamic(() => import('./(pane)/RightContainerBatchList'), {
    loading : () => <ShimmerMenuSelectLoading/>,
    ssr: false,
})
/* ===== Header + Grid + Footer composed with Context ===== */
/* ===== Header + Grid + Footer composed with Context ===== */
function Body({ children }: { children?: React.ReactNode }) {
    const { header, selectedItemIds, selectedTotal, clearSelection, selectedBatchId, txId, bumpReload } = useTx()

    const [voidOpen, setVoidOpen] = React.useState(false)
    const [voidReason, setVoidReason] = React.useState('')
    const isClosed = Boolean(header.time_closed)

    const doSplitBill = () => {
        if (selectedItemIds.size === 0 || isClosed) return
        // @ts-ignore
        window.api.invoke('api.transaction:split_bill', { transaction_id: txId, item_ids: Array.from(selectedItemIds) })
            .then(() => { clearSelection(); bumpReload() })
            .catch(() => {})
    }

    const doPay = () => {
        if (!selectedBatchId || isClosed || selectedItemIds.size > 0) return
        // @ts-ignore
        window.api.invoke('api.payment:batch.pay', { transaction_id: txId, batch_id: selectedBatchId })
            .then(() => bumpReload())
            .catch(() => {})
    }

    // === VOID handlers ===
    const openVoid = () => setVoidOpen(true)
    const closeVoid = () => { setVoidOpen(false); setVoidReason('') }
    const confirmVoid = () => {
        if (selectedItemIds.size === 0 || isClosed) return
        // NOTE: sesuaikan channel berikut dengan backend kamu kalau beda
        // contoh lain yang mungkin kamu pakai: 'api.transaction.batch.item:void'
        // @ts-ignore
        window.api.invoke('api.transaction.item:void', {
            transaction_id: txId,
            item_ids: Array.from(selectedItemIds),
            reason: voidReason || undefined
        })
            .then(() => { clearSelection(); bumpReload(); closeVoid() })
            .catch(() => {})
    }

    const kasirName = React.useMemo(() => {
        const n = header.reference?.name
        return [n?.first_name, n?.last_name].filter(Boolean).join(' ') || '-'
    }, [header.reference])

    const Header = (
        <Paper
            elevation={0}
            sx={(t) => ({
                px: 1.5,
                py: 1,
                borderBottom: '1px solid',
                borderColor: 'divider',
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                flexWrap: 'wrap',
                position: 'relative',
                overflow: 'hidden',
                bgcolor: 'background.paper',
                '&::after': {
                    content: '""',
                    position: 'absolute',
                    inset: 0,
                    pointerEvents: 'none',
                    zIndex: 0,
                    background: header.time_closed ? 'linear-gradient(90deg, #ef4444, #dc2626 35%, #b91c1c)'
                        : 'linear-gradient(90deg, #22c55e, #16a34a 35%, #15803d)',
                    opacity: t.palette.mode === 'dark' ? 0.18 : 0.12,
                },
                '& > *': { position: 'relative', zIndex: 1 },
            })}
        >
            <ReceiptLongRounded fontSize="small" />
            <Typography variant="subtitle1" fontWeight={900} sx={{ mr: 1 }}># {header.invoice ?? '—'}</Typography>
            <Chip size="small" label={header.order_type?.name ?? '-'} variant="outlined" />
            {header.table?.code ? <Chip size="small" icon={<TableRestaurantRounded />} label={`Table ${header.table.code}`} /> : null}
            <Chip size="small" icon={<PersonOutlineRounded />} label={`${header.reference?.name?.first_name ?? '-'}`} />
            <Chip size="small" icon={<AccessTimeRounded />} label={header.shift?.name ?? '-'} />
            <Box sx={{ flex: 1 }} />
            {selectedItemIds.size > 0 && (
                <Stack direction="row" alignItems="center" spacing={1}>
                    <DoneAllRounded fontSize="small" />
                    <Typography variant="body2" fontWeight={700}>{selectedItemIds.size} item dipilih</Typography>
                    <IconButton size="small" onClick={clearSelection} title="Kosongkan">
                        <ClearRounded fontSize="small" />
                    </IconButton>
                </Stack>
            )}
        </Paper>
    )

    const Footer = (
        <Paper
            elevation={0}
            sx={{ px: 1.5, py: 1.25, borderTop: '1px solid', borderColor: 'divider' }}
        >
            <Stack direction="row" alignItems="center" justifyContent="space-between" flexWrap="wrap" gap={1.5}>
                {/* Kiri: Total + Info ringkas */}
                <Box sx={{ display: 'grid', gap: 0.5, minWidth: 260 }}>
                    <Typography variant="caption" color="text.secondary">
                        {selectedItemIds.size === 0 ? 'Total Transaksi' : 'Total Terpilih'}
                    </Typography>

                    {/* Total dibesarkan */}
                    <Typography sx={{ lineHeight: 1, fontWeight: 900, fontSize: { xs: '1.6rem', sm: '1.9rem', md: '2.1rem' } }}>
                        {selectedItemIds.size === 0 ? (header.total ? rupiah(header.total) : '-') : rupiah(selectedTotal)}
                    </Typography>

                    {/* Info tambahan */}
                    <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap mt={0.5}>
                        <Chip size="small" label={`Invoice #${header.invoice ?? '—'}`} />
                        <Chip size="small" variant="outlined" label={isClosed ? 'Status: Tertutup' : 'Status: Aktif'} color={isClosed ? 'error' : 'success'} />
                        {/*{selectedBatchId ? <Chip size="small" label={`Batch ${shortId(selectedBatchId)}`} /> : null}
                        {header.order_type?.name ? <Chip size="small" label={header.order_type.name} /> : null}
                        {header.table?.code ? <Chip size="small" icon={<TableRestaurantRounded />} label={`Table ${header.table.code}`} /> : null}
                        {header.reference?.name?.first_name ? <Chip size="small" icon={<PersonOutlineRounded />} label={header.reference.name.first_name} /> : null}
                        {header.shift?.name ? <Chip size="small" icon={<AccessTimeRounded />} label={header.shift.name} /> : null}*/}
                        {selectedItemIds.size > 0 ? <Chip size="small" icon={<DoneAllRounded />} label={`${selectedItemIds.size} item`} /> : null}
                    </Stack>
                </Box>

                {/* Kanan: Aksi */}
                <Stack direction="row" gap={1}>
                    {/* Split Bill */}
                    <Button
                        variant="outlined"
                        disabled={selectedItemIds.size === 0 || isClosed}
                        onClick={doSplitBill}
                        sx={{ textTransform: 'none', fontWeight: 800, borderRadius: 1.5 }}
                    >
                        Split Bill
                    </Button>

                    {/* Void (balik lagi) */}
                    <Button
                        variant="outlined"
                        color="error"
                        disabled={selectedItemIds.size === 0 || isClosed}
                        onClick={openVoid}
                        sx={{ textTransform: 'none', fontWeight: 800, borderRadius: 1.5 }}
                    >
                        Void
                    </Button>

                    {/* Bayar */}
                    <Button
                        variant="outlined"
                        disabled={selectedItemIds.size > 0 || !selectedBatchId || isClosed}
                        onClick={doPay}
                        sx={{ textTransform: 'none', fontWeight: 800, borderRadius: 1.5 }}
                    >
                        Bayar
                    </Button>
                </Stack>
            </Stack>

            {/* Dialog Konfirmasi Void */}
            {/* Dialog Konfirmasi Void */}
            <Dialog open={voidOpen} onClose={closeVoid} fullWidth maxWidth="sm">
                <DialogTitle sx={{ fontWeight: 900 }}>Void Item Terpilih</DialogTitle>
                <DialogContent sx={{ pt: 1, display: 'grid', gap: 1.25 }}>
                    <Typography variant="body2" sx={{ m: 0 }}>
                        {selectedItemIds.size} item akan dibatalkan. Nilai total: <b>{rupiah(selectedTotal)}</b>
                    </Typography>

                    {/* 🔔 Alert notice dinamis */}
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
                        value={voidReason}
                        onChange={(e)=>setVoidReason(e.target.value)}
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={closeVoid} sx={{ textTransform:'none' }}>Batal</Button>
                    <Button onClick={confirmVoid} color="error" variant="contained" sx={{ textTransform:'none', fontWeight:800 }}>
                        Void
                    </Button>
                </DialogActions>
            </Dialog>

        </Paper>
    )


    return (
        <Box sx={{ height:'100%', display:'flex', flexDirection:'column' }}>
            {Header}
            <Box sx={{ flex:1, minHeight:0 }}>
                <ResizableGrid
                    defaultSize="23%"
                    minSize={330}
                    left={<LeftContainerBatchList />}
                    right={children ?? <RightContainerBatchDetail />}
                />
            </Box>
            {Footer}
        </Box>
    )
}


export default function TransactionContainer({ children }: { children?: React.ReactNode }) {
    const searchParams = useSearchParams()
    const pathname = usePathname()
    const router = useRouter()

    // Pastikan pathmu tetap /cashier/transaction/batch?id=...
    React.useEffect(() => {
        const id = searchParams?.get('id') || ''
        const norm = (pathname || '').replace(/\/+$/, '')
        if (norm.endsWith('/batch')) return
        if (id) router.replace(`${norm}/batch?${searchParams?.toString()}`, { scroll: false })
    }, [pathname, router, searchParams])

    const txId = searchParams?.get('id') || ''



    return (
        <TxProvider key={txId} txId={txId}>
            <Body>{children}</Body>
        </TxProvider>
    )
}
