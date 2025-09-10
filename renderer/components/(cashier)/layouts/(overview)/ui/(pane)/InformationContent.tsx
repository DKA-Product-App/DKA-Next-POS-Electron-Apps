'use client';

import * as React from 'react';
import Grid2 from '@mui/material/Grid';
import {
    Box,
    Card,
    CardContent,
    Stack,
    Typography,
    Button,
    Chip,
    Divider,
    useTheme,
} from '@mui/material';
import { motion } from 'framer-motion';
import PerfectScrollbar from 'react-perfect-scrollbar';
import 'react-perfect-scrollbar/dist/css/styles.css';

// Icons
import ReceiptLongRounded from '@mui/icons-material/ReceiptLongRounded';
import PointOfSaleRounded from '@mui/icons-material/PointOfSaleRounded';
import PaymentsRounded from '@mui/icons-material/PaymentsRounded';
import AccessTimeRounded from '@mui/icons-material/AccessTimeRounded';
import TrendingUpRounded from '@mui/icons-material/TrendingUpRounded';
import AssignmentReturnRounded from '@mui/icons-material/AssignmentReturnRounded';
import DiscountRounded from '@mui/icons-material/DiscountRounded';
import Inventory2Rounded from '@mui/icons-material/Inventory2Rounded';
import LeaderboardRounded from '@mui/icons-material/LeaderboardRounded';
import WifiRounded from '@mui/icons-material/WifiRounded';
import PrintRounded from '@mui/icons-material/PrintRounded';
import MapRounded from '@mui/icons-material/MapRounded';
import PersonRounded from '@mui/icons-material/PersonRounded';
import TableRestaurantRounded from '@mui/icons-material/TableRestaurantRounded';

// Recharts
import {
    ResponsiveContainer,
    AreaChart,
    Area,
    XAxis,
    YAxis,
    Tooltip,
    CartesianGrid,
    BarChart,
    Bar,
    PieChart,
    Pie,
    Cell,
} from 'recharts';
import { DataGrid, GridColDef } from '@mui/x-data-grid';

// ===== Utils
const MotionCard = motion(Card);
const rupiah = (n: number) => new Intl.NumberFormat('id-ID', { maximumFractionDigits: 0 }).format(n);
const pct = (n: number) => `${Math.round(n * 100)}%`;

// seeded RNG biar konsisten
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

type TopRow = {
    id: string;
    sku: string;
    name: string;
    qty: number;
    gross: number;
    discount: number; // nominal
};

