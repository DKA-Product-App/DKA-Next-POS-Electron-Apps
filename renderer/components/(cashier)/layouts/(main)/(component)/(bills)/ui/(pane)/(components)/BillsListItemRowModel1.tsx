// (components)/BillsListItemRowModel1.tsx
'use client'

import * as React from 'react'
import { Box, Chip, ListItemButton, Stack, Typography } from '@mui/material'
import RequestQuoteRounded from '@mui/icons-material/RequestQuoteRounded'
import PersonOutlineRounded from '@mui/icons-material/PersonOutlineRounded'
import EventNoteRounded from '@mui/icons-material/EventNoteRounded'
import Inventory2Rounded from '@mui/icons-material/Inventory2Rounded'
import type { BillStub } from '../BillsListItem' // ⬅️ tipe dump-only dari parent

export type BillsListItemRowProps = {
    bill: BillStub
    selected?: boolean
    onRowClick?: () => void
}

const chipSquare = { borderRadius: 0 } as const
const fmtIDR = (n?: string) =>
    n ? new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(+n) : 'Rp —'

const statusChip = (status?: BillStub['status']) => {
    switch (status) {
        case 'paid':    return { color: 'success' as const, label: 'Paid' }
        case 'partial': return { color: 'info'    as const, label: 'Partial' }
        default:        return { color: 'warning' as const, label: 'Unpaid' }
    }
}

const BillsListItemRowModel1: React.FC<BillsListItemRowProps> = ({ bill, selected = false, onRowClick }) => {
    const cardBorderColor = selected ? 'primary.outlinedBorder' : 'divider'
    const st = statusChip(bill.status)

    return (
        <Box sx={{ mb: 1 }}>
            <ListItemButton
                onClick={onRowClick}
                selected={selected}
                sx={{
                    position: 'relative',
                    alignItems: 'flex-start',
                    p: 0, // footer full-bleed
                    border: '1px solid', borderColor: cardBorderColor,
                    bgcolor: selected ? 'action.selected' : 'background.paper',
                    boxShadow: selected ? '0 10px 24px rgba(0,0,0,0.12)' : '0 2px 8px rgba(0,0,0,0.06)',
                    transition: 'transform .15s ease, box-shadow .2s ease, border-color .2s ease, background-color .2s ease',
                    transform: 'translateY(0)',
                    '&:hover': { transform: 'translateY(-1px)', boxShadow: '0 12px 28px rgba(0,0,0,0.12)' },
                    borderRadius: 0,
                    '&::before': {
                        content: '""', position: 'absolute', left: 0, top: 0, bottom: 0, width: 4,
                        background: 'linear-gradient(180deg, #7c3aed, #a855f7 60%, #c084fc)',
                    },
                }}
            >
                <Stack spacing={0} width="100%">
                    {/* Header content */}
                    <Box sx={{ px: 1.5, py: 1.25 }}>
                        {/* Row 1: [Invoice + Status] kiri — [Price] kanan */}
                        <Stack direction="row" alignItems="center" justifyContent="space-between" gap={1}>
                            <Stack direction="row" spacing={1} alignItems="center" minWidth={0}>
                                <RequestQuoteRounded fontSize="small" />
                                <Typography variant="h6" fontWeight={900} noWrap sx={{ letterSpacing: .2, lineHeight: 1.2 }}>
                                    #{' '}{bill.invoice}
                                </Typography>
                                <Chip size="small" color={st.color} label={st.label} sx={chipSquare} />
                            </Stack>
                            <Typography variant="subtitle1" fontWeight={900}>
                                {fmtIDR(bill.total)}
                            </Typography>
                        </Stack>

                        {/* Row 2: meta ringkas */}
                        <Stack direction="row" alignItems="center" gap={0.75} sx={{ mt: 1 }}>
                            <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap sx={{ flex: 1, minWidth: 0 }}>
                                <Chip size="small" icon={<Inventory2Rounded />} label="0 item" sx={chipSquare} />
                                <Chip size="small" icon={<EventNoteRounded />} label={`Issued — ${bill.issuedAt ?? ''}`} sx={chipSquare} />
                                <Chip size="small" icon={<PersonOutlineRounded />} label={`Customer — ${bill.customer ?? '—'}`} sx={chipSquare} />
                            </Stack>
                        </Stack>
                    </Box>

                    {/* Footer strip (di dalam button, full-bleed) */}
                    <Box
                        sx={{
                            mt: 0.5,
                            width: '100%',
                            py: 0.75,
                            px: 1.5,
                            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                            bgcolor: 'primary.main',
                            color: 'primary.contrastText',
                            borderTop: '1px solid',
                            borderColor: cardBorderColor,
                        }}
                    >
                        <Typography variant="caption" sx={{ fontWeight: 800 }}>Updated —</Typography>
                        <Typography variant="caption">Ref — {bill.ref ?? '—'}</Typography>
                    </Box>
                </Stack>
            </ListItemButton>
        </Box>
    )
}

export default React.memo(BillsListItemRowModel1)
