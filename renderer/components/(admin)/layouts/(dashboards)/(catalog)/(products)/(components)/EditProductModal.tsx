'use client'

import * as React from 'react'
import {
    Dialog, DialogTitle, DialogContent, DialogActions,
    Box, Stack, TextField, Button, IconButton, Tooltip, Divider, MenuItem, Typography,
    Card, CardContent
} from '@mui/material'
import UploadRounded from '@mui/icons-material/UploadRounded'
import DeleteOutlineRounded from '@mui/icons-material/DeleteOutlineRounded'
import PerfectScrollbar from 'react-perfect-scrollbar'
import 'react-perfect-scrollbar/dist/css/styles.css'
import Image from 'next/image'

// ==== utils image via IPC (dari kamu)
import { ImgWithSkeleton } from '../../../../../../../utils/ImageProcessingIPC'
import {useSession} from "../../../../../../../contexts/SessionProviderContext"; // <-- ganti path sesuai lokasi file utils-mu

type VariantDraft = { id: string; code: string; name: string; price: string; description?: string }
type CategoryOption = { id: string; name: string }
type ProductDetail = {
    id: string
    name: string
    description?: string
    image?: string | null              // ex: "/uploads/products/xxxx.jpg"
    category?: Array<{ id: string; name: string }>
    variants?: Array<{ id: string; code: string; name: string; price: number; description?: string }>
}

/** helper UI: format ribuan */
const formatGrouped = (raw: string): string => {
    const digits = String(raw || '').replace(/[^\d]/g, '')
    if (!digits) return ''
    return new Intl.NumberFormat('id-ID', { maximumFractionDigits: 0 }).format(Number(digits))
}
const toIDR = (v: string | number) =>
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 })
        .format(typeof v === 'string' ? Number(v || 0) : (v || 0))

/** base64 -> number[] buat payload Buffer-like */
const b64ToBytes = (b64: string): number[] => {
    const bin = typeof atob === 'function' ? atob(b64) : Buffer.from(b64, 'base64').toString('binary')
    const arr = new Array(bin.length)
    for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i)
    return arr
}

/** normalisasi kode varian ke XXX-XXX */
const normalizeCodePattern = (value: string): string => {
    const letters = value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6)
    if (!letters) return ''
    const a = letters.slice(0, 3).padEnd(3, 'X')
    const b = letters.slice(3, 6).padEnd(3, 'X')
    return `${a}-${b}`
}

