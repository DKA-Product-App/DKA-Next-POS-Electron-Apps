'use client'

import * as React from 'react'
import { useRouter, usePathname } from 'next/navigation'
import {
    Box, Avatar, Typography, Stack, IconButton, Tooltip, Menu, MenuItem, Divider,
    Chip, Badge
} from '@mui/material'
import ArrowBackRoundedIcon from '@mui/icons-material/ArrowBackRounded'
import SyncRoundedIcon from '@mui/icons-material/SyncRounded'
import LightModeRoundedIcon from '@mui/icons-material/LightModeRounded'
import DarkModeRoundedIcon from '@mui/icons-material/DarkModeRounded'
import {useEffect, useState} from "react";
import dynamic from "next/dynamic";

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

const BranchWidget = dynamic(() => import('./(ui)/BranchWidget'), {
    ssr : false,
})

const ShiftWidget = dynamic(() => import('./(ui)/ShiftWidget'), {
    ssr : false,
})

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
                                   onOpenProfile = noop,
                                   onSwitchCashier = noop,
                                   onOpenSettings = noop,
                                   onLogout = noop,
                               }: HeaderProps) {
    const router = useRouter()
    const pathname = usePathname()

    // state menu profil
    const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null)
    const open = Boolean(anchorEl)

    const [timeNow, setTimeNow] = useState<string>('-')

    useEffect(() => {
        if (window !== undefined && window.ipc !== undefined){
            window.ipc?.send('ping', '')
        }
    }, [])

    useEffect(() => {
        if (window !== undefined && window.ipc !== undefined){
            window.ipc?.on('time_sync', (args: any) => {
                setTimeNow(args.humanize)
            })
        }
    }, [])

    const handleBack = () => {
        const segments = pathname.split('/').filter(Boolean)
        if (segments.length > 1) {
            const newPath = '/' + segments.slice(0, -1).join('/')
            router.push(newPath)
        } else {
            router.back()
        }
    }

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
            {/* KIRI: Back + App / Branch / Register */}
            <Stack direction="row" alignItems="center" spacing={1.25} sx={{ minWidth: 0 }}>
                <Tooltip title="Kembali">
                    <IconButton size="small" onClick={handleBack}>
                        <ArrowBackRoundedIcon fontSize="small" />
                    </IconButton>
                </Tooltip>

                <Stack direction="row" spacing={2} sx={{ justifySelf: 'start', alignItems: 'center', minWidth: 0 }}>
                    <ShiftWidget
                        label={shiftLabel}
                        description={'08:00–16:00'}
                    />
                    <BranchWidget
                        branchName={"Cabang"}
                        registerName={"Center Point Indonesia"}
                    />
                </Stack>
            </Stack>

            {/* TENGAH: JAM */}
            <Stack direction="row" spacing={3} sx={{ justifySelf: 'center', alignItems: 'center', minWidth: 0 }}>
                {/* Center: Time */}
                <TimeWidget timeVariant="h5" justifySelf="center" />
            </Stack>

            {/* KANAN: Status + Mode + Kasir */}
            <Stack direction="row" spacing={1} sx={{ justifySelf: 'end', alignItems: 'center', minWidth: 0 }}>

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
                    cashierName={cashierName}
                    cashierPhotoUrl={cashierPhotoUrl}
                    subInfo={`${branchName} · ${registerName}`} // opsional
                    onOpenSettings={onOpenSettings}
                    onSwitchCashier={onSwitchCashier}
                    onLogout={onLogout}
                />
            </Stack>
        </Box>
    )
}
