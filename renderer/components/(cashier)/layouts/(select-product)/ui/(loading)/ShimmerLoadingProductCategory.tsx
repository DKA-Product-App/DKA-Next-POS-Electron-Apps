'use client'

import React, { FC, memo } from 'react'
import { Tabs, Tab, Stack, Skeleton, Box } from '@mui/material'

type Props = {
    /** jumlah kategori (di luar "All") */
    count?: number
    indicatorGradient?: string
}

const ChipSkeleton: FC = () => (
    <Box
        sx={{
            px: 1,
            py: 0.25,
            borderRadius: 1.5,
            border: '1px solid',
            borderColor: 'divider',
            minWidth: 28,
        }}
    >
        <Skeleton variant="text" width={18} height={16} sx={{ transform: 'none', mx: 'auto' }} />
    </Box>
)

const ShiummerLoadingProductCategory: FC<Props> = ({ count = 6, indicatorGradient = 'linear-gradient(90deg, #6366F1, #8B5CF6 35%, #EC4899)' }) => {
    // width label deterministik biar nggak mismatch SSR/CSR
    const widths = [28, 64, 84, 56, 96, 72, 110, 60]
    const items = Array.from({ length: count + 1 }) // +1 untuk "All"

    return (
        <Tabs
            value={0}
            onChange={() => {}}
            variant="scrollable"
            allowScrollButtonsMobile
            aria-busy
            sx={{
                mt: 1,
                pointerEvents: 'none', // biar nggak bisa diklik pas loading
                '.MuiTabs-indicator': { height: 3, borderRadius: 3, background: indicatorGradient },
                '.MuiTab-root': {
                    textTransform: 'none',
                    fontWeight: 700,
                    minHeight: 36,
                    px: 1.25,
                    opacity: 0.6,
                },
            }}
        >
            {items.map((_, i) => (
                <Tab
                    key={i}
                    disabled
                    label={
                        <Stack direction="row" spacing={1} alignItems="center">
                            <Skeleton variant="text" width={widths[i % widths.length]} height={18} sx={{ transform: 'none' }} />
                            <ChipSkeleton />
                        </Stack>
                    }
                />
            ))}
        </Tabs>
    )
}

export default memo(ShiummerLoadingProductCategory)
