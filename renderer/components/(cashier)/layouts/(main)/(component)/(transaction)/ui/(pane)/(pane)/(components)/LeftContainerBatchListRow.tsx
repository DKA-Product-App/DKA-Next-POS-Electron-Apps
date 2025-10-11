'use client'

import * as React from 'react'
import { Box, Chip, ListItemButton, Stack, Typography } from '@mui/material'
import LayersRounded from '@mui/icons-material/LayersRounded'
import LocalMallRounded from '@mui/icons-material/LocalMallRounded'
import LeftContainerBatchPrintChecker from './../(components)/LeftContainerBatchPrintChecker'
import {TransactionBatch} from "../../../../../../../../../../types/transaction/batch/transaction.batch.type";

type Props = {
    batch: TransactionBatch
    onClick: (batch : TransactionBatch) => void;
    selected: boolean;
}



const rupiah = (n: number | string) =>
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 })
        .format(typeof n === 'string' ? parseFloat(n) : n)
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
const isSuccessPaidItem = (item: any, bills: any[]) =>
    bills?.some((bill: any) =>
        (bill?.paid !== null || bill?.paid?.status === true) &&
        (bill?.items ?? []).some((bi: any) => bi?.transactionItem?.id === item?.id)
    )
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

const pickBillsFromBatch = (b: any) =>
    b?.__bills
    ?? b?.transaction?.bills
    ?? b?.bills
    ?? b?.parent?.transaction?.bills
    ?? []

// --- HANYA terima Batch ---
export const batchTotal = (b: TransactionBatch) => {
    const bills = pickBillsFromBatch(b)
    return (b?.items ?? []).reduce(
        (acc: number, i: any) =>
            acc + ((i?.void?.is_approved === true || isSuccessPaidItem(i, bills)) ? 0 : (+i?.sub_total || 0)),
        0
    )
}

