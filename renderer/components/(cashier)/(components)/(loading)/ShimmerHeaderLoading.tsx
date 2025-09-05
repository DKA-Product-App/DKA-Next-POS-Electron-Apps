'use client'

import * as React from 'react'
import { Box, Stack, Skeleton } from '@mui/material'

export default function ShimmerHeaderLoading() {
    return (
        <Box
            component="header"
            sx={{
                height: 80,
                px: 3,
                display: 'grid',
                alignItems: 'center',
                gridTemplateColumns: '1fr auto 1fr',
                borderBottom: '1px solid',
                borderColor: 'divider',
                bgcolor: 'background.paper',
                position: 'relative',
                zIndex: 2,
                gap: 1,
            }}
        >
            {/* KIRI: Back + App / Branch / Register (shimmer) */}
            <Stack direction="row" alignItems="center" spacing={1.25} sx={{ minWidth: 0 }}>
                {/* Tombol back */}
                <Skeleton variant="circular" width={28} height={28} animation="wave" />

                {/* Shift + Branch/Register */}
                <Stack direction="row" spacing={2} sx={{ alignItems: 'center', minWidth: 0 }}>
                    {/* ShiftWidget pill */}
                    <Stack spacing={0.5}>
                        <Skeleton variant="rounded" width={110} height={22} animation="wave" sx={{ borderRadius: 999 }} />
                        <Skeleton variant="rounded" width={90} height={14} animation="wave" sx={{ borderRadius: 999 }} />
                    </Stack>

                    {/* BranchWidget dua baris */}
                    <Stack spacing={0.5} sx={{ minWidth: 0 }}>
                        <Skeleton variant="text" width={180} height={22} animation="wave" />
                        <Skeleton variant="text" width={220} height={18} animation="wave" />
                    </Stack>
                </Stack>
            </Stack>

            {/* TENGAH: Jam */}
            <Stack direction="row" spacing={3} sx={{ justifySelf: 'center', alignItems: 'center', minWidth: 0 }}>
                <Skeleton variant="text" width={160} height={36} animation="wave" />
            </Stack>

            {/* KANAN: Status + Mode + Kasir */}
            <Stack direction="row" spacing={1.25} sx={{ justifySelf: 'end', alignItems: 'center', minWidth: 0 }}>
                {/* Network popover trigger */}
                <Skeleton variant="circular" width={28} height={28} animation="wave" />
                {/* Printer trigger */}
                <Skeleton variant="circular" width={28} height={28} animation="wave" />
                {/* Sync icon */}
                <Skeleton variant="circular" width={28} height={28} animation="wave" />
                {/* Theme toggle */}
                <Skeleton variant="circular" width={28} height={28} animation="wave" />

                {/* Profile button (avatar + label) */}
                <Stack direction="row" spacing={1} alignItems="center">
                    <Skeleton variant="circular" width={30} height={30} animation="wave" />
                    <Stack spacing={0.5} sx={{ minWidth: 0 }}>
                        <Skeleton variant="text" width={120} height={18} animation="wave" />
                        <Skeleton variant="text" width={150} height={14} animation="wave" />
                    </Stack>
                </Stack>
            </Stack>
        </Box>
    )
}
