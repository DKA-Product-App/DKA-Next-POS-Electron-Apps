'use client'

import * as React from 'react'
import { Box, Typography } from '@mui/material'

type TimeWidgetProps = {
    /** Font size jam utama */
    timeVariant?: 'h4' | 'h5' | 'h6' | 'subtitle1'
    /** Align di container grid Header */
    justifySelf?: 'start' | 'center' | 'end'
}

export default function TimeWidget({
                                       timeVariant = 'h5',
                                       justifySelf = 'center',
                                   }: TimeWidgetProps) {
    const [timeNow, setTimeNow] = React.useState(() =>
        new Intl.DateTimeFormat('id-ID', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
        }).format(new Date()),
    )

    const [dateNow, setDateNow] = React.useState(() => {
        const now = new Date()
        const hari = new Intl.DateTimeFormat('id-ID', { weekday: 'long' }).format(now)
        const tanggal = new Intl.DateTimeFormat('id-ID', {
            day: '2-digit',
            month: 'long',
            year: 'numeric',
        }).format(now)
        return `${hari} - (${tanggal})`
    })

    // Dengarkan IPC time_sync jika tersedia (format humanize dikirim dari main)
    React.useEffect(() => {
        if (typeof window === 'undefined') return

        const tick = () => {
            const now = new Date()
            setTimeNow(
                new Intl.DateTimeFormat('id-ID', {
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit',
                }).format(now),
            )
            const hari = new Intl.DateTimeFormat('id-ID', { weekday: 'long' }).format(now)
            const tanggal = new Intl.DateTimeFormat('id-ID', {
                day: '2-digit',
                month: 'long',
                year: 'numeric',
            }).format(now)
            setDateNow(`${hari} - ${tanggal}`)
        }

        // Fallback interval (1s)
        const id = setInterval(tick, 1000)

        // IPC overrides time if available
        const onTime = (args: any) => {
            // args.humanize di server kamu: "HH:mm:ss:SS" → tetep kita tampilkan apa adanya
            if (args?.humanize) setTimeNow(args.humanize)
            // tetap update date tiap event supaya sinkron
            const now = new Date()
            const hari = new Intl.DateTimeFormat('id-ID', { weekday: 'long' }).format(now)
            const tanggal = new Intl.DateTimeFormat('id-ID', {
                day: '2-digit',
                month: 'long',
                year: 'numeric',
            }).format(now)
            setDateNow(`${hari} - ${tanggal}`)
        }

        window.ipc?.on?.('time_sync', onTime)

        return () => {
            clearInterval(id)
            /*window.ipc?.off?.('time_sync', onTime)*/
        }
    }, [])

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
                sx={{
                    fontSize : 18,
                    fontWeight: 600,
                    letterSpacing: 1,
                    fontVariantNumeric: 'tabular-nums',
                }}
            >
                {timeNow}
            </Typography>

            <Typography
                variant="caption"
                sx={{ display: 'block', color: 'text.secondary', mt: 0.25 }}
            >
                {dateNow}
            </Typography>
        </Box>
    )
}
