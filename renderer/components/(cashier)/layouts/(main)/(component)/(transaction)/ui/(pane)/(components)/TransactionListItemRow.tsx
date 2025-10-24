// TransactionListItemRow.tsx
'use client'

import * as React from 'react'
import {Box, Checkbox, Chip, ListItemButton, Stack, Typography} from '@mui/material'
import {alpha} from '@mui/material/styles'

import ReceiptLongRounded from '@mui/icons-material/ReceiptLongRounded'
import LocalMallRounded from '@mui/icons-material/LocalMallRounded'
import StorageIcon from '@mui/icons-material/Storage';
import LayersRounded from '@mui/icons-material/LayersRounded'
import PersonOutlineRounded from '@mui/icons-material/PersonOutlineRounded'
import AccessTimeRounded from '@mui/icons-material/AccessTimeRounded'
import CheckRounded from '@mui/icons-material/CheckRounded'
import moment from "moment-timezone"
import TransactionListItemPrintTransaction from './TransactionListItemPrintTransaction'
import {useEffect} from "react";
import {AxiosResponse} from "axios";
import {SummarizeTxReturn} from "../../../types/transaction.read.one.type";
import {Transaction} from "../../../../../../../../../types/transaction/transaction.type";
import ShimmerLoadingTransactionListItemRow from "../../(loading)/ShimmerLoadingTransactionListItemRow";
/* ========= Utils khusus Row ========= */
const rupiah = (n: number | string) =>
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 })
        .format(typeof n === 'string' ? parseFloat(n) : n)


const totalQty = (transaction: Transaction) => (transaction?.batches ?? []).reduce((acc, b) => acc + (b.items ?? []).reduce((a, i) => a + i.qty, 0), 0)
const totalItems = (transaction: Transaction) => (transaction?.batches ?? []).reduce((acc, b) => acc + (b.items ?? []).length, 0)
const totalBatches = (transaction: Transaction) => (transaction?.batches ?? []).length

