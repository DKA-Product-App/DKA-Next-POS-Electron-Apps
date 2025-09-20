'use client'

import * as React from 'react'
import PerfectScrollbar from 'react-perfect-scrollbar'
import 'react-perfect-scrollbar/dist/css/styles.css'
import {Box, Chip, Stack, Typography, Paper, Tooltip} from '@mui/material'
import Grid from '@mui/material/Grid'
import Image, { ImageLoader } from 'next/image'
import Skeleton from '@mui/material/Skeleton'
import { motion } from 'framer-motion'
import LocalOfferRoundedIcon from '@mui/icons-material/LocalOfferRounded'
import CheckRounded from '@mui/icons-material/CheckRounded'
import { useTx } from '../context/TransactionContext'
import { NoteAltRounded } from '@mui/icons-material'

/* ===== Types sync ===== */
export type Name = { first_name: string; last_name?: string }
export type Reference = { id: string; name?: Name; username?: string }
export type OrderType = { id: string; code: string; name: string }
export type Table = { id: string; code: string; name: string }
export type Product = { id: string; name: string; description?: string; image?: string }
export type Variant = { id: string; code?: string; name?: string; price?: string }
export type Item = { id: string; qty: number; price: string; sub_total: string; note?: string | null; reference?: Reference | null; product: Product; variant?: Variant, void?: { void_time: string; is_approved: boolean } | null; }

const MotionPaper = motion(Paper)
const GRADIENT = 'linear-gradient(90deg, #6366F1, #8B5CF6 35%, #EC4899)'
const rupiah = (n: number | string) => new Intl.NumberFormat('id-ID',{style:'currency',currency:'IDR',maximumFractionDigits:0}).format(typeof n==='string'?parseFloat(n):n)

