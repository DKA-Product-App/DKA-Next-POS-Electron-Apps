'use client'

import * as React from 'react'
import { Box, Typography } from '@mui/material'
import { useEffect } from 'react'
import {
    useTransactionEventTrigger,
} from '../../layouts/(main)/(component)/(transaction)/ui/(pane)/context/TransactionEventTriggerContext'
import { useGodModeProvider } from '../../context/GodModeProviderContext'
import * as moment from 'moment-timezone'
import {useSession} from "../../../../contexts/SessionProviderContext"; // ⬅️ tambah ini

type TimeWidgetProps = {
    /** Font size jam utama */
    timeVariant?: 'h4' | 'h5' | 'h6' | 'subtitle1'
    /** Align di container grid Header */
    justifySelf?: 'start' | 'center' | 'end'
}

export default function IncomeWidget({ timeVariant = 'h5', justifySelf = 'center' }: TimeWidgetProps) {
    const [mounted, setMounted] = React.useState(false)
    const { token, reason } = useTransactionEventTrigger()
    const { Session } = useSession();
    const { godMode } = useGodModeProvider()
    const [payloadCount, setPayloadCount] = React.useState<{
        status?: boolean
        code?: number
        msg?: string
        data?: {
            summary: {
                bruto: { total: number; tax: number }
                netto: { total: number }
            }
        }
    } | undefined>(undefined)

    const fetchTotal = React.useCallback(() => {
        // default range: hari ini 00:00 s/d 23:59 (Asia/Jakarta)
        const tz = 'Asia/Jakarta'
        const startAt = moment.tz(tz).startOf('day').format('YYYY-MM-DD HH:mm:ss')
        const endAt   = moment.tz(tz).endOf('day').format('YYYY-MM-DD HH:mm:ss')

        window?.api
            ?.invoke?.('api.transaction.bills:count.all', {
            startAt,
            endAt,
            reference: Session?.id,
            god_mode: godMode,
        })
            .then(async (result) => {
                console.log('Header Income Diperbarui', result)
                setPayloadCount(result)
            })
            .catch((error) => {
                console.log('Header Income Gagal Diperbarui', error)
                setPayloadCount(undefined)
            })
    }, [godMode, Session])

    useEffect(() => {
        setMounted(true)
        return () => setMounted(false)
    }, [])

    useEffect(() => {
        if (mounted) void fetchTotal()
    }, [token, reason, mounted, godMode, fetchTotal])

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
                suppressHydrationWarning
                sx={{ fontWeight: 600, letterSpacing: 1, fontVariantNumeric: 'tabular-nums' }}
            >
                Rp. {payloadCount?.data?.summary?.bruto?.total}
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
