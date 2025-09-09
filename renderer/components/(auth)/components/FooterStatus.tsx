'use client';

import React from 'react';
import { Box, Paper, Stack } from '@mui/material';
import PerfectScrollbar from 'react-perfect-scrollbar';
import 'react-perfect-scrollbar/dist/css/styles.css';

import StatusWidget from './(footer-components)/StatusWidget';
import VersionWidget from './(footer-components)/VersionWidget';

export default function FooterStatus() {
    return (
        <Box
            component="footer"
            sx={{
                position: 'fixed',
                left: 0,
                right: 0,
                bottom: 24,
                display: 'flex',
                justifyContent: 'center',
                pointerEvents: 'none',
                zIndex: 1200,
            }}
        >
            <Paper
                elevation={8}
                sx={(theme) => ({
                    pointerEvents: 'auto',
                    px: 0,
                    py: 0,
                    borderRadius: 3,
                    minWidth: 'auto',
                    maxWidth: '95%',
                    position: 'relative',
                    backdropFilter: 'blur(10px)',
                    background: theme.palette.mode === 'dark' ? 'rgba(20, 24, 40, 0.8)' : 'rgba(255, 255, 255, 0.85)',
                    border: theme.palette.mode === 'dark' ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(0,0,0,0.08)',
                    overflow: 'hidden',
                })}
            >
                {/* hint gradient kiri/kanan optional – hapus kalau gak suka */}
                <Box sx={{ position: 'absolute', top: 0, left: 0, width: 24, height: '100%', zIndex: 2, background: (t) => (t.palette.mode === 'dark' ? 'linear-gradient(to right, rgba(20,24,40,0.8), transparent)' : 'linear-gradient(to right, rgba(255,255,255,0.85), transparent)'), pointerEvents: 'none' }} />
                <Box sx={{ position: 'absolute', top: 0, right: 0, width: 24, height: '100%', zIndex: 2, background: (t) => (t.palette.mode === 'dark' ? 'linear-gradient(to left, rgba(20,24,40,0.8), transparent)' : 'linear-gradient(to left, rgba(255,255,255,0.85), transparent)'), pointerEvents: 'none' }} />

                <PerfectScrollbar options={{ suppressScrollY: true, suppressScrollX: false, swipeEasing: true, wheelPropagation: false }}>
                    <Stack direction="row" spacing={1} alignItems="center" sx={{ px: 1.5, py: 0.75, minWidth: 'max-content' }}>
                        <StatusWidget />
                        <VersionWidget />
                    </Stack>
                </PerfectScrollbar>
            </Paper>
        </Box>
    );
}
