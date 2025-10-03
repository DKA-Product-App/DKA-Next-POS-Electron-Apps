'use client'

import * as React from 'react'
import {
    Box, Stack, TextField, MenuItem, Typography, Slider, Tooltip, IconButton, Popover
} from '@mui/material'
import TuneRoundedIcon from '@mui/icons-material/TuneRounded'
import ClearRoundedIcon from '@mui/icons-material/ClearRounded'
import DoneRoundedIcon from '@mui/icons-material/DoneRounded'
import PerfectScrollbar from 'react-perfect-scrollbar'
import 'react-perfect-scrollbar/dist/css/styles.css'

export type BillFilters = {
    startAt: string
    endAt: string
    paid: 'all' | 'paid' | 'unpaid'
    cashierName: string
    totalRange: number[]
}

type Props = {
    value: BillFilters
    onChange: (patch: Partial<BillFilters>) => void
    cashierOptions: string[]
    maxTotal: number
    filteredCount?: number
}

const TZ = 'Asia/Makassar'
const DEBOUNCE_MS = 600
const LS_KEY = 'bill.filters.v2' // snake_case payload

type PersistV2 = {
    start_at: string
    end_at: string
    paid: 'all' | 'paid' | 'unpaid'
    cashier_name: string
    total_range: number[]
}

/* =========================
 * Helpers
 * ========================= */
const toDateTimeLocalString = (y: string, m: string, d: string, hh: string, mm: string) =>
    `${y}-${m}-${d}T${hh}:${mm}`

const partsInTz = (d: Date, tz: string) => {
    const fmt = new Intl.DateTimeFormat('en-GB', {
        timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit',
        hour: '2-digit', minute: '2-digit', hour12: false,
    })
    const parts = Object.fromEntries(fmt.formatToParts(d).map(p => [p.type, p.value]))
    return { year: parts.year, month: parts.month, day: parts.day, hour: parts.hour, minute: parts.minute }
}

const todayRangeInMakassar = () => {
    const now = new Date()
    const { year, month, day } = partsInTz(now, TZ)
    return {
        start: toDateTimeLocalString(year, month, day, '00', '00'),
        end: toDateTimeLocalString(year, month, day, '23', '59'),
    }
}

const currency = (n: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n)
const isEqualArray = (a: number[], b: number[]) => a.length === b.length && a.every((v, i) => v === b[i])

const toPersist = (v: BillFilters): PersistV2 => ({
    start_at: v.startAt,
    end_at: v.endAt,
    paid: v.paid,
    cashier_name: v.cashierName,
    total_range: v.totalRange,
})
const fromPersist = (p: PersistV2): BillFilters => ({
    startAt: p.start_at,
    endAt: p.end_at,
    paid: p.paid,
    cashierName: p.cashier_name,
    totalRange: p.total_range,
})

