'use client'

import React, { forwardRef, useEffect, useImperativeHandle, useMemo, useState } from 'react'
import {
    Box, Button, Dialog, DialogActions, DialogContent, DialogTitle,
    MenuItem, Select, Typography, IconButton
} from '@mui/material'
import CloseRoundedIcon from '@mui/icons-material/CloseRounded'
import CategoryRoundedIcon from '@mui/icons-material/CategoryRounded'
import Skeleton from '@mui/material/Skeleton'
import Image, { ImageLoader } from 'next/image'
import PerfectScrollbar from 'react-perfect-scrollbar'
import 'react-perfect-scrollbar/dist/css/styles.css'

import type { Products } from '../../../../types/products.type'
import type { ProductsVariants } from '../../../../types/products.variants.type'
import type { Category } from '../../../../types/product.categories.type'
import {ImgWithSkeleton} from "../../../../../../../../utils/ImageProcessingIPC";

export type DetailProductModalHandle = { open: () => void; close: () => void }

/**
 * Komposit product utk komponen ini:
 * - variants opsional (array)
 * - category bisa single/array/undefined (kompatibel dgn payload kamu)
 */
export type ProductWithVariants = Products & {
    variants?: ProductsVariants[]
    category?: Category | Category[] | null
}

export type DetailProductModalProps = {
    product: ProductWithVariants
    variantId?: string
    onSelectVariant?: (productId: string, variantId?: string) => void
    onAdd?: (product: Products, variant?: ProductsVariants) => void
    uploadsLoader?: ImageLoader
    gradient?: string
    decorShadowOpacity?: number // 0..1
}