// ====== Bills-aware helpers ======
const pickBills = (transaction: Transaction) => transaction?.bills ?? [];
const getStatusSummary = (o: Transaction) => {
    const bills = pickBills(o);
    const allTxItems = (o?.batches ?? []).flatMap(b => b?.items ?? []).filter(Boolean);

    // ---------- Helper ----------
    const sid = (v?: unknown) => v != null ? String(v) : "";
    const notNull = <T,>(x: T | null | undefined): x is T => x != null;

    // ---------- Kumpulan ID item transaksi ----------
    const allItemIdsSet = new Set(allTxItems.map(it => sid(it.id)).filter(Boolean));

    // ---------- VOID ----------
    const voidPendingIdsSet  = new Set(allTxItems.filter(it => it?.void?.is_approved === false).map(it => sid(it.id)).filter(Boolean));
    const voidApprovedIdsSet = new Set(allTxItems.filter(it => it?.void?.is_approved === true).map(it => sid(it.id)).filter(Boolean));
    const notVoided = (id: string) => !voidPendingIdsSet.has(id) && !voidApprovedIdsSet.has(id);

    // ---------- Group transaksi per variantId (yang tidak di-void) ----------
    type TxBucket = { variantId: string; items: { id: string; t: string }[] };
    const txBucketsMap = allTxItems
        .map(it => ({ id: sid(it.id), t: it?.time_created ?? "", variantId: sid(it?.variant?.id) }))
        .filter(r => r.id && r.variantId && notVoided(r.id))
        .reduce<Map<string, TxBucket>>((acc, r) => {
            const got = acc.get(r.variantId) ?? { variantId: r.variantId, items: [] };
            got.items.push({ id: r.id, t: r.t });
            acc.set(r.variantId, got);
            return acc;
        }, new Map());

    // Urutkan item dalam setiap bucket biar alokasi deterministik
    txBucketsMap.forEach(b => b.items.sort((a, b2) => (a.t || "").localeCompare(b2.t || "") || a.id.localeCompare(b2.id)));

    // ---------- Hitung billed/paid per variant ----------
    // Catatan: jika TIDAK ada field b.paid/status, treat semua sebagai "pendingPaid"
    const billAllItems = bills.flatMap(b => (b?.items ?? []).map(it => ({ billPaid: !!b?.paid?.status, it })));

    const countByVariant = billAllItems.reduce<Record<string, { paid: number; billed: number; pending: number }>>((acc, r) => {
        const variantId = sid(r.it?.productVariant?.id);
        if (!variantId) return acc;

        const got = acc[variantId] ?? { paid: 0, billed: 0, pending: 0 };
        got.billed += 1;

        if (r.billPaid) got.paid += 1;
        else got.pending += 1;

        acc[variantId] = got;
        return acc;
    }, {});

    // ---------- Alokasi ke item transaksi ----------
    const paidIdsSet        = new Set<string>();
    const pendingPaidIdsSet = new Set<string>();
    const billedIdsSet      = new Set<string>(); // semua yang masuk bill (paid+pending)

    Array.from(txBucketsMap.values()).forEach(bucket => {
        const stats = countByVariant[bucket.variantId] ?? { paid: 0, billed: 0, pending: 0 };
        const { paid, pending, billed } = stats;

        // clamp biar nggak over-assign
        const n = bucket.items.length;
        const paidN    = Math.min(paid, n);
        const pendN    = Math.min(pending, Math.max(0, n - paidN));
        const billedN  = Math.min(billed, n);

        // assign: paid → pending → sisanya unpaid
        const paidChunk    = bucket.items.slice(0, paidN);
        const pendingChunk = bucket.items.slice(paidN, paidN + pendN);
        const billedChunk  = bucket.items.slice(0, billedN); // total yang dianggap "sudah ditagih"

        paidChunk.forEach(x => paidIdsSet.add(x.id));
        pendingChunk.forEach(x => pendingPaidIdsSet.add(x.id));
        billedChunk.forEach(x => billedIdsSet.add(x.id));
    });

    // ---------- Hasil akhir ----------
    const allIds       = Array.from(allItemIdsSet);
    const pendingVoid  = Array.from(voidPendingIdsSet);
    const voided       = Array.from(voidApprovedIdsSet);

    // keluarkan yang void dari perhitungan bayar
    const notVoidedIds = allIds.filter(notVoided);

    const paidIds      = notVoidedIds.filter(id => paidIdsSet.has(id));
    const pendingIds   = notVoidedIds.filter(id => pendingPaidIdsSet.has(id) && !paidIdsSet.has(id));
    const unpaidIds    = notVoidedIds.filter(id => !billedIdsSet.has(id)); // belum pernah masuk bill sama sekali

    return {
        counts: {
            pendingVoid: pendingVoid.length,
            void: voided.length,
            pendingPaid: pendingIds.length,
            paid: paidIds.length,
            unpaid: unpaidIds.length,
        },
        ids: {
            pendingVoid,
            void: voided,
            pendingPaid: pendingIds,
            paid: paidIds,
            unpaid: unpaidIds,
        },
    };
};
// Total harga transaksi, skip void-approved & success-paid
const totalPrices = (transaction: Transaction) => {
    const paidTxnItemIds = transaction?.bills
        .filter(b => b?.paid?.status === true)
        .flatMap(b => b?.items ?? [])
        .map(it => it?.productVariant?.id)
        .filter((id): id is string => Boolean(id));

    const orders = transaction?.batches
        .flatMap(b => b?.items ?? [])
        .filter(() => transaction?.time_closed === null)
        .filter(it => it?.void === null || it?.void?.is_approved === false)
        .filter(it => !paidTxnItemIds.includes(it.id))
        .reduce((sum, it) => sum + Number(it?.sub_total ?? 0), 0);

    return { orders } as const;
};

/* ========= Timer ========= */
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
    const ms = end.getTime() - ymAnchor.getTime()
    const sec = Math.floor(ms / 1000)
    const days = Math.floor(sec / 86400)
    const hours = Math.floor((sec % 86400) / 3600)
    const minutes = Math.floor((sec % 3600) / 60)
    const seconds = Math.floor(sec % 60)
    return { years, months, days, hours, minutes, seconds }
}
const formatReadable = (p: ReturnType<typeof diffParts>) => {
    const { years, months, days, hours, minutes, seconds } = p
    if (years > 0)   return `${years} tahun, ${months} bulan, ${days} hari, ${hours} jam, ${minutes} menit`
    if (months > 0)  return `${months} bulan, ${days} hari, ${hours} jam, ${minutes} menit, ${seconds} detik`
    if (days > 0)    return `${days} hari, ${hours} jam, ${minutes} menit, ${seconds} detik`
    return `${hours} jam, ${minutes} menit, ${seconds} detik`
}
const TimerText: React.FC<{ startIso?: string; endIso?: string | null; active: boolean }> = ({ startIso, endIso, active }) => {
    const [now, setNow] = React.useState(() => Date.now())
    React.useEffect(() => { if (!active) return; const id = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(id) }, [active])
    const label = React.useMemo(() => {
        const zero = '0 jam, 0 menit, 0 detik'
        if (!startIso) return zero
        const start = new Date(startIso)
        if (isNaN(start.getTime())) return zero
        if (active) return formatReadable(diffParts(start, new Date(now)))
        if (endIso) {
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
                fontWeight: 800, letterSpacing: 0.6, color: 'inherit', textAlign: 'right', whiteSpace: 'normal', overflowWrap: 'anywhere',
                '@keyframes tPulse': { '0%': { opacity: 0.9 }, '50%': { opacity: 1 }, '100%': { opacity: 0.9 } },
                animation: active ? 'tPulse 1.8s ease-in-out infinite' : 'none', userSelect: 'none',
            }}
            aria-label={active ? 'Durasi transaksi aktif' : 'Durasi saat transaksi ditutup'}
        >
            {label}
        </Typography>
    )
}

