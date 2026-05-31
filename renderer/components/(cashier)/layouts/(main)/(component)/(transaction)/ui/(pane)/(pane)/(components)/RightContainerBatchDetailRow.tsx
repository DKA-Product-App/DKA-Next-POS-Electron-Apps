'use client'

import * as React from 'react'
import { alpha, Box, Chip, IconButton, Paper, Stack, Tooltip, Typography } from '@mui/material'
import Image, { ImageLoader } from 'next/image'
import Skeleton from '@mui/material/Skeleton'
import { motion } from 'framer-motion'
import LocalOfferRoundedIcon from '@mui/icons-material/LocalOfferRounded'
import CheckRounded from '@mui/icons-material/CheckRounded'
import { NoteAltRounded } from '@mui/icons-material'
import LayersRounded from '@mui/icons-material/LayersRounded'

/** Status icons */
import PaidRounded from '@mui/icons-material/PaidRounded'
import HourglassBottomRounded from '@mui/icons-material/HourglassBottomRounded'
import GppBadRounded from '@mui/icons-material/GppBadRounded'          // voided
import PendingActionsRounded from '@mui/icons-material/PendingActionsRounded' // pending void
import LockRounded from '@mui/icons-material/LockRounded'               // closed
import CallSplitRounded from '@mui/icons-material/CallSplitRounded' // NEW: Split Icon

import dynamic from "next/dynamic"

const SplitQtyDialog = dynamic(() => import('./SplitQtyDialog'), { ssr: false })

import { ImgWithSkeleton, OverlayTone } from "../../../../../../../../../../utils/ImageProcessingIPC";
import { useGodModeProvider } from "../../../../../../../../context/GodModeProviderContext";
import { TransactionBatchItem } from "../../../../../../../../../../types/transaction/batch/transaction.batch.item.type";
import { useTx } from "../../context/TransactionContext";
import { useThemeCharger } from "../../../../../../../../../../contexts/ThemeCharger";
import SweetAlert2, { SweetAlert2Props } from "react-sweetalert2";

const MotionPaper = motion(Paper)


/** IconBadge — “chip” bulat: bg hitam (light) / putih (dark) */
type Tone = 'default' | 'primary' | 'success' | 'info' | 'warning' | 'error'
const StatusBadge: React.FC<{
    title: string; tone?: Tone; children: React.ReactNode; size?: number; iconSize?: number
}> = ({ title, tone = 'default', children, size = 36, iconSize = 22 }) => (
    <Tooltip title={title} arrow enterDelay={300}>
        <Box
            sx={(t) => {
                const tint = tone === 'default' ? t.palette.text.primary : (t.palette as any)[tone].main
                const bgSolid = t.palette.mode === 'light' ? t.palette.common.black : t.palette.common.white
                const borderCol = alpha(bgSolid, t.palette.mode === 'dark' ? 0.18 : 0.16)

                // ⬇️ IKON PUTIH di LIGHT MODE jika ada tone (paid/pending/void/etc)
                const iconColor =
                    t.palette.mode === 'light' && tone !== 'default'
                        ? t.palette.common.white
                        : tint

                return {
                    width: size, height: size, borderRadius: '50%',
                    display: 'grid', placeItems: 'center',
                    boxShadow: 1,
                    bgcolor: bgSolid,                // black (light) / white (dark)
                    color: iconColor,                // ⬅️ di-light: putih, di-dark: tint
                    border: '1px solid', borderColor: borderCol,
                    '> svg': { fontSize: iconSize },
                }
            }}
        >
            {children}
        </Box>
    </Tooltip>
)

import AddRounded from '@mui/icons-material/AddRounded'
import RemoveRounded from '@mui/icons-material/RemoveRounded'

type Props = {
    item: TransactionBatchItem
    totalLabel: string
    qtyPriceLabel: string
    uploadsLoader?: ImageLoader

    selected: boolean
    selectedGodMode?: boolean;
    disabled: boolean

    isClosed?: boolean
    isPendingVoid?: boolean
    isApprovedVoid?: boolean
    isPendingPaid?: boolean
    isPaid?: boolean
    onToggle: (it: TransactionBatchItem) => void;
    onToggleGod?: (it: TransactionBatchItem) => void
}

const GRADIENT = 'linear-gradient(90deg, #6366F1, #8B5CF6 35%, #EC4899)';

