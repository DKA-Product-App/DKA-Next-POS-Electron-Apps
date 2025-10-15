'use client'

import * as React from 'react'
import {
    Dialog, DialogTitle, DialogContent, DialogActions,
    Box, Stack, TextField, Button, IconButton, Tooltip, Divider, Avatar, Typography,
    Card, CardContent, Collapse, Chip, Autocomplete
} from '@mui/material'
import AddRounded from '@mui/icons-material/AddRounded'
import DeleteOutlineRounded from '@mui/icons-material/DeleteOutlineRounded'
import UploadRounded from '@mui/icons-material/UploadRounded'
import ExpandMoreRounded from '@mui/icons-material/ExpandMoreRounded'
import AutoAwesomeRounded from '@mui/icons-material/AutoAwesomeRounded'
import PerfectScrollbar from 'react-perfect-scrollbar'
import 'react-perfect-scrollbar/dist/css/styles.css'
import {useSession} from "../../../../../../../contexts/SessionProviderContext";
import {ProductsCategories} from "../../../../../../../types/product/product.categories.type";
import {ProductsVariants} from "../../../../../../../types/product/products.variants.type";
import FullscreenExitRounded from "@mui/icons-material/FullscreenExitRounded";
import FullscreenRounded from "@mui/icons-material/FullscreenRounded";
import DarkModeRounded from "@mui/icons-material/DarkModeRounded";
import LightModeRounded from "@mui/icons-material/LightModeRounded";
import CloseRounded from "@mui/icons-material/CloseRounded";
import {useThemeCharger} from "../../../../../../../contexts/ThemeCharger";

type VariantDraft = ProductsVariants & {
    codeTouched?: boolean     // user edited code manually
    expanded?: boolean
}

export type NewProductModalProps = {
    onCreated?: (created?: any) => void
    triggerLabel?: string
    triggerProps?: React.ComponentProps<typeof Button>
}

const toIDR = (v: string | number) =>
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 })
        .format(typeof v === 'string' ? Number(v || 0) : (v || 0))

/** format angka ribuan tanpa simbol mata uang, untuk tampilan input */
const formatGrouped = (raw: string): string => {
    const digits = String(raw || '').replace(/[^\d]/g, '')
    if (!digits) return ''
    const n = Number(digits)
    return new Intl.NumberFormat('id-ID', { maximumFractionDigits: 0 }).format(n)
}

const readAsDataUrl = (file: File): Promise<string> =>
    new Promise((res, rej) => {
        const fr = new FileReader()
        fr.onload = () => res(String(fr.result))
        fr.onerror = () => rej(new Error('Gagal membaca file'))
        fr.readAsDataURL(file)
    })

const uuid = () => `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`

/* =========================
 * KODE: XXX-XXX (PROD-VAR)
 * ========================= */

/** ambil 3 huruf singkatan dari nama (prioritas: huruf awal tiap kata → konsonan → huruf lain) */
const abbr3 = (name: string): string => {
    const s = name.trim().toUpperCase()
    if (!s) return ''
    const words = s.split(/\s+/).map(w => w.replace(/[^A-Z0-9]/g, ''))
    const initials = words.map(w => w[0]).filter(Boolean)
    let letters = initials.join('')

    if (letters.length < 3) {
        const joined = words.join('')
        const cons = joined.replace(/[AEIOU]/g, '')
        for (const ch of cons) {
            if (letters.length >= 3) break
            if (!letters.includes(ch)) letters += ch
        }
        if (letters.length < 3) {
            for (const ch of joined) {
                if (letters.length >= 3) break
                if (!letters.includes(ch)) letters += ch
            }
        }
    }

    return letters.slice(0, 3)
}

/** generate XXX-XXX dari nama produk + varian */
const makeVariantCode = (productName: string, variantName: string): string => {
    const p = abbr3(productName)
    const v = abbr3(variantName)
    if (!p && !v) return ''
    return `${p.padEnd(3, 'X').slice(0,3)}-${v.padEnd(3,'X').slice(0,3)}`
}

/** saat user mengetik kode: izinkan A-Z/0-9/- dan limit panjang max 7 (XXX-XXX) */
const allowCodeTyping = (value: string): string =>
    value.toUpperCase().replace(/[^A-Z0-9-]/g, '').slice(0, 7)

/** saat blur: normalisasi ke pattern XXX-XXX (selama ada minimal 1 char) */
const normalizeCodePattern = (value: string): string => {
    const letters = value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6)
    if (!letters) return ''
    const a = letters.slice(0, 3).padEnd(3, 'X')
    const b = letters.slice(3, 6).padEnd(3, 'X')
    return `${a}-${b}`
}

