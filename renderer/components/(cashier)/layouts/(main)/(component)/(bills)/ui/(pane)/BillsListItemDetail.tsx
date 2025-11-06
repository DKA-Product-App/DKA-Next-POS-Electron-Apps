// (components)/BillListItemDetail.tsx
'use client'

import * as React from 'react'
import {
    Box, Paper, Stack, Typography, Chip, Button, TextField, InputAdornment,
    ButtonBase, Divider, Tooltip,
    ButtonGroup,
    Popper,
    ListItemButton,
    ListItemIcon, ListItemText,
    List,
    ClickAwayListener
} from '@mui/material'
import PrintRounded from '@mui/icons-material/PrintRounded'
import RequestQuoteRounded from '@mui/icons-material/RequestQuoteRounded'
import AccessTimeRounded from '@mui/icons-material/AccessTimeRounded'
import AttachMoneyRounded from '@mui/icons-material/AttachMoneyRounded'
import QrCode2Rounded from '@mui/icons-material/QrCode2Rounded'
import CreditCardRounded from '@mui/icons-material/CreditCardRounded'
import TakeoutDiningRounded from '@mui/icons-material/TakeoutDiningRounded'
import RestaurantRounded from '@mui/icons-material/RestaurantRounded'
import PerfectScrollbar from 'react-perfect-scrollbar'
import 'react-perfect-scrollbar/dist/css/styles.css'
import { useEffect, useMemo, useRef, useState } from "react"
import { ImgWithSkeleton } from '../../../../../../../../utils/ImageProcessingIPC'
import {CheckRounded, ExpandLessRounded } from '@mui/icons-material'
import {AxiosResponse} from "axios";
import SweetAlert2, {SweetAlert2Props} from "react-sweetalert2";
import {useThemeCharger} from "../../../../../../../../contexts/ThemeCharger";
import {useUserConfig} from "../../../../../../../../contexts/UserConfigContext";
import {useGodModeProvider} from "../../../../../../context/GodModeProviderContext";
import {TransactionBill} from "../../../../../../../../types/transaction/bill/transaction.bill.type";
import {ConfigPaymentMethod} from "../../../../../../../../types/config/data/payment.method.type";
import {DevicePrinter} from "../../../../../../../../types/config/device/device.printer.type";

/* ================================= THEME ACCENTS ================================= */
const PURPLE_GRAD = 'linear-gradient(90deg, #6366F1, #8B5CF6 35%, #EC4899)'
const RED_GRAD = 'linear-gradient(90deg,rgba(180, 58, 58, 1) 0%, rgba(233, 34, 54, 1) 40%, rgba(253, 29, 29, 1) 50%, rgba(252, 93, 69, 1) 100%)';
const GRAND_GRAD = 'linear-gradient(90deg,rgba(10,224,7,1) 0%, rgba(7,168,61,1) 51%, rgba(44,135,138,1) 100%)'
const ACCENT = 'linear-gradient(90deg, #7C3AED, #6366F1 45%, #8B5CF6)'

/* ================================= HELPERS ================================= */
const fmtIDR = (n?: number | string) =>
    typeof n === 'number' || (typeof n === 'string' && n !== '')
        ? new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(Number(n))
        : 'Rp —'

const fmtTimeShort = (iso?: string) =>
    iso ? new Date(iso).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : '—'

const statusChip = (bill?: TransactionBill) => {
    const paid = bill?.paid
    if (!paid || !paid?.status) return { color: 'error' as const, label: 'Unpaid' }
    return paid?.status ? { color: 'success' as const, label: 'Paid' } : { color: 'error' as const, label: 'Unpaid' }
}

const first = <T,>(a?: T[] | T | null): T | undefined =>
    Array.isArray(a) ? a[0] : (a as T | undefined)

/* ================================= DATA DERIVERS ================================= */
const getInvoice = (b?: TransactionBill) => b?.transaction?.invoice ?? String(b?.bill ?? '')
const getIssuedAt = (b?: TransactionBill) => b?.paid?.time_created || b?.transaction?.time_created
const getPaidAt = (b?: TransactionBill) => b?.paid?.time_updated
const getRef = (b?: TransactionBill) =>
    b?.transaction?.invoice

