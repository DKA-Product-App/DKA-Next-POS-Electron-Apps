'use client'

import * as React from 'react'
import PerfectScrollbar from 'react-perfect-scrollbar'
import 'react-perfect-scrollbar/dist/css/styles.css'
import { Box, Chip, List, ListItemButton, Stack, Typography } from '@mui/material'
import LayersRounded from '@mui/icons-material/LayersRounded'
import LocalMallRounded from '@mui/icons-material/LocalMallRounded'
import AccessTimeRounded from '@mui/icons-material/AccessTimeRounded'

export type Name = { first_name: string; last_name?: string }
export type Reference = { id: string; name?: Name; username?: string }
export type OrderType = { id: string; code: string; name: string }
export type Table = { id: string; code: string; name: string }
export type Product = { id: string; name: string; description?: string; image?: string }
export type Variant = { id: string; code?: string; name?: string; price?: string }
export type Item = { id: string; qty: number; price: string; sub_total: string; note?: string | null; reference?: Reference | null; product: Product; variant?: Variant }
export type Batch = { id: string; batch: number; note?: string | null; time_created?: string; time_updated?: string; items: Item[] }
export type Transaction = {
    id: string; invoice: string; total: string; time_created: string; time_updated: string; time_closed?: string | null;
    reference?: Reference; shift?: { id: string; name: string }; order_type: OrderType; table?: Table; batches: Batch[]
}

const rupiah = (n: number | string) =>
    new Intl.NumberFormat('id-ID',{style:'currency',currency:'IDR',maximumFractionDigits:0})
        .format(typeof n==='string'?parseFloat(n):n)

const fmtDT = (iso?: string) =>
    iso ? new Intl.DateTimeFormat('id-ID',{dateStyle:'medium',timeStyle:'short',hour12:false,timeZone:'Asia/Jakarta'}).format(new Date(iso)) : '-'

const totalItem = (b: Batch) => b.items.length
const totalQty = (b: Batch) => b.items.reduce((a,i)=>a+i.qty,0)
const batchTotal = (b: Batch) => b.items.reduce((a,i)=>a+(parseFloat(i.sub_total||'0')),0)

export type LeftContainerBatchListProps = {
    tx?: Transaction
    selectedBatchId?: string
    onSelect?: (b: Batch) => void
}

const LeftContainerBatchList: React.FC<LeftContainerBatchListProps> = ({ tx, selectedBatchId, onSelect }) => {
    const batches = React.useMemo(()=> (tx?.batches ?? []).slice().sort((a,b)=>a.batch-b.batch),[tx?.batches])
    const isClosed = Boolean(tx?.time_closed)

    if(!tx) return (
        <Box sx={{ display:'grid', placeItems:'center', height:'100%', color:'text.secondary' }}>
            <Typography variant="body2">Pilih transaksi dulu.</Typography>
        </Box>
    )

    if(batches.length===0) return (
        <Box sx={{ display:'grid', placeItems:'center', height:'100%', color:'text.secondary' }}>
            <Typography variant="body2">Belum ada batch.</Typography>
        </Box>
    )

    return (
        <Box sx={{ height:'100%', display:'flex', flexDirection:'column' }}>
            <Box sx={{ flex:1, minHeight:0 }}>
                <PerfectScrollbar options={{ suppressScrollX:true }}>
                    <List disablePadding>
                        {batches.map(b => {
                            const selected = b.id===selectedBatchId
                            return (
                                <ListItemButton
                                    key={b.id}
                                    selected={selected}
                                    onClick={()=>onSelect?.(b)}
                                    sx={{
                                        position:'relative', alignItems:'flex-start', py:1.1, px:1.4, mb:1, borderRadius:2,
                                        border:'1px solid',
                                        borderColor: selected ? 'primary.outlinedBorder' : 'divider',
                                        bgcolor: selected ? 'action.selected' : 'background.paper',
                                        boxShadow: selected ? '0 10px 24px rgba(0,0,0,0.12)' : '0 2px 8px rgba(0,0,0,0.04)',
                                        transition:'transform .15s ease, box-shadow .2s ease, border-color .2s ease, background-color .2s ease',
                                        '&:hover':{
                                            transform:'translateY(-1px)',
                                            boxShadow:'0 12px 28px rgba(0,0,0,0.12)',
                                            bgcolor: selected ? 'action.selected' : 'action.hover'
                                        },
                                        // BIS MERAH kalau transaksi ditutup
                                        '&::before':{
                                            content:'""', position:'absolute', left:0, top:0, bottom:0, width:4,
                                            borderTopLeftRadius:8, borderBottomLeftRadius:8,
                                            background: selected
                                                ? 'linear-gradient(180deg, #6366F1, #8B5CF6 35%, #EC4899)'
                                                : (isClosed ? 'linear-gradient(180deg, #ef4444, #dc2626 60%, #b91c1c)' : 'transparent'),
                                        },
                                    }}
                                >
                                    <Stack spacing={0.5} width="100%">
                                        {/* Top row: title + total */}
                                        <Stack direction="row" alignItems="center" justifyContent="space-between" gap={1}>
                                            <Stack direction="row" spacing={1} alignItems="center" minWidth={0}>
                                                <LayersRounded fontSize="small" />
                                                <Typography variant="subtitle2" fontWeight={800}>Batch {String(b.batch)}</Typography>
                                            </Stack>
                                            <Typography variant="subtitle2" fontWeight={900}>{rupiah(batchTotal(b))}</Typography>
                                        </Stack>

                                        {/* Chips row: + status chip DI DALAM LIST */}
                                        <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap>
                                            <Chip
                                                size="small"
                                                label={isClosed ? 'Selesai' : 'Aktif'}
                                                color={isClosed ? 'error' : 'success'}
                                                variant={isClosed ? 'filled' : 'outlined'}
                                            />
                                            <Chip size="small" icon={<LocalMallRounded />} label={`${totalItem(b)} item`} />
                                            <Chip size="small" icon={<LocalMallRounded />} label={`${totalQty(b)} Qty`} />
                                            {b.time_created ? <Chip size="small" icon={<AccessTimeRounded />} label={fmtDT(b.time_created)} /> : null}
                                        </Stack>
                                    </Stack>
                                </ListItemButton>
                            )
                        })}
                    </List>
                </PerfectScrollbar>
            </Box>
        </Box>
    )
}

export default LeftContainerBatchList
