// (components)/BillsListItemRowModel2.tsx
'use client'

import * as React from 'react'
import { Box, Chip, ListItemButton, Stack, Typography } from '@mui/material'
import { alpha } from '@mui/material/styles'

import RequestQuoteRounded from '@mui/icons-material/RequestQuoteRounded'
import EventNoteRounded from '@mui/icons-material/EventNoteRounded'
import Inventory2Rounded from '@mui/icons-material/Inventory2Rounded'

import type { BillStub } from '../BillsListItem' // ⬅️ ambil tipe dari parent (UI only)

type Props = {
    bill: BillStub
    selected?: boolean
    onRowClick?: () => void
}

const chipSquareSx = { borderRadius: 0 } as const
const fmtIDR = (n?: string) =>
    n ? new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(+n) : 'Rp —'

const statusChip = (status?: BillStub['status']) => {
    switch (status) {
        case 'paid':    return { color: 'success' as const, label: 'Paid' }
        case 'partial': return { color: 'info'    as const, label: 'Partial' }
        default:        return { color: 'warning' as const, label: 'Unpaid' }
    }
}

const BillsListItemRowModel2: React.FC<Props> = ({ bill, selected = false, onRowClick }) => {
    const cardBorderColor = selected ? 'primary.outlinedBorder' : 'divider'
    const st = statusChip(bill.status)

    return (
        <Box sx={{ mb: 1 }}>
            <ListItemButton
                onClick={onRowClick}
                selected={selected}
                sx={(t) => ({
                    alignItems: 'stretch',
                    p: 0,
                    border: '1px solid',
                    borderColor: cardBorderColor,
                    bgcolor: selected
                        ? (t.palette.mode === 'dark'
                            ? alpha(t.palette.primary.main, .06)
                            : alpha(t.palette.primary.light, .10))
                        : 'background.paper',
                    borderRadius: 0,
                    boxShadow: selected ? '0 8px 18px rgba(0,0,0,0.12)' : '0 1px 4px rgba(0,0,0,0.06)',
                    transition: 'transform .18s ease, box-shadow .18s ease, border-color .18s ease, background-color .18s ease',
                    '&:hover': { transform: 'translateY(-1px)', boxShadow: '0 10px 24px rgba(0,0,0,0.12)' },
                })}
            >
                <Stack direction="row" alignItems="stretch" width="100%">
                    {/* Tile ikon — kotak */}
                    <Box
                        sx={(t) => ({
                            width: 44, minWidth: 44, alignSelf: 'stretch',
                            borderRadius: 0,
                            display: 'grid', placeItems: 'center',
                            background: `linear-gradient(180deg, ${t.palette.primary.main}, ${alpha(t.palette.primary.main, 0.6)})`,
                            color: t.palette.primary.contrastText,
                            boxShadow: `inset 0 0 0 1px ${alpha(t.palette.common.white, .18)}`,
                        })}
                    >
                        <RequestQuoteRounded fontSize="small" />
                    </Box>

                    {/* Konten + footer */}
                    <Stack spacing={0} sx={{ flex: 1, minWidth: 0 }}>
                        {/* Header content */}
                        <Box sx={{ px: 1.5, py: 1.25 }}>
                            {/* [Invoice + Status] kiri — [Price] kanan */}
                            <Stack direction="row" alignItems="center" justifyContent="space-between" minWidth={0} gap={1}>
                                <Stack direction="row" alignItems="center" spacing={1} minWidth={0}>
                                    <Typography variant="h6" fontWeight={900} noWrap sx={{ letterSpacing: .2 }}>
                                        #{' '}{bill.invoice}
                                    </Typography>
                                    <Chip size="small" color={st.color} label={st.label} sx={chipSquareSx} />
                                </Stack>
                                <Typography variant="subtitle1" fontWeight={900} sx={{ flexShrink: 0, textAlign: 'right' }}>
                                    {fmtIDR(bill.total)}
                                </Typography>
                            </Stack>

                            {/* Meta chips */}
                            <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap sx={{ mt: 1 }}>
                                <Chip size="small" icon={<Inventory2Rounded />} label={`${bill.customer ? 1 : 0} item`} variant="outlined" sx={chipSquareSx} />
                                <Chip size="small" icon={<EventNoteRounded />} label={`Issued ${bill.issuedAt ? '— ' : '—'}${bill.issuedAt ?? ''}`} variant="outlined" sx={chipSquareSx} />
                            </Stack>

                            {/* Ref kecil */}
                            <Typography variant="caption" color="text.secondary" sx={{ mt: .5 }}>
                                Ref — {bill.ref ?? '—'}{bill.customer ? ` • ${bill.customer}` : ''}
                            </Typography>
                        </Box>

                        {/* Footer strip — Updated & Ref (tetap kotak, full-bleed) */}
                        <Box
                            sx={{
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
                </Stack>
            </ListItemButton>
        </Box>
    )
}

export default React.memo(BillsListItemRowModel2)
