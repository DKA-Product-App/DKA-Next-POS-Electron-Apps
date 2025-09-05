'use client'

import * as React from 'react'
import { Box, Typography } from '@mui/material'

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
            sx={{
                justifySelf,
                textAlign: 'center',
                lineHeight: 1.1,
                userSelect: 'none',
            }}
        >
            <Typography
                variant="body1"
                sx={{
                    fontWeight: 600,
                    letterSpacing: 0.5,
                }}
            >
                {branchName}
            </Typography>

            {registerName && (
                <Typography variant="caption" sx={{ display: 'block', color: 'text.secondary', mt: 0.25 }}>
                    {registerName}
                </Typography>
            )}
        </Box>
    )
}
