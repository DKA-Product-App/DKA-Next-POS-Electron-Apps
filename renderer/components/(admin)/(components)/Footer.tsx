'use client'

import * as React from 'react'
import { Box, Typography, Stack, Chip, alpha } from '@mui/material'
import dynamic from 'next/dynamic'

type Shortcut = { key: string; label: string }

const SHORTCUTS: Shortcut[] = [
    { key: 'F7', label: 'Layar Penuh' },
    { key: 'F8', label: 'Dev Mode' },
]

const UptimeWidget  = dynamic(() => import('./(ui)/UptimeWidget'),  { ssr: false })
const BranchWidget  = dynamic(() => import('./(ui)/BranchWidget'),  { ssr: false })
const ShiftWidget   = dynamic(() => import('./(ui)/ShiftWidget'),   { ssr: false })

export default function Footer() {
    return (
        <Box
            component="footer"
            sx={(t) => ({
                height: 64,
                px: 2,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                position: 'relative',
                zIndex: 2,
                // Glassy + border lembut
                bgcolor:
                    t.palette.mode === 'dark'
                        ? alpha('#0B1020', 0.6)
                        : alpha('#ffffff', 0.75),
                backdropFilter: 'blur(10px)',
                borderTop: `1px solid ${alpha(t.palette.divider, 0.8)}`,
                boxShadow:
                    t.palette.mode === 'dark'
                        ? `0 -8px 24px ${alpha('#8B5CF6', 0.12)}`
                        : `0 -8px 24px ${alpha('#8B5CF6', 0.16)}`,
                // Accent gradient bar di atas footer
                '&::before': {
                    content: '""',
                    position: 'absolute',
                    top: -2,
                    left: 0,
                    right: 0,
                    height: 2,
                    background:
                        'linear-gradient(90deg, #7C3AED, #8B5CF6 35%, #A78BFA 65%, #EC4899)',
                    opacity: 0.9,
                },
                // Shimmer lembut
                '&::after': {
                    content: '""',
                    position: 'absolute',
                    inset: 0,
                    pointerEvents: 'none',
                    background:
                        'linear-gradient(120deg, transparent 0%, rgba(139,92,246,0.06) 25%, transparent 50%)',
                    maskImage:
                        'radial-gradient(80% 140% at 0% 0%, rgba(0,0,0,0.9), transparent 70%)',
                    animation: 'footerSheen 6s linear infinite',
                },
                '@keyframes footerSheen': {
                    '0%': { backgroundPosition: '-200% 0' },
                    '100%': { backgroundPosition: '200% 0' },
                },
            })}
        >
            {/* Kiri: shortcut keys */}
            <Stack direction="row" spacing={2} sx={{ flexWrap: 'wrap', alignItems: 'center' }}>
                {SHORTCUTS.map((s) => (
                    <Stack key={s.key} direction="row" spacing={1} alignItems="center">
                        <Chip
                            size="small"
                            label={s.key}
                            sx={(t) => ({
                                fontWeight: 800,
                                fontSize: 12,
                                minWidth: 46,
                                justifyContent: 'center',
                                borderRadius: 1.5,
                                px: 0.5,
                                color: t.palette.mode === 'dark' ? '#EDE9FE' : '#4C1D95',
                                background:
                                    t.palette.mode === 'dark'
                                        ? 'linear-gradient(135deg, rgba(124,58,237,0.25), rgba(139,92,246,0.18))'
                                        : 'linear-gradient(135deg, rgba(167,139,250,0.35), rgba(139,92,246,0.2))',
                                border: `1px solid ${alpha('#8B5CF6', 0.6)}`,
                                boxShadow: `0 1px 8px ${alpha('#8B5CF6', 0.25)}`,
                                '& .MuiChip-label': { px: 1 },
                            })}
                        />
                        <Typography variant="body2" sx={{ fontSize: 13 }}>
                            {s.label}
                        </Typography>
                    </Stack>
                ))}
            </Stack>

            {/* Kanan: copyright */}
            <Stack direction="row" spacing={2} sx={{ alignItems: 'center' }}>
                <Box
                    sx={{
                        px: 1,
                        py: 0.25,
                        borderRadius: 1.5,
                        background:
                            'linear-gradient(135deg, rgba(124,58,237,0.16), rgba(236,72,153,0.12))',
                        border: `1px solid ${alpha('#7C3AED', 0.35)}`,
                    }}
                >
                    <Typography
                        variant="caption"
                        sx={{
                            color: (t) =>
                                t.palette.mode === 'dark' ? '#EDE9FE' : '#4C1D95',
                            whiteSpace: 'nowrap',
                            fontWeight: 600,
                            letterSpacing: 0.2,
                        }}
                    >
                        © {new Date().getFullYear()} DKA Cashier POS
                    </Typography>
                </Box>
            </Stack>
        </Box>
    )
}