const b64ToBytes = (b64: string): number[] => {
    const bin = typeof atob === 'function' ? atob(b64) : Buffer.from(b64, 'base64').toString('binary')
    const arr = new Array(bin.length)
    for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i)
    return arr
}

export default function NewProductModal(props: NewProductModalProps) {
    const { onCreated, triggerLabel = 'Tambah Produk', triggerProps } = props
    const { Session } = useSession();

    const [fullScreen, setFullScreen] = React.useState(false)
    const { mode, toggleMode} = useThemeCharger()

    const [open, setOpen] = React.useState(false)
    const [name, setName] = React.useState('') // Nama Produk
    const [categoriesList, setCategoryList] = React.useState<ProductsCategories[]>([])
    const [description, setDescription] = React.useState('')
    const [categoryIds, setCategoryIds] = React.useState<string[]>([]) // multi-select
    const [variants, setVariants] = React.useState<VariantDraft[]>([{
        id: uuid(), code: '', name: '', price: '', description: '', codeTouched: false, expanded: false
    }])
    const [imageFile, setImageFile] = React.useState<File | null>(null)
    const [imagePreview, setImagePreview] = React.useState<string | null>(null)
    const [submitting, setSubmitting] = React.useState(false)
    const [error, setError] = React.useState<string | null>(null)

    const openModal = () => setOpen(true)
    const closeModal = () => setOpen(false)

    React.useEffect(() => {
        if (!open) {
            setName(''); setDescription(''); setCategoryIds([])
            setVariants([{
                id: uuid(), code: '', name: '', price: '', description: '', codeTouched: false, expanded: false
            }])
            clearImage()
            setSubmitting(false); setError(null)
            fetchCategories()
        }
    }, [open])

    const fetchCategories = React.useCallback(() => {
        if (!window.api) {
            console.error('Failed Get Window Api Bridge')
            setError('Bridge tidak tersedia')
            return
        }
        window.api
            .invoke('api.product.category:read.all', {})
            .then((result: any) => {
                const data = (result?.data ?? []) as ProductsCategories[]
                setCategoryList(data)
                setError(null)
            })
            .catch((err: any) => {
                console.error(err)
                setCategoryList([])
                setError(err?.msg ?? 'Gagal memuat kategori. Periksa Koneksi Jaringan / Server')
            })
    }, [])

    const clearImage = () => { setImageFile(null); setImagePreview(null) }

    const onPickFile = (e: React.ChangeEvent<HTMLInputElement>) => {
        const f = e.target.files?.[0]
        if (!f) return
        setImageFile(f)
        readAsDataUrl(f).then(setImagePreview).catch(() => setImagePreview(null))
    }

    const addVariant = () =>
        setVariants(vs => [...vs, {
            id: uuid(), code: makeVariantCode(name, ''), name: '', price: '', description: '', codeTouched: false, expanded: false
        }])

    const removeVariant = (id: string) =>
        setVariants(vs => vs.filter(v => v.id !== id))

    const patchVariant = (id: string, patch: Partial<VariantDraft>) =>
        setVariants(vs => vs.map(v => v.id === id ? { ...v, ...patch } : v))

    const toggleExpand = (id: string) =>
        setVariants(vs => vs.map(v => v.id === id ? ({ ...v, expanded: !v.expanded }) : v))

    const canSubmit =
        name.trim().length > 0 &&
        variants.some(v => v.code.trim().length >= 3 && v.name.trim() && Number(v.price) > 0)

    const buildPayload = async () => {
        const payload: any = {
            reference: (Session?.id) ? { id: Session?.id } : undefined,
            branches: (Session?.id) ? Session?.branches : [],
            name: name.trim(),
            description: description.trim() || undefined,
            category: (categoryIds || []).map(id => ({ id })), // kirim banyak kategori
            variants: variants
                .filter(v => v.code.trim() && v.name.trim())
                .map(v => ({
                    reference: (Session?.id) ? { id: Session?.id } : undefined,
                    branches: (Session?.id) ? Session?.branches : [],
                    code: normalizeCodePattern(v.code.trim()), // pastikan final XXX-XXX
                    name: v.name.trim(),                        // sudah uppercase
                    price: Number((v.price || '').replace(/\\D/g, '')),
                    description: v.description?.trim() || undefined,
                })),
        }

        if (imageFile) {
            // data URL → { type:'Buffer', data:[...] } + name + mime
            const dataUrl = await readAsDataUrl(imageFile)
            const [meta, b64] = dataUrl.split(',')
            const mimetype = meta?.match(/data:(.*?);base64/)?.[1] || 'image/jpeg'
            payload.image = { type: 'Buffer', data: b64ToBytes(b64) }
            payload.imageName = imageFile.name
            payload.imageMime = mimetype
        } else {
            // explicit null biar backend set kosong
            payload.image = null
        }

        return payload
    }


    const handleSubmit = () => {
        if (!window?.api?.invoke) { setError('IPC bridge tidak tersedia'); return }
        if (!canSubmit) { setError('Lengkapi minimal Nama & satu Varian dengan harga > 0'); return }

        setSubmitting(true); setError(null)
        buildPayload()
            .then((payload) => window.api.invoke('api.product:create', payload))
            .then((res: any) => onCreated?.(res))
            .then(() => closeModal())
            .catch((err: any) => setError(err?.msg || err?.message || 'Gagal membuat produk'))
            .finally(() => setSubmitting(false))
    }

    // Saat Nama Produk berubah: update name + re-generate code utk varian yg belum disentuh
    const handleProductNameChange = (val: string) => {
        setName(val)
        setVariants(vs => vs.map(v =>
            v.codeTouched ? v : { ...v, code: makeVariantCode(val, v.name) }
        ))
    }

    return (
        <>
        {/* Trigger button include */}
            <Button
                variant="contained"
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
                            height: fullScreen ? '100vh' : '85vh',
                            display: 'flex',
                            bgcolor: 'background.paper', // <-- ini yang bener buat warna Card
                            flexDirection: 'column',
                            minWidth: 0,
                        }
                    }
                }}
            >
                <DialogTitle sx={{ display: 'flex', alignItems: 'center', pr: 1.5, gap: 1 }}>
                    <Typography variant="h6" fontWeight={800}>
                        Tambah Product
                    </Typography>
                    <Stack direction="row" spacing={0.5} alignItems="center" sx={{ ml: 'auto' }}>
                        <IconButton size="small" onClick={() => setFullScreen(v => !v)} aria-label={fullScreen ? 'Keluar layar penuh' : 'Layar penuh'}>
                            {fullScreen ? <FullscreenExitRounded fontSize="small" /> : <FullscreenRounded fontSize="small" />}
                        </IconButton>
                        <IconButton size="small" onClick={toggleMode} aria-label={(mode === "dark") ? 'Ganti ke tema terang' : 'Ganti ke tema gelap'}>
                            {(mode === "dark") ? <DarkModeRounded fontSize="small" /> : <LightModeRounded fontSize="small" />}
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
                        bgcolor: 'background.paper', // <-- ini yang bener buat warna Card
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
                                    {/* Gambar + Info dasar */}
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
                                                <Button
                                                    variant="outlined"
                                                    size="small"
                                                    component="label"
                                                    startIcon={<UploadRounded />}
                                                    sx={{ borderRadius: 2 }}
                                                >
                                                    Pilih Gambar
                                                    <input hidden accept="image/*" type="file" onChange={onPickFile} />
                                                </Button>
                                            )}
                                        </Stack>

                                        <Stack spacing={1.5} sx={{ flex: 1, minWidth: 0 }}>
                                            {/* ==== Kategori Autocomplete Multi ==== */}
                                            {categoriesList.length > 0 && (
                                                <Autocomplete
                                                    multiple
                                                    options={categoriesList}
                                                    disableCloseOnSelect
                                                    getOptionLabel={(o) => (o?.name?.toUpperCase?.() ?? '')}
                                                    value={categoriesList.filter(c => categoryIds.includes(c.id))}
                                                    onChange={(_, val) => setCategoryIds(val.map(v => v.id))}
                                                    renderTags={(value, getTagProps) =>
                                                        value.map((option, index) => (
                                                            <Chip
                                                                {...getTagProps({ index })}
                                                                key={option.id}
                                                                size="small"
                                                                label={option?.name?.toUpperCase?.() ?? ''}
                                                            />
                                                        ))
                                                    }
                                                    renderInput={(params) => (
                                                        <TextField
                                                            {...params}
                                                            label={`Kategori ${categoryIds.length ? `(${categoryIds.length} dipilih)` : ''}`}
                                                            placeholder={categoryIds.length ? '' : 'Pilih satu atau lebih kategori'}
                                                            fullWidth
                                                        />
                                                    )}
                                                />
                                            )}

                                            <TextField
                                                label="Nama Produk"
                                                value={name}
                                                onChange={e => handleProductNameChange(e.target.value)}
                                                required
                                                fullWidth
                                            />
                                            <TextField
                                                label="Deskripsi"
                                                value={description}
                                                onChange={e => setDescription(e.target.value)}
                                                fullWidth
                                                multiline
                                                minRows={2}
                                            />
                                        </Stack>
                                    </Stack>

                                    <Divider />

                                    {/* Varian */}
                                    <Stack direction="row" alignItems="center" justifyContent="space-between">
                                        <Typography variant="subtitle2">Varian</Typography>
                                        <Button
                                            size="small"
                                            variant="outlined"
                                            startIcon={<AddRounded />}
                                            onClick={addVariant}
                                            sx={{ borderRadius: 2 }}
                                        >
                                            Tambah Varian
                                        </Button>
                                    </Stack>

                                    {/* Card list expandable */}
                                    <Stack spacing={1}>
                                        {variants.map(v => (
                                            <Card key={v.id} variant="outlined" sx={{ borderRadius: 2 }}>
                                                <CardContent sx={{ pt: 2, pb: 1.5 }}>
                                                    <Stack direction={{ xs: 'column', md: 'row' }} spacing={1} alignItems={{ xs: 'stretch', md: 'center' }}>
                                                        {/* CODE (editable) */}
                                                        <Stack direction="row" alignItems="center" spacing={0.5} sx={{ minWidth: 190 }}>
                                                            <TextField
                                                                label="Kode (auto/edit)"
                                                                value={v.code}
                                                                onChange={e => patchVariant(v.id, { code: allowCodeTyping(e.target.value), codeTouched: true })}
                                                                onBlur={e => patchVariant(v.id, { code: normalizeCodePattern(e.target.value) })}
                                                                size="small"
                                                                sx={{ minWidth: 160, flex: 1 }}
                                                                placeholder="PRD-VAR"
                                                            />
                                                            <Tooltip title="Generate dari nama">
                                                                <IconButton
                                                                    size="small"
                                                                    onClick={() => patchVariant(v.id, {
                                                                        code: makeVariantCode(name, v.name),
                                                                        codeTouched: true
                                                                    })}
                                                                >
                                                                    <AutoAwesomeRounded fontSize="small" />
                                                                </IconButton>
                                                            </Tooltip>
                                                        </Stack>

                                                        {/* NAME (always uppercase + auto-code saat belum touched) */}
                                                        <TextField
                                                            label="Nama Varian"
                                                            value={v.name}
                                                            onChange={e => {
                                                                const newName = e.target.value.toUpperCase()
                                                                patchVariant(v.id, {
                                                                    name: newName,
                                                                    ...(v.codeTouched ? {} : { code: makeVariantCode(name, newName) })
                                                                })
                                                            }}
                                                            size="small"
                                                            sx={{ flex: 1, minWidth: 0 }}
                                                            inputProps={{ style: { textTransform: 'uppercase' } }}
                                                            placeholder="M/L/REGULAR/ICE, dst."
                                                        />

                                                        {/* PRICE — format ribuan */}
                                                        <TextField
                                                            label="Harga"
                                                            value={formatGrouped(v.price as any)}
                                                            onChange={e => {
                                                                const raw = e.target.value.replace(/[^\d]/g, '')
                                                                patchVariant(v.id, { price: raw as any })
                                                            }}
                                                            size="small"
                                                            sx={{ width: 220 }}
                                                            inputMode="numeric"
                                                            placeholder="0"
                                                        />

                                                        {/* ACTIONS */}
                                                        <Stack direction="row" alignItems="center" spacing={0.5}>
                                                            <Tooltip title={v.expanded ? 'Sembunyikan detail' : 'Tampilkan detail'}>
                                                                <IconButton onClick={() => toggleExpand(v.id)} size="small">
                                                                    <ExpandMoreRounded
                                                                        sx={{
                                                                            transition: 'transform .2s',
                                                                            transform: v.expanded ? 'rotate(180deg)' : 'rotate(0deg)'
                                                                        }}
                                                                    />
                                                                </IconButton>
                                                            </Tooltip>
                                                            <Tooltip title="Hapus varian">
                                                                <IconButton onClick={() => removeVariant(v.id)} size="small">
                                                                    <DeleteOutlineRounded />
                                                                </IconButton>
                                                            </Tooltip>
                                                        </Stack>
                                                    </Stack>
                                                </CardContent>

                                                {/* Expand di bawah header */}
                                                <Collapse in={!!v.expanded} timeout="auto" unmountOnExit>
                                                    <Divider />
                                                    <CardContent sx={{ pt: 1.5 }}>
                                                        <TextField
                                                            label="Deskripsi (opsional)"
                                                            value={v.description || ''}
                                                            onChange={e => patchVariant(v.id, { description: e.target.value })}
                                                            fullWidth
                                                            multiline
                                                            minRows={2}
                                                        />
                                                        <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                                                            Pratinjau harga: {toIDR(v.price || 0)}
                                                        </Typography>
                                                    </CardContent>
                                                </Collapse>
                                            </Card>
                                        ))}
                                    </Stack>

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
                    <Button variant="contained" onClick={handleSubmit} disabled={submitting || !canSubmit}>
                        {submitting ? 'Menyimpan…' : 'Simpan'}
                    </Button>
                </DialogActions>
            </Dialog>
        </>
    )
}