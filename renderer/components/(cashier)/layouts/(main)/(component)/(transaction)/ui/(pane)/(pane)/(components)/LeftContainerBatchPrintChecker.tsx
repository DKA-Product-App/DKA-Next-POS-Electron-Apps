'use client'

import * as React from 'react'
import {
    Box, Button, Chip, Divider, Stack, Tab, Tabs, Typography, Paper,
    Dialog, DialogContent, Tooltip
} from '@mui/material'
import { motion, AnimatePresence } from 'framer-motion'
import PrintRounded from '@mui/icons-material/PrintRounded'
import DoneAllRounded from '@mui/icons-material/DoneAllRounded'
import AutorenewRounded from '@mui/icons-material/AutorenewRounded'
import CheckCircleRounded from '@mui/icons-material/CheckCircleRounded'
import ErrorOutlineRounded from '@mui/icons-material/ErrorOutlineRounded'
import PendingActionsRounded from '@mui/icons-material/PendingActionsRounded'
import PerfectScrollbar from 'react-perfect-scrollbar'
import 'react-perfect-scrollbar/dist/css/styles.css'
import { NoteAltRounded } from '@mui/icons-material'
import {Transaction, TransactionBatches, TransactionBatchesItems} from "../../../types/api.transaction.type";
import {ImgWithSkeleton} from "../../../../../../../../../../utils/ImageProcessingIPC";

const PURPLE_GRAD = 'linear-gradient(90deg, #6366F1, #8B5CF6 35%, #EC4899)'
const ACCENT = 'linear-gradient(90deg, #7C3AED, #6366F1 45%, #8B5CF6)'

/* ===== Void helpers ===== */
const isApprovedVoid = (it: TransactionBatchesItems) => Boolean(it?.void) && it.void!.is_approved === true
const isPendingVoid = (it: TransactionBatchesItems) => Boolean(it?.void) && it.void!.is_approved !== true

/* ===== Printer grouping ===== */
type PrinterBucket = { id: string; name: string; description: string; items: TransactionBatchesItems[] }

function categoriesForPrinter(it: TransactionBatchesItems, printerId: string): string {
    const cats: any[] = Array.isArray((it as any)?.product?.category) ? (it as any).product.category : []
    const names: string[] = []
    cats.forEach(c => {
        const printers: any[] = Array.isArray(c?.printer) ? c.printer : []
        const hit = printers.some((p: any) => String(p?.id) === printerId)
        if (hit && c?.name) names.push(String(c.name))
    })
    return names.length ? names.join(', ') : ''
}

