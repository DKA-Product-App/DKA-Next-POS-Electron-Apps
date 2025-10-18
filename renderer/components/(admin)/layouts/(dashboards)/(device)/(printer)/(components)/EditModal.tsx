'use client'

import * as React from 'react'
import {
    Dialog, DialogTitle, DialogContent, DialogActions,
    Box, Stack, TextField, Button, IconButton, Divider, Typography,
    MenuItem, Switch, FormControlLabel
} from '@mui/material'
import EditRounded from '@mui/icons-material/EditRounded'
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
import { DevicePrinter } from '../../../../../../../types/config/device/device.printer.type'

export type EditModalProps = {
    device: DevicePrinter
    onUpdated?: (updated?: any) => void
    triggerLabel?: string
    triggerProps?: React.ComponentProps<typeof Button>
    asIconButton?: boolean // kalau mau pakai IconButton kecil
}

/* ========= Helpers ========= */
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
    port: string
    timeout: string
}

export default function EditModal(props: EditModalProps) {
    const { device, onUpdated, triggerLabel = 'Edit', triggerProps, asIconButton } = props
    const { Session } = useSession()
    const { mode: themeMode, toggleMode } = useThemeCharger()

    const [open, setOpen] = React.useState(false)
    const [fullScreen, setFullScreen] = React.useState(false)
    const [submitting, setSubmitting] = React.useState(false)
    const [error, setError] = React.useState<string | null>(null)

    const hydrate = (d: DevicePrinter): FormState => ({
        name: d?.name ?? '',
        description: d?.description ?? '',
        status: !!d?.status,
        mode: (d?.options?.mode as any) || undefined,
        ip_address: d?.options?.ip_address ?? '',
        port: Number.isFinite(d?.options?.port as number) ? String(d?.options?.port) : '',
        timeout: Number.isFinite(d?.options?.timeout as number) ? String(d?.options?.timeout) : '',
    })

    const [form, setForm] = React.useState<FormState>(hydrate(device))

    const openModal = () => setOpen(true)
    const closeModal = () => setOpen(false)

    // Prefill saat dibuka (kalau device berubah di luar)
    React.useEffect(() => {
        if (!open) return
        setForm(hydrate(device))
    }, [open, device])

    // Reset saat ditutup
    React.useEffect(() => {
        if (open) return
        setForm(hydrate(device))
        setSubmitting(false)
        setError(null)
    }, [open]) // eslint-disable-line react-hooks/exhaustive-deps

    const onChangeField = <K extends keyof FormState>(k: K, v: FormState[K]) => setForm(f => ({ ...f, [k]: v }))
    const onChangePort = (val: string) => onChangeField('port', toDigits(val))
    const onChangeTimeout = (val: string) => onChangeField('timeout', toDigits(val))

    const buildPayload = async (): Promise<Partial<DevicePrinter> & { id: string }> => ({
        id: device.id,
        reference: Session?.id ? { id: Session.id } : undefined,
        // branches: abaikan di edit kalau tidak ada UI-nya; backend bisa preserve existing
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
        (form.mode ? (form.mode === 'NETWORK' ? !!form.ip_address.trim() : true) : true)

    const handleSubmit = () => {
        if (!window?.api?.invoke) { setError('IPC bridge tidak tersedia'); return }
        if (!canSubmit) { setError('Mohon lengkapi field wajib (Nama, opsi sesuai mode).'); return }
        setSubmitting(true); setError(null)
        buildPayload()
            .then(payload => window.api.invoke('api.config.device.printer:update.one', { params: { id: device?.id }, data: payload }))
            .then((res: any) => props.onUpdated?.(res))
            .then(() => closeModal())
            .catch((err: any) => {
                const e = normalizeIpcError(err)
                console.error(e)
                setError(e?.msg || 'Gagal memperbarui device printer')
            })
            .finally(() => setSubmitting(false))
    }

    return (
        <>
            {asIconButton ? (
                <IconButton size="small" onClick={openModal} aria-label="Edit">
                    <EditRounded fontSize="small" />
                </IconButton>
            ) : (
                <Button
                    variant="outlined"
                    size="small"
                    startIcon={<EditRounded />}
                    onClick={openModal}
                    sx={{ borderRadius: 2 }}
                    {...triggerProps}
                >
                    {triggerLabel}
                </Button>
            )}

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
                    <Typography variant="h6" fontWeight={800}>Edit Device Printer</Typography>
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
                                    {/* ===== Baris 1: Nama & Status ===== */}
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
                                            value={form.mode ?? ''}
                                            onChange={e => onChangeField('mode', e.target.value as any)}
                                            fullWidth
                                            helperText="Pilih mode koneksi printer"
                                        >
                                            {['USB', 'SERIAL', 'NETWORK', 'BLUETOOTH'].map(m => (
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
                        {submitting ? 'Menyimpan…' : 'Simpan Perubahan'}
                    </Button>
                </DialogActions>
            </Dialog>
        </>
    )
}
