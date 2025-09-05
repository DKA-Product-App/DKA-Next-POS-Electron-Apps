'use client'

import * as React from 'react'
import { Box, Stack, Skeleton, Typography } from '@mui/material'

export default function ShimmerFooterLoading() {
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
            {/* kiri: shimmer shortcut */}
            <Stack
                direction="row"
                spacing={2}
                sx={{
                    flexWrap: 'wrap',
                    alignItems: 'center',
                }}
            >
                {[1, 2].map((i) => (
                    <Stack key={i} direction="row" spacing={1} alignItems="center">
                        {/* key chip */}
                        <Skeleton
                            variant="rounded"
                            width={44}
                            height={24}
                            animation="wave"
                            sx={{ borderRadius: '6px' }}
                        />
                        {/* label */}
                        <Skeleton
                            variant="text"
                            width={80}
                            height={18}
                            animation="wave"
                        />
                    </Stack>
                ))}
            </Stack>

            {/* kanan: copyright shimmer */}
            <Skeleton variant="text" width={160} height={16} animation="wave" />
        </Box>
    )
}
