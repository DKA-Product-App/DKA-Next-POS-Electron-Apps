'use client'

import * as React from 'react'
import {
    IconButton, Tooltip, Badge, Popover, Box, Stack, Button, Chip,
    List, ListItem, ListItemText, ListItemIcon, Typography, Divider
} from '@mui/material'
import CloudDoneRoundedIcon from '@mui/icons-material/CloudDoneRounded'
import CloudOffRoundedIcon from '@mui/icons-material/CloudOffRounded'
import RefreshRoundedIcon from '@mui/icons-material/RefreshRounded'
import StorageRoundedIcon from '@mui/icons-material/StorageRounded'
import DnsRoundedIcon from '@mui/icons-material/DnsRounded'
import WifiRoundedIcon from '@mui/icons-material/WifiRounded'
import SpeedRoundedIcon from '@mui/icons-material/SpeedRounded'
import InfoRoundedIcon from '@mui/icons-material/InfoRounded'
import LanRoundedIcon from '@mui/icons-material/LanRounded'
import DevicesRoundedIcon from '@mui/icons-material/DevicesRounded'
import PerfectScrollbar from 'react-perfect-scrollbar'
import 'react-perfect-scrollbar/dist/css/styles.css'


type HealthBool = 'online' | 'offline' | 'unknown'
type NetworkWidgetProps = {
    /** Badge status di ikon (sekadar lampu indikator) */
    online?: boolean
    /** Lebar popover (px) */
    width?: number
    /** Tinggi maksimum scroll area (px) */
    maxHeight?: number
    /** Ukuran ikon MUI */
    iconFontSize?: 'small' | 'medium' | 'large'
    /** Dipanggil setelah refresh sukses */
    onAfterRefresh?: (payload: NetworkPayload) => void
}

/** Bentuk payload yang ideal dari IPC */
export type NetworkPayload = {
    db: HealthBool
    server: HealthBool
    latencyMs: number | null
    platform: string            // e.g. 'win32', 'linux', 'darwin'
    arch?: string               // e.g. 'x64', 'arm64'
    ipAddresses: Array<{ iface: string; address: string }>
    macAddresses: Array<{ iface: string; mac: string }>
}

const chipColor = (s: HealthBool) =>
    s === 'online' ? 'success' : s === 'offline' ? 'default' : 'warning'