const deriveLineItems = (bill?: TransactionBill, godMode?: boolean) =>
    (bill?.items ?? [])
        .filter(wrap => godMode ? wrap.status === true : true) // godMode on: cuma yang status true
        .map((wrap) => {
            const it = wrap.productVariant
            return {
                id: String(wrap.id ?? Math.random()),
                qty: Number(wrap.qty ?? 0),
                price: Number((wrap.price ?? 0) as number),
                sub_total: Number((wrap.sub_total ?? 0) as number),
                bill: bill?.bill ?? "# -",
                status: wrap.status,
                time_created: wrap.time_created,
                time_updated: wrap.time_updated,
                reference: wrap.reference,
                variant: it,
            }
        })

/* ================================== SUB-COMPONENTS ================================== */
type ApiResponse<T> = { status: boolean; code: number; msg: string; data: T }

const iconFromMethod = (m?: ConfigPaymentMethod) => {
    const key = (m?.icon || '').toLowerCase()
    const nm = (m?.name || '').toLowerCase()
    if (key.includes('qr') || nm.includes('qris')) return <QrCode2Rounded fontSize="medium" />
    if (key.includes('card') || nm.includes('kartu')) return <CreditCardRounded fontSize="medium" />
    if (key.includes('takeout')) return <TakeoutDiningRounded fontSize="medium" />
    if (key.includes('restaurant')) return <RestaurantRounded fontSize="medium" />
    if (key.includes('cash') || nm.includes('tunai') || nm.includes('cash')) return <AttachMoneyRounded fontSize="medium" />
    return <AttachMoneyRounded fontSize="medium" />
}

const MethodCard: React.FC<{
    selected?: boolean
    title: string
    subtitle?: string
    icon: React.ReactNode
    onClick?: () => void
    disabled?: boolean
}> = ({ selected, title, subtitle, icon, onClick, disabled }) => (
    <Box
        role="button"
        onClick={disabled ? undefined : onClick}
        sx={(t) => ({
            userSelect: 'none',
            cursor: disabled ? 'not-allowed' : 'pointer',
            width: 180,
            p: 1.5,
            border: '1px solid',
            borderColor: selected ? t.palette.primary.main : 'divider',
            borderRadius: 2,
            bgcolor: disabled ? t.palette.action.disabledBackground : 'background.paper',
            boxShadow: selected ? `0 0 0 3px ${t.palette.primary.main}22, 0 1px 2px rgba(0,0,0,.06)` : '0 1px 2px rgba(0,0,0,.06)',
            transition: 'all .15s ease',
            '&:hover': disabled ? {} : { boxShadow: '0 2px 6px rgba(0,0,0,.10)' },
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 1,
            textAlign: 'center',
            opacity: disabled ? 0.7 : 1,
        })}
    >
        <Box sx={(t) => ({ width: 56, height: 56, borderRadius: '50%', display: 'grid', placeItems: 'center', bgcolor: t.palette.action.hover })}>
            {icon}
        </Box>
        <Typography variant="subtitle1" fontWeight={800} sx={{ letterSpacing: .2 }}>{title}</Typography>
        {subtitle && <Typography variant="caption" color="text.secondary">{subtitle}</Typography>}
    </Box>
)

const PaymentMethodsPicker: React.FC<{
    disabled?: boolean
    selectedId?: string
    onSelect: (m: ConfigPaymentMethod) => void
}> = ({ disabled, selectedId, onSelect }) => {
    const [methods, setMethods] = useState<ConfigPaymentMethod[]>([])
    const [loading, setLoading] = useState(true)
    const [err, setErr] = useState<string | null>(null)

    useEffect(() => {
        let alive = true
        setLoading(true)
        // @ts-ignore
        window.api.invoke('api.config.data.payment.method:read.all', {})
            .then((res: ApiResponse<ConfigPaymentMethod[]> | { data: ConfigPaymentMethod[] } | undefined) => {
                const arr = Array.isArray((res as any)?.data) ? (res as any).data as ConfigPaymentMethod[] : []
                if (!alive) return
                setMethods(arr.filter(m => m.status !== false))
                setErr(null)
            })
            .catch((e: any) => {
                alive && setMethods([])
                alive && setErr(typeof e?.message === 'string' ? e.message : 'Gagal memuat metode pembayaran')
            })
            .finally(() => { alive && setLoading(false) })
        return () => { alive = false }
    }, [])

    return (
        <Stack direction="row" spacing={1.5} flexWrap="wrap">
            {methods.map(m => (
                <MethodCard
                    key={m.id}
                    selected={selectedId === m.id}
                    title={m.name}
                    subtitle={m.description}
                    icon={iconFromMethod(m)}
                    onClick={() => onSelect(m)}
                    disabled={disabled || loading}
                />
            ))}
            {err && (
                <Tooltip title={err}><Chip size="small" color="error" label="Gagal memuat metode" /></Tooltip>
            )}
        </Stack>
    )
}

