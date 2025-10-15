'use client'

import * as React from 'react'
import {
    Dialog, DialogTitle, DialogContent, DialogActions,
    Box, Stack, TextField, Button, IconButton, Divider, Typography,
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
import { ConfigFloors } from '../../../../../../../types/config/data/floors.type'

export type NewModalProps = {
    onCreated?: (created?: any) => void
    triggerLabel?: string
    triggerProps?: React.ComponentProps<typeof Button>
}

/* ============== Helpers ============== */

// ambil 2 huruf (prioritas huruf pertama tiap kata → konsonan → sisa)
const abbr2 = (name: string): string => {
    const s = (name || '').trim().toUpperCase()
    if (!s) return ''
    const words = s.split(/\s+/).map(w => w.replace(/[^A-Z0-9]/g, ''))
    const initials = words.map(w => w[0]).filter(Boolean).join('')
    const joined = words.join('')
    const consonants = joined.replace(/[AEIOU]/g, '')
    const addUnique = (src: string, acc: string) =>
        src.split('').reduce((a, ch) => (a.length >= 2 || a.includes(ch)) ? a : a + ch, acc)
    const step1 = initials.slice(0, 2)
    const step2 = step1.length < 2 ? addUnique(consonants, step1) : step1
    const step3 = step2.length < 2 ? addUnique(joined, step2) : step2
    return step3.slice(0, 2)
}

/** izinkan A-Z/0-9/- dan batasi panjang 5 (AA-00) */
const allowFloorCodeTyping = (value: string): string =>
    (value || '').toUpperCase().replace(/[^A-Z0-9-]/g, '').slice(0, 5)

/** normalisasi ke pola AA-00 (kalau ada minimal 1 char) */
const normalizeFloorCodePattern = (value: string): string => {
    const raw = (value || '').toUpperCase()
    const letters = raw.replace(/[^A-Z]/g, '').slice(0, 2)
    const digitsRaw = raw.replace(/\D/g, '')
    if (!letters && !digitsRaw) return ''
    const L = letters.padEnd(2, 'X')
    const D = (digitsRaw.slice(-2) || '01').padStart(2, '0')
    return `${L}-${D}`
}

/** auto generate: dari nama → AB-01 (kecuali user sudah oprek kode) */
const autoCodeFromName = (floorName: string): string => {
    const L = (abbr2(floorName) || 'LT').padEnd(2, 'X').slice(0, 2)
    return `${L}-01`
}

/* ============== Component ============== */

export default function NewModal(props: NewModalProps) {
    const { onCreated, triggerLabel = 'Tambah Lantai', triggerProps } = props
    const { Session } = useSession()
    const { mode, toggleMode } = useThemeCharger()

    const [open, setOpen] = React.useState(false)
    const [fullScreen, setFullScreen] = React.useState(false)
    const [submitting, setSubmitting] = React.useState(false)
    const [error, setError] = React.useState<string | null>(null)

    // tambahkan flag lokal codeTouched
    const [form, setForm] = React.useState<ConfigFloors & { codeTouched?: boolean }>({
        code: '',
        name: '',
        description: '',
        codeTouched: false,
    })

    const openModal = () => setOpen(true)
    const closeModal = () => setOpen(false)

    // reset saat modal ditutup
    React.useEffect(() => {
        if (open) return
        setForm({ code: '', name: '', description: '', codeTouched: false })
        setSubmitting(false)
        setError(null)
    }, [open])

    // === Handlers ===

    // user mengetik kode (manual)
    const onChangeCodeTyping = (val: string) =>
        setForm(f => ({ ...f, code: allowFloorCodeTyping(val), codeTouched: true }))

    // saat blur field kode → pakai pola AA-00
    const onBlurCode = () =>
        setForm(f => ({ ...f, code: normalizeFloorCodePattern(f.code || '') }))

    // user mengetik nama → kalau belum pernah utak-atik kode, auto generate
    const onChangeName = (val: string) =>
        setForm(f => ({ ...f, name: val, code: f.codeTouched ? f.code : autoCodeFromName(val) }))

    const onChangeDescription = (val: string) =>
        setForm(f => ({ ...f, description: val }))

    const buildPayload = async (): Promise<ConfigFloors> => ({
        reference: (Session?.id) ? { id: Session?.id } : undefined,
        branches: (Session?.id) ? Session?.branches : [],
        code: form.code || undefined,
        name: (form.name || '').trim(),
        description: (form.description || '').trim() || undefined,
    })

    const handleSubmit = () => {
        if (!window?.api?.invoke) { setError('IPC bridge tidak tersedia'); return }
        setSubmitting(true); setError(null)
        buildPayload()
            .then((payload) => window.api.invoke('api.config.data.floors:create', payload))
            .then((res: any) => props.onCreated?.(res))
            .then(() => closeModal())
            .catch((err: any) => {
                const e = normalizeIpcError(err)
                console.error(e)
                setError(e?.msg || 'Gagal membuat Lantai')
            })
            .finally(() => setSubmitting(false))
    }

    return (
        <>
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
                        sx: { height: fullScreen ? '100vh' : 'auto', display: 'flex', bgcolor: 'background.paper', flexDirection: 'column' }
                    }
                }}
            >
                <DialogTitle sx={{ display: 'flex', alignItems: 'center', pr: 1.5, gap: 1 }}>
                    <Typography variant="h6" fontWeight={800}>Tambah Lantai</Typography>
                    <Stack direction="row" spacing={0.5} alignItems="center" sx={{ ml: 'auto' }}>
                        <IconButton size="small" onClick={() => setFullScreen(v => !v)} aria-label={fullScreen ? 'Keluar layar penuh' : 'Layar penuh'}>
                            {fullScreen ? <FullscreenExitRounded fontSize="small" /> : <FullscreenRounded fontSize="small" />}
                        </IconButton>
                        <IconButton size="small" onClick={toggleMode} aria-label={(mode === 'dark') ? 'Ganti ke tema terang' : 'Ganti ke tema gelap'}>
                            {(mode === 'dark') ? <DarkModeRounded fontSize="small" /> : <LightModeRounded fontSize="small" />}
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
                                    <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
                                        <Stack spacing={1.5} sx={{ flex: 1, minWidth: 0 }}>
                                            {/* Kode Lantai (auto / manual) */}
                                            <TextField
                                                label="Kode (auto / manual)"
                                                value={form.code}
                                                onChange={e => onChangeCodeTyping(e.target.value)}
                                                onBlur={onBlurCode}
                                                inputProps={{ maxLength: 5 }}
                                                helperText="Auto dari Nama Lantai (kalau belum diubah). Format: AA-00, contoh: LT-01"
                                                required
                                                fullWidth
                                            />

                                            {/* Nama Lantai */}
                                            <TextField
                                                label="Nama Lantai"
                                                value={form.name}
                                                onChange={e => onChangeName(e.target.value)}
                                                required
                                                fullWidth
                                            />

                                            {/* Deskripsi */}
                                            <TextField
                                                label="Deskripsi"
                                                value={form.description}
                                                onChange={e => onChangeDescription(e.target.value)}
                                                fullWidth
                                                multiline
                                                minRows={2}
                                            />
                                        </Stack>
                                    </Stack>

                                    <Divider />

                                    {!!error && (
                                        <Typography variant="body2" color="error.main">{error}</Typography>
                                    )}
                                </Stack>
                            </Box>
                        </PerfectScrollbar>
                    </Box>
                </DialogContent>

                <DialogActions sx={{ px: 2, py: 1.5 }}>
                    <Button onClick={closeModal}>Batal</Button>
                    <Button variant="contained" onClick={handleSubmit} disabled={submitting}>
                        {submitting ? 'Menyimpan…' : 'Simpan'}
                    </Button>
                </DialogActions>
            </Dialog>
        </>
    )
}
