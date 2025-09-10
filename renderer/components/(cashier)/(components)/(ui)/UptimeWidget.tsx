'use client'

import * as React from 'react'
import { Stack, Chip, alpha } from '@mui/material'
import StorefrontRoundedIcon from '@mui/icons-material/StorefrontRounded'

type BranchChipProps = {
    name?: string        // contoh: "Main Branch"
    description?: string // contoh: "REG-01"
    justifySelf?: 'start' | 'center' | 'end'
}

export default function BranchChip({
                                       name = '-',
                                       description,
                                       justifySelf = 'center',
                                   }: BranchChipProps) {
    return (
        <Stack
            sx={{ justifySelf, textAlign: 'center', alignItems: 'center' }}
        >
            <Chip
                icon={<StorefrontRoundedIcon />}
                label={`${name}${description ? ` : ${description}` : ''}`}
                sx={(t) => ({
                    px: 1.5,
                    '& .MuiChip-icon': {
                        ml: 0.25, // kasih sedikit spasi kiri
                        mr: 0.75, // jarak icon ke text
                    },
                    '& .MuiChip-label': {
                        fontWeight: 700,
                        letterSpacing: 0.3,
                        px: 0.5,
                    },
                    color: t.palette.mode === 'dark' ? '#EDE9FE' : '#4C1D95',
                    background:
                        t.palette.mode === 'dark'
                            ? 'linear-gradient(90deg, rgba(124,58,237,0.25), rgba(167,139,250,0.15))'
                            : 'linear-gradient(90deg, #EDE9FE, #DDD6FE)',
                    border: `1px solid ${alpha('#8B5CF6', 0.5)}`,
                    boxShadow: `0 4px 12px ${alpha('#8B5CF6', 0.25)}`,
                    transition: 'all .2s ease',
                    '&:hover': {
                        boxShadow: `0 6px 16px ${alpha('#8B5CF6', 0.35)}`,
                        transform: 'translateY(-1px)',
                    },
                })}
            />
        </Stack>
    )
}
