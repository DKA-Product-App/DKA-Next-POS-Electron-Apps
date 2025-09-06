'use client';

import * as React from 'react'
import {
    Box, Button, Checkbox, Chip, Divider, IconButton, InputAdornment, Popover,
    Stack, TextField, ToggleButton, ToggleButtonGroup, Typography, Tooltip, Paper
} from '@mui/material'
import PercentRounded from '@mui/icons-material/PercentRounded'
import SellRounded from '@mui/icons-material/SellRounded'
import ClearRounded from '@mui/icons-material/ClearRounded'
import FilterAltRounded from '@mui/icons-material/FilterAltRounded'
import CheckBoxRounded from '@mui/icons-material/CheckBoxRounded'
import ListAltRounded from '@mui/icons-material/ListAltRounded'
import PerfectScrollbar from 'react-perfect-scrollbar'
import 'react-perfect-scrollbar/dist/css/styles.css'

type DiscountType = 'percent' | 'nominal'

const formatCurrency = (n: number) =>
    n.toLocaleString('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 })

const PresetChip: React.FC<{ active: boolean; label: string; onClick: () => void }> = ({ active, label, onClick }) => (
    <Chip
        size="small"
        label={label}
        onClick={onClick}
        variant={active ? 'filled' : 'outlined'}
        color={active ? 'primary' : 'default'}
        sx={{ fontWeight: 700 }}
    />
)

const DiscountWidget: React.FC = () => {
    // ===== Dummy cart items internal =====
    const items = React.useMemo(() => ([
        { key: 'itm-001', name: 'Americano (Hot)',        unitPrice: 22000, qty: 1, eligible: true  },
        { key: 'itm-002', name: 'Cappuccino (Ice)',       unitPrice: 28000, qty: 1, eligible: true  },
        { key: 'itm-003', name: 'Croissant Butter',       unitPrice: 15000, qty: 2, eligible: false },
        { key: 'itm-004', name: 'Spaghetti Aglio e Olio', unitPrice: 38000, qty: 1, eligible: true  },
        { key: 'itm-005', name: 'Mineral Water 600ml',    unitPrice: 7000,  qty: 3, eligible: false },
    ]), [])

    // subtotal dummy → dasar potongan
    const subtotal = React.useMemo(
        () => items.reduce((s, it) => s + it.unitPrice * it.qty, 0),
        [items]
    )

    // ====== APPLIED (yang tampil di tombol) ======
    const [appliedType, setAppliedType] = React.useState<DiscountType>('percent')
    const [appliedValue, setAppliedValue] = React.useState<number>(0)
    const [appliedKeys, setAppliedKeys] = React.useState<string[]>(
        items.filter(it => it.eligible).map(it => it.key)
    )

    // ====== DRAFT (yang diedit di popover) ======
    const [draftType, setDraftType] = React.useState<DiscountType>(appliedType)
    const [draftValue, setDraftValue] = React.useState<number>(appliedValue)
    const [draftKeys, setDraftKeys] = React.useState<string[]>(appliedKeys)
    const [filterMode, setFilterMode] = React.useState<'all' | 'selected'>('all')

    // Popover control
    const [anchorEl, setAnchorEl] = React.useState<HTMLElement | null>(null)
    const open = Boolean(anchorEl)
    const handleOpen = (e: React.MouseEvent<HTMLElement>) => {
        // setiap buka, sinkronkan draft dari applied
        setDraftType(appliedType)
        setDraftValue(appliedValue)
        setDraftKeys(appliedKeys)
        setFilterMode('all')
        setAnchorEl(e.currentTarget)
    }
    const handleClose = () => setAnchorEl(null)

    // ===== Helpers (draft) =====
    const visibleItems = items.filter(it => filterMode === 'selected' ? draftKeys.includes(it.key) : true)

    const toggleDraftItem = (key: string) => {
        setDraftKeys(prev => prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key])
    }
    const selectAllVisible = (keys: string[]) =>
        setDraftKeys(prev => Array.from(new Set([...prev, ...keys])))
    const clearVisible = (keys: string[]) =>
        setDraftKeys(prev => prev.filter(k => !keys.includes(k)))
    const handleType = (_: any, next: DiscountType | null) => next && setDraftType(next)
    const handleValueInput = (v: string) => setDraftValue(Number(v.replace(/[^\d]/g, '')) || 0)
    const setPresetPercent = (p: number) => { setDraftType('percent'); setDraftValue(p) }
    const setPresetNominal = (n: number) => { setDraftType('nominal'); setDraftValue(n) }

    // APPLY: commit draft → applied (ini yang bikin label berubah saat klik Selesai)
    const applyDraft = () => {
        setAppliedType(draftType)
        setAppliedValue(draftValue)
        setAppliedKeys(draftKeys)
        handleClose()
    }

    // RESET semua (applied & draft)
    const clearAll = () => {
        setDraftValue(0); setDraftKeys([])
        setAppliedValue(0); setAppliedKeys([])
    }

    // ==== Hitung potongan untuk LABEL (pakai APPLIED) ====
    const appliedCut = React.useMemo(() => {
        if (appliedValue <= 0 || appliedKeys.length === 0) return 0
        const raw = appliedType === 'percent' ? Math.round(subtotal * (appliedValue / 100)) : appliedValue
        return Math.min(raw, subtotal)
    }, [appliedType, appliedValue, appliedKeys.length, subtotal])

    // Label tombol: baris atas potongan / “Pilih promo”, baris bawah ringkasan
    const labelTop = appliedCut > 0 ? `-${formatCurrency(appliedCut)}` : 'Dengan Discount'
    const labelBottom =
        appliedCut > 0
            ? (appliedType === 'percent'
                ? `${appliedValue}% • ${appliedKeys.length} item`
                : `${formatCurrency(appliedValue)} • ${appliedKeys.length} item`)
            : ' '

    return (
        <Box sx={{ width: '100%', my: 1 }}>
            {/* Trigger */}
            <Paper
                variant="outlined"
                sx={(t) => ({
                    p: 1,
                    borderRadius: 1.5,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 1,
                    cursor: 'pointer',
                    borderColor: appliedCut > 0 ? t.palette.primary.main : 'divider',
                    bgcolor: appliedCut > 0
                        ? (t.palette.mode === 'dark' ? 'rgba(25,118,210,0.10)' : 'rgba(25,118,210,0.06)')
                        : (t.palette.mode === 'dark' ? t.palette.grey[900] : t.palette.background.paper),
                })}
                onClick={handleOpen}
            >
                <Stack direction="row" alignItems="center" spacing={1} sx={{ minWidth: 0 }}>
                    <SellRounded fontSize="small" />
                    <Stack minWidth={0}>
                        <Typography fontWeight={900} noWrap>{labelTop}</Typography>
                        <Typography variant="caption" color="text.secondary" noWrap>{labelBottom}</Typography>
                    </Stack>
                </Stack>

                {(appliedValue > 0 || appliedKeys.length > 0) && (
                    <Tooltip title="Reset diskon">
                        <IconButton size="small" onClick={(e) => { e.stopPropagation(); clearAll() }}>
                            <ClearRounded fontSize="small" />
                        </IconButton>
                    </Tooltip>
                )}
            </Paper>

            {/* Popover: buka KE ATAS */}
            <Popover
                open={open}
                anchorEl={anchorEl}
                onClose={handleClose}
                anchorOrigin={{ vertical: 'top', horizontal: 'left' }}
                transformOrigin={{ vertical: 'bottom', horizontal: 'left' }}
                elevation={8}
                slotProps={{ paper: { sx: { borderRadius: 2, p: 1.5, width: 360, maxWidth: '90vw' } } }}
            >
                <Stack spacing={1.25}>
                    {/* Header: tipe diskon + filter */}
                    <Stack direction="row" alignItems="center" justifyContent="space-between" gap={1}>
                        <ToggleButtonGroup value={draftType} exclusive onChange={handleType} size="small" color="primary">
                            <ToggleButton value="percent" sx={{ px: 1.25 }}>
                                <PercentRounded fontSize="small" />&nbsp;%
                            </ToggleButton>
                            <ToggleButton value="nominal" sx={{ px: 1.25 }}>
                                Rp
                            </ToggleButton>
                        </ToggleButtonGroup>

                        <Stack direction="row" alignItems="center" spacing={1}>
                            <Chip
                                size="small"
                                icon={<ListAltRounded />}
                                label={filterMode === 'all' ? 'All Items' : 'Selected Only'}
                                onClick={() => setFilterMode(m => m === 'all' ? 'selected' : 'all')}
                                variant="outlined"
                            />
                            <Chip
                                size="small"
                                icon={<FilterAltRounded />}
                                label="Select All (view)"
                                onClick={() => selectAllVisible(visibleItems.map(v => v.key))}
                                variant="outlined"
                            />
                        </Stack>
                    </Stack>

                    {/* Presets */}
                    {draftType === 'percent' ? (
                        <Stack direction="row" flexWrap="wrap" gap={0.75}>
                            {[5, 10, 15, 20].map(p =>
                                <PresetChip key={p} active={draftValue === p} label={`${p}%`} onClick={() => setPresetPercent(p)} />
                            )}
                        </Stack>
                    ) : (
                        <Stack direction="row" flexWrap="wrap" gap={0.75}>
                            {[2000, 5000, 10000, 20000].map(n =>
                                <PresetChip key={n} active={draftValue === n} label={formatCurrency(n)} onClick={() => setPresetNominal(n)} />
                            )}
                        </Stack>
                    )}

                    {/* Custom value */}
                    <TextField
                        size="small"
                        label={draftType === 'percent' ? 'Persen (%)' : 'Nominal (Rp)'}
                        value={draftValue ? String(draftValue) : ''}
                        onChange={(e) => handleValueInput(e.target.value)}
                        InputProps={draftType === 'percent'
                            ? { endAdornment: <InputAdornment position="end">%</InputAdornment> }
                            : { startAdornment: <InputAdornment position="start">Rp</InputAdornment> }
                        }
                        inputProps={{ inputMode: 'numeric', pattern: '[0-9]*' }}
                    />

                    <Divider />

                    {/* List item + PerfectScrollbar (DRAFT) */}
                    <Box sx={{ height: 220, borderRadius: 1, overflow: 'hidden', border: '1px solid', borderColor: 'divider' }}>
                        <PerfectScrollbar style={{ height: '100%' }} options={{ suppressScrollX: true }}>
                            <Stack spacing={0} sx={{ p: 0.5 }}>
                                {visibleItems.length === 0 ? (
                                    <Typography variant="body2" color="text.secondary" sx={{ p: 1 }}>
                                        Tidak ada item untuk ditampilkan.
                                    </Typography>
                                ) : visibleItems.map((it) => {
                                    const checked = draftKeys.includes(it.key)
                                    const lineTotal = it.unitPrice * it.qty
                                    return (
                                        <Stack
                                            key={it.key}
                                            direction="row"
                                            alignItems="center"
                                            justifyContent="space-between"
                                            sx={{
                                                px: 1,
                                                py: 0.75,
                                                borderRadius: 1,
                                                '&:hover': { bgcolor: 'action.hover' },
                                            }}
                                        >
                                            <Stack spacing={0} sx={{ minWidth: 0, flex: 1 }}>
                                                <Typography noWrap fontWeight={700}>{it.name}</Typography>
                                                <Typography variant="caption" color="text.secondary" sx={{ fontVariantNumeric: 'tabular-nums' }}>
                                                    {formatCurrency(it.unitPrice)} × {it.qty} = {formatCurrency(lineTotal)}
                                                </Typography>
                                            </Stack>

                                            <Checkbox
                                                checked={checked}
                                                onChange={() => toggleDraftItem(it.key)}
                                                color="primary"
                                            />
                                        </Stack>
                                    )
                                })}
                            </Stack>
                        </PerfectScrollbar>
                    </Box>

                    {/* Footer popover */}
                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                        <Button color="inherit" onClick={() => { setDraftValue(0); setDraftKeys([]); }}>Reset (draft)</Button>
                        <Button variant="contained" onClick={applyDraft}>Selesai</Button>
                    </Stack>
                </Stack>
            </Popover>
        </Box>
    )
}

export default DiscountWidget
