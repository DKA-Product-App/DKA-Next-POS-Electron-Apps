'use client'

import * as React from 'react'
import { useRouter, usePathname } from 'next/navigation'
import {
    Box, Avatar, Typography, Stack, IconButton, Tooltip, Menu, MenuItem, Divider,
    Chip, Badge,
    LinearProgress
} from '@mui/material'
import SyncRoundedIcon from '@mui/icons-material/SyncRounded'
import LightModeRoundedIcon from '@mui/icons-material/LightModeRounded'
import DarkModeRoundedIcon from '@mui/icons-material/DarkModeRounded'
import {useEffect, useState} from "react";
import dynamic from "next/dynamic";
import { useFunctionKeyCtx } from '../../../contexts/FunctionKeyProviderContext'
import {useGodModeProvider} from "../context/GodModeProviderContext";
import IncomeWidget from "./(ui)/IncomeWidget";
import OverviewWidget from "./(ui)/OverviewWidget";

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

    onOpenProfile?: () => void
    onSwitchCashier?: () => void
    onOpenSettings?: () => void
    onLogout?: () => void
}

const noop = () => {}

const PrinterWidget = dynamic(() => import('./(ui)/PrinterWidget'), {
    ssr : false,
})

const NetworkWidget = dynamic(() => import('./(ui)/NetworkWidget'), {
    ssr : false,
})

const ProfileWidget = dynamic(() => import('./(ui)/ProfileWidget'), {
    ssr : false,
})

const TimeWidget = dynamic(() => import('./(ui)/TimeWidget'), {
    ssr : false,
})

const BackWidget = dynamic(() => import('./(ui)/BackWidget'), {
    ssr : false,
})



export default function Header({branchName = 'Main Branch', registerName = 'REG-01', printerOnline = true, syncing = false, mode = 'light', onChangeMode = noop, onSwitchCashier = noop, onOpenSettings = noop,}: HeaderProps) {
    const router = useRouter()
    const pathname = usePathname()
    const { key, seq } = useFunctionKeyCtx()
    const { godMode, setGodMode } = useGodModeProvider();

    useEffect(() => {
        switch (key) {
            case "F11" :
                setGodMode((state) => (!state));
                break;
            case "F7" :
                window?.ipc?.send?.(`key.window.fullscreen`, true);
                break;
            case "F8" :
                window?.ipc?.send?.(`key.window.dev.mode`, true);
                break;
        }
    }, [seq]);


    return (
        <>
            <LinearProgress
                variant="indeterminate"
                sx={{
                    height: 4,
                    borderRadius: 999,
                    bgcolor: 'transparent', // track bening
                    '& .MuiLinearProgress-bar': {
                        background: godMode
                            ? 'linear-gradient(90deg, #8B5CF6, #3B82F6)' // GOD MODE
                            : 'linear-gradient(90deg, #EF4444, #F59E0B 40%, #F97316)',            // normal
                    },
                    // optional: speed up animasi dikit
                    '& .MuiLinearProgress-bar1Indeterminate': { animationDuration: '4.4s' },
                    '& .MuiLinearProgress-bar2Indeterminate': { animationDuration: '4.4s' },
                }}
                aria-label="loading"
            />
            <Box
                component="header"
                sx={{
                    height: 65,
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
                {/* KIRI: Back + App / Branch / Register */}
                <Stack direction="row" alignItems="center" spacing={1.25} sx={{ minWidth: 0 }}>
                    <BackWidget />

                    <Stack direction="row" spacing={2} sx={{ justifySelf: 'start', alignItems: 'center', minWidth: 0 }}>
                        {/*<ShiftWidget
                        label={shiftLabel}
                        description={'08:00–16:00'}
                    />
                    <BranchWidget
                        branchName={"Cabang"}
                        registerName={"Center Point Indonesia"}
                    />*/}
                        <TimeWidget timeVariant="h5" justifySelf="center" />
                    </Stack>
                </Stack>

                {/* TENGAH: JAM */}
                <Stack direction="row" spacing={3} sx={{ justifySelf: 'center', alignItems: 'center', minWidth: 0 }}>
                    {/* Center: Time */}

                    <IncomeWidget timeVariant="h5" justifySelf="center" />
                </Stack>

                {/* KANAN: Status + Mode + Kasir */}
                <Stack direction="row" spacing={1} sx={{ justifySelf: 'end', alignItems: 'center', minWidth: 0 }}>

                    <OverviewWidget/>

                    {/* Status/Koneksi popover */}
                    <NetworkWidget
                        online={true /* atau state kamu */}
                        width={420}
                        maxHeight={360}
                        onAfterRefresh={(p) => {
                            // contoh: kalau server offline, kasih snackbar atau badge merah di tempat lain
                            // console.log('Network status', p)
                        }}
                    />

                    {/* Ganti ikon printer lama dengan ini */}
                    <PrinterWidget
                        printerOnline={printerOnline}
                        onDefaultChanged={(name) => {
                            // optional: snackbar atau update state lain
                            // console.log('Default printer changed to', name)
                        }}
                        onTestPrint={(name) => {
                            // optional: logging/snackbar
                            // console.log('Test print sent to', name)
                        }}
                    />
                    <Tooltip title={syncing ? 'Sedang Sinkronisasi' : 'Tersinkron'}>
                        <IconButton size="small" disabled>
                            <SyncRoundedIcon
                                fontSize="small"
                                sx={{
                                    animation: syncing ? 'spin 1.2s linear infinite' : 'none',
                                    '@keyframes spin': {
                                        from: { transform: 'rotate(0deg)' },
                                        to: { transform: 'rotate(360deg)' }
                                    },
                                }}
                            />
                        </IconButton>
                    </Tooltip>

                    <Tooltip title={mode === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}>
                        <IconButton
                            size="small"
                            onClick={() => onChangeMode(mode === 'dark' ? 'light' : 'dark')}
                        >
                            {mode === 'dark'
                                ? <DarkModeRoundedIcon fontSize="small" />
                                : <LightModeRoundedIcon fontSize="small" />}
                        </IconButton>
                    </Tooltip>

                    <ProfileWidget
                        subInfo={`${branchName} · ${registerName}`} // opsional
                        onOpenSettings={onOpenSettings}
                        onSwitchCashier={onSwitchCashier}
                    />
                </Stack>
            </Box>
        </>
    )
}
