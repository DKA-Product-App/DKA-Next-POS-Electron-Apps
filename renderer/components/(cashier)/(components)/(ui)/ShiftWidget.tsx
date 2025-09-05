'use client'

import * as React from 'react'
import { Box, Typography } from '@mui/material'

type ShiftWidgetProps = {
    /** Nama shift, misal: "Shift Siang" */
    label?: string

    /** Deskripsi jam kerja, misal: "13:00 – 21:00" */
    description?: string

    justifySelf?: 'start' | 'center' | 'end'
}

export default function ShiftWidget({
                                        label = 'Shift',
                                        description,
                                        justifySelf = 'center',
                                    }: ShiftWidgetProps) {
    return (
        <Box
            sx={{
                justifySelf,
                textAlign: 'center',
                lineHeight: 1.1,
                userSelect: 'none',
            }}
        >
            {/* Nama Shift */}
            <Typography
                variant="body1"
                sx={{
                    fontWeight: 600,
                    letterSpacing: 0.5,
                }}
            >
                {label}
            </Typography>

            {/* Deskripsi jam */}
            {description && (
                <Typography
                    variant="caption"
                    sx={{ display: 'block', color: 'text.secondary', mt: 0.25 }}
                >
                    {description}
                </Typography>
            )}
        </Box>
    )
}
