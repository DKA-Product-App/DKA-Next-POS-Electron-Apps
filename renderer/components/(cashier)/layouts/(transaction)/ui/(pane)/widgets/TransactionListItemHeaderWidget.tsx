'use client'

import * as React from 'react'
import {
    Box, Stack, TextField, InputAdornment, IconButton, Popover, MenuItem, Typography, Slider
} from '@mui/material'
import SearchRoundedIcon from '@mui/icons-material/SearchRounded'
import ClearRoundedIcon from '@mui/icons-material/ClearRounded'
import TuneRoundedIcon from '@mui/icons-material/TuneRounded'

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

const DEBOUNCE_MS = 600

const TransactionListItemHeaderWidget: React.FC<Props> = ({
                                                              filters, onFiltersChange,
                                                              shiftOptions, cashierOptions,
                                                              maxItems, maxBatches,
                                                              filteredCount
                                                          }) => {
    const [anchorEl, setAnchorEl] = React.useState<HTMLElement | null>(null)
    const open = Boolean(anchorEl)

    // ===== DRAFT (hindari spam request) =====
    const [draftStartAt, setDraftStartAt] = React.useState(filters.startAt)
    const [draftEndAt, setDraftEndAt] = React.useState(filters.endAt)
    const [draftItemRange, setDraftItemRange] = React.useState<number[]>(filters.itemRange)
    const [draftBatchRange, setDraftBatchRange] = React.useState<number[]>(filters.batchRange)

    // Sync draft ketika parent berubah (reset, dsb.)
    React.useEffect(() => { setDraftStartAt(filters.startAt) }, [filters.startAt])
    React.useEffect(() => { setDraftEndAt(filters.endAt) }, [filters.endAt])
    React.useEffect(() => { setDraftItemRange(filters.itemRange) }, [filters.itemRange])
    React.useEffect(() => { setDraftBatchRange(filters.batchRange) }, [filters.batchRange])

    // Init startOfToday/endOfToday bila kosong
    React.useEffect(() => {
        if (filters.startAt && filters.endAt) return
        const now = new Date()
        const { year, month, day } = partsInTz(now, TZ)
        const startOfToday = toDateTimeLocalString(year, month, day, '00', '00')
        const endOfToday = toDateTimeLocalString(year, month, day, '23', '59')
        setDraftStartAt(startOfToday)
        setDraftEndAt(endOfToday)
        onFiltersChange({ startAt: startOfToday, endAt: endOfToday })
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    // ✅ AUTO-EXPAND range saat max diketahui dan filter masih [0,0]
    React.useEffect(() => {
        const needItems = filters.itemRange[0] === 0 && filters.itemRange[1] === 0 && maxItems > 0
        const needBatches = filters.batchRange[0] === 0 && filters.batchRange[1] === 0 && maxBatches > 0

        if (needItems || needBatches) {
            const patch: Partial<Filters> = {}
            if (needItems) {
                patch.itemRange = [0, maxItems]
                setDraftItemRange([0, maxItems])
            }
            if (needBatches) {
                patch.batchRange = [0, maxBatches]
                setDraftBatchRange([0, maxBatches])
            }
            onFiltersChange(patch)
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [maxItems, maxBatches])

    // Debounce commit start/end
    React.useEffect(() => {
        if (draftStartAt === filters.startAt && draftEndAt === filters.endAt) return
        const t = setTimeout(() => onFiltersChange({ startAt: draftStartAt, endAt: draftEndAt }), DEBOUNCE_MS)
        return () => clearTimeout(t)
    }, [draftStartAt, draftEndAt]) // eslint-disable-line react-hooks/exhaustive-deps

    const commitTimeRange = React.useCallback(() => {
        if (draftStartAt !== filters.startAt || draftEndAt !== filters.endAt) {
            onFiltersChange({ startAt: draftStartAt, endAt: draftEndAt })
        }
    }, [draftStartAt, draftEndAt, filters.startAt, filters.endAt, onFiltersChange])

    const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v))
    React.useEffect(() => {
        // jaga-jaga bila max turun
        setDraftItemRange(([a, b]) => [clamp(a, 0, Math.max(0, maxItems)), clamp(b, 0, Math.max(0, maxItems))])
        setDraftBatchRange(([a, b]) => [clamp(a, 0, Math.max(0, maxBatches)), clamp(b, 0, Math.max(0, maxBatches))])
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [maxItems, maxBatches])

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

            {/* Popover */}
            <Popover
                open={open}
                anchorEl={anchorEl}
                onClose={() => { commitTimeRange(); setAnchorEl(null) }}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
                transformOrigin={{ vertical: 'top', horizontal: 'left' }}
                slotProps={{ paper: { sx: { p: 2, width: 520, maxWidth: '100%' } } }}
            >
                <Stack spacing={1.5}>
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

                    <Stack direction="row" justifyContent="space-between" alignItems="center" pt={0.5}>
                        <Typography variant="caption" color="text.secondary">{filteredCount} hasil</Typography>
                        <Stack direction="row" gap={1}>
                            <IconButton
                                size="small"
                                onClick={() => {
                                    const now = new Date()
                                    const { year, month, day } = partsInTz(now, TZ)
                                    const startOfToday = toDateTimeLocalString(year, month, day, '00', '00')
                                    const endOfToday = toDateTimeLocalString(year, month, day, '23', '59')
                                    setDraftStartAt(startOfToday)
                                    setDraftEndAt(endOfToday)
                                    setDraftItemRange([0, Math.max(0, maxItems)])
                                    setDraftBatchRange([0, Math.max(0, maxBatches)])
                                    onFiltersChange({
                                        query: '',
                                        status: 'all',
                                        shiftName: 'all',
                                        cashierName: 'all',
                                        itemRange: [0, Math.max(0, maxItems)],
                                        batchRange: [0, Math.max(0, maxBatches)],
                                        startAt: startOfToday,
                                        endAt: endOfToday,
                                    })
                                }}
                                title="Reset filter"
                            >
                                <ClearRoundedIcon fontSize="small" />
                            </IconButton>
                            <IconButton size="small" color="primary" onClick={() => { commitTimeRange(); setAnchorEl(null) }} title="Tutup">
                                <TuneRoundedIcon fontSize="small" />
                            </IconButton>
                        </Stack>
                    </Stack>
                </Stack>
            </Popover>
        </Stack>
    )
}

export default React.memo(TransactionListItemHeaderWidget)
