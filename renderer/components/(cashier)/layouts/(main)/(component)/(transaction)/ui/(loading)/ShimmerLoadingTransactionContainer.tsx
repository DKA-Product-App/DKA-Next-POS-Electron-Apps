// ShimmerLoadingTransactionContainer.tsx
'use client'

import * as React from 'react'
import { Box, Paper, Stack, Skeleton, Chip, Button } from '@mui/material'
import ReceiptLongRounded from '@mui/icons-material/ReceiptLongRounded'
import PersonOutlineRounded from '@mui/icons-material/PersonOutlineRounded'
import AccessTimeRounded from '@mui/icons-material/AccessTimeRounded'
import TableRestaurantRounded from '@mui/icons-material/TableRestaurantRounded'

type Props = {
    // optional hint biar warna header/footer nyamain state real
    closed?: boolean
    // optional: tinggi minimum area tengah biar gak lompat
    minCenterHeight?: number
}

const ShimmerLoadingTransactionContainer: React.FC<Props> = ({ closed = false, minCenterHeight = 340 }) => {
    const headerBgGrad = closed
        ? 'linear-gradient(90deg, #ef4444, #dc2626 35%, #b91c1c)'
        : 'linear-gradient(90deg, #22c55e, #16a34a 35%, #15803d)'

    return (
        <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            {/* ===== Header ===== */}
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
                        background: headerBgGrad,
                        opacity: t.palette.mode === 'dark' ? 0.18 : 0.12,
                    },
                    '& > *': { position: 'relative', zIndex: 1 },
                })}
            >
                <ReceiptLongRounded fontSize="small" />
                <Skeleton variant="rectangular" width={120} height={18} sx={{ borderRadius: 1 }} />
                <Chip size="small" label={<Skeleton width={40} />} variant="outlined" />
                <Chip size="small" icon={<TableRestaurantRounded />} label={<Skeleton width={60} />} />
                <Chip size="small" icon={<PersonOutlineRounded />} label={<Skeleton width={60} />} />
                <Chip size="small" icon={<AccessTimeRounded />} label={<Skeleton width={60} />} />
                <Box sx={{ flex: 1 }} />
                <Stack direction="row" alignItems="center" spacing={1}>
                    <Skeleton variant="circular" width={18} height={18} />
                    <Skeleton variant="rectangular" width={120} height={18} sx={{ borderRadius: 1 }} />
                    <Skeleton variant="circular" width={28} height={28} />
                </Stack>
            </Paper>

            {/* ===== Resizable Center Area (fake) ===== */}
            <Box sx={{ flex: 1, minHeight: 0 }}>
                <Box
                    sx={{
                        display: 'grid',
                        gridTemplateColumns: { xs: '1fr', md: 'minmax(330px, 25%) 1fr' },
                        height: '100%',
                        minHeight: minCenterHeight,
                        position: 'relative',
                    }}
                >
                    {/* Left pane */}
                    <Box
                        sx={{
                            borderRight: { md: '1px solid' },
                            borderBottom: { xs: '1px solid', md: 'none' },
                            borderColor: 'divider',
                            p: 1,
                            overflow: 'hidden',
                        }}
                    >
                        <Stack spacing={1}>
                            <Skeleton variant="rectangular" height={36} sx={{ borderRadius: 1 }} />
                            <Skeleton variant="rectangular" height={36} sx={{ borderRadius: 1 }} />
                            <Skeleton variant="rectangular" height={36} sx={{ borderRadius: 1 }} />
                            <Skeleton variant="rectangular" height={36} sx={{ borderRadius: 1 }} />
                            <Skeleton variant="rectangular" height={36} sx={{ borderRadius: 1 }} />
                            <Skeleton variant="rectangular" height={36} sx={{ borderRadius: 1 }} />
                        </Stack>
                    </Box>

                    {/* Resizer ghost (vertikal) */}
                    <Box
                        aria-hidden
                        sx={{
                            display: { xs: 'none', md: 'block' },
                            width: '3px',
                            cursor: 'col-resize',
                            bgcolor: 'transparent',
                            position: 'absolute',
                            left: 'min(330px, 25%)',
                            top: 0,
                            bottom: 0,
                            '&::after': {
                                content: '""',
                                position: 'absolute',
                                inset: 0,
                                bgcolor: 'divider',
                                opacity: 0.6,
                            },
                        }}
                    />

                    {/* Right pane */}
                    <Box sx={{ p: 1, overflow: 'hidden' }}>
                        <Stack spacing={1}>
                            <Skeleton variant="rectangular" height={44} sx={{ borderRadius: 1 }} />
                            <Skeleton variant="rectangular" height={120} sx={{ borderRadius: 1 }} />
                            <Skeleton variant="rectangular" height={44} sx={{ borderRadius: 1 }} />
                            <Skeleton variant="rectangular" height={240} sx={{ borderRadius: 1 }} />
                        </Stack>
                    </Box>
                </Box>
            </Box>

            {/* ===== Footer ===== */}
            <Paper elevation={0} sx={{ px: 1.5, py: 1.25, borderTop: '1px solid', borderColor: 'divider' }}>
                <Stack direction="row" alignItems="center" justifyContent="space-between" flexWrap="wrap" gap={1.5}>
                    {/* Kiri: Total + Info ringkas */}
                    <Box sx={{ display: 'grid', gap: 0.5, minWidth: 260 }}>
                        <Skeleton variant="rectangular" width={120} height={14} sx={{ borderRadius: 1 }} />
                        <Skeleton variant="rectangular" width={160} height={36} sx={{ borderRadius: 1 }} />
                        <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap mt={0.5}>
                            <Chip size="small" label={<Skeleton width={80} />} />
                            <Chip size="small" variant="outlined" label={<Skeleton width={100} />} />
                            <Chip size="small" label={<Skeleton width={60} />} />
                        </Stack>
                    </Box>

                    {/* Kanan: Aksi */}
                    <Stack direction="row" gap={1}>
                        <Button disabled variant="outlined" sx={{ textTransform: 'none', fontWeight: 800, borderRadius: 1.5 }}>
                            <Skeleton variant="rectangular" width={72} height={20} />
                        </Button>
                        <Button disabled variant="outlined" color="error" sx={{ textTransform: 'none', fontWeight: 800, borderRadius: 1.5 }}>
                            <Skeleton variant="rectangular" width={52} height={20} />
                        </Button>
                        <Button disabled variant="outlined" sx={{ textTransform: 'none', fontWeight: 800, borderRadius: 1.5 }}>
                            <Skeleton variant="rectangular" width={52} height={20} />
                        </Button>
                    </Stack>
                </Stack>
            </Paper>
        </Box>
    )
}

export default React.memo(ShimmerLoadingTransactionContainer)
