'use client'

import * as React from 'react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import {
    Box,
    Button,
    Dialog,
    DialogContent,
    DialogTitle,
    IconButton,
    Stack,
    Typography
} from '@mui/material'
import AddRounded from '@mui/icons-material/AddRounded'
import CloseRounded from '@mui/icons-material/CloseRounded'
import DarkModeRounded from '@mui/icons-material/DarkModeRounded'
import LightModeRounded from '@mui/icons-material/LightModeRounded'
import FullscreenRounded from '@mui/icons-material/FullscreenRounded'
import FullscreenExitRounded from '@mui/icons-material/FullscreenExitRounded'
import dynamic from 'next/dynamic'
import { useTheme } from '@mui/material/styles'
import { useThemeCharger } from '../../../../../../../../../contexts/ThemeCharger'
import normalizeIpcError from '../../../../../../../../../helpers/electronMessageErrorEsctration'
import { useSession } from '../../../../../../../../../contexts/SessionProviderContext'
import { useFunctionKeyCtx } from '../../../../../../../../../contexts/FunctionKeyProviderContext'
import SweetAlert2, { SweetAlert2Props } from 'react-sweetalert2'
import { AxiosResponse } from 'axios'
import { useUserConfig } from '../../../../../../../../../contexts/UserConfigContext'
import { Transaction } from '../../../../../../../../../types/transaction/transaction.type'
import { TransactionBatchItem } from '../../../../../../../../../types/transaction/batch/transaction.batch.item.type'

// === Dynamically loaded pages ===
const Billing = dynamic(() => import('../../../../../../(select-product)'), { ssr: false })
const SelectTables = dynamic(() => import('../../../../../../(select-tables)'), { ssr: false })
const DiningModeWidget = dynamic(
    () => import('../../../../../../(select-product)/ui/(pane)/widgets/DiningModeWidget'),
    { ssr: false }
)

type Props = { onCreated?: () => void }
type Option = {
    id: string
    code: string
    icon: string
    name: string
    description?: string
    required_table_select?: boolean
}
type Item = any

/* ------ UI helpers ------ */
const CenterPane: React.FC<React.PropsWithChildren> = ({ children }) => (
    <Box sx={{ height: '100%', display: 'grid', placeItems: 'center', overflow: 'auto', px: 2 }}>
        <Box sx={{ width: '100%', maxWidth: 920, textAlign: 'center' }}>{children}</Box>
    </Box>
)

const DiningIntro: React.FC = () => (
    <Box sx={{ pt: 1.25, pb: 1 }}>
        <Typography variant="h6" fontWeight={900} sx={{ letterSpacing: 0.2 }}>
            Pilih Jenis Pesanan
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, lineHeight: 1.55 }}>
            Pilih mode untuk lanjut. <b>Dine In</b> wajib pilih meja; <b>Take Away</b> & <b>Online</b> langsung ke
            produk.
        </Typography>
    </Box>
)

/* ===== Void helpers ===== */
const isApprovedVoid = (it: TransactionBatchItem) => Boolean(it?.void) && it.void!.is_approved === true
const isPendingVoid = (it: TransactionBatchItem) => Boolean(it?.void) && it.void!.is_approved !== true

/* ===== Grouping helpers ===== */
type PrinterBucket = { id: string; name: string; description: string; items: TransactionBatchItem[] }

function categoriesForPrinter(it: TransactionBatchItem, printerId: string): string {
    const cats: any[] = Array.isArray(it?.product?.category) ? (it as any).product.category : []
    const names: string[] = []
    cats.forEach(c => {
        const printers: any[] = Array.isArray(c?.printer) ? c.printer : []
        const hit = printers.some((p: any) => String(p?.id) === printerId)
        if (hit && c?.name) names.push(String(c.name))
    })
    return names.length ? names.join(', ') : ''
}

function allTxItems(tx: Transaction): TransactionBatchItem[] {
    return tx.batches.flatMap(b => (Array.isArray(b.items) ? b.items : []))
}

