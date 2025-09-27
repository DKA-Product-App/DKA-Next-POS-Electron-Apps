'use client'

import * as React from 'react'
import { Box, Stack } from '@mui/material'

/**
 * Shimmer bar util
 * - width/height fleksibel via props
 * - rounded biar match chip/card
 */
const Shimmer: React.FC<{ w: number | string; h: number | string; r?: number | string }> = ({ w, h, r = 8 }) => (
    <Box
        sx={{
            width: w,
            height: h,
            borderRadius: r,
            position: 'relative',
            overflow: 'hidden',
            bgcolor: 'action.hover',
            '&::after': {
                content: '""',
                position: 'absolute',
                inset: 0,
                transform: 'translateX(-100%)',
                background:
                    'linear-gradient(90deg, transparent, rgba(255,255,255,0.35), transparent)',
                animation: 'shimmerMove 1.2s ease-in-out infinite',
            },
            '@keyframes shimmerMove': {
                '0%':   { transform: 'translateX(-100%)' },
                '100%': { transform: 'translateX(100%)'  },
            },
        }}
    />
)

type Props = {
    /** Biar bisa tampil “selected style” waktu loading setelah klik */
    selected?: boolean
}

/**
 * Skeleton untuk LeftContainerBatchListRow
 * Struktur: Card (header+content) + Footer bar
 */
const LeftContainerBatchListRowSkeleton: React.FC<Props> = ({ selected = false }) => {
    const borderColor = selected ? 'primary.outlinedBorder' : 'divider'

    return (
        <>
            {/* Card */}
            <Box
                sx={{
                    position: 'relative',
                    py: 1.1, px: 1.4, mb: 0,
                    border: '1px solid',
                    borderColor,
                    bgcolor: selected ? 'action.selected' : 'background.paper',
                    boxShadow: selected ? '0 10px 24px rgba(0,0,0,0.12)' : '0 2px 8px rgba(0,0,0,0.04)',
                    borderBottomLeftRadius: 0,
                    borderBottomRightRadius: 0,
                    borderTopLeftRadius: 8,
                    borderTopRightRadius: 8,
                    '&::before': {
                        content: '""', position: 'absolute', left: 0, top: 0, bottom: 0, width: 4,
                        borderTopLeftRadius: 8,
                        background: selected
                            ? 'linear-gradient(180deg, #6366F1, #8B5CF6 35%, #EC4899)'
                            : 'transparent',
                    },
                }}
            >
                <Stack spacing={1.1} width="100%">
                    {/* Baris 1: Judul + Harga */}
                    <Stack direction="row" alignItems="center" justifyContent="space-between" gap={1}>
                        <Stack direction="row" spacing={1} alignItems="center" minWidth={0}>
                            {/* Icon dot */}
                            <Shimmer w={18} h={18} r={999} />
                            {/* #batch */}
                            <Shimmer w={90} h={24} />
                            {/* Chip status */}
                            <Shimmer w={64} h={22} r={999} />
                        </Stack>
                        {/* Harga */}
                        <Shimmer w={120} h={20} />
                    </Stack>

                    {/* Baris 2: chip item/qty + placeholder tombol print */}
                    <Stack direction="row" alignItems="center" gap={0.75}>
                        <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap sx={{ flex: 1, minWidth: 0 }}>
                            <Shimmer w={90} h={24} r={999} />
                            <Shimmer w={90} h={24} r={999} />
                        </Stack>
                        {/* Tombol print placeholder */}
                        <Shimmer w={140} h={28} />
                    </Stack>

                    {/* Baris 3: active/pending */}
                    <Stack direction="row" alignItems="center" gap={0.75}>
                        <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap sx={{ flex: 1, minWidth: 0 }}>
                            <Shimmer w={100} h={24} r={999} />
                            <Shimmer w={110} h={24} r={999} />
                        </Stack>
                    </Stack>

                    {/* Timestamp */}
                    <Shimmer w={180} h={14} r={4} />
                </Stack>
            </Box>

            {/* Footer bar */}
            <Box
                sx={{
                    border: '1px solid',
                    borderTop: 'none',
                    borderColor,
                    borderBottomLeftRadius: 8,
                    borderBottomRightRadius: 8,
                    px: 1.4, py: 0.75, mb: 1,
                    bgcolor: 'action.selected',
                }}
            >
                <Shimmer w={220} h={14} r={4} />
            </Box>
        </>
    )
}

export default LeftContainerBatchListRowSkeleton
