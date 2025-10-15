'use client'

import * as React from 'react'
import {
    Dialog, DialogTitle, DialogContent, DialogActions,
    Box, Stack, TextField, Button, IconButton, Tooltip, Divider, Typography,
    Chip, Autocomplete
} from '@mui/material'
import AddRounded from '@mui/icons-material/AddRounded'
import UploadRounded from '@mui/icons-material/UploadRounded'
import ExpandMoreRounded from '@mui/icons-material/ExpandMoreRounded'
import AutoAwesomeRounded from '@mui/icons-material/AutoAwesomeRounded'
import PerfectScrollbar from 'react-perfect-scrollbar'
import 'react-perfect-scrollbar/dist/css/styles.css'
import { useSession } from '../../../../../../../contexts/SessionProviderContext'
import { Products } from '../../../../../../../types/product/products.type'
import { ProductsVariants } from '../../../../../../../types/product/products.variants.type'
import FullscreenExitRounded from '@mui/icons-material/FullscreenExitRounded'
import FullscreenRounded from '@mui/icons-material/FullscreenRounded'
import DarkModeRounded from '@mui/icons-material/DarkModeRounded'
import LightModeRounded from '@mui/icons-material/LightModeRounded'
import CloseRounded from '@mui/icons-material/CloseRounded'
import { useThemeCharger } from '../../../../../../../contexts/ThemeCharger'
import normalizeIpcError from '../../../../../../../helpers/electronMessageErrorEsctration'

export type NewModalProps = {
    onCreated?: (created?: any) => void
    product?: Products
    triggerLabel?: string
    triggerProps?: React.ComponentProps<typeof Button>
}

/* ========= Helpers ========= */

const toIDR = (v: string | number) =>
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 })
        .format(typeof v === 'string' ? Number(v || 0) : (v || 0))

const formatGrouped = (raw: string): string => {
    const digits = String(raw || '').replace(/\D/g, '')
    if (!digits) return ''
    const n = Number(digits)
    return new Intl.NumberFormat('id-ID', { maximumFractionDigits: 0 }).format(n)
}

/** ambil 3 huruf: prioritas huruf awal tiap kata → konsonan → huruf lain (tanpa for-loop) */
const abbr3 = (name: string): string => {
    const s = (name || '').trim().toUpperCase()
    if (!s) return ''
    const words = s.split(/\s+/).map(w => w.replace(/[^A-Z0-9]/g, ''))

    const initials = words.map(w => w[0]).filter(Boolean).join('')
    const joined = words.join('')
    const consonants = joined.replace(/[AEIOU]/g, '')

    const addUnique = (src: string, acc: string) =>
        src.split('').reduce((a, ch) => (a.length >= 3 || a.includes(ch)) ? a : a + ch, acc)

    const step1 = initials.slice(0, 3)
    const step2 = step1.length < 3 ? addUnique(consonants, step1) : step1
    const step3 = step2.length < 3 ? addUnique(joined, step2) : step2
    return step3.slice(0, 3)
}

/** generate XXX-XXX dari nama produk + varian */
const makeVariantCode = (productName: string, variantName: string): string => {
    const p = abbr3(productName)
    const v = abbr3(variantName)
    if (!p && !v) return ''
    return `${(p || '').padEnd(3, 'X').slice(0, 3)}-${(v || '').padEnd(3, 'X').slice(0, 3)}`
}

/** saat user mengetik kode: izinkan A-Z/0-9/- dan limit panjang max 7 (XXX-XXX) */
const allowCodeTyping = (value: string): string =>
    (value || '').toUpperCase().replace(/[^A-Z0-9-]/g, '').slice(0, 7)

/** saat blur: normalisasi ke pattern XXX-XXX (selama ada minimal 1 char) */
const normalizeCodePattern = (value: string): string => {
    const letters = (value || '').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6)
    if (!letters) return ''
    const a = letters.slice(0, 3).padEnd(3, 'X')
    const b = letters.slice(3, 6).padEnd(3, 'X')
    return `${a}-${b}`
}

