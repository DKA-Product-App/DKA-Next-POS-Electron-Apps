'use client';

import React, { useEffect, useState } from 'react';
import {
    Box,
    IconButton,
    Popover,
    Tooltip,
    Typography,
    List,
    ListItem,
    ListItemIcon,
    ListItemText,
    Divider,
    Chip,
    Button,
} from '@mui/material';
import CodeIcon from '@mui/icons-material/Code';
import CloudCircleIcon from '@mui/icons-material/CloudCircle';
import DnsRoundedIcon from '@mui/icons-material/DnsRounded';
import StorageRoundedIcon from '@mui/icons-material/StorageRounded';
import SpeedRoundedIcon from '@mui/icons-material/SpeedRounded';
import DevicesRoundedIcon from '@mui/icons-material/DevicesRounded';
import LanRoundedIcon from '@mui/icons-material/LanRounded';
import RefreshRoundedIcon from '@mui/icons-material/RefreshRounded';
import PerfectScrollbar from 'react-perfect-scrollbar';
import 'react-perfect-scrollbar/dist/css/styles.css';

export default function StatusWidget() {
    const [anchor, setAnchor] = useState<HTMLElement | null>(null);
    const open = Boolean(anchor);

    // ===== state internal (tanpa props) =====
    const [dev, setDev] = useState<boolean>(true);
    const [serverOnline, setServerOnline] = useState<boolean>(true);
    const [dbOnline, setDbOnline] = useState<boolean>(true);
    const [rttMs, setRttMs] = useState<number>(23);
    const [platform] = useState<string>('linux · x64');
    const [ipAddress] = useState<string>('192.168.1.10');
    const [lastUpdated, setLastUpdated] = useState<string>(new Date().toLocaleTimeString());

    useEffect(() => {
        const v = (typeof window !== 'undefined' ? (window as any).electron?.versions : undefined);
        if (typeof v?.dev === 'boolean') setDev(v.dev);
    }, []);

    const envColor = dev ? 'error.main' : 'success.main';
    const serverColor = serverOnline ? 'success.main' : 'error.main';

    const handleOpen = (e: React.MouseEvent<HTMLElement>) => setAnchor(e.currentTarget);
    const handleClose = () => setAnchor(null);

    const handleRefresh = () => {
        const randBool = () => Math.random() > 0.15;
        const randRtt = () => Math.max(1, Math.round(10 + Math.random() * 60));
        setServerOnline(randBool());
        setDbOnline(randBool());
        setRttMs(randRtt());
        setLastUpdated(new Date().toLocaleTimeString());
    };

    return (
        <>
            <Tooltip title="Status (Environment & Server)">
                <IconButton
                    size="small"
                    aria-label="status"
                    onClick={handleOpen}
                    sx={{ borderRadius: 2, border: '1px solid', borderColor: 'divider' }}
                >
                    <CodeIcon fontSize="small" sx={{ mr: 0.5, color: envColor }} />
                    <CloudCircleIcon fontSize="small" sx={{ color: serverColor }} />
                </IconButton>
            </Tooltip>

            <Popover
                open={open}
                anchorEl={anchor}
                onClose={handleClose}
                disableRestoreFocus
                anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
                transformOrigin={{ vertical: 'bottom', horizontal: 'center' }}
                PaperProps={{
                    sx: (theme) => ({
                        width: 360,
                        borderRadius: 2,
                        overflow: 'hidden',
                        backdropFilter: 'blur(8px)',
                        background:
                            theme.palette.mode === 'dark'
                                ? 'rgba(30,35,54,0.9)'
                                : 'rgba(255,255,255,0.95)',
                        border:
                            theme.palette.mode === 'dark'
                                ? '1px solid rgba(255,255,255,0.08)'
                                : '1px solid rgba(0,0,0,0.06)',
                    }),
                }}
            >
                {/* Layout kolom: header (fixed) / body scroll / footer (fixed) */}
                <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                    {/* Header */}
                    <Box
                        sx={(t) => ({
                            px: 2,
                            py: 1,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            borderBottom: `1px solid ${t.palette.divider}`,
                        })}
                    >
                        <Typography variant="subtitle2" fontWeight={700}>
                            Status Koneksi
                        </Typography>
                        <Button
                            size="small"
                            startIcon={<RefreshRoundedIcon />}
                            onClick={handleRefresh}
                            variant="outlined"
                        >
                            REFRESH
                        </Button>
                    </Box>

                    {/* BODY SCROLL — tinggi FIX supaya PerfectScrollbar aktif */}
                    <Box sx={{ height: 300, overflow: 'hidden' }}>
                        <PerfectScrollbar
                            options={{ suppressScrollX: true, swipeEasing: true, wheelPropagation: false }}
                        >
                            <List disablePadding sx={{ py: 0.5 }}>
                                {/* Server */}
                                <ListItem
                                    secondaryAction={
                                        serverOnline ? (
                                            <Chip label="ONLINE" size="small" color="success" variant="outlined" />
                                        ) : (
                                            <Chip label="OFFLINE" size="small" color="error" variant="outlined" />
                                        )
                                    }
                                    sx={{ py: 1.25, '& .MuiListItemSecondaryAction-root': { right: 16 } }}
                                >
                                    <ListItemIcon sx={{ minWidth: 40, color: 'text.secondary' }}>
                                        <DnsRoundedIcon />
                                    </ListItemIcon>
                                    <ListItemText
                                        primary={<Typography variant="body1" fontWeight={600}>Server</Typography>}
                                        secondary={<Typography variant="body2" sx={{ opacity: 0.7 }}>Kondisi aplikasi / API gateway</Typography>}
                                    />
                                </ListItem>
                                <Divider />

                                {/* Database */}
                                <ListItem
                                    secondaryAction={
                                        dbOnline ? (
                                            <Chip label="ONLINE" size="small" color="success" variant="outlined" />
                                        ) : (
                                            <Chip label="OFFLINE" size="small" color="error" variant="outlined" />
                                        )
                                    }
                                    sx={{ py: 1.25, '& .MuiListItemSecondaryAction-root': { right: 16 } }}
                                >
                                    <ListItemIcon sx={{ minWidth: 40, color: 'text.secondary' }}>
                                        <StorageRoundedIcon />
                                    </ListItemIcon>
                                    <ListItemText
                                        primary={<Typography variant="body1" fontWeight={600}>Database</Typography>}
                                        secondary={<Typography variant="body2" sx={{ opacity: 0.7 }}>Koneksi ke DB utama</Typography>}
                                    />
                                </ListItem>
                                <Divider />

                                {/* Network Delay */}
                                <ListItem
                                    secondaryAction={
                                        <Typography variant="body2" fontWeight={700} sx={{ opacity: 0.9, pr: 1 }}>
                                            {rttMs} ms
                                        </Typography>
                                    }
                                    sx={{ py: 1.25, '& .MuiListItemSecondaryAction-root': { right: 8 } }}
                                >
                                    <ListItemIcon sx={{ minWidth: 40, color: 'text.secondary' }}>
                                        <SpeedRoundedIcon />
                                    </ListItemIcon>
                                    <ListItemText
                                        primary={<Typography variant="body1" fontWeight={600}>Network Delay</Typography>}
                                        secondary={<Typography variant="body2" sx={{ opacity: 0.7 }}>Estimasi ping ke server</Typography>}
                                    />
                                </ListItem>
                                <Divider />

                                {/* Platform */}
                                <ListItem
                                    secondaryAction={
                                        <Typography variant="body2" fontWeight={700} sx={{ opacity: 0.9, pr: 1 }}>
                                            {platform}
                                        </Typography>
                                    }
                                    sx={{ py: 1.25, '& .MuiListItemSecondaryAction-root': { right: 8 } }}
                                >
                                    <ListItemIcon sx={{ minWidth: 40, color: 'text.secondary' }}>
                                        <DevicesRoundedIcon />
                                    </ListItemIcon>
                                    <ListItemText
                                        primary={<Typography variant="body1" fontWeight={600}>Platform</Typography>}
                                        secondary={<Typography variant="body2" sx={{ opacity: 0.7 }}>Sistem operasi & arsitektur</Typography>}
                                    />
                                </ListItem>
                                <Divider />

                                {/* IP Address */}
                                <ListItem
                                    secondaryAction={
                                        <Typography variant="body2" fontWeight={700} sx={{ opacity: 0.9, pr: 1 }}>
                                            {ipAddress}
                                        </Typography>
                                    }
                                    sx={{ py: 1.25, '& .MuiListItemSecondaryAction-root': { right: 8 } }}
                                >
                                    <ListItemIcon sx={{ minWidth: 40, color: 'text.secondary' }}>
                                        <LanRoundedIcon />
                                    </ListItemIcon>
                                    <ListItemText
                                        primary={<Typography variant="body1" fontWeight={600}>IP Address</Typography>}
                                        secondary={<Typography variant="body2" sx={{ opacity: 0.7 }}>Semua antarmuka yang terdeteksi</Typography>}
                                    />
                                </ListItem>
                            </List>
                        </PerfectScrollbar>
                    </Box>

                    {/* FOOTER — DI LUAR AREA SCROLL */}
                    <Box
                        sx={(t) => ({
                            px: 2,
                            py: 1,
                            display: 'flex',
                            alignItems: 'center',
                            gap: 1,
                            borderTop: `1px solid ${t.palette.divider}`,
                        })}
                    >
                        <Typography variant="caption" sx={{ opacity: 0.7, flex: 1 }}>
                            Last updated: {lastUpdated}
                        </Typography>
                        <Chip
                            label={dev ? 'DEVELOPMENT' : 'PRODUCTION'}
                            size="small"
                            variant="outlined"
                            color={dev ? 'error' : 'success'}
                        />
                    </Box>
                </Box>
            </Popover>
        </>
    );
}
