'use client'

import * as React from 'react'
import { Box, Chip, Paper, Stack, Tooltip, Typography } from '@mui/material'
import Image, { ImageLoader } from 'next/image'
import Skeleton from '@mui/material/Skeleton'
import { motion } from 'framer-motion'
import LocalOfferRoundedIcon from '@mui/icons-material/LocalOfferRounded'
import CheckRounded from '@mui/icons-material/CheckRounded'
import { NoteAltRounded } from '@mui/icons-material'
import type { Item } from '../RightContainerBatchList' // ⬅️ sesuaikan path tipe Item dari parent

const MotionPaper = motion(Paper)
const GRADIENT = 'linear-gradient(90deg, #6366F1, #8B5CF6 35%, #EC4899)'

/* === util kecil untuk image === */
const toUploadUrl = (s?: string) =>
    !s ? undefined : /^(uploads|http|https):\/\//i.test(s) ? s : `uploads:///${s.replace(/^\/+/, '')}`

const defaultUploadsLoader: ImageLoader = ({ src }) => {
    if (src?.startsWith('uploads:///')) {
        const base = process.env.NEXT_PUBLIC_UPLOADS_BASE_URL || ''
        const path = src.replace('uploads:///', '').replace(/^\/+/, '')
        return base ? `${base.replace(/\/+$/, '')}/${path}` : `/${path}`
    }
    return src
}

const ph = (name?: string, img?: string) =>
    toUploadUrl(img) ?? `https://placehold.co/600x400/png?text=${encodeURIComponent(name || 'Item')}`

const ImgWithSkeleton: React.FC<{ src: string; alt: string; loader?: ImageLoader; disabled?: boolean }> = ({ src, alt, loader, disabled }) => {
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
                sizes="(max-width: 600px) 50vw, (max-width: 1200px) 25vw, 200px"
                onLoad={() => setLoaded(true)}
                onError={() => { setErr(true); setLoaded(true) }}
                style={{
                    objectFit: 'cover',
                    opacity: loaded ? 1 : 0,
                    transition: 'opacity .2s ease',
                    filter: disabled ? 'grayscale(1) saturate(0) brightness(0.9)' : 'none',
                }}
            />
            <Box sx={{ position: 'absolute', inset: 0, pointerEvents: 'none', background: (t) => `linear-gradient(to bottom, ${t.palette.action.hover}00 0%, ${t.palette.action.hover}40 70%, ${t.palette.action.hover}66 100%)` }} />
        </Box>
    )
}

type Props = {
    item: Item
    /** label rupiah(total) yang sudah dihitung parent */
    totalLabel: string
    /** label qty x price yang sudah dihitung parent (contoh: "2 x Rp 10.000") */
    qtyPriceLabel: string
    /** gambar pakai NEXT_PUBLIC_UPLOADS_BASE_URL (opsional override loader) */
    uploadsLoader?: ImageLoader

    // state dari parent
    selected: boolean
    disabled: boolean

    // status flags dari parent (biar presentational-only)
    isClosed?: boolean
    isPendingVoid?: boolean
    isApprovedVoid?: boolean
    isPendingPaid?: boolean
    isPaid?: boolean

    onToggle: (it: Item) => void
}

