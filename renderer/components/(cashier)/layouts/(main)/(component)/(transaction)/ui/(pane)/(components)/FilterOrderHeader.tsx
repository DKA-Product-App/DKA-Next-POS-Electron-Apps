'use client'

import * as React from 'react'
import {
    Box,
    Button,
    Chip,
    Divider,
    IconButton,
    MenuItem,
    Popover,
    Select,
    Stack,
    Typography,
} from '@mui/material'
import FilterListRounded from '@mui/icons-material/FilterListRounded'
import RestartAltRounded from '@mui/icons-material/RestartAltRounded'
import CheckRounded from '@mui/icons-material/CheckRounded'
import PerfectScrollbar from 'react-perfect-scrollbar'
import 'react-perfect-scrollbar/dist/css/styles.css'

import {
    useFilterOrderHeader,
    PaidFilterKey,
    VoidFilterKey
} from '../context/FilterOrderHeaderContext'

// sesuaikan path ini dengan struktur project kamu
import LeftContainerBatchPrintChecker from './../(pane)/(components)/LeftContainerBatchPrintChecker'

export default function FilterOrderHeader() {
    const {
        batch, batches, setBatch,
        voidFilter, setVoidFilter,
        paidFilter, setPaidFilter,
        resetAll,
        selectedBatch,
        transaction,
    } = useFilterOrderHeader()

    const [anchorEl, setAnchorEl] = React.useState<HTMLElement | null>(null)
    const open = Boolean(anchorEl)

    const handleOpen = (e: React.MouseEvent<HTMLElement>) => setAnchorEl(e.currentTarget)
    const handleClose = () => setAnchorEl(null)

    const hasActive = batch !== 'any' || voidFilter.length > 0 || paidFilter.length > 0

    const labelByValue = (v: string) => {
        switch (v) {
            case 'pending_void': return 'Pending Void'
            case 'voided': return 'Voided'
            case 'pending_paid': return 'Pending Paid'
            case 'paid': return 'Paid'
            case 'unpaid': return 'Unpaid'
            default: return v
        }
    }

    const renderChips = (values: string[], emptyLabel: string) =>
        values.length === 0
            ? <Typography variant="body2" color="text.secondary">{emptyLabel}</Typography>
            : (
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: .5 }}>
                    {values.map((v) => <Chip key={v} size="small" label={labelByValue(v)} />)}
                </Box>
            )

    const voidOptions: { value: VoidFilterKey; label: string }[] = [
        { value: 'pending_void', label: 'Pending Void' },
        { value: 'voided', label: 'Voided' },
    ]
    const paidOptions: { value: PaidFilterKey; label: string }[] = [
        { value: 'pending_paid', label: 'Pending Paid' },
        { value: 'paid', label: 'Paid' },
        { value: 'unpaid', label: 'Unpaid (belum dibill)' },
    ]

    return (
        <>
            <IconButton
                size="small"
                onClick={handleOpen}
                title="Filter"
                color={hasActive ? 'primary' : 'default'}
            >
                <FilterListRounded />
            </IconButton>

            <Popover
                open={open}
                onClose={handleClose}
                anchorEl={anchorEl}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                transformOrigin={{ vertical: 'top', horizontal: 'right' }}
                PaperProps={{
                    sx: {
                        width: 460,
                        maxHeight: 560,
                        display: 'flex',
                        flexDirection: 'column',
                        overflow: 'hidden',
                    }
                }}
            >
                {/* ===== Scrollable content (filters only) ===== */}
                <Box sx={{ flex: 1, minHeight: 0 }}>
                    <PerfectScrollbar options={{ suppressScrollX: true }}>
                        <Box sx={{ p: 2 }}>
                            {/* Header */}
                            <Stack direction="row" alignItems="center" justifyContent="space-between">
                                <Typography variant="subtitle1" fontWeight={800}>Filter Order</Typography>
                                <Button size="small" startIcon={<RestartAltRounded />} onClick={resetAll}>
                                    Reset
                                </Button>
                            </Stack>

                            <Divider sx={{ my: 1.5 }} />

                            {/* Batch (single) */}
                            <Stack spacing={1.25} sx={{ mb: 1.75 }}>
                                <Typography variant="caption" sx={{ fontWeight: 700, textTransform: 'uppercase', letterSpacing: .4 }}>
                                    Batch
                                </Typography>
                                <Select
                                    fullWidth
                                    size="small"
                                    value={batch === 'any' ? 'any' : String(batch)}
                                    onChange={(e) => {
                                        const v = e.target.value
                                        setBatch(v === 'any' ? 'any' : Number(v))
                                    }}
                                >
                                    <MenuItem value="any">Semua Batch</MenuItem>
                                    {batches.map(b => (
                                        <MenuItem key={b} value={String(b)}>Batch {b}</MenuItem>
                                    ))}
                                </Select>
                            </Stack>

                            {/* Paid (multi) */}
                            <Stack spacing={1.25} sx={{ mb: 1.75 }}>
                                <Typography variant="caption" sx={{ fontWeight: 700, textTransform: 'uppercase', letterSpacing: .4 }}>
                                    Status Pembayaran
                                </Typography>
                                <Select
                                    fullWidth
                                    multiple
                                    size="small"
                                    value={paidFilter}
                                    onChange={(e) => setPaidFilter((e.target.value as PaidFilterKey[]))}
                                    renderValue={(selected) => renderChips(selected as string[], 'Tanpa filter')}
                                >
                                    {paidOptions.map(opt => (
                                        <MenuItem key={opt.value} value={opt.value}>
                                            <Stack direction="row" alignItems="center" spacing={1}>
                                                {paidFilter.includes(opt.value) && <CheckRounded fontSize="small" />}
                                                <span>{opt.label}</span>
                                            </Stack>
                                        </MenuItem>
                                    ))}
                                </Select>
                            </Stack>

                            {/* Void (multi) */}
                            <Stack spacing={1.25}>
                                <Typography variant="caption" sx={{ fontWeight: 700, textTransform: 'uppercase', letterSpacing: .4 }}>
                                    Status Void
                                </Typography>
                                <Select
                                    fullWidth
                                    multiple
                                    size="small"
                                    value={voidFilter}
                                    onChange={(e) => setVoidFilter((e.target.value as VoidFilterKey[]))}
                                    renderValue={(selected) => renderChips(selected as string[], 'Tanpa filter')}
                                >
                                    {voidOptions.map(opt => (
                                        <MenuItem key={opt.value} value={opt.value}>
                                            <Stack direction="row" alignItems="center" spacing={1}>
                                                {voidFilter.includes(opt.value) && <CheckRounded fontSize="small" />}
                                                <span>{opt.label}</span>
                                            </Stack>
                                        </MenuItem>
                                    ))}
                                </Select>
                            </Stack>
                        </Box>
                    </PerfectScrollbar>
                </Box>

                {/* ===== Thin divider before footer ===== */}
                <Divider />

                {/* ===== Footer (outside scrollbar) ===== */}
                <Box
                    sx={{
                        px: 1.25,
                        py: 0.75,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: 1,
                    }}
                >
                    {/* Left: hasActive summary (sticks to left) */}
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: .5, minHeight: 28 }}>
                        {hasActive ? (
                            <>
                                {batch !== 'any' && <Chip size="small" label={`Batch ${batch}`} />}
                                {paidFilter.map((v) => <Chip key={`p-${v}`} size="small" label={`Paid: ${labelByValue(v)}`} />)}
                                {voidFilter.map((v) => <Chip key={`v-${v}`} size="small" label={`Void: ${labelByValue(v)}`} />)}
                            </>
                        ) : (
                            <Typography variant="body2" color="text.secondary">Tidak ada filter aktif</Typography>
                        )}
                    </Box>

                    {/* Right: Checker button (only when specific batch selected) */}
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        {selectedBatch && (
                            <LeftContainerBatchPrintChecker
                                transaction={transaction}
                                batch={selectedBatch}
                            />
                        )}
                    </Box>
                </Box>
            </Popover>
        </>
    )
}
