    'use client'

    import * as React from 'react'
    import ResizableGrid from './../../ui/ResizableContainer'
    import { Box, Button, Chip, IconButton, Paper, Stack, Typography } from '@mui/material'
    import ReceiptLongRounded from '@mui/icons-material/ReceiptLongRounded'
    import PersonOutlineRounded from '@mui/icons-material/PersonOutlineRounded'
    import AccessTimeRounded from '@mui/icons-material/AccessTimeRounded'
    import TableRestaurantRounded from '@mui/icons-material/TableRestaurantRounded'
    import { useCallback, useEffect, useMemo, useState } from 'react'
    import { useSearchParams, useRouter, usePathname } from 'next/navigation'

    import LeftContainerBatchList, { Batch, Item, Transaction } from './(pane)/LeftContainerBatchList'
    import RightContainerBatchDetail from './(pane)/RightContainerBatchList' // <-- pastikan path ini benar
    import {ClearRounded, DoneAllRounded } from '@mui/icons-material'

    const rupiah = (n: number | string) =>
        new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 })
            .format(typeof n === 'string' ? parseFloat(n) : n)

    const shortId = (s?: string) => (s ? `${s.slice(0, 8)}…` : '-')

    export default function TransactionContainer({ children }: { children?: React.ReactNode }) {
        const searchParams = useSearchParams()
        const router = useRouter()
        const pathname = usePathname()

        const id = searchParams?.get('id') || ''
        const batchIdFromUrl = searchParams?.get('batch') || undefined

        const [tx, setTx] = useState<Transaction | undefined>()
        const [selectedBatchId, setSelectedBatchId] = useState<string | undefined>(batchIdFromUrl)
        const [selectedItemIds, setSelectedItemIds] = useState<Set<string>>(new Set())

        // --- fetch detail transaksi
        const fetchTransaction = useCallback(async (tid: string) => {
            if (!tid) { setTx(undefined); return }
            try {
                // @ts-ignore
                const res = await window.api.invoke('api.transaction:read.one', { id: tid })
                if (res?.data) { setTx(res.data); return }
                // @ts-ignore
                const all = await window.api.invoke('api.transaction:read.all', {})
                setTx((all?.data ?? []).find((t: Transaction) => t.id === tid))
            } catch {
                try {
                    // @ts-ignore
                    const all = await window.api.invoke('api.transaction:read.all', {})
                    setTx((all?.data ?? []).find((t: Transaction) => t.id === tid))
                } catch { setTx(undefined) }
            }
        }, [])

        useEffect(() => { fetchTransaction(id) }, [id, fetchTransaction])
        useEffect(() => setSelectedBatchId(batchIdFromUrl), [batchIdFromUrl])

        // bersihkan pilihan yg tidak exist setelah refetch
        useEffect(() => {
            if (!tx || selectedItemIds.size === 0) return
            const all = new Set<string>()
            tx.batches.forEach(b => b.items.forEach(i => all.add(i.id)))
            const next = new Set<string>()
            selectedItemIds.forEach(i => { if (all.has(i)) next.add(i) })
            if (next.size !== selectedItemIds.size) setSelectedItemIds(next)
        }, [tx]) // eslint-disable-line

        // klik batch kiri → update url + refetch
        const handleSelectBatch = (b: Batch) => {
            setSelectedBatchId(b.id)
            fetchTransaction(id)
            const base = (pathname || '').replace(/\/+$/, '')
            const params = new URLSearchParams(searchParams?.toString() || '')
            params.set('id', id); params.set('batch', b.id)
            router.push(`${base}?${params.toString()}`, { scroll: false })
        }

        // toggle pilih item (split-bill, lintas batch)
        const toggleItem = (item: Item) => {
            setSelectedItemIds(prev => {
                const next = new Set(prev)
                if (next.has(item.id)) next.delete(item.id)
                else next.add(item.id)
                return next
            })
        }
        const clearSelection = () => setSelectedItemIds(new Set())

        // hitung total terpilih
        const selectedTotal = useMemo(() => {
            if (!tx || selectedItemIds.size === 0) return 0
            let sum = 0
            tx.batches.forEach(b => b.items.forEach(i => {
                if (selectedItemIds.has(i.id)) sum += parseFloat(i.sub_total || '0')
            }))
            return sum
        }, [tx, selectedItemIds])

        // aksi tombol footer
        const doSplitBill = () => {
            if (selectedItemIds.size === 0) return
            // @ts-ignore
            window.api.invoke('api.transaction:split_bill', { transaction_id: id, item_ids: Array.from(selectedItemIds) })
                .then(() => { clearSelection(); fetchTransaction(id) })
                .catch(() => {})
        }

        const doPay = () => {
            if (!selectedBatchId) return
            // @ts-ignore
            window.api.invoke('api.payment:batch.pay', { transaction_id: id, batch_id: selectedBatchId })
                .then(() => fetchTransaction(id))
                .catch(() => {})
        }

        // ======= HEADER GLOBAL (tanpa info selection) =======
        const Header = tx ? (
            <Paper elevation={0} sx={{ px:1.5, py:1, borderBottom:'1px solid', borderColor:'divider', display:'flex', alignItems:'center', gap:1, flexWrap:'wrap' }}>
                <ReceiptLongRounded fontSize="small" />
                <Typography variant="subtitle1" fontWeight={900} sx={{ mr:1 }}># {tx.invoice}</Typography>
                <Chip size="small" label={tx.order_type?.name ?? '-'} variant="outlined" />
                {tx.table?.code ? <Chip size="small" icon={<TableRestaurantRounded />} label={`Table ${tx.table.code}`} /> : null}
                <Chip size="small" icon={<PersonOutlineRounded />} label={`Kasir ${tx.reference?.username ?? shortId(tx.reference?.id)}`} />
                <Chip size="small" icon={<AccessTimeRounded />} label={tx.shift?.name ?? '-'} />
                <Box sx={{ flex:1 }} />
                {selectedItemIds.size>0 && (
                    <Stack direction="row" alignItems="center" spacing={1}>
                        <DoneAllRounded fontSize="small" />
                        <Typography variant="body2" fontWeight={700}>
                            {selectedItemIds.size} item dipilih
                        </Typography>
                        <IconButton size="small" onClick={clearSelection} title="Kosongkan">
                            <ClearRounded fontSize="small" />
                        </IconButton>
                    </Stack>
                )}
            </Paper>
        ) : null

        // ======= FOOTER GLOBAL (tampilkan total transaksi ATAU total terpilih) =======
        const Footer = (
            <Paper
                elevation={0}
                sx={{ px: 1.5, py: 1, borderTop: '1px solid', borderColor: 'divider',
                    display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}
            >
                <Stack flex={1}>
                    {selectedItemIds.size === 0 ? (
                        <>
                            <Typography variant="caption" color="text.secondary">Total Transaksi</Typography>
                            <Typography variant="subtitle1" fontWeight={900}>{tx ? rupiah(tx.total) : '-'}</Typography>
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
            <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                {Header}
                <Box sx={{ flex: 1, minHeight: 0 }}>
                    <ResizableGrid
                        defaultSize="22%"
                        left={
                            <LeftContainerBatchList
                                tx={tx}
                                selectedBatchId={selectedBatchId}
                                onSelect={handleSelectBatch}
                            />
                        }
                        right={children ?? (
                            <RightContainerBatchDetail
                                tx={tx}
                                batchId={selectedBatchId}
                                selectedItemIds={selectedItemIds}
                                onToggleItem={toggleItem}
                            />
                        )}
                    />
                </Box>
                {Footer}
            </Box>
        )
    }