const uploadsLoader: ImageLoader = ({ src }) => {
    if (src?.startsWith('uploads:///')) {
        const base = process.env.NEXT_PUBLIC_UPLOADS_BASE_URL || ''
        const path = src.replace('uploads:///', '').replace(/^\/+/, '')
        return base ? `${base.replace(/\/+$/, '')}/${path}` : `/${path}`
    }
    return src
}
const toUploadUrl = (s?: string) => (!s ? undefined : /^(uploads|http|https):\/\//i.test(s) ? s : `uploads:///${s.replace(/^\/+/, '')}`)
const ph = (name?: string, img?: string) => toUploadUrl(img) ?? `https://placehold.co/600x400/png?text=${encodeURIComponent(name || 'Item')}`

const ImgWithSkeleton: React.FC<{ src: string; alt: string; loader?: ImageLoader }> = ({ src, alt, loader }) => {
    const [loaded, setLoaded] = React.useState(false)
    const [err, setErr] = React.useState(false)
    const finalSrc = err ? 'https://placehold.co/600x400/png?text=No%20Image' : src
    return (
        <Box sx={{ position:'relative', width:'100%', aspectRatio:'4 / 3', bgcolor:'action.hover', overflow:'hidden' }}>
            {!loaded && <Skeleton variant="rectangular" sx={{ position:'absolute', inset:0 }} />}
            <Image loader={loader} src={finalSrc} alt={alt} fill unoptimized sizes="(max-width: 600px) 50vw, (max-width: 1200px) 25vw, 200px"
                   onLoad={()=>setLoaded(true)} onError={()=>{setErr(true); setLoaded(true)}} style={{objectFit:'cover', opacity:loaded?1:0, transition:'opacity .2s ease'}} />
            <Box sx={{ position:'absolute', inset:0, pointerEvents:'none', background:(t)=>`linear-gradient(to bottom, ${t.palette.action.hover}00 0%, ${t.palette.action.hover}40 70%, ${t.palette.action.hover}66 100%)` }} />
        </Box>
    )
}

const RightContainerBatchDetail: React.FC = () => {
    const { selectedBatchId, header, selectedItemIds, toggleItem, registerItems, reloadKey } = useTx()
    const [items, setItems] = React.useState<Item[]>([])
    const fetchSeqRef = React.useRef(0)

    React.useEffect(() => {
        if (!selectedBatchId) { setItems([]); return }

        // kosongkan dulu agar tidak "tercampur" secara visual
        setItems([])

        const seq = ++fetchSeqRef.current

        // @ts-ignore
        window.api.invoke('api.transaction.batch.item:read.all', { batch: selectedBatchId })
            .then((res: any) => {
                if (seq !== fetchSeqRef.current) return // abaikan respons usang
                const arr: Item[] = res?.data ?? []
                setItems(arr)
                registerItems(selectedBatchId, arr)
            })
            .catch(() => {
                if (seq !== fetchSeqRef.current) return
                setItems([])
            })
    }, [selectedBatchId, reloadKey])


    const isClosed = Boolean(header.time_closed)

    if (!selectedBatchId) return <Box sx={{ p:2, color:'text.secondary' }}>Pilih batch untuk melihat detail item…</Box>

    const hasNote = (it) => Boolean(it.note?.trim()?.length)
    // helper status
    const isPendingVoid = (it: Item) => Boolean(it?.void) && it.void!.is_approved !== true
    const isApprovedVoid = (it: Item) => Boolean(it?.void) && it.void!.is_approved === true


    return (
        <Box sx={{ flex:1, minHeight:0, px:1.5, height: '100%' }}>
            <PerfectScrollbar options={{ suppressScrollX: true, wheelPropagation: false }}>
                <Grid container spacing={1} sx={{ py: 1, pr: 2 }}>
                    {items.map(it => {
                        const selected = selectedItemIds.has(it.id)
                        const disabled = isClosed || isPendingVoid(it) || isApprovedVoid(it)
                        return (
                            <Grid key={it.id} size={{ xs: 12, sm: 12, md: 3, lg: 2 }}>
                                <MotionPaper
                                    variant="outlined"
                                    whileTap={disabled ? undefined : { scale: 0.99 }}
                                    onClick={disabled ? undefined : ()=>toggleItem(it)}
                                    aria-disabled={disabled || undefined}
                                    sx={{
                                        borderRadius:2, overflow:'hidden', display:'flex', flexDirection:'column', position:'relative',
                                        border:'2px solid',
                                        borderColor: disabled ? 'divider' : (selected ? 'primary.main' : 'divider'),
                                        boxShadow: disabled ? 'none' : (selected ? '0 0 0 3px rgba(99,102,241,.25)' : '0 2px 8px rgba(0,0,0,0.04)'),
                                        transition:(t)=>t.transitions.create(['box-shadow','border-color','opacity'],{duration:t.transitions.duration.shorter}),
                                        cursor: disabled ? 'not-allowed' : 'pointer',
                                        opacity: disabled ? 0.85 : 1,
                                        '&::before': (!disabled && selected) ? { content:'""', position:'absolute', inset:-1, borderRadius:8, background:GRADIENT, filter:'blur(12px)', opacity:.7, zIndex:-1 } : {},
                                    }}
                                >
                                    <Box sx={{ position:'relative' }}>
                                        <Box sx={{ filter: disabled ? 'grayscale(1) saturate(0) brightness(0.9)' : 'none' }}>
                                            <ImgWithSkeleton src={ph(it.product?.name, it.product?.image)} alt={it.product?.name || 'Item'} loader={uploadsLoader} />
                                        </Box>
                                        {/* Pending Void chip kanan atas */}
                                        {/* VOID chips kanan atas */}
                                        {isPendingVoid(it) && (
                                            <Chip
                                                size="small"
                                                label="Pending Void"
                                                sx={{
                                                    position: 'absolute', top: 8, right: 8,
                                                    fontWeight: 800,
                                                    bgcolor: 'warning.main',
                                                    color: 'warning.contrastText',
                                                    boxShadow: 1,
                                                    textTransform: 'uppercase',
                                                    letterSpacing: .2,
                                                }}
                                                title={it.void?.void_time ? `Diajukan: ${new Date(it.void.void_time).toLocaleString('id-ID')}` : undefined}
                                            />
                                        )}
                                        {isApprovedVoid(it) && (
                                            <Chip
                                                size="small"
                                                label="Voided"
                                                sx={{
                                                    position: 'absolute', top: 8, right: 8,
                                                    fontWeight: 800,
                                                    bgcolor: 'error.main',
                                                    color: 'error.contrastText',
                                                    boxShadow: 1,
                                                    textTransform: 'uppercase',
                                                    letterSpacing: .2,
                                                }}
                                                title={it.void?.void_time ? `Disetujui: ${new Date(it.void.void_time).toLocaleString('id-ID')}` : undefined}
                                            />
                                        )}

                                        {/* Price chip kiri bawah */}
                                        <Chip
                                            size="small"
                                            icon={<LocalOfferRoundedIcon sx={{ fontSize:16, color:'inherit' }} />}
                                            label={rupiah(Number(it.sub_total || it.price || 0))}
                                            sx={{ position:'absolute', bottom:8, left:8, color:'#fff', background:GRADIENT, boxShadow:1, '& .MuiChip-icon':{ color:'inherit' } }}
                                        />
                                        {/* Check bulat kanan bawah */}
                                        <Box
                                            aria-label={selected ? 'dipilih' : 'tidak dipilih'}
                                            sx={{
                                                position:'absolute', bottom:8, right:8,
                                                width: 20, height: 20, borderRadius: '50%',
                                                border: '2px solid',
                                                borderColor: selected ? 'success.main' : 'divider',
                                                bgcolor: selected ? 'success.main' : 'background.paper',
                                                color: '#fff', display:'grid', placeItems:'center', flexShrink:0,
                                                boxShadow: selected ? 1 : 0, opacity: disabled ? 0.7 : 1,
                                            }}
                                        >
                                            {selected && <CheckRounded sx={{ fontSize: 14 }} />}
                                        </Box>
                                    </Box>

                                    <Box sx={{ p: 1.25, display: 'grid', gap: .5, flexGrow: 1 }}>
                                        <Typography variant="h6" fontWeight={800} title={it.product?.name}>
                                            {it.product?.name}
                                        </Typography>

                                        <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap mt={0.5} sx={{ justifyContent: 'flex-start' }}>
                                            {it.variant?.name ? (
                                                <Chip
                                                    size="small"
                                                    label={it.variant.name}
                                                    sx={(t) => ({
                                                        px: 1,
                                                        bgcolor: t.palette.mode === 'light' ? t.palette.common.black : t.palette.common.white,
                                                        color: t.palette.mode === 'light' ? t.palette.common.white : t.palette.common.black,
                                                    })}
                                                />
                                            ) : null}
                                        </Stack>

                                        {/* Note / Catatan: ellipsis + tooltip, ikon sejajar baris pertama */}
                                        <Box
                                            sx={{
                                                mt: 0.5,
                                                minHeight: 22,
                                                display: 'flex',
                                                alignItems: 'flex-start',   // top-align biar ikon sejajar baris pertama
                                                columnGap: 0.5,
                                            }}
                                        >
                                            {hasNote(it) ? (
                                                <>
                                                    <NoteAltRounded
                                                        sx={(t) => ({
                                                            fontSize: 18,
                                                            color: t.palette.error.main,
                                                            mt: '2px',            // tweak baseline
                                                            flexShrink: 0,        // jangan ikut menyusut
                                                        })}
                                                    />
                                                    <Tooltip
                                                        title={it.note}
                                                        arrow
                                                        placement="top-start"
                                                    >
                                                        <Typography
                                                            variant="body2"
                                                            sx={(t) => ({
                                                                color: t.palette.error.main,
                                                                fontWeight: 700,
                                                                lineHeight: 1.3,
                                                                overflow: 'hidden',
                                                                textOverflow: 'ellipsis',  // ⬅️ tampil "…"
                                                                display: '-webkit-box',
                                                                WebkitLineClamp: 2,
                                                                WebkitBoxOrient: 'vertical',
                                                                whiteSpace: 'normal',
                                                                flex: 1,
                                                                minWidth: 0,               // ⬅️ wajib di flex container agar ellipsis jalan
                                                                cursor: 'help',            // hint ada tooltip
                                                            })}
                                                        >
                                                            {it.note}
                                                        </Typography>
                                                    </Tooltip>
                                                </>
                                            ) : (
                                                <Typography variant="caption" sx={{ color: 'text.secondary', lineHeight: 1.2 }}>
                                                    Tidak ada Catatan
                                                </Typography>
                                            )}
                                        </Box>


                                        {/* Qty x Price (kiri) — Total (kanan) saja yang tidak center */}
                                        <Stack
                                            direction="row"
                                            alignItems="center"
                                            justifyContent="space-between"
                                            mt={1}
                                            sx={{ justifySelf: 'stretch', width: '100%' }}
                                        >
                                            <Typography variant="body2" color="text.secondary">
                                                {`${it.qty} x ${rupiah(it.price)}`}
                                            </Typography>
                                            <Typography variant="subtitle2" fontWeight={900}>
                                                {rupiah(it.sub_total)}
                                            </Typography>
                                        </Stack>
                                    </Box>



                                    <Box sx={{ height:3, background:GRADIENT }}/>
                                </MotionPaper>
                            </Grid>
                        )
                    })}
                </Grid>
            </PerfectScrollbar>
        </Box>
    )
}

export default RightContainerBatchDetail