const GRADIENT_DEFAULT = 'linear-gradient(90deg, #6366F1, #8B5CF6 35%, #EC4899)'
const rupiah = (n: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n)
export const ProductDetailModal = forwardRef<DetailProductModalHandle, DetailProductModalProps>(function DetailProductModal(
    { product: p, variantId, onSelectVariant, onAdd, uploadsLoader, gradient = GRADIENT_DEFAULT, decorShadowOpacity },
    ref
) {
    const [open, setOpen] = useState(false)
    const hasVariants = Array.isArray(p.variants) && p.variants.length > 0

    // initial var id (prioritas prop, fallback varian pertama)
    const initialVarId = useMemo(() => variantId ?? p.variants?.[0]?.id, [variantId, p.variants])
    const [dialogVarId, setDialogVarId] = useState<string | undefined>(initialVarId ? String(initialVarId) : undefined)
    useEffect(() => setDialogVarId(initialVarId ? String(initialVarId) : undefined), [initialVarId])

    const dialogSelectedVar = p.variants?.find(v => String(v.id) === String(dialogVarId))

    // normalisasi category → array
    const cats: Category[] =
        Array.isArray(p.category) ? p.category.filter(Boolean) as Category[] :
            p.category ? [p.category as Category] : []

    useImperativeHandle(ref, () => ({ open: () => setOpen(true), close: () => setOpen(false) }), [])

    return (
        <Dialog
            open={open}
            onClose={() => setOpen(false)}
            fullWidth
            maxWidth="sm"
            PaperProps={{
                sx: {
                    borderRadius: 2,
                    position: 'relative',
                    overflow: 'visible',
                    background: (t) =>
                        t.palette.mode === 'dark'
                            ? t.palette.background.paper
                            : `linear-gradient(180deg, ${t.palette.background.paper} 0%, ${t.palette.background.default} 100%)`,
                    '&::after': {
                        content: '""',
                        position: 'absolute',
                        inset: -2,
                        borderRadius: 'inherit',
                        background: gradient,
                        filter: 'blur(18px)',
                        opacity: decorShadowOpacity ?? 0.35,
                        pointerEvents: 'none',
                        zIndex: -1,
                    },
                },
            }}
        >
            <DialogTitle sx={{ pr: 6 }}>
                <Typography
                    title={p.name}
                    variant="subtitle2"
                    sx={{
                        fontWeight: 800,
                        lineHeight: 1.25,
                        fontSize: { xs: '1rem', sm: '1.05rem', md: '1.1rem' },
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                    }}
                >
                    Detail {p.name}
                </Typography>
                <IconButton aria-label="Tutup" onClick={() => setOpen(false)} sx={{ position: 'absolute', right: 8, top: 8 }}>
                    <CloseRoundedIcon />
                </IconButton>
            </DialogTitle>

            <DialogContent dividers sx={{ p: 0 }}>
                <PerfectScrollbar options={{ suppressScrollX: true, wheelPropagation: false }}>
                    <Box sx={{ p: 0 }}>
                        {/* HERO IMAGE + HARGA */}
                        <Box sx={{ position: 'relative', overflow: 'hidden' }}>
                            <ImgWithSkeleton path={p?.image ?? null} alt={p?.name ?? ''} />
                            <Box
                                sx={{
                                    position: 'absolute',
                                    left: 0,
                                    right: 0,
                                    bottom: 0,
                                    height: '38%',
                                    background: (t) =>
                                        `linear-gradient(to top,
                                          ${t.palette.mode === 'dark' ? 'rgba(0,0,0,0.72)' : 'rgba(0,0,0,0.58)'} 0%,
                                          rgba(0,0,0,0.36) 45%,
                                          rgba(0,0,0,0.00) 72%)`,
                                    pointerEvents: 'none',
                                }}
                            />

                            <Typography
                                component="div"
                                sx={{
                                    position: 'absolute',
                                    left: 12,
                                    bottom: 12,
                                    fontWeight: 900,
                                    letterSpacing: 0.2,
                                    fontSize: { xs: '1.6rem', sm: '1.8rem', md: '2rem' },
                                    lineHeight: 1,
                                    color: '#fff',
                                    textShadow: '0 1px 2px rgba(0,0,0,.55), 0 10px 30px rgba(0,0,0,.35)',
                                    userSelect: 'none',
                                    pointerEvents: 'none',
                                }}
                            >
                                {rupiah(Number(dialogSelectedVar?.price ?? (p as any).price ?? 0))}
                            </Typography>
                        </Box>

                        <Box sx={{ p: 3, display: 'grid', gap: 1.5 }}>
                            <Typography
                                title={p.name}
                                variant="subtitle2"
                                sx={{
                                    fontWeight: 800,
                                    lineHeight: 1.25,
                                    fontSize: { xs: '2rem', sm: '2.05rem', md: '2.1rem' },
                                    display: '-webkit-box',
                                    WebkitLineClamp: 2,
                                    WebkitBoxOrient: 'vertical',
                                    overflow: 'hidden',
                                }}
                            >
                                {p.name}
                            </Typography>

                            {p.description ? (
                                <Typography
                                    title={p.description}
                                    variant="caption"
                                    sx={{
                                        fontWeight: 200,
                                        lineHeight: 1.25,
                                        fontSize: { xs: '1rem', sm: '1.05rem', md: '1.1rem' },
                                        display: '-webkit-box',
                                        WebkitLineClamp: 3,
                                        WebkitBoxOrient: 'vertical',
                                        overflow: 'hidden',
                                    }}
                                >
                                    {p.description}
                                </Typography>
                            ) : null}

                            {/* Categories */}
                            <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                                {cats.length ? (
                                    cats.map((c) => (
                                        <Typography
                                            key={String(c.id ?? c.name)}
                                            component="span"
                                            sx={{
                                                display: 'inline-flex',
                                                alignItems: 'center',
                                                gap: 0.5,
                                                px: 1,
                                                py: 0.25,
                                                borderRadius: 1,
                                                border: '1px solid',
                                                borderColor: 'divider',
                                                color: 'text.secondary',
                                                fontSize: '0.8125rem',
                                            }}
                                        >
                                            <CategoryRoundedIcon sx={{ fontSize: 14 }} />
                                            {c.name}
                                        </Typography>
                                    ))
                                ) : (
                                    <Typography
                                        component="span"
                                        sx={{
                                            display: 'inline-flex',
                                            alignItems: 'center',
                                            gap: 0.5,
                                            px: 1,
                                            py: 0.25,
                                            borderRadius: 1,
                                            border: '1px solid',
                                            borderColor: 'divider',
                                            color: 'text.secondary',
                                            fontSize: '0.8125rem',
                                        }}
                                    >
                                        <CategoryRoundedIcon sx={{ fontSize: 14 }} />
                                        Uncategorized
                                    </Typography>
                                )}
                            </Box>

                            {/* Variant Select */}
                            <Select
                                size="small"
                                variant="outlined"
                                fullWidth
                                value={hasVariants ? (dialogVarId ?? '') : ''}
                                onChange={(e) => {
                                    const val = String(e.target.value)
                                    setDialogVarId(val)
                                    onSelectVariant?.(String(p.id), val)
                                }}
                                displayEmpty
                                disabled={!hasVariants}
                                renderValue={(selected) => {
                                    if (!hasVariants || selected === '') return <span style={{ opacity: 0.7 }}>Tidak ada varian</span>
                                    const v = p.variants!.find((x) => String(x.id) === String(selected))
                                    return v ? `${v.code} — ${rupiah(Number(v.price))}` : 'Pilih varian'
                                }}
                                sx={{ '.MuiSelect-select': { py: 1 } }}
                            >
                                {hasVariants ? (
                                    p.variants!.map((v) => (
                                        <MenuItem key={String(v.id)} value={String(v.id)}>
                                            {v.code} — {rupiah(Number(v.price))}
                                        </MenuItem>
                                    ))
                                ) : (
                                    <MenuItem disabled value="">
                                        Tidak ada varian
                                    </MenuItem>
                                )}
                            </Select>
                        </Box>
                    </Box>
                </PerfectScrollbar>
            </DialogContent>

            <DialogActions sx={{ p: 2 }}>
                <Button
                    fullWidth
                    size="medium"
                    variant="contained"
                    sx={{
                        textTransform: 'none',
                        fontWeight: 800,
                        borderRadius: 1.5,
                        boxShadow: 'none',
                        background: gradient,
                        '&:hover': { boxShadow: 3 },
                    }}
                    onClick={() => {
                        onAdd?.(p, hasVariants ? dialogSelectedVar : undefined)
                        setOpen(false)
                    }}
                >
                    Tambah ke Keranjang
                </Button>
            </DialogActions>
        </Dialog>
    )
})
