'use client'

import * as React from 'react'
import {
    Button, Badge, Tooltip, Dialog, DialogTitle, DialogContent,
    Box, Paper, Stack, Typography, IconButton
} from '@mui/material'
import CallSplitRounded from '@mui/icons-material/CallSplitRounded'
import ReceiptLongRounded from '@mui/icons-material/ReceiptLongRounded'
import type {ButtonProps} from '@mui/material'
import {useTx} from '../context/TransactionContext'
import {useEffect, useRef, useState} from 'react'
import normalizeIpcError from '../../../../../../../../../helpers/electronMessageErrorEsctration'
import InfoOutlined from '@mui/icons-material/InfoOutlined'
import FullscreenExitRounded from '@mui/icons-material/FullscreenExitRounded'
import FullscreenRounded from '@mui/icons-material/FullscreenRounded'
import DarkModeRounded from '@mui/icons-material/DarkModeRounded'
import LightModeRounded from '@mui/icons-material/LightModeRounded'
import CloseRounded from '@mui/icons-material/CloseRounded'
import {useTheme} from '@mui/material/styles'
import {useThemeCharger} from '../../../../../../../../../contexts/ThemeCharger'
import dynamic from 'next/dynamic'
import {useTabNavigationHandlerContext} from '../../../context/TabNavigationHandlerContext'
import {useTransactionEventTrigger} from "../context/TransactionEventTriggerContext";
import {useSession} from "../../../../../../../../../contexts/SessionProviderContext";
import {Transaction} from "../../types/api.transaction.type";
import {AxiosResponse} from "axios";
import {TransactionBill, TransactionBillPrinterDevice} from "../../../../(bills)/types/transaction.bill.type";
import SweetAlert2, {SweetAlert2Props} from "react-sweetalert2";
import TransactionBills from "../../../../../../../../../../main/api/transaction/bills/api.transaction.bills.api";

const BillListItemDetail = dynamic(
    () => import('./../../../../(bills)/ui/(pane)/BillsListItemDetail'),
    {ssr: true}
)

const ErrorDataLayout: React.FC<{
    status: boolean,
    code: number | string,
    msg: string,
    raw?: any,
    extra?: any
}> = ({status, code, msg, raw, extra}) => {
    const {setState} = useTabNavigationHandlerContext()
    return (
        <Box sx={{height: '100%', display: 'grid', placeItems: 'center', p: 2}}>
            <Paper elevation={0} sx={(t) => ({
                maxWidth: 640, width: '100%', p: 3, border: '1px dashed', borderColor: 'divider',
                bgcolor: t.palette.mode === 'dark' ? 'background.default' : 'background.paper', textAlign: 'center'
            })}>
                <Stack spacing={1.25} alignItems="center">
                    <InfoOutlined color="info" sx={{fontSize: 36}}/>
                    <Typography variant="h6" fontWeight={900}>Harap Selesaikan Tagihan Terakhir</Typography>
                    <Typography variant="body2" color="text.secondary">{msg}</Typography>
                    {code === 402 && (
                        <Box sx={{display: 'flex', justifyContent: 'center'}}>
                            <Button
                                onClick={() => setState(prev => ({
                                    ...prev,
                                    active: 'bills',
                                    id: extra?.data?.id ?? undefined
                                }))}
                                variant="outlined" sx={{textTransform: 'none', fontWeight: 800, borderRadius: 1.5}}
                            >
                                Menuju Ke Tagihan ({extra?.data?.number ?? '-'})
                            </Button>
                        </Box>
                    )}
                </Stack>
            </Paper>
        </Box>
    )
}

type Props = {
    items: string[]
    mode: 'split' | 'full'
    label?: string
    onSuccess?: () => void
    variant?: ButtonProps['variant'],
    transaction: Transaction
}