export default function NetworkWidget({
                                          online = false,
                                          width = 420,
                                          maxHeight = 360,
                                          iconFontSize = 'small',
                                          onAfterRefresh,
                                      }: NetworkWidgetProps) {
    const [anchorEl, setAnchorEl] = React.useState<HTMLElement | null>(null)
    const open = Boolean(anchorEl)

    const [lastUpdated, setLastUpdated] = React.useState<string>('-')
    const [data, setData] = React.useState<NetworkPayload>({
        db: 'unknown',
        server: 'unknown',
        latencyMs: null,
        platform: typeof navigator !== 'undefined' ? navigator.platform ?? 'unknown' : 'unknown',
        arch: undefined,
        ipAddresses: [],
        macAddresses: [],
    })

    const refresh = React.useCallback(() => {
       /* if (typeof window !== 'undefined' && window.ipc) {
            window.ipc.send('network:status')             // minta data fresh
            return
        }*/
        // ===== fallback dummy kalau IPC belum di-wire =====
        setData({
            db: 'online',
            server: 'online',
            latencyMs: 23,
            platform: 'linux',
            arch: 'x64',
            ipAddresses: [
                { iface: 'eth0', address: '192.168.1.50' },
                { iface: 'wlan0', address: '192.168.1.88' },
            ],
            macAddresses: [
                { iface: 'eth0', mac: 'AA:BB:CC:DD:EE:01' },
                { iface: 'wlan0', mac: 'AA:BB:CC:DD:EE:02' },
            ],
        })
        setLastUpdated(new Date().toLocaleTimeString())
        onAfterRefresh?.(data)
    }, [onAfterRefresh, data])

    React.useEffect(() => {
        if (typeof window === 'undefined' || !window.ipc) return
        const onStatus = (payload: NetworkPayload) => {
            setData(payload)
            setLastUpdated(new Date().toLocaleTimeString())
            onAfterRefresh?.(payload)
        }
        window.ipc.on('network:status:result', onStatus)
        return () => {
            /*window.ipc?.off?.('network:status:result', onStatus)*/
        }
    }, [onAfterRefresh])

    const openPopover = (e: React.MouseEvent<HTMLElement>) => {
        setAnchorEl(e.currentTarget)
        refresh()
    }
    const closePopover = () => setAnchorEl(null)

    return (
        <>
            {/* Anchor: ikon cloud */}
            <Tooltip title={online ? 'Online' : 'Offline'}>
                <IconButton
                    size="small"
                    onClick={openPopover}
                    aria-haspopup="dialog"
                    aria-expanded={open ? 'true' : undefined}
                    aria-controls="network-popover"
                >
                    <Badge
                        variant="dot"
                        color={online ? 'success' : 'error'}
                        overlap="circular"
                        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                    >
                        {online ? <CloudDoneRoundedIcon fontSize={iconFontSize}/> : <CloudOffRoundedIcon fontSize={iconFontSize}/>}
                    </Badge>
                </IconButton>
            </Tooltip>

            {/* Popover anchored */}
            <Popover
                id="network-popover"
                open={open}
                anchorEl={anchorEl}
                onClose={closePopover}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                transformOrigin={{ vertical: 'top', horizontal: 'right' }}
                keepMounted
                PaperProps={{
                    sx: { width, borderRadius: 3, overflow: 'hidden' },
                    elevation: 8,
                }}
            >
                {/* Header tools */}
                <Box sx={{ p: 1.25, borderBottom: '1px solid', borderColor: 'divider' }}>
                    <Stack direction="row" spacing={1} alignItems="center" justifyContent="space-between">
                        <Typography variant="subtitle2" fontWeight={700}>Status Koneksi</Typography>
                        <Button size="small" variant="outlined" startIcon={<RefreshRoundedIcon/>} onClick={refresh}>
                            Refresh
                        </Button>
                    </Stack>
                </Box>

                {/* Scroll area */}
                <PerfectScrollbar style={{ maxHeight }}>
                    <List disablePadding>
                        {/* Server status */}
                        <ListItem sx={{ px: 1.5, py: 1 }}>
                            <ListItemIcon sx={{ minWidth: 36 }}><DnsRoundedIcon/></ListItemIcon>
                            <ListItemText primary="Server" secondary="Kondisi aplikasi / API gateway"/>
                            <Chip size="small" label={data.server.toUpperCase()} color={chipColor(data.server)} variant="outlined"/>
                        </ListItem>
                        <Divider component="li"/>

                        {/* Database status */}
                        <ListItem sx={{ px: 1.5, py: 1 }}>
                            <ListItemIcon sx={{ minWidth: 36 }}><StorageRoundedIcon/></ListItemIcon>
                            <ListItemText primary="Database" secondary="Koneksi ke DB utama"/>
                            <Chip size="small" label={data.db.toUpperCase()} color={chipColor(data.db)} variant="outlined"/>
                        </ListItem>
                        <Divider component="li"/>

                        {/* Latency */}
                        <ListItem sx={{ px: 1.5, py: 1 }}>
                            <ListItemIcon sx={{ minWidth: 36 }}><SpeedRoundedIcon/></ListItemIcon>
                            <ListItemText primary="Network Delay" secondary="Estimasi ping ke server"/>
                            <Typography variant="body2" sx={{ fontVariantNumeric: 'tabular-nums' }}>
                                {data.latencyMs == null ? '—' : `${data.latencyMs} ms`}
                            </Typography>
                        </ListItem>
                        <Divider component="li"/>

                        {/* Platform */}
                        <ListItem sx={{ px: 1.5, py: 1 }}>
                            <ListItemIcon sx={{ minWidth: 36 }}><DevicesRoundedIcon/></ListItemIcon>
                            <ListItemText
                                primary="Platform"
                                secondary="Sistem operasi & arsitektur"
                            />
                            <Typography variant="body2">
                                {`${data.platform}${data.arch ? ' · ' + data.arch : ''}`}
                            </Typography>
                        </ListItem>
                        <Divider component="li"/>

                        {/* IP Addresses */}
                        <ListItem sx={{ px: 1.5, py: 1 }}>
                            <ListItemIcon sx={{ minWidth: 36 }}><LanRoundedIcon/></ListItemIcon>
                            <ListItemText primary="IP Address" secondary="Semua antarmuka yang terdeteksi"/>
                        </ListItem>
                        {data.ipAddresses.length === 0 ? (
                            <Box sx={{ px: 7, pb: 1 }}>
                                <Typography variant="body2" color="text.secondary">Tidak ada data IP.</Typography>
                            </Box>
                        ) : (
                            data.ipAddresses.map((it, idx) => (
                                <Box key={`${it.iface}-${idx}`} sx={{ px: 7, pb: 0.75, display: 'flex', justifyContent: 'space-between', gap: 1 }}>
                                    <Typography variant="body2" color="text.secondary">{it.iface}</Typography>
                                    <Typography variant="body2" sx={{ fontVariantNumeric: 'tabular-nums' }}>{it.address}</Typography>
                                </Box>
                            ))
                        )}
                        <Divider component="li" sx={{ mt: 1 }}/>

                        {/* MAC Addresses */}
                        <ListItem sx={{ px: 1.5, py: 1 }}>
                            <ListItemIcon sx={{ minWidth: 36 }}><WifiRoundedIcon/></ListItemIcon>
                            <ListItemText primary="MAC Address" secondary="Alamat fisik per antarmuka"/>
                        </ListItem>
                        {data.macAddresses.length === 0 ? (
                            <Box sx={{ px: 7, pb: 1 }}>
                                <Typography variant="body2" color="text.secondary">Tidak ada data MAC.</Typography>
                            </Box>
                        ) : (
                            data.macAddresses.map((it, idx) => (
                                <Box key={`${it.iface}-${idx}`} sx={{ px: 7, pb: 0.75, display: 'flex', justifyContent: 'space-between', gap: 1 }}>
                                    <Typography variant="body2" color="text.secondary">{it.iface}</Typography>
                                    <Typography variant="body2" sx={{ fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace' }}>
                                        {it.mac}
                                    </Typography>
                                </Box>
                            ))
                        )}
                    </List>
                </PerfectScrollbar>

                {/* Footer */}
                <Divider />
                <Box sx={{ p: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1 }}>
                    <Stack direction="row" spacing={1} alignItems="center">
                        <InfoRoundedIcon fontSize="small" />
                        <Typography variant="caption" color="text.secondary">Last updated: {lastUpdated}</Typography>
                    </Stack>
                    <Chip size="small" label={online ? 'ONLINE' : 'OFFLINE'} color={online ? 'success' : 'default'} variant="outlined"/>
                </Box>
            </Popover>
        </>
    )
}
