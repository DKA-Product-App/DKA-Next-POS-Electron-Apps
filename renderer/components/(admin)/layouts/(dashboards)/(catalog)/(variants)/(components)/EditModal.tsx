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
import {Products} from "../../../../../../../types/product/products.type";
import {ProductsVariants} from "../../../../../../../types/product/products.variants.type"; // <-- ganti path sesuai lokasi file utils-mu

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
export default function EditModal({ variantId, trigger, onUpdated }: {
    variantId: string
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
        name?: string
        description?: string
        product?: Products          // langsung simpan array object {id,name}
        price?: string,
    }>({
        name: '',
        description: '',
    })

    // daftar kategori dari server (options untuk Autocomplete)
    const [product, setProduct] = React.useState<Products[]>([])

    const openModal = () => { setOpen(true); fetchDetail(); fetchProducts(); }
    const closeModal = () => setOpen(false)

    const fetchProducts = React.useCallback(() => {
        if (!window.api) return
        window.api.invoke< any, { data : Products[] }>('api.product:read.all', {})
            .then(({ data }) => {
                setProduct(data)
            })
            .catch(() => setProduct([]))
    }, [])

    const toIDR = (v: string | number) =>
        new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 })
            .format(typeof v === 'string' ? Number(v || 0) : (v || 0))

    const formatGrouped = (raw: string): string => {
        const digits = String(raw || '').replace(/[^\d]/g, '')
        if (!digits) return ''
        const n = Number(digits)
        return new Intl.NumberFormat('id-ID', { maximumFractionDigits: 0 }).format(n)
    }

    const fetchDetail = React.useCallback(() => {
        if (!window.api) return
        setLoading(true)
        window.api.invoke<{ id : string },{ data : ProductsVariants }>('api.product.variant:read.one', { id: variantId })
            .then(({ data }) => {
                setForm(v => ({
                    ...v,
                    name: data?.name || '',
                    description: data?.description || '',
                    product: data?.product,
                    price: toIDR(data?.price)
                }))
                setError(null)
            })
            .catch((err: any) => setError(err?.msg || 'Gagal memuat detail produk'))
            .finally(() => setLoading(false))
    }, [variantId])
    const buildPayload = () => {
        // komposisi payload langsung dari state "form" (plus reference)
        const payload: any = {
            reference: (Session?.id) ? { id: Session.id } : undefined,
            name: String(form.name || '').trim(),
            description: String(form.description || '').trim() || undefined,
            product: form.product,
            price: form.price,
        }
        return payload
    }

    const handleSubmit = () => {
        if (!window?.api?.invoke) { setError('IPC bridge tidak tersedia'); return }
        setSubmitting(true); setError(null)
        Promise.resolve(buildPayload())
            .then((payload) => {
                console.log(payload)
                return window.api.invoke('api.product.variant:update.one', { params: { id: variantId }, data: payload })
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

                                        <Stack spacing={1.5} sx={{ flex: 1, minWidth: 0 }}>
                                            <TextField
                                                label="Nama Variant"
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
                                                options={product}
                                                disableCloseOnSelect
                                                getOptionLabel={(o) => o?.name?.toUpperCase?.() ?? ''}
                                                value={form.product}
                                                onChange={(_, val) => setForm(v => ({ ...v, product: val ?? undefined }))}
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
                                                        label={`Pilih Product`}
                                                        placeholder={form.product ? '' : 'Pilih Product'}
                                                        fullWidth
                                                    />
                                                )}
                                            />

                                            {/* PRICE — format ribuan */}
                                            <TextField
                                                label="Harga"
                                                value={formatGrouped(form.price)}
                                                onChange={e => {
                                                    const raw = e.target.value.replace(/\D/g, '')
                                                    setForm(v => ({ ...v, price: raw }))
                                                }}
                                                fullWidth={true}
                                                inputMode="numeric"
                                                placeholder="0"
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