const readPersist = (): BillFilters | null => {
    if (typeof window === 'undefined') return null
    const raw = localStorage.getItem(LS_KEY)
    if (!raw || !/^\s*\{/.test(raw)) return null
    try {
        const p = JSON.parse(raw) as PersistV2
        if (!Array.isArray(p.total_range) || p.total_range.length !== 2) return null
        return fromPersist(p)
    } catch { return null }
}

const writePersist = (v: BillFilters) => localStorage.setItem(LS_KEY, JSON.stringify(toPersist(v)))
const removePersist = () => localStorage.removeItem(LS_KEY)

/* =========================
 * Component
 * ========================= */
const BillListItemHeaderWidget: React.FC<Props> = ({ value, onChange, cashierOptions, maxTotal, filteredCount }) => {
    const [anchorEl, setAnchorEl] = React.useState<HTMLElement | null>(null)
    const open = Boolean(anchorEl)

    // Drafts so we can persist immediately without relying on parent echo
    const [draftStartAt, setDraftStartAt] = React.useState(value.startAt)
    const [draftEndAt, setDraftEndAt] = React.useState(value.endAt)
    const [draftTotalRange, setDraftTotalRange] = React.useState<number[]>(value.totalRange)

    // Keep drafts in sync when parent changes (e.g., after hydrate/ reset from outside)
    React.useEffect(() => { setDraftStartAt(value.startAt) }, [value.startAt])
    React.useEffect(() => { setDraftEndAt(value.endAt) }, [value.endAt])
    React.useEffect(() => { setDraftTotalRange(value.totalRange) }, [value.totalRange])

    // Guards
    const hydratedRef = React.useRef(false)
    const resetGuardRef = React.useRef(false)

    // Build a "snapshot" from the freshest known pieces (value + drafts)
    const snapshotRef = React.useRef<BillFilters>(value)
    const buildSnapshot = React.useCallback((): BillFilters => ({
        startAt: draftStartAt || value.startAt,
        endAt: draftEndAt || value.endAt,
        paid: value.paid,
        cashierName: value.cashierName,
        totalRange: draftTotalRange.length ? draftTotalRange : value.totalRange,
    }), [draftStartAt, draftEndAt, draftTotalRange, value])
    React.useEffect(() => { snapshotRef.current = buildSnapshot() }, [buildSnapshot])

    // Hydrate from LS on mount (no parent changes needed)
    React.useEffect(() => {
        const saved = readPersist()
        if (saved) {
            // apply to drafts
            setDraftStartAt(saved.startAt)
            setDraftEndAt(saved.endAt)
            setDraftTotalRange(saved.totalRange)
            // also push to parent (still not modifying parent code)
            onChange(saved)
        } else {
            // default today if parent not set
            if (!value.startAt || !value.endAt) {
                const { start, end } = todayRangeInMakassar()
                setDraftStartAt(start)
                setDraftEndAt(end)
                setDraftTotalRange([0, Math.max(0, maxTotal)])
                onChange({ startAt: start, endAt: end, totalRange: [0, Math.max(0, maxTotal)], paid: 'all', cashierName: 'all' })
            }
        }
        hydratedRef.current = true
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    // Auto-save on ANY value prop change (for safety), but also we persist on drafts immediately (see below)
    React.useEffect(() => {
        if (!hydratedRef.current || resetGuardRef.current) return
        const { start, end } = todayRangeInMakassar()
        const defaultToday: BillFilters = {
            startAt: start,
            endAt: end,
            paid: 'all',
            cashierName: 'all',
            totalRange: [0, Math.max(0, maxTotal)],
        }
        const nowVal: BillFilters = {
            startAt: value.startAt,
            endAt: value.endAt,
            paid: value.paid,
            cashierName: value.cashierName,
            totalRange: value.totalRange,
        }
        const sameDefault =
            nowVal.paid === defaultToday.paid &&
            nowVal.cashierName === defaultToday.cashierName &&
            nowVal.startAt === defaultToday.startAt &&
            nowVal.endAt === defaultToday.endAt &&
            isEqualArray(nowVal.totalRange, defaultToday.totalRange)

        sameDefault ? removePersist() : writePersist(nowVal)
    }, [value.startAt, value.endAt, value.paid, value.cashierName, value.totalRange, maxTotal])

    // Debounce for time range: persist from DRAFT directly (no need to wait parent echo)
    React.useEffect(() => {
        if (!hydratedRef.current || resetGuardRef.current) return
        // if drafts equal value, parent already persisted
        if (draftStartAt === value.startAt && draftEndAt === value.endAt) return

        const t = setTimeout(() => {
            const snap = buildSnapshot()
            // persist snapshot now
            const { start, end } = todayRangeInMakassar()
            const defaultToday: BillFilters = {
                startAt: start, endAt: end, paid: 'all', cashierName: 'all', totalRange: [0, Math.max(0, maxTotal)],
            }
            isEqualArray(snap.totalRange, defaultToday.totalRange)
            && snap.paid === defaultToday.paid
            && snap.cashierName === defaultToday.cashierName
            && snap.startAt === defaultToday.startAt
            && snap.endAt === defaultToday.endAt
                ? removePersist()
                : writePersist(snap)

            // still notify parent
            onChange({ startAt: draftStartAt, endAt: draftEndAt })
        }, DEBOUNCE_MS)
        return () => clearTimeout(t)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [draftStartAt, draftEndAt])

    // Persist from slider DRAFT immediately at commit
    const handleTotalRangeCommit = (_: Event | React.SyntheticEvent, v: number | number[]) => {
        const totalRange = v as number[]
        const snap = { ...buildSnapshot(), totalRange }
        const { start, end } = todayRangeInMakassar()
        const defaultToday: BillFilters = {
            startAt: start, endAt: end, paid: 'all', cashierName: 'all', totalRange: [0, Math.max(0, maxTotal)],
        }
        isEqualArray(snap.totalRange, defaultToday.totalRange)
        && snap.paid === defaultToday.paid
        && snap.cashierName === defaultToday.cashierName
        && snap.startAt === defaultToday.startAt
        && snap.endAt === defaultToday.endAt
            ? removePersist()
            : writePersist(snap)

        onChange({ totalRange })
    }

    // Persist immediately when paid/cashier changes (no parent changes needed)
    const handlePaidChange = (paid: BillFilters['paid']) => {
        const snap = { ...buildSnapshot(), paid }
        writePersist(snap)
        onChange({ paid })
    }
    const handleCashierChange = (cashierName: string) => {
        const snap = { ...buildSnapshot(), cashierName }
        writePersist(snap)
        onChange({ cashierName })
    }

    // Clamp range kalau maxTotal turun
    React.useEffect(() => {
        setDraftTotalRange(([a, b]) => [Math.max(0, Math.min(a, maxTotal)), Math.max(0, Math.min(b, maxTotal))])
    }, [maxTotal])

    const commitTimeRange = React.useCallback(() => {
        if (draftStartAt === value.startAt && draftEndAt === value.endAt) return
        const snap = buildSnapshot()
        writePersist(snap)
        onChange({ startAt: draftStartAt, endAt: draftEndAt })
    }, [buildSnapshot, draftStartAt, draftEndAt, onChange, value.endAt, value.startAt])

    const handleOpen = (e: React.MouseEvent<HTMLElement>) => setAnchorEl(e.currentTarget)
    const handleClose = () => { commitTimeRange(); setAnchorEl(null) }

    const handleReset = () => {
        const { start, end } = todayRangeInMakassar()
        resetGuardRef.current = true
        removePersist()

        setDraftStartAt(start)
        setDraftEndAt(end)
        setDraftTotalRange([0, Math.max(0, maxTotal)])

        onChange({
            startAt: start,
            endAt: end,
            paid: 'all',
            cashierName: 'all',
            totalRange: [0, Math.max(0, maxTotal)],
        })

        // lepas guard di tick berikutnya
        queueMicrotask(() => (resetGuardRef.current = false))
    }

    /* ============ UI ============ */
    return (
        <Stack direction="row" alignItems="center" gap={1}>
            <Tooltip title="Filter">
                <IconButton
                    size="small"
                    onClick={handleOpen}
                    sx={{ ml: 'auto', border: '1px solid', borderColor: 'divider', borderRadius: 2 }}
                >
                    <TuneRoundedIcon />
                </IconButton>
            </Tooltip>

            <Popover
                open={open}
                anchorEl={anchorEl}
                onClose={handleClose}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
                transformOrigin={{ vertical: 'top', horizontal: 'left' }}
                slotProps={{
                    paper: {
                        sx: {
                            p: 0, width: 520, maxWidth: 'calc(100vw - 32px)', maxHeight: 420,
                            display: 'grid', gridTemplateRows: '1fr auto', overflow: 'hidden',
                        }
                    }
                }}
            >
                {/* Scroll area */}
                <Box sx={{ overflow: 'hidden' }}>
                    <PerfectScrollbar
                        options={{ suppressScrollX: true, wheelPropagation: false }}
                        style={{ height: '100%', padding: 16, paddingBottom: 12 }}
                    >
                        <Stack spacing={1.5} sx={{ p: 2 }}>
                            {/* Rentang waktu */}
                            <Box>
                                <Typography variant="overline">Rentang waktu (Asia/Makassar)</Typography>
                                <Stack direction={{ xs: 'column', sm: 'row' }} gap={1}>
                                    <TextField
                                        label="Dari" type="datetime-local" size="small" fullWidth
                                        value={draftStartAt}
                                        onChange={e => setDraftStartAt(e.target.value)}
                                        onBlur={commitTimeRange}
                                        onKeyDown={e => { if (e.key === 'Enter') commitTimeRange() }}
                                        InputLabelProps={{ shrink: true }}
                                    />
                                    <TextField
                                        label="Sampai" type="datetime-local" size="small" fullWidth
                                        value={draftEndAt}
                                        onChange={e => setDraftEndAt(e.target.value)}
                                        onBlur={commitTimeRange}
                                        onKeyDown={e => { if (e.key === 'Enter') commitTimeRange() }}
                                        InputLabelProps={{ shrink: true }}
                                    />
                                </Stack>
                            </Box>

                            {/* Status pembayaran */}
                            <Box>
                                <Typography variant="overline">Status Pembayaran</Typography>
                                <TextField
                                    select size="small" fullWidth
                                    value={value.paid}
                                    onChange={(e) => handlePaidChange(e.target.value as BillFilters['paid'])}
                                >
                                    <MenuItem value="all">Semua</MenuItem>
                                    <MenuItem value="unpaid">Belum dibayar</MenuItem>
                                    <MenuItem value="paid">Sudah dibayar</MenuItem>
                                </TextField>
                            </Box>

                            {/* Nama kasir */}
                            <Box>
                                <Typography variant="overline">Kasir</Typography>
                                <TextField
                                    select size="small" fullWidth
                                    value={value.cashierName}
                                    onChange={(e) => handleCashierChange(e.target.value)}
                                >
                                    <MenuItem value="all">Semua</MenuItem>
                                    {cashierOptions.map(n => <MenuItem key={n} value={n}>{n}</MenuItem>)}
                                </TextField>
                            </Box>

                            {/* Range total transaksi */}
                            <Box>
                                <Stack direction="row" justifyContent="space-between" alignItems="center">
                                    <Typography variant="overline">Total transaksi</Typography>
                                    <Typography variant="caption" color="text.secondary">
                                        {currency(draftTotalRange[0])} – {currency(draftTotalRange[1])}
                                    </Typography>
                                </Stack>
                                <Slider
                                    value={draftTotalRange}
                                    onChange={(_, v) => setDraftTotalRange(v as number[])}
                                    onChangeCommitted={handleTotalRangeCommit}
                                    valueLabelDisplay="auto"
                                    min={0}
                                    max={Math.max(0, maxTotal)}
                                    step={1000}
                                    disableSwap
                                />
                            </Box>

                            {!!filteredCount && (
                                <Typography variant="caption" color="text.secondary">{filteredCount} hasil</Typography>
                            )}
                        </Stack>
                    </PerfectScrollbar>
                </Box>

                {/* Footer */}
                <Box sx={{ p: 1.25, borderTop: '1px solid', borderColor: 'divider', display: 'flex', gap: 1, justifyContent: 'space-between' }}>
                    <IconButton size="small" onClick={handleReset} title="Reset filter">
                        <ClearRoundedIcon fontSize="small" />
                    </IconButton>
                    <IconButton size="small" color="primary" onClick={handleClose} title="Terapkan & Tutup">
                        <DoneRoundedIcon fontSize="small" />
                    </IconButton>
                </Box>
            </Popover>
        </Stack>
    )
}

export default React.memo(BillListItemHeaderWidget)
