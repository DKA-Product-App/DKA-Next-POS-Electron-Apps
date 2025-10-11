'use client'

import * as React from 'react'
import { Box, Typography } from '@mui/material'
import {useEffect} from "react";
import {
    useTransactionEventTrigger
} from "../../layouts/(main)/(component)/(transaction)/ui/(pane)/context/TransactionEventTriggerContext";
import {useGodModeProvider} from "../../context/GodModeProviderContext";

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
    const { token, reason } = useTransactionEventTrigger()
    const { godMode } = useGodModeProvider();
    const [ payloadCount, setPayloadCount ] = React.useState<{ status?: boolean, code?: number, msg?: string; data?: {
            summary: {
                bruto: {
                    total: number;
                    tax: number;
                };
                netto: {
                    total: number;
                };
            };
        }}>(undefined);


    const fetchTotal = React.useCallback(() => {
        window?.api?.invoke?.("api.transaction.bills:count.all", {
            god_mode : godMode
        })
            .then(async (result) => {
                console.log(`Header Income Diperbarui`, result);
                setPayloadCount(result);
            })
            .catch((error) => {
                console.log(`Header Income Gagal Diperbarui`, error);
                setPayloadCount(undefined)
            })
    },[ godMode ])

    useEffect(() => {
        setMounted(true);
        return () => {
            setMounted(false);
        }
    }, []);

    useEffect(() => {
        if (mounted){
            // keep list up-to-date when token/reason change
            void fetchTotal();
        }
    }, [token, reason, mounted, godMode])

    return (
        <>
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
        </>
    )
}
