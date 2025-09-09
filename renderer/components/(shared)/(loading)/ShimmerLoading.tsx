'use client';

import * as React from 'react';
import { Box, Stack, Typography, Skeleton, Fade } from '@mui/material';

export type ShimmerCircularCenterProps = {
    /** Teks di bawah shimmer */
    text?: string;
    /** Diameter skeleton (px) */
    size?: number;
    /** Jika true → overlay fullscreen, kalau false → inline container center */
    fullscreen?: boolean;
    /** Opacity backdrop saat fullscreen */
    backdropOpacity?: number; // 0..1
};

/**
 * ShimmerCircularCenter
 * - Skeleton variant circular + animation wave
 * - Auto center (fullscreen atau inline)
 * - A11y: role="status" & aria-busy
 */
export default function ShimmerLoading({
                                                  text = 'Loading…',
                                                  size = 96,
                                                  fullscreen = true,
                                                  backdropOpacity = 0.35,
                                              }: ShimmerCircularCenterProps) {
    const content = (
        <Fade in timeout={250}>
            <Stack
                role="status"
                aria-busy={true}
                spacing={1.5}
                alignItems="center"
                justifyContent="center"
                sx={{
                    p: 2,
                    userSelect: 'none',
                }}
            >
                <Skeleton
                    variant="circular"
                    animation="wave"
                    width={size}
                    height={size}
                    sx={{ borderRadius: '50%' }}
                />
                <Typography
                    component="div"
                    variant="body2"
                    sx={{ letterSpacing: 0.5, opacity: 0.8 }}
                >
                    {text}
                </Typography>
            </Stack>
        </Fade>
    );

    if (fullscreen) {
        return (
            <Box
                sx={{
                    position: 'fixed',
                    inset: 0,
                    display: 'grid',
                    placeItems: 'center',
                    zIndex: (t) => t.zIndex.modal + 1,
                    bgcolor: (t) =>
                        t.palette.mode === 'dark'
                            ? `rgba(0,0,0,${backdropOpacity})`
                            : `rgba(255,255,255,${Math.min(backdropOpacity + 0.15, 1)})`,
                }}
            >
                {content}
            </Box>
        );
    }

    return (
        <Box sx={{ minHeight: 160, display: 'grid', placeItems: 'center', width: '100%' }}>
            {content}
        </Box>
    );
}
