'use client'

import * as React from 'react'
import ResizableGrid from '../ResizableContainer'
import {
    Box,
    Chip,
    Paper,
    Stack,
    Typography,
    Button,
} from '@mui/material'
import ReceiptLongRounded from '@mui/icons-material/ReceiptLongRounded'
import PersonOutlineRounded from '@mui/icons-material/PersonOutlineRounded'
import AccessTimeRounded from '@mui/icons-material/AccessTimeRounded'
import TableRestaurantRounded from '@mui/icons-material/TableRestaurantRounded'
import { ClearRounded, DoneAllRounded } from '@mui/icons-material'

import { TxProvider, useTx } from './context/TransactionContext'
import dynamic from 'next/dynamic'
import ShimmerMenuSelectLoading from '../(loading)/ShimmerMenuSelectLoading'
import OrderVoidModal from './(components)/OrderVoidModal'
import NewOrderBillModal from './(components)/NewOrderBillModal'
import {useEffect} from "react"; // ⬅️ hapus { OrderItemModel }

const rupiah = (n: number | string) =>
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 })
        .format(typeof n === 'string' ? parseFloat(n) : n)

const LeftContainerBatchList = dynamic(() => import('./(pane)/LeftContainerBatchList'), {
    loading: () => <ShimmerMenuSelectLoading />,
    ssr: false,
})

const RightContainerBatchDetail = dynamic(() => import('./(pane)/RightContainerBatchList'), {
    loading: () => <ShimmerMenuSelectLoading />,
    ssr: false,
})

/* ===== Header + Grid + Footer composed with Context ===== */
function Body() {
    const {
        header,
        grandTotal,
        selectedItemIds,
        selectedTotal,
        clearSelection,
        bumpReload,
        reloadKey
    } = useTx()

    const isClosed = Boolean(header.time_closed)

    // normalizer id → string
    const toId = (v: unknown) => `${v ?? ''}`.trim()

    /**
     * Ambil semua **ID item** dari transaksi.
     * Support:
     *  - header.items[]
     *  - header.batches[].items[]
     */
    const allItemIds: string[] = React.useMemo(() => {
        if (Array.isArray((header as any)?.items))
            return (header as any).items
                .map((it: any) => toId(it.id ?? it._id ?? it.item_id))
                .filter(Boolean)

        if (Array.isArray((header as any)?.batches))
            return (header as any).batches
                .flatMap((b: any) => Array.isArray(b.items) ? b.items : [])
                .map((it: any) => toId(it.id ?? it._id ?? it.item_id))
                .filter(Boolean)

        return []
    }, [header])

    // Konversi Set → string[]
    const selectedIdList: string[] = React.useMemo(
        () => Array.from(selectedItemIds || []).map(toId).filter(Boolean),
        [selectedItemIds]
    )

    const isSplitMode = (selectedItemIds?.size || 0) > 0

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
                    background: header.time_closed
                        ? 'linear-gradient(90deg, #ef4444, #dc2626 35%, #b91c1c)'
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
                    <Button size="small" onClick={clearSelection} title="Kosongkan" variant="text" sx={{ minWidth: 0, p: 0.5 }}>
                        <ClearRounded fontSize="small" />
                    </Button>
                </Stack>
            )}
        </Paper>
    )

    const Footer = (
        <Paper elevation={0} sx={{ px: 1.5, py: 1.25, borderTop: '1px solid', borderColor: 'divider' }}>
            <Stack direction="row" alignItems="center" justifyContent="space-between" flexWrap="wrap" gap={1.5}>
                {/* Kiri: Total + Info ringkas */}
                <Box sx={{ display: 'grid', gap: 0.5, minWidth: 260 }}>
                    <Typography variant="caption" color="text.secondary">
                        {isSplitMode ? 'Total Terpilih  (Sebelum PPN)' : 'Total Transaksi (Sebelum PPN)'}
                    </Typography>

                    <Typography sx={{ lineHeight: 1, fontWeight: 900, fontSize: { xs: '1.6rem', sm: '1.9rem', md: '2.1rem' } }}>
                        {isSplitMode ? rupiah(selectedTotal) : (grandTotal > 0 ? rupiah(grandTotal) : 0)}
                    </Typography>

                    <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap mt={0.5}>
                        <Chip size="small" label={`Invoice #${header.invoice ?? '—'}`} />
                        <Chip
                            size="small"
                            variant="outlined"
                            label={isClosed ? 'Status: Tertutup' : 'Status: Aktif'}
                            color={isClosed ? 'error' : 'success'}
                        />
                        {isSplitMode ? <Chip size="small" icon={<DoneAllRounded />} label={`${selectedItemIds.size} item`} /> : null}
                    </Stack>
                </Box>

                {/* Kanan: Aksi */}
                <Stack direction="row" gap={1.25} alignItems="center" sx={{ pr: 4 }}>
                    {/* Void */}
                    <OrderVoidModal
                        iconOnly={false}
                        color="error"
                        buttonVariant="contained"
                        label="Void"
                        iconFontSizePx={36}
                    />

                    {/* Buat Tagihan — kirim array **ID** item */}
                    <NewOrderBillModal
                        items={isSplitMode ? selectedIdList : allItemIds} // ⬅️ string[]
                        mode={isSplitMode ? 'split' : 'full'}
                        label="Buat Tagihan"
                        variant="contained"
                    />
                </Stack>
            </Stack>
        </Paper>
    )

    return (
        <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            {Header}
            <Box sx={{ flex: 1, minHeight: 0 }}>
                <ResizableGrid
                    defaultSize="25%"
                    minSize={330}
                    left={<LeftContainerBatchList />}
                    right={<RightContainerBatchDetail />}
                />
            </Box>
            {Footer}
        </Box>
    )
}

export default function TransactionContainer({ id }) {
    return (
        <TxProvider key={id} txId={id}>
            <Body />
        </TxProvider>
    )
}