const RightContainerBatchDetailRow: React.FC<Props> = ({
                                                           item,
                                                           totalLabel,
                                                           qtyPriceLabel,
                                                           uploadsLoader = defaultUploadsLoader,
                                                           selected,
                                                           disabled,
                                                           isClosed,
                                                           isPendingVoid,
                                                           isApprovedVoid,
                                                           isPendingPaid,
                                                           isPaid,
                                                           onToggle,
                                                       }) => {
    const hasNote = Boolean(item.note?.trim()?.length)

    return (
        <MotionPaper
            variant="outlined"
            whileTap={disabled ? undefined : { scale: 0.99 }}
            onClick={disabled ? undefined : () => onToggle(item)}
            aria-disabled={disabled || undefined}
            sx={{
                borderRadius: 2, overflow: 'hidden', display: 'flex', flexDirection: 'column', position: 'relative',
                border: '2px solid',
                borderColor: disabled ? 'divider' : (selected ? 'primary.main' : 'divider'),
                boxShadow: disabled ? 'none' : (selected ? '0 0 0 3px rgba(99,102,241,.25)' : '0 2px 8px rgba(0,0,0,0.04)'),
                transition: (t) => t.transitions.create(['box-shadow', 'border-color', 'opacity'], { duration: t.transitions.duration.shorter }),
                cursor: disabled ? 'not-allowed' : 'pointer',
                opacity: disabled ? 0.85 : 1,
                '&::before': (!disabled && selected) ? { content: '""', position: 'absolute', inset: -1, borderRadius: 8, background: GRADIENT, filter: 'blur(12px)', opacity: .7, zIndex: -1 } : {},
            }}
        >
            <Box sx={{ position: 'relative' }}>
                <ImgWithSkeleton src={ph(item.product?.name, item.product?.image)} alt={item.product?.name || 'Item'} loader={uploadsLoader} disabled={disabled} />

                {/* Status chips */}
                {isPendingVoid && (
                    <Chip
                        size="small"
                        label="Pending Void"
                        sx={{ position: 'absolute', top: 8, right: 8, fontWeight: 800, bgcolor: 'warning.main', color: 'warning.contrastText', boxShadow: 1, textTransform: 'uppercase', letterSpacing: .2 }}
                        title={item.void?.void_time ? `Diajukan: ${new Date(item.void.void_time).toLocaleString('id-ID')}` : undefined}
                    />
                )}
                {isApprovedVoid && (
                    <Chip
                        size="small"
                        label="Voided"
                        sx={{ position: 'absolute', top: 8, right: 8, fontWeight: 800, bgcolor: 'error.main', color: 'error.contrastText', boxShadow: 1, textTransform: 'uppercase', letterSpacing: .2 }}
                        title={item.void?.void_time ? `Disetujui: ${new Date(item.void.void_time).toLocaleString('id-ID')}` : undefined}
                    />
                )}
                {isClosed && (
                    <Chip
                        size="small"
                        label="Selesai"
                        sx={{ position: 'absolute', top: 8, right: 8, fontWeight: 800, bgcolor: 'error.main', color: 'error.contrastText', boxShadow: 1, textTransform: 'uppercase', letterSpacing: .2 }}
                        title="Transaksi Ditutup"
                    />
                )}
                {isPendingPaid && (
                    <Chip
                        size="small"
                        label="Pending Paid"
                        sx={{ position: 'absolute', top: 8, left: 8, fontWeight: 800, bgcolor: 'info.main', color: 'info.contrastText', boxShadow: 1, textTransform: 'uppercase', letterSpacing: .2 }}
                        title="Item ini tercakup bill yang masih pending/menunggu pembayaran."
                    />
                )}
                {isPaid && (
                    <Chip
                        size="small"
                        label="Success Paid"
                        sx={{ position: 'absolute', top: 8, left: 8, fontWeight: 800, bgcolor: 'success.main', color: 'info.contrastText', boxShadow: 1, textTransform: 'uppercase', letterSpacing: .2 }}
                        title="Item ini tercakup bill yang sudah ditandai terbayar."
                    />
                )}

                {/* Price chip kiri bawah */}
                <Chip
                    size="small"
                    icon={<LocalOfferRoundedIcon sx={{ fontSize: 16, color: 'inherit' }} />}
                    label={totalLabel}
                    sx={{ position: 'absolute', bottom: 8, left: 8, color: '#fff', background: GRADIENT, boxShadow: 1, '& .MuiChip-icon': { color: 'inherit' } }}
                />

                {/* Check bulat kanan bawah */}
                <Box
                    aria-label={selected ? 'dipilih' : 'tidak dipilih'}
                    sx={{
                        position: 'absolute', bottom: 8, right: 8,
                        width: 20, height: 20, borderRadius: '50%',
                        border: '2px solid', borderColor: selected ? 'success.main' : 'divider',
                        bgcolor: selected ? 'success.main' : 'background.paper',
                        color: '#fff', display: 'grid', placeItems: 'center', flexShrink: 0,
                        boxShadow: selected ? 1 : 0, opacity: disabled ? 0.7 : 1,
                    }}
                >
                    {selected && <CheckRounded sx={{ fontSize: 14 }} />}
                </Box>
            </Box>

            <Box sx={{ p: 1.25, display: 'grid', gap: .5, flexGrow: 1 }}>
                <Typography variant="h6" fontWeight={800} title={item.product?.name}>
                    {item.product?.name}
                </Typography>

                <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap mt={0.5} sx={{ justifyContent: 'flex-start' }}>
                    {item.variant?.name ? (
                        <Chip
                            size="small"
                            label={item.variant.name}
                            sx={(t) => ({
                                px: 1,
                                bgcolor: t.palette.mode === 'light' ? t.palette.common.black : t.palette.common.white,
                                color: t.palette.mode === 'light' ? t.palette.common.white : t.palette.common.black,
                            })}
                        />
                    ) : null}
                </Stack>

                {/* Note */}
                <Box sx={{ mt: 0.5, minHeight: 22, display: 'flex', alignItems: 'flex-start', columnGap: 0.5 }}>
                    {hasNote ? (
                        <>
                            <NoteAltRounded sx={(t) => ({ fontSize: 18, color: t.palette.error.main, mt: '2px', flexShrink: 0 })} />
                            <Tooltip title={item.note} arrow placement="top-start">
                                <Typography
                                    variant="body2"
                                    sx={(t) => ({
                                        color: t.palette.error.main, fontWeight: 700, lineHeight: 1.3,
                                        overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box',
                                        WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', whiteSpace: 'normal',
                                        flex: 1, minWidth: 0, cursor: 'help',
                                    })}
                                >
                                    {item.note}
                                </Typography>
                            </Tooltip>
                        </>
                    ) : (
                        <Typography variant="caption" sx={{ color: 'text.secondary', lineHeight: 1.2 }}>
                            Tidak ada Catatan
                        </Typography>
                    )}
                </Box>

                {/* Qty x Price — Total */}
                <Stack direction="row" alignItems="center" justifyContent="space-between" mt={1} sx={{ justifySelf: 'stretch', width: '100%' }}>
                    <Typography variant="body2" color="text.secondary">{qtyPriceLabel}</Typography>
                    <Typography variant="subtitle2" fontWeight={900}>{totalLabel}</Typography>
                </Stack>
            </Box>

            <Box sx={{ height: 3, background: GRADIENT }} />
        </MotionPaper>
    )
}

export default React.memo(RightContainerBatchDetailRow);