const LeftContainerBatchListRow: React.FC<Props> = ({batch, onClick, selected }) => {
    const cardBorderColor = selected ? 'primary.outlinedBorder' : 'divider'
    const isClosed = Boolean(batch.transaction?.time_closed !== null )

    const { active, pending } = getPendingActiveForBatch(batch)
    // ★ status chip rules: closed -> merah, pending ada -> warning, else aktif -> hijau
    const statusChip =
        isClosed ? { label: 'Selesai', color: 'error' as const } :
            pending > 0 ? { label: 'Pending', color: 'warning' as const } :
                { label: 'Aktif', color: 'success' as const }

    // ★ helper flags buat footer
    const allSuccessPaid = pending === 0 && active === 0
    const hasPending = pending > 0

    // ★ gradient constants
    const GRAD_WARN_TO_SUCCESS = 'linear-gradient(90deg, #F59E0B, #10B981)' // kuning→hijau
    const GRAD_ERROR_TO_WARN   = 'linear-gradient(90deg, #EF4444, #F59E0B)' // merah→kuning
    const GRAD_GRAY            = 'linear-gradient(90deg, #9CA3AF, #6B7280)' // abu-abu
    const GRAD_PURPLE_PINK     = 'linear-gradient(180deg, #6366F1, #8B5CF6 35%, #EC4899)' // existing selected bar

    // ★ left color bar (sebelum judul) ikut aturan:
    // - selected: tetap ungu→pink (as-is)
    // - closed + pending: merah→kuning
    // - closed: merah solid
    // - aktif + pending: kuning→hijau
    const leftStripe = selected
        ? GRAD_PURPLE_PINK
        : isClosed
            ? (hasPending ? GRAD_ERROR_TO_WARN : 'linear-gradient(90deg, #ef4444, #dc2626 35%, #b91c1c)')
            : (hasPending ? GRAD_WARN_TO_SUCCESS : 'transparent')

    // ★ footer background:
    // - semua item success paid -> abu-abu
    // - closed + pending -> merah→kuning
    // - closed -> merah solid
    // - aktif + pending -> kuning→hijau
    // - else -> success solid
    const footerBg = allSuccessPaid
        ? GRAD_GRAY
        : isClosed
            ? (hasPending ? GRAD_ERROR_TO_WARN : 'linear-gradient(90deg, #DC2626, #EF4444)')
            : (hasPending ? GRAD_WARN_TO_SUCCESS : 'success.main')

    // ★ footer text color: gradient -> putih; solid pakai contrastText tema
    const footerColor =
        footerBg.includes('linear-gradient') ? '#fff'
            : isClosed ? 'error.contrastText'
                : hasPending ? 'warning.contrastText'
                    : 'success.contrastText'

    React.useEffect(() => {
        if (selected){
            console.log(batch);
        }
    },[selected])

    return (
        <>
            <ListItemButton
                selected={selected}
                onClick={() => onClick(batch)}
                sx={{
                    position: 'relative',
                    alignItems: 'flex-start',
                    py: 1.1, px: 1.4, mb: 0,
                    border: '1px solid',
                    borderColor: cardBorderColor,
                    bgcolor: selected ? 'action.selected' : 'background.paper',
                    boxShadow: selected ? '0 10px 24px rgba(0,0,0,0.12)' : '0 2px 8px rgba(0,0,0,0.04)',
                    transition: 'transform .15s ease, box-shadow .2s ease, border-color .2s ease, background-color .2s ease',
                    '&:hover': { transform: 'translateY(-1px)', boxShadow: '0 12px 28px rgba(0,0,0,0.12)', bgcolor: selected ? 'action.selected' : 'action.hover' },
                    borderBottomLeftRadius: 0,
                    borderBottomRightRadius: 0,
                    borderTopLeftRadius: 8,
                    borderTopRightRadius: 8,
                    '&::before': {
                        content: '""', position: 'absolute', left: 0, top: 0, bottom: 0, width: 4,
                        borderTopLeftRadius: 8,
                        background: selected
                            ? 'linear-gradient(180deg, #6366F1, #8B5CF6 35%, #EC4899)'
                            : (isClosed ? 'linear-gradient(90deg, #ef4444, #dc2626 35%, #b91c1c)' : 'transparent'),
                    },
                }}
            >
                <Stack spacing={1.1} width="100%">
                    {/* Baris 1: Judul + Harga */}
                    <Stack direction="row" alignItems="center" justifyContent="space-between" gap={1}>
                        <Stack direction="row" spacing={1} alignItems="center" minWidth={0}>
                            <LayersRounded fontSize="small" />
                            <Typography variant="h6" fontWeight={800}># {String(batch.batch)}</Typography>
                            <Chip size="small" label={statusChip.label} color={statusChip.color} variant="filled" />
                        </Stack>
                        <Typography variant="subtitle1" fontWeight={800} title={rupiah(batchTotal(batch))}>
                            {rupiah(batchTotal(batch))}
                        </Typography>
                    </Stack>

                    {/* Baris 2: item/qty kiri, PRINT kanan */}
                    <Stack direction="row" alignItems="center" gap={0.75}>
                        <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap sx={{ flex: 1, minWidth: 0 }}>
                            <Chip size="small" icon={<LocalMallRounded />} label={`${batch.items.length} item`} />
                            <Chip size="small" icon={<LocalMallRounded />} label={`${batch.items.reduce((a, i) => a + i.qty, 0)} Qty`} />
                        </Stack>
                        {/*<LeftContainerBatchPrintChecker transaction={transaction} batch={batch} />*/}
                    </Stack>

                    {/* Baris 3: active/pending */}
                    <Stack direction="row" alignItems="center" gap={0.75}>
                        <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap sx={{ flex: 1, minWidth: 0 }}>
                            <Chip size="small" icon={<LocalMallRounded />} label={`${active} active`} />
                            <Chip size="small" icon={<LocalMallRounded />} label={`${pending} Pending`} />
                        </Stack>
                    </Stack>
                </Stack>
            </ListItemButton>

            {/* Footer di luar card */}
            <Box
                sx={{
                    border: '1px solid',
                    borderTop: 'none',
                    borderColor: cardBorderColor,
                    borderBottomLeftRadius: 8,
                    borderBottomRightRadius: 8,
                    bgcolor: footerBg.includes('linear-gradient') ? undefined : footerBg, // ★ solid via theme key
                    background: footerBg.includes('linear-gradient') ? footerBg : undefined, // ★ gradient manual
                    color: footerColor, // ★ text color adaptif
                    px: 1.4, py: 0.75, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1, mb: 1,
                }}
            >
                <TimerText startIso={batch.time_created} endIso={batch.transaction?.time_closed ?? null} active={!batch.transaction?.time_closed} />
            </Box>
        </>
    )
}

export default React.memo(LeftContainerBatchListRow);