/** file -> dataURL */
const readAsDataUrl = (file: File): Promise<string> =>
    new Promise((res, rej) => {
        const fr = new FileReader()
        fr.onload = () => res(String(fr.result))
        fr.onerror = () => rej(new Error('Gagal membaca file'))
        fr.readAsDataURL(file)
    })

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
    // fields
    const [name, setName] = React.useState('')
    const [description, setDescription] = React.useState('')
    const [categoryId, setCategoryId] = React.useState<string>('')
    const [categories, setCategories] = React.useState<CategoryOption[]>([])
    const [variants, setVariants] = React.useState<VariantDraft[]>([])

    // image (server path & preview)
    const [serverImagePath, setServerImagePath] = React.useState<string | null>(null) // path dari server
    const [imageFile, setImageFile] = React.useState<File | null>(null)               // file baru (replace)
    const [imagePreview, setImagePreview] = React.useState<string | null>(null)       // dataURL lokal untuk preview
    const [removeImage, setRemoveImage] = React.useState(false)                       // hapus gambar

    const openModal = () => { setOpen(true); fetchDetail(); fetchCategories(); }
    const closeModal = () => setOpen(false)

    const patchVariant = (id: string, patch: Partial<VariantDraft>) =>
        setVariants(vs => vs.map(v => v.id === id ? { ...v, ...patch } : v))

    const fetchCategories = React.useCallback(() => {
        if (!window.api) return
        window.api.invoke('api.product.category:read.all', {})
            .then((res: any) => {
                const data = (res?.data ?? []) as any[]
                setCategories(data.map(d => ({ id: d.id, name: d.name })))
            })
            .catch(() => setCategories([]))
    }, [])

    const fetchDetail = React.useCallback(() => {
        if (!window.api) return
        setLoading(true)
        window.api.invoke('api.product:read.one', { id: productId })
            .then((res: any) => {
                const p = (res?.data ?? {}) as ProductDetail
                setName(p.name || '')
                setDescription(p.description || '')
                setCategoryId(p.category?.[0]?.id || '')
                setVariants((p.variants || []).map(v => ({
                    id: v.id,
                    code: v.code || '',
                    name: (v.name || '').toUpperCase(),
                    price: String(v.price || 0),
                    description: v.description || ''
                })))
                setServerImagePath(p.image || null) // path dipakai ImgWithSkeleton
                setImageFile(null)
                setImagePreview(null)
                setRemoveImage(false)
                setError(null)
            })
            .catch((err: any) => setError(err?.msg || 'Gagal memuat detail produk'))
            .finally(() => setLoading(false))
    }, [productId])

    const clearImage = () => {
        setImageFile(null)
        setImagePreview(null)
        setRemoveImage(true)       // tandai untuk hapus di server
        // tetap biarin serverImagePath apa adanya; di UI kita tunjukkan placeholder
        setServerImagePath(null)
    }

    const onPickFile = (e: React.ChangeEvent<HTMLInputElement>) => {
        const f = e.target.files?.[0]
        if (!f) return
        setRemoveImage(false)      // batal hapus, kita replace
        setImageFile(f)
        readAsDataUrl(f)
            .then(url => { setImagePreview(url); setServerImagePath(null) }) // tampilkan preview lokal
            .catch(() => { setImagePreview(null) })
    }

    const buildPayload = async () => {
        const data: any = {
            reference: (Session?.id) ? { id: Session?.id } : undefined,
            name: name.trim(),
            description: description.trim() || undefined,
            category: categoryId ? [{ id : categoryId }] : [],
            variants: variants.map(v => ({
                id: v.id,
                reference: (Session?.id) ? { id: Session?.id } : undefined,
                code: normalizeCodePattern(v.code.trim()),
                name: v.name.trim(),
                price: Number((v.price || '').replace(/\D/g, '')),
                description: v.description?.trim() || undefined,
            })),
        }

        if (removeImage) {
            data.image = null
        } else if (imageFile) {
            const dataUrl = await readAsDataUrl(imageFile)
            const [meta, b64] = dataUrl.split(',')
            const mimetype = meta?.match(/data:(.*?);base64/)?.[1] || 'image/jpeg'
            data.image = { type: 'Buffer', data: b64ToBytes(b64) }
            data.imageName = imageFile.name
            data.imageMime = mimetype
        }
        // kalau tidak remove & tidak pilih file baru → jangan kirim field image (biar server keep)

        return data
    }

    const handleSubmit = () => {
        if (!window?.api?.invoke) { setError('IPC bridge tidak tersedia'); return }
        setSubmitting(true); setError(null)
        buildPayload()
            .then((payload) => {
                console.log({ params: { id: productId }, data: payload })
                return  window.api.invoke('api.product:update.one', { params: { id: productId }, data: payload })
            })
            .then(() => { onUpdated?.(); closeModal(); })
            .catch((err: any) => setError(err?.msg || err?.message || 'Gagal memperbarui produk'))
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
                PaperProps={{ sx: { height: '85vh', display: 'flex', flexDirection: 'column' } }}
            >
                <DialogTitle>Edit Produk</DialogTitle>

                <DialogContent dividers sx={{ p: 0, flex: 1, display: 'flex', overflow: 'hidden' }}>
                    <PerfectScrollbar options={{ suppressScrollX: true, wheelPropagation: false }} style={{ width: '100%', height: '100%' }}>
                        <Box sx={{ p: 4 }}>
                            {loading ? (
                                <Typography variant="body2" color="text.secondary">Memuat…</Typography>
                            ) : (
                                <Stack spacing={2}>
                                    {/* Gambar + info dasar */}
                                    <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
                                        <Stack alignItems="center" spacing={1.5} sx={{ width: { md: 300 } }}>
                                            {/* === AREA GAMBAR ===
                           - Jika user pilih file baru → pakai preview (dataURL) dengan <Image/>
                           - Jika tidak ada file baru → render ImgWithSkeleton (ambil base64 dari IPC 'api.product:read.image')
                      */}
                                            <Box sx={{ position: 'relative', width: '100%', maxWidth: 260 }}>
                                                {imagePreview ? (
                                                    <Box sx={{ position: 'relative', width: '100%', aspectRatio: '4/3', bgcolor: 'action.hover', borderRadius: 2, overflow: 'hidden' }}>
                                                        <Image
                                                            alt="Preview Gambar"
                                                            src={imagePreview}
                                                            fill
                                                            sizes="260px"
                                                            unoptimized
                                                            style={{ objectFit: 'cover' }}
                                                        />
                                                    </Box>
                                                ) : (
                                                    <ImgWithSkeleton
                                                        path={serverImagePath || undefined}
                                                        alt={name || 'Gambar Produk'}
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
                                                {(serverImagePath || imagePreview) && (
                                                    <Tooltip title="Hapus gambar">
                                                        <IconButton color="error" size="small" onClick={clearImage} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
                                                            <DeleteOutlineRounded fontSize="small" />
                                                        </IconButton>
                                                    </Tooltip>
                                                )}
                                            </Stack>
                                            {removeImage && <Typography variant="caption" color="warning.main">Gambar akan dihapus</Typography>}
                                        </Stack>

                                        <Stack spacing={1.5} sx={{ flex: 1, minWidth: 0 }}>
                                            <TextField label="Nama Produk" value={name} onChange={e => setName(e.target.value)} fullWidth />
                                            <TextField label="Deskripsi" value={description} onChange={e => setDescription(e.target.value)} fullWidth multiline minRows={2} />
                                            <TextField select label="Kategori" value={categoryId} onChange={e => setCategoryId(e.target.value)} fullWidth>
                                                <MenuItem value="">—</MenuItem>
                                                {categories.map(c => <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>)}
                                            </TextField>
                                        </Stack>
                                    </Stack>

                                    <Divider />

                                    {/* Varian */}
                                    <Typography variant="subtitle2">Varian</Typography>
                                    <Stack spacing={1}>
                                        {variants.map(v => (
                                            <Card key={v.id} variant="outlined" sx={{ borderRadius: 2 }}>
                                                <CardContent sx={{
                                                    display: 'grid',
                                                    gap: 8,
                                                    gridTemplateColumns: { xs: '1fr', md: '160px 1fr 220px' },
                                                    alignItems: 'center'
                                                }}>
                                                    <TextField
                                                        label="Kode"
                                                        value={v.code}
                                                        onChange={e => patchVariant(v.id, { code: e.target.value })}
                                                        size="small"
                                                    />
                                                    <TextField
                                                        label="Nama Varian"
                                                        value={v.name}
                                                        onChange={e => patchVariant(v.id, { name: e.target.value.toUpperCase() })}
                                                        size="small"
                                                        inputProps={{ style: { textTransform: 'uppercase' } }}
                                                    />
                                                    <TextField
                                                        label="Harga"
                                                        value={formatGrouped(v.price)}
                                                        onChange={e => {
                                                            const raw = e.target.value.replace(/[^\d]/g, '')
                                                            patchVariant(v.id, { price: raw })
                                                        }}
                                                        size="small"
                                                        inputMode="numeric"
                                                    />
                                                    <Box sx={{ gridColumn: '1/-1' }}>
                                                        <TextField
                                                            label="Deskripsi (opsional)"
                                                            value={v.description || ''}
                                                            onChange={e => patchVariant(v.id, { description: e.target.value })}
                                                            fullWidth multiline minRows={2}
                                                        />
                                                        <Typography variant="caption" color="text.secondary" sx={{ mt: .5, display: 'block' }}>
                                                            Pratinjau harga: {toIDR(v.price || 0)}
                                                        </Typography>
                                                    </Box>
                                                </CardContent>
                                            </Card>
                                        ))}
                                        {variants.length === 0 && (
                                            <Typography variant="body2" color="text.secondary">Produk ini belum memiliki varian.</Typography>
                                        )}
                                    </Stack>

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
