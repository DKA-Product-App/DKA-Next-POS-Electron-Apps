// ShimmerLoadingTransactionListItemRow.tsx
'use client'

import * as React from 'react'
import { Box, Stack, Skeleton } from '@mui/material'

type Props = {
    selected?: boolean
    closed?: boolean
}

const ShimmerLoadingTransactionListItemRow: React.FC<Props> = ({ selected = false, closed = false }) => {
    const cardBorderColor = selected ? 'primary.outlinedBorder' : (closed ? 'error.light' : 'divider')

    return (
        <>
            {/* Card header/body */}
            <Box
                sx={{
                    position: 'relative',
                    border: '1px solid',
                    borderColor: cardBorderColor,
                    bgcolor: selected ? 'action.selected' : (closed ? 'action.hover' : 'background.paper'),
                    boxShadow: selected ? '0 10px 24px rgba(0,0,0,0.12)' : '0 2px 8px rgba(0,0,0,0.04)',
                    borderTopLeftRadius: 8, borderTopRightRadius: 8,
                    borderBottomLeftRadius: 0, borderBottomRightRadius: 0,
                    p: 1.5, mb: 0,
                    '&::before': {
                        content: '""',
                        position: 'absolute',
                        left: 0, top: 0, bottom: 0, width: 4,
                        borderTopLeftRadius: 8, borderBottomLeftRadius: 0,
                        background: selected
                            ? 'linear-gradient(180deg, #6366F1, #8B5CF6 35%, #EC4899)'
                            : (closed ? 'linear-gradient(180deg, #ef4444, #dc2626 60%, #b91c1c)' : 'transparent'),
                    },
                }}
            >
                <Stack spacing={0.75}>
                    {/* Baris 1: invoice + chips + total */}
                    <Stack direction="row" alignItems="center" justifyContent="space-between" gap={1}>
                        <Stack direction="row" spacing={1} alignItems="center" minWidth={0}>
                            <Skeleton variant="circular" width={18} height={18} />
                            <Skeleton variant="rectangular" width={120} height={18} sx={{ borderRadius: 1 }} />
                            <Skeleton variant="rectangular" width={72} height={20} sx={{ borderRadius: 999 }} />
                            <Skeleton variant="rectangular" width={64} height={20} sx={{ borderRadius: 999 }} />
                        </Stack>
                        <Skeleton variant="rectangular" width={96} height={20} sx={{ borderRadius: 1 }} />
                    </Stack>

                    {/* Baris 2: status + item/batch + tombol print */}
                    <Stack direction="row" alignItems="center" gap={0.75}>
                        <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap sx={{ flex: 1, minWidth: 0 }}>
                            <Skeleton variant="rectangular" width={64} height={20} sx={{ borderRadius: 999 }} />
                            <Skeleton variant="rectangular" width={84} height={20} sx={{ borderRadius: 999 }} />
                            <Skeleton variant="rectangular" width={84} height={20} sx={{ borderRadius: 999 }} />
                        </Stack>
                        <Skeleton variant="rectangular" width={28} height={28} sx={{ borderRadius: 1 }} />
                    </Stack>

                    {/* Baris 3: kasir + shift */}
                    <Stack direction="row" alignItems="center" gap={0.75}>
                        <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap sx={{ flex: 1, minWidth: 0 }}>
                            <Skeleton variant="rectangular" width={120} height={20} sx={{ borderRadius: 999 }} />
                            <Skeleton variant="rectangular" width={92} height={20} sx={{ borderRadius: 999 }} />
                        </Stack>
                    </Stack>

                    {/* Baris 4: timestamp + checkbox */}
                    <Stack direction="row" alignItems="center" justifyContent="space-between">
                        <Skeleton variant="rectangular" width={160} height={16} sx={{ borderRadius: 1 }} />
                        {!closed && <Skeleton variant="circular" width={22} height={22} />}
                    </Stack>
                </Stack>
            </Box>

            {/* Footer nempel */}
            <Box
                sx={{
                    border: '1px solid',
                    borderTop: 'none',
                    borderColor: cardBorderColor,
                    borderBottomLeftRadius: 8, borderBottomRightRadius: 8,
                    bgcolor: closed ? 'error.main' : 'success.main',
                    color: closed ? 'error.contrastText' : 'success.contrastText',
                    px: 1.5, py: 0.8, mb: 1,
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1,
                }}
            >
                <Skeleton
                    variant="rectangular"
                    sx={{ bgcolor: 'rgba(255,255,255,0.35)', borderRadius: 1 }}
                    width="40%"
                    height={14}
                />
                <Skeleton
                    variant="rectangular"
                    sx={{ bgcolor: 'rgba(255,255,255,0.35)', borderRadius: 1 }}
                    width="20%"
                    height={14}
                />
            </Box>
        </>
    )
}

export default React.memo(ShimmerLoadingTransactionListItemRow)
