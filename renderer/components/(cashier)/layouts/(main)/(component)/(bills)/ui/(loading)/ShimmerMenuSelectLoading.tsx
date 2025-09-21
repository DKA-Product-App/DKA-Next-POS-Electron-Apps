'use client'

import * as React from 'react'
import {
    Box,
    Paper,
    Stack,
    Typography,
    Divider,
    List,
    ListItemButton,
    ListItemIcon,
    Skeleton,
} from '@mui/material'

type MenuSelectSkeletonProps = {
    /** Berapa grup menu palsu yang mau ditampilkan */
    groups?: number
    /** Banyak item per grup */
    itemsPerGroup?: number
}

export default function ShimmerMenuSelectLoading({
                                                     groups = 1,
                                                     itemsPerGroup = 6,
                                                 }: MenuSelectSkeletonProps) {
    return (
        <Paper
            elevation={0}
            sx={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                background: (t) =>
                    t.palette.mode === 'dark'
                        ? t.palette.background.paper
                        : `linear-gradient(180deg, ${t.palette.background.paper} 0%, ${t.palette.background.default} 100%)`,
            }}
        >
            {/* HeaderBar (sticky) */}
            <Box
                sx={{
                    p: 1.5,
                    flexShrink: 0,
                    position: 'sticky',
                    top: 0,
                    zIndex: 2,
                    backdropFilter: 'saturate(140%) blur(6px)',
                    bgcolor: (t) =>
                        t.palette.mode === 'dark'
                            ? 'rgba(0,0,0,0.5)'
                            : 'rgba(255,255,255,0.7)',
                    borderBottom: '1px solid',
                    borderColor: 'divider',
                }}
            >
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <Skeleton variant="text" width={120} height={24} animation="wave" />
                </Stack>
            </Box>

            {/* List area */}
            <Box sx={{ flex: 1, minHeight: 0, overflow: 'auto' }}>
                <List disablePadding>
                    {Array.from({ length: groups }).map((_, gi) => (
                        <Box key={`g-${gi}`}>
                            {/* Divider Title */}
                            <Divider textAlign="left" sx={{ px: 1.5, py: 1 }}>
                                <Skeleton variant="text" width={100} height={16} animation="wave" />
                            </Divider>

                            {/* Items */}
                            {Array.from({ length: itemsPerGroup }).map((__, ii) => (
                                <ListItemButton
                                    key={`g-${gi}-i-${ii}`}
                                    sx={{
                                        px: 1.5,
                                        py: 2,
                                        '& .MuiListItemIcon-root': { minWidth: 40 },
                                    }}
                                >
                                    <ListItemIcon>
                                        <Skeleton variant="circular" width={24} height={24} animation="wave" />
                                    </ListItemIcon>
                                    <Stack spacing={0.5} sx={{ width: '100%' }}>
                                        <Skeleton variant="text" width="40%" height={20} animation="wave" />
                                        <Skeleton variant="text" width="25%" height={16} animation="wave" />
                                    </Stack>
                                </ListItemButton>
                            ))}
                        </Box>
                    ))}
                </List>
            </Box>
        </Paper>
    )
}
