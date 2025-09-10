'use client'

import * as React from 'react'
import { Box, Typography, alpha } from '@mui/material'

type BranchWidgetProps = {
    name?: string     // contoh: "Main Branch"
    description?: string   // contoh: "REG-01"
    justifySelf?: 'start' | 'center' | 'end'
}

export default function UptimeWidget({
                                         name = '-',
                                         description,
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
                // Background glassy + ungu lembut
                bgcolor:
                    t.palette.mode === 'dark'
                        ? alpha('#1E1B2E', 0.7)
                        : alpha('#F5F3FF', 0.8),
                border: `1px solid ${alpha('#8B5CF6', 0.5)}`,
                boxShadow: `0 4px 16px ${alpha('#8B5CF6', 0.25)}`,
                backdropFilter: 'blur(6px)',
                transition: 'all 0.25s ease',
                '&:hover': {
                    boxShadow: `0 6px 20px ${alpha('#8B5CF6', 0.4)}`,
                    transform: 'translateY(-2px)',
                },
                // Accent gradient bar tipis di atas
                '&::before': {
                    content: '""',
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    height: 3,
                    background:
                        'linear-gradient(90deg, #7C3AED, #8B5CF6 40%, #A78BFA 80%)',
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
                {name}
            </Typography>

            {description && (
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
                    {description}
                </Typography>
            )}
        </Box>
    )
}
