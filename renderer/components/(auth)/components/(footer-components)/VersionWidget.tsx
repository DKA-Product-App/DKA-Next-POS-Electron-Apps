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
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import AppSettingsAltIcon from '@mui/icons-material/AppSettingsAlt';
import MemoryIcon from '@mui/icons-material/Memory';
import LanguageIcon from '@mui/icons-material/Language';
import TerminalIcon from '@mui/icons-material/Terminal';
import RefreshRoundedIcon from '@mui/icons-material/RefreshRounded';
import PerfectScrollbar from 'react-perfect-scrollbar';
import 'react-perfect-scrollbar/dist/css/styles.css';

type Versions = {
    app: string;
    dev: boolean;
    electron: string;
    chrome: string;
    node: string;
};

export default function VersionWidget() {
    const [anchor, setAnchor] = useState<HTMLElement | null>(null);
    const open = Boolean(anchor);

    // ===== state internal (tanpa props) =====
    const [v, setV] = useState<Versions>({
        app: '-',
        dev: true,
        electron: '-',
        chrome: '-',
        node: '-',
    });
    const [lastUpdated, setLastUpdated] = useState<string>(new Date().toLocaleTimeString());

    // hydrate dari preload electron (opsional)
    const hydrate = () => {
        const ve = (typeof window !== 'undefined' ? (window as any).electron?.versions : undefined);
        setV({
            app: ve?.app ?? '-',
            dev: ve?.dev ?? true,
            electron: ve?.electron ?? '-',
            chrome: ve?.chrome ?? '-',
            node: ve?.node ?? '-',
        });
        setLastUpdated(new Date().toLocaleTimeString());
    };

    useEffect(() => {
        hydrate();
    }, []);

    const envColor = v.dev ? 'error.main' : 'success.main';

    const handleOpen = (e: React.MouseEvent<HTMLElement>) => setAnchor(e.currentTarget);
    const handleClose = () => setAnchor(null);
    const handleRefresh = () => hydrate();

    return (
        <>
            <Tooltip title="Info Versi (App/Electron/Chrome/Node)">
                <IconButton
                    size="small"
                    aria-label="info"
                    onClick={handleOpen}
                    sx={{ borderRadius: 2, border: '1px solid', borderColor: 'divider' }}
                >
                    <InfoOutlinedIcon fontSize="small" />
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
                        Info Versi
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

                {/* Body scroll (tinggi fix biar pasti scroll) */}
                <Box sx={{ height: 300, overflow: 'hidden' }}>
                    <PerfectScrollbar
                        options={{ suppressScrollX: true, swipeEasing: true, wheelPropagation: false }}
                    >
                        <List disablePadding sx={{ py: 0.5 }}>
                            {/* App */}
                            <ListItem
                                secondaryAction={
                                    <Typography variant="body2" fontWeight={700} sx={{ pr: 1 }}>
                                        v{v.app}
                                    </Typography>
                                }
                                sx={{ py: 1.25, '& .MuiListItemSecondaryAction-root': { right: 8 } }}
                            >
                                <ListItemIcon sx={{ minWidth: 40, color: 'text.secondary' }}>
                                    <AppSettingsAltIcon />
                                </ListItemIcon>
                                <ListItemText
                                    primary={<Typography variant="body1" fontWeight={600}>App</Typography>}
                                    secondary={<Typography variant="body2" sx={{ opacity: 0.7 }}>Nomor versi aplikasi</Typography>}
                                />
                            </ListItem>
                            <Divider />

                            {/* Electron */}
                            <ListItem
                                secondaryAction={
                                    <Typography variant="body2" fontWeight={700} sx={{ pr: 1 }}>
                                        {v.electron}
                                    </Typography>
                                }
                                sx={{ py: 1.25, '& .MuiListItemSecondaryAction-root': { right: 8 } }}
                            >
                                <ListItemIcon sx={{ minWidth: 40, color: 'text.secondary' }}>
                                    <MemoryIcon />
                                </ListItemIcon>
                                <ListItemText
                                    primary={<Typography variant="body1" fontWeight={600}>Electron</Typography>}
                                    secondary={<Typography variant="body2" sx={{ opacity: 0.7 }}>Runtime Electron</Typography>}
                                />
                            </ListItem>
                            <Divider />

                            {/* Chrome */}
                            <ListItem
                                secondaryAction={
                                    <Typography variant="body2" fontWeight={700} sx={{ pr: 1 }}>
                                        {v.chrome}
                                    </Typography>
                                }
                                sx={{ py: 1.25, '& .MuiListItemSecondaryAction-root': { right: 8 } }}
                            >
                                <ListItemIcon sx={{ minWidth: 40, color: 'text.secondary' }}>
                                    <LanguageIcon />
                                </ListItemIcon>
                                <ListItemText
                                    primary={<Typography variant="body1" fontWeight={600}>Chrome</Typography>}
                                    secondary={<Typography variant="body2" sx={{ opacity: 0.7 }}>Versi Chromium</Typography>}
                                />
                            </ListItem>
                            <Divider />

                            {/* Node */}
                            <ListItem
                                secondaryAction={
                                    <Typography variant="body2" fontWeight={700} sx={{ pr: 1 }}>
                                        {v.node}
                                    </Typography>
                                }
                                sx={{ py: 1.25, '& .MuiListItemSecondaryAction-root': { right: 8 } }}
                            >
                                <ListItemIcon sx={{ minWidth: 40, color: 'text.secondary' }}>
                                    <TerminalIcon />
                                </ListItemIcon>
                                <ListItemText
                                    primary={<Typography variant="body1" fontWeight={600}>Node</Typography>}
                                    secondary={<Typography variant="body2" sx={{ opacity: 0.7 }}>Versi Node.js</Typography>}
                                />
                            </ListItem>
                        </List>
                    </PerfectScrollbar>
                </Box>

                {/* Footer (di luar scroll) */}
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
                        label={v.dev ? 'DEVELOPMENT' : 'PRODUCTION'}
                        size="small"
                        variant="outlined"
                        color={v.dev ? 'error' : 'success'}
                        sx={{ borderRadius: 1.5 }}
                    />
                </Box>
            </Popover>
        </>
    );
}
