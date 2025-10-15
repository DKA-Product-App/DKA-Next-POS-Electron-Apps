'use client'

import * as React from 'react'
import {
    Dialog, DialogTitle, DialogContent, DialogActions,
    Box, Stack, TextField, Button, IconButton, Tooltip, Divider, Typography,
    Card, CardContent, Collapse, Chip, Autocomplete
} from '@mui/material'
import UploadRounded from '@mui/icons-material/UploadRounded'
import DeleteOutlineRounded from '@mui/icons-material/DeleteOutlineRounded'
import ExpandMoreRounded from '@mui/icons-material/ExpandMoreRounded'
import PerfectScrollbar from 'react-perfect-scrollbar'
import 'react-perfect-scrollbar/dist/css/styles.css'
import Image from 'next/image'

// ==== utils image via IPC (dari kamu)
import { ImgWithSkeleton } from '../../../../../../../utils/ImageProcessingIPC'
import { useSession } from "../../../../../../../contexts/SessionProviderContext";
import FullscreenExitRounded from "@mui/icons-material/FullscreenExitRounded";
import FullscreenRounded from "@mui/icons-material/FullscreenRounded";
import DarkModeRounded from "@mui/icons-material/DarkModeRounded";
import LightModeRounded from "@mui/icons-material/LightModeRounded";
import CloseRounded from "@mui/icons-material/CloseRounded";
import { useThemeCharger } from "../../../../../../../contexts/ThemeCharger";
import { ProductsCategories } from "../../../../../../../types/product/product.categories.type";
import {Products} from "../../../../../../../types/product/products.type"; // <-- ganti path sesuai lokasi file utils-mu

type ProductDetail = {
    id: string
    name: string
    description?: string
    image?: string | null              // ex: "/uploads/products/xxxx.jpg"
    category?: Array<{ id: string; name: string }>
}

/** base64 -> number[] buat payload Buffer-like (tanpa for-loop) */
const b64ToBytes = (b64: string): number[] => {
    const bin = typeof atob === 'function' ? atob(b64) : Buffer.from(b64, 'base64').toString('binary')
    return Array.from({ length: bin.length }, (_, i) => bin.charCodeAt(i))
}

/** file -> dataURL */
const readAsDataUrl = (file: File): Promise<string> =>
    new Promise((res, rej) => {
        const fr = new FileReader()
        fr.onload = () => res(String(fr.result))
        fr.onerror = () => rej(new Error('Gagal membaca file'))
        fr.readAsDataURL(file)
    })

