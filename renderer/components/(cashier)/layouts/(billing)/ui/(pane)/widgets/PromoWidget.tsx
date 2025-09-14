'use client';

import * as React from 'react'
import {
    Box, Button, Chip, IconButton, Popover,
    Stack, TextField, Typography, Tooltip, Paper, InputAdornment
} from '@mui/material'
import LocalOfferRounded from '@mui/icons-material/LocalOfferRounded'
import ClearRounded from '@mui/icons-material/ClearRounded'
import KeyRounded from '@mui/icons-material/KeyRounded'
import AccessTimeRounded from '@mui/icons-material/AccessTimeRounded'

type Channel = 'Outlet' | 'Online' | 'Partner'
type Promo = {
    id: string
    name: string
    code: string
    channel: Channel
    desc?: string
    expiresAt?: string
    tags?: string[]
}

const ChannelColor: Record<Channel, 'default'|'primary'|'secondary'|'success'|'warning'|'info'|'error'> = {
    Outlet: 'primary',
    Online: 'success',
    Partner: 'info',
}

/** =========================
 *  DUMMY “secret code store”
 *  ========================= */
const SECRET_PROMO_BY_CODE: Record<string, Promo> = {
    // contoh dummynya:
    // NOTE: case-insensitive check di applyPromoCode()
    'HEMAT10': {
        id: 'p01',
        name: 'Dine In Hemat 10%',
        code: 'HEMAT10',
        channel: 'Outlet',
        desc: 'Potongan khusus makan di tempat, Senin–Jumat.',
        expiresAt: '2025-12-31',
        tags: ['Dine In', 'Weekday']
    },
    'MEMBER-ONLY': {
        id: 'p05',
        name: 'Member Special',
        code: 'MEMBER-ONLY',
        channel: 'Outlet',
        desc: 'Promo eksklusif untuk member terdaftar.',
        expiresAt: '2025-12-01',
        tags: ['Member']
    },
    'JADWALIN': {
        id: 'p04',
        name: 'Scheduled Saver',
        code: 'JADWALIN',
        channel: 'Partner',
        desc: 'Diskon khusus pesanan terjadwal (pre-order).',
        expiresAt: '2026-01-15',
        tags: ['Scheduled']
    },
    // contoh untuk channel online (tanpa menampilkan daftar):
    'GOFOOD-CB': {
        id: 'p03',
        name: 'Online Order Cashback',
        code: 'GOFOOD-CB',
        channel: 'Online',
        desc: 'Cashback untuk pemesanan via platform online.',
        expiresAt: '2025-11-30',
        tags: ['GoFood', 'ShopeeFood']
    },
};

const PromoWidgetSecret: React.FC = () => {
    // applied promo = yang aktif di transaksi
    const [applied, setApplied] = React.useState<Promo | null>(null)

    // popover
    const [anchorEl, setAnchorEl] = React.useState<HTMLElement | null>(null)
    const open = Boolean(anchorEl)
    const handleOpen = (e: React.MouseEvent<HTMLElement>) => setAnchorEl(e.currentTarget)
    const handleClose = () => {
        setAnchorEl(null)
        setCode('')
        setErr('')
    }

    // input kode
    const [code, setCode] = React.useState('')
    const [err, setErr] = React.useState('')

    const normalize = (s: string) => s.trim().toUpperCase()

    const applyPromoCode = () => {
        const key = normalize(code)
        const promo = SECRET_PROMO_BY_CODE[key]
        if (!key) {
            setErr('Masukkan kode promo.')
            return
        }
        if (!promo) {
            setErr('Kode promo tidak valid.')
            return
        }
        // optional: validasi tanggal kadaluarsa
        if (promo.expiresAt && new Date(promo.expiresAt) < new Date()) {
            setErr('Kode promo sudah kedaluwarsa.')
            return
        }
        setApplied(promo)
        handleClose()
    }

    const clearApplied = () => setApplied(null)

    // label tombol
    const labelTop = applied ? applied.name : 'Pakai kode promo'
    const labelBottom = applied ? applied.code : '—'

    return (
        <Box sx={{ width: '100%', my: 1 }}>
            {/* Trigger (tidak menampilkan list apa pun) */}
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
                    borderColor: applied ? t.palette.primary.main : 'divider',
                    bgcolor: applied
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

                {applied && (
                    <Stack direction="row" spacing={1} alignItems="center">
                        <Chip
                            size="small"
                            label={applied.channel}
                            color={ChannelColor[applied.channel]}
                            variant="outlined"
                            sx={{ height: 20 }}
                        />
                        <Tooltip title="Hapus promo">
                            <IconButton size="small" onClick={(e) => { e.stopPropagation(); clearApplied() }}>
                                <ClearRounded fontSize="small" />
                            </IconButton>
                        </Tooltip>
                    </Stack>
                )}
            </Paper>

            {/* Popover: hanya input kode */}
            <Popover
                open={open}
                anchorEl={anchorEl}
                onClose={handleClose}
                anchorOrigin={{ vertical: 'top', horizontal: 'left' }}
                transformOrigin={{ vertical: 'bottom', horizontal: 'left' }}
                elevation={8}
                slotProps={{ paper: { sx: { borderRadius: 2, p: 1.5, width: 420, maxWidth: '92vw' } } }}
            >
                <Stack spacing={1.5}>
                    <Typography fontWeight={800}>Masukkan Kode Promo</Typography>

                    <TextField
                        value={code}
                        onChange={(e) => { setCode(e.target.value); if (err) setErr('') }}
                        onKeyDown={(e) => { if (e.key === 'Enter') applyPromoCode() }}
                        placeholder="Contoh: HEMAT10"
                        size="small"
                        autoFocus
                        error={!!err}
                        helperText={err || 'Kode case-insensitive. Tekan Enter untuk menerapkan.'}
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position="start">
                                    <KeyRounded fontSize="small" />
                                </InputAdornment>
                            ),
                        }}
                    />

                    {/* Jika sudah ada promo aktif, tunjukkan ringkasan (tanpa list) */}
                    {applied && (
                        <Paper variant="outlined" sx={{ p: 1, borderRadius: 1.5 }}>
                            <Stack spacing={0.5}>
                                <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
                                    <Typography fontWeight={900}>{applied.name}</Typography>
                                    <Chip size="small" label={applied.code} variant="outlined" sx={{ height: 20 }} />
                                    <Chip size="small" label={applied.channel} color={ChannelColor[applied.channel]} variant="outlined" sx={{ height: 20 }} />
                                </Stack>
                                {applied.desc && (
                                    <Typography variant="caption" color="text.secondary">
                                        {applied.desc}
                                    </Typography>
                                )}
                                {applied.expiresAt && (
                                    <Chip
                                        size="small"
                                        icon={<AccessTimeRounded sx={{ fontSize: 14 }} />}
                                        label={`Sampai ${new Date(applied.expiresAt).toLocaleDateString('id-ID')}`}
                                        variant="outlined"
                                        sx={{ height: 20, width: 'fit-content' }}
                                    />
                                )}
                            </Stack>
                        </Paper>
                    )}

                    <Stack direction="row" justifyContent="flex-end" spacing={1}>
                        <Button color="inherit" onClick={handleClose}>Tutup</Button>
                        <Button variant="contained" onClick={applyPromoCode}>Terapkan</Button>
                    </Stack>
                </Stack>
            </Popover>
        </Box>
    )
}

export default PromoWidgetSecret
