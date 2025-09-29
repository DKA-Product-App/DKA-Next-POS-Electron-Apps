'use client'

import * as React from 'react'
import { Box, Chip, Paper, Stack, Tooltip, Typography, styled } from '@mui/material'
import Image, { ImageLoader } from 'next/image'
import Skeleton from '@mui/material/Skeleton'
import { motion } from 'framer-motion'
import LocalOfferRoundedIcon from '@mui/icons-material/LocalOfferRounded'
import CheckRounded from '@mui/icons-material/CheckRounded'
import { NoteAltRounded } from '@mui/icons-material'
import { TransactionBatchesItems } from '../../../types/api.transaction.type'

const GRADIENT = 'linear-gradient(90deg, #6366F1, #8B5CF6 35%, #EC4899)'

/* =========================
 * Upload utils
 * =======================*/
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

/* =========================
 * Styled (stabil, no class regen)
 * =======================*/
const Card = styled(Paper)(({ theme }) => ({
    borderRadius: 8,
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
    position: 'relative',
    border: '2px solid',
    transition: theme.transitions.create(['box-shadow', 'border-color', 'opacity'], { duration: theme.transitions.duration.shorter }),
}))

const PriceChip = styled(Chip)({
    position: 'absolute',
    bottom: 8,
    left: 8,
    color: '#fff',
    background: GRADIENT,
    boxShadow: '0 1px 4px rgba(0,0,0,.2)',
})

const StatusChip = styled(Chip)({
    position: 'absolute',
    top: 8,
    fontWeight: 800,
    boxShadow: '0 1px 4px rgba(0,0,0,.2)',
    textTransform: 'uppercase',
    letterSpacing: .2,
})

/* =========================
 * ImgWithSkeleton (memo)
 * =======================*/
const ImgWithSkeleton: React.FC<{ src: string; alt: string; loader?: ImageLoader; disabled?: boolean }> = React.memo(
    ({ src, alt, loader, disabled }) => {
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
                    onLoadingComplete={() => setLoaded(true)}
                    onError={() => { setErr(true); setLoaded(true) }}
                    style={{
                        objectFit: 'cover',
                        opacity: loaded ? 1 : 0,
                        transition: 'opacity .2s ease',
                        filter: disabled ? 'grayscale(1) saturate(0) brightness(0.9)' : 'none',
                    }}
                />
                <Box
                    sx={(t) => ({
                        position: 'absolute', inset: 0, pointerEvents: 'none',
                        background: `linear-gradient(to bottom, ${t.palette.action.hover}00 0%, ${t.palette.action.hover}40 70%, ${t.palette.action.hover}66 100%)`,
                    })}
                />
            </Box>
        )
    }
)
ImgWithSkeleton.displayName = 'ImgWithSkeleton'

/* =========================
 * Props
 * =======================*/
type Props = {
    item: TransactionBatchesItems
    totalLabel: string
    qtyPriceLabel: string
    uploadsLoader?: ImageLoader

    selected: boolean
    disabled: boolean

    isClosed?: boolean
    isPendingVoid?: boolean
    isApprovedVoid?: boolean
    isPendingPaid?: boolean
    isPaid?: boolean

    onToggle: (it: TransactionBatchesItems) => void
}

/* =========================
 * Component
 * =======================*/
const MotionCard = motion(Card)

