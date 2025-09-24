'use client'

import * as React from 'react'
import {
    Button, Badge, Tooltip, Dialog, DialogTitle, DialogContent,
    Box, Paper, Stack, Typography, IconButton
} from '@mui/material'
import CallSplitRounded from '@mui/icons-material/CallSplitRounded'
import ReceiptLongRounded from '@mui/icons-material/ReceiptLongRounded'
import type { ButtonProps } from '@mui/material'
import { useTx } from '../context/TransactionContext'
import { useEffect, useRef, useState } from 'react'
import normalizeIpcError from '../../../../../../../../../helpers/electronMessageErrorEsctration'
import InfoOutlined from '@mui/icons-material/InfoOutlined'
import FullscreenExitRounded from '@mui/icons-material/FullscreenExitRounded'
import FullscreenRounded from '@mui/icons-material/FullscreenRounded'
import DarkModeRounded from '@mui/icons-material/DarkModeRounded'
import LightModeRounded from '@mui/icons-material/LightModeRounded'
import CloseRounded from '@mui/icons-material/CloseRounded'
import { useTheme } from '@mui/material/styles'
import { useThemeCharger } from '../../../../../../../context/ThemeCharger'
import dynamic from 'next/dynamic'
import { useTabNavigationHandlerContext } from '../../../context/TabNavigationHandlerContext'
import {useTransactionEventTrigger} from "../context/TransactionEventTriggerContext";

const BillListItemDetail = dynamic(
    () => import('./../../../../(bills)/ui/(pane)/BillsListItemDetail'),
    { ssr: true }
)

