'use client'

import * as React from 'react'
import { Box, Typography } from '@mui/material'
import {useEffect} from "react";

type TimeWidgetProps = {
    /** Font size jam utama */
    timeVariant?: 'h4' | 'h5' | 'h6' | 'subtitle1'
    /** Align di container grid Header */
    justifySelf?: 'start' | 'center' | 'end'
}

export default function IncomeWidget({
                                       timeVariant = 'h5',
                                       justifySelf = 'center',
                                   }: TimeWidgetProps) {
    // Jangan render waktu saat SSR → biar gak mismatch
    const [mounted, setMounted] = React.useState(false)
    const [ payloadCount, setPayloadCount ] = React.useState<{ status?: boolean, code?: number, msg?: string; data?: { total?: number; }}>(undefined);

    useEffect(() => {
        setMounted(true);
        return () => {
            setMounted(false);
        }
    }, []);

    useEffect(() => {
        if (mounted){
            window?.api?.invoke?.("api.transaction.bills:count.all", {})
                .then(async (result) => {

                    setPayloadCount(result);
                })
                .catch((error) => {
                    setPayloadCount(undefined)
                })
        }
    }, [mounted]);

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
                variant={timeVariant}
                // suppressHydrationWarning penting kalau somehow masih ada text saat SSR
                suppressHydrationWarning
                sx={{
                    fontWeight: 600,
                    letterSpacing: 1,
                    fontVariantNumeric: 'tabular-nums',
                }}
            >
                Rp. {payloadCount?.data?.total}
            </Typography>

            <Typography
                variant="caption"
                suppressHydrationWarning
                sx={{ display: 'block', color: 'text.secondary', mt: 0.25 }}
            >
                Penghasilan Shift Anda
            </Typography>
        </Box>
    )
}
