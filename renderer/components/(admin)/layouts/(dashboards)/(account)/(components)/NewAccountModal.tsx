'use client'

import * as React from 'react'
import {
    Dialog, DialogTitle, DialogContent, DialogActions,
    Box, Stack, TextField, Button, IconButton, Tooltip, Divider, Avatar, MenuItem, Typography,
    LinearProgress, InputAdornment, Chip
} from '@mui/material'
import AddRounded from '@mui/icons-material/AddRounded'
import DeleteOutlineRounded from '@mui/icons-material/DeleteOutlineRounded'
import UploadRounded from '@mui/icons-material/UploadRounded'
import FullscreenExitRounded from '@mui/icons-material/FullscreenExitRounded'
import FullscreenRounded from '@mui/icons-material/FullscreenRounded'
import DarkModeRounded from '@mui/icons-material/DarkModeRounded'
import LightModeRounded from '@mui/icons-material/LightModeRounded'
import CloseRounded from '@mui/icons-material/CloseRounded'
import AccessTimeRounded from '@mui/icons-material/AccessTimeRounded'
import VisibilityRounded from '@mui/icons-material/VisibilityRounded'
import VisibilityOffRounded from '@mui/icons-material/VisibilityOffRounded'
import PersonRounded from '@mui/icons-material/PersonRounded'
import BadgeRounded from '@mui/icons-material/BadgeRounded'
import AlternateEmailRounded from '@mui/icons-material/AlternateEmailRounded'
import LockRounded from '@mui/icons-material/LockRounded'
import LockResetRounded from '@mui/icons-material/LockResetRounded'
import AdminPanelSettingsRounded from '@mui/icons-material/AdminPanelSettingsRounded'
import PerfectScrollbar from 'react-perfect-scrollbar'
import 'react-perfect-scrollbar/dist/css/styles.css'
import { useThemeCharger } from '../../../../../../contexts/ThemeCharger'

type ApiShift = { id: string; name: string; start_time: string; end_time: string; status?: boolean }
type ApiRole  = { id: string; code: string; name: string; status?: boolean }

export type NewAccountModalProps = {
    onCreated?: (created?: any) => void
    triggerLabel?: string
    triggerProps?: React.ComponentProps<typeof Button>
}

/* utils */
const t = (s?: string | null) => (s ?? '').trim()
const readAsDataUrl = (file: File) => new Promise<string>((res, rej) => { const fr = new FileReader(); fr.onload = () => res(String(fr.result)); fr.onerror = () => rej(new Error('Gagal membaca file')); fr.readAsDataURL(file) })
const b64ToBytes = (b64: string) => Array.from((typeof atob === 'function' ? atob(b64) : Buffer.from(b64, 'base64').toString('binary')), ch => ch.charCodeAt(0))

/* password strength */
const scorePassword = (pwd: string) => {
    const s = t(pwd)
    const len = s.length >= 8 ? 1 : 0
    const hasLower = /[a-z]/.test(s) ? 1 : 0
    const hasUpper = /[A-Z]/.test(s) ? 1 : 0
    const hasDigit = /\d/.test(s) ? 1 : 0
    const hasSymbol = /[^A-Za-z0-9]/.test(s) ? 1 : 0
    const variety = (hasLower + hasUpper >= 1 ? 1 : 0) + hasDigit + hasSymbol
    const raw = len + variety
    const clamp = Math.max(0, Math.min(4, raw))
    const pct = clamp * 25
    const label = ['Very Weak','Weak','Fair','Good','Strong'][clamp] || 'Very Weak'
    const color: 'error'|'warning'|'success' = clamp <= 1 ? 'error' : clamp <= 2 ? 'warning' : 'success'
    return { score: clamp, pct, label, color }
}