const ErrorDataLayout: React.FC<{ status: boolean, code: number | string, msg: string, raw?: any, extra?: any }> = ({ status, code, msg, raw, extra }) => {
    const { setState } = useTabNavigationHandlerContext()
    return (
        <Box sx={{ height: '100%', display: 'grid', placeItems: 'center', p: 2 }}>
            <Paper elevation={0} sx={(t)=>({
                maxWidth:640,width:'100%',p:3,border:'1px dashed',borderColor:'divider',
                bgcolor: t.palette.mode==='dark' ? 'background.default' : 'background.paper', textAlign:'center'
            })}>
                <Stack spacing={1.25} alignItems="center">
                    <InfoOutlined color="info" sx={{ fontSize:36 }}/>
                    <Typography variant="h6" fontWeight={900}>Harap Selesaikan Tagihan Terakhir</Typography>
                    <Typography variant="body2" color="text.secondary">{msg}</Typography>
                    {code===402 && (
                        <Box sx={{ display:'flex', justifyContent:'center' }}>
                            <Button
                                onClick={()=>setState(prev=>({ ...prev, active:'bills', id: extra?.data?.id ?? undefined }))}
                                variant="outlined" sx={{ textTransform:'none', fontWeight:800, borderRadius:1.5 }}
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
    variant?: ButtonProps['variant']
}

export default function NewOrderBillModal({ items, mode, label='Buat Tagihan', onSuccess, variant='contained' }: Props) {
    const { header, txId, bumpReload, clearSelection } = useTx()
    const { bump } = useTransactionEventTrigger()
    const isClosed = Boolean(header?.time_closed)

    const isPaidBool = (p:any) => p===true || p?.is_paid===true || p?.status===true
    const hasBills = Array.isArray((header as any)?.bills) && (header as any).bills.length>0
    const hasPaidField = typeof (header as any)?.paid !== 'undefined' && (header as any)?.paid !== null
    const blockedByUnpaidBill = hasBills && hasPaidField && !isPaidBool((header as any)?.paid)

    const [open, setOpen] = useState(false)
    const [fullScreen, setFullScreen] = useState(false)
    const theme = useTheme()
    const isDark = (theme.palette as any)?.mode==='dark' || (theme.palette as any)?.colorScheme==='dark'
    const { toggleMode } = useThemeCharger()

    const isSplitMode = mode==='split'
    const baseIcon = isSplitMode ? <CallSplitRounded sx={{ fontSize:36 }}/> : <ReceiptLongRounded sx={{ fontSize:36 }}/>
    const color: ButtonProps['color'] = blockedByUnpaidBill ? 'error' : (isSplitMode ? 'warning' : 'success')

    const [transactionBatchItems, setTransactionBatchItems] = useState<Array<any>>([])
    const [layoutPaper, setLayoutPaper] = useState<React.ReactNode>(<></>)

    // ====== LOCK semua input saat modal dibuka ======
    const [lockedBlocked, setLockedBlocked] = useState<boolean | null>(null)
    const [lockedItemsKey, setLockedItemsKey] = useState<string | null>(null)       // kunci daftar item
    const [lockedTxId, setLockedTxId] = useState<string | null>(null)               // kunci txId
    const lockRef = useRef(false)

    const modalBlocked = open ? (lockedBlocked ?? blockedByUnpaidBill) : blockedByUnpaidBill
    const disabled = isClosed || items.length===0 || blockedByUnpaidBill
    const tooltip = blockedByUnpaidBill
        ? 'Tidak bisa membuat tagihan: ada tagihan sebelumnya yang belum lunas.'
        : `Buat Tagihan (${isSplitMode ? 'Split':'Keseluruhan'}) — ${items.length} item`

    const openWithUnpaidBillNotice = () => {
        const firstBill = (header as any)?.bills?.[0] ?? null
        setLayoutPaper(
            <ErrorDataLayout
                status={false}
                code={402}
                msg={'Terdapat tagihan belum lunas untuk transaksi ini. Selesaikan dahulu sebelum membuat tagihan baru.'}
                extra={{ data: firstBill }}
            />
        )
        setOpen(true)
    }

    const handleOpen = () => {
        if (isClosed || items.length===0) return
        // kunci snapshot saat ini
        setLockedBlocked(blockedByUnpaidBill)
        setLockedItemsKey(items.join('|'))      // gunakan string stabil agar efek tidak kepicu lagi
        setLockedTxId(txId)
        lockRef.current = true

        if (blockedByUnpaidBill) return openWithUnpaidBillNotice()
        setOpen(true)
    }
    const handleClose = () => {
        setOpen(false)
        setLockedBlocked(null)
        setLockedItemsKey(null)
        setLockedTxId(null)
        lockRef.current = false
    }

    // ====== Fetch items sekali dengan key terkunci (tidak terganggu prop items/header) ======
    useEffect(() => {
        if (!open || modalBlocked) return
        if (!lockedItemsKey) return

        window?.api?.invoke?.('api.transaction.batch.item:read.all', { ids: lockedItemsKey.split('|') })
            .then((res:any) => {
                // jangan hapus preview yang sudah ada (biar gak “kedip”)
                if (!lockRef.current) return
                setTransactionBatchItems(res?.data ?? [])
            })
            .catch((error:any) => {
                if (!lockRef.current) return
                setTransactionBatchItems([])
                const e = normalizeIpcError(error)
                setLayoutPaper(<ErrorDataLayout {...e} />)
            })
        // HANYA tergantung lock, bukan props items/header
    }, [open, modalBlocked, lockedItemsKey])

    // ====== Create bill + tampilkan preview, sekali saja untuk batch yang sudah terkunci ======
    useEffect(() => {
        if (!open || modalBlocked) return
        if (transactionBatchItems.length===0) return
        if (!lockedTxId) return

        const arrayRefactor = transactionBatchItems.map((it:any) => {
            const { id, ...rest } = it
            return { ...rest, transactionItem: { id } }
        })

        const payload = {
            reference: { id: '00000000-0000-5000-a000-000000000000' },
            branch: [{ id: '00000000-0000-5000-a000-000000000000' }],
            transaction: { id: lockedTxId },
            number: Date.now(),
            items: arrayRefactor,
        }

        // kalau sudah ada preview (BillListItemDetail), jangan recreate
        const alreadyPreviewing = React.isValidElement(layoutPaper)
            && (layoutPaper as any)?.type?.name === 'BillListItemDetail'

        if (alreadyPreviewing) return

        window?.api?.invoke?.('api.transaction.bills:create', payload)
            .then((result:any) => {
                if (!lockRef.current) return
                setLayoutPaper(<BillListItemDetail bill={result.data} />)
                // penting: reload context TANPA memicu efek modal (karena semua input di-lock + efek tidak tergantung header/items)
                setTimeout(() => {
                    try {
                        bumpReload();
                        // 4) ping global kalau ada listener lain (boleh dipertahankan)
                        bump('batch');
                        clearSelection();
                    } catch {}
                }, 0)
            })
            .catch((error:any) => {
                if (!lockRef.current) return
                const e = normalizeIpcError(error)
                setLayoutPaper(<ErrorDataLayout {...e} />)
            })
        // HANYA tergantung state terkunci
    }, [open, modalBlocked, transactionBatchItems, lockedTxId])

    const ButtonEl = (
        <Button
            variant={variant}
            color={color}
            disabled={disabled}
            onClick={handleOpen}
            size="large"
            startIcon={baseIcon}
            sx={{ textTransform:'none', fontWeight:800, borderRadius:2, py:1.1, px:2.2 }}
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
                  color={blockedByUnpaidBill ? 'error' : 'warning'}
                  badgeContent={items.length}
                  invisible={items.length===0}
                  anchorOrigin={{ vertical:'top', horizontal:'right' }}
                  overlap="rectangular"
                  sx={{ '& .MuiBadge-badge': { fontWeight:800 } }}
              >
                  {ButtonEl}
              </Badge>
          ) : ButtonEl}
        </span>
            </Tooltip>

            <Dialog
                open={open}
                keepMounted            // <-- jaga komponen anak tetap mounted
                fullWidth
                maxWidth="xl"
                fullScreen={fullScreen}
                onClose={(e, reason) => {
                    if (reason==='backdropClick' || reason==='escapeKeyDown') return
                    handleClose()
                }}
                disableEscapeKeyDown
                slotProps={{
                    paper: {
                        sx: {
                            display:'flex', flexDirection:'column',
                            height: fullScreen ? '100vh' : '85vh',
                            overflow:'hidden',
                            transition: (t)=>t.transitions.create('height', { duration:t.transitions.duration.standard }),
                        }
                    }
                }}
                PaperProps={{ sx:{ height:{ xs:'90vh', md:'85vh' } } }}
            >
                <DialogTitle sx={{ display:'flex', alignItems:'center', pr:1.5, gap:1 }}>
                    <Typography variant="h6" fontWeight={800}>
                        {modalBlocked
                            ? 'Tagihan Belum Lunas Ditemukan'
                            : (isSplitMode ? 'Preview Tagihan (Split)' : 'Preview Tagihan (Keseluruhan)')}
                    </Typography>

                    <Stack direction="row" spacing={0.5} alignItems="center" sx={{ ml:'auto' }}>
                        <IconButton size="small" onClick={()=>setFullScreen(v=>!v)} aria-label={fullScreen ? 'Keluar layar penuh':'Layar penuh'}>
                            {fullScreen ? <FullscreenExitRounded fontSize="small"/> : <FullscreenRounded fontSize="small"/>}
                        </IconButton>
                        <IconButton size="small" onClick={()=>toggleMode()} aria-label={isDark ? 'Ganti ke tema terang':'Ganti ke tema gelap'}>
                            {isDark ? <DarkModeRounded fontSize="small"/> : <LightModeRounded fontSize="small"/>}
                        </IconButton>
                        <IconButton size="small" onClick={handleClose} aria-label="Tutup">
                            <CloseRounded fontSize="small"/>
                        </IconButton>
                    </Stack>
                </DialogTitle>

                <DialogContent dividers sx={{ p:0, display:'flex', flexDirection:'column' }}>
                    <Box sx={{ flex:1, minHeight:0 }}>
                        {layoutPaper}
                    </Box>
                </DialogContent>
            </Dialog>
        </>
    )
}