const RightContainerBatchDetailRow: React.FC<Props> = ({
    item, totalLabel, qtyPriceLabel, selected, selectedGodMode, disabled,
    isClosed, isPendingVoid, isApprovedVoid, isPendingPaid, isPaid,
    onToggle, onToggleGod,
}) => {
    const hasNote = Boolean(item.note?.trim()?.length)
    const { godMode } = useGodModeProvider()
    const { bumpReload } = useTx()
    const { mode } = useThemeCharger()
    const [splitSwal, setSplitSwal] = React.useState<SweetAlert2Props>({ show: false })
    /** Gambar rules:
     * Closed       : grayscale + GRAY overlay (override apapun)
     * Voided       : grayscale + RED overlay
     * Paid         : grayscale + GREEN overlay
     * Pending Void : normal + YELLOW overlay
     */
    const isClosedNow = Boolean(isClosed)
    const imgGray = isClosedNow || Boolean(isApprovedVoid || isPaid)
    const overlayGray = isClosedNow
    const overlayTone: OverlayTone =
        overlayGray ? null
            : isApprovedVoid ? 'error'
                : isPaid ? 'success'
                    : isPendingVoid ? 'warning'
                        : null

    const GRADIENT_TRIGGER = (!selectedGodMode) ? 'linear-gradient(90deg, #6366F1, #8B5CF6 35%, #EC4899)' : 'linear-gradient(90deg,rgba(180, 58, 58, 1) 0%, rgba(233, 34, 54, 1) 40%, rgba(253, 29, 29, 1) 50%, rgba(252, 93, 69, 1) 100%)'

    const [isSplitDialogOpen, setSplitDialogOpen] = React.useState(false)

    // Override toggle: if split mode, initialize to full remaining or toggle off
    // But mostly rely on manual qty adjustment or click = full/zero logic
    const handleCardClick = (e: React.MouseEvent) => {
        e.preventDefault()
        if (disabled) return
        onToggle(item)
    }


    return (
        <>
        <SweetAlert2 {...splitSwal} didClose={() => setSplitSwal((p) => ({ ...p, show: false }))} />
        <MotionPaper
            variant="outlined"
            whileTap={disabled ? undefined : { scale: 0.99 }}
            onClick={handleCardClick}

            // Right click (klik kanan)
            onContextMenu={(e) => {
                e.preventDefault()              // blok menu konteks bawaan
                if (godMode) return;
                if (disabled) return
                onToggleGod!(item)
            }}
            aria-disabled={disabled || undefined}
            sx={{
                borderRadius: 2, overflow: 'hidden', display: 'flex', flexDirection: 'column', position: 'relative',
                borderColor: disabled ? 'divider' : 'divider',
                boxShadow: disabled ? 'none' : (selected ? '0 0 0 3px rgba(99,102,241,.25)' : '0 2px 8px rgba(0,0,0,0.04)'),
                transition: (t) => t.transitions.create(['box-shadow', 'border-color', 'opacity'], { duration: t.transitions.duration.shorter }),
                cursor: disabled ? 'not-allowed' : 'pointer',
                opacity: disabled ? 0.9 : 1,
                '&::before': (!disabled && selected) ? { content: '""', position: 'absolute', inset: -1, borderRadius: 8, background: GRADIENT, filter: 'blur(12px)', opacity: .7, zIndex: -1 } : {},
            }}
        >
            <Box sx={{ position: 'relative' }}>
                {/* Gambar + overlay sesuai aturan */}
                <ImgWithSkeleton
                    path={item.product?.image ?? null}
                    alt={item.product?.name || 'Item'}
                    grayscale={imgGray}
                    overlayTone={overlayTone}
                    overlayGray={overlayGray}
                />

                {/* Kiri-atas: Payment */}
                <Stack direction="column" spacing={1} sx={{ position: 'absolute', top: 8, left: 8 }}>
                    {isPaid && (
                        <StatusBadge title="Sudah Terbayar" tone="success">
                            <PaidRounded />
                        </StatusBadge>
                    )}
                    {!isPaid && isPendingPaid && (
                        <StatusBadge title="Menunggu Pembayaran" tone="warning">
                            <HourglassBottomRounded />
                        </StatusBadge>
                    )}
                </Stack>

                {/* Kanan-atas: Closed + Void */}
                <Stack direction="column" spacing={1} sx={{ position: 'absolute', top: 8, right: 8, alignItems: 'flex-end' }}>
                    {isClosed && (
                        <StatusBadge title="Transaksi Ditutup" tone="error">
                            <LockRounded />
                        </StatusBadge>
                    )}
                    {isApprovedVoid && (
                        <StatusBadge title="Item Voided" tone="error">
                            <GppBadRounded />
                        </StatusBadge>
                    )}
                    {isPendingVoid && (
                        <StatusBadge title="Pengajuan Void (Pending)" tone="warning">
                            <PendingActionsRounded />
                        </StatusBadge>
                    )}
                </Stack>

                {/* Price chip kiri bawah */}
                <Chip
                    size="small"
                    icon={<LocalOfferRoundedIcon sx={{ fontSize: 16, color: 'inherit' }} />}
                    label={totalLabel}
                    sx={{ position: 'absolute', bottom: 8, left: 8, color: '#fff', background: GRADIENT, boxShadow: 1, '& .MuiChip-icon': { color: 'inherit' } }}
                />



                {/* SPLIT QTY CONTROL & Checkbox */}
                <Stack direction="row" spacing={1} alignItems="center" sx={{ position: 'absolute', bottom: 8, right: 8 }}>
                    {/* SPLIT ICON BUTTON */}
                    {!disabled && item.qty > 1 && (
                        <Box
                            sx={{
                                width: 28, height: 28, borderRadius: '50%',
                                bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider',
                                display: 'grid', placeItems: 'center', cursor: 'pointer',
                                boxShadow: 1, color: 'text.secondary',
                                '&:hover': { bgcolor: 'action.hover', color: 'primary.main' }
                            }}
                            onClick={(e) => {
                                e.stopPropagation() // Prevent card toggle
                                setSplitDialogOpen(true)
                            }}
                        >
                            <CallSplitRounded sx={{ fontSize: 18 }} />
                        </Box>
                    )}

                    {/* CHECKMARK */}
                    {!disabled ? (
                        <Box
                            aria-label={selected ? 'dipilih' : 'tidak dipilih'}
                            sx={{
                                width: 20, height: 20, borderRadius: '50%',
                                border: '2px solid', borderColor: selected ? 'success.main' : 'divider',
                                bgcolor: selected ? 'success.main' : 'background.paper',
                                color: '#fff', display: 'grid', placeItems: 'center', flexShrink: 0,
                                boxShadow: selected ? 1 : 0, opacity: disabled ? 0.7 : 1,
                            }}
                        >
                            {selected && <CheckRounded sx={{ fontSize: 14 }} />}
                        </Box>
                    ) : null}
                </Stack>
            </Box>

            <Box sx={{ p: 1.25, display: 'grid', gap: .5, flexGrow: 1 }}>
                <Typography
                    variant="h6"
                    fontWeight={800}
                    title={item.product?.name}
                    noWrap
                    sx={{ fontSize: '1rem', maxWidth: '100%', overflow: 'hidden', textOverflow: 'ellipsis' }}
                >
                    {item.product?.name}
                </Typography>

                <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap mt={0.5} sx={{ justifyContent: 'flex-start' }}>
                    {item.variant?.name ? (
                        <Chip
                            size="small"
                            label={item.variant.code}
                            sx={(t) => ({
                                px: 1,
                                bgcolor: t.palette.mode === 'light' ? t.palette.common.black : t.palette.common.white,
                                color: t.palette.mode === 'light' ? t.palette.common.white : t.palette.common.black,
                            })}
                        />
                    ) : null}
                    <Chip size="small" icon={<LayersRounded />} label={`${item.batch.batch}`} />
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



                {/* Dialog Component */}
                {isSplitDialogOpen && (
                    <SplitQtyDialog
                        open={isSplitDialogOpen}
                        onClose={() => setSplitDialogOpen(false)}
                        onConfirm={(qty) => {
                            window.api.invoke('api.transaction.batch.item:update.one', {
                                params: { id: item.id },
                                data: { split_qty: qty }
                            })
                                .then(() => {
                                    bumpReload()
                                    setSplitSwal({
                                        show: true,
                                        icon: 'success',
                                        theme: mode,
                                        title: 'Item di-split',
                                        text: `${qty} qty dipisah. Perbarui tagihan jika item sudah masuk bill.`,
                                        timer: 3500,
                                        showConfirmButton: false,
                                    })
                                })
                                .catch((err: unknown) => {
                                    console.error(err)
                                    let msg = 'Gagal split item'
                                    try {
                                        const e = err as { message?: string }
                                        if (e?.message) {
                                            const parsed = JSON.parse(e.message) as { msg?: string }
                                            msg = parsed?.msg ?? e.message
                                        }
                                    } catch { /* keep default */ }
                                    setSplitSwal({
                                        show: true,
                                        icon: 'error',
                                        theme: mode,
                                        title: 'Gagal split',
                                        text: msg,
                                        confirmButtonText: 'Tutup',
                                    })
                                })
                        }}
                        maxQty={item.qty} // Fallback to full qty
                        initialQty={1}    // Default to 1
                        itemName={item.product?.name}
                    />
                )}

                {/* Qty x Price — Total */}
                <Stack direction="row" alignItems="center" justifyContent="space-between" mt={1} sx={{ justifySelf: 'stretch', width: '100%' }}>
                    <Typography variant="body2" color="text.secondary">{qtyPriceLabel}</Typography>
                    <Typography variant="subtitle2" fontWeight={900}>{totalLabel}</Typography>
                </Stack>
            </Box>

            <Box sx={{ height: 3, background: GRADIENT_TRIGGER }} />
        </MotionPaper>
        </>
    )
}

export default React.memo(RightContainerBatchDetailRow)
