'use client'

import * as React from 'react'
import PerfectScrollbar from 'react-perfect-scrollbar'
import 'react-perfect-scrollbar/dist/css/styles.css'
import { Box, Chip, List, ListItemButton, Stack, Typography } from '@mui/material'
import { useTx } from '../context/TransactionContext'
import LeftContainerBatchListNewOrder from './(components)/LeftContainerBatchListNewOrder'
import {useSession} from "../../../../../../../../../contexts/SessionProviderContext";
import LeftContainerBatchListRowSkeleton from '../../(loading)/LeftContainerBatchListRowSkeleton'
import dynamic from "next/dynamic";
import {Transaction, TransactionBatches, TransactionBatchesItems} from "../../types/api.transaction.type";

const LeftContainerBatchListRow = dynamic(() => import('./(components)/LeftContainerBatchListRow'), {
    ssr: false,
})

const rupiah = (n: number | string) =>
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 })
        .format(typeof n === 'string' ? parseFloat(n) : n)

const fmtDT = (iso?: string) =>
    iso
        ? new Intl.DateTimeFormat('id-ID', { dateStyle: 'medium', timeStyle: 'short', hour12: false, timeZone: 'Asia/Jakarta' })
            .format(new Date(iso))
        : '-'

const totalItem = (b: TransactionBatches) => b.items.length
const totalQty = (b: TransactionBatches) => b.items.reduce((a, i) => a + i.qty, 0)

// ===== Timer utils (tahun/bulan/hari + jam/menit/detik, tanpa minggu) =====
const addMonths = (d: Date, months: number) => {
    const nd = new Date(d.getTime())
    const targetMonth = nd.getMonth() + months
    const targetYear = nd.getFullYear() + Math.floor(targetMonth / 12)
    const month = ((targetMonth % 12) + 12) % 12
    const day = nd.getDate()
    const end = new Date(targetYear, month + 1, 0).getDate()
    nd.setFullYear(targetYear, month, Math.min(day, end))
    return nd
}
const diffParts = (start: Date, end: Date) => {
    if (end < start) return { years: 0, months: 0, days: 0, hours: 0, minutes: 0, seconds: 0 }
    let years = end.getFullYear() - start.getFullYear()
    const yAnchor = new Date(start.getTime()); yAnchor.setFullYear(start.getFullYear() + years)
    if (yAnchor > end) { years--; yAnchor.setFullYear(start.getFullYear() + years) }
    let months = (end.getMonth() - yAnchor.getMonth()) + (end.getFullYear() - yAnchor.getFullYear()) * 12
    let ymAnchor = addMonths(yAnchor, months)
    if (ymAnchor > end) { months--; ymAnchor = addMonths(yAnchor, months) }
    let ms = end.getTime() - ymAnchor.getTime()
    const sec = Math.floor(ms / 1000)
    const days = Math.floor(sec / 86400)
    const hours = Math.floor((sec % 86400) / 3600)
    const minutes = Math.floor((sec % 3600) / 60)
    const seconds = Math.floor(sec % 60)
    return { years, months, days, hours, minutes, seconds }
}
const formatReadable = (p: ReturnType<typeof diffParts>) => {
    const { years, months, days, hours, minutes, seconds } = p
    if (years > 0) return `${years} tahun, ${months} bulan, ${days} hari, ${hours} jam, ${minutes} menit`
    if (months > 0) return `${months} bulan, ${days} hari, ${hours} jam, ${minutes} menit, ${seconds} detik`
    if (days > 0) return `${days} hari, ${hours} jam, ${minutes} menit, ${seconds} detik`
    return `${hours} jam, ${minutes} menit, ${seconds} detik`
}
const TimerText: React.FC<{ startIso?: string; endIso?: string | null; active: boolean }> = ({ startIso, endIso, active }) => {
    const [now, setNow] = React.useState(() => Date.now())
    React.useEffect(() => {
        if (!active) return
        const id = setInterval(() => setNow(Date.now()), 1000)
        return () => clearInterval(id)
    }, [active])

    const label = React.useMemo(() => {
        const zero = '0 jam, 0 menit, 0 detik'
        if (!startIso) return zero
        const start = new Date(startIso)
        if (isNaN(start.getTime())) return zero

        if (active) {
            return formatReadable(diffParts(start, new Date(now)))
        } else if (endIso) {
            const end = new Date(endIso)
            if (!isNaN(end.getTime())) return formatReadable(diffParts(start, end))
        }
        return zero
    }, [active, startIso, endIso, now])

    return (
        <Typography
            variant="caption"
            sx={{
                fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
                fontWeight: 800,
                letterSpacing: 0.5,
                color: 'inherit',
                textAlign: 'right',
                whiteSpace: 'normal',
                overflowWrap: 'anywhere',
                '@keyframes tPulse': { '0%': { opacity: 0.9 }, '50%': { opacity: 1 }, '100%': { opacity: 0.9 } },
                animation: active ? 'tPulse 1.8s ease-in-out infinite' : 'none',
                userSelect: 'none',
            }}
            aria-label={active ? 'Durasi batch aktif' : 'Durasi saat transaksi ditutup'}
        >
            {label}
        </Typography>
    )
}

