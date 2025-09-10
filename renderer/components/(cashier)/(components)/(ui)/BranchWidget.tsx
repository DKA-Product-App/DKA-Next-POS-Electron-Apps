'use client'

import * as React from 'react'
import { Chip, alpha, Stack } from '@mui/material'
import StorefrontRoundedIcon from '@mui/icons-material/StorefrontRounded'

type BranchChipProps = {
    branchName?: string     // contoh: "Main Branch"
    registerName?: string   // contoh: "REG-01"
    justifySelf?: 'start' | 'center' | 'end'
}

export default function BranchChip({
                                       branchName = 'Branch',
                                       registerName,
                                       justifySelf = 'center',
                                   }: BranchChipProps) {
    return (
        <Stack
            sx={{ justifySelf, textAlign: 'center', alignItems: 'center' }}
        >
            <Chip
                icon={<StorefrontRoundedIcon />}
                label={`${branchName}${registerName ? ` : ${registerName}` : ''}`}
                sx={(t) => ({
                    px: 1.25,
                    '& .MuiChip-label': {
                        fontWeight: 700,
                        letterSpacing: 0.3,
                    },
                    color: t.palette.mode === 'dark' ? '#EDE9FE' : '#4C1D95',
                    background:
                        t.palette.mode === 'dark'
                            ? 'linear-gradient(90deg, rgba(124,58,237,0.25), rgba(167,139,250,0.15))'
                            : 'linear-gradient(90deg, #EDE9FE, #DDD6FE)',
                    border: `1px solid ${alpha('#8B5CF6', 0.55)}`,
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
