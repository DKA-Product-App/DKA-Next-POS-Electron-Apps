// widgets/BillListItemHeaderWidget.tsx
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
    /** NEW: aktif kalau user commit slider */
    totalRangeActive?: boolean
}

type Props = {
    value: BillFilters
    onChange: (patch: Partial<BillFilters>) => void
    cashierOptions: string[]
    maxTotal: number
    filteredCount?: number
    onHydrated?: () => void
}

const TZ = 'Asia/Makassar'
const DEBOUNCE_MS = 600
const LS_KEY = 'bill.filters.v2'

type PersistV2 = {
    start_at: string
    end_at: string
    paid: 'all' | 'paid' | 'unpaid'
    cashier_name: string
    total_range: number[]
    total_range_active?: boolean
}

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
    return { start: toDateTimeLocalString(year, month, day, '00', '00'), end: toDateTimeLocalString(year, month, day, '23', '59') }
}

const currency = (n: number) =>
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n)

const isEqualArray = (a: number[], b: number[]) => a.length === b.length && a.every((v, i) => v === b[i])

const eqShallow = (a: Partial<BillFilters>, b: Partial<BillFilters>) =>
    ['startAt','endAt','paid','cashierName','totalRangeActive'].every(k => (a as any)[k] === (b as any)[k]) &&
    (Array.isArray(a.totalRange) && Array.isArray(b.totalRange) ? isEqualArray(a.totalRange, b.totalRange) : a.totalRange === b.totalRange)

