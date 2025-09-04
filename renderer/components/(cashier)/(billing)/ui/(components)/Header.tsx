'use client'

import * as React from 'react'
import {
    Box, Avatar, Typography, Stack, IconButton, Tooltip, Menu, MenuItem, Divider,
    Chip, Badge
} from '@mui/material'
import ArrowBackRoundedIcon from '@mui/icons-material/ArrowBackRounded'
import SyncRoundedIcon from '@mui/icons-material/SyncRounded'
import CloudDoneRoundedIcon from '@mui/icons-material/CloudDoneRounded'
import CloudOffRoundedIcon from '@mui/icons-material/CloudOffRounded'
import PrintRoundedIcon from '@mui/icons-material/PrintRounded'
import StorefrontRoundedIcon from '@mui/icons-material/StorefrontRounded'
import LightModeRoundedIcon from '@mui/icons-material/LightModeRounded'
import DarkModeRoundedIcon from '@mui/icons-material/DarkModeRounded'
import {useEffect, useState} from "react";

type HeaderProps = {
    appName?: string
    cashierName?: string
    cashierPhotoUrl?: string

    branchName?: string
    registerName?: string
    shiftLabel?: string
    printerOnline?: boolean
    online?: boolean
    syncing?: boolean

    // Mode theme
    mode?: 'light' | 'dark'
    onChangeMode?: (m: 'light' | 'dark') => void

    onBack?: () => void
    onOpenProfile?: () => void
    onSwitchCashier?: () => void
    onOpenSettings?: () => void
    onLogout?: () => void
}


const noop = () => {}

export default function Header({
                                   appName = 'DKA Cashier POS',
                                   cashierName = 'Kasir',
                                   cashierPhotoUrl,
                                   branchName = 'Main Branch',
                                   registerName = 'REG-01',
                                   shiftLabel = 'Shift',
                                   printerOnline = true,
                                   syncing = false,
                                   mode = 'light',
                                   onChangeMode = noop,
                                   onBack = noop,
                                   onOpenProfile = noop,
                                   onSwitchCashier = noop,
                                   onOpenSettings = noop,
                                   onLogout = noop,
                               }: HeaderProps) {


    // state menu profil
    const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null)
    const open = Boolean(anchorEl)

    const [NetworkIndicator, setNetworkIndicator] = useState<React.JSX.Element>(<CloudOffRoundedIcon fontSize={'small'}/>)

    const ModeIcon = mode === 'dark' ? DarkModeRoundedIcon : LightModeRoundedIcon
    const [timeNow, setTimeNow] = useState<string>('-')

    useEffect(() => {
        window.ipc.send('ping', '');

    }, []);

    useEffect(() => {
        window.ipc.on('pong', (args) => {
            setNetworkIndicator(<CloudDoneRoundedIcon fontSize={'small'} />);
        })
    }, []);

    useEffect(() => {
        window.ipc.on('time_sync', (args : any) => {
            setTimeNow(args.humanize);
        })
    }, []);

    return (
        <Box
            component="header"
            sx={{
                height: 64,
                px: 1.5,
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
            {/* KIRI: Back + App / Branch / Register */}
            <Stack direction="row" alignItems="center" spacing={1.25} sx={{ minWidth: 0 }}>
                <Tooltip title="Kembali">
                    <IconButton size="small" onClick={onBack}>
                        <ArrowBackRoundedIcon fontSize="small" />
                    </IconButton>
                </Tooltip>

                <Stack sx={{ minWidth: 0 }}>
                    <Typography
                        variant="subtitle1"
                        sx={{ fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}
                        title={appName}
                    >
                        {appName}
                    </Typography>

                    <Stack direction="row" spacing={1} alignItems="center" sx={{ flexWrap: 'wrap' }}>
                        <Chip size="small" icon={<StorefrontRoundedIcon sx={{ fontSize: 16 }} />} label={branchName} variant="outlined" />
                        <Chip size="small" label={registerName} variant="outlined" />
                        <Chip size="small" label={shiftLabel} variant="outlined" />
                    </Stack>
                </Stack>
            </Stack>

            {/* TENGAH: JAM */}
            <Typography
                variant="h5"
                sx={{
                    justifySelf: 'center',
                    fontWeight: 500,
                    letterSpacing: 1,
                    fontVariantNumeric: 'tabular-nums',
                    userSelect: 'none',
                }}
            >
                {timeNow}
            </Typography>

            {/* KANAN: Status + Mode + Kasir */}
            <Stack direction="row" spacing={1} sx={{ justifySelf: 'end', alignItems: 'center', minWidth: 0 }}>
                {/* Status online/offline */}
                <Tooltip title={true ? 'Online' : 'Offline'}>
          <span>
            <IconButton size="small" disabled>
              { NetworkIndicator }
            </IconButton>
          </span>
                </Tooltip>

                {/* Status printer */}
                <Tooltip title={printerOnline ? 'Printer Online' : 'Printer Offline'}>
          <span>
            <IconButton size="small" disabled>
              <Badge
                  variant="dot"
                  color={printerOnline ? 'success' : 'error'}
                  overlap="circular"
                  anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
              >
                <PrintRoundedIcon fontSize="small" />
              </Badge>
            </IconButton>
          </span>
                </Tooltip>

                {/* Status sinkronisasi */}
                <Tooltip title={syncing ? 'Sedang Sinkronisasi' : 'Tersinkron'}>
                    <IconButton size="small" disabled>
                        <SyncRoundedIcon
                            fontSize="small"
                            sx={{
                                animation: syncing ? 'spin 1.2s linear infinite' : 'none',
                                '@keyframes spin': { from: { transform: 'rotate(0deg)' }, to: { transform: 'rotate(360deg)' } },
                            }}
                        />
                    </IconButton>
                </Tooltip>

                <Tooltip title={mode === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}>
                    <IconButton
                        size="small"
                        onClick={() => onChangeMode(mode === 'dark' ? 'light' : 'dark')}
                    >
                        {mode === 'dark' ? (
                            <DarkModeRoundedIcon fontSize="small" />
                        ) : (
                            <LightModeRoundedIcon fontSize="small" />
                        )}
                    </IconButton>
                </Tooltip>

                {/* Nama kasir + Avatar */}
                <Typography
                    variant="body2"
                    sx={{
                        fontWeight: 500,
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        maxWidth: 220,
                        display: { xs: 'none', sm: 'block' },
                    }}
                    title={cashierName}
                >
                    {cashierName}
                </Typography>

                <Avatar
                    src={cashierPhotoUrl}
                    alt={cashierName}
                    sx={{ width: 36, height: 36, border: '2px solid', borderColor: 'divider', cursor: 'pointer' }}
                    onClick={(e) => setAnchorEl(e.currentTarget)}
                />

                {/* Menu Profil */}
                <Menu
                    anchorEl={anchorEl}
                    open={open}
                    onClose={() => setAnchorEl(null)}
                    anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                    transformOrigin={{ vertical: 'top', horizontal: 'right' }}
                    keepMounted
                >
                    <MenuItem onClick={() => { setAnchorEl(null); onOpenProfile() }}>Profil Kasir</MenuItem>
                    <MenuItem onClick={() => { setAnchorEl(null); onSwitchCashier() }}>Ganti Kasir</MenuItem>
                    <Divider />
                    <MenuItem onClick={() => { setAnchorEl(null); onOpenSettings() }}>Pengaturan</MenuItem>
                    <MenuItem onClick={() => { setAnchorEl(null); onLogout() }}>Keluar</MenuItem>
                </Menu>
            </Stack>
        </Box>
    )
}
