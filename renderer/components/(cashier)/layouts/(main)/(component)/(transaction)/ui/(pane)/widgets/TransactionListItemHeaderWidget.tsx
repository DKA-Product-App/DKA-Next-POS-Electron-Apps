'use client'

import * as React from 'react'
import {
    Box, Stack, TextField, InputAdornment, IconButton, Popover, MenuItem, Typography, Slider
} from '@mui/material'
import SearchRoundedIcon from '@mui/icons-material/SearchRounded'
import ClearRoundedIcon from '@mui/icons-material/ClearRounded'
import TuneRoundedIcon from '@mui/icons-material/TuneRounded'
import PerfectScrollbar from 'react-perfect-scrollbar'
import 'react-perfect-scrollbar/dist/css/styles.css'

export type Filters = {
    query: string
    status: 'all' | 'active' | 'selesai'
    shiftName: string
    cashierName: string
    startAt: string
    endAt: string
    itemRange: number[]
    batchRange: number[]
}

type Props = {
    filters: Filters
    onFiltersChange: (patch: Partial<Filters>) => void
    shiftOptions: string[]
    cashierOptions: string[]
    maxItems: number
    maxBatches: number
    filteredCount: number
}

const TZ = 'Asia/Makassar'
const DEBOUNCE_MS = 600
const LS_KEY = 'tx.filters.v1' // snake_case payload

type PersistShape = {
    query: string
    status: 'all' | 'active' | 'selesai'
    shift_name: string
    cashier_name: string
    start_at: string
    end_at: string
    item_range: number[]
    batch_range: number[]
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

const todayRange = () => {
    const now = new Date()
    const { year, month, day } = partsInTz(now, TZ)
    return {
        start: toDateTimeLocalString(year, month, day, '00', '00'),
        end: toDateTimeLocalString(year, month, day, '23', '59'),
    }
}

const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v))