/* ========= Component ========= */

type FormState = {
    productSelected?: Products
    code: string
    codeTouched: boolean   // user pernah ngedit manual?
    name: string           // Nama Variant
    description: string
    price: string          // simpan raw digits (display pakai formatGrouped)
}

export default function NewModal(props: NewModalProps) {
    const { onCreated, triggerLabel = 'Tambah Variant', triggerProps, product } = props
    const { Session } = useSession()
    const { mode, toggleMode } = useThemeCharger()

    const [open, setOpen] = React.useState(false)
    const [fullScreen, setFullScreen] = React.useState(false)
    const [productsList, setProductsList] = React.useState<Products[]>([])
    const [submitting, setSubmitting] = React.useState(false)
    const [error, setError] = React.useState<string | null>(null)

    // ==== Single source of truth untuk semua input field ====
    const [form, setForm] = React.useState<FormState>({
        productSelected: undefined,
        code: '',
        codeTouched: false,
        name: '',
        description: '',
        price: '',
    })

    const openModal = () => setOpen(true)
    const closeModal = () => setOpen(false)

    // init + fetch saat modal dibuka
    React.useEffect(() => {
        if (!open) return
        // preselect product dari props klo ada
        const initialProduct = product ? product : undefined
        setForm(f => ({
            ...f,
            productSelected: initialProduct,
            // kalau mau auto-suggest kode awal dari product (tanpa variant), boleh aktifkan line di bawah:
            code: f.codeTouched ? f.code : makeVariantCode(initialProduct?.name || '', f.name || ''),
        }))
        fetchProducts()
    }, [open]) // eslint-disable-line react-hooks/exhaustive-deps

    // bersihkan state saat modal ditutup
    React.useEffect(() => {
        if (open) return
        setForm({
            productSelected: undefined,
            code: '',
            codeTouched: false,
            name: '',
            description: '',
            price: '',
        })
        setSubmitting(false)
        setError(null)
    }, [open])

    const fetchProducts = React.useCallback(() => {
        if (!window?.api?.invoke) {
            console.error('Failed Get Window Api Bridge')
            setError('Bridge tidak tersedia')
            setProductsList([])
            return
        }
        window.api
            .invoke('api.product:read.all', {})
            .then((result: any) => {
                const data = (result?.data ?? []) as Products[]
                setProductsList(data)
                setError(null)
            })
            .catch((err: any) => {
                console.error(err)
                setProductsList([])
                setError(err?.msg ?? 'Gagal memuat daftar produk. Periksa koneksi.')
            })
    }, [])

    // ===== Handlers: semua via setForm =====

    // Product dipilih → update productSelected + regen code jika belum touched
    const onChangeProduct = (_: any, val: Products | null) => {
        setForm(f => {
            const next = { ...f, productSelected: val || undefined }
            if (!f.codeTouched) next.code = makeVariantCode(val?.name || '', f.name)
            return next
        })
    }

    // Nama Variant berubah → update name + regen code jika belum touched
    const onChangeVariantName = (val: string) => {
        setForm(f => ({
            ...f,
            name: val,
            code: f.codeTouched ? f.code : makeVariantCode(f.productSelected?.name || '', val),
        }))
    }

    // Kode diinput manual (typing) → sanitize + set codeTouched
    const onChangeCodeTyping = (val: string) => {
        const sanitized = allowCodeTyping(val)
        setForm(f => ({ ...f, code: sanitized, codeTouched: true }))
    }

    // Kode blur → normalisasi ke XXX-XXX (kalau ada)
    const onBlurCode = () => {
        setForm(f => ({ ...f, code: normalizeCodePattern(f.code) }))
    }

    // Harga: simpan raw digits (display formatted)
    const onChangePrice = (val: string) => {
        const digits = (val || '').replace(/\D/g, '')
        setForm(f => ({ ...f, price: digits }))
    }

    const onChangeDescription = (val: string) =>
        setForm(f => ({ ...f, description: val }))

    const buildPayload = async (): Promise<ProductsVariants> => ({
        reference: (Session?.id) ? { id: Session?.id } : undefined,
        branches: (Session?.id) ? Session?.branches : [],
        // NOTE: di skema kamu, nama variant ada di field 'name'
        name: form.name.trim(),
        description: form.description.trim() || undefined,
        product: form.productSelected,
        price: form.price,
        code: form.code || undefined, // ikutkan kalau mau disimpan di backend
    })

    const handleSubmit = () => {
        if (!window?.api?.invoke) { setError('IPC bridge tidak tersedia'); return }
        setSubmitting(true); setError(null)
        buildPayload()
            .then((payload) => window.api.invoke('api.product.variant:create', payload))
            .then((res: any) => props.onCreated?.(res))
            .then(() => closeModal())
            .catch((err: any) => {
                const e = normalizeIpcError(err)
                console.error(e)
                setError(e?.msg || 'Gagal membuat produk variant')
            })
            .finally(() => setSubmitting(false))
    }

    return (
        <>
            {/* Trigger button include */}
            <Button
                variant="contained"
                size={"small"}
                startIcon={<AddRounded />}
                onClick={openModal}
                sx={{ borderRadius: 2 }}
                {...triggerProps}
            >
                {props.triggerLabel || 'Tambah Variant'}
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
                    <Typography variant="h6" fontWeight={800}>
                        Tambah Product Variant
                    </Typography>
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
                    sx={{
                        p: 0,
                        flex: 1,
                        display: 'flex',
                        flexDirection: 'column',
                        minHeight: 0,
                        bgcolor: 'background.paper',
                        overflow: 'hidden',
                    }}
                >
                    <Box sx={{ flex: 1, minHeight: 0, minWidth: 0, height: '100%' }}>
                        <PerfectScrollbar
                            options={{ suppressScrollX: true, wheelPropagation: false }}
                            style={{ width: '100%', height: '100%' }}
                        >
                            <Box sx={{ p: 4 }}>
                                <Stack spacing={2}>
                                    {/* === Product + Fields === */}
                                    <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
                                        <Stack spacing={1.5} sx={{ flex: 1, minWidth: 0 }}>
                                            {/* Product Autocomplete (single-select) */}
                                            {productsList.length > 0 && (
                                                <Autocomplete
                                                    options={productsList}
                                                    getOptionLabel={(o) => (o?.name?.toUpperCase?.() ?? '')}
                                                    value={form.productSelected ?? null}
                                                    isOptionEqualToValue={(opt, val) => opt?.id === val?.id}
                                                    defaultValue={
                                                        productsList.find((p) => p?.id === product?.id) || null
                                                    }
                                                    onChange={onChangeProduct}
                                                    renderInput={(params) => (
                                                        <TextField
                                                            {...params}
                                                            label={`Product ${form.productSelected ? `(${form.productSelected.name} dipilih)` : ''}`}
                                                            placeholder={form.productSelected ? '' : 'Pilih satu Product'}
                                                            fullWidth
                                                        />
                                                    )}
                                                />
                                            )}

                                            {/* Kode Variant (manual friendly + auto) */}
                                            <TextField
                                                label="Kode (auto / manual)"
                                                value={form.code}
                                                onChange={e => onChangeCodeTyping(e.target.value)}
                                                onBlur={onBlurCode}
                                                inputProps={{ maxLength: 7 }}
                                                helperText="Auto-generate saat pilih product / isi nama, bisa ditimpa manual. Format: XXX-XXX"
                                                required
                                                fullWidth
                                            />

                                            {/* Nama Variant */}
                                            <TextField
                                                label="Nama Variant"
                                                value={form.name}
                                                onChange={e => onChangeVariantName(e.target.value)}
                                                required
                                                fullWidth
                                            />

                                            {/* Harga (display formatted, simpan raw) */}
                                            <TextField
                                                label="Harga"
                                                value={formatGrouped(form.price)}
                                                onChange={e => onChangePrice(e.target.value)}
                                                inputMode="numeric"
                                                placeholder="0"
                                                fullWidth
                                            />

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