const toPersist = (v: BillFilters): PersistV2 => ({
    start_at: v.startAt,
    end_at: v.endAt,
    paid: v.paid,
    cashier_name: v.cashierName,
    total_range: v.totalRange,
    total_range_active: !!v.totalRangeActive,
})
const fromPersist = (p: PersistV2): BillFilters => ({
    startAt: p.start_at,
    endAt: p.end_at,
    paid: p.paid,
    cashierName: p.cashier_name,
    totalRange: p.total_range,
    totalRangeActive: !!p.total_range_active,
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

const BillListItemHeaderWidget: React.FC<Props> = ({ value, onChange, cashierOptions, maxTotal, filteredCount, onHydrated }) => {
    const [anchorEl, setAnchorEl] = React.useState<HTMLElement | null>(null)
    const open = Boolean(anchorEl)

    const [draftStartAt, setDraftStartAt] = React.useState(value.startAt)
    const [draftEndAt, setDraftEndAt] = React.useState(value.endAt)
    const [draftTotalRange, setDraftTotalRange] = React.useState<number[]>(value.totalRange)

    React.useEffect(() => { setDraftStartAt(value.startAt) }, [value.startAt])
    React.useEffect(() => { setDraftEndAt(value.endAt) }, [value.endAt])
    React.useEffect(() => { setDraftTotalRange(value.totalRange) }, [value.totalRange])

    const hydratedRef = React.useRef(false)
    const resetGuardRef = React.useRef(false)

    // HYDRATE sekali (guard StrictMode)
    React.useEffect(() => {
        if (hydratedRef.current) return
        const saved = readPersist()
        if (saved) {
            setDraftStartAt(saved.startAt)
            setDraftEndAt(saved.endAt)
            setDraftTotalRange(saved.totalRange)
            if (!eqShallow(saved, value)) onChange(saved)
        } else {
            if (!value.startAt || !value.endAt) {
                const { start, end } = todayRangeInMakassar()
                const nextRange = [0, Math.max(0, maxTotal)]
                setDraftStartAt(start)
                setDraftEndAt(end)
                setDraftTotalRange(nextRange)
                const patch: Partial<BillFilters> = {
                    startAt: start,
                    endAt: end,
                    totalRange: nextRange,
                    paid: 'all',
                    cashierName: 'all',
                    totalRangeActive: false, // default: tidak aktif
                }
                if (!eqShallow(patch, value)) onChange(patch)
            }
        }
        hydratedRef.current = true
        onHydrated?.()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    // Persist (hapus kalau exactly default hari ini)
    React.useEffect(() => {
        if (!hydratedRef.current || resetGuardRef.current) return
        const { start, end } = todayRangeInMakassar()
        const def: BillFilters = {
            startAt: start, endAt: end, paid: 'all', cashierName: 'all',
            totalRange: [0, Math.max(0, maxTotal)], totalRangeActive: false
        }
        const isDefault =
            value.paid === def.paid &&
            value.cashierName === def.cashierName &&
            value.startAt === def.startAt &&
            value.endAt === def.endAt &&
            value.totalRangeActive === def.totalRangeActive &&
            isEqualArray(value.totalRange, def.totalRange)
        isDefault ? removePersist() : writePersist(value)
    }, [value.startAt, value.endAt, value.paid, value.cashierName, value.totalRange, value.totalRangeActive, maxTotal])

    // Debounce waktu → onChange
    React.useEffect(() => {
        if (!hydratedRef.current || resetGuardRef.current) return
        if (draftStartAt === value.startAt && draftEndAt === value.endAt) return
        const t = setTimeout(() => {
            const merged: BillFilters = {
                startAt: draftStartAt || value.startAt,
                endAt: draftEndAt || value.endAt,
                paid: value.paid,
                cashierName: value.cashierName,
                totalRange: draftTotalRange.length ? draftTotalRange : value.totalRange,
                totalRangeActive: value.totalRangeActive ?? false,
            }
            writePersist(merged)
            onChange({ startAt: draftStartAt, endAt: draftEndAt })
        }, DEBOUNCE_MS)
        return () => clearTimeout(t)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [draftStartAt, draftEndAt])

    // Auto-expand ke [0, maxTotal] saat awal/turun — TIDAK mengaktifkan filter
    React.useEffect(() => {
        if (maxTotal <= 0) return
        const isZero =
            Array.isArray(value.totalRange) &&
            value.totalRange.length === 2 &&
            value.totalRange[0] === 0 &&
            value.totalRange[1] === 0
        if (isZero) {
            const nextRange = [0, Math.max(0, maxTotal)]
            setDraftTotalRange(nextRange)
            const merged: BillFilters = { ...value, totalRange: nextRange, totalRangeActive: value.totalRangeActive ?? false }
            writePersist(merged)
            if (!isEqualArray(value.totalRange, nextRange) || value.totalRangeActive !== false)
                onChange({ totalRange: nextRange, totalRangeActive: false })
        }
    }, [maxTotal, value])

    // Slider commit — ini barulah mengaktifkan filter total
    const handleTotalRangeCommit = (_: Event | React.SyntheticEvent, v: number | number[]) => {
        const totalRange = v as number[]
        if (isEqualArray(totalRange, value.totalRange) && value.totalRangeActive === true) return
        const merged: BillFilters = { ...value, totalRange, totalRangeActive: true }
        writePersist(merged)
        onChange({ totalRange, totalRangeActive: true })
    }

    const handlePaidChange = (paid: BillFilters['paid']) => {
        if (paid === value.paid) return
        const merged: BillFilters = { ...value, paid }
        writePersist(merged)
        onChange({ paid })
    }
    const handleCashierChange = (cashierName: string) => {
        if (cashierName === value.cashierName) return
        const merged: BillFilters = { ...value, cashierName }
        writePersist(merged)
        onChange({ cashierName })
    }

    React.useEffect(() => {
        setDraftTotalRange(([a, b]) => [Math.max(0, Math.min(a, maxTotal)), Math.max(0, Math.min(b, maxTotal))])
    }, [maxTotal])

    const commitTimeRange = React.useCallback(() => {
        const patch: Partial<BillFilters> = { startAt: draftStartAt, endAt: draftEndAt }
        if (eqShallow(patch, value)) return
        const merged: BillFilters = { ...value, startAt: draftStartAt, endAt: draftEndAt }
        writePersist(merged)
        onChange(patch)
    }, [draftStartAt, draftEndAt, value, onChange])

    const handleReset = () => {
        const { start, end } = todayRangeInMakassar()
        resetGuardRef.current = true
        removePersist()

        const nextRange = [0, Math.max(0, maxTotal)]
        setDraftStartAt(start)
        setDraftEndAt(end)
        setDraftTotalRange(nextRange)

        const patch: Partial<BillFilters> = {
            startAt: start, endAt: end,
            paid: 'all', cashierName: 'all',
            totalRange: nextRange, totalRangeActive: false
        }

        if (!eqShallow(patch, value)) onChange(patch)
        queueMicrotask(() => (resetGuardRef.current = false))
    }

    const handleOpen = (e: React.MouseEvent<HTMLElement>) => setAnchorEl(e.currentTarget)
    const handleClose = () => { commitTimeRange(); setAnchorEl(null) }

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
                <Box sx={{ overflow: 'hidden' }}>
                    <PerfectScrollbar
                        options={{ suppressScrollX: true, wheelPropagation: false }}
                        style={{ height: '100%', padding: 16, paddingBottom: 12 }}
                    >
                        <Stack spacing={1.5} sx={{ p: 2 }}>
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

                            <Box>
                                <Stack direction="row" justifyContent="space-between" alignItems="center">
                                    <Typography variant="overline">Total transaksi</Typography>
                                    <Typography variant="caption" color="text.secondary">
                                        {currency(draftTotalRange[0])} – {currency(draftTotalRange[1])}
                                        {!value.totalRangeActive && '  (tidak difilter)'}
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
