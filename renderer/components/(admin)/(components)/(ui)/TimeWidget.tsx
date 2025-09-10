'use client'

import * as React from 'react'
import { Box, Typography } from '@mui/material'

type TimeWidgetProps = {
    /** Font size jam utama */
    timeVariant?: 'h4' | 'h5' | 'h6' | 'subtitle1'
    /** Align di container grid Header */
    justifySelf?: 'start' | 'center' | 'end'
    /** Opsional: IANA timezone, default: lokal browser */
    timeZone?: string
}

export default function TimeWidget({
                                       timeVariant = 'h5',
                                       justifySelf = 'center',
                                       timeZone,
                                   }: TimeWidgetProps) {
    // Jangan render waktu saat SSR → biar gak mismatch
    const [mounted, setMounted] = React.useState(false)

    // Mulai dengan string kosong; isi setelah mounted
    const [timeNow, setTimeNow] = React.useState('')
    const [dateNow, setDateNow] = React.useState('')

    const fmtTime = React.useCallback((d: Date) =>
            new Intl.DateTimeFormat('id-ID', {
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
                ...(timeZone ? { timeZone } : {}),
            }).format(d)
        , [timeZone])

    const fmtDate = React.useCallback((d: Date) => {
        const hari = new Intl.DateTimeFormat('id-ID', { weekday: 'long', ...(timeZone ? { timeZone } : {}) }).format(d)
        const tanggal = new Intl.DateTimeFormat('id-ID', {
            day: '2-digit',
            month: 'long',
            year: 'numeric',
            ...(timeZone ? { timeZone } : {}),
        }).format(d)
        return `${hari} - ${tanggal}`
    }, [timeZone])

    React.useEffect(() => {
        setMounted(true)

        // IPC time_sync (opsional). Kalau ada, override jamnya.
        const onTime = (args: any) => {
            if (args?.humanize) setTimeNow(args.humanize) // ex: "HH:mm:ss:SS"
            // tetap sinkronkan tanggal
            const now = new Date()
            setDateNow(fmtDate(now))
        }
        window.ipc?.on?.('time_sync', onTime)

        return () => {
           /* window.ipc?.off?.('time_sync', onTime)*/
        }
    }, [fmtTime, fmtDate])

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
                {mounted ? (timeNow || '--:--:--') : '' /* kosong saat SSR */}
            </Typography>

            <Typography
                variant="caption"
                suppressHydrationWarning
                sx={{ display: 'block', color: 'text.secondary', mt: 0.25 }}
            >
                {mounted ? (dateNow || '') : ''}
            </Typography>
        </Box>
    )
}
