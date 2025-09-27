'use client'

import * as React from 'react'
import {
    Box, Stack, TextField, InputAdornment, IconButton, Popover, MenuItem, Typography, Slider, Tooltip
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
    cashierName: string          // gunakan 'all' untuk semua
    totalRange: number[]         // [min, max] dalam satuan mata uang (IDR)
}

type Props = {
    value: BillFilters
    onChange: (patch: Partial<BillFilters>) => void
    cashierOptions: string[]     // sudah unique & sorted di parent (opsional)
    maxTotal: number             // batas atas total transaksi (untuk slider)
    filteredCount?: number       // tampilkan hitungan hasil (opsional)
}

const TZ = 'Asia/Makassar'
const DEBOUNCE_MS = 600

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

const currency = (n: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n)

const BillListItemHeaderWidget: React.FC<Props> = ({ value, onChange, cashierOptions, maxTotal, filteredCount }) => {
    const [anchorEl, setAnchorEl] = React.useState<HTMLElement | null>(null)
    const open = Boolean(anchorEl)

    // ====== Draft state (hindari spam update) ======
    const [draftStartAt, setDraftStartAt] = React.useState(value.startAt)
    const [draftEndAt, setDraftEndAt] = React.useState(value.endAt)
    const [draftTotalRange, setDraftTotalRange] = React.useState<number[]>(value.totalRange)

    // Sinkron saat parent berubah (mis. reset dari luar)
    React.useEffect(() => { setDraftStartAt(value.startAt) }, [value.startAt])
    React.useEffect(() => { setDraftEndAt(value.endAt) }, [value.endAt])
    React.useEffect(() => { setDraftTotalRange(value.totalRange) }, [value.totalRange])

    // Inisialisasi rentang hari ini bila kosong
    React.useEffect(() => {
        if (value.startAt && value.endAt) return
        const now = new Date()
        const { year, month, day } = partsInTz(now, TZ)
        const startOfToday = toDateTimeLocalString(year, month, day, '00', '00')
        const endOfToday = toDateTimeLocalString(year, month, day, '23', '59')

        setDraftStartAt(startOfToday)
        setDraftEndAt(endOfToday)
        onChange({ startAt: startOfToday, endAt: endOfToday })
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    // Debounce commit waktu
    React.useEffect(() => {
        if (draftStartAt === value.startAt && draftEndAt === value.endAt) return
        const t = setTimeout(() => onChange({ startAt: draftStartAt, endAt: draftEndAt }), DEBOUNCE_MS)
        return () => clearTimeout(t)
    }, [draftStartAt, draftEndAt]) // eslint-disable-line react-hooks/exhaustive-deps

    const commitTimeRange = React.useCallback(() => {
        if (draftStartAt !== value.startAt || draftEndAt !== value.endAt) {
            onChange({ startAt: draftStartAt, endAt: draftEndAt })
        }
    }, [draftStartAt, draftEndAt, value.startAt, value.endAt, onChange])

    // Jaga range bila maxTotal berubah turun
    React.useEffect(() => {
        setDraftTotalRange(([a, b]) => [Math.max(0, Math.min(a, maxTotal)), Math.max(0, Math.min(b, maxTotal))])
    }, [maxTotal])

    const handleOpen = (e: React.MouseEvent<HTMLElement>) => setAnchorEl(e.currentTarget)
    const handleClose = () => { commitTimeRange(); setAnchorEl(null) }

    const handleReset = () => {
        const now = new Date()
        const { year, month, day } = partsInTz(now, TZ)
        const startOfToday = toDateTimeLocalString(year, month, day, '00', '00')
        const endOfToday = toDateTimeLocalString(year, month, day, '23', '59')

        setDraftStartAt(startOfToday)
        setDraftEndAt(endOfToday)
        setDraftTotalRange([0, Math.max(0, maxTotal)])

        onChange({
            startAt: startOfToday,
            endAt: endOfToday,
            paid: 'all',
            cashierName: 'all',
            totalRange: [0, Math.max(0, maxTotal)],
        })
    }

    // ==== UI ====
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
                                    onChange={(e) => onChange({ paid: e.target.value as BillFilters['paid'] })}
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
                                    onChange={(e) => onChange({ cashierName: e.target.value })}
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
                                    onChangeCommitted={(_, v) => onChange({ totalRange: v as number[] })}
                                    valueLabelDisplay="auto"
                                    min={0}
                                    max={Math.max(0, maxTotal)}
                                    step={1000}
                                    disableSwap
                                />
                            </Box>

                            {/* Counter */}
                            {!!filteredCount && (
                                <Typography variant="caption" color="text.secondary">{filteredCount} hasil</Typography>
                            )}
                        </Stack>
                    </PerfectScrollbar>
                </Box>

                {/* Footer fixed */}
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
