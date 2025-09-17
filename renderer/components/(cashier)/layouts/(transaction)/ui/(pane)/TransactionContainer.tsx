'use client'

import * as React from 'react'
import ResizableGrid from './../../ui/ResizableContainer'
import { Box, Button, Chip, IconButton, Paper, Stack, Typography } from '@mui/material'
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
function Body({ children }: { children?: React.ReactNode }) {
    const { header, selectedItemIds, selectedTotal, clearSelection, selectedBatchId, txId, bumpReload } = useTx()

    const doSplitBill = () => {
        if (selectedItemIds.size === 0) return
        // @ts-ignore
        window.api.invoke('api.transaction:split_bill', { transaction_id: txId, item_ids: Array.from(selectedItemIds) })
            .then(() => { clearSelection(); bumpReload() })
            .catch(() => {})
    }

    const doPay = () => {
        if (!selectedBatchId) return
        // @ts-ignore
        window.api.invoke('api.payment:batch.pay', { transaction_id: txId, batch_id: selectedBatchId })
            .then(() => bumpReload())
            .catch(() => {})
    }

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

                // base tetap ikut tema
                position: 'relative',
                overflow: 'hidden',
                bgcolor: 'background.paper',

                // overlay gradient status (tetap readable di light/dark)
                '&::after': {
                    content: '""',
                    position: 'absolute',
                    inset: 0,
                    pointerEvents: 'none',
                    zIndex: 0,
                    background: header.time_closed
                        ? (t.palette.mode === 'dark' ? GRAD_RED : GRAD_RED) // closed
                        : GRAD_GREEN,                                           // aktif
                    opacity: t.palette.mode === 'dark' ? 0.18 : 0.12,         // tipis agar kontras aman
                },

                // pastikan konten di atas overlay
                '& > *': { position: 'relative', zIndex: 1 },
            })}
        >
            <ReceiptLongRounded fontSize="small" />
            <Typography variant="subtitle1" fontWeight={900} sx={{ mr: 1 }}># {header.invoice ?? '—'}</Typography>
            <Chip size="small" label={header.order_type?.name ?? '-'} variant="outlined" />
            {header.table?.code ? <Chip size="small" icon={<TableRestaurantRounded />} label={`Table ${header.table.code}`} /> : null}
            <Chip size="small" icon={<PersonOutlineRounded />} label={`${header.reference?.name.first_name}`} />
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
        <Paper elevation={0} sx={{ px:1.5, py:1, borderTop:'1px solid', borderColor:'divider', display:'flex', alignItems:'center', gap:1.5, flexWrap:'wrap' }}>
            <Stack flex={1}>
                {selectedItemIds.size === 0 ? (
                    <>
                        <Typography variant="caption" color="text.secondary">Total Transaksi</Typography>
                        <Typography variant="subtitle1" fontWeight={900}>{header.total ? rupiah(header.total) : '-'}</Typography>
                    </>
                ) : (
                    <>
                        <Typography variant="caption" color="text.secondary">Total Terpilih</Typography>
                        <Typography variant="subtitle1" fontWeight={900}>{rupiah(selectedTotal)}</Typography>
                    </>
                )}
            </Stack>

            <Button
                variant="outlined"
                disabled={selectedItemIds.size === 0}
                onClick={doSplitBill}
                sx={{ textTransform: 'none', fontWeight: 800, borderRadius: 1.5 }}
            >
                Split Bill
            </Button>

            <Button
                variant="outlined"
                disabled={selectedItemIds.size > 0 || !selectedBatchId}
                onClick={doPay}
                sx={{ textTransform: 'none', fontWeight: 800, borderRadius: 1.5 }}
            >
                Bayar
            </Button>
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
