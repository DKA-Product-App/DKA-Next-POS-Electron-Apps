'use client'

import React, { FC } from 'react'
import Image, { ImageLoader } from 'next/image'
import { Box, Button, Chip, MenuItem, Paper, Select, Typography } from '@mui/material'
import LocalOfferRoundedIcon from '@mui/icons-material/LocalOfferRounded'
import CategoryRoundedIcon from '@mui/icons-material/CategoryRounded'
import AddRoundedIcon from '@mui/icons-material/AddRounded'
import Skeleton from '@mui/material/Skeleton'

import { Products } from '../../../types/products.type'
import { ProductDetailModal, DetailProductModalHandle } from './modals/ProductDetailModal'
import {motion} from "framer-motion";

export type ProductCardProps = {
    product: Products
    variantId?: string
    onSelectVariant?: (productId: string, variantId?: string) => void
    onAdd?: (product: Products, variant?: Products['variants'][number]) => void
    uploadsLoader?: ImageLoader
    gradient?: string
}

const GRADIENT_DEFAULT = 'linear-gradient(90deg, #6366F1, #8B5CF6 35%, #EC4899)'

// + bikin MotionPaper (tipis doang)
const MotionPaper = motion(Paper)

const rupiah = (n: number) =>
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n)
const toUploadUrl = (s?: string) => (!s ? undefined : /^(uploads|http|https):\/\//i.test(s) ? s : `uploads:///${s.replace(/^\/+/, '')}`)
const placeholderOf = (p: Products) => toUploadUrl(p.image) ?? `https://placehold.co/600x400/png?text=${encodeURIComponent(p.name)}`

/** drag-to-scroll (kategori) */
function useHorizontalDragScroll<T extends HTMLElement>() {
    const ref = React.useRef<T | null>(null)
    const state = React.useRef({ down: false, startX: 0, startScrollLeft: 0 })
    const onPointerDown = (e: React.PointerEvent<T>) => {
        const el = ref.current; if (!el) return
        state.current.down = true
        state.current.startX = e.clientX
        state.current.startScrollLeft = el.scrollLeft
        el.setPointerCapture?.(e.pointerId)
        el.style.cursor = 'grabbing'
    }
    const onPointerMove = (e: React.PointerEvent<T>) => {
        const el = ref.current; if (!el || !state.current.down) return
        const dx = e.clientX - state.current.startX
        el.scrollLeft = state.current.startScrollLeft - dx
    }
    const end = (e?: React.PointerEvent<T>) => {
        const el = ref.current; if (!el) return
        state.current.down = false
        if (e) el.releasePointerCapture?.(e.pointerId)
        el.style.cursor = 'grab'
    }
    return { ref, onPointerDown, onPointerMove, onPointerUp: end, onPointerLeave: end }
}

const ImgWithSkeleton: FC<{ src: string; alt: string; priority?: boolean; loader?: ImageLoader }> = ({ src, alt, priority, loader }) => {
    const [loaded, setLoaded] = React.useState(false)
    const [err, setErr] = React.useState(false)
    const finalSrc = err ? 'https://placehold.co/600x400/png?text=No%20Image' : src

    return (
        <Box sx={{ position: 'relative', width: '100%', aspectRatio: '4 / 3', bgcolor: 'action.hover', overflow: 'hidden' }}>
            {!loaded && <Skeleton variant="rectangular" sx={{ position: 'absolute', inset: 0 }} />}
            <Image
                loader={loader}
                src={finalSrc}
                alt={alt}
                fill
                unoptimized
                loading={priority ? 'eager' : 'lazy'}
                sizes="(max-width: 600px) 50vw, (max-width: 1200px) 25vw, 200px"
                onLoad={() => setLoaded(true)}
                onError={() => { setErr(true); setLoaded(true) }}
                style={{ objectFit: 'cover', opacity: loaded ? 1 : 0, transition: 'opacity .2s ease' }}
            />
            <Box
                sx={{
                    position: 'absolute', inset: 0, pointerEvents: 'none',
                    background: (t) =>
                        `linear-gradient(to bottom, ${t.palette.action.hover}00 0%, ${t.palette.action.hover}40 70%, ${t.palette.action.hover}66 100%)`,
                }}
            />
        </Box>
    )
}


const ProductCard: FC<ProductCardProps> = ({ product: p, variantId, onSelectVariant, onAdd, uploadsLoader, gradient = GRADIENT_DEFAULT }) => {
    const hasVariants = Array.isArray(p.variants) && p.variants.length > 0
    const selectedVarId = variantId ?? p.variants?.[0]?.id
    const selectedVar = p.variants?.find(v => String(v.id) === String(selectedVarId))
    const price = Number(selectedVar?.price ?? (p as any).price ?? 0)

    const cats: Array<any> = Array.isArray((p as any).category) ? (p as any).category : (p as any).category ? [(p as any).category] : []
    const drag = useHorizontalDragScroll<HTMLDivElement>()

    // modal controller
    const modalRef = React.useRef<DetailProductModalHandle>(null)

    return (
        <MotionPaper
            variant="outlined"
            whileHover="hover"
            initial={false}
            variants={{ hover: { scale: [1, 0.97, 1.04, 1] } }}  // ⬅️ agak lebih “nendang”
            transition={{ duration: 1, times: [0, 0.25, 0.7, 1], ease: [0.16, 1, 0.3, 1] }}
            style={{ willChange: 'transform' }}
            sx={{
                borderRadius: 2,
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column',
                transition: (t) => t.transitions.create(['box-shadow','border-color'], { duration: t.transitions.duration.shorter }),
                borderColor: 'divider',
                position: 'relative',
                background: (t) =>
                    t.palette.mode === 'dark'
                        ? t.palette.background.paper
                        : `linear-gradient(180deg, ${t.palette.background.paper} 0%, ${t.palette.background.default} 100%)`,
                '&::after': {
                    content: '""', position: 'absolute', inset: -1, borderRadius: 8, background: gradient,
                    filter: 'blur(12px)', opacity: 0, transition: 'opacity .18s ease', zIndex: -1,
                },
                '&:hover': (t) => ({
                    boxShadow: 4,
                    borderColor: 'primary.main',
                    ...(t.palette.mode === 'dark' ? { '&::after': { opacity: 0.8 } } : { '&::after': { opacity: 0 } }),
                }),
            }}
        >
            {/* Image + Price (click to open modal) */}
            <Box sx={{ position: 'relative' }}>
                <Box
                    role="button"
                    tabIndex={0}
                    aria-label={`Lihat detail ${p.name}`}
                    title="Lihat detail"
                    onClick={() => modalRef.current?.open()}
                    onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') ? (e.preventDefault(), modalRef.current?.open()) : null}
                    sx={{ outline: 'none' }}
                >
                    <ImgWithSkeleton src={placeholderOf(p)} alt={p.name} loader={uploadsLoader} />
                </Box>

                <Chip
                    size="small"
                    icon={<LocalOfferRoundedIcon sx={{ fontSize: 16, color: 'inherit' }} />}
                    label={rupiah(price)}
                    sx={{
                        position: 'absolute', bottom: 8, left: 8, color: '#fff', background: gradient, boxShadow: 1,
                        '& .MuiChip-icon': { color: 'inherit' },
                    }}
                />
            </Box>

            {/* Content */}
            <Box sx={{ p: 1.25, display: 'grid', gap: 0.5, flexGrow: 1 }}>
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
                    {p.name}
                </Typography>

                {/* Categories: drag-to-scroll */}
                <Box
                    ref={drag.ref}
                    onPointerDown={drag.onPointerDown}
                    onPointerMove={drag.onPointerMove}
                    onPointerUp={drag.onPointerUp}
                    onPointerLeave={drag.onPointerLeave}
                    sx={{
                        overflowX: 'auto',
                        width: '100%',
                        mt: 0.80,
                        py: 0.25,
                        pr: 1,
                        minHeight: 28,
                        cursor: 'grab',
                        userSelect: 'none',
                        touchAction: 'pan-y',
                        scrollbarWidth: 'none',
                        msOverflowStyle: 'none',
                        '&::-webkit-scrollbar': { width: 0, height: 0 },
                    }}
                >
                    <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5, whiteSpace: 'nowrap', minWidth: '100%' }}>
                        {cats.length ? (
                            cats.map((c) => (
                                <Chip
                                    key={String(c.id ?? c.name)}
                                    size="small"
                                    variant="outlined"
                                    icon={<CategoryRoundedIcon sx={{ fontSize: 14 }} />}
                                    label={c.name}
                                    sx={{ color: 'text.secondary', borderColor: 'divider', '& .MuiChip-icon': { color: 'inherit', mr: 0.5 } }}
                                />
                            ))
                        ) : (
                            <Chip
                                size="small"
                                variant="outlined"
                                icon={<CategoryRoundedIcon sx={{ fontSize: 14 }} />}
                                label="Uncategorized"
                                sx={{ color: 'text.secondary', borderColor: 'divider', '& .MuiChip-icon': { color: 'inherit', mr: 0.5 } }}
                            />
                        )}
                    </Box>
                </Box>

                <Box sx={{ flexGrow: 1 }} />

                {/* Variant Select */}
                <Select
                    size="small"
                    variant="outlined"
                    fullWidth
                    value={hasVariants ? (selectedVarId ?? '') : ''}
                    onChange={(e) => onSelectVariant?.(String((p as any).id), String(e.target.value))}
                    displayEmpty
                    disabled={!hasVariants}
                    renderValue={(selected) => {
                        if (!hasVariants || selected === '') return <span style={{ opacity: 0.7 }}>Tidak ada varian</span>
                        const v = p.variants!.find((x) => String(x.id) === String(selected))
                        return v ? `${v.code} — ${rupiah(Number(v.price))}` : 'Pilih varian'
                    }}
                    sx={{ mt: 0.5, '.MuiSelect-select': { py: 1 } }}
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

                <Button
                    fullWidth
                    size="small"
                    variant="contained"
                    endIcon={<AddRoundedIcon />}
                    sx={{ mt: 1, textTransform: 'none', fontWeight: 800, borderRadius: 1.5, boxShadow: 'none', background: gradient, '&:hover': { boxShadow: 3 } }}
                    onClick={() => onAdd?.(p, hasVariants ? selectedVar : undefined)}
                >
                    Tambah
                </Button>
            </Box>

            <Box sx={{ height: 3, background: gradient }} />

            {/* modal terpisah, dikontrol via ref */}
            <ProductDetailModal
                ref={modalRef}
                product={p}
                variantId={selectedVarId ? String(selectedVarId) : undefined}
                onSelectVariant={onSelectVariant}
                onAdd={onAdd}
                uploadsLoader={uploadsLoader}
                gradient={gradient}
            />
        </MotionPaper>
    )
}

export default ProductCard