// ambil printerId dari product.category[].printer[]
const getPrinterIdsFromItem = (it: TransactionBatchesItems): string[] => {
    const cats: any[] = Array.isArray((it as any)?.product?.category) ? (it as any).product.category : []
    const ids: string[] = []
    cats.forEach(c => {
        const printers: any[] = Array.isArray(c?.printer) ? c.printer : []
        printers.forEach(p => { if (p?.id) ids.push(String(p.id)) })
    })
    return ids.length ? Array.from(new Set(ids)) : ['__no_printer__']
}

// kelompokkan item per printerId
const groupItemsByPrinter = (items: TransactionBatchesItems[]) => {
    const map = new Map<string, TransactionBatchesItems[]>()
    items.forEach(it => {
        const pids = getPrinterIdsFromItem(it)
        pids.forEach(pid => {
            const list = map.get(pid) ?? []
            list.push(it)
            map.set(pid, list)
        })
    })
    return map
}

// ===== Bills-aware totals =====

// helper: ambil bills dari beberapa kemungkinan shape
const pickBills = (o: any) => o?.transaction?.bills ?? o?.bills ?? []

// pending paid checker yang langsung pakai bills terpilih
/*const isPendingPaidItem = (item: any, bills: any[]) =>
    bills?.some((bill: any) =>
        (bill?.paid == null || bill?.paid?.status === false) &&
        (bill?.items ?? []).some((bi: any) => bi?.transactionItem?.id === item?.id)
    )*/

const isSuccessPaidItem = (item: any, bills: any[]) =>
    bills?.some((bill: any) =>
        (bill?.paid !== null || bill?.paid?.status === true) &&
        (bill?.items ?? []).some((bi: any) => bi?.transactionItem?.id === item?.id)
    )
// total price: skip kalau void approved atau pending paid
const totalPrices = (o: any) => {
    const bills = pickBills(o)
    return (o?.batches ?? []).reduce(
        (acc, b) =>
            acc +
            (b?.items ?? []).reduce(
                (a, i) => a + ((i?.void?.is_approved === true || isSuccessPaidItem(i, bills)) ? 0 : (+i?.sub_total || 0)),
                0
            ),
        0
    )
}

// --- utils kecil untuk batch ---
const pickBillsFromBatch = (b: any) =>
    b?.__bills
    ?? b?.transaction?.bills
    ?? b?.bills
    ?? b?.parent?.transaction?.bills
    ?? []

// --- HANYA terima Batch ---
export const batchTotal = (b: TransactionBatches) => {
    const bills = pickBillsFromBatch(b)
    return (b?.items ?? []).reduce(
        (acc: number, i: any) =>
            acc + ((i?.void?.is_approved === true || isSuccessPaidItem(i, bills)) ? 0 : (+i?.sub_total || 0)),
        0
    )
}

export const getPendingActiveForBatch = (batch: any) => {
    const bills = pickBillsFromBatch(batch)

    const ids =
        (batch?.items ?? [])
            .map((it: any) => it?.id)
            .filter(Boolean);

    const allBillIdSet = new Set(
        bills
            .flatMap((b: any) => Array.isArray(b?.items) ? b.items : [])
            .map((bi: any) => bi?.transactionItem?.id)
            .filter(Boolean)
    );

    const pendingBillIdSet = new Set(
        bills
            .filter((b: any) => (b?.paid == null) || (b?.paid?.status === false))
            .flatMap((b: any) => Array.isArray(b?.items) ? b.items : [])
            .map((bi: any) => bi?.transactionItem?.id)
            .filter(Boolean)
    );

    const pending = ids.filter((id: any) => pendingBillIdSet.has(id)).length;
    const active  = ids.filter((id: any) => !allBillIdSet.has(id)).length;

    return { pending, active };
};


