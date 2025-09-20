'use client'

import React from 'react'
import { Box, Paper, Skeleton } from '@mui/material'

type Props = {
    /** kalau mau dipakai di grid, biar stretch rapih */
    fullHeight?: boolean
}

const ProductCardSkeleton: React.FC<Props> = ({ fullHeight = true }) => {
    return (
        <Paper
            variant="outlined"
            sx={{
                borderRadius: 2,
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column',
                ...(fullHeight ? { height: '100%' } : {}),
            }}
        >
            {/* image area */}
            <Skeleton variant="rectangular" sx={{ width: '100%', aspectRatio: '4 / 3' }} />

            {/* content */}
            <Box sx={{ p: 1.25, display: 'grid', gap: 0.75, flexGrow: 1 }}>
                <Skeleton variant="text" sx={{ width: '85%', height: 20 }} />
                <Skeleton variant="text" sx={{ width: '60%', height: 16 }} />
                <Box sx={{ flexGrow: 1 }} />
                <Skeleton variant="rounded" sx={{ width: '100%', height: 40 }} />
                <Skeleton variant="rounded" sx={{ width: '100%', height: 34 }} />
            </Box>

            {/* accent strip */}
            <Skeleton variant="rectangular" sx={{ width: '100%', height: 3 }} />
        </Paper>
    )
}

export default ProductCardSkeleton
