'use client'

import * as React from 'react'
import { Box, Typography } from '@mui/material'
import { useEffect } from 'react'
import {
    useTransactionEventTrigger,
} from '../../layouts/(main)/(component)/(transaction)/ui/(pane)/context/TransactionEventTriggerContext'
import { useGodModeProvider } from '../../context/GodModeProviderContext'
import * as moment from 'moment-timezone'
import { useSession } from "../../../../contexts/SessionProviderContext";
import { useUserConfig } from "../../../../contexts/UserConfigContext";

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
    const { config } = useUserConfig()
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

        // Jika isOverviewGodModeEnabled = true, selalu kirim god_mode: true
        // Jika false, gunakan nilai dari toggle (godMode state)
        const effectiveGodMode = config.cashier.isOverviewGodModeEnabled ? true : godMode

        window?.api
            ?.invoke?.('api.transaction.bills:count.all', {
            startAt,
            endAt,
            reference: Session?.id,
            god_mode: effectiveGodMode,
        })
            .then(async (result) => {
                console.log('Header Income Diperbarui', result)
                setPayloadCount(result)
            })
            .catch((error) => {
                console.log('Header Income Gagal Diperbarui', error)
                setPayloadCount(undefined)
            })
    }, [godMode, Session, config.cashier.isOverviewGodModeEnabled])

    useEffect(() => {
        setMounted(true)
        return () => setMounted(false)
    }, [])

    useEffect(() => {
        if (mounted) void fetchTotal()
    }, [token, reason, mounted, godMode, fetchTotal, config.cashier.isOverviewGodModeEnabled])

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