/* ================================= MAIN ================================= */
type TenderMode = 'idle' | 'entry' | 'ready'

const BillListItemDetail: React.FC<{ billId: string, isHideTransaction?: boolean, onPaySuccess?: () => void; cancelBill?: () => void; }> = ({ billId, isHideTransaction, onPaySuccess, cancelBill }) => {
    const [bill, setBill] = useState<TransactionBill | undefined>(undefined)
    const { mode, toggleMode } = useThemeCharger()
    const { godMode } = useGodModeProvider();
    const { set, config } = useUserConfig();
    // ==== ⛓️ DERIVED FROM `bill` (selalu up-to-date) ====
    const isPaid = useMemo(() => !!bill?.paid?.status, [bill])
    const st = useMemo(() => statusChip(bill), [bill])
    const items = useMemo(() => deriveLineItems(bill, godMode), [bill, godMode])

    const sum = (arr: number[]) => arr.reduce((a, b) => a + b, 0)
    const itemsSubtotal = useMemo(() => items.length ? sum(items.map(i => Number(i.sub_total ?? 0))) : 0, [items])
    const taxRate = 0.10
    const tax = useMemo(() => Math.max(0, Math.round(itemsSubtotal * taxRate)), [itemsSubtotal])
    const grandTotal = useMemo(() => Math.max(0, itemsSubtotal + tax), [itemsSubtotal, tax])

    const invoice = useMemo(() => getInvoice(bill), [bill])
    const ref = useMemo(() => getRef(bill), [bill])
    const itemsCount = items.length
    const qtyTotal = useMemo(() => items.reduce((a, it) => a + Number(it.qty ?? 0), 0), [items])

    const [swalProps, setSwalProps] = useState<SweetAlert2Props>({});

    /* ---------------- PAYMENT STATE ---------------- */
    const [method, setMethod] = useState<ConfigPaymentMethod | null>(null)
    const [needTender, setNeedTender] = useState<boolean>(false)
    const [tenderMode, setTenderMode] = useState<TenderMode>('idle')
    const [showTotals, setShowTotals] = useState<boolean>(true)
    const [cashStr, setCashStr] = useState<string>('')

    const cash = cashStr === '' ? 0 : Number(cashStr.replaceAll('.', '').replaceAll(',', ''))
    const change = Math.max(0, cash - grandTotal)
    const cashRef = useRef<HTMLInputElement>(null)

    // 2) State: langsung simpan objek printer
    const [printerMenuOpen, setPrinterMenuOpen] = React.useState(false)
    const [PrinterList, setPrinterList] = React.useState<DevicePrinter[]>([])
    const arrowRef = React.useRef<HTMLButtonElement | null>(null)

    const togglePrinterMenu = () => setPrinterMenuOpen(v => !v)
    const closePrinterMenu = () => setPrinterMenuOpen(false)


    // initial fetch bill
    useEffect(() => {
        // @ts-ignore
        window.api.invoke('api.transaction.bills:read.one', { id: billId })
            .then(({ data }) => setBill(data))
            .catch(console.error)
    }, [billId])

    // respond to method/isPaid changes (form logic)
    // --> ubah jadi begini:
    useEffect(() => {
        const nt = !!method?.need_tender
        setNeedTender(nt)

        if (isPaid) { setTenderMode('idle'); setShowTotals(true); return }

        if (nt) {
            setTenderMode('entry')
            setShowTotals(false)
            setTimeout(() => cashRef.current?.focus(), 50)
        } else {
            // non-tender → langsung isi tender = grandTotal (string)
            setTenderMode('ready')
            setShowTotals(true)
            setCashStr(String(grandTotal))
        }
    }, [method, isPaid, grandTotal])

    const onCashKeyDown: React.KeyboardEventHandler<HTMLInputElement> = (e) => {
        if (e.key === 'Enter' && cash >= grandTotal) {
            setTenderMode('ready')
            setShowTotals(true)
        }
        if (e.key === 'Escape') {
            setTenderMode('entry')
            setShowTotals(false)
            setCashStr('')
        }
    }

    useEffect(() => {
        if (tenderMode === 'ready' && cash < grandTotal && needTender && !isPaid) {
            setTenderMode('entry')
            setShowTotals(false)
        }
    }, [cash, grandTotal, needTender, isPaid, tenderMode])


    const onCancelBill = React.useCallback(() => {
        window.api.invoke('api.transaction.bills:delete.one', { id : bill?.id })
            .then(() => {
                setSwalProps({
                    show: true,
                    icon: "success",
                    theme: mode,
                    title: 'Canceled',
                    text: `Bill dibatalkan`,
                    timer: 3000,
                    didOpen: (popupEl) => {
                        const container = (popupEl as HTMLElement)?.closest('.swal2-container') as HTMLElement | null;
                        container?.style.setProperty('z-index', '20000', 'important'); // top-most
                    },
                });
                cancelBill?.();
            })
            .catch((error) => {
                if (error?.safeSkip) return;
                setSwalProps({
                    show: true,
                    icon: "error",
                    theme: mode,
                    title: 'Gagal Membatalkan',
                    text: `Check Tagihan Anda`,
                    didOpen: (popupEl) => {
                        const container = (popupEl as HTMLElement)?.closest('.swal2-container') as HTMLElement | null;
                        container?.style.setProperty('z-index', '20000', 'important'); // top-most
                    },
                });
            });
    }, [bill, mode])

    const canPay = !isPaid && !!method && (!needTender || tenderMode === 'ready')

    /* ---------------- ITEM GRID ---------------- */
    const ITEM_COLS = {
        xs: '56px 1.8fr 88px 140px',
        md: '64px 2fr 112px 180px',
    } as const

    const colCell = (leftBorder = false) => ({
        pl: leftBorder ? 1.25 : 0,
        borderLeft: leftBorder ? '1px solid' : 'none',
        borderColor: 'divider',
        minWidth: 0,
    })

    const printLabel = isPaid ? 'Print Bukti Pembayaran' : 'Print Tagihan'

    // ✅ After-pay: update then refetch bill to get latest server state
    const onPay = () => {
        if (!method || isPaid) return
        // @ts-ignore
        window.api.invoke('api.transaction.bills.paid:update.one', {
            params: { id: bill?.paid?.id },
            data: {
                payment_method: method.id,
                tender: Number(cashStr) ?? 0,
                status: true
            }
        })
            .then(({ data }) =>
                // @ts-ignore
                window.api.invoke('api.transaction.bills:read.one', { id: billId })
            )
            .then(({ data }) => {
                onPaySuccess?.();
                setBill(data);
                if (config?.printer?.isPrintAutomatically) onPrintHandle({ cashdraw: true });
            })
            .catch(console.error)
    }

    React.useEffect(() => {
       window?.api.invoke?.<any, AxiosResponse<DevicePrinter[]>>("api.config.device.printer:read.all", {})
           .then(async ({ data }) => {
               if (config?.printer.defaultPrinter === undefined) set({ printer : { defaultPrinter: data?.[0] }})
               setPrinterList(data);
           })
           .catch((error) => {
               setPrinterList([])
           })
    },[])
    const onPrintHandle = ({ enableNotify = false, cashdraw = false } : { enableNotify?: boolean, cashdraw?: boolean }) => {
        if (!config?.printer.defaultPrinter) return
        window.api.invoke('api.transaction.bills:print', {
            bill: bill.id,
            printer: config?.printer?.defaultPrinter?.id ?? null,
            god_mode: godMode,
            cashdraw: cashdraw,
        })
            .then((res) => {
                if (enableNotify) {
                    setSwalProps({
                        show: true,
                        icon: "success",
                        theme: mode,
                        title: 'Successfully Sending Printer',
                        text: `${res.msg}`,
                        didOpen: (popupEl) => {
                            const container = (popupEl as HTMLElement)?.closest('.swal2-container') as HTMLElement | null;
                            container?.style.setProperty('z-index', '20000', 'important'); // top-most
                        },
                    });
                }

            })
            .catch((error) => {
                console.error(error);
                if (enableNotify) {
                    setSwalProps({
                        show: true,
                        icon: "error",
                        theme: mode,
                        title: 'Gagal Mencetak Otomatis',
                        text: `${error?.msg ?? 'Gagal Mencetak. Printer Offline / Error.'}`,
                        didOpen: (popupEl) => {
                            const container = (popupEl as HTMLElement)?.closest('.swal2-container') as HTMLElement | null;
                            container?.style.setProperty('z-index', '20000', 'important'); // top-most
                        },
                    });
                }
            })
    }


    return (
        <>
            <Box sx={{ height: '100%', width: '100%' }}>
                <Paper elevation={0} sx={{ height: '100%', width: '100%', border: '1px solid', borderColor: 'divider', bgcolor: 'background.paper', borderRadius: 0, display: 'flex', flexDirection: 'column' }}>
                    {/* ===== Header ===== */}
                    <Box sx={{ p: { xs: 2, md: 2.5 }, borderBottom: '1px solid', borderColor: 'divider', flexShrink: 0 }}>
                        <Stack direction="row" justifyContent="space-between" alignItems="flex-start" gap={1.5}>
                            <Stack spacing={0.75} minWidth={0}>
                                <Stack direction="row" spacing={1.25} alignItems="center" minWidth={0}>
                                    <RequestQuoteRounded sx={{ fontSize: { xs: 18, md: 20 } }} />
                                    <Typography variant="h5" fontWeight={900} noWrap sx={{ letterSpacing: 0.2 }}>
                                        #{' '}{bill?.bill}
                                    </Typography>
                                    <Chip size="small" color={st.color} label={st.label} sx={{ borderRadius: 0, fontSize: { xs: 12, md: 13 } }} />
                                    <Chip size="small" variant="outlined" label={`${itemsCount} item${itemsCount === 1 ? '' : 's'} • ${qtyTotal} qty`} sx={{ borderRadius: 0, fontSize: { xs: 12, md: 13 } }} />
                                </Stack>

                                <Stack direction="row" spacing={2} flexWrap="wrap" sx={{ color: 'text.secondary' }}>
                                    <Stack direction="row" spacing={0.75} alignItems="center">
                                        <AccessTimeRounded sx={{ fontSize: 18 }} />
                                        <Typography variant="body1">
                                            {isPaid ? `Paid — ${fmtTimeShort(getPaidAt(bill))}` : `Issued — ${fmtTimeShort(getIssuedAt(bill))}`}
                                        </Typography>
                                    </Stack>
                                    <Chip size="medium" color={"primary"} label={`Ref. Order — ${ref ?? '—'}`} sx={{ borderRadius: 0, fontSize: { xs: 16, md: 18 } }} />
                                </Stack>
                            </Stack>
                        </Stack>
                    </Box>

                    {/* ===== Items header ===== */}
                    <Box sx={{ px: { xs: 2, md: 2.5 }, pt: 1, pb: 1, flexShrink: 0 }}>
                        <Box sx={(t) => ({ display: 'grid', gridTemplateColumns: { xs: ITEM_COLS.xs, md: ITEM_COLS.md }, gap: 0, border: '1px solid', borderColor: 'divider', bgcolor: t.palette.action.hover })}>
                            <Box sx={{ ...colCell(false), px: 1.25, py: 1 }}><Typography variant="body2" fontWeight={900} textAlign="center">#</Typography></Box>
                            <Box sx={{ ...colCell(true), px: 1.25, py: 1 }}><Typography variant="body2" fontWeight={900}>Produk</Typography></Box>
                            <Box sx={{ ...colCell(true), px: 1.25, py: 1 }}><Typography variant="body2" fontWeight={900} textAlign="right">Qty</Typography></Box>
                            <Box sx={{ ...colCell(true), px: 1.25, py: 1 }}><Typography variant="body2" fontWeight={900} textAlign="right">Subtotal</Typography></Box>
                        </Box>
                    </Box>

                    {/* ===== Items (scroll) ===== */}
                    <Box sx={{ flex: 1, minHeight: 0 }}>
                        <PerfectScrollbar options={{ suppressScrollX: true, wheelPropagation: false }}>
                            <Box sx={{ px: { xs: 2, md: 2.5 }, pb: 2 }}>
                                <Stack spacing={1}>
                                    {items.map((it, idx) => {
                                        return (
                                            <Paper key={it.id} variant="outlined" sx={{ borderRadius: 2, overflow: 'hidden', position: 'relative', '&::before': { content: '""', position: 'absolute', left: 0, top: 0, bottom: 0, width: 4, background: ACCENT } }}>
                                                <ButtonBase disabled={isPaid} sx={{ width: '100%', display: 'grid', alignItems: 'stretch', textAlign: 'left', gridTemplateColumns: { xs: ITEM_COLS.xs, md: ITEM_COLS.md }, p: 0, '&:hover': { backgroundColor: 'action.hover' } }}>
                                                    {/* # */}
                                                    <Box sx={{ ...colCell(false), px: 1.25, py: 1.1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                        <Chip size="small" label={idx + 1} sx={{ fontWeight: 800, background: (!it.status) ? PURPLE_GRAD : RED_GRAD, color: '#fff' }} />
                                                    </Box>
                                                    {/* Produk */}
                                                    <Box sx={{ ...colCell(true), px: 1.25, py: 1.1, display: 'flex', alignItems: 'flex-start', gap: 1.25 }}>
                                                        <Box sx={{ width: 56, flexShrink: 0 }}>
                                                            <ImgWithSkeleton path={it.variant?.product?.image ?? null} alt={it.variant?.product?.name ?? ''} />
                                                        </Box>
                                                        <Box sx={{ minWidth: 0 }}>
                                                            <Typography variant="body1" fontWeight={900} noWrap title={it.variant?.product?.name ?? ''}>{it.variant?.product?.name ?? ''}</Typography>
                                                            <Stack direction="row" spacing={0.75} alignItems="center" sx={{ mt: 0.25, minWidth: 0, flexWrap: 'wrap' }}>
                                                                {it.variant?.product?.category && (
                                                                    <Typography variant="caption" sx={(t) => ({ px: 0.75, py: 0.25, border: '1px solid', borderColor: 'divider', bgcolor: t.palette.action.hover, fontWeight: 700, textTransform: 'uppercase', letterSpacing: .3 })} noWrap title={first(it.variant?.product?.category)?.name ?? ''}>{first(it.variant?.product?.category)?.name ?? ''}</Typography>
                                                                )}
                                                                {it.variant && (<><Typography variant="caption" color="text.disabled">•</Typography><Typography variant="caption" color="text.secondary" noWrap title={it.variant.name}>{it.variant.name}</Typography></>)}
                                                            </Stack>
                                                        </Box>
                                                    </Box>
                                                    {/* Qty */}
                                                    <Box sx={{ ...colCell(true), px: 1.25, py: 1.1, display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
                                                        <Typography variant="body1">{it.qty}</Typography>
                                                    </Box>
                                                    {/* Subtotal */}
                                                    <Box sx={{ ...colCell(true), px: 1.25, py: 1.1, display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
                                                        <Typography variant="body1" fontWeight={900}>{fmtIDR(it.sub_total)}</Typography>
                                                    </Box>
                                                </ButtonBase>
                                            </Paper>
                                        )
                                    })}
                                </Stack>
                            </Box>
                        </PerfectScrollbar>
                    </Box>

                    {/* ===== Bottom: Payment + Totals/Tender ===== */}
                    <Box sx={{ px: 2.5, py: 1.5, borderTop: '1px solid', borderColor: 'divider', flexShrink: 0 }}>
                        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 560px' }, gap: 2, alignItems: 'start' }}>
                            {/* LEFT: Methods */}
                            <Box sx={{ minWidth: 0 }}>
                                <Typography variant="subtitle1" fontWeight={900} sx={{ mb: 1 }}>Pilih Pembayaran</Typography>
                                <PaymentMethodsPicker
                                    disabled={isPaid}
                                    selectedId={method?.id || undefined}
                                    onSelect={(m) => setMethod(m)}
                                />
                                {isPaid && <Typography variant="caption" color="text.secondary" sx={{ mt: 0.75, display: 'block' }}>Bill sudah dibayar — metode dikunci mengikuti data server.</Typography>}
                            </Box>

                            {/* RIGHT: Card */}
                            <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                                <Paper variant="outlined" sx={{ width: 700, maxWidth: '100%', p: 1.25, borderRadius: 2, position: 'relative', '&::before': { content: '""', position: 'absolute', inset: 0, pointerEvents: 'none', boxShadow: '0 0 0 1px rgba(124,58,237,.35), 0 10px 28px rgba(0,0,0,.06)' } }}>
                                    {/* Tender (ENTRY) */}
                                    {!isPaid && !!method?.need_tender && tenderMode === 'entry' && (
                                        <>
                                            <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                                                <Typography variant="subtitle2" fontWeight={800} sx={{ mb: 0.75 }}>
                                                    Masukkan Nilai Uang Pelanggan
                                                </Typography>

                                                <Box
                                                    sx={{
                                                        p: 1.25,
                                                        border: '1px dashed',
                                                        borderColor: 'divider',
                                                        borderRadius: 2,
                                                        bgcolor: 'action.hover',
                                                        flex: 1,
                                                        display: 'flex',
                                                        alignItems: 'center'
                                                    }}
                                                >
                                                    <TextField
                                                        inputRef={cashRef}
                                                        label="Uang Diterima"
                                                        value={cashStr}
                                                        onChange={(e) => setCashStr(e.target.value.replace(/[^\d.,]/g, ''))}
                                                        onKeyDown={onCashKeyDown}
                                                        inputMode="numeric"
                                                        placeholder="contoh: 100000"
                                                        variant="outlined"
                                                        fullWidth
                                                        InputProps={{ startAdornment: <InputAdornment position="start">Rp</InputAdornment> }}
                                                        helperText={!!cash ? (cash < grandTotal ? `Kurang ${fmtIDR(grandTotal - cash)}` : 'Uang cukup • tekan Enter') : 'Masukkan nominal tunai'}
                                                        FormHelperTextProps={{ sx: { fontWeight: 700 } }}
                                                    />
                                                </Box>

                                                {/* Footer: minus merah kalau kurang */}
                                                <Box sx={{ mt: 'auto' }}>
                                                    <Divider sx={{ my: 1.25 }} />
                                                    <Stack direction="row" alignItems="center">
                                                        <Typography variant="subtitle1" sx={{ flex: 1 }} fontWeight={900}>
                                                            {(cash - grandTotal) < 0 ? 'Kekurangan' : 'Kembalian'}
                                                        </Typography>
                                                        <Typography
                                                            variant="h5"
                                                            fontWeight={900}
                                                            sx={{ color: (t) => (cash - grandTotal < 0 ? t.palette.error.main : t.palette.success.main) }}
                                                        >
                                                            {(cash - grandTotal) < 0
                                                                ? `- ${fmtIDR(Math.max(0, grandTotal - cash))}`
                                                                : fmtIDR(Math.max(0, cash - grandTotal))}
                                                        </Typography>
                                                    </Stack>
                                                </Box>
                                            </Box>
                                        </>
                                    )}

                                    {/* Totals (IDLE/READY/Non-tender/Paid) */}
                                    {showTotals && (
                                        <>
                                            <Stack direction="row" alignItems="center" sx={{ py: 0.5 }}>
                                                <Typography variant="subtitle1" sx={{ flex: 1 }} fontWeight={900}>Subtotal</Typography>
                                                <Typography variant="h6" fontWeight={900}>{fmtIDR(itemsSubtotal)}</Typography>
                                            </Stack>
                                            <Divider />
                                            <Stack direction="row" alignItems="center" sx={{ py: 0.5 }}>
                                                <Typography variant="subtitle1" sx={{ flex: 1 }} fontWeight={900}>Pajak (10%)</Typography>
                                                <Typography variant="h6" fontWeight={900}>{fmtIDR(tax)}</Typography>
                                            </Stack>
                                            <Divider sx={{ my: 1 }} />
                                            <Stack direction="row" alignItems="center" sx={{ py: 0.75, px: 1, background: (t) => t.palette.mode === 'dark' ? '#3db108' : GRAND_GRAD }}>
                                                <Typography variant="h6" sx={{ flex: 1, color: '#fff' }} fontWeight={900}>Grand Total</Typography>
                                                <Typography variant="h4" fontWeight={900} sx={{ color: '#fff' }}>{fmtIDR(grandTotal)}</Typography>
                                            </Stack>
                                            {!isPaid && !!method?.need_tender && tenderMode === 'ready' && (
                                                <>
                                                    <Divider sx={{ my: 1.25 }} />
                                                    <Stack direction="row" alignItems="center">
                                                        <Typography variant="subtitle1" sx={{ flex: 1 }} fontWeight={900}>Kembalian</Typography>
                                                        <Typography variant="h5" fontWeight={900}>{fmtIDR(Math.max(0, change))}</Typography>
                                                    </Stack>
                                                </>
                                            )}
                                        </>
                                    )}
                                </Paper>
                            </Box>
                        </Box>
                    </Box>

                    {/* ===== Footer ===== */}
                    <Box sx={{ p: { xs: 2, md: 2.5 }, borderTop: '1px solid', borderColor: 'divider', display: 'flex', gap: 1.25, justifyContent: 'flex-end', flexShrink: 0 }}>

                        {
                            cancelBill && (
                                <Button
                                    variant="contained"
                                    color="warning"
                                    startIcon={<AttachMoneyRounded sx={{ fontSize: 36 }} />}
                                    onClick={onCancelBill}
                                    sx={{ textTransform: 'none', fontWeight: 800, borderRadius: 2, fontSize: { xs: 14, md: 15 }, py: 1.1, px: 2.2 }}
                                    title={'Cancel Bill'}
                                >
                                    Cancel Bill
                                </Button>
                            )
                        }
                        <Button
                            variant="contained"
                            color="success"
                            disabled={!canPay}
                            startIcon={<AttachMoneyRounded sx={{ fontSize: 36 }} />}
                            onClick={onPay}
                            sx={{ textTransform: 'none', fontWeight: 800, borderRadius: 2, fontSize: { xs: 14, md: 15 }, py: 1.1, px: 2.2 }}
                            title={isPaid ? 'Sudah dibayar' : (method?.need_tender ? (tenderMode === 'ready' ? 'Bayar sekarang' : 'Masukkan & konfirmasi nominal (Enter)') : (method ? 'Bayar sekarang' : 'Pilih metode'))}
                        >
                            Bayar
                        </Button>

                        {/*// 3) Split button (title menampilkan printer terpilih)*/}
                        <ButtonGroup variant="outlined" color={isPaid ? 'success' : 'warning'} sx={{ borderRadius: 2, overflow: 'hidden' }}>
                            <Button
                                onClick={() => {
                                    onPrintHandle({ enableNotify : true })
                                }}
                                startIcon={<PrintRounded sx={{ fontSize: 36 }} />}
                                sx={{ textTransform: 'none', fontWeight: 800, fontSize: { xs: 14, md: 15 }, py: 1.1, px: 2.2 }}
                                title={`${printLabel}${config?.printer?.defaultPrinter ? ` · ${config?.printer?.defaultPrinter?.name} . ${config?.printer?.defaultPrinter?.description}` : ''}`}
                            >
                                {printLabel}
                            </Button>
                            <Button ref={arrowRef} onClick={togglePrinterMenu} aria-label="Pilih printer" sx={{ px: 1.25, minWidth: 0 }}>
                                <ExpandLessRounded sx={{ fontSize: 22 }} />
                            </Button>
                        </ButtonGroup>
                    </Box>
                </Paper>

            </Box>
            {/*// 4) Popper menu: klik = setSelectedPrinter(printer) + tutup menu*/}
            <Popper open={printerMenuOpen} anchorEl={arrowRef.current} placement="top-end" style={{ zIndex: 1300 }}>
                <ClickAwayListener onClickAway={closePrinterMenu}>
                    <Paper variant="outlined" sx={{ mt: 1, minWidth: 280, borderRadius: 2, overflow: 'hidden' }}>
                        <List dense disablePadding>
                            {PrinterList.map(p => (
                                <ListItemButton
                                    key={p.id}
                                    onClick={() => { set({ printer : { defaultPrinter: p }}); closePrinterMenu() }}
                                >
                                    <ListItemIcon sx={{ minWidth: 32 }}>
                                        {p.id === config?.printer.defaultPrinter?.id ? <CheckRounded fontSize="small" /> : null}
                                    </ListItemIcon>
                                    <ListItemText
                                        primary={p.name}
                                        secondary={[p.name.toUpperCase(), p.description, p.options.ip_address].filter(Boolean).join(' • ')}
                                        primaryTypographyProps={{ fontWeight: 800 }}
                                    />
                                </ListItemButton>
                            ))}
                        </List>
                    </Paper>
                </ClickAwayListener>
            </Popper>
            <SweetAlert2 {...swalProps} />
        </>
    )
}

export default React.memo(BillListItemDetail)
