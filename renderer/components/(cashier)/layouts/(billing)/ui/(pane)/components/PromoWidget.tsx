'use client';

import * as React from 'react'
import {
    Box, Button, Chip, Divider, IconButton, Popover, Radio,
    Stack, TextField, Typography, Tooltip, Paper
} from '@mui/material'
import LocalOfferRounded from '@mui/icons-material/LocalOfferRounded'
import ClearRounded from '@mui/icons-material/ClearRounded'
import FilterAltRounded from '@mui/icons-material/FilterAltRounded'
import AccessTimeRounded from '@mui/icons-material/AccessTimeRounded'
import PerfectScrollbar from 'react-perfect-scrollbar'
import 'react-perfect-scrollbar/dist/css/styles.css'

type Channel = 'Outlet' | 'Online' | 'Partner'
type Promo = {
    id: string
    name: string
    code?: string
    channel: Channel
    desc?: string
    expiresAt?: string // ISO date string, dummy only
    tags?: string[]
}

const PROMOS: Promo[] = [
    {
        id: 'p01',
        name: 'Dine In Hemat 10%',
        code: 'HEMAT10',
        channel: 'Outlet',
        desc: 'Potongan khusus makan di tempat, Senin–Jumat.',
        expiresAt: '2025-12-31',
        tags: ['Dine In', 'Weekday']
    },
    {
        id: 'p02',
        name: 'Take Away Combo',
        code: 'COMBO-TA',
        channel: 'Outlet',
        desc: 'Beli makanan + minuman, harga spesial bungkus.',
        expiresAt: '2025-10-31',
        tags: ['Take Away']
    },
    {
        id: 'p03',
        name: 'Online Order Cashback',
        channel: 'Online',
        desc: 'Cashback untuk pemesanan via ShopeeFood • GoFood.',
        expiresAt: '2025-11-30',
        tags: ['ShopeeFood', 'GoFood']
    },
    {
        id: 'p04',
        name: 'Scheduled Saver',
        code: 'JADWALIN',
        channel: 'Partner',
        desc: 'Diskon khusus pesanan terjadwal (pre-order).',
        expiresAt: '2026-01-15',
        tags: ['Scheduled']
    },
    {
        id: 'p05',
        name: 'Member Special',
        code: 'MEMBER-ONLY',
        channel: 'Outlet',
        desc: 'Promo eksklusif untuk member terdaftar.',
        expiresAt: '2025-12-01',
        tags: ['Member']
    },
]

const ChannelColor: Record<Channel, 'default' | 'primary' | 'secondary' | 'success' | 'warning' | 'info' | 'error'> = {
    Outlet: 'primary',
    Online: 'success',
    Partner: 'info',
}

const PromoItem: React.FC<{
    promo: Promo
    selected: boolean
    onSelect: () => void
}> = ({ promo, selected, onSelect }) => (
    <Stack
        direction="row"
        alignItems="flex-start"
        spacing={1}
        onClick={onSelect}
        sx={{
            px: 1,
            py: 1,
            borderRadius: 1,
            cursor: 'pointer',
            '&:hover': { bgcolor: 'action.hover' },
        }}
    >
        <Radio
            checked={selected}
            onChange={onSelect}
            color="primary"
            size="small"
            sx={{ mt: 0.25 }}
        />
        <Stack spacing={0.25} sx={{ minWidth: 0, flex: 1 }}>
            <Stack direction="row" alignItems="center" spacing={0.75} flexWrap="wrap">
                <Typography fontWeight={800} noWrap title={promo.name}>
                    {promo.name}
                </Typography>
                <Chip
                    size="small"
                    label={promo.channel}
                    color={ChannelColor[promo.channel]}
                    variant="outlined"
                    sx={{ height: 20 }}
                />
                {promo.code && (
                    <Chip
                        size="small"
                        label={promo.code}
                        variant="outlined"
                        sx={{ height: 20 }}
                    />
                )}
            </Stack>
            {promo.desc && (
                <Typography variant="caption" color="text.secondary" noWrap title={promo.desc}>
                    {promo.desc}
                </Typography>
            )}
            <Stack direction="row" spacing={0.5} alignItems="center" flexWrap="wrap">
                {promo.expiresAt && (
                    <Chip
                        size="small"
                        icon={<AccessTimeRounded sx={{ fontSize: 14 }} />}
                        label={`Sampai ${new Date(promo.expiresAt).toLocaleDateString('id-ID')}`}
                        variant="outlined"
                        sx={{ height: 20 }}
                    />
                )}
                {promo.tags?.slice(0, 3).map(tag => (
                    <Chip key={tag} size="small" label={tag} variant="outlined" sx={{ height: 20 }} />
                ))}
            </Stack>
        </Stack>
    </Stack>
)