/* ===== LocalStorage helpers (snake_case) ===== */
const readPersist = (): Partial<Filters> | null => {
    if (typeof window === 'undefined') return null
    const raw = localStorage.getItem(LS_KEY)
    if (!raw || !/^\s*\{/.test(raw)) return null
    const p = JSON.parse(raw) as Partial<PersistShape>
    const out: Partial<Filters> = {}
    typeof p.query === 'string' && (out.query = p.query)
    ;(p.status === 'all' || p.status === 'active' || p.status === 'selesai') && (out.status = p.status)
    typeof p.shift_name === 'string' && (out.shiftName = p.shift_name)
    typeof p.cashier_name === 'string' && (out.cashierName = p.cashier_name)
    typeof p.start_at === 'string' && (out.startAt = p.start_at)
    typeof p.end_at === 'string' && (out.endAt = p.end_at)
    Array.isArray(p.item_range) && p.item_range.length === 2 && p.item_range.every(n => typeof n === 'number') && (out.itemRange = p.item_range)
    Array.isArray(p.batch_range) && p.batch_range.length === 2 && p.batch_range.every(n => typeof n === 'number') && (out.batchRange = p.batch_range)
    return out
}

const writePersist = (v: Filters) => {
    const payload: PersistShape = {
        query: v.query,
        status: v.status,
        shift_name: v.shiftName,
        cashier_name: v.cashierName,
        start_at: v.startAt,
        end_at: v.endAt,
        item_range: v.itemRange,
        batch_range: v.batchRange,
    }
    localStorage.setItem(LS_KEY, JSON.stringify(payload))
}

const TransactionListItemHeaderWidget: React.FC<Props> = ({
                                                              filters, onFiltersChange,
                                                              shiftOptions, cashierOptions,
                                                              maxItems, maxBatches,
                                                              filteredCount
                                                          }) => {
    const [anchorEl, setAnchorEl] = React.useState<HTMLElement | null>(null)
    const open = Boolean(anchorEl)

    // ===== DRAFT (hindari spam request & jadi sumber persist waktu) =====
    const [draftStartAt, setDraftStartAt] = React.useState(filters.startAt)
    const [draftEndAt, setDraftEndAt] = React.useState(filters.endAt)
    const [draftItemRange, setDraftItemRange] = React.useState<number[]>(filters.itemRange)
    const [draftBatchRange, setDraftBatchRange] = React.useState<number[]>(filters.batchRange)

    // sync draft ketika parent berubah (mis. reset dari luar)
    React.useEffect(() => { setDraftStartAt(filters.startAt) }, [filters.startAt])
    React.useEffect(() => { setDraftEndAt(filters.endAt) }, [filters.endAt])
    React.useEffect(() => { setDraftItemRange(filters.itemRange) }, [filters.itemRange])
    React.useEffect(() => { setDraftBatchRange(filters.batchRange) }, [filters.batchRange])

    // guards
    const hydratedRef = React.useRef(false)
    const resetGuardRef = React.useRef(false)

    // ===== Hydrate saat mount =====
    React.useEffect(() => {
        const saved = readPersist()
        if (saved && Object.keys(saved).length) {
            saved.startAt && setDraftStartAt(saved.startAt)
            saved.endAt && setDraftEndAt(saved.endAt)
            saved.itemRange && setDraftItemRange(saved.itemRange)
            saved.batchRange && setDraftBatchRange(saved.batchRange)
            onFiltersChange(saved)
        } else {
            // default hari ini jika kosong
            if (!filters.startAt || !filters.endAt) {
                const { start, end } = todayRange()
                setDraftStartAt(start)
                setDraftEndAt(end)
                onFiltersChange({ startAt: start, endAt: end })
            }
        }
        hydratedRef.current = true
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    // ===== Auto expand range ketika max diketahui & filter masih [0,0] =====
    React.useEffect(() => {
        const needItems = filters.itemRange[0] === 0 && filters.itemRange[1] === 0 && maxItems > 0
        const needBatches = filters.batchRange[0] === 0 && filters.batchRange[1] === 0 && maxBatches > 0
        if (needItems || needBatches) {
            const patch: Partial<Filters> = {}
            if (needItems) { patch.itemRange = [0, maxItems]; setDraftItemRange([0, maxItems]) }
            if (needBatches) { patch.batchRange = [0, maxBatches]; setDraftBatchRange([0, maxBatches]) }
            onFiltersChange(patch)
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [maxItems, maxBatches])

    // ===== Debounce commit waktu + persist langsung (pakai draft) =====
    React.useEffect(() => {
        if (!hydratedRef.current || resetGuardRef.current) return
        if (draftStartAt === filters.startAt && draftEndAt === filters.endAt) return
        const t = setTimeout(() => {
            const next: Filters = {
                ...filters,
                startAt: draftStartAt,
                endAt: draftEndAt,
            }
            onFiltersChange({ startAt: draftStartAt, endAt: draftEndAt })
            writePersist(next)
        }, DEBOUNCE_MS)
        return () => clearTimeout(t)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [draftStartAt, draftEndAt])

    const commitTimeRange = React.useCallback(() => {
        if (draftStartAt === filters.startAt && draftEndAt === filters.endAt) return
        const next: Filters = { ...filters, startAt: draftStartAt, endAt: draftEndAt }
        onFiltersChange({ startAt: draftStartAt, endAt: draftEndAt })
        writePersist(next)
    }, [draftStartAt, draftEndAt, filters, onFiltersChange])

    // ===== Clamp draft bila max turun =====
    React.useEffect(() => {
        setDraftItemRange(([a, b]) => [clamp(a, 0, Math.max(0, maxItems)), clamp(b, 0, Math.max(0, maxItems))])
        setDraftBatchRange(([a, b]) => [clamp(a, 0, Math.max(0, maxBatches)), clamp(b, 0, Math.max(0, maxBatches))])
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [maxItems, maxBatches])

    // ===== Autosave untuk field non-waktu (query/status/shift/kasir/itemRange/batchRange) =====
    React.useEffect(() => {
        if (!hydratedRef.current || resetGuardRef.current) return
        // snapshot: waktu pakai *draft* agar konsisten
        const next: Filters = {
            ...filters,
            startAt: draftStartAt,
            endAt: draftEndAt,
        }
        writePersist(next)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [filters.query, filters.status, filters.shiftName, filters.cashierName, filters.itemRange, filters.batchRange])

    return (
        <Stack direction={{ xs: 'column', sm: 'row' }} alignItems={{ xs: 'stretch', sm: 'center' }} gap={1} sx={{ px: 1.5, pt: 1 }}>
            {/* Search */}
            <TextField
                size="small"
                placeholder="Cari invoice, batch, table…"
                value={filters.query}
                fullWidth
                onChange={(e) => onFiltersChange({ query: e.target.value })}
                sx={{ minWidth: { xs: '100%', sm: 280 } }}
                InputProps={{
                    startAdornment: (
                        <InputAdornment position="start">
                            <SearchRoundedIcon fontSize="small" />
                        </InputAdornment>
                    ),
                    endAdornment: filters.query ? (
                        <InputAdornment position="end">
                            <IconButton size="small" onClick={() => onFiltersChange({ query: '' })}>
                                <ClearRoundedIcon fontSize="small" />
                            </IconButton>
                        </InputAdornment>
                    ) : undefined,
                }}
            />

            {/* Filter button */}
            <IconButton
                size="small"
                onClick={(e) => setAnchorEl(e.currentTarget)}
                sx={{ ml: 'auto', border: '1px solid', borderColor: 'divider', borderRadius: 2 }}
            >
                <TuneRoundedIcon />
            </IconButton>

            {/* Popover: konten scrollable + footer fixed */}
            <Popover
                open={open}
                anchorEl={anchorEl}
                onClose={() => { commitTimeRange(); setAnchorEl(null) }}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
                transformOrigin={{ vertical: 'top', horizontal: 'left' }}
                slotProps={{
                    paper: {
                        sx: {
                            p: 0,
                            width: 520,
                            maxWidth: 'calc(100vw - 32px)',
                            maxHeight: 420,
                            display: 'grid',
                            gridTemplateRows: '1fr auto',
                            overflow: 'hidden',
                        }
                    }
                }}
            >
                {/* SCROLL AREA */}
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
                                        label="Dari"
                                        type="datetime-local"
                                        size="small"
                                        value={draftStartAt}
                                        onChange={(e) => setDraftStartAt(e.target.value)}
                                        onBlur={commitTimeRange}
                                        onKeyDown={(e) => { if (e.key === 'Enter') commitTimeRange() }}
                                        InputLabelProps={{ shrink: true }}
                                        fullWidth
                                    />
                                    <TextField
                                        label="Sampai"
                                        type="datetime-local"
                                        size="small"
                                        value={draftEndAt}
                                        onChange={(e) => setDraftEndAt(e.target.value)}
                                        onBlur={commitTimeRange}
                                        onKeyDown={(e) => { if (e.key === 'Enter') commitTimeRange() }}
                                        InputLabelProps={{ shrink: true }}
                                        fullWidth
                                    />
                                </Stack>
                            </Box>

                            {/* Status */}
                            <Box>
                                <Typography variant="overline">Status</Typography>
                                <TextField
                                    select size="small" fullWidth
                                    value={filters.status}
                                    onChange={(e) => onFiltersChange({ status: e.target.value as Filters['status'] })}
                                >
                                    <MenuItem value="all">Semua</MenuItem>
                                    <MenuItem value="active">Aktif</MenuItem>
                                    <MenuItem value="selesai">Selesai</MenuItem>
                                </TextField>
                            </Box>

                            {/* Shift */}
                            <Box>
                                <Typography variant="overline">Shift</Typography>
                                <TextField
                                    select size="small" fullWidth
                                    value={filters.shiftName}
                                    onChange={(e) => onFiltersChange({ shiftName: e.target.value })}
                                >
                                    <MenuItem value="all">Semua</MenuItem>
                                    {shiftOptions.map(s => <MenuItem key={s} value={s}>{s}</MenuItem>)}
                                </TextField>
                            </Box>

                            {/* Kasir */}
                            <Box>
                                <Typography variant="overline">Kasir</Typography>
                                <TextField
                                    select size="small" fullWidth
                                    value={filters.cashierName}
                                    onChange={(e) => onFiltersChange({ cashierName: e.target.value })}
                                >
                                    <MenuItem value="all">Semua</MenuItem>
                                    {cashierOptions.map(n => <MenuItem key={n} value={n}>{n}</MenuItem>)}
                                </TextField>
                            </Box>

                            {/* Range item */}
                            <Box>
                                <Stack direction="row" justifyContent="space-between" alignItems="center">
                                    <Typography variant="overline">Jumlah item</Typography>
                                    <Typography variant="caption" color="text.secondary">
                                        {draftItemRange[0]} – {draftItemRange[1]}
                                    </Typography>
                                </Stack>
                                <Slider
                                    value={draftItemRange}
                                    onChange={(_, v) => setDraftItemRange(v as number[])}
                                    onChangeCommitted={(_, v) => onFiltersChange({ itemRange: v as number[] })}
                                    valueLabelDisplay="auto"
                                    min={0}
                                    max={Math.max(0, maxItems)}
                                    step={1}
                                    disableSwap
                                />
                            </Box>

                            {/* Range batch */}
                            <Box>
                                <Stack direction="row" justifyContent="space-between" alignItems="center">
                                    <Typography variant="overline">Jumlah batch</Typography>
                                    <Typography variant="caption" color="text.secondary">
                                        {draftBatchRange[0]} – {draftBatchRange[1]}
                                    </Typography>
                                </Stack>
                                <Slider
                                    value={draftBatchRange}
                                    onChange={(_, v) => setDraftBatchRange(v as number[])}
                                    onChangeCommitted={(_, v) => onFiltersChange({ batchRange: v as number[] })}
                                    valueLabelDisplay="auto"
                                    min={0}
                                    max={Math.max(0, maxBatches)}
                                    step={1}
                                    disableSwap
                                />
                            </Box>

                            {/* Counter */}
                            <Typography variant="caption" color="text.secondary">{filteredCount} hasil</Typography>
                        </Stack>
                    </PerfectScrollbar>
                </Box>

                {/* FOOTER FIXED */}
                <Box sx={{ p: 1.25, borderTop: '1px solid', borderColor: 'divider', display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                    <Stack direction="row" justifyContent="flex-end" alignItems="center" gap={1}>
                        <IconButton
                            size="small"
                            onClick={() => {
                                const { start, end } = todayRange()
                                resetGuardRef.current = true
                                localStorage.removeItem(LS_KEY)

                                setDraftStartAt(start)
                                setDraftEndAt(end)
                                setDraftItemRange([0, Math.max(0, maxItems)])
                                setDraftBatchRange([0, Math.max(0, maxBatches)])

                                onFiltersChange({
                                    query: '',
                                    status: 'all',
                                    shiftName: 'all',
                                    cashierName: 'all',
                                    itemRange: [0, Math.max(0, maxItems)],
                                    batchRange: [0, Math.max(0, maxBatches)],
                                    startAt: start,
                                    endAt: end,
                                })

                                queueMicrotask(() => (resetGuardRef.current = false))
                            }}
                            title="Reset filter"
                        >
                            <ClearRoundedIcon fontSize="small" />
                        </IconButton>

                        <IconButton
                            size="small"
                            color="primary"
                            onClick={() => { commitTimeRange(); setAnchorEl(null) }}
                            title="Tutup"
                        >
                            <TuneRoundedIcon fontSize="small" />
                        </IconButton>
                    </Stack>
                </Box>
            </Popover>
        </Stack>
    )
}

export default React.memo(TransactionListItemHeaderWidget)