const LeftContainerBatchList: React.FC<{ transaction: Transaction }> = ({ transaction }) => {
    const { txId, setGrandTotal, selectedBatchId, setSelectedBatchId, reloadKey, setReloadKey } = useTx()
    const [batches, setBatches] = React.useState<TransactionBatches[]>([])
    const { Session } = useSession()
    const [isLoading, setIsLoading] = React.useState(false)

    React.useEffect(() => {
        if (!txId) { setBatches([]); return }
        setIsLoading(true)
        // @ts-ignore
        window.api.invoke('api.transaction.batch:read.all', {
            transaction: txId,
            reference: Session.id ?? undefined
        })
            .then((res: any) => {
                const list = (res?.data ?? []) as any[]
                const t = list[0]?.transaction
                setGrandTotal(totalPrices(t))
                const bills = t?.bills ?? []
                const mapped: TransactionBatches[] = list.map(b => ({
                    id: String(b.id),
                    batch: Number(b.batch),
                    note: b.note ?? null,
                    time_created: b.time_created,
                    time_updated: b.time_updated,
                    items: Array.isArray(b.items) ? b.items : [],
                    __bills: bills,
                })).sort((a, b) => b.batch - a.batch)
                setBatches(mapped)
                //if (!selectedBatchId && mapped.length) setSelectedBatchId(mapped[0].id)
            })
            .catch(() => setBatches([]))
            .finally(() => setIsLoading(false))
    }, [txId, reloadKey, setGrandTotal, setSelectedBatchId])

    const onClickItem = (b: TransactionBatches) => {
        setSelectedBatchId(selectedBatchId === b.id ? '' as any : b.id) // gunakan '' sebagai NONE
        setReloadKey(k => k + 1)
    }

    const showSkeleton = isLoading && batches.length === 0

    if (!txId) {
        return (
            <Box sx={{ display: 'grid', placeItems: 'center', height: '100%', color: 'text.secondary' }}>
                <Typography variant="body2">Pilih transaksi dulu.</Typography>
            </Box>
        )
    }

    // ======= ⬇️ GANTI skeleton section dengan RowSkeleton =======
    if (showSkeleton) {
        return (
            <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                {/* Header dibikin sama biar layout stabil */}
                <Box sx={{
                    px: 1.25, py: 1,
                    borderBottom: '1px solid',
                    borderColor: 'divider',
                    bgcolor: 'background.paper',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 1
                }}>
                    <Stack direction="row" spacing={1} alignItems="center" minWidth={0} />
                    {/* tombol New Order tetap tampil agar user bisa langsung klik */}
                    <LeftContainerBatchListNewOrder tx={transaction} />
                </Box>

                <Box sx={{ flex: 1, minHeight: 0, overflow: 'hidden' }}>
                    <PerfectScrollbar options={{ suppressScrollX: true, wheelPropagation: false, swipeEasing: true }}>
                        <List disablePadding sx={{ py: 1, pr: 1 }}>
                            <LeftContainerBatchListRowSkeleton />
                            <LeftContainerBatchListRowSkeleton />
                            <LeftContainerBatchListRowSkeleton selected />
                            <Typography variant="caption" sx={{ color: 'text.secondary', px: 1.5, py: 0.5 }}>
                                Memuat batch… Server Sedang Mengelola Data 🔄
                            </Typography>
                        </List>
                    </PerfectScrollbar>
                </Box>
            </Box>
        )
    }
    // ======= ⬆️ END skeleton =======

    if (!isLoading && batches.length === 0) {
        return (
            <Box sx={{ display: 'grid', placeItems: 'center', height: '100%', color: 'text.secondary' }}>
                <Typography variant="body2">Belum ada batch.</Typography>
            </Box>
        )
    }

    return (
        <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            {/* Header */}
            <Box sx={{
                px: 1.25, py: 1,
                borderBottom: '1px solid',
                borderColor: 'divider',
                bgcolor: 'background.paper',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 1
            }}>
                <Stack direction="row" spacing={1} alignItems="center" minWidth={0} />
                <LeftContainerBatchListNewOrder tx={transaction} />
            </Box>

            {/* Scroll area */}
            <Box sx={{ flex: 1, minHeight: 0, overflow: 'hidden' }}>
                <PerfectScrollbar options={{ suppressScrollX: true, wheelPropagation: false, swipeEasing: true }}>
                    <List disablePadding sx={{ py: 1, pr: 1 }}>
                        {batches.map(b => {
                            const selected = selectedBatchId === b.id
                            const priceNum = batchTotal(b)
                            const priceLbl = rupiah(priceNum)
                            const { active, pending } = getPendingActiveForBatch(b)

                            return (
                                <LeftContainerBatchListRow
                                    key={b.id}
                                    batch={b}
                                    transaction={transaction}
                                    selected={selected}
                                    priceLabel={priceLbl}
                                    totalItem={b.items.length}
                                    totalQty={b.items.reduce((a, i) => a + i.qty, 0)}
                                    activeCount={active}
                                    pendingCount={pending}
                                    startIso={b.time_created}
                                    endIso={transaction?.time_closed ?? null}
                                    isActiveTimer={!transaction?.time_closed}
                                    onClick={onClickItem}
                                    TimerText={TimerText}
                                />
                            )
                        })}
                    </List>
                </PerfectScrollbar>
            </Box>
        </Box>
    )
}


export default React.memo(LeftContainerBatchList);
