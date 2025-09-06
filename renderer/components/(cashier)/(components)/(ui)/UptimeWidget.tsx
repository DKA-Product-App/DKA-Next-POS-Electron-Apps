'use client'

import * as React from 'react'
import { Box, Typography } from '@mui/material'

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
            sx={{
                justifySelf,
                textAlign: 'center',
                lineHeight: 1.1,
                userSelect: 'none',
                px: 2,
                py: 1,
                bgcolor: 'background.paper',
                boxShadow: 2,
                border: '1px solid',
                borderColor: 'divider'
            }}
        >
            <Typography
                variant="body1"
                sx={{
                    fontSize: 14,
                    fontWeight: 700,
                    letterSpacing: 0.5,
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
                        color: 'text.secondary',
                        mt: 0.25,
                    }}
                >
                    {description}
                </Typography>
            )}
        </Box>
    )
}
