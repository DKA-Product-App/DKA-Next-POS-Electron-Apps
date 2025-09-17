'use client'

import * as React from 'react'
import {
    Box, Button, Chip, Divider, Stack, Tab, Tabs, Typography, Paper,
    Dialog, DialogContent
} from '@mui/material'
import { motion } from 'framer-motion'
import PrintRounded from '@mui/icons-material/PrintRounded'
import PerfectScrollbar from 'react-perfect-scrollbar'
import 'react-perfect-scrollbar/dist/css/styles.css'
import Image, { ImageLoader } from 'next/image'
import Skeleton from '@mui/material/Skeleton'

/* ===== Types (samakan dengan project kamu) ===== */
export type Name = { first_name: string; last_name?: string }
export type Reference = { id: string; name?: Name; username?: string }
export type OrderType = { id: string; code: string; name: string }
export type Table = { id: string; code: string; name: string }
export type Product = { id: string; name: string; image?: string; category?: any[] }
export type Variant = { id: string; code?: string; name?: string; price?: string }
export type Item = { id: string; qty: number; price: string; sub_total: string; note?: string | null; reference?: Reference | null; product: Product; variant?: Variant }
export type Batch = { id: string; batch: number; items: Item[] }
export type TransactionHeader = {
    id?: string; invoice?: string; total?: string; time_closed?: string | null;
    reference?: Reference; shift?: { id?: string; name?: string }; order_type?: OrderType; table?: Table
}

const PURPLE_GRAD = 'linear-gradient(90deg, #6366F1, #8B5CF6 35%, #EC4899)'
const ACCENT = 'linear-gradient(90deg, #7C3AED, #6366F1 45%, #8B5CF6)'

/* ===== IMG helpers ===== */
const uploadsLoader: ImageLoader = ({ src }) => {
    if (src?.startsWith('uploads:///')) {
        const base = process.env.NEXT_PUBLIC_UPLOADS_BASE_URL || ''
        const path = src.replace('uploads:///', '').replace(/^\/+/, '')
        return base ? `${base.replace(/\/+$/, '')}/${path}` : `/${path}`
    }
    return src
}
const toUploadUrl = (s?: string) =>
    (!s ? undefined : /^(uploads|http|https):\/\//i.test(s) ? s : `uploads:///${s.replace(/^\/+/, '')}`)
const ph = (name?: string, img?: string) =>
    toUploadUrl(img) ?? `https://placehold.co/600x400/png?text=${encodeURIComponent(name || 'Item')}`

const ImgWithSkeleton: React.FC<{ src: string; alt: string; loader?: ImageLoader }> = ({ src, alt, loader }) => {
    const [loaded, setLoaded] = React.useState(false)
    const [err, setErr] = React.useState(false)
    const finalSrc = err ? 'https://placehold.co/600x400/png?text=No%20Image' : src
    return (
        <Box sx={{ position: 'relative', width: '100%', aspectRatio: '4 / 3', bgcolor: 'action.hover', overflow: 'hidden', borderRadius: 1 }}>
            {!loaded && <Skeleton variant="rectangular" sx={{ position: 'absolute', inset: 0 }} />}
            <Image
                loader={loader}
                src={finalSrc}
                alt={alt}
                fill
                unoptimized
                sizes="96px"
                onLoad={() => setLoaded(true)}
                onError={() => { setErr(true); setLoaded(true) }}
                style={{ objectFit: 'cover', opacity: loaded ? 1 : 0, transition: 'opacity .2s ease' }}
            />
            <Box
                sx={{
                    position: 'absolute', inset: 0, pointerEvents: 'none',
                    background: (t) => `linear-gradient(to bottom, ${t.palette.action.hover}00 0%, ${t.palette.action.hover}40 70%, ${t.palette.action.hover}66 100%)`
                }}
            />
        </Box>
    )
}

/* ===== Printer grouping ===== */
type PrinterBucket = { id: string; name: string; description: string; items: Item[] }

function categoriesForPrinter(it: Item, printerId: string): string {
    const cats: any[] = Array.isArray((it as any)?.product?.category) ? (it as any).product.category : []
    const names: string[] = []
    cats.forEach(c => {
        const printers: any[] = Array.isArray(c?.printer) ? c.printer : []
        const hit = printers.some((p: any) => String(p?.id) === printerId)
        if (hit && c?.name) names.push(String(c.name))
    })
    return names.length ? names.join(', ') : ''
}

function groupItemsByPrinter(items: Item[]): PrinterBucket[] {
    const map = new Map<string, PrinterBucket>()
    items.forEach(it => {
        const cats: any[] = Array.isArray((it as any)?.product?.category) ? (it as any).product.category : []
        const seen = new Set<string>()
        cats.forEach(c => {
            const printers: any[] = Array.isArray(c?.printer) ? c.printer : []
            printers.forEach(p => {
                const pid = String(p?.id ?? '')
                if (!pid || seen.has(pid)) return
                seen.add(pid)
                const name = String(p?.name ?? pid)
                const description = String(p?.description ?? pid)
                const bucket = map.get(pid) ?? { id: pid, name, description, items: [] }
                bucket.items.push(it)
                map.set(pid, bucket)
            })
        })
    })
    return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name))
}

