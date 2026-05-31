'use client';

import * as React from 'react';
import Grid2 from '@mui/material/Grid';
import {
    Card,
    CardContent,
    Typography,
    Stack,
    Box,
    useTheme,
} from '@mui/material';
import { motion } from 'framer-motion';

// Icons
import ReceiptLongRounded from '@mui/icons-material/ReceiptLongRounded';
import TodayRounded from '@mui/icons-material/TodayRounded';
import CalendarViewWeekRounded from '@mui/icons-material/CalendarViewWeekRounded';
import CalendarMonthRounded from '@mui/icons-material/CalendarMonthRounded';
import TaskAltRounded from '@mui/icons-material/TaskAltRounded';
import BoltRounded from '@mui/icons-material/BoltRounded';
import TrendingUpRounded from '@mui/icons-material/TrendingUpRounded';
import PercentRounded from '@mui/icons-material/PercentRounded';
import RequestQuoteRounded from '@mui/icons-material/RequestQuoteRounded';

// Recharts
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    Tooltip,
    ResponsiveContainer,
    CartesianGrid,
} from 'recharts';
import { useEffect } from 'react';

// Perfect Scrollbar
import PerfectScrollbar from 'react-perfect-scrollbar';
import 'react-perfect-scrollbar/dist/css/styles.css';
import {useSession} from "../../../../contexts/SessionProviderContext";
import { useEffectiveGodMode } from "../../../../hooks/useEffectiveGodMode";
import * as moment from 'moment';

const MotionCard = motion(Card);

type Item = {
    label: string;
    value: number | string;
    icon: React.ReactNode;
    isCurrency?: boolean;
};




export default function Overview() {
    const theme = useTheme();
    const isDark = theme.palette.mode === 'dark';
    const { Session } = useSession();
    const effectiveGodMode = useEffectiveGodMode();

    const fmtIncome = (n?: number) =>
        new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(
            Number.isFinite(Number(n)) ? Number(n) : 0,
        );

    const [mounted, setMounted] = React.useState(false)
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
            counts: {
                bill: number;
                items: number;
            };
        }}>(undefined);


    const fetchTotal = React.useCallback(() => {

        // default range: hari ini 00:00 s/d 23:59 (Asia/Jakarta)
        const tz = 'Asia/Jakarta'
        const startAt = moment.tz(tz).startOf('day').format('YYYY-MM-DD HH:mm:ss')
        const endAt   = moment.tz(tz).endOf('day').format('YYYY-MM-DD HH:mm:ss')

        window?.api?.invoke?.<{ god_mode?: string | boolean; startAt?: string; endAt?: string; reference?: string }, typeof payloadCount>("api.transaction.bills:count.all", {
            startAt,
            endAt,
            reference: Session?.id,
            god_mode: effectiveGodMode,
        })
            .then(async (result) => {
                setPayloadCount(result);
            })
            .catch((error) => {
                setPayloadCount(undefined)
            })
    }, [effectiveGodMode, Session])

    useEffect(() => {
        setMounted(true);
        return () => {
            setMounted(false);
        }
    }, []);


    useEffect(() => {
        if (mounted){
            fetchTotal()
        }
    }, [mounted, effectiveGodMode, fetchTotal]);


    // ====== STAT CARDS ATAS ======
    const itemsTop: Item[] = React.useMemo(() => [
        { label: 'Pendapatan Shift Saat Ini', value: fmtIncome(payloadCount?.data?.summary?.bruto?.total), icon: <TodayRounded />, isCurrency: true },
        { label: 'Total Bill Saat Ini', value: `${payloadCount?.data?.counts?.bill}`, icon: <CalendarViewWeekRounded />, isCurrency: true },
        { label: 'Total Item', value: `${payloadCount?.data?.counts?.items}`, icon: <CalendarMonthRounded />, isCurrency: true },
    ], [payloadCount]);

    useEffect(() => {
        console.log(payloadCount);
    }, [payloadCount]);

    return (
        <Box sx={{ height: '100%', minHeight: 0, overflow: 'hidden' }}>
            <PerfectScrollbar
                options={{ suppressScrollX: true, wheelPropagation: false }}
                style={{ height: '100%' }}
            >
                <Box sx={{ p: 2 }}>
                    <Grid2 container spacing={2}>
                        {/* ====== STAT CARDS ATAS ====== */}
                        {itemsTop.map((it, i) => (
                            <Grid2 key={i} size={{ xs: 12, sm: 6, md: 4, lg: 3, xl: 2 }}>
                                <MotionCard
                                    whileHover={{ y: -4, boxShadow: '0 16px 40px rgba(0,0,0,0.18)' }}
                                    transition={{ type: 'spring', stiffness: 320, damping: 26 }}
                                    elevation={0}
                                    sx={{
                                        position: 'relative',
                                        overflow: 'hidden',
                                        height: '100%',
                                        borderRadius: 3,
                                        backdropFilter: 'blur(6px)',
                                        border: `1px solid ${isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.08)'}`,
                                        background: isDark
                                            ? 'linear-gradient(180deg, rgba(255,255,255,0.04), rgba(255,255,255,0.02))'
                                            : 'linear-gradient(180deg, #fff, #fafafa)',
                                        boxShadow: isDark
                                            ? '0 6px 20px rgba(0,0,0,0.35)'
                                            : '0 6px 20px rgba(0,0,0,0.08)',
                                        '&::before': {
                                            content: '""',
                                            position: 'absolute',
                                            inset: 0,
                                            background:
                                                'radial-gradient(1200px 200px at -20% -40%, rgba(99,102,241,0.25), transparent 50%), radial-gradient(1000px 160px at 120% -30%, rgba(236,72,153,0.20), transparent 50%)',
                                            pointerEvents: 'none',
                                        },
                                    }}
                                >
                                    {/* Accent bar */}
                                    <Box
                                        sx={{
                                            height: 6,
                                            background: 'linear-gradient(90deg, #6366F1, #8B5CF6 30%, #EC4899)',
                                        }}
                                    />

                                    <CardContent sx={{ p: 2.5 }}>
                                        <Stack spacing={1.25} alignItems="center" textAlign="center">
                                            <Box
                                                sx={{
                                                    width: 44,
                                                    height: 44,
                                                    borderRadius: '14px',
                                                    display: 'grid',
                                                    placeItems: 'center',
                                                    background:
                                                        'linear-gradient(135deg, rgba(99,102,241,0.12), rgba(236,72,153,0.12))',
                                                    border: `1px solid ${isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.06)'}`,
                                                }}
                                            >
                                                {it.icon}
                                            </Box>

                                            {/* VALUE */}
                                            {it.isCurrency ? (
                                                <Stack spacing={0} alignItems="center" lineHeight={1}>
                                                    <Typography variant="caption" sx={{ opacity: 0.8, mb: 0.25 }}>
                                                        Rp
                                                    </Typography>
                                                    <Typography variant="h5" fontWeight={800} sx={{ letterSpacing: 0.2 }}>
                                                        {it.value}
                                                    </Typography>
                                                </Stack>
                                            ) : (
                                                <Typography
                                                    variant="h5"
                                                    fontWeight={800}
                                                    sx={{ letterSpacing: 0.2, lineHeight: 1.1 }}
                                                >
                                                    {it.value as React.ReactNode}
                                                </Typography>
                                            )}

                                            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25 }}>
                                                {it.label}
                                            </Typography>
                                        </Stack>
                                    </CardContent>
                                </MotionCard>
                            </Grid2>
                        ))}
                    </Grid2>
                </Box>
            </PerfectScrollbar>
        </Box>
    );
}
