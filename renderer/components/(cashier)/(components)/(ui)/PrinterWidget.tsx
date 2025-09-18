'use client'

import * as React from 'react'
import {
    IconButton, Tooltip, Badge, Popover, Box, Stack, TextField, Button,
    List, ListItemButton, ListItemIcon, ListItemText, Typography, Chip, Radio, Divider
} from '@mui/material'
import PrintRoundedIcon from '@mui/icons-material/PrintRounded'
import RefreshRoundedIcon from '@mui/icons-material/RefreshRounded'
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded'
import ScienceRoundedIcon from '@mui/icons-material/ScienceRounded'
import PerfectScrollbar from 'react-perfect-scrollbar'
import 'react-perfect-scrollbar/dist/css/styles.css'

export type PrinterInfo = {
    name: string
    isDefault?: boolean
    status?: 'online' | 'offline' | 'unknown'
    description?: string
}

type PrinterWidgetProps = {
    printerOnline?: boolean
    iconFontSize?: 'small' | 'medium' | 'large'
    onDefaultChanged?: (name: string) => void
    onTestPrint?: (name: string) => void
    /** Lebar popover (px) */
    width?: number
    /** Tinggi maksimal area scroll (px) */
    maxHeight?: number
}

export default function PrinterWidget({
                                          printerOnline = true,
                                          iconFontSize = 'small',
                                          onDefaultChanged,
                                          onTestPrint,
                                          width = 420,
                                          maxHeight = 360,
                                      }: PrinterWidgetProps) {
    const [anchorEl, setAnchorEl] = React.useState<HTMLElement | null>(null)
    const open = Boolean(anchorEl)

    const [printers, setPrinters] = React.useState<PrinterInfo[]>([])
    const [selected, setSelected] = React.useState<string | null>(null)
    const [search, setSearch] = React.useState('')

    const requestPrinters = React.useCallback(() => {
        /*if (typeof window !== 'undefined' && window.ipc) {
            window.ipc.send('printers:list')
            return
        }*/
        // fallback dummy
        const dummy: PrinterInfo[] = [
            { name: 'EPSON TM-T82III (USB)', status: 'online', isDefault: true, description: 'Thermal 80mm' },
            { name: 'HP Laser 1020', status: 'offline', description: 'A4 Mono' },
            { name: 'POS-X Thermal (LAN)', status: 'online', description: 'Thermal 80mm LAN' },
        ]
        setPrinters(dummy)
        setSelected(p => p ?? dummy.find(d => d.isDefault)?.name ?? dummy[0]?.name ?? null)
    }, [])

    React.useEffect(() => {
        if (typeof window === 'undefined' || !window.ipc) return
        const onPrinters = (payload: { printers: PrinterInfo[] }) => {
            const list = payload?.printers ?? []
            setPrinters(list)
            const def = list.find(p => p.isDefault)?.name ?? list[0]?.name ?? null
            setSelected(def)
        }
        window.ipc.on('printers:list:result', onPrinters)
        return () => {
            /*window.ipc?.off?.('printers:list:result', onPrinters)*/
        }
    }, [])

    const filtered = React.useMemo(
        () => printers.filter(p => p.name.toLowerCase().includes(search.toLowerCase())),
        [printers, search],
    )

    const openPopover = (e: React.MouseEvent<HTMLElement>) => {
        setAnchorEl(e.currentTarget)
        requestPrinters()
    }
    const closePopover = () => setAnchorEl(null)

    const setDefault = () => {
        if (!selected) return
        if (window?.ipc) window.ipc.send('printers:setDefault', { name: selected })
        setPrinters(prev => prev.map(p => ({ ...p, isDefault: p.name === selected })))
        onDefaultChanged?.(selected)
    }

    const testPrint = () => {
        if (!selected) return
        if (window?.ipc) window.ipc.send('printers:test', { name: selected })
        onTestPrint?.(selected)
    }

    return (
        <>
            {/* Anchor: ikon printer */}
            <Tooltip title={printerOnline ? 'Printer Online' : 'Printer Offline'}>
                <IconButton
                    size="small"
                    onClick={openPopover}
                    aria-haspopup="dialog"
                    aria-expanded={open ? 'true' : undefined}
                    aria-controls="printer-popover"
                >
                    <Badge
                        variant="dot"
                        color={printerOnline ? 'success' : 'error'}
                        overlap="circular"
                        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                    >
                        <PrintRoundedIcon fontSize={iconFontSize} />
                    </Badge>
                </IconButton>
            </Tooltip>

            {/* Popover: notif style, anchored ke ikon */}
            <Popover
                id="printer-popover"
                open={open}
                anchorEl={anchorEl}
                onClose={closePopover}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                transformOrigin={{ vertical: 'top', horizontal: 'right' }}
                keepMounted
                PaperProps={{
                    sx: {
                        width,
                        borderRadius: 3,
                        overflow: 'hidden',
                    },
                    elevation: 8,
                }}
            >
                {/* Header tools */}
                <Box sx={{ p: 1.5, borderBottom: '1px solid', borderColor: 'divider' }}>
                    <Stack direction="row" spacing={1}>
                        <TextField
                            size="small"
                            fullWidth
                            placeholder="Cari printer…"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                        <Button variant="outlined" size={'small'} startIcon={<RefreshRoundedIcon/>} onClick={requestPrinters}></Button>
                    </Stack>
                </Box>

                {/* List dengan PerfectScrollbar */}
                <PerfectScrollbar options={{ suppressScrollX: true, wheelPropagation: false }} style={{ maxHeight: maxHeight }}>
                    <List disablePadding>
                        {filtered.map(p => (
                            <ListItemButton
                                key={p.name}
                                onClick={() => setSelected(p.name)}
                                selected={selected === p.name}
                                sx={{ px: 1.5, py: 1 }}
                            >
                                <ListItemIcon sx={{ minWidth: 36 }}>
                                    <Radio edge="start" checked={selected === p.name} tabIndex={-1} />
                                </ListItemIcon>
                                <ListItemText
                                    primary={
                                        <Stack direction="row" alignItems="center" spacing={1}>
                                            <Typography variant="body1" fontWeight={600}>{p.name}</Typography>
                                            {p.isDefault && (
                                                <Stack direction="row" alignItems="center" spacing={0.5}>
                                                    <CheckCircleRoundedIcon fontSize="small" />
                                                    <Typography variant="caption">Default</Typography>
                                                </Stack>
                                            )}
                                        </Stack>
                                    }
                                    secondary={
                                        <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 0.25 }}>
                                            {p.description && <Typography variant="caption" color="text.secondary">{p.description}</Typography>}
                                            <Chip
                                                size="small"
                                                label={p.status === 'online' ? 'Online' : p.status === 'offline' ? 'Offline' : 'Unknown'}
                                                color={p.status === 'online' ? 'success' : p.status === 'offline' ? 'default' : 'warning'}
                                                variant="outlined"
                                            />
                                        </Stack>
                                    }
                                />
                            </ListItemButton>
                        ))}

                        {filtered.length === 0 && (
                            <Box sx={{ p: 2 }}>
                                <Typography variant="body2" color="text.secondary">
                                    Nggak nemu printer yang sesuai pencarianmu.
                                </Typography>
                            </Box>
                        )}
                    </List>
                </PerfectScrollbar>

                <Divider />

                {/* Footer actions */}
                <Box sx={{ p: 1.25, display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                    <Button onClick={testPrint} variant="outlined" startIcon={<ScienceRoundedIcon />} disabled={!selected}>
                        Test Print
                    </Button>
                    <Button onClick={setDefault} variant="contained" startIcon={<CheckCircleRoundedIcon />} disabled={!selected}>
                        Set Default
                    </Button>
                </Box>
            </Popover>
        </>
    )
}