const RightContainerBatchDetailRowBase: React.FC<Props> = ({
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
        <MotionCard
            variant="outlined"
            whileTap={disabled ? undefined : { scale: 0.99 }}
            onClick={disabled ? undefined : () => onToggle(item)}
            aria-disabled={disabled || undefined}
            role="button"
            tabIndex={disabled ? -1 : 0}
            onKeyDown={(e) => {
                if (disabled) return
                if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onToggle(item) }
            }}
            sx={(t) => ({
                borderColor: disabled ? t.palette.divider : (selected ? t.palette.primary.main : t.palette.divider),
                boxShadow: disabled ? 'none' : (selected ? '0 0 0 3px rgba(99,102,241,.25)' : '0 2px 8px rgba(0,0,0,0.04)'),
                cursor: disabled ? 'not-allowed' : 'pointer',
                opacity: disabled ? 0.85 : 1,
                // glow halus saat selected
                '&::before': (!disabled && selected)
                    ? { content: '""', position: 'absolute', inset: -1, borderRadius: 8, background: GRADIENT, filter: 'blur(12px)', opacity: .7, zIndex: -1 }
                    : {},
                willChange: 'transform',
                contain: 'layout paint style',
            })}
        >
            <Box sx={{ position: 'relative' }}>
                <ImgWithSkeleton
                    src={ph(item.product?.name, item.product?.image)}
                    alt={item.product?.name || 'Item'}
                    loader={uploadsLoader}
                    disabled={disabled}
                />

                {/* Status chips */}
                {isPendingVoid && (
                    <StatusChip
                        size="small"
                        label="Pending Void"
                        sx={(t) => ({ right: 8, bgcolor: t.palette.warning.main, color: t.palette.warning.contrastText })}
                        title={item.void?.time_created ? `Diajukan: ${new Date(item.void.time_created).toLocaleString('id-ID')}` : undefined}
                    />
                )}
                {isApprovedVoid && (
                    <StatusChip
                        size="small"
                        label="Voided"
                        sx={(t) => ({ right: 8, bgcolor: t.palette.error.main, color: t.palette.error.contrastText })}
                        title={item.void?.time_created ? `Disetujui: ${new Date(item.void.time_created).toLocaleString('id-ID')}` : undefined}
                    />
                )}
                {isClosed && (
                    <StatusChip
                        size="small"
                        label="Selesai"
                        sx={(t) => ({ right: 8, bgcolor: t.palette.error.main, color: t.palette.error.contrastText })}
                        title="Transaksi Ditutup"
                    />
                )}
                {isPendingPaid && (
                    <StatusChip
                        size="small"
                        label="Pending Paid"
                        sx={(t) => ({ left: 8, bgcolor: t.palette.info.main, color: t.palette.info.contrastText })}
                        title="Item ini tercakup bill yang masih pending/menunggu pembayaran."
                    />
                )}
                {isPaid && (
                    <StatusChip
                        size="small"
                        label="Success Paid"
                        sx={(t) => ({ left: 8, bgcolor: t.palette.success.main, color: t.palette.success.contrastText })}
                        title="Item ini tercakup bill yang sudah ditandai terbayar."
                    />
                )}

                {/* Price chip kiri bawah */}
                <PriceChip
                    size="small"
                    icon={<LocalOfferRoundedIcon sx={{ fontSize: 16, color: 'inherit' }} />}
                    label={totalLabel}
                />

                {/* Check bulat kanan bawah */}
                <Box
                    aria-label={selected ? 'dipilih' : 'tidak dipilih'}
                    sx={(t) => ({
                        position: 'absolute', bottom: 8, right: 8,
                        width: 20, height: 20, borderRadius: '50%',
                        border: '2px solid', borderColor: selected ? t.palette.success.main : t.palette.divider,
                        bgcolor: selected ? t.palette.success.main : t.palette.background.paper,
                        color: '#fff', display: 'grid', placeItems: 'center', flexShrink: 0,
                        boxShadow: selected ? 1 : 0, opacity: disabled ? 0.7 : 1,
                    })}
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
        </MotionCard>
    )
}

/* =========================
 * Memo comparator: rerender hanya kalau berubah beneran
 * =======================*/
const propsEqual = (a: Props, b: Props) => {
    return (
        a.item.id === b.item.id &&
        a.item.note === b.item.note &&
        a.item.product?.name === b.item.product?.name &&
        a.item.product?.image === b.item.product?.image &&
        a.item.variant?.name === b.item.variant?.name &&
        a.totalLabel === b.totalLabel &&
        a.qtyPriceLabel === b.qtyPriceLabel &&
        a.selected === b.selected &&
        a.disabled === b.disabled &&
        a.isClosed === b.isClosed &&
        a.isPendingVoid === b.isPendingVoid &&
        a.isApprovedVoid === b.isApprovedVoid &&
        a.isPendingPaid === b.isPendingPaid &&
        a.isPaid === b.isPaid &&
        a.uploadsLoader === b.uploadsLoader && // asumsi stable dari parent
        a.onToggle === b.onToggle              // penting: parent harus useCallback
    )
}

const RightContainerBatchDetailRow = React.memo(RightContainerBatchDetailRowBase, propsEqual)
RightContainerBatchDetailRow.displayName = 'RightContainerBatchDetailRow'

export default RightContainerBatchDetailRow