/* ===== Komponen ===== */
type Props = { header: TransactionHeader; batch: Batch }
const MotionItem = motion(Paper)

const LeftContainerBatchPrintChecker: React.FC<Props> = ({ header, batch }) => {
    // ganti anchorEl ➜ boolean open
    const [open, setOpen] = React.useState(false)

    const buckets = React.useMemo(() => groupItemsByPrinter(batch.items || []), [batch.items])
    const [tab, setTab] = React.useState(0)
    React.useEffect(() => { if (open) setTab(0) }, [open])

    const handleOpen = (e: React.MouseEvent<HTMLElement>) => {
        e.stopPropagation()
        setOpen(true)
    }
    const handleClose = () => setOpen(false)

    const handlePrintOne = (b: PrinterBucket) => {
        const payload = [{ id: b.id, header, items: b.items }]
        // @ts-ignore
        console.log('print one:', payload)
    }

    // shield biar klik di dalam dialog nggak “nyetrum” parent
    const stop = (e: React.SyntheticEvent) => e.stopPropagation()

    return (
        <>
            {/* Trigger */}
            <Chip
                size="small"
                icon={<PrintRounded />}
                label="Checker"
                color="primary"
                variant="outlined"
                clickable
                onClick={handleOpen}
                onMouseDown={(e) => e.stopPropagation()}
                disabled={buckets.length === 0}
                sx={{ ml: 'auto' }}
            />

            {/* Dialog modal */}
            <Dialog
                open={open}
                onClose={handleClose}
                fullWidth
                maxWidth="md"
                PaperProps={{
                    sx: {
                        p: 0,
                        display: 'flex',
                        flexDirection: 'column',
                        maxHeight: '80vh'
                    }
                }}
            >
                {/* Shield wrapper */}
                <Box
                    role="presentation"
                    onMouseDown={stop}
                    onClick={stop}
                    onKeyDown={stop}
                    sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}
                >
                    {/* Header + Tabs */}
                    <Box sx={{ px: 1.25, pt: 1, pb: 0.5 }}>
                        <Typography variant="subtitle2" fontWeight={800}>
                            Cetak Checker • #{header.invoice} • Batch {batch.batch}
                        </Typography>
                    </Box>
                    <Tabs
                        value={tab}
                        onChange={(_, v) => setTab(v)}
                        variant="scrollable"
                        scrollButtons="auto"
                        sx={{ px: 1 }}
                    >
                        {buckets.map(b => <Tab key={b.id} label={b.description || b.name} />)}
                    </Tabs>
                    <Divider />

                    {/* Body */}
                    <DialogContent sx={{ p: 0, flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
                        <Box sx={{ flex: 1, minHeight: 0 }}>
                            {buckets.length === 0 ? (
                                <Box sx={{ display: 'grid', placeItems: 'center', height: '100%', px: 2, py: 4, color: 'text.secondary' }}>
                                    <Typography variant="body2">Tidak ada item yang terkait printer.</Typography>
                                </Box>
                            ) : (
                                buckets.map((b, i) => (
                                    <Box key={b.id} role="tabpanel" hidden={tab !== i} sx={{ height: '100%' }}>
                                        {tab === i && (
                                            <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                                                <PerfectScrollbar options={{ suppressScrollX: true }}>
                                                    <Stack spacing={1.25} sx={{ px: 1.25, py: 1.25 }}>
                                                        {b.items.map((it) => {
                                                            const cat = categoriesForPrinter(it, b.id)
                                                            const imgSrc = ph(it.product?.name, it.product?.image)
                                                            return (
                                                                <MotionItem
                                                                    key={it.id}
                                                                    variant="outlined"
                                                                    initial={{ opacity: 0, y: 4 }}
                                                                    animate={{ opacity: 1, y: 0 }}
                                                                    transition={{ duration: 0.18 }}
                                                                    whileTap={{ scale: 0.995 }}
                                                                    onMouseDown={stop}
                                                                    onClick={stop}
                                                                    sx={{
                                                                        p: 1.25,
                                                                        borderRadius: 2,
                                                                        position: 'relative',
                                                                        overflow: 'hidden',
                                                                        display: 'flex',
                                                                        alignItems: 'center',
                                                                        gap: 1.25,
                                                                        border: '1px solid',
                                                                        borderColor: 'divider',
                                                                        bgcolor: 'background.paper',
                                                                        boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
                                                                        transition: (t) => t.transitions.create(['box-shadow', 'transform', 'border-color'], {
                                                                            duration: t.transitions.duration.shorter
                                                                        }),
                                                                        '&:hover': {
                                                                            transform: 'translateY(-1px)',
                                                                            borderColor: 'primary.outlinedBorder',
                                                                            boxShadow: '0 12px 28px rgba(0,0,0,0.12)',
                                                                        },
                                                                        '&::before': {
                                                                            content: '""',
                                                                            position: 'absolute',
                                                                            left: 0, top: 0, bottom: 0,
                                                                            width: 4,
                                                                            borderTopLeftRadius: 8,
                                                                            borderBottomLeftRadius: 8,
                                                                            background: ACCENT,
                                                                        },
                                                                        '&::after': {
                                                                            content: '""',
                                                                            position: 'absolute',
                                                                            inset: -2,
                                                                            borderRadius: 10,
                                                                            background: ACCENT,
                                                                            filter: 'blur(14px)',
                                                                            opacity: 0,
                                                                            transition: 'opacity .2s ease',
                                                                            zIndex: -1
                                                                        },
                                                                        '&:hover::after': { opacity: .18 }
                                                                    }}
                                                                >
                                                                    {/* Thumb */}
                                                                    <Box sx={{ width: 84, flexShrink: 0 }}>
                                                                        <ImgWithSkeleton loader={uploadsLoader} src={imgSrc} alt={it.product?.name || 'item'} />
                                                                    </Box>

                                                                    {/* Info */}
                                                                    <Stack sx={{ minWidth: 0, flex: 1 }}>
                                                                        <Typography variant="subtitle1" fontWeight={800} noWrap>
                                                                            {it.product?.name ?? '-'}
                                                                        </Typography>
                                                                        <Typography variant="body2" color="text.secondary" noWrap>
                                                                            {cat || 'Tanpa kategori'} {it.variant?.name ? `• ${it.variant.name}` : ''}
                                                                        </Typography>
                                                                    </Stack>

                                                                    {/* Qty */}
                                                                    <Chip
                                                                        size="small"
                                                                        label={`× ${it.qty}`}
                                                                        sx={{ fontWeight: 800, background: PURPLE_GRAD, color: '#fff' }}
                                                                    />
                                                                </MotionItem>
                                                            )
                                                        })}
                                                    </Stack>
                                                </PerfectScrollbar>

                                                {/* Footer per-tab */}
                                                <Divider />
                                                <Box sx={{ p: 1, display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                                                    <Button
                                                        variant="contained"
                                                        size="small"
                                                        startIcon={<PrintRounded />}
                                                        onClick={() => handlePrintOne(b)}
                                                    >
                                                        Print
                                                    </Button>
                                                </Box>
                                            </Box>
                                        )}
                                    </Box>
                                ))
                            )}
                        </Box>
                    </DialogContent>

                    {/* Footer global */}
                    <Divider />
                    <Box sx={{ p: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 1 }}>
                        <Typography variant="caption" color="text.secondary" sx={{ px: .5 }}>
                            Total printer: {buckets.length}
                        </Typography>
                    </Box>
                </Box>
            </Dialog>
        </>
    )
}

export default React.memo(LeftContainerBatchPrintChecker)
