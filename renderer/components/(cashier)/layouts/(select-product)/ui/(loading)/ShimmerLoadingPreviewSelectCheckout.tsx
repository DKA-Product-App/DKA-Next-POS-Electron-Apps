'use client'

import React from 'react'
import {
    Box,
    Paper,
    Stack,
    Divider,
    List,
    ListItem,
    ListItemText,
    Skeleton,
} from '@mui/material'

type Props = {
    rows?: number
}

export default function ShimmerLoadingPreviewSelectCheckout({ rows = 6 }: Props) {
    return (
        <Paper sx={{ height: '100%', display: 'flex', flexDirection: 'column' }} elevation={0}>
            {/* Header */}
            <Box sx={{ p: 2 }}>
                <Stack direction="row" alignItems="center" justifyContent="space-between">
                    <Skeleton variant="text" width={120} height={28} animation="wave" />
                    <Skeleton variant="rectangular" width={110} height={32} animation="wave" sx={{ borderRadius: 1 }} />
                </Stack>
            </Box>

            <Divider />

            {/* List items */}
            <Box sx={{ flex: 1, overflow: 'auto' }}>
                <List>
                    {Array.from({ length: rows }).map((_, i) => (
                        <ListItem
                            key={`skeleton-${i}`}
                            // tiru area action (minus, qty, plus, delete) pakai lingkaran kecil
                            secondaryAction={
                                <Stack direction="row" alignItems="center" spacing={0.5}>
                                    <Skeleton variant="circular" width={28} height={28} animation="wave" />
                                    <Skeleton variant="rectangular" width={28} height={20} animation="wave" sx={{ borderRadius: 1 }} />
                                    <Skeleton variant="circular" width={28} height={28} animation="wave" />
                                </Stack>
                            }
                            sx={{ py: 1.25 }}
                        >
                            <ListItemText
                                primary={
                                    <Stack direction="row" spacing={1} alignItems="center">
                                        <Skeleton variant="text" width="45%" height={22} animation="wave" />
                                        {/* chip variant */}

                                    </Stack>
                                }
                                secondary={
                                    <Skeleton variant="text" width={140} height={16} animation="wave" sx={{ mt: 0.5 }} />
                                }
                            />
                        </ListItem>
                    ))}
                </List>
            </Box>
        </Paper>
    )
}
