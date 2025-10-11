'use client'

import * as React from 'react'
import {
    IconButton, Tooltip, Badge, Popover, Box, Stack, TextField,
    List, ListItemButton, ListItemIcon, ListItemText, Typography, Chip, Radio, Divider, Checkbox
} from '@mui/material'
import PrintRoundedIcon from '@mui/icons-material/PrintRounded'
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded'
import RadioButtonUncheckedRoundedIcon from '@mui/icons-material/RadioButtonUncheckedRounded'
import ScienceRoundedIcon from '@mui/icons-material/ScienceRounded'
import PerfectScrollbar from 'react-perfect-scrollbar'
import 'react-perfect-scrollbar/dist/css/styles.css'
import { useUserConfig } from '../../../../contexts/UserConfigContext'
import { AxiosResponse } from 'axios'
import {DevicePrinter} from "../../../../types/config/device/device.printer.type";

type PrinterWidgetProps = {
    printerOnline?: boolean
    iconFontSize?: 'small' | 'medium' | 'large'
    onDefaultChanged?: (printer: DevicePrinter) => void
    onTestPrint?: (printer: DevicePrinter) => void
    width?: number
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
    const open = Boolean(anchorEl);

    const [printers, setPrinters] = React.useState<DevicePrinter[]>([])
    const [search, setSearch] = React.useState('')

    const { config, set } = useUserConfig()
    const autoPrint = config.printer.isPrintAutomatically
    const defaultPrinter = config.printer.defaultPrinter

    const requestPrinters = React.useCallback(() => {
        window?.api.invoke?.<any, AxiosResponse<DevicePrinter[]>>('api.config.device.printer:read.all', {})
            .then(({ data }) => {
                const list = data ?? []
                setPrinters(list)
                !defaultPrinter && list[0] ? set({ printer: { defaultPrinter: list[0] } }) : undefined
                defaultPrinter && !list.some(p => p.id === defaultPrinter.id)
                    ? set({ printer: { defaultPrinter: list[0] } })
                    : undefined
            })
            .catch(() => {
                setPrinters([])
                set({ printer: { defaultPrinter: undefined } })
            })
    }, [defaultPrinter?.id, set])

    const filtered = React.useMemo(
        () => printers.filter(p => (p.name ?? '').toLowerCase().includes(search.toLowerCase())),
        [printers, search],
    )

    const openPopover = (e: React.MouseEvent<HTMLElement>) => {
        setAnchorEl(e.currentTarget)
        requestPrinters() // auto-refresh tiap buka
    }
    const closePopover = () => setAnchorEl(null)

    const testPrint = () => {
        const cur = config.printer?.defaultPrinter
        cur ? onTestPrint?.(cur) : undefined
    }

    const toggleAutoPrint = (_: React.ChangeEvent<HTMLInputElement>, checked: boolean) =>
        set({ printer: { isPrintAutomatically: checked } })

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

            {/* Popover */}
            <Popover
                id="printer-popover"
                open={open}
                anchorEl={anchorEl}
                onClose={closePopover}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                transformOrigin={{ vertical: 'top', horizontal: 'right' }}
                keepMounted
                PaperProps={{ sx: { width, borderRadius: 3, overflow: 'hidden' }, elevation: 8 }}
            >
                {/* Header tools */}
                <Box sx={{ p: 1.5, borderBottom: '1px solid', borderColor: 'divider' }}>
                    <Stack direction="row" spacing={1} alignItems="center">
                        <TextField
                            size="small"
                            fullWidth
                            placeholder="Cari printer…"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                        {/* no refresh button; auto-refresh saat open */}
                    </Stack>

                    {/* Status bar kecil */}
                    <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 1 }}>
                        <Chip size="small" variant="outlined" color={autoPrint ? 'success' : 'default'} label={autoPrint ? 'Auto Print: ON' : 'Auto Print: OFF'} />
                        {defaultPrinter?.name
                            ? <Chip size="small" variant="outlined" label={`Default: ${defaultPrinter.description}`} />
                            : <Chip size="small" variant="outlined" color="warning" label="Default: Printer Default Belum Dipilih" />}
                    </Stack>
                </Box>

                {/* List dengan PerfectScrollbar */}
                <PerfectScrollbar options={{ suppressScrollX: true, wheelPropagation: false }} style={{ maxHeight }}>
                    <List disablePadding>
                        {filtered.map(p => {
                            const isSelected = defaultPrinter?.id === p.id
                            return (
                                <ListItemButton
                                    key={p.id ?? p.name}
                                    onClick={() => set({ printer: { defaultPrinter: p } })}
                                    selected={isSelected}
                                    sx={{ px: 1.5, py: 1 }}
                                >
                                    <ListItemIcon sx={{ minWidth: 36 }}>
                                        <Radio edge="start" checked={isSelected} tabIndex={-1} />
                                    </ListItemIcon>
                                    <ListItemText
                                        primary={
                                            <Stack direction="row" alignItems="center" spacing={1}>
                                                <Typography variant="body1" fontWeight={600}>{p.name}</Typography>
                                                {isSelected && (
                                                    <Stack direction="row" alignItems="center" spacing={0.5}>
                                                        <CheckCircleRoundedIcon fontSize="small" />
                                                        <Typography variant="caption">Default</Typography>
                                                    </Stack>
                                                )}
                                            </Stack>
                                        }
                                        secondary={
                                            <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 0.25 }}>
                                                {p.description && <Typography variant="subtitle1" color="text.secondary">{p.description}</Typography>}
                                                {p.options && <Typography variant="caption" color="text.secondary">{p.options?.ip_address}</Typography>}
                                            </Stack>
                                        }
                                    />
                                </ListItemButton>
                            )
                        })}

                        {filtered.length === 0 && (
                            <Box sx={{ p: 2 }}>
                                <Typography variant="body2" color="text.secondary">Nggak nemu printer yang sesuai pencarianmu.</Typography>
                            </Box>
                        )}
                    </List>
                </PerfectScrollbar>

                <Divider />

                {/* Footer: checkbox bulat besar + Test Print icon-only */}
                <Box sx={{ p: 1.25, display: 'flex', gap: 1, alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap' }}>
                    <Stack direction="row" alignItems="center" spacing={0.75}>
                    </Stack>

                    <Stack direction="row" spacing={1} alignItems="center">
                        <Tooltip title={autoPrint ? 'Automatically Print: ON' : 'Automatically Print: OFF'}>
                            <Checkbox
                                checked={autoPrint}
                                onChange={toggleAutoPrint}
                                // bikin besar via fontSize ikon
                                icon={<RadioButtonUncheckedRoundedIcon fontSize="inherit" />}
                                checkedIcon={<CheckCircleRoundedIcon fontSize="inherit" />}
                                sx={{
                                    p: 0.5,
                                    '& svg': { fontSize: 28, transition: '200ms' },                 // <- ukuran besar
                                    '&.Mui-checked svg': { color: 'success.main' },  // hijau saat ON
                                    '& .MuiSvgIcon-root': { borderRadius: '999px' },
                                }}
                                aria-label="Print Otomatis"
                            />
                        </Tooltip>
                        <Tooltip title={defaultPrinter ? `Test Print → ${defaultPrinter.name}` : 'Pilih printer dulu'}>
                            <span>
                                <IconButton
                                    onClick={testPrint}
                                    disabled={!defaultPrinter}
                                    size="medium"
                                    aria-label="Test Print">
                                  <ScienceRoundedIcon fontSize="medium" />
                                </IconButton>
                            </span>
                        </Tooltip>
                    </Stack>
                </Box>
            </Popover>
        </>
    )
}