function groupTxItemsByPrinter(tx: Transaction): PrinterBucket[] {
    const source = allTxItems(tx).filter(it => !isApprovedVoid(it))
    const map = new Map<string, PrinterBucket>()
    source.forEach(it => {
        const cats: any[] = Array.isArray((it as any)?.product?.category) ? (it as any).product.category : []
        const seen = new Set<string>()
        cats.forEach(c => {
            const printers: any[] = Array.isArray(c?.printer) ? c.printer : []
            printers.forEach(p => {
                const pid = String(p?.id ?? '')
                if (!pid || seen.has(pid)) return
                seen.add(pid)
                const name = String(p?.name ?? pid)
                const description = String(p?.description ?? name)
                const bucket = map.get(pid) ?? { id: pid, name, description, items: [] }
                bucket.items.push(it as Item)
                map.set(pid, bucket)
            })
        })
    })
    return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name))
}

/* ===== Idempotency helper ===== */
const buildRequestKey = (sessionId: string | number, refKey: number): string =>
    `tx:${sessionId}:ref:${refKey}`

const NewOrderModal: React.FC<Props> = ({ onCreated }) => {
    const [open, setOpen] = useState(false)
    const { Session } = useSession()
    const { key, seq } = useFunctionKeyCtx()
    const { config } = useUserConfig()
    const [swalProps, setSwalProps] = useState<SweetAlert2Props>({})

    // wizard data
    const [orderType, setOrderType] = useState<Option | undefined>(undefined)
    const needTable = !!orderType?.required_table_select
    const [tableId, setTableId] = useState<string | undefined>(undefined)
    const [orderSeed, setOrderSeed] = useState<number>(() => Date.now())

    // idempotency scope per modal-open
    const [refKey, setRefKey] = useState<number>(() => Date.now())
    const [submitting, setSubmitting] = useState(false)

    // wizard step: 0 = Mode, 1 = Table or Billing (depends), 2 = Billing (only if needTable)
    const steps = useMemo(
        () => (needTable ? ['Mode', 'Meja', 'Billing'] : ['Mode', 'Billing']),
        [needTable]
    )
    const [activeStep, setActiveStep] = useState(0)

    const [fullScreen, setFullScreen] = useState(false)
    // theme
    const theme = useTheme()
    const isDark =
        (theme.palette as any)?.mode === 'dark' || (theme.palette as any)?.colorScheme === 'dark'
    const { toggleMode } = useThemeCharger()

    /* ---------- open/close ---------- */
    const openDialog = useCallback(() => {
        setOpen(true)
        setOrderType(undefined)
        setTableId(undefined)
        setActiveStep(0)
        setOrderSeed(Date.now())
        setRefKey(prev => prev + 1) // naik 1 tiap open → scope baru
        setSubmitting(false)
    }, [])

    const closeDialog = useCallback(() => {
        setOpen(false)
        setOrderType(undefined)
        setTableId(undefined)
        setActiveStep(0)
        setSubmitting(false)
    }, [])

    // F2 toggle modal
    useEffect(() => {
        if (key === 'F2') {
            if (open) closeDialog()
            else openDialog()
        }
    }, [seq, key, open, openDialog, closeDialog])

    const buckets = (tx: Transaction) => groupTxItemsByPrinter(tx)

    const handlePrintAll = (tx: Transaction) => {
        const bucketsToPrint = buckets(tx).filter(b => (b.items?.length ?? 0) > 0)
        if (!bucketsToPrint.length) return

        const tasks = bucketsToPrint.map(b => {
            const itemIds = b.items.map(it => String((it as any).id))
            const payload = {
                printer: b.id,
                transaction: tx.id,
                invoice: tx.invoice,
                itemIds,
                merge_variant: true
            }
            // @ts-ignore
            return window.api
                .invoke('api.transaction:print', payload)
                .then(() => {
                    console.log({ ok: true, id: b.id })
                    return { ok: true, id: b.id }
                })
                .catch(err => {
                    console.error({ ok: false, id: b.id, err })
                    return { ok: false, id: b.id }
                })
        })

        Promise.all(tasks).then(() => null)
    }

    /* ---------- submit ---------- */
    const submitOrder = useCallback(
        (items: Item[]) => {
            if (!orderType?.id) {
                console.error('order_type belum dipilih')
                return
            }

            if (submitting) {
                console.warn('submitOrder: masih submitting, abaikan klik ganda')
                return
            }

            const sanitized = items
                .map((i: any) => {
                    const qty = Number.isFinite(Number(i?.qty)) ? Number(i.qty) : 0
                    const price = Number.isFinite(Number(i?.price)) ? Number(i.price) : 0
                    const safeQty = Math.max(1, Math.trunc(qty || 0))
                    const safePrice = Number.isFinite(price) ? price : 0

                    return {
                        reference: Session.id,
                        product: i?.variant?.product ?? null,
                        variant: i?.variant ?? null,
                        note: i?.note ?? null,
                        qty: safeQty,
                        price: safePrice,
                        sub_total: safePrice * safeQty
                    }
                })
                .filter((it: any) => it.variant && it.product && it.price > 0 && it.qty > 0)

            if (!sanitized.length) {
                console.warn('submitOrder: tidak ada item valid setelah sanitize')
                return
            }

            const request_key = buildRequestKey(String(Session.id), refKey)

            const payload = {
                request_key, // ⬅️ kirim ke backend untuk idempotent
                reference: { id: Session.id },
                branch: Session.branches,
                shift: Session.shift,
                order_type: { id: orderType.id },
                table: tableId ? { id: tableId } : undefined,
                invoice: Math.floor(10000 + Math.random() * 90000),
                batches: [
                    {
                        reference: { id: Session.id },
                        branch: Session.branches,
                        batch: 1,
                        items: sanitized
                    }
                ]
            }

            setSubmitting(true)

            // @ts-ignore
            window.api
                ?.invoke<any, AxiosResponse<Transaction>>('api.transaction:create', payload)
                .then(({ data }) => {
                    console.table(data)
                    onCreated?.()
                    if (config?.printer?.isPrintAutomatically) handlePrintAll(data)
                    closeDialog()
                })
                .catch(error => {
                    const e = normalizeIpcError(error)
                    console.log(e)
                })
                .finally(() => {
                    setSubmitting(false)
                })
        },
        [orderType, tableId, onCreated, closeDialog, Session, config, refKey, submitting]
    )

    /* ---------- step actions ---------- */
    const canNextFromMode = !!orderType
    const canNextFromTable = !needTable || !!tableId

    const handleNext = useCallback(() => {
        if (activeStep === 0) {
            if (!canNextFromMode) return
            setActiveStep(1)
            return
        }
        if (activeStep === 1 && needTable) {
            if (!canNextFromTable) return
            setActiveStep(2)
            return
        }
    }, [activeStep, canNextFromMode, canNextFromTable, needTable])

    const handleBack = useCallback(() => {
        if (activeStep === 0) return
        setActiveStep(s => Math.max(0, s - 1))
    }, [activeStep])

    // jika user ganti mode dari perlu meja → tidak perlu meja (atau sebaliknya), rapikan step
    useEffect(() => {
        const maxIndex = steps.length - 1
        if (activeStep > maxIndex) setActiveStep(maxIndex)
        setTableId(undefined)
    }, [steps.length])

    // auto next kalau meja sudah dipilih (Dine In)
    useEffect(() => {
        handleNext();
    }, [tableId, setTableId]);

    /* ---------- content per step ---------- */
    const renderStepContent = () => {
        if (activeStep === 0) {
            return (
                <CenterPane>
                    <DiningIntro />
                    <Box sx={{ mt: 1.25, display: 'flex', justifyContent: 'center' }}>
                        <Box sx={{ width: '100%' }}>
                            <DiningModeWidget
                                onChange={(opt: Option) => {
                                    setOrderType(opt)
                                    setActiveStep(needTable ? 1 : 1)
                                }}
                            />
                        </Box>
                    </Box>
                </CenterPane>
            )
        }

        if (activeStep === 1 && needTable) {
            return (
                <Box sx={{ height: '100%' }}>
                    <SelectTables
                        key={`tables-${orderSeed}`}
                        onSelectTable={(id: string) => setTableId(id)}
                    />
                </Box>
            )
        }

        if (activeStep === 1 && !needTable) {
            return <Billing key={`billing-${orderSeed}`} onSubmit={submitOrder} />
        }

        if (activeStep === 2) {
            return <Billing key={`billing-${orderSeed}`} onSubmit={submitOrder} />
        }

        return null
    }

    /* ---------- UI ---------- */
    const isCompact = activeStep === 0

    return (
        <>
            <Button
                variant="contained"
                size="large"
                startIcon={<AddRounded />}
                sx={t => {
                    const light = t.palette.mode === 'light'
                    return {
                        textTransform: 'none',
                        minHeight: 26,
                        fontSize: '1rem',
                        fontWeight: 900,
                        letterSpacing: 0.5,
                        borderRadius: 3,
                        bgcolor: light ? '#000' : '#fff',
                        color: light ? '#fff' : '#000',
                        '&:hover': {
                            bgcolor: light ? '#111' : '#f5f5f5'
                        },
                        '&:active': {
                            transform: 'translateY(1px)',
                            boxShadow: 'none'
                        },
                        '& .MuiButton-startIcon': { mr: 1.25 }
                    }
                }}
                onClick={e => (e.stopPropagation(), openDialog())}
            >
                Order
            </Button>

            <Dialog
                open={open}
                onClose={() => closeDialog()}
                fullWidth
                maxWidth={isCompact ? 'md' : 'xl'}
                fullScreen={fullScreen}
                slotProps={{
                    paper: {
                        sx: {
                            display: 'flex',
                            flexDirection: 'column',
                            height: fullScreen ? '100vh' : isCompact ? '60vh' : '85vh',
                            overflow: 'hidden',
                            transition: t =>
                                t.transitions.create('height', {
                                    duration: t.transitions.duration.standard
                                })
                        }
                    }
                }}
            >
                <DialogTitle sx={{ display: 'flex', alignItems: 'center', pr: 1.5, gap: 1 }}>
                    <Typography variant="h6" fontWeight={800}>
                        Tambah Pesanan Baru
                    </Typography>

                    <Stack direction="row" spacing={0.5} alignItems="center" sx={{ ml: 'auto' }}>
                        <IconButton
                            size="small"
                            onClick={() => setFullScreen(v => !v)}
                            aria-label={fullScreen ? 'Keluar layar penuh' : 'Layar penuh'}
                        >
                            {fullScreen ? (
                                <FullscreenExitRounded fontSize="small" />
                            ) : (
                                <FullscreenRounded fontSize="small" />
                            )}
                        </IconButton>

                        <IconButton
                            size="small"
                            onClick={() => toggleMode()}
                            aria-label={isDark ? 'Ganti ke tema terang' : 'Ganti ke tema gelap'}
                        >
                            {isDark ? (
                                <DarkModeRounded fontSize="small" />
                            ) : (
                                <LightModeRounded fontSize="small" />
                            )}
                        </IconButton>

                        <IconButton size="small" onClick={() => closeDialog()} aria-label="Tutup">
                            <CloseRounded fontSize="small" />
                        </IconButton>
                    </Stack>
                </DialogTitle>

                <DialogContent dividers sx={{ p: 0, flex: 1, overflow: 'hidden' }}>
                    <Box sx={{ height: '100%', overflow: 'hidden' }}>{renderStepContent()}</Box>
                </DialogContent>

                <Box
                    sx={{
                        display: 'flex',
                        gap: 1,
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        px: 2,
                        py: 1.25,
                        borderTop: 1,
                        borderColor: 'divider'
                    }}
                >
                    <Button variant="outlined" disabled={activeStep === 0} onClick={handleBack}>
                        Kembali
                    </Button>

                    <Box sx={{ display: 'flex', gap: 1 }}>
                        {/* Next disembunyikan, Billing handle submit sendiri */}
                        {/* Kalau nanti mau dihidupkan lagi bisa pakai submitting buat disabled */}
                    </Box>
                </Box>
            </Dialog>

            <SweetAlert2 {...swalProps} />
        </>
    )
}

export default NewOrderModal
