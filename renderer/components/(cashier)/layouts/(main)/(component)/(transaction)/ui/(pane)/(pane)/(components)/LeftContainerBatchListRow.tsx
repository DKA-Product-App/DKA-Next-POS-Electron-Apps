'use client'

import * as React from 'react'
import { Box, Chip, ListItemButton, Stack, Typography } from '@mui/material'
import LayersRounded from '@mui/icons-material/LayersRounded'
import LocalMallRounded from '@mui/icons-material/LocalMallRounded'
import LeftContainerBatchPrintChecker from './../(components)/LeftContainerBatchPrintChecker'
import {Transaction, TransactionBatches} from "../../../types/api.transaction.type"; // tipe Batch ambil dari parent

type Props = {
    batch: TransactionBatches
    transaction: Transaction
    selected: boolean
    priceLabel: string
    totalItem: number
    totalQty: number
    activeCount: number
    pendingCount: number
    startIso?: string
    endIso?: string | null
    isActiveTimer: boolean
    onClick: (b: TransactionBatches) => void
    TimerText: React.FC<{ startIso?: string; endIso?: string | null; active: boolean }>
}

const LeftContainerBatchListRow: React.FC<Props> = ({batch, transaction, selected, priceLabel, totalItem, totalQty, activeCount, pendingCount, startIso, endIso, isActiveTimer, onClick, TimerText,}) => {
    const cardBorderColor = selected ? 'primary.outlinedBorder' : 'divider'
    const isClosed = Boolean(transaction?.time_closed)

    // ★ status chip rules: closed -> merah, pending ada -> warning, else aktif -> hijau
    const statusChip =
        isClosed ? { label: 'Selesai', color: 'error' as const } :
            pendingCount > 0 ? { label: 'Pending', color: 'warning' as const } :
                { label: 'Aktif', color: 'success' as const }

    // ★ helper flags buat footer
    const allSuccessPaid = pendingCount === 0 && activeCount === 0
    const hasPending = pendingCount > 0

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
                        <Typography variant="subtitle1" fontWeight={800} title={priceLabel}>
                            {priceLabel}
                        </Typography>
                    </Stack>

                    {/* Baris 2: item/qty kiri, PRINT kanan */}
                    <Stack direction="row" alignItems="center" gap={0.75}>
                        <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap sx={{ flex: 1, minWidth: 0 }}>
                            <Chip size="small" icon={<LocalMallRounded />} label={`${totalItem} item`} />
                            <Chip size="small" icon={<LocalMallRounded />} label={`${totalQty} Qty`} />
                        </Stack>
                        <LeftContainerBatchPrintChecker transaction={transaction} batch={batch} />
                    </Stack>

                    {/* Baris 3: active/pending */}
                    <Stack direction="row" alignItems="center" gap={0.75}>
                        <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap sx={{ flex: 1, minWidth: 0 }}>
                            <Chip size="small" icon={<LocalMallRounded />} label={`${activeCount} active`} />
                            <Chip size="small" icon={<LocalMallRounded />} label={`${pendingCount} Pending`} />
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
                <TimerText startIso={startIso} endIso={endIso ?? null} active={isActiveTimer} />
            </Box>
        </>
    )
}

export default React.memo(LeftContainerBatchListRow);
