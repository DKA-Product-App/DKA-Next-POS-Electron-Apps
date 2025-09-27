'use client'

import * as React from 'react'
import { Box, Paper, Stack } from '@mui/material'
import Skeleton from '@mui/material/Skeleton'

const GRADIENT_BAR_H = 3

const Skel: React.FC<{ w: number | string; h: number | string; r?: number | string }> = ({ w, h, r = 8 }) => (
    <Skeleton variant="rectangular" sx={{ width: w, height: h, borderRadius: r }} />
)

const RightContainerBatchDetailRowSkeleton: React.FC = () => {
    return (
        <Paper
            variant="outlined"
            sx={{
                borderRadius: 2,
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column',
                position: 'relative',
                border: '2px solid',
                borderColor: 'divider',
                boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
            }}
        >
            {/* Image area */}
            <Box sx={{ position: 'relative', width: '100%', aspectRatio: '4 / 3', bgcolor: 'action.hover', overflow: 'hidden' }}>
                <Skel w="100%" h="100%" r={0} />
                {/* chip placeholders */}
                <Box sx={{ position: 'absolute', top: 8, right: 8 }}>
                    <Skel w={90} h={24} r={999} />
                </Box>
                <Box sx={{ position: 'absolute', top: 8, left: 8 }}>
                    <Skel w={110} h={24} r={999} />
                </Box>
                {/* price chip */}
                <Box sx={{ position: 'absolute', bottom: 8, left: 8 }}>
                    <Skel w={120} h={24} r={999} />
                </Box>
                {/* check circle */}
                <Box sx={{ position: 'absolute', bottom: 8, right: 8 }}>
                    <Skel w={24} h={24} r={999} />
                </Box>
            </Box>

            {/* Body */}
            <Box sx={{ p: 1.25, display: 'grid', gap: .5 }}>
                <Skel w="80%" h={24} />
                <Stack direction="row" spacing={0.75} useFlexGap flexWrap="wrap" mt={0.5}>
                    <Skel w={70} h={22} r={999} />
                    <Skel w={90} h={22} r={999} />
                </Stack>

                {/* Note */}
                <Skel w="100%" h={16} r={4} />

                {/* Qty x Price — Total */}
                <Stack direction="row" alignItems="center" justifyContent="space-between" mt={1}>
                    <Skel w={120} h={18} r={4} />
                    <Skel w={100} h={20} r={4} />
                </Stack>
            </Box>

            <Box sx={{ height: GRADIENT_BAR_H, bgcolor: 'action.selected' }} />
        </Paper>
    )
}

export default RightContainerBatchDetailRowSkeleton
