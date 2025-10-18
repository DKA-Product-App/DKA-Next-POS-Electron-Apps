'use client'

import * as React from 'react'
import {
    Dialog, DialogTitle, DialogContent, DialogActions,
    Box, Stack, TextField, Button, IconButton, Divider, Typography,
    Chip, Autocomplete, MenuItem, Switch, FormControlLabel
} from '@mui/material'
import AddRounded from '@mui/icons-material/AddRounded'
import FullscreenExitRounded from '@mui/icons-material/FullscreenExitRounded'
import FullscreenRounded from '@mui/icons-material/FullscreenRounded'
import DarkModeRounded from '@mui/icons-material/DarkModeRounded'
import LightModeRounded from '@mui/icons-material/LightModeRounded'
import CloseRounded from '@mui/icons-material/CloseRounded'
import PerfectScrollbar from 'react-perfect-scrollbar'
import 'react-perfect-scrollbar/dist/css/styles.css'

import { useSession } from '../../../../../../../contexts/SessionProviderContext'
import { useThemeCharger } from '../../../../../../../contexts/ThemeCharger'
import normalizeIpcError from '../../../../../../../helpers/electronMessageErrorEsctration'
import {DevicePrinter, DevicePrinterOptions} from "../../../../../../../types/config/device/device.printer.type";

export type NewModalProps = {
    onCreated?: (created?: any) => void
    triggerLabel?: string
    triggerProps?: React.ComponentProps<typeof Button>
}

/* ========= Helpers ringan ========= */
const toDigits = (v: string) => (v || '').replace(/\D/g, '')
const toIntOrUndef = (v: string) => {
    const n = Number(v)
    return Number.isFinite(n) && String(v).length ? n : undefined
}

/* ========= Component ========= */

type FormState = {
    name: string
    description: string
    status: boolean
    mode: 'NETWORK' | 'USB' | 'SERIAL' | 'BLUETOOTH' | undefined
    ip_address: string
    port: string          // simpan sebagai string digit → convert saat payload
    timeout: string       // simpan sebagai string digit → convert saat payload
}

