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
import EventSeatRounded from '@mui/icons-material/EventSeatRounded';

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

const MotionCard = motion(Card);
const rupiah = (n: number) =>
    new Intl.NumberFormat('id-ID', { maximumFractionDigits: 0 }).format(n);

export default function InformationContent() {
    const theme = useTheme();
    const isDark = theme.palette.mode === 'dark';

    // ====== DATA DUMMY ======
    const items = [
        { label: 'Total Orders', value: 0, icon: <ReceiptLongRounded /> },
        { label: 'Pendapatan Hari Ini', value: 0, icon: <TodayRounded />, isCurrency: true },
        { label: 'Pendapatan Minggu Ini', value: 0, icon: <CalendarViewWeekRounded />, isCurrency: true },
        { label: 'Pendapatan Bulan Ini', value: 0, icon: <CalendarMonthRounded />, isCurrency: true },
        { label: 'Pesanan Selesai', value: 0, icon: <TaskAltRounded /> },
        { label: 'Pesanan Aktif', value: 0, icon: <BoltRounded /> },
    ];

    // grafik dummy: 14 hari revenue
    const chartData = [
        { d: '01', rev: 1200000 }, { d: '02', rev: 1800000 }, { d: '03', rev: 900000 },
        { d: '04', rev: 2500000 }, { d: '05', rev: 2100000 }, { d: '06', rev: 3200000 },
        { d: '07', rev: 2800000 }, { d: '08', rev: 1500000 }, { d: '09', rev: 3400000 },
        { d: '10', rev: 3000000 }, { d: '11', rev: 2600000 }, { d: '12', rev: 3800000 },
        { d: '13', rev: 2200000 }, { d: '14', rev: 4100000 },
    ];

    return (
        <>
            <Grid2 container spacing={2}>
                {items.map((it, i) => (
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
                                            width: 44, height: 44, borderRadius: '14px', display: 'grid', placeItems: 'center',
                                            background: 'linear-gradient(135deg, rgba(99,102,241,0.12), rgba(236,72,153,0.12))',
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
                                        <Typography variant="h5" fontWeight={800} sx={{ letterSpacing: 0.2, lineHeight: 1.1 }}>
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

                {/* ====== GRAFIK DUMMY (full width) ====== */}
                <Grid2 size={{ xs: 12 }}>
                    <Card
                        elevation={0}
                        sx={{
                            borderRadius: 3,
                            border: `1px solid ${isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.08)'}`,
                            background: isDark
                                ? 'linear-gradient(180deg, rgba(255,255,255,0.04), rgba(255,255,255,0.02))'
                                : '#fff',
                        }}
                    >
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

                {items.map((it, i) => (
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
                                            width: 44, height: 44, borderRadius: '14px', display: 'grid', placeItems: 'center',
                                            background: 'linear-gradient(135deg, rgba(99,102,241,0.12), rgba(236,72,153,0.12))',
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
                                        <Typography variant="h5" fontWeight={800} sx={{ letterSpacing: 0.2, lineHeight: 1.1 }}>
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
        </>
    );
}
