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
import { useFunctionKeyCtx } from '../../../../../contexts/FunctionKeyProviderContext';

// Perfect Scrollbar
import PerfectScrollbar from 'react-perfect-scrollbar';
import 'react-perfect-scrollbar/dist/css/styles.css';
import {useGodModeProvider} from "../../../context/GodModeProviderContext";

const MotionCard = motion(Card);
const rupiah = (n: number) =>
    new Intl.NumberFormat('id-ID', { maximumFractionDigits: 0 }).format(n);

type Item = {
    label: string;
    value: number;
    icon: React.ReactNode;
    isCurrency?: boolean;
};
type ChartPoint = { d: string; rev: number };

const makeRng = (seed: number) => {
    let s = seed || 1;
    return () => {
        s = (s * 9301 + 49297) % 233280;
        return s / 233280;
    };
};

const distribute = (n: number, total: number, rnd: () => number) => {
    const weights = Array.from({ length: n }, () => Math.max(0.0001, rnd()));
    const sum = weights.reduce((a, b) => a + b, 0);
    const scale = total <= 0 ? 0 : total / sum;
    return weights.map((w) => Math.max(0, Math.round(w * scale)));
};

type Mode = 'sample80' | 'sample50';

export default function Overview() {
    const theme = useTheme();
    const isDark = theme.palette.mode === 'dark';

    // Hanya 2 mode: sample80 <-> sample50
    const [mode, setMode] = React.useState<Mode>('sample80');
    const { godMode, setGodMode } = useGodModeProvider();

    useEffect(() => {
        setMode(() => (godMode ? 'sample50' : 'sample80'));
    }, [godMode]);

    // ====== DEFINISI 2 SAMPLE TETAP ======
    // sample80: lastMonth=72jt (naik 11.11%), margin 38%
    // sample50: lastMonth=55jt (turun 9.09%), margin 32%
    const SAMPLE = React.useMemo(() => {
        if (mode === 'sample50') {
            const month = 50_000_000;
            const lastMonth = 55_000_000;
            const week = 12_500_000; // ~25% dari bulan
            const today = 2_000_000;
            const orders = 220;
            const done = 160;
            const active = 45;
            const margin = 0.32;
            return { month, week, today, orders, done, active, lastMonth, margin, seed: 5050 };
        }
        // sample80
        const month = 80_000_000;
        const lastMonth = 72_000_000;
        const week = 18_000_000; // ~22.5% dari bulan
        const today = 2_400_000;
        const orders = 320;
        const done = 260;
        const active = 50;
        const margin = 0.38;
        return { month, week, today, orders, done, active, lastMonth, margin, seed: 8080 };
    }, [mode]);

    // ====== STAT CARDS ATAS ======
    const itemsTop: Item[] = [
        { label: 'Total Orders', value: SAMPLE.orders, icon: <ReceiptLongRounded /> },
        { label: 'Pendapatan Hari Ini', value: SAMPLE.today, icon: <TodayRounded />, isCurrency: true },
        { label: 'Pendapatan Minggu Ini', value: SAMPLE.week, icon: <CalendarViewWeekRounded />, isCurrency: true },
        { label: 'Pendapatan Bulan Ini', value: SAMPLE.month, icon: <CalendarMonthRounded />, isCurrency: true },
        { label: 'Pesanan Selesai', value: SAMPLE.done, icon: <TaskAltRounded /> },
        { label: 'Pesanan Aktif', value: SAMPLE.active, icon: <BoltRounded /> },
    ];

    const getVal = (label: string) => itemsTop.find((x) => x.label === label)?.value ?? 0;

    // ====== GRAFIK (sinkron dgn cards) ======
    const chartData: ChartPoint[] = React.useMemo(() => {
        const revToday = getVal('Pendapatan Hari Ini');
        const revWeek = Math.max(0, getVal('Pendapatan Minggu Ini'));
        const revMonth = Math.max(0, getVal('Pendapatan Bulan Ini'));

        const rng = makeRng(SAMPLE.seed);

        // 7 hari terakhir → 6 hari + hari ke-7 = today, sum = week
        const last6Total = Math.max(0, revWeek - revToday);
        const last6 = distribute(6, last6Total, rng);
        const last7 = [...last6, revToday];

        // Target 14 hari proporsional dari bulan (14/30)
        const target14 = Math.max(0, Math.round((revMonth * 14) / 30));
        const sumLast7 = last7.reduce((a, b) => a + b, 0);
        const first7Total = Math.max(0, target14 - sumLast7);
        const first7 = distribute(7, first7Total, rng);

        const all14 = [...first7, ...last7];
        return all14.map((v, i) => ({ d: String(i + 1).padStart(2, '0'), rev: v }));
    }, [mode, SAMPLE, itemsTop]);

    // ====== METRICS BAWAH GRAFIK ======
    const monthNow = SAMPLE.month;
    const monthBefore = SAMPLE.lastMonth;
    const growth = monthBefore > 0 ? (monthNow - monthBefore) / monthBefore : 0;
    const margin = SAMPLE.margin;
    const costRatio = 1 - margin;
    const profitValue = Math.round(monthNow * margin);
    const costValue = Math.round(monthNow * costRatio);
    const vatRate = 0.11;
    const vatValue = Math.round(monthNow * vatRate);

    const itemsBottom: Item[] = [
        {
            label: `Rasio Untung:Rugi (${Math.round(margin * 100)}% : ${Math.round(costRatio * 100)}%)`,
            value: profitValue, // tampilkan nominal laba
            icon: <PercentRounded />,
            isCurrency: true,
        },
        {
            label: `Kenaikan Penghasilan ${growth >= 0 ? 'MoM' : 'MoM (turun)'}`,
            value: Math.round(Math.abs(growth) * 100), // tampil % (angka), ditambah '%' di UI
            icon: <TrendingUpRounded />,
            isCurrency: false,
        },
        {
            label: `PPN 11% atas Pendapatan Bulan Ini`,
            value: vatValue,
            icon: <RequestQuoteRounded />,
            isCurrency: true,
        },
    ];

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
                                                        {rupiah(it.value as number)}
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

                        {/* ====== GRAFIK ====== */}
                        <Grid2 size={{ xs: 12 }}>
                            <Card
                                elevation={0}
                                sx={{
                                    borderRadius: 3,
                                    border: `1px solid ${isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.08)'}`,
                                    background: isDark
                                        ? 'linear-gradient(180deg, rgba(255,255,255,0.04), rgba(255,255,255,0.02))'
                                        : '#fff',
                                    position: 'relative',
                                    overflow: 'hidden',
                                }}
                            >
                                {/* Strip atas */}
                                <Box
                                    sx={{
                                        height: 6,
                                        background: 'linear-gradient(90deg, #EF4444, #F59E0B 40%, #F97316)',
                                    }}
                                />

                                <CardContent sx={{ p: 2.5 }}>
                                    <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 1 }}>
                                        Tren Pendapatan 14 Hari
                                    </Typography>
                                    <Box sx={{ width: '100%', height: 260 }}>
                                        <ResponsiveContainer>
                                            <AreaChart data={chartData} margin={{ left: 6, right: 12, top: 8, bottom: 0 }}>
                                                <defs>
                                                    <linearGradient id="rev" x1="0" y1="0" x2="0" y2="1">
                                                        <stop offset="0%" stopColor="#8B5CF6" stopOpacity={0.7} />
                                                        <stop offset="100%" stopColor="#8B5CF6" stopOpacity={0} />
                                                    </linearGradient>
                                                </defs>
                                                <CartesianGrid strokeDasharray="3 3" opacity={isDark ? 0.08 : 0.2} />
                                                <XAxis dataKey="d" tickLine={false} axisLine={false} />
                                                <YAxis
                                                    tickFormatter={(v) => (v >= 1_000_000 ? `${v / 1_000_000}jt` : v.toString())}
                                                    width={50}
                                                    tickLine={false}
                                                    axisLine={false}
                                                />
                                                <Tooltip
                                                    formatter={(v: number) => [`Rp ${rupiah(v)}`, 'Pendapatan']}
                                                    labelFormatter={(l) => `Tanggal ${l}`}
                                                />
                                                <Area
                                                    type="monotone"
                                                    dataKey="rev"
                                                    stroke="#8B5CF6"
                                                    strokeWidth={2}
                                                    fill="url(#rev)"
                                                    dot={{ r: 2 }}
                                                    activeDot={{ r: 4 }}
                                                />
                                            </AreaChart>
                                        </ResponsiveContainer>
                                    </Box>
                                </CardContent>
                            </Card>
                        </Grid2>

                        {/* ====== METRICS BAWAH GRAFIK ====== */}
                        {itemsBottom.map((it, i) => (
                            <Grid2 key={`bottom-${i}`} size={{ xs: 12, sm: 6, md: 4 }}>
                                <Card
                                    elevation={0}
                                    sx={{
                                        position: 'relative',
                                        overflow: 'hidden',
                                        height: '100%',
                                        borderRadius: 3,
                                        border: `1px solid ${isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.08)'}`,
                                        background: isDark
                                            ? 'linear-gradient(180deg, rgba(255,255,255,0.04), rgba(255,255,255,0.02))'
                                            : 'linear-gradient(180deg, #fff, #fafafa)',
                                    }}
                                >
                                    <Box
                                        sx={{
                                            height: 6,
                                            background:
                                                i === 0
                                                    ? 'linear-gradient(90deg, #10B981, #34D399)'
                                                    : i === 1
                                                        ? growth >= 0
                                                            ? 'linear-gradient(90deg, #22C55E, #86EFAC)'
                                                            : 'linear-gradient(90deg, #EF4444, #FCA5A5)'
                                                        : 'linear-gradient(90deg, #F59E0B, #FBBF24)',
                                        }}
                                    />
                                    <CardContent sx={{ p: 2.5 }}>
                                        <Stack spacing={1} alignItems="center" textAlign="center">
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

                                            {it.isCurrency ? (
                                                <Stack spacing={0} alignItems="center" lineHeight={1}>
                                                    <Typography variant="caption" sx={{ opacity: 0.8, mb: 0.25 }}>
                                                        Rp
                                                    </Typography>
                                                    <Typography variant="h5" fontWeight={800} sx={{ letterSpacing: 0.2 }}>
                                                        {rupiah(it.value as number)}
                                                    </Typography>
                                                </Stack>
                                            ) : (
                                                <Typography variant="h5" fontWeight={800} sx={{ letterSpacing: 0.2 }}>
                                                    {it.value}%{/* tampil persen */}
                                                </Typography>
                                            )}

                                            <Typography variant="body2" color="text.secondary">
                                                {it.label}
                                            </Typography>

                                            {/* Info kecil tambahan untuk Rasio Untung:Rugi */}
                                            {i === 0 && (
                                                <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5 }}>
                                                    Laba: Rp {rupiah(profitValue)} • Biaya: Rp {rupiah(costValue)}
                                                </Typography>
                                            )}
                                        </Stack>
                                    </CardContent>
                                </Card>
                            </Grid2>
                        ))}
                    </Grid2>
                </Box>
            </PerfectScrollbar>
        </Box>
    );
}
