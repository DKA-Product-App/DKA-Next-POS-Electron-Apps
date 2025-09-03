'use client'

import * as React from 'react'
import { Box, Typography, Stack, Chip } from '@mui/material'

type Shortcut = {
    key: string
    label: string
}

const SHORTCUTS: Shortcut[] = [
    { key: 'F2', label: 'Tambah Item' },
    { key: 'F3', label: 'Cari Produk' },
    { key: 'F4', label: 'Diskon' },
    { key: 'F5', label: 'Pembayaran' },
    { key: 'ESC', label: 'Batal / Keluar' },
]

export default function Footer() {
    return (
        <Box
            component="footer"
            sx={{
                height: 50,
                px: 2,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                borderTop: '1px solid',
                borderColor: 'divider',
                bgcolor: 'background.paper',
                position: 'relative',
                zIndex: 2,
            }}
        >
            {/* kiri: shortcut keys */}
            <Stack
                direction="row"
                spacing={2}
                sx={{
                    flexWrap: 'wrap',
                    alignItems: 'center',
                }}
            >
                {SHORTCUTS.map((s) => (
                    <Stack key={s.key} direction="row" spacing={1} alignItems="center">
                        <Chip
                            size="small"
                            label={s.key}
                            sx={{
                                fontWeight: 700,
                                fontSize: 12,
                                minWidth: 44,
                                justifyContent: 'center',
                                border: '1px solid',
                                borderColor: 'divider',
                                bgcolor: (t) =>
                                    t.palette.mode === 'dark'
                                        ? 'rgba(255,255,255,0.08)' // abu gelap transparan
                                        : 'grey.200',              // abu terang
                                color: (t) =>
                                    t.palette.mode === 'dark'
                                        ? t.palette.text.primary   // teks default terang di dark
                                        : t.palette.text.primary,  // teks default gelap di light
                                '& .MuiChip-label': { px: 1 },
                            }}
                        />
                        <Typography variant="body2" sx={{ fontSize: 13 }}>
                            {s.label}
                        </Typography>
                    </Stack>
                ))}
            </Stack>

            {/* kanan: copyright */}
            <Typography
                variant="caption"
                sx={{ color: 'text.secondary', whiteSpace: 'nowrap' }}
            >
                © {new Date().getFullYear()} DKA Cashier POS
            </Typography>
        </Box>
    )
}