function groupItemsByPrinter(items: TransactionBatchesItems[]): PrinterBucket[] {
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

/* ===== Merge helpers (UI only) ===== */
type MergedItem = { sample: TransactionBatchesItems; qty: number; hasPending: boolean }
const keyOf = (it: TransactionBatchesItems) => `${it.product?.id ?? ''}::${it.variant?.id ?? it.product?.id ?? ''}`

function mergeItemsByVariant(items: TransactionBatchesItems[]): MergedItem[] {
    const rec = items.reduce((acc, it) => {
        const key = keyOf(it)
        const cur = acc[key]
        const q = Number(it.qty ?? 0)
        const pending = isPendingVoid(it)
        acc[key] = cur
            ? { sample: cur.sample, qty: cur.qty + q, hasPending: cur.hasPending || pending }
            : { sample: it, qty: q, hasPending: pending }
        return acc
    }, {} as Record<string, MergedItem>)
    return Object.values(rec)
}

/* ===== Komponen ===== */
type Props = { transaction: Transaction; batch: TransactionBatches }
const MotionItem = motion(Paper)

const LeftContainerBatchPrintChecker: React.FC<Props> = ({ transaction, batch }) => {
    const [open, setOpen] = React.useState(false)

    // ⬇️ hide items yang approved void, tampilkan normal + pending
    const buckets = React.useMemo(() => {
        const visible = (batch.items || []).filter(it => !isApprovedVoid(it))
        return groupItemsByPrinter(visible)
    }, [batch.items])

    const [tab, setTab] = React.useState(0)
    React.useEffect(() => { if (open) setTab(0) }, [open])

    // Loading & status
    const [isLoading, setLoading] = React.useState(false)
    const [isLoadingAll, setLoadingAll] = React.useState(false)
    const [statusMap, setStatusMap] = React.useState<Record<string, { type: 'success' | 'error'; text: string } | undefined>>({})

    const stop = (e: React.SyntheticEvent) => e.stopPropagation()
    const handleOpen = (e: React.MouseEvent<HTMLElement>) => { e.stopPropagation(); setOpen(true) }
    const handleClose = () => setOpen(false)

    const showStatus = (id: string, type: 'success' | 'error', text: string, ms = 2500) => {
        setStatusMap(prev => ({ ...prev, [id]: { type, text } }))
        ms > 0 ? setTimeout(() => setStatusMap(prev => ({ ...prev, [id]: undefined })), ms) : undefined
    }

    // === PRINT (tab aktif) ===
    const handlePrintCurrent = () => {
        const bucket = buckets[tab]
        if (!bucket) return
        const itemIds = bucket.items.map(it => String((it as any).id))
        const payload = { printer: bucket.id, batch: batch.id, invoice: transaction.invoice, itemIds, merge_variant: true }

        setLoading(true)
        // @ts-ignore
        window.api.invoke('api.transaction.batch:print', payload)
            .then((res: any) => { setLoading(false); showStatus(bucket.id, 'success', `${res.msg}`) })
            .catch((err: any) => { setLoading(false); showStatus(bucket.id, 'error', `${err?.msg ?? 'Gagal Mencetak. Printer Offline / Error.'}`) })
    }

    // === PRINT ALL (semua tab) ===
    const handlePrintAll = () => {
        const bucketsToPrint = buckets.filter(b => (b.items?.length ?? 0) > 0)
        if (!bucketsToPrint.length) return

        setLoadingAll(true)
        const tasks = bucketsToPrint.map(b => {
            const itemIds = b.items.map(it => String((it as any).id))
            const payload = { printer: b.id, batch: batch.id, invoice: transaction.invoice, itemIds, merge_variant: true }
            // @ts-ignore
            return window.api.invoke('api.transaction.batch:print', payload)
                .then((res: any) => { showStatus(b.id, 'success', `${res.msg}`); return { ok: true, id: b.id } })
                .catch((err: any) => { showStatus(b.id, 'error', `${err?.msg ?? 'Gagal Mencetak. Printer Offline / Error.'}`); return { ok: false, id: b.id } })
        })

        Promise.all(tasks).then(() => setLoadingAll(false))
    }

    const currentBucket = buckets[tab]

    return (
        <>
            {/* Trigger */}
            <Chip
                size="small"
                icon={<PrintRounded />}
                label={`Cetak Checker (${batch.batch})`}
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
                PaperProps={{ sx: { p: 0, display: 'flex', flexDirection: 'column', maxHeight: '80vh' } }}
            >
                {/* Shield wrapper */}
                <Box role="presentation" onMouseDown={stop} onClick={stop} onKeyDown={stop} sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                    {/* Header + Tabs */}
                    <Box sx={{ px: 1.25, pt: 1, pb: 0.5 }}>
                        <Typography variant="subtitle2" fontWeight={800}>
                            Cetak Checker • #{transaction.invoice} • Batch {batch.batch}
                        </Typography>
                    </Box>
                    <Tabs value={tab} onChange={(_, v) => setTab(v)} variant="scrollable" scrollButtons="auto" sx={{ px: 1 }}>
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
                                                <PerfectScrollbar options={{ suppressScrollX: true, wheelPropagation: false }}>
                                                    <Stack spacing={1.25} sx={{ px: 1.25, py: 1.25 }}>
                                                        {mergeItemsByVariant(b.items).map(({ sample: it, qty, hasPending }) => {
                                                            const cat = categoriesForPrinter(it, b.id)
                                                            return (
                                                                <MotionItem
                                                                    key={`${it.product?.id ?? ''}-${it.variant?.id ?? 'novar'}`}
                                                                    variant="outlined"
                                                                    initial={{ opacity: 0, y: 4 }}
                                                                    animate={{ opacity: 1, y: 0 }}
                                                                    transition={{ duration: 0.18 }}
                                                                    whileTap={{ scale: 0.995 }}
                                                                    onMouseDown={stop}
                                                                    onClick={stop}
                                                                    sx={{
                                                                        p: 1.25, borderRadius: 2, position: 'relative', overflow: 'hidden',
                                                                        display: 'flex', alignItems: 'center', gap: 1.25,
                                                                        border: '1px solid', borderColor: 'divider',
                                                                        bgcolor: 'background.paper',
                                                                        boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
                                                                        transition: (t) => t.transitions.create(['box-shadow', 'transform', 'border-color'], { duration: t.transitions.duration.shorter }),
                                                                        '&:hover': { transform: 'translateY(-1px)', borderColor: 'primary.outlinedBorder', boxShadow: '0 12px 28px rgba(0,0,0,0.12)' },
                                                                        '&::before': { content: '""', position: 'absolute', left: 0, top: 0, bottom: 0, width: 4, borderTopLeftRadius: 8, borderBottomLeftRadius: 8, background: ACCENT },
                                                                        '&::after': { content: '""', position: 'absolute', inset: -2, borderRadius: 10, background: ACCENT, filter: 'blur(14px)', opacity: 0, transition: 'opacity .2s ease', zIndex: -1 },
                                                                        '&:hover::after': { opacity: .18 }
                                                                    }}
                                                                >
                                                                    {/* Thumb */}
                                                                    <Box sx={{ width: 84, flexShrink: 0 }}>
                                                                        <ImgWithSkeleton path={it.product?.image ?? null} alt={it.product?.name ?? ''} />
                                                                    </Box>

                                                                    {/* Info */}
                                                                    <Stack sx={{ minWidth: 0, flex: 1 }}>
                                                                        <Typography variant="subtitle1" fontWeight={800} noWrap>
                                                                            {it.product?.name ?? '-'}
                                                                        </Typography>

                                                                        {/* Kategori • Variant • Pending Void (inline, tanpa chip) */}
                                                                        <Stack
                                                                            direction="row"
                                                                            alignItems="center"
                                                                            spacing={0.75}
                                                                            sx={{ minWidth: 0, flexWrap: 'nowrap' }}
                                                                        >
                                                                            {/* Kategori + Variant sebagai teks biasa */}
                                                                            <Typography
                                                                                variant="body2"
                                                                                color="text.secondary"
                                                                                noWrap
                                                                                sx={{ minWidth: 0, maxWidth: '100%' }}
                                                                            >
                                                                                {cat || 'Tanpa kategori'}
                                                                                {it.variant?.name ? ` • ${it.variant.name}` : ''}
                                                                            </Typography>

                                                                            {/* Pending Void inline (ukuran sama seperti note) */}
                                                                            {hasPending && (
                                                                                <Stack
                                                                                    direction="row"
                                                                                    alignItems="center"
                                                                                    spacing={0.25}
                                                                                    sx={{ ml: 0.5, flexShrink: 0 }}
                                                                                    title={it.void?.time_created ? `Diajukan: ${new Date(it.void.time_created).toLocaleString('id-ID')}` : undefined}
                                                                                >
                                                                                    <PendingActionsRounded
                                                                                        sx={(t) => ({ fontSize: 16, color: t.palette.warning.main })}
                                                                                    />
                                                                                    <Typography
                                                                                        variant="body2"               // ⬅️ sama seperti note
                                                                                        sx={(t) => ({
                                                                                            color: t.palette.warning.main,
                                                                                            fontWeight: 700,
                                                                                            lineHeight: 1.3,
                                                                                            letterSpacing: .2,
                                                                                            textTransform: 'uppercase',
                                                                                        })}
                                                                                    >
                                                                                        Pending Void
                                                                                    </Typography>
                                                                                </Stack>
                                                                            )}
                                                                        </Stack>


                                                                        {/* Note merah + tooltip */}
                                                                        {Boolean(it.note?.trim()?.length) ? (
                                                                            <Box sx={{ mt: 0.25, display: 'flex', alignItems: 'flex-start', columnGap: 0.5, minWidth: 0 }}>
                                                                                <NoteAltRounded sx={(t) => ({ fontSize: 16, color: t.palette.error.main, mt: '1px', flexShrink: 0 })} />
                                                                                <Tooltip title={it.note} arrow placement="top-start">
                                                                                    <Typography
                                                                                        variant="body2"
                                                                                        sx={(t) => ({
                                                                                            color: t.palette.error.main,
                                                                                            fontWeight: 700,
                                                                                            lineHeight: 1.3,
                                                                                            whiteSpace: 'nowrap',
                                                                                            overflow: 'hidden',
                                                                                            textOverflow: 'ellipsis',
                                                                                            minWidth: 0,
                                                                                            cursor: 'help',
                                                                                        })}
                                                                                    >
                                                                                        {it.note}
                                                                                    </Typography>
                                                                                </Tooltip>
                                                                            </Box>
                                                                        ) : (
                                                                            <Typography variant="caption" sx={{ color: 'text.secondary', lineHeight: 1.2 }}>
                                                                                Tidak ada Catatan
                                                                            </Typography>
                                                                        )}
                                                                    </Stack>

                                                                    {/* Qty merged */}
                                                                    <Chip size="small" label={`× ${qty}`} sx={{ fontWeight: 800, background: PURPLE_GRAD, color: '#fff' }} />

                                                                </MotionItem>
                                                            )
                                                        })}
                                                    </Stack>
                                                </PerfectScrollbar>
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
                        {/* Status global mengikuti tab aktif */}
                        <Box sx={{ minHeight: 28, display: 'flex', alignItems: 'center' }}>
                            <AnimatePresence initial={false} mode="wait">
                                {currentBucket && statusMap[currentBucket.id] && (
                                    <Stack
                                        component={motion.div}
                                        key={`${currentBucket.id}-${statusMap[currentBucket.id]?.type}-${statusMap[currentBucket.id]?.text}`}
                                        direction="row"
                                        alignItems="center"
                                        spacing={0.75}
                                        initial={{ opacity: 0, y: 6, scale: 0.98 }}
                                        animate={{ opacity: 1, y: 0, scale: 1 }}
                                        exit={{ opacity: 0, y: -6, scale: 0.98 }}
                                        transition={{ type: 'spring', stiffness: 400, damping: 28, mass: 0.6 }}
                                        sx={{
                                            px: 1, py: 0.25, borderRadius: 1,
                                            bgcolor: (t) => statusMap[currentBucket.id]?.type === 'error' ? t.palette.error.main + '20' : t.palette.success.main + '20',
                                            border: '1px solid',
                                            borderColor: (t) => statusMap[currentBucket.id]?.type === 'error' ? t.palette.error.main + '55' : t.palette.success.main + '55',
                                        }}
                                    >
                                        {statusMap[currentBucket.id]?.type === 'error' ? <ErrorOutlineRounded fontSize="small" /> : <CheckCircleRounded fontSize="small" />}
                                        <Typography variant="body2" fontWeight={700} sx={{ color: (t) => statusMap[currentBucket.id]?.type === 'error' ? t.palette.error.main : t.palette.success.main, letterSpacing: 0.2 }}>
                                            {statusMap[currentBucket.id]?.text}
                                        </Typography>
                                    </Stack>
                                )}
                            </AnimatePresence>
                        </Box>

                        {/* Tombol kanan */}
                        <Stack direction="row" spacing={1}>
                            <Button
                                variant="outlined"
                                size="small"
                                startIcon={isLoading ? <AutorenewRounded /> : <PrintRounded />}
                                onClick={handlePrintCurrent}
                                disabled={!currentBucket || isLoading || isLoadingAll}
                            >
                                {isLoading ? 'Loading…' : 'Cetak'}
                            </Button>
                            <Button
                                variant="contained"
                                size="small"
                                startIcon={isLoadingAll ? <AutorenewRounded /> : <DoneAllRounded />}
                                onClick={handlePrintAll}
                                disabled={buckets.length === 0 || isLoadingAll || isLoading}
                            >
                                {isLoadingAll ? 'Mencetak Semua…' : 'Cetak Semua'}
                            </Button>
                        </Stack>
                    </Box>
                </Box>
            </Dialog>
        </>
    )
}

export default React.memo(LeftContainerBatchPrintChecker)