export default function NewAccountModal({ onCreated, triggerLabel = 'Tambah Account', triggerProps }: NewAccountModalProps) {
    const { mode, toggleMode } = useThemeCharger()

    const [open, setOpen] = React.useState(false)
    const [fullScreen, setFullScreen] = React.useState(false)

    // form state
    const [firstName, setFirstName] = React.useState('')
    const [lastName, setLastName] = React.useState('')
    const [username, setUsername] = React.useState('')

    // password + confirm + visibility
    const [password, setPassword] = React.useState('')
    const [confirm, setConfirm] = React.useState('')
    const [showPwd, setShowPwd] = React.useState(false)
    const [showConfirm, setShowConfirm] = React.useState(false)
    const strength = scorePassword(password)
    const mismatch = t(confirm).length > 0 && t(confirm) !== t(password)

    // shift
    const [shifts, setShifts] = React.useState<ApiShift[]>([])
    const [shiftId, setShiftId] = React.useState<string>('')
    const [loadingShifts, setLoadingShifts] = React.useState(false)

    // roles (multi)
    const [rolesList, setRolesList] = React.useState<ApiRole[]>([])
    const [roleIds, setRoleIds] = React.useState<string[]>([])
    const [loadingRoles, setLoadingRoles] = React.useState(false)

    // avatar image (opsional)
    const [imageFile, setImageFile] = React.useState<File | null>(null)
    const [imagePreview, setImagePreview] = React.useState<string | null>(null)

    const [submitting, setSubmitting] = React.useState(false)
    const [error, setError] = React.useState<string | null>(null)

    const openModal = () => setOpen(true)
    const closeModal = () => setOpen(false)

    const clearImage = () => { setImageFile(null); setImagePreview(null) }
    const onPickFile = (e: React.ChangeEvent<HTMLInputElement>) => {
        const f = e.target.files?.[0]; if (!f) return
        setImageFile(f); readAsDataUrl(f).then(setImagePreview).catch(() => setImagePreview(null))
    }

    const canSubmit =
        t(username).length > 0 &&
        t(password).length > 0 &&
        !mismatch &&
        (t(firstName).length > 0 || t(lastName).length > 0)

    // fetch shifts
    const fetchShifts = React.useCallback(() => {
        if (!open) return
        if (!window?.api?.invoke) { setError('Bridge tidak tersedia'); return }
        setLoadingShifts(true)
        window.api
            .invoke<any, { data: ApiShift[] }>('api.config.data.shift:read.all', {})
            .then(({ data }) => { setShifts(Array.isArray(data) ? data.filter(s => !!s?.id) : []); setError(null) })
            .catch((err: any) => { console.error(err); setShifts([]); setError(err?.msg ?? 'Gagal memuat daftar shift') })
            .finally(() => setLoadingShifts(false))
    }, [open])

    // fetch roles
    const fetchRoles = React.useCallback(() => {
        if (!open) return
        if (!window?.api?.invoke) { setError('Bridge tidak tersedia'); return }
        setLoadingRoles(true)
        window.api
            .invoke<any, { data: ApiRole[] }>('api.account.role:read.all', {})
            .then(({ data }) => { setRolesList(Array.isArray(data) ? data.filter(r => !!r?.id) : []); setError(null) })
            .catch((err: any) => { console.error(err); setRolesList([]); setError(err?.msg ?? 'Gagal memuat daftar role') })
            .finally(() => setLoadingRoles(false))
    }, [open])

    React.useEffect(() => { fetchShifts(); fetchRoles() }, [fetchShifts, fetchRoles])

    React.useEffect(() => {
        if (!open) {
            setFirstName(''); setLastName(''); setUsername('')
            setPassword(''); setConfirm(''); setShowPwd(false); setShowConfirm(false)
            setShiftId(''); setRoleIds([])
            clearImage(); setSubmitting(false); setError(null)
        }
    }, [open])

    const buildPayload = async () => {
        const payload: any = {
            name: { first_name: t(firstName), last_name: t(lastName) },
            username: t(username),
            password: t(password),
            shift_id: t(shiftId) || null,
            roles: roleIds.map(id => ({ id })), // <<<<<<<<<< roles array
        }
        if (imageFile) {
            const dataUrl = await readAsDataUrl(imageFile)
            const [meta, b64] = dataUrl.split(',')
            const mimetype = meta?.match(/data:(.*?);base64/)?.[1] || 'image/jpeg'
            payload.image = { type: 'Buffer', data: b64ToBytes(b64) }
            payload.imageName = imageFile.name
            payload.imageMime = mimetype
        } else {
            payload.image = null
        }
        return payload
    }

    const handleSubmit = () =>
        (!window?.api?.invoke || !canSubmit)
            ? setError(!window?.api?.invoke ? 'IPC bridge tidak tersedia' : (mismatch ? 'Konfirmasi password tidak cocok' : 'Lengkapi form minimal Nama/Username/Password'))
            : (setSubmitting(true), setError(null),
                    buildPayload()
                        .then(payload => window.api.invoke('api.account:create', payload))
                        .then((res: any) => onCreated?.(res))
                        .then(() => closeModal())
                        .catch((err: any) => setError(err?.msg || err?.message || 'Gagal membuat akun'))
                        .finally(() => setSubmitting(false))
            )

    return (
        <>
            <Button variant="contained" startIcon={<AddRounded />} onClick={openModal} sx={{ borderRadius: 2 }} {...triggerProps}>
                {triggerLabel}
            </Button>

            <Dialog
                open={open}
                onClose={closeModal}
                fullWidth
                maxWidth="xl"
                fullScreen={fullScreen}
                slotProps={{
                    paper: { sx: { height: fullScreen ? '100vh' : '85vh', display: 'flex', bgcolor: 'background.paper', flexDirection: 'column', minWidth: 0 } }
                }}
            >
                <DialogTitle sx={{ display: 'flex', alignItems: 'center', pr: 1.5, gap: 1 }}>
                    <Typography variant="h6" fontWeight={800}>Buat Akun</Typography>
                    <Stack direction="row" spacing={0.5} alignItems="center" sx={{ ml: 'auto' }}>
                        <Tooltip title={fullScreen ? 'Keluar layar penuh' : 'Layar penuh'}>
                            <IconButton size="small" onClick={() => setFullScreen(v => !v)} aria-label="fullscreen">
                                {fullScreen ? <FullscreenExitRounded fontSize="small" /> : <FullscreenRounded fontSize="small" />}
                            </IconButton>
                        </Tooltip>
                        <Tooltip title={mode === 'dark' ? 'Ganti ke tema terang' : 'Ganti ke tema gelap'}>
                            <IconButton size="small" onClick={toggleMode} aria-label="toggle-theme">
                                {mode === 'dark' ? <DarkModeRounded fontSize="small" /> : <LightModeRounded fontSize="small" />}
                            </IconButton>
                        </Tooltip>
                        <Tooltip title="Tutup">
                            <IconButton size="small" onClick={closeModal} aria-label="close">
                                <CloseRounded fontSize="small" />
                            </IconButton>
                        </Tooltip>
                    </Stack>
                </DialogTitle>

                <DialogContent dividers sx={{ p: 0, flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0, bgcolor: 'background.paper', overflow: 'hidden' }}>
                    <Box sx={{ flex: 1, minHeight: 0, minWidth: 0, height: '100%' }}>
                        <PerfectScrollbar options={{ suppressScrollX: true, wheelPropagation: false }} style={{ width: '100%', height: '100%' }}>
                            <Box sx={{ p: 4 }}>
                                <Stack spacing={2}>
                                    {/* Avatar + Info dasar */}
                                    <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
                                        <Stack alignItems="center" spacing={1.5} sx={{ width: { md: 260 } }}>
                                            <Avatar
                                                variant="rounded"
                                                src={imagePreview || undefined}
                                                sx={{ width: 180, height: 180, borderRadius: 2, bgcolor: 'background.neutral', fontWeight: 700 }}
                                            >
                                                {!imagePreview ? 'NO IMG' : null}
                                            </Avatar>

                                            {imagePreview ? (
                                                <Stack direction="row" spacing={1}>
                                                    <Tooltip title="Ganti gambar">
                                                        <IconButton color="primary" size="small" component="label" sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
                                                            <UploadRounded fontSize="small" />
                                                            <input hidden accept="image/*" type="file" onChange={onPickFile} />
                                                        </IconButton>
                                                    </Tooltip>
                                                    <Tooltip title="Hapus gambar">
                                                        <IconButton color="error" size="small" onClick={clearImage} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
                                                            <DeleteOutlineRounded fontSize="small" />
                                                        </IconButton>
                                                    </Tooltip>
                                                </Stack>
                                            ) : (
                                                <Button variant="outlined" size="small" component="label" startIcon={<UploadRounded />} sx={{ borderRadius: 2 }}>
                                                    Pilih Gambar
                                                    <input hidden accept="image/*" type="file" onChange={onPickFile} />
                                                </Button>
                                            )}
                                        </Stack>

                                        {/* Form fields */}
                                        <Stack spacing={1.5} sx={{ flex: 1, minWidth: 0 }}>
                                            <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5}>
                                                <TextField
                                                    fullWidth
                                                    label="First Name"
                                                    value={firstName}
                                                    onChange={e => setFirstName(e.target.value)}
                                                    autoFocus
                                                    InputProps={{ startAdornment: <InputAdornment position="start"><PersonRounded fontSize="small" /></InputAdornment> }}
                                                />
                                                <TextField
                                                    fullWidth
                                                    label="Last Name"
                                                    value={lastName}
                                                    onChange={e => setLastName(e.target.value)}
                                                    InputProps={{ startAdornment: <InputAdornment position="start"><BadgeRounded fontSize="small" /></InputAdornment> }}
                                                />
                                            </Stack>

                                            <TextField
                                                fullWidth
                                                label="Username"
                                                value={username}
                                                onChange={e => setUsername(e.target.value)}
                                                inputProps={{ autoComplete: 'off' }}
                                                InputProps={{ startAdornment: <InputAdornment position="start"><AlternateEmailRounded fontSize="small" /></InputAdornment> }}
                                            />

                                            {/* Password + Confirm + Strength */}
                                            <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5}>
                                                <TextField
                                                    fullWidth
                                                    label="Password"
                                                    type={showPwd ? 'text' : 'password'}
                                                    value={password}
                                                    onChange={e => setPassword(e.target.value)}
                                                    InputProps={{
                                                        startAdornment: <InputAdornment position="start"><LockRounded fontSize="small" /></InputAdornment>,
                                                        endAdornment: (
                                                            <InputAdornment position="end">
                                                                <IconButton size="small" onClick={() => setShowPwd(v => !v)} edge="end" aria-label="toggle password">
                                                                    {showPwd ? <VisibilityOffRounded /> : <VisibilityRounded />}
                                                                </IconButton>
                                                            </InputAdornment>
                                                        ),
                                                    }}
                                                />
                                                <TextField
                                                    fullWidth
                                                    label="Konfirmasi Password"
                                                    type={showConfirm ? 'text' : 'password'}
                                                    value={confirm}
                                                    onChange={e => setConfirm(e.target.value)}
                                                    error={mismatch}
                                                    helperText={mismatch ? 'Konfirmasi tidak cocok' : ' '}
                                                    InputProps={{
                                                        startAdornment: <InputAdornment position="start"><LockResetRounded fontSize="small" /></InputAdornment>,
                                                        endAdornment: (
                                                            <InputAdornment position="end">
                                                                <IconButton size="small" onClick={() => setShowConfirm(v => !v)} edge="end" aria-label="toggle confirm">
                                                                    {showConfirm ? <VisibilityOffRounded /> : <VisibilityRounded />}
                                                                </IconButton>
                                                            </InputAdornment>
                                                        ),
                                                    }}
                                                />
                                            </Stack>

                                            <Stack spacing={0.5}>
                                                <Stack direction="row" alignItems="center" justifyContent="space-between">
                                                    <Typography variant="caption" color="text.secondary">Password Strength</Typography>
                                                    <Typography
                                                        variant="caption"
                                                        fontWeight={700}
                                                        color={strength.color === 'success' ? 'success.main' : strength.color === 'warning' ? 'warning.main' : 'error.main'}
                                                    >
                                                        {strength.label}
                                                    </Typography>
                                                </Stack>
                                                <LinearProgress variant="determinate" value={strength.pct} color={strength.color} sx={{ height: 8, borderRadius: 2 }} />
                                            </Stack>

                                            <Divider />

                                            {/* Shift */}
                                            <TextField
                                                select
                                                fullWidth
                                                label="Shift (opsional)"
                                                value={shiftId}
                                                onChange={e => setShiftId(e.target.value)}
                                                disabled={loadingShifts}
                                                helperText="Pilih shift yang berlaku untuk akun (boleh dikosongkan)"
                                                InputProps={{ startAdornment: <InputAdornment position="start"><AccessTimeRounded fontSize="small" /></InputAdornment> }}
                                            >
                                                {loadingShifts
                                                    ? <MenuItem value="" disabled>Memuat shift…</MenuItem>
                                                    : [
                                                        <MenuItem key="none" value="">— Tanpa Shift —</MenuItem>,
                                                        ...shifts.map(s => (
                                                            <MenuItem key={s.id} value={s.id}>
                                                                <Stack direction="row" spacing={1} alignItems="center">
                                                                    <Typography variant="body2" fontWeight={600}>{s.name}</Typography>
                                                                    <Typography variant="caption" color="text.secondary">{s.start_time}–{s.end_time}</Typography>
                                                                </Stack>
                                                            </MenuItem>
                                                        ))
                                                    ]
                                                }
                                            </TextField>

                                            {/* Roles multi-select */}
                                            <TextField
                                                select
                                                fullWidth
                                                SelectProps={{
                                                    multiple: true,
                                                    value: roleIds,
                                                    onChange: (e) => {
                                                        const val = e.target.value
                                                        setRoleIds(typeof val === 'string' ? val.split(',') : (val as string[]))
                                                    },
                                                    renderValue: (selected) => (
                                                        <Stack direction="row" spacing={0.5} sx={{ flexWrap: 'wrap' }}>
                                                            {(selected as string[]).map(id => {
                                                                const r = rolesList.find(x => x.id === id)
                                                                return <Chip key={id} size="small" label={r ? `${r.code}` : id} sx={{ borderRadius: 2 }} />
                                                            })}
                                                        </Stack>
                                                    ),
                                                }}
                                                label="Roles"
                                                disabled={loadingRoles}
                                                helperText="Pilih satu atau lebih role"
                                                InputProps={{ startAdornment: <InputAdornment position="start"><AdminPanelSettingsRounded fontSize="small" /></InputAdornment> }}
                                            >
                                                {loadingRoles
                                                    ? <MenuItem value="" disabled>Memuat roles…</MenuItem>
                                                    : rolesList.length === 0
                                                        ? <MenuItem value="" disabled>Tidak ada data role</MenuItem>
                                                        : rolesList.map(r => (
                                                            <MenuItem key={r.id} value={r.id}>
                                                                <Stack direction="row" spacing={1} alignItems="center">
                                                                    <Typography variant="body2" fontWeight={600}>{r.code}</Typography>
                                                                    <Typography variant="caption" color="text.secondary">{r.name}</Typography>
                                                                </Stack>
                                                            </MenuItem>
                                                        ))
                                                }
                                            </TextField>

                                            {!!error && <Typography variant="body2" color="error.main">{error}</Typography>}
                                        </Stack>
                                    </Stack>
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
