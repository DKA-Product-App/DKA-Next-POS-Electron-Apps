'use client'

import * as React from 'react'
import { Box, Typography, alpha } from '@mui/material'

type BranchWidgetProps = {
    branchName?: string     // contoh: "Main Branch"
    registerName?: string   // contoh: "REG-01"
    justifySelf?: 'start' | 'center' | 'end'
}

export default function BranchWidget({
                                         branchName = 'Branch',
                                         registerName,
                                         justifySelf = 'center',
                                     }: BranchWidgetProps) {
    return (
        <Box
            sx={(t) => ({
                justifySelf,
                textAlign: 'center',
                lineHeight: 1.1,
                userSelect: 'none',
                px: 2,
                py: 1.2,
                borderRadius: 2,
                position: 'relative',
                overflow: 'hidden',
                bgcolor:
                    t.palette.mode === 'dark'
                        ? alpha('#1E1B2E', 0.7)
                        : alpha('#F5F3FF', 0.85),
                border: `1px solid ${alpha('#8B5CF6', 0.55)}`,
                boxShadow: `0 4px 14px ${alpha('#8B5CF6', 0.25)}`,
                backdropFilter: 'blur(6px)',
                transition: 'all 0.25s ease',
                '&:hover': {
                    boxShadow: `0 6px 20px ${alpha('#8B5CF6', 0.4)}`,
                    transform: 'translateY(-2px)',
                },
                // Accent bar tipis di atas
                '&::before': {
                    content: '""',
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    height: 3,
                    background:
                        'linear-gradient(90deg, #7C3AED, #8B5CF6 35%, #A78BFA 70%, #EC4899)',
                },
            })}
        >
            <Typography
                variant="body1"
                sx={{
                    fontSize: 14,
                    fontWeight: 700,
                    letterSpacing: 0.5,
                    color: (t) =>
                        t.palette.mode === 'dark' ? '#EDE9FE' : '#4C1D95',
                }}
            >
                {branchName}
            </Typography>

            {registerName && (
                <Typography
                    variant="caption"
                    sx={{
                        fontSize: 12,
                        display: 'block',
                        mt: 0.25,
                        color: (t) =>
                            t.palette.mode === 'dark'
                                ? alpha('#DDD6FE', 0.9)
                                : '#6D28D9',
                    }}
                >
                    {registerName}
                </Typography>
            )}
        </Box>
    )
}