const totalItems = (o?: Transaction) => (o?.batches ?? []).reduce((acc, b) => acc + (b.items ?? []).length, 0)
const pickBills = (o?: Transaction) => o?.bills ?? []
const getPendingActive = (o?: Transaction) => {
    const bills = pickBills(o);

    // Kumpulin semua id item transaksi (o.batches[].items[].id)
    const ids =
        (o?.batches ?? [])
            .flatMap((bt: any) => Array.isArray(bt?.items) ? bt.items : [])
            .map((it: any) => it?.id)
            .filter(Boolean);

    // Set semua id item yang SUDAH masuk bill (paid apapun)
    const allBillIdSet = new Set(
        bills
            .flatMap((b: any) => Array.isArray(b?.items) ? b.items : [])
            .map((bi: any) => bi?.transactionItem?.id)
            .filter(Boolean)
    );

    // Set id item yang masuk bill PENDING (paid null/false)
    const pendingBillIdSet = new Set(
        bills
            .filter((b: any) => (b?.paid == null) || (b?.paid?.status === false))
            .flatMap((b: any) => Array.isArray(b?.items) ? b.items : [])
            .map((bi: any) => bi?.transactionItem?.id)
            .filter(Boolean)
    );

    const paidBillIdSet = new Set(
        bills
            .filter((b: any) => (b?.paid == null) || (b?.paid?.status === true))
            .flatMap((b: any) => Array.isArray(b?.items) ? b.items : [])
            .map((bi: any) => bi?.transactionItem?.id)
            .filter(Boolean)
    );

    const pending = ids.filter((id: any) => pendingBillIdSet.has(id)).length;
    const paid  = ids.filter((id: any) => paidBillIdSet.has(id)).length;
    const active  = ids.filter((id: any) => !allBillIdSet.has(id)).length;


    return { pending, active, paid };
};