/* ========= Checkbox bulat ========= */
const RoundCheckbox: React.FC<{
    checked: boolean
    onChange: (checked: boolean) => void
    onClick?: (e: React.MouseEvent) => void
    'aria-label'?: string
    sizePx?: number
    colorKey?: 'success' | 'primary' | 'info'
    outScale?: number
    overshootScale?: number
    durationMs?: number
}> = ({
          checked, onChange, onClick, 'aria-label': ariaLabel,
          sizePx = 22, colorKey = 'success', outScale = 0.33, overshootScale = 1.18, durationMs = 360,
      }) => {
    const baseSx = { width: sizePx, height: sizePx, borderRadius: '50%', display: 'grid', placeItems: 'center', transition: 'all .22s ease' } as const
    const uncheckedIcon = <span className="round-unchecked" style={{ ...baseSx, border: '2px solid', borderColor: 'currentColor' }} />
    const checkedIcon = (
        <span className="round-checked" style={{ ...baseSx, ['--outScale' as any]: outScale, ['--overScale' as any]: overshootScale, ['--dur' as any]: `${durationMs}ms` } as React.CSSProperties }>
      <CheckRounded fontSize="inherit" />
    </span>
    )

    return (
        <Checkbox
            checked={checked}
            onChange={(e) => onChange(e.target.checked)}
            onClick={onClick}
            inputProps={{ 'aria-label': ariaLabel }}
            icon={uncheckedIcon}
            checkedIcon={checkedIcon}
            disableRipple
            sx={(theme) => ({
                p: 0, color: theme.palette.text.disabled,
                '& .round-unchecked': { color: theme.palette.action.disabled, transform: 'scale(1)', background: theme.palette.background.paper },
                '& .round-checked': {
                    color: theme.palette.common.white,
                    backgroundColor: theme.palette[colorKey].main,
                    border: `2px solid ${theme.palette[colorKey].main}`,
                    boxShadow: `0 0 0 6px ${alpha(theme.palette[colorKey].main, 0.16)} inset, 0 3px 10px ${alpha(theme.palette[colorKey].main, 0.35)}`,
                    transform: 'scale(1)', animation: 'zoomOutIn var(--dur) cubic-bezier(.2,.9,.1,1.2)', transformOrigin: 'center',
                    '& .MuiSvgIcon-root': { fontSize: sizePx * 0.78 },
                },
                '&:hover .round-unchecked': { boxShadow: `0 0 0 4px ${alpha(theme.palette[colorKey].main, 0.08)} inset` },
                '&:hover .round-checked': { boxShadow: `0 0 0 6px ${alpha(theme.palette[colorKey].main, 0.22)} inset, 0 3px 12px ${alpha(theme.palette[colorKey].main, 0.45)}` },
                '@media (prefers-reduced-motion: reduce)': { '& .round-checked': { animation: 'none' } },
                '@keyframes zoomOutIn': {
                    '0%': { transform: 'scale(1)' },
                    '35%': { transform: 'scale(var(--outScale))' },
                    '65%': { transform: 'scale(var(--overScale))' },
                    '100%': { transform: 'scale(1)' },
                },
            })}
        />
    )
}