// ========= Component
export default function CashierOverview() {
    const theme = useTheme();
    const isDark = theme.palette.mode === 'dark';

    // ======= SAMPLE SNAPSHOT (anggap dari backend)
    // Mode “kasir” fokus: hari ini + jam sibuk + metode bayar + top produk
    const SNAPSHOT = React.useMemo(() => {
        // Mode “ramai normal”
        const rng = makeRng(9173);
        const todayGross = 3_450_000;     // omzet hari ini
        const todayOrders = 186;          // transaksi
        const todayItems = 420;           // item keluar
        const refunds = 3;                // transaksi refund
        const discRate = 0.06;            // diskon total ~6% dari gross
        const avgHandleMin = 3.8;         // menit per transaksi
        const avgQueueMin = 1.2;          // menit antre
        const dineInShare = 0.62;         // dine-in 62%
        const takeAwayShare = 0.38;       // take-away 38%
        const terminalsOnline = 3;        // 3 kasir aktif
        const printersOK = 3;             // printer ready
        const lastSync = '15:02';

        // Breakdown payment (harian)
        const payCash = Math.round(todayGross * 0.31);
        const payQRIS = Math.round(todayGross * 0.44);
        const payCard = Math.round(todayGross * 0.25);
        const pay = [
            { name: 'Cash', value: payCash },
            { name: 'QRIS', value: payQRIS },
            { name: 'Card', value: payCard },
        ];

        // 14 jam operasional terakhir (misal 08–21)
        const hours = Array.from({ length: 14 }, (_, i) => 8 + i);
        const byHourOrders = distribute(hours.length, todayOrders, rng).map((v, i) => ({
            hour: `${String(hours[i]).padStart(2, '0')}:00`,
            tx: v,
        }));
        const byHourGross = distribute(hours.length, todayGross, rng).map((v, i) => ({
            hour: `${String(hours[i]).padStart(2, '0')}:00`,
            rev: v,
        }));

        // 14 hari revenue (untuk konteks trend kasir)
        const monthToDate = 28_000_000;
        const last14Target = Math.round((monthToDate * 14) / 30);
        const last7 = distribute(7, Math.round(todayGross * 7), rng);
        const first7 = distribute(7, Math.max(0, last14Target - last7.reduce((a, b) => a + b, 0)), rng);
        const rev14 = [...first7, ...last7].map((v, i) => ({
            d: String(i + 1).padStart(2, '0'),
            rev: v,
        }));

        // top produk (qty/gross)
        const base: TopRow[] = [
            { id: '1', sku: 'BRV-001', name: 'Americano', qty: 86, gross: 860_000, discount: 18_000 },
            { id: '2', sku: 'BRV-002', name: 'Cappuccino', qty: 74, gross: 1_036_000, discount: 22_000 },
            { id: '3', sku: 'DSR-011', name: 'Cheese Cake', qty: 38, gross: 532_000, discount: 15_000 },
            { id: '4', sku: 'FD-101', name: 'Beef Sandwich', qty: 24, gross: 720_000, discount: 12_000 },
            { id: '5', sku: 'BRV-019', name: 'Matcha Latte', qty: 33, gross: 462_000, discount: 9_000 },
        ];
        // adjust gross biar sum mendekati todayGross (dummy)
        const sumBase = base.reduce((a, b) => a + b.gross, 0);
        const scale = sumBase ? todayGross / sumBase : 1;
        const top = base.map((r) => ({ ...r, gross: Math.round(r.gross * scale) }));

        return {
            todayGross,
            todayOrders,
            todayItems,
            refunds,
            discRate,
            avgHandleMin,
            avgQueueMin,
            dineInShare,
            takeAwayShare,
            terminalsOnline,
            printersOK,
            lastSync,
            pay,
            byHourOrders,
            byHourGross,
            rev14,
            top,
        };
    }, []);

    // derived
    const avgOrderValue = SNAPSHOT.todayOrders ? Math.round(SNAPSHOT.todayGross / SNAPSHOT.todayOrders) : 0;
    const discValue = Math.round(SNAPSHOT.todayGross * SNAPSHOT.discRate);
    const netGross = Math.max(0, SNAPSHOT.todayGross - discValue);
    const dineTake = [
        { name: 'Dine-in', value: Math.round(SNAPSHOT.todayOrders * SNAPSHOT.dineInShare) },
        { name: 'Take-away', value: Math.round(SNAPSHOT.todayOrders * SNAPSHOT.takeAwayShare) },
    ];

    // colors (pakai palette agar konsisten tema)
    const colors = {
        primary: theme.palette.primary.main,
        secondary: theme.palette.secondary.main,
        accent: '#8B5CF6',
        success: theme.palette.success.main,
        error: theme.palette.error.main,
        warn: theme.palette.warning.main,
        grid: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)',
    };

    // columns top products
    const colsTop: GridColDef<TopRow>[] = [
        { field: 'sku', headerName: 'SKU', flex: 0.7, minWidth: 100 },
        { field: 'name', headerName: 'Product', flex: 1.4, minWidth: 160 },
        { field: 'qty', headerName: 'Qty', type: 'number', flex: 0.5, minWidth: 80 },
        {
            field: 'gross',
            headerName: 'Gross',
            type: 'number',
            flex: 0.8,
            minWidth: 120,
            valueFormatter: ({ value }) => `Rp ${rupiah(value as number)}`,
        },
        {
            field: 'discount',
            headerName: 'Disc',
            type: 'number',
            flex: 0.6,
            minWidth: 100,
            valueFormatter: ({ value }) => `Rp ${rupiah(value as number)}`,
        },
    ];

    // ========= UI
    return (
        <Box sx={{ height: '100%', minHeight: 0, overflow: 'hidden' }}>
            <PerfectScrollbar options={{ suppressScrollX: true }} style={{ height: '100%' }}>
                <Box sx={{ p: 2 }}>
                    <Grid2 container spacing={2}>
                        {/* ===== KPI ===== */}
                        {[
                            {
                                label: 'Omzet Hari Ini',
                                value: `Rp ${rupiah(SNAPSHOT.todayGross)}`,
                                icon: <LeaderboardRounded />,
                                bar: 'linear-gradient(90deg, #6366F1, #8B5CF6 30%, #EC4899)',
                                sub: `Net: Rp ${rupiah(netGross)} • Disc: Rp ${rupiah(discValue)}`,
                            },
                            {
                                label: 'Transaksi',
                                value: SNAPSHOT.todayOrders,
                                icon: <ReceiptLongRounded />,
                                bar: 'linear-gradient(90deg, #22C55E, #86EFAC)',
                                sub: `Avg Order Value: Rp ${rupiah(avgOrderValue)}`,
                            },
                            {
                                label: 'Item Terjual',
                                value: SNAPSHOT.todayItems,
                                icon: <Inventory2Rounded />,
                                bar: 'linear-gradient(90deg, #06B6D4, #67E8F9)',
                                sub: `Refund: ${SNAPSHOT.refunds} trx`,
                            },
                            {
                                label: 'Kecepatan Layanan',
                                value: `${SNAPSHOT.avgHandleMin.toFixed(1)}m`,
                                icon: <AccessTimeRounded />,
                                bar: 'linear-gradient(90deg, #F59E0B, #FBBF24)',
                                sub: `Queue: ${SNAPSHOT.avgQueueMin.toFixed(1)}m`,
                            },
                        ].map((card, i) => (
                            <Grid2 key={i} size={{ xs: 12, sm: 6, md: 3 }}>
                                <MotionCard
                                    elevation={0}
                                    whileHover={{ y: -4 }}
                                    transition={{ type: 'spring', stiffness: 320, damping: 26 }}
                                    sx={{
                                        borderRadius: 3,
                                        overflow: 'hidden',
                                        border: `1px solid ${isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.08)'}`,
                                        background: isDark
                                            ? 'linear-gradient(180deg, rgba(255,255,255,0.04), rgba(255,255,255,0.02))'
                                            : 'linear-gradient(180deg, #fff, #fafafa)',
                                    }}
                                >
                                    <Box sx={{ height: 6, background: card.bar }} />
                                    <CardContent sx={{ p: 2.5 }}>
                                        <Stack spacing={1} alignItems="center" textAlign="center">
                                            <Box
                                                sx={{
                                                    width: 44,
                                                    height: 44,
                                                    borderRadius: 2,
                                                    display: 'grid',
                                                    placeItems: 'center',
                                                    border: `1px solid ${isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.06)'}`,
                                                    background: 'linear-gradient(135deg, rgba(99,102,241,0.10), rgba(236,72,153,0.10))',
                                                }}
                                            >
                                                {card.icon}
                                            </Box>
                                            <Typography variant="h5" fontWeight={800}>
                                                {card.value as any}
                                            </Typography>
                                            <Typography variant="body2" color="text.secondary">{card.sub}</Typography>
                                            <Typography variant="caption" color="text.secondary">Terakhir sinkron {SNAPSHOT.lastSync}</Typography>
                                        </Stack>
                                    </CardContent>
                                </MotionCard>
                            </Grid2>
                        ))}

                        {/* ===== Trend 14 Hari (Revenue) ===== */}
                        <Grid2 size={{ xs: 12, lg: 7 }}>
                            <Card
                                elevation={0}
                                sx={{
                                    borderRadius: 3,
                                    border: `1px solid ${colors.grid}`,
                                    overflow: 'hidden',
                                    background: isDark ? 'linear-gradient(180deg, rgba(255,255,255,0.04), rgba(255,255,255,0.02))' : '#fff',
                                }}
                            >
                                <Box sx={{ height: 6, background: 'linear-gradient(90deg, #8B5CF6, #EC4899)' }} />
                                <CardContent sx={{ p: 2.5 }}>
                                    <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
                                        <Typography variant="subtitle1" fontWeight={800}>Trend Omzet 14 Hari</Typography>
                                        <Chip size="small" variant="outlined" label="Kasir View" />
                                    </Stack>
                                    <Box sx={{ width: '100%', height: 260 }}>
                                        <ResponsiveContainer>
                                            <AreaChart data={SNAPSHOT.rev14} margin={{ left: 6, right: 12, top: 8, bottom: 0 }}>
                                                <defs>
                                                    <linearGradient id="revFill" x1="0" y1="0" x2="0" y2="1">
                                                        <stop offset="0%" stopColor={colors.accent} stopOpacity={0.7} />
                                                        <stop offset="100%" stopColor={colors.accent} stopOpacity={0} />
                                                    </linearGradient>
                                                </defs>
                                                <CartesianGrid strokeDasharray="3 3" opacity={isDark ? 0.08 : 0.2} />
                                                <XAxis dataKey="d" tickLine={false} axisLine={false} />
                                                <YAxis tickFormatter={(v) => (v >= 1_000_000 ? `${v / 1_000_000}jt` : v)} width={48} tickLine={false} axisLine={false} />
                                                <Tooltip formatter={(v: number) => [`Rp ${rupiah(v)}`, 'Omzet']} labelFormatter={(l) => `Hari ${l}`} />
                                                <Area type="monotone" dataKey="rev" stroke={colors.accent} strokeWidth={2} fill="url(#revFill)" dot={{ r: 2 }} activeDot={{ r: 4 }} />
                                            </AreaChart>
                                        </ResponsiveContainer>
                                    </Box>
                                </CardContent>
                            </Card>
                        </Grid2>

                        {/* ===== Jam Sibuk (Tx & Revenue) ===== */}
                        <Grid2 size={{ xs: 12, lg: 5 }}>
                            <Card
                                elevation={0}
                                sx={{
                                    borderRadius: 3,
                                    border: `1px solid ${colors.grid}`,
                                    overflow: 'hidden',
                                    background: isDark ? 'linear-gradient(180deg, rgba(255,255,255,0.04), rgba(255,255,255,0.02))' : '#fff',
                                }}
                            >
                                <Box sx={{ height: 6, background: 'linear-gradient(90deg, #22C55E, #86EFAC)' }} />
                                <CardContent sx={{ p: 2.5 }}>
                                    <Typography variant="subtitle1" fontWeight={800} sx={{ mb: 1 }}>Jam Sibuk (Transaksi)</Typography>
                                    <Box sx={{ width: '100%', height: 220 }}>
                                        <ResponsiveContainer>
                                            <BarChart data={SNAPSHOT.byHourOrders} margin={{ left: 6, right: 12, top: 8, bottom: 0 }}>
                                                <CartesianGrid strokeDasharray="3 3" opacity={isDark ? 0.08 : 0.2} />
                                                <XAxis dataKey="hour" tickLine={false} axisLine={false} />
                                                <YAxis width={32} tickLine={false} axisLine={false} />
                                                <Tooltip />
                                                <Bar dataKey="tx" fill={colors.success} radius={[6, 6, 0, 0]} />
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </Box>

                                    <Divider sx={{ my: 1.5 }} />

                                    <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 0.5 }}>Jam Sibuk (Omzet)</Typography>
                                    <Box sx={{ width: '100%', height: 140 }}>
                                        <ResponsiveContainer>
                                            <BarChart data={SNAPSHOT.byHourGross} margin={{ left: 6, right: 12, top: 8, bottom: 0 }}>
                                                <XAxis dataKey="hour" hide />
                                                <YAxis hide />
                                                <Tooltip formatter={(v: number) => [`Rp ${rupiah(v)}`, 'Omzet']} />
                                                <Bar dataKey="rev" fill={colors.primary} radius={[6, 6, 0, 0]} />
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </Box>
                                </CardContent>
                            </Card>
                        </Grid2>

                        {/* ===== Payment Breakdown & Dine Mode ===== */}
                        <Grid2 size={{ xs: 12, md: 6, lg: 4 }}>
                            <Card
                                elevation={0}
                                sx={{
                                    borderRadius: 3,
                                    border: `1px solid ${colors.grid}`,
                                    overflow: 'hidden',
                                    background: isDark ? 'linear-gradient(180deg, rgba(255,255,255,0.04), rgba(255,255,255,0.02))' : '#fff',
                                }}
                            >
                                <Box sx={{ height: 6, background: 'linear-gradient(90deg, #06B6D4, #67E8F9)' }} />
                                <CardContent sx={{ p: 2.5 }}>
                                    <Typography variant="subtitle1" fontWeight={800} sx={{ mb: 1 }}>Metode Pembayaran</Typography>
                                    <Box sx={{ width: '100%', height: 210 }}>
                                        <ResponsiveContainer>
                                            <PieChart>
                                                <Pie data={SNAPSHOT.pay} dataKey="value" nameKey="name" innerRadius={48} outerRadius={70} paddingAngle={6}>
                                                    {SNAPSHOT.pay.map((_, i) => (
                                                        <Cell key={i} fill={[colors.primary, colors.warn, colors.secondary][i % 3]} />
                                                    ))}
                                                </Pie>
                                                <Tooltip formatter={(v: number, n: string) => [`Rp ${rupiah(v)}`, n]} />
                                            </PieChart>
                                        </ResponsiveContainer>
                                    </Box>

                                    <Divider sx={{ my: 1.5 }} />

                                    <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
                                        <TableRestaurantRounded fontSize="small" />
                                        <Typography variant="subtitle2" fontWeight={700}>Dine-in vs Take-away</Typography>
                                    </Stack>
                                    <Stack direction="row" spacing={1}>
                                        {dineTake.map((x, i) => (
                                            <Chip
                                                key={x.name}
                                                size="small"
                                                icon={<PointOfSaleRounded />}
                                                label={`${x.name}: ${x.value} trx`}
                                                sx={{ bgcolor: i === 0 ? 'action.selected' : 'action.hover' }}
                                            />
                                        ))}
                                    </Stack>
                                </CardContent>
                            </Card>
                        </Grid2>

                        {/* ===== Discounts & Refunds ===== */}
                        <Grid2 size={{ xs: 12, md: 6, lg: 4 }}>
                            <Card
                                elevation={0}
                                sx={{
                                    borderRadius: 3,
                                    border: `1px solid ${colors.grid}`,
                                    overflow: 'hidden',
                                    background: isDark ? 'linear-gradient(180deg, rgba(255,255,255,0.04), rgba(255,255,255,0.02))' : '#fff',
                                }}
                            >
                                <Box sx={{ height: 6, background: 'linear-gradient(90deg, #EF4444, #FCA5A5)' }} />
                                <CardContent sx={{ p: 2.5 }}>
                                    <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
                                        <DiscountRounded />
                                        <Typography variant="subtitle1" fontWeight={800}>Diskon & Refund</Typography>
                                    </Stack>

                                    <Stack direction="row" spacing={2}>
                                        <Stack sx={{ flex: 1 }} alignItems="center">
                                            <Typography variant="caption" color="text.secondary">Diskon</Typography>
                                            <Typography variant="h6" fontWeight={800}>Rp {rupiah(discValue)}</Typography>
                                            <Typography variant="caption" color="text.secondary">{pct(SNAPSHOT.discRate)} dari gross</Typography>
                                        </Stack>
                                        <Divider orientation="vertical" flexItem />
                                        <Stack sx={{ flex: 1 }} alignItems="center">
                                            <Typography variant="caption" color="text.secondary">Refund</Typography>
                                            <Typography variant="h6" fontWeight={800}>{SNAPSHOT.refunds} trx</Typography>
                                            <Typography variant="caption" color="text.secondary">Hari ini</Typography>
                                        </Stack>
                                    </Stack>

                                    <Divider sx={{ my: 1.5 }} />

                                    <Stack direction="row" spacing={1} alignItems="center">
                                        <TrendingUpRounded fontSize="small" />
                                        <Typography variant="body2" color="text.secondary">
                                            AOV: Rp {rupiah(avgOrderValue)} • Net Hari Ini: Rp {rupiah(netGross)}
                                        </Typography>
                                    </Stack>
                                </CardContent>
                            </Card>
                        </Grid2>

                        {/* ===== Terminal/Perangkat ===== */}
                        <Grid2 size={{ xs: 12, lg: 4 }}>
                            <Card
                                elevation={0}
                                sx={{
                                    borderRadius: 3,
                                    border: `1px solid ${colors.grid}`,
                                    overflow: 'hidden',
                                    background: isDark ? 'linear-gradient(180deg, rgba(255,255,255,0.04), rgba(255,255,255,0.02))' : '#fff',
                                }}
                            >
                                <Box sx={{ height: 6, background: 'linear-gradient(90deg, #10B981, #34D399)' }} />
                                <CardContent sx={{ p: 2.5 }}>
                                    <Typography variant="subtitle1" fontWeight={800} sx={{ mb: 1 }}>Perangkat & Status</Typography>
                                    <Stack spacing={1.25}>
                                        <Stack direction="row" spacing={1} alignItems="center" justifyContent="space-between">
                                            <Stack direction="row" spacing={1} alignItems="center">
                                                <WifiRounded />
                                                <Typography>Kasir Online</Typography>
                                            </Stack>
                                            <Chip size="small" color="success" label={`${SNAPSHOT.terminalsOnline} aktif`} />
                                        </Stack>

                                        <Stack direction="row" spacing={1} alignItems="center" justifyContent="space-between">
                                            <Stack direction="row" spacing={1} alignItems="center">
                                                <PrintRounded />
                                                <Typography>Printer</Typography>
                                            </Stack>
                                            <Chip size="small" color="success" label={`${SNAPSHOT.printersOK} siap`} />
                                        </Stack>

                                        <Stack direction="row" spacing={1} alignItems="center" justifyContent="space-between">
                                            <Stack direction="row" spacing={1} alignItems="center">
                                                <MapRounded />
                                                <Typography>Area Meja</Typography>
                                            </Stack>
                                            <Chip size="small" variant="outlined" label="Lantai 1–2" />
                                        </Stack>

                                        <Stack direction="row" spacing={1} alignItems="center" justifyContent="space-between">
                                            <Stack direction="row" spacing={1} alignItems="center">
                                                <PersonRounded />
                                                <Typography>Shift Aktif</Typography>
                                            </Stack>
                                            <Chip size="small" variant="outlined" label="Shift Siang (13:00–21:00)" />
                                        </Stack>
                                    </Stack>

                                    <Divider sx={{ my: 1.5 }} />

                                    <Stack direction="row" spacing={1} justifyContent="flex-end">
                                        <Button size="small" variant="outlined" startIcon={<PaymentsRounded />}>
                                            Close Cash
                                        </Button>
                                        <Button size="small" variant="contained" startIcon={<PointOfSaleRounded />}>
                                            Buka Transaksi
                                        </Button>
                                    </Stack>
                                </CardContent>
                            </Card>
                        </Grid2>

                        {/* ===== Top Products ===== */}
                        <Grid2 size={{ xs: 12 }}>
                            <Card
                                elevation={0}
                                sx={{
                                    borderRadius: 3,
                                    border: `1px solid ${colors.grid}`,
                                    overflow: 'hidden',
                                    background: isDark ? 'linear-gradient(180deg, rgba(255,255,255,0.04), rgba(255,255,255,0.02))' : '#fff',
                                }}
                            >
                                <Box sx={{ height: 6, background: 'linear-gradient(90deg, #4F46E5, #9333EA)' }} />
                                <CardContent sx={{ p: 2.5 }}>
                                    <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1 }}>
                                        <Stack direction="row" spacing={1} alignItems="center">
                                            <Inventory2Rounded />
                                            <Typography variant="subtitle1" fontWeight={800}>Top Produk (Qty & Gross)</Typography>
                                        </Stack>
                                        <Chip size="small" variant="outlined" label="Hari Ini" />
                                    </Stack>

                                    <Box sx={{ height: 360 }}>
                                        <DataGrid
                                            rows={SNAPSHOT.top}
                                            columns={colsTop}
                                            density="compact"
                                            disableRowSelectionOnClick
                                            pageSizeOptions={[5, 10, 25]}
                                            initialState={{ pagination: { paginationModel: { pageSize: 10, page: 0 } } }}
                                            sx={{
                                                border: '1px solid',
                                                borderColor: 'divider',
                                                borderRadius: 2,
                                                height: '100%',
                                            }}
                                        />
                                    </Box>
                                </CardContent>
                            </Card>
                        </Grid2>

                    </Grid2>
                </Box>
            </PerfectScrollbar>
        </Box>
    );
}