export default function NewModal(props: NewModalProps) {
    const { onCreated, triggerLabel = 'Tambah Printer', triggerProps } = props
    const { Session } = useSession()
    const { mode: themeMode, toggleMode } = useThemeCharger()

    const [open, setOpen] = React.useState(false)
    const [fullScreen, setFullScreen] = React.useState(false)
    const [submitting, setSubmitting] = React.useState(false)
    const [error, setError] = React.useState<string | null>(null)

    const [form, setForm] = React.useState<FormState>({
        name: '',
        description: '',
        status: true,
        mode: undefined,
        ip_address: '',
        port: '',
        timeout: '',
    })

    const openModal = () => setOpen(true)
    const closeModal = () => setOpen(false)

    // reset state ketika modal ditutup
    React.useEffect(() => {
        if (open) return
        setForm({
            name: '',
            description: '',
            status: true,
            mode: undefined,
            ip_address: '',
            port: '',
            timeout: '',
        })
        setSubmitting(false)
        setError(null)
    }, [open]) // eslint-disable-line react-hooks/exhaustive-deps

    /* ===== Handlers ===== */
    const onChangeField = <K extends keyof FormState>(key: K, val: FormState[K]) =>
        setForm(f => ({ ...f, [key]: val }))

    const onChangePort = (val: string) => onChangeField('port', toDigits(val))
    const onChangeTimeout = (val: string) => onChangeField('timeout', toDigits(val))

    const buildPayload = async (): Promise<Partial<DevicePrinter>> => ({
        reference: Session?.id ? { id: Session.id } : undefined,
        branches: (Session?.id) ? Session?.branches : [],
        name: form.name.trim(),
        description: form.description.trim() || undefined,
        status: !!form.status,
        options: {
            mode: form.mode || undefined,
            ip_address: form.ip_address.trim() || undefined,
            port: toIntOrUndef(form.port),
            timeout: toIntOrUndef(form.timeout),
        },
    })

    const canSubmit =
        form.name.trim().length > 0 &&
        (form.mode ? (
            form.mode === 'NETWORK'
                ? !!form.ip_address.trim()
                : true
        ) : true)

    const handleSubmit = () => {
        if (!window?.api?.invoke) { setError('IPC bridge tidak tersedia'); return }
        if (!canSubmit) { setError('Mohon lengkapi field wajib (Nama, opsi sesuai mode).'); return }
        setSubmitting(true); setError(null)
        buildPayload()
            .then(payload => window.api.invoke('api.config.device.printer:create', payload))
            .then((res: any) => props.onCreated?.(res))
            .then(() => closeModal())
            .catch((err: any) => {
                const e = normalizeIpcError(err)
                console.error(e)
                setError(e?.msg || 'Gagal membuat device printer')
            })
            .finally(() => setSubmitting(false))
    }

    return (
        <>
            {/* Trigger button */}
            <Button
                variant="contained"
                size="small"
                startIcon={<AddRounded />}
                onClick={openModal}
                sx={{ borderRadius: 2 }}
                {...triggerProps}
            >
                {triggerLabel}
            </Button>

            <Dialog
                open={open}
                onClose={closeModal}
                fullWidth
                maxWidth="xl"
                fullScreen={fullScreen}
                slotProps={{
                    paper: {
                        sx: {
                            height: fullScreen ? '100vh' : 'auto',
                            display: 'flex',
                            bgcolor: 'background.paper',
                            flexDirection: 'column',
                        }
                    }
                }}
            >
                <DialogTitle sx={{ display: 'flex', alignItems: 'center', pr: 1.5, gap: 1 }}>
                    <Typography variant="h6" fontWeight={800}>Tambah Device Printer</Typography>
                    <Stack direction="row" spacing={0.5} alignItems="center" sx={{ ml: 'auto' }}>
                        <IconButton size="small" onClick={() => setFullScreen(v => !v)} aria-label={fullScreen ? 'Keluar layar penuh' : 'Layar penuh'}>
                            {fullScreen ? <FullscreenExitRounded fontSize="small" /> : <FullscreenRounded fontSize="small" />}
                        </IconButton>
                        <IconButton size="small" onClick={toggleMode} aria-label={(themeMode === 'dark') ? 'Ganti ke tema terang' : 'Ganti ke tema gelap'}>
                            {(themeMode === 'dark') ? <DarkModeRounded fontSize="small" /> : <LightModeRounded fontSize="small" />}
                        </IconButton>
                        <IconButton size="small" onClick={closeModal} aria-label="Tutup">
                            <CloseRounded fontSize="small" />
                        </IconButton>
                    </Stack>
                </DialogTitle>

                <DialogContent
                    dividers
                    sx={{ p: 0, flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0, bgcolor: 'background.paper', overflow: 'hidden' }}
                >
                    <Box sx={{ flex: 1, minHeight: 0, minWidth: 0, height: '100%' }}>
                        <PerfectScrollbar options={{ suppressScrollX: true, wheelPropagation: false }} style={{ width: '100%', height: '100%' }}>
                            <Box sx={{ p: 4 }}>
                                <Stack spacing={2}>
                                    {/* ===== Baris 1: Nama, Status, Branch ===== */}
                                    <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
                                        <TextField
                                            label="Nama Printer"
                                            value={form.name}
                                            onChange={e => onChangeField('name', e.target.value)}
                                            required
                                            fullWidth
                                        />
                                        <FormControlLabel
                                            control={<Switch checked={form.status} onChange={e => onChangeField('status', e.target.checked)} />}
                                            label={<Typography variant="body2">Active</Typography>}
                                            sx={{ alignSelf: 'center', ml: { xs: 0, md: 1 } }}
                                        />
                                    </Stack>

                                    {/* ===== Deskripsi ===== */}
                                    <TextField
                                        label="Deskripsi"
                                        value={form.description}
                                        onChange={e => onChangeField('description', e.target.value)}
                                        fullWidth
                                        multiline
                                        minRows={2}
                                    />

                                    <Divider />

                                    {/* ===== Opsi Printer ===== */}
                                    <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
                                        <TextField
                                            select
                                            label="Mode"
                                            value={form.mode}
                                            onChange={e => onChangeField('mode', e.target.value as any)}
                                            fullWidth
                                            helperText="Pilih mode koneksi printer"
                                        >
                                            {['USB', 'SERIAL', 'NETWORK'].map(m => (
                                                <MenuItem key={m} value={m}>{m}</MenuItem>
                                            ))}
                                        </TextField>

                                        <TextField
                                            label="IP Address"
                                            value={form.ip_address}
                                            onChange={e => onChangeField('ip_address', e.target.value)}
                                            fullWidth
                                            disabled={form.mode !== 'NETWORK'}
                                            placeholder={form.mode === 'NETWORK' ? '192.168.1.200' : '—'}
                                            helperText={form.mode === 'NETWORK' ? 'Wajib diisi untuk NETWORK' : 'Tidak digunakan'}
                                        />

                                        <TextField
                                            label="Port"
                                            value={form.port}
                                            onChange={e => onChangePort(e.target.value)}
                                            inputMode="numeric"
                                            fullWidth
                                            placeholder="9100"
                                            helperText="Kosongkan jika default"
                                        />

                                        <TextField
                                            label="Timeout (ms)"
                                            value={form.timeout}
                                            onChange={e => onChangeTimeout(e.target.value)}
                                            inputMode="numeric"
                                            fullWidth
                                            placeholder="3000"
                                            helperText="Kosongkan jika default"
                                        />
                                    </Stack>

                                    {!!error && <Typography variant="body2" color="error.main">{error}</Typography>}
                                </Stack>
                            </Box>
                        </PerfectScrollbar>
                    </Box>
                </DialogContent>

                <DialogActions sx={{ px: 2, py: 1.5 }}>
                    <Button onClick={closeModal}>Batal</Button>
                    <Button variant="contained" onClick={handleSubmit} disabled={submitting || !canSubmit}>
                        {submitting ? 'Menyimpan…' : 'Simpan'}
                    </Button>
                </DialogActions>
            </Dialog>
        </>
    )
}