const PromoWidget: React.FC = () => {
    // APPLIED — yang tampil di tombol
    const [appliedPromoId, setAppliedPromoId] = React.useState<string | null>(null)

    // DRAFT — yang dipilih di popover sebelum disimpan
    const [draftPromoId, setDraftPromoId] = React.useState<string | null>(appliedPromoId)

    // Popover
    const [anchorEl, setAnchorEl] = React.useState<HTMLElement | null>(null)
    const open = Boolean(anchorEl)
    const handleOpen = (e: React.MouseEvent<HTMLElement>) => {
        setDraftPromoId(appliedPromoId)
        setAnchorEl(e.currentTarget)
    }
    const handleClose = () => setAnchorEl(null)

    // Filter & search lokal
    const [channelFilter, setChannelFilter] = React.useState<Channel | 'All'>('All')
    const [q, setQ] = React.useState('')

    const filtered = React.useMemo(() => {
        const byCh = channelFilter === 'All' ? PROMOS : PROMOS.filter(p => p.channel === channelFilter)
        const byQ = q.trim()
            ? byCh.filter(p =>
                [p.name, p.code, p.desc, ...(p.tags ?? [])]
                    .filter(Boolean)
                    .join(' ')
                    .toLowerCase()
                    .includes(q.toLowerCase())
            )
            : byCh
        return byQ
    }, [channelFilter, q])

    const appliedPromo = React.useMemo(
        () => PROMOS.find(p => p.id === appliedPromoId) || null,
        [appliedPromoId]
    )
    const draftPromo = React.useMemo(
        () => PROMOS.find(p => p.id === draftPromoId) || null,
        [draftPromoId]
    )

    const clearApplied = () => setAppliedPromoId(null)
    const applyDraft = () => { setAppliedPromoId(draftPromoId); handleClose() }

    // Label tombol
    const labelTop = appliedPromo ? appliedPromo.name : 'Pilih promo'
    const labelBottom = appliedPromo?.code ? appliedPromo.code : (appliedPromo ? (appliedPromo.channel) : ' ')

    return (
        <Box sx={{ width: '100%', my: 1 }}>
            {/* Trigger */}
            <Paper
                variant="outlined"
                sx={(t) => ({
                    p: 1,
                    borderRadius: 1.5,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 1,
                    cursor: 'pointer',
                    borderColor: appliedPromo ? t.palette.primary.main : 'divider',
                    bgcolor: appliedPromo
                        ? (t.palette.mode === 'dark' ? 'rgba(25,118,210,0.10)' : 'rgba(25,118,210,0.06)')
                        : (t.palette.mode === 'dark' ? t.palette.grey[900] : t.palette.background.paper),
                })}
                onClick={handleOpen}
            >
                <Stack direction="row" alignItems="center" spacing={1} sx={{ minWidth: 0 }}>
                    <LocalOfferRounded fontSize="small" />
                    <Stack minWidth={0}>
                        <Typography fontWeight={900} noWrap>{labelTop}</Typography>
                        <Typography variant="caption" color="text.secondary" noWrap>
                            {labelBottom}
                        </Typography>
                    </Stack>
                </Stack>

                {appliedPromo && (
                    <Tooltip title="Hapus promo">
                        <IconButton size="small" onClick={(e) => { e.stopPropagation(); clearApplied() }}>
                            <ClearRounded fontSize="small" />
                        </IconButton>
                    </Tooltip>
                )}
            </Paper>

            {/* Popover: buka KE ATAS */}
            <Popover
                open={open}
                anchorEl={anchorEl}
                onClose={handleClose}
                anchorOrigin={{ vertical: 'top', horizontal: 'left' }}
                transformOrigin={{ vertical: 'bottom', horizontal: 'left' }}
                elevation={8}
                slotProps={{ paper: { sx: { borderRadius: 2, p: 1.5, width: 420, maxWidth: '92vw' } } }}
            >
                <Stack spacing={1}>
                    {/* Filter & Search */}
                    <Stack direction="row" alignItems="center" spacing={1}>
                        <Chip
                            size="small"
                            icon={<FilterAltRounded />}
                            label={channelFilter === 'All' ? 'Semua' : channelFilter}
                            onClick={() => {
                                setChannelFilter(prev => {
                                    if (prev === 'All') return 'Outlet'
                                    if (prev === 'Outlet') return 'Online'
                                    if (prev === 'Online') return 'Partner'
                                    return 'All'
                                })
                            }}
                            variant="outlined"
                        />
                        <TextField
                            size="small"
                            placeholder="Cari promo..."
                            value={q}
                            onChange={(e) => setQ(e.target.value)}
                            fullWidth
                        />
                    </Stack>

                    <Divider />

                    {/* List promo dengan PerfectScrollbar */}
                    <Box sx={{ height: 280, borderRadius: 1, overflow: 'hidden', border: '1px solid', borderColor: 'divider' }}>
                        <PerfectScrollbar style={{ height: '100%' }} options={{ suppressScrollX: true }}>
                            <Stack spacing={0.5} sx={{ p: 0.5 }}>
                                {filtered.length === 0 ? (
                                    <Typography variant="body2" color="text.secondary" sx={{ p: 1 }}>
                                        Promo tidak ditemukan.
                                    </Typography>
                                ) : filtered.map(promo => (
                                    <PromoItem
                                        key={promo.id}
                                        promo={promo}
                                        selected={draftPromoId === promo.id}
                                        onSelect={() => setDraftPromoId(promo.id)}
                                    />
                                ))}
                            </Stack>
                        </PerfectScrollbar>
                    </Box>

                    {/* Footer actions */}
                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                        <Button color="inherit" onClick={() => setDraftPromoId(null)}>Kosongkan</Button>
                        <Button variant="contained" onClick={applyDraft}>Selesai</Button>
                    </Stack>
                </Stack>
            </Popover>
        </Box>
    )
}

export default PromoWidget