/* ========= ROW ========= */
export const TransactionListItemRow: React.FC<{
    transactionId: string
    singleSelected?: boolean
    multiChecked?: boolean
    onRowClick?: () => void
    onMultiToggle?: (checked: boolean) => void
}> = ({ transactionId, singleSelected = false, multiChecked = false, onRowClick, onMultiToggle }) => {
    
    const [transaction, setTransaction ] = React.useState<Transaction>(undefined);
    const [transactionMeta, setTransactionMeta ] = React.useState<SummarizeTxReturn>(undefined);
    const isClosed = React.useMemo(() => Boolean(transaction?.time_closed), [transaction])

    // ★ flags/gradients
    const hasPending = transactionMeta?.raw.batchItems?.active.count > 0
    const allSuccessPaid = transactionMeta?.raw.batchItems?.active.count === 0

    const GRAD_WARN_TO_SUCCESS = 'linear-gradient(90deg, #F59E0B, #10B981)'
    const GRAD_ERROR_TO_WARN   = 'linear-gradient(90deg, #EF4444, #F59E0B)'
    const GRAD_GRAY            = 'linear-gradient(90deg, #9CA3AF, #6B7280)'
    const GRAD_PURPLE_PINK     = 'linear-gradient(180deg, #6366F1, #8B5CF6 35%, #EC4899)'

    const cardBorderColor = singleSelected ? 'primary.outlinedBorder' : (isClosed ? 'error.light' : 'divider')

    // ★ left stripe logic (mirror aturan komponen list batch)
    const leftStripe = singleSelected
        ? GRAD_PURPLE_PINK
        : isClosed
            ? (hasPending ? GRAD_ERROR_TO_WARN : 'linear-gradient(180deg, #ef4444, #dc2626 60%, #b91c1c)')
            : (hasPending ? GRAD_WARN_TO_SUCCESS : 'transparent')

    // ★ footer background:
    // - all success paid -> abu-abu
    // - closed + pending -> merah→kuning
    // - closed -> merah solid
    // - aktif + pending -> kuning→hijau
    // - else -> success solid
    const footerBg = allSuccessPaid
        ? GRAD_GRAY
        : isClosed
            ? (hasPending ? GRAD_ERROR_TO_WARN : 'linear-gradient(90deg, #DC2626, #EF4444)')
            : (hasPending ? GRAD_WARN_TO_SUCCESS : 'success.main')

    // ★ footer text color (gradient = putih; solid = contrast)
    const footerColor =
        footerBg.includes('linear-gradient') ? '#fff'
            : isClosed ? 'error.contrastText'
                : hasPending ? 'warning.contrastText'
                    : 'success.contrastText'


    useEffect(() => {
        window.api.invoke<{ id : string }, { data : Transaction, meta: SummarizeTxReturn }>('api.transaction:read.one', {
            id : transactionId,
        })
            .then(({ data, meta }) => {
                console.log(data);
                setTransaction(data);
                setTransactionMeta(meta)
            })
            .catch((err: any) => {
                console.error(err)
                setTransaction(undefined)
                setTransactionMeta(undefined)
            })
    }, [transactionId]);
    
    return (
        <>
            {
                (transaction) ? (
                    <>
                        <ListItemButton
                            onClick={onRowClick}
                            selected={singleSelected}
                            sx={{
                                position: 'relative', alignItems: 'flex-start', py: 1.25, px: 1.5, mb: 0,
                                border: '1px solid', borderColor: cardBorderColor,
                                bgcolor: singleSelected ? 'action.selected' : (isClosed ? 'action.hover' : 'background.paper'),
                                boxShadow: singleSelected ? '0 10px 24px rgba(0,0,0,0.12)' : '0 2px 8px rgba(0,0,0,0.04)',
                                transition: 'transform .15s ease, box-shadow .2s ease, border-color .2s ease, background-color .2s ease',
                                transform: 'translateY(0)',
                                '&:hover': { transform: 'translateY(-1px)', boxShadow: '0 12px 28px rgba(0,0,0,0.12)', bgcolor: singleSelected ? 'action.selected' : (isClosed ? 'action.hover' : 'action.hover') },
                                borderTopLeftRadius: 8, borderTopRightRadius: 8, borderBottomLeftRadius: 0, borderBottomRightRadius: 0,
                                '&::before': {
                                    content: '""', position: 'absolute', left: 0, top: 0, bottom: 0, width: 4,
                                    borderTopLeftRadius: 8, borderBottomLeftRadius: 0,
                                    background: leftStripe, // ★ pakai aturan baru
                                },
                            }}
                        >
                            <Stack spacing={0.75} width="100%">
                                {/* Baris 1 */}
                                <Stack direction="row" alignItems="center" justifyContent="space-between" gap={1}>
                                    <Stack direction="row" spacing={1} alignItems="center" minWidth={0}>
                                        <ReceiptLongRounded fontSize="small" />
                                        <Typography variant="h6" fontWeight={900} noWrap sx={{ letterSpacing: 0.2, lineHeight: 1.2, fontFeatureSettings: '"tnum" 1, "lnum" 1' }}>
                                            # {transaction?.invoice}
                                        </Typography>
                                        <Chip size="small" color="secondary" label={transaction?.order_type?.name ?? '-'} variant="outlined" />
                                        {
                                            transaction?.table && (
                                                <Chip size="small" color="primary" label={transaction?.table?.code ? `${transaction?.table.code} - ${transaction?.table.floor.code}` : 'No table'} variant="outlined" />
                                            )
                                        }
                                    </Stack>
                                    <Typography
                                        variant="subtitle1"
                                        fontWeight={900}
                                        title={rupiah(transactionMeta?.raw.batchItems.active.price)}
                                    >
                                        {rupiah(transactionMeta?.raw.batchItems.active.price ?? 0)}
                                    </Typography>
                                </Stack>

                                {/* Baris 2 */}
                                <Stack direction="row" alignItems="center" gap={0.75}>
                                    <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap sx={{ flex: 1, minWidth: 0 }}>
                                        <Chip size="small" label={isClosed ? 'Selesai' : (hasPending) ? 'Pending' : 'Aktif'} color={isClosed ? 'error' : (hasPending) ? 'warning' : 'success'} variant="filled" />
                                        <Chip size="small" icon={<LocalMallRounded />} label={`${transactionMeta?.pretty?.batchItems?.all.count} item`} />
                                        <Chip size="small" icon={<LayersRounded />} label={`${transactionMeta?.pretty?.batches.count} batch`} />
                                    </Stack>
                                    {/* @ts-ignore */}
                                    <TransactionListItemPrintTransaction tx={transaction} />
                                </Stack>

                                {/* Baris 3 — kasir, shift, dan kode meja */}
                                <Stack direction="row" alignItems="center" gap={0.75}>
                                    <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap sx={{ flex: 1, minWidth: 0 }}>
                                        <Chip
                                            size="small"
                                            icon={<PersonOutlineRounded />}
                                            label={transaction?.reference?.name?.first_name ?? transaction?.reference?.username ?? (transaction?.reference?.id ? `${transaction?.reference.id.slice(0,8)}…` : '-')}
                                            title={transaction?.reference?.id ?? ''}
                                        />
                                        <Chip size="small" icon={<AccessTimeRounded />} label={transaction?.shift?.name ?? '-'} />
                                        <Chip size="small" icon={<StorageIcon />} label={`${transactionMeta?.pretty.bills.count} item`} />
                                    </Stack>
                                </Stack>

                                {/*<Stack direction="row" alignItems="center" gap={0.75}>
                        <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap sx={{ flex: 1, minWidth: 0 }}>
                            <Chip
                                size="small"
                                icon={<PersonOutlineRounded />}
                                label={transaction?.reference?.name?.first_name ?? transaction?.reference?.username ?? (transaction?.reference?.id ? `${transaction?.reference.id.slice(0,8)}…` : '-')}
                                title={transaction?.reference?.id ?? ''}
                            />
                            <Chip size="small" label={`unpaid : ${active}`} />
                            <Chip size="small" label={`pending : ${pending}`} />
                            <Chip size="small" label={`paid : ${paid}`} />
                        </Stack>
                    </Stack>*/}

                                {/* Timestamp asli + RoundCheckbox (kanan) */}
                                <Stack direction="row" alignItems="center" justifyContent="space-between">
                                    <Typography variant="caption" color="text.secondary">{moment(transaction?.time_created).format(`HH:mm:ss DD-MM-YYYY`)}</Typography>
                                    {!isClosed && (
                                        <RoundCheckbox
                                            checked={!!multiChecked}
                                            onChange={(c) => onMultiToggle ? onMultiToggle(c) : undefined}
                                            onClick={(e) => e.stopPropagation()}
                                            aria-label={`Pilih transaksi ${transaction?.invoice} untuk multi-select`}
                                            sizePx={22}
                                            colorKey="success"
                                            outScale={0.33}
                                            overshootScale={1.2}
                                            durationMs={400}
                                        />
                                    )}
                                </Stack>
                            </Stack>
                        </ListItemButton>

                        {/* Footer nempel — TANPA checkbox lagi */}
                        <Box
                            sx={{
                                border: '1px solid', borderTop: 'none', borderColor: cardBorderColor,
                                borderBottomLeftRadius: 8, borderBottomRightRadius: 8,
                                bgcolor: footerBg.includes('linear-gradient') ? undefined : footerBg,   // ★ solid via theme key
                                background: footerBg.includes('linear-gradient') ? footerBg : undefined, // ★ gradient manual
                                color: footerColor,                                                      // ★ teks adaptif
                                px: 1.5, py: 0.8, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1, mb: 1,
                            }}
                        >
                            <TimerText startIso={transaction?.time_created} endIso={transaction?.time_closed} active={!isClosed} />
                        </Box>
                    </>
                ) : <ShimmerLoadingTransactionListItemRow/>
            }
        </>
    )
}

export default React.memo(TransactionListItemRow)