export default function NewOrderBillModal({ items, mode, label = 'Buat Tagihan', variant = 'contained', transaction }: Props) {
    const themes = useThemeCharger()

    const { txId, bumpReload, clearSelection, setReloadKey } = useTx()
    const {bump} = useTransactionEventTrigger()
    const isClosed = Boolean(transaction?.time_closed);

    const {Session} = useSession();

    const [swalProps, setSwalProps] = useState<SweetAlert2Props>({});

    const itemQty = totalItems(transaction);
    const { active, pending, paid } = getPendingActive(transaction);

    const [open, setOpen] = useState(false)
    const [fullScreen, setFullScreen] = useState(false)
    const theme = useTheme()
    const isDark = (theme.palette as any)?.mode === 'dark' || (theme.palette as any)?.colorScheme === 'dark'

    const isSplitMode = mode === 'split'
    const baseIcon = isSplitMode ? <CallSplitRounded sx={{fontSize: 36}}/> : <ReceiptLongRounded sx={{fontSize: 36}}/>
    const color: ButtonProps['color'] = (isSplitMode ? 'warning' : 'success')

    const [transactionBatchItems, setTransactionBatchItems] = useState<Array<any>>([])
    const [layoutPaper, setLayoutPaper] = useState<React.ReactNode>(<></>)

    // ====== LOCK semua input saat modal dibuka ======
    const [lockedItemsKey, setLockedItemsKey] = useState<string | null>(null)       // kunci daftar item
    const [lockedTxId, setLockedTxId] = useState<string | null>(null)               // kunci txId
    const lockRef = useRef(false)
    const openNonce = useRef<number>(0)     // penanda sesi open
    const createdOnce = useRef(false)       // sudah create bill di sesi ini?

    //================
    // 2) State: langsung simpan objek printer
    const [PrinterList, setPrinterList] = React.useState<TransactionBillPrinterDevice[]>([])
    const [selectedPrinter, setSelectedPrinter] = React.useState<TransactionBillPrinterDevice | null>(null)


    const disabled = isClosed || items.length === 0 || paid === itemQty
    const tooltip = `Buat Tagihan (${isSplitMode ? 'Split' : 'Keseluruhan'}) — ${items.length} item`


    const handleOpen = () => {
        if (isClosed || items.length === 0) return

        // ==== sesi baru: reset dan lock snapshot ====
        openNonce.current = Date.now()
        createdOnce.current = false
        setTransactionBatchItems([])   // bersihkan data sesi lama
        setLayoutPaper(<></>)          // kosongkan preview lama

        setLockedItemsKey(items.join('|'))  // snapshot ID item saat ini
        setLockedTxId(txId)                 // snapshot tx saat ini
        lockRef.current = true

        setOpen(true)
    }

    const handleClose = () => {
        setOpen(false)
        setLockedItemsKey(null)
        setLockedTxId(null)
        lockRef.current = false
    }


    React.useEffect(() => {
        window?.api.invoke?.<any, AxiosResponse<TransactionBillPrinterDevice[]>>("api.config.device.printer:read.all", {})
            .then(async ({ data }) => {
                if (selectedPrinter === null) setSelectedPrinter(data?.[0]);
                setPrinterList(data);
            })
            .catch((error) => {
                setPrinterList([])
            })
    },[])

    const onPrintHandle = (bill: TransactionBill) => {
        if (!selectedPrinter) return
        window.api.invoke('api.transaction.bills:print', {
            bill: bill?.id ?? undefined,
            printer: selectedPrinter.id
        })
            .then((res) => {
                setSwalProps({
                    show: true,
                    icon: "success",
                    theme: themes.mode,
                    title: 'Successfully Sending Printer',
                    text: `${res.msg}`,
                });
            })
            .catch((error) => {
                console.error(error);
                setSwalProps({
                    show: true,
                    icon: "error",
                    theme: themes.mode,
                    title: 'Gagal Mencetak Otomatis',
                    text: `${error?.msg ?? 'Gagal Mencetak. Printer Offline / Error.'}`,
                });
            })
    }

    // ====== Fetch items sekali dengan key terkunci (tidak terganggu prop items/transaction) ======
    useEffect(() => {
        if (!open) return
        if (!lockedItemsKey) return

        const myNonce = openNonce.current

        window?.api?.invoke?.('api.transaction.batch.item:read.all', { ids: lockedItemsKey.split('|') })
            .then((res: any) => {
                if (!lockRef.current) return
                if (myNonce !== openNonce.current) return  // hasil dari sesi lama → skip
                setTransactionBatchItems(res?.data ?? [])
            })
            .catch((error: any) => {
                if (!lockRef.current) return
                setTransactionBatchItems([])
                const e = normalizeIpcError(error)
                setLayoutPaper(<ErrorDataLayout {...e} />)
            })
    }, [open, lockedItemsKey])

    // ====== Create bill + tampilkan preview, sekali saja untuk batch yang sudah terkunci ======
    useEffect(() => {
        if (!open) return
        if (transactionBatchItems.length === 0) return
        if (!lockedTxId) return
        if (createdOnce.current) return   // sudah pernah create di sesi ini

        const myNonce = openNonce.current
        createdOnce.current = true        // kunci agar create hanya sekali

        const arrayRefactor = transactionBatchItems.map((it: any) => {
            const { id, ...rest } = it
            return { ...rest, transactionItem: { id, reference: { id: Session.id } } }
        })

        const payload = {
            reference: { id: Session.id },
            branch: Session.branches,
            transaction: { id: lockedTxId },
            number: Date.now(),
            items: arrayRefactor,
            paid: { status: false }
        }

        window?.api?.invoke?.<any, AxiosResponse<TransactionBill>>('api.transaction.bills:create', payload)
            .then((result) => {
                if (!lockRef.current) return
                if (myNonce !== openNonce.current) return // sesi sudah berganti → skip render
                onPrintHandle(result?.data);
                setLayoutPaper(
                    <BillListItemDetail
                        billId={result?.data?.id}
                        onPaySuccess={() => {
                            bumpReload()
                            bump('batch')
                            bump('pay')
                            clearSelection()
                            // tetap terkunci sampai modal ditutup; tidak recreate
                        }}
                    />
                )

                // boleh ping global, tapi TIDAK perlu recreate apa pun
                bumpReload(); bump('batch'); bump('pay'); clearSelection();
            })
            .catch((error: any) => {
                if (!lockRef.current) return
                const e = normalizeIpcError(error)
                console.log(e);
                setLayoutPaper(<ErrorDataLayout {...e} />)
            })
    }, [open, transactionBatchItems, lockedTxId])

    const ButtonEl = (
        <Button
            variant={variant}
            color={color}
            disabled={disabled}
            onClick={handleOpen}
            size="large"
            startIcon={baseIcon}
            sx={(t) => {
                const light = t.palette.mode === 'light'
                return {
                    textTransform: 'none',
                    py: 1.1,
                    px: 2.2,
                    fontWeight: 800,
                    letterSpacing: .2,
                    minHeight: 24,         // jumbo
                    fontSize: '1rem',   // ~20px
                    borderRadius: 3,       // sudut mantap
                    // --- Warna adaptif mode ---
                    bgcolor: light ? '#000' : '#fff',
                    color: light ? '#fff' : '#000',

                    // --- Hover/active states ---
                    '&:hover': {
                        bgcolor: light ? '#111' : '#f5f5f5',
                    },
                    '&:active': {
                        transform: 'translateY(1px)',
                        boxShadow: 'none',
                    },

                    // pastikan ikon ikut mewarisi warna
                    '& .MuiButton-startIcon': {mr: 1.25}
                }
            }}
        >
            {label}
        </Button>
    )

    return (
        <>
            <Tooltip title={tooltip} arrow>
        <span>
          {isSplitMode ? (
              <Badge
                  badgeContent={items.length}
                  invisible={items.length === 0}
                  anchorOrigin={{vertical: 'top', horizontal: 'right'}}
                  overlap="rectangular"
                  sx={{'& .MuiBadge-badge': {fontWeight: 800}}}
              >
                  {ButtonEl}
              </Badge>
          ) : ButtonEl}
        </span>
            </Tooltip>

            <Dialog
                open={open}
                fullWidth
                maxWidth="xl"
                fullScreen={fullScreen}
                onClose={handleClose}
                slotProps={{
                    paper: {
                        sx: {
                            display: 'flex', flexDirection: 'column',
                            height: fullScreen ? '100vh' : '85vh',
                            overflow: 'hidden',
                            transition: (t) => t.transitions.create('height', {duration: t.transitions.duration.standard}),
                        }
                    }
                }}
                PaperProps={{sx: {height: {xs: '90vh', md: '85vh'}}}}
            >
                <DialogTitle sx={{display: 'flex', alignItems: 'center', pr: 1.5, gap: 1}}>
                    <Typography variant="h6" fontWeight={800}>
                        {(isSplitMode ? 'Preview Tagihan (Split)' : 'Preview Tagihan (Keseluruhan)')}
                    </Typography>

                    <Stack direction="row" spacing={0.5} alignItems="center" sx={{ml: 'auto'}}>
                        <IconButton size="small" onClick={() => setFullScreen(v => !v)}
                                    aria-label={fullScreen ? 'Keluar layar penuh' : 'Layar penuh'}>
                            {fullScreen ? <FullscreenExitRounded fontSize="small"/> :
                                <FullscreenRounded fontSize="small"/>}
                        </IconButton>
                        <IconButton size="small" onClick={() => themes.toggleMode()}
                                    aria-label={isDark ? 'Ganti ke tema terang' : 'Ganti ke tema gelap'}>
                            {isDark ? <DarkModeRounded fontSize="small"/> : <LightModeRounded fontSize="small"/>}
                        </IconButton>
                        <IconButton size="small" onClick={handleClose} aria-label="Tutup">
                            <CloseRounded fontSize="small"/>
                        </IconButton>
                    </Stack>
                </DialogTitle>

                <DialogContent dividers sx={{p: 0, display: 'flex', flexDirection: 'column'}}>
                    <Box sx={{flex: 1, minHeight: 0}}>
                        {layoutPaper}
                    </Box>
                </DialogContent>
            </Dialog>
            <SweetAlert2 {...swalProps} />
        </>
    )
}
