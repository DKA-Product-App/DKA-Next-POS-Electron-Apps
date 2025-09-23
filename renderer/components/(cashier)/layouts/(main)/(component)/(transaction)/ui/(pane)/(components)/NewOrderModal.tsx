'use client'

import * as React from 'react'
import { useState, useEffect, useMemo, useCallback } from 'react'
import {
    Box, Button, Dialog, DialogTitle, DialogContent, IconButton, Stack, Typography,
    Stepper, Step, StepLabel
} from '@mui/material'
import AddRounded from '@mui/icons-material/AddRounded'
import CloseRounded from '@mui/icons-material/CloseRounded'
import DarkModeRounded from '@mui/icons-material/DarkModeRounded'
import LightModeRounded from '@mui/icons-material/LightModeRounded'
import FullscreenRounded from '@mui/icons-material/FullscreenRounded'
import FullscreenExitRounded from '@mui/icons-material/FullscreenExitRounded'
import dynamic from 'next/dynamic'
import { useTheme } from '@mui/material/styles'
import { useThemeCharger } from '../../../../../../../context/ThemeCharger'

// === Dynamically loaded pages ===
const Billing = dynamic(() => import('../../../../../../(select-product)'), { ssr: false })
const SelectTables = dynamic(() => import('../../../../../../(select-tables)'), { ssr: false })
const DiningModeWidget = dynamic(
    () => import('../../../../../../(select-product)/ui/(pane)/widgets/DiningModeWidget'),
    { ssr: false }
)



type Props = { onCreated?: () => void }
type Option = {
    id: string; code: string; icon: string; name: string;
    description?: string; required_table_select?: boolean
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
        <Typography variant="h6" fontWeight={900} sx={{ letterSpacing: .2 }}>
            Pilih Jenis Pesanan
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: .5, lineHeight: 1.55 }}>
            Pilih mode untuk lanjut. <b>Dine In</b> wajib pilih meja; <b>Take Away</b> & <b>Online</b> langsung ke produk.
        </Typography>
    </Box>
)