/** ==== Komponen ==== */
export default function EditProductModal({
                                             productId,
                                             trigger,
                                             onUpdated,
                                         }: {
    productId: string
    trigger: React.ReactNode
    onUpdated?: () => void
}) {
    const [open, setOpen] = React.useState(false)
    const [loading, setLoading] = React.useState(false)
    const [submitting, setSubmitting] = React.useState(false)
    const [error, setError] = React.useState<string | null>(null)
    const { Session } = useSession();

    const [fullScreen, setFullScreen] = React.useState(false)
    const { mode, toggleMode } = useThemeCharger()

    // === State terpusat: payload-ready JSON ===
    const [form, setForm] = React.useState<{
        name: string
        description?: string
        category: ProductsCategories[]          // langsung simpan array object {id,name}
        // Image controls
        imagePath: string | null                // path dari server (untuk ImgWithSkeleton)
        imagePreview: string | null             // dataURL untuk preview lokal
        image?: { type: 'Buffer'; data: number[] } // buffer-like untuk payload
        imageName?: string
        imageMime?: string
        removeImage: boolean
    }>({
        name: '',
        description: '',
        category: [],
        imagePath: null,
        imagePreview: null,
        image: undefined,
        imageName: undefined,
        imageMime: undefined,
        removeImage: false,
    })

    // daftar kategori dari server (options untuk Autocomplete)
    const [categories, setCategories] = React.useState<ProductsCategories[]>([])

    const openModal = () => { setOpen(true); fetchDetail(); fetchCategories(); }
    const closeModal = () => setOpen(false)

    const fetchCategories = React.useCallback(() => {
        if (!window.api) return
        window.api.invoke< any, { data : ProductsCategories[] }>('api.product.category:read.all', {})
            .then(({ data }) => {
                setCategories(data)
            })
            .catch(() => setCategories([]))
    }, [])

    const fetchDetail = React.useCallback(() => {
        if (!window.api) return
        setLoading(true)
        window.api.invoke<{ id : string },{ data : Products }>('api.product:read.one', { id: productId })
            .then(({ data }) => {
                setForm(v => ({
                    ...v,
                    name: data?.name || '',
                    description: data?.description || '',
                    category: data?.category,
                    imagePath: data?.image || null,
                    imagePreview: null,
                    image: undefined,
                    imageName: undefined,
                    imageMime: undefined,
                    removeImage: false,
                }))
                setError(null)
            })
            .catch((err: any) => setError(err?.msg || 'Gagal memuat detail produk'))
            .finally(() => setLoading(false))
    }, [productId])

    const clearImage = () => {
        setForm(v => ({
            ...v,
            image: undefined,
            imageName: undefined,
            imageMime: undefined,
            imagePreview: null,
            imagePath: null,
            removeImage: true,
        }))
    }

    const onPickFile = (e: React.ChangeEvent<HTMLInputElement>) => {
        const f = e.target.files?.[0]
        if (!f) return
        readAsDataUrl(f)
            .then(url => {
                const [meta, b64] = String(url).split(',')
                const mimetype = meta?.match(/data:(.*?);base64/)?.[1] || 'image/jpeg'
                setForm(v => ({
                    ...v,
                    imagePreview: url,
                    imagePath: null,
                    removeImage: false,
                    image: { type: 'Buffer', data: b64ToBytes(b64 || '') },
                    imageName: f.name,
                    imageMime: mimetype,
                }))
            })
            .catch(() => {
                setForm(v => ({ ...v, imagePreview: null }))
            })
    }

    const buildPayload = () => {
        // komposisi payload langsung dari state "form" (plus reference)
        const payload: any = {
            reference: (Session?.id) ? { id: Session.id } : undefined,
            name: String(form.name || '').trim(),
            description: String(form.description || '').trim() || undefined,
            category: form.category.map(c => ({ id: c.id, name: c.name })),
        }
        if (form.removeImage) payload.image = null
        if (form.image) {
            payload.image = form.image
        }
        /*if (form.removeImage) payload.image = null
        else if (form.image && form.imageName) {
            payload.image = form.image
            payload.imageName = form.imageName
            payload.imageMime = form.imageMime || 'image/jpeg'
        }*/
        return payload
    }

    const handleSubmit = () => {
        if (!window?.api?.invoke) { setError('IPC bridge tidak tersedia'); return }
        setSubmitting(true); setError(null)
        Promise.resolve(buildPayload())
            .then((payload) => {
                console.log(payload)
                return window.api.invoke('api.product:update.one', { params: { id: productId }, data: payload })
            })
            .then(() => { onUpdated?.(); closeModal(); })
            .catch((err: any) => {
                console.log(err)
                setError(err?.msg || err?.message || 'Gagal memperbarui produk')
            })
            .finally(() => setSubmitting(false))
    }

    return (
        <>
            <span onClick={openModal} style={{ display: 'inline-flex' }}>{trigger}</span>

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
                            minWidth: 0,
                        }
                    }
                }}
            >
                <DialogTitle sx={{ display: 'flex', alignItems: 'center', pr: 1.5, gap: 1 }}>
                    <Typography variant="h6" fontWeight={800}>
                        Edit Product {form.name || "ini"}
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

                <DialogContent dividers sx={{ p: 0, overflow: 'hidden', bgcolor: 'background.paper' }}>
                    <PerfectScrollbar options={{ suppressScrollX: true, wheelPropagation: false }} style={{ width: '100%' }}>
                        <Box sx={{ p: 4 }}>
                            {loading ? (
                                <Typography variant="body2" color="tex  t.secondary">Memuat…</Typography>
                            ) : (
                                <Stack spacing={2}>
                                    {/* Gambar + info dasar */}
                                    <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
                                        <Stack alignItems="center" spacing={1.5} sx={{ width: { md: 300 } }}>
                                            <Box sx={{ position: 'relative', width: '100%', maxWidth: 260 }}>
                                                {form.imagePreview ? (
                                                    <Box sx={{ position: 'relative', width: '100%', aspectRatio: '4/3', bgcolor: 'action.hover', borderRadius: 2, overflow: 'hidden' }}>
                                                        <Image
                                                            alt="Preview Gambar"
                                                            src={form.imagePreview}
                                                            fill
                                                            sizes="260px"
                                                            unoptimized
                                                            style={{ objectFit: 'cover' }}
                                                        />
                                                    </Box>
                                                ) : (
                                                    <ImgWithSkeleton
                                                        path={form.imagePath || undefined}
                                                        alt={form.name || 'Gambar Produk'}
                                                        priority
                                                    />
                                                )}
                                            </Box>

                                            {/* Controls gambar */}
                                            <Stack direction="row" spacing={1}>
                                                <Tooltip title="Ganti gambar">
                                                    <IconButton color="primary" size="small" component="label" sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
                                                        <UploadRounded fontSize="small" />
                                                        <input hidden accept="image/*" type="file" onChange={onPickFile} />
                                                    </IconButton>
                                                </Tooltip>
                                                {(form.imagePath || form.imagePreview) && (
                                                    <Tooltip title="Hapus gambar">
                                                        <IconButton color="error" size="small" onClick={clearImage} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
                                                            <DeleteOutlineRounded fontSize="small" />
                                                        </IconButton>
                                                    </Tooltip>
                                                )}
                                            </Stack>
                                            {form.removeImage && <Typography variant="caption" color="warning.main">Gambar akan dihapus</Typography>}
                                        </Stack>

                                        <Stack spacing={1.5} sx={{ flex: 1, minWidth: 0 }}>
                                            <TextField
                                                label="Nama Produk"
                                                value={form.name}
                                                onChange={e => setForm(v => ({ ...v, name: e.target.value }))}
                                                fullWidth
                                            />
                                            <TextField
                                                label="Deskripsi"
                                                value={form.description}
                                                onChange={e => setForm(v => ({ ...v, description: e.target.value }))}
                                                fullWidth
                                                multiline
                                                minRows={2}
                                            />

                                            {/* === Kategori: Autocomplete Multiple (tanpa checkbox) === */}
                                            <Autocomplete
                                                multiple
                                                options={categories}
                                                disableCloseOnSelect
                                                getOptionLabel={(o) => o?.name?.toUpperCase?.() ?? ''}
                                                value={form.category}
                                                onChange={(_, val) => setForm(v => ({ ...v, category: val ?? [] }))}
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
                                                        label={`Kategori ${form.category.length ? `(${form.category.length} dipilih)` : ''}`}
                                                        placeholder={form.category.length ? '' : 'Pilih satu atau lebih kategori'}
                                                        fullWidth
                                                    />
                                                )}
                                            />
                                        </Stack>
                                    </Stack>

                                    <Divider />

                                    {!!error && <Typography variant="body2" color="error.main">{error}</Typography>}
                                </Stack>
                            )}
                        </Box>
                    </PerfectScrollbar>
                </DialogContent>

                <DialogActions>
                    <Button onClick={closeModal}>Batal</Button>
                    <Button variant="contained" onClick={handleSubmit} disabled={submitting || loading}>
                        {submitting ? 'Menyimpan…' : 'Simpan'}
                    </Button>
                </DialogActions>
            </Dialog>
        </>
    )
}
