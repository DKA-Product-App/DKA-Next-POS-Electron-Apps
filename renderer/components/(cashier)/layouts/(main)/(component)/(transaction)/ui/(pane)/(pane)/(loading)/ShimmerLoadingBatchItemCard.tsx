'use client'

import * as React from 'react'
import { Box, Chip, ListItem, Skeleton, Stack, Typography } from '@mui/material'
import LayersRounded from '@mui/icons-material/LayersRounded'
import LocalMallRounded from '@mui/icons-material/LocalMallRounded'

const ShimmerLoadingBatchItemCard: React.FC = () => (
    <>
        <ListItem
            disableGutters
            sx={{
                position: 'relative',
                alignItems: 'flex-start',
                py: 1.1,
                px: 1.4,
                mb: 0,
                border: '1px solid',
                borderColor: 'divider',
                bgcolor: 'background.paper',
                borderBottomLeftRadius: 0,
                borderBottomRightRadius: 0,
                borderTopLeftRadius: 8,
                borderTopRightRadius: 8,
                '&::before': {
                    content: '""',
                    position: 'absolute',
                    left: 0,
                    top: 0,
                    bottom: 0,
                    width: 4,
                    borderTopLeftRadius: 8,
                    background: 'linear-gradient(180deg, rgba(99,102,241,.3), rgba(139,92,246,.3) 35%, rgba(236,72,153,.3))',
                },
            }}
        >
            <Stack spacing={1.1} width="100%">
                {/* Baris 1: Judul + Harga */}
                <Stack direction="row" alignItems="center" justifyContent="space-between" gap={1}>
                    <Stack direction="row" spacing={1} alignItems="center" minWidth={0}>
                        <LayersRounded fontSize="small" color="disabled" />
                        <Skeleton variant="rounded" width={72} height={24} />
                        <Chip size="small" label={<Skeleton variant="text" width={36} />} />
                    </Stack>
                    <Skeleton variant="text" width={96} />
                </Stack>

                {/* Baris 2: item/qty kiri, PRINT kanan */}
                <Stack direction="row" alignItems="center" gap={0.75}>
                    <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap sx={{ flex: 1, minWidth: 0 }}>
                        <Chip size="small" icon={<LocalMallRounded />} label={<Skeleton variant="text" width={40} />} />
                        <Chip size="small" icon={<LocalMallRounded />} label={<Skeleton variant="text" width={40} />} />
                    </Stack>
                    <Skeleton variant="rounded" width={120} height={28} sx={{ borderRadius: 1 }} />
                </Stack>

                {/* Baris 3: time_created */}
                <Skeleton variant="text" width={180} />
            </Stack>
        </ListItem>

        {/* Footer (nempel di bawah card) */}
        <Box
            sx={{
                border: '1px solid',
                borderTop: 'none',
                borderColor: 'divider',
                borderBottomLeftRadius: 8,
                borderBottomRightRadius: 8,
                px: 1.4,
                py: 0.75,
                mb: 1,
                bgcolor: 'action.hover',
            }}
        >
            <Typography variant="caption" sx={{ opacity: 0.6 }}>
                <Skeleton variant="text" width="40%" />
            </Typography>
        </Box>
    </>
)

export default ShimmerLoadingBatchItemCard