const NewOrderModal: React.FC<Props> = ({ onCreated }) => {
    const [open, setOpen] = useState(false)


    // wizard data
    const [orderType, setOrderType] = useState<Option | undefined>(undefined)
    const needTable = !!orderType?.required_table_select
    const [tableId, setTableId] = useState<string | undefined>(undefined)
    const [orderSeed, setOrderSeed] = useState<number>(() => Date.now())

    // wizard step: 0 = Mode, 1 = Table or Billing (depends), 2 = Billing (only if needTable)
    const steps = useMemo(() => (needTable ? ['Mode', 'Meja', 'Billing'] : ['Mode', 'Billing']), [needTable])
    const [activeStep, setActiveStep] = useState(0)

    const [fullScreen, setFullScreen] = useState(false)
    // theme
    const theme = useTheme()
    const isDark = (theme.palette as any)?.mode === 'dark' || (theme.palette as any)?.colorScheme === 'dark'
    const { toggleMode } = useThemeCharger()

    /* ---------- open/close ---------- */
    const openDialog = useCallback(() => {
        setOpen(true)
        setOrderType(undefined)
        setTableId(undefined)
        setActiveStep(0)
    }, [])

    const closeDialog = useCallback(() => {
        setOpen(false)
        setOrderType(undefined)
        setTableId(undefined)
        setActiveStep(0)
    }, [])

    /* ---------- submit ---------- */
    const submitOrder = useCallback((items: Item[]) => {
        if (!orderType?.id) {
            console.error('order_type belum dipilih')
            return
        }

        // Sanitize keras: pastikan qty >= 1, price valid number
        const sanitized = items
            .map((i: any) => {
                const qty = Number.isFinite(Number(i?.qty)) ? Number(i.qty) : 0
                const price = Number.isFinite(Number(i?.price)) ? Number(i.price) : 0
                const safeQty = Math.max(1, Math.trunc(qty || 0))         // min 1
                const safePrice = Number.isFinite(price) ? price : 0

                return {
                    // JANGAN spread variant ke top-level untuk menghindari bentrok field
                    product: i?.variant?.product ?? null,
                    variant: i?.variant ?? null,
                    note: i?.note ?? '',
                    qty: safeQty,
                    price: safePrice,
                    sub_total: safePrice * safeQty,
                }
            })
            .filter((it: any) => it.variant && it.product && it.price > 0 && it.qty > 0)

        // Debug: cek sebelum kirim
        console.table({ pickedCount: items?.length ?? 0, sanitizedCount: sanitized.length })

        const payload = {
            reference: { id: '00000000-0000-5000-a000-000000000000' },
            branch: [{ id: '00000000-0000-5000-a000-000000000000' }],
            shift: { id: '00000000-0000-5000-a000-000000000000' },
            order_type: { id: orderType.id },
            table: tableId ? { id: tableId } : undefined,
            invoice: Math.floor(10000 + Math.random() * 90000),
            batches: [
                { branch: [{ id: '00000000-0000-5000-a000-000000000000' }], batch: 1, items: sanitized },
            ],
        }

        window.api?.invoke('api.transaction:create', payload)
            .then((result) => (console.table(result), onCreated?.(), closeDialog()))
            .catch(console.error)
    }, [orderType, tableId, onCreated, closeDialog])


    /* ---------- step actions ---------- */
    const canNextFromMode = !!orderType
    const canNextFromTable = !needTable || (!!tableId)

    const handleNext = useCallback(() => {
        // Mode → next
        if (activeStep === 0) {
            if (!canNextFromMode) return
            if (needTable) {
                setActiveStep(1) // go to Table
            } else {
                setActiveStep(1) // go to Billing (since steps = ['Mode','Billing'])
            }
            return
        }
        // Table → Billing
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
        // reset table jika mode berubah
        setTableId(undefined)
    }, [steps.length]) // eslint-disable-line react-hooks/exhaustive-deps

    useEffect(() => {
        handleNext();
    }, [tableId, setTableId]);

    /* ---------- content per step ---------- */
    const renderStepContent = () => {
        // Step 0: Mode
        if (activeStep === 0) {
            return (
                <CenterPane>
                    <DiningIntro />
                    <Box sx={{ mt: 1.25, display: 'flex', justifyContent: 'center' }}>
                        <Box sx={{ width: '100%' }}>
                            <DiningModeWidget
                                onChange={(opt: Option) => {
                                    setOrderType(opt)
                                    // auto-advance biar cepat: kalau tidak butuh meja → langsung ke Billing (step 1)
                                    // kalau butuh meja → ke step Table (step 1)
                                    setActiveStep(needTable ? 1 : 1)
                                }}
                            />
                        </Box>
                    </Box>
                </CenterPane>
            )
        }
        // Step 1: kalau needTable → SelectTables, else → Billing
        if (activeStep === 1 && needTable) {
            return (
                <Box sx={{ height: '100%' }}>
                    <SelectTables key={`tables-${orderSeed}`} onSelectTable={(id: string) => setTableId(id)} />
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
                color="success"
                sx={{ borderWidth: 2, fontWeight: 800, letterSpacing: .2, '&:hover': { borderWidth: 2 } }}
                onClick={(e) => (e.stopPropagation(), openDialog())}
            >
                ORDER
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
                            height: fullScreen ? '100vh' : (isCompact ? '60vh' : '85vh'),
                            overflow: 'hidden',
                            transition: (t) => t.transitions.create('height', { duration: t.transitions.duration.standard }),
                        }
                    }
                }}
            >
                <DialogTitle sx={{ display: 'flex', alignItems: 'center', pr: 1.5, gap: 1 }}>
                    <Typography variant="h6" fontWeight={800}>Tambah Pesanan Baru</Typography>

                    <Stack direction="row" spacing={0.5} alignItems="center" sx={{ ml: 'auto' }}>
                        <IconButton size="small" onClick={() => setFullScreen(v => !v)} aria-label={fullScreen ? 'Keluar layar penuh' : 'Layar penuh'}>
                            {fullScreen ? <FullscreenExitRounded fontSize="small" /> : <FullscreenRounded fontSize="small" />}
                        </IconButton>

                        <IconButton size="small" onClick={() => toggleMode()} aria-label={isDark ? 'Ganti ke tema terang' : 'Ganti ke tema gelap'}>
                            {isDark ? <DarkModeRounded fontSize="small" /> : <LightModeRounded fontSize="small" />}
                        </IconButton>

                        <IconButton size="small" onClick={() => closeDialog()} aria-label="Tutup">
                            <CloseRounded fontSize="small" />
                        </IconButton>
                    </Stack>
                </DialogTitle>

                <DialogContent dividers sx={{ p: 0, flex: 1, overflow: 'hidden' }}>
                    <Box sx={{ height: '100%', overflow: 'hidden' }}>
                        {renderStepContent()}
                    </Box>
                </DialogContent>

                {/* Wizard footer actions */}
                <Box sx={{ display: 'flex', gap: 1, justifyContent: 'space-between', alignItems: 'center', px: 2, py: 1.25, borderTop: 1, borderColor: 'divider' }}>
                    <Button variant="outlined" disabled={activeStep === 0} onClick={handleBack}>
                        Kembali
                    </Button>

                    <Box sx={{ display: 'flex', gap: 1 }}>
                        {/* Tampilkan Next hanya jika halaman bukan Billing (karena Billing punya submit sendiri) */}
                        {/*{!(activeStep === 1 && !needTable) && !(activeStep === 2) && (
                            <Button
                                variant="contained"
                                onClick={handleNext}
                                disabled={(activeStep === 0 && !canNextFromMode) || (activeStep === 1 && needTable && !canNextFromTable)}
                            >
                                Lanjut
                            </Button>
                        )}*/}
                    </Box>
                </Box>
            </Dialog>
        </>
    )
}

export default NewOrderModal
