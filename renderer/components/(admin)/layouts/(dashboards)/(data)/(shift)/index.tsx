'use client';

import * as React from 'react';
import {
    Avatar,
    Box,
    Button,
    Chip,
    Paper,
    Stack,
    Typography,
} from '@mui/material';
import AddRounded from '@mui/icons-material/AddRounded';
import AccessTimeRounded from '@mui/icons-material/AccessTimeRounded';

import {
    MaterialReactTable,
    useMaterialReactTable,
    type MRT_ColumnDef,
} from 'material-react-table';

/* ========= Types dari response ========= */
type ApiName = { first_name?: string; last_name?: string };
type ApiAccount = {
    id: string;
    name?: ApiName;
    username?: string;
    password?: string;
    time_created?: string;
    time_updated?: string;
};
type ApiBranch = {
    id: string;
    name: string;
    address?: string | null;
    phone?: string | null;
    email?: string | null;
    website?: string | null;
    time_created?: string;
    time_updated?: string;
};
type ApiShift = {
    id: string;
    name: string;
    start_time: string; // "HH:mm"
    end_time: string;   // "HH:mm"
    status?: boolean;
    time_created?: string;
    time_updated?: string;
    reference?: any;
    branches?: ApiBranch[];
    accounts?: ApiAccount[];
};

/* ========= Tree Row Types ========= */
type AccountChildRow = {
    kind: 'account';
    id: string;
    fullName: string;
    username?: string | null;
};

type ShiftParentRow = {
    kind: 'shift';
    id: string;
    name: string;
    start: string;
    end: string;
    timeRange: string;
    status: boolean;
    branchName?: string | null;
    isLiveNow: boolean;
    subRows?: AccountChildRow[];
};

/* ===== Utils TZ Asia/Makassar ===== */
const TZ = 'Asia/Makassar';

const nowMinutesInTz = (timeZone: string) => {
    const parts = new Intl.DateTimeFormat('en-GB', { timeZone, hour12: false, hour: '2-digit', minute: '2-digit' }).formatToParts(new Date());
    const h = Number(parts.find(p => p.type === 'hour')?.value ?? '0');
    const m = Number(parts.find(p => p.type === 'minute')?.value ?? '0');
    return (h * 60) + m;
};
const parseHHmmToMinutes = (hhmm?: string) => !hhmm || !/^\d{2}:\d{2}$/.test(hhmm) ? 0 : hhmm.split(':').map(Number).reduce((h, m) => h * 60 + m);
const isNowBetween = (startHHmm: string, endHHmm: string, tz = TZ) => {
    const start = parseHHmmToMinutes(startHHmm);
    const end = parseHHmmToMinutes(endHHmm);
    const now = nowMinutesInTz(tz);
    return end >= start ? (now >= start && now <= end) : (now >= start || now <= end);
};
const initials = (s?: string) => (s?.trim()?.slice(0, 1) || 'S').toUpperCase();
const fullName = (n?: ApiName) => [n?.first_name, n?.last_name].filter(Boolean).join(' ').trim() || '—';

export default function ShiftsTree() {
    const [rows, setRows] = React.useState<ShiftParentRow[]>([]);
    const [loading, setLoading] = React.useState(false);
    const [error, setError] = React.useState<string | null>(null);

    const fetchShifts = React.useCallback(() => {
        if (!window.api) {
            console.error('Failed Get Window Api Bridge');
            setError('Bridge tidak tersedia');
            setRows([]);
            return;
        }
        setLoading(true);
        window.api
            .invoke('api.config.data.shift:read.all', {})
            .then((result: any) => {
                const data = (result?.data ?? []) as ApiShift[];
                const mapped: ShiftParentRow[] = data.map((s) => ({
                    kind: 'shift',
                    id: s.id,
                    name: s.name,
                    start: s.start_time,
                    end: s.end_time,
                    timeRange: `${s.start_time} – ${s.end_time}`,
                    status: !!s.status,
                    branchName: s.branches?.[0]?.name ?? null,
                    isLiveNow: isNowBetween(s.start_time, s.end_time, TZ),
                    subRows: (s.accounts ?? []).map<AccountChildRow>(a => ({
                        kind: 'account',
                        id: a.id,
                        fullName: fullName(a.name),
                        username: a.username ?? null,
                    })),
                }));
                setRows(mapped);
                setError(null);
            })
            .catch((err: any) => {
                console.error(err);
                setRows([]);
                setError(err?.msg ?? 'Gagal memuat shift. Periksa Koneksi Jaringan / Server');
            })
            .finally(() => setLoading(false));
    }, []);

    React.useEffect(() => { fetchShifts(); }, [fetchShifts]);

    // auto-refresh Live Now tiap menit
    React.useEffect(() => {
        const id = window.setInterval(() => {
            setRows(prev => prev.map(r => ({ ...r, isLiveNow: isNowBetween(r.start, r.end, TZ) })));
        }, 60_000);
        return () => window.clearInterval(id);
    }, []);

    /* ========= Columns (parent vs child rendering) ========= */
    const columns = React.useMemo<MRT_ColumnDef<ShiftParentRow | AccountChildRow>[]>(
        () => [
            // SHIFT / ACCOUNT
            {
                id: 'shiftOrAccount',
                header: 'SHIFT / ACCOUNT',
                size: 340,
                Cell: ({ row }) => {
                    if (row.depth === 0) {
                        const r = row.original as ShiftParentRow;
                        return (
                            <Stack direction="row" spacing={1.25} alignItems="center" sx={{ minWidth: 0 }}>
                                <Avatar variant="rounded" sx={{ width: 32, height: 32, borderRadius: 1 }}>
                                    {initials(r.name)}
                                </Avatar>
                                <Box sx={{ minWidth: 0 }}>
                                    <Typography variant="body2" fontWeight={600} noWrap title={r.name}>
                                        {r.name}
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary" noWrap title={r.timeRange}>
                                        {r.timeRange}
                                    </Typography>
                                </Box>
                            </Stack>
                        );
                    }
                    const a = row.original as AccountChildRow;
                    return (
                        <Stack direction="row" spacing={1.25} alignItems="center" sx={{ minWidth: 0 }}>
                            <Avatar variant="rounded" sx={{ width: 28, height: 28, borderRadius: 1 }}>
                                {initials(a.fullName)}
                            </Avatar>
                            <Typography variant="body2" fontWeight={600} noWrap title={a.fullName}>
                                {a.fullName}
                            </Typography>
                        </Stack>
                    );
                },
                muiTableBodyCellProps: ({ row }) =>
                    row.depth === 0 ? {} : ({ sx: { borderLeft: (t) => `3px solid ${t.palette.divider}` } }),
            },

            // TIME (chip Live Now hanya untuk parent)
            {
                id: 'time',
                header: 'TIME',
                size: 220,
                Cell: ({ row }) => {
                    if (row.depth === 0) {
                        const r = row.original as ShiftParentRow;
                        return (
                            <Stack direction="row" spacing={1} alignItems="center">
                                <Stack direction="row" spacing={0.75} alignItems="center">
                                    <AccessTimeRounded fontSize="small" />
                                    <Typography variant="body2" noWrap title={r.timeRange}>{r.timeRange}</Typography>
                                </Stack>
                                {r.isLiveNow ? <Chip size="small" color="success" label="Live Now" sx={{ borderRadius: 2 }} /> : null}
                            </Stack>
                        );
                    }
                    return <Typography variant="body2" color="text.disabled">—</Typography>;
                },
            },

            // BRANCH (hanya parent)
            {
                id: 'branch',
                header: 'BRANCH',
                size: 240,
                Cell: ({ row }) => {
                    if (row.depth === 0) {
                        const r = row.original as ShiftParentRow;
                        return (
                            <Typography variant="body2" color="text.secondary" noWrap title={r.branchName ?? ''}>
                                {r.branchName ?? '—'}
                            </Typography>
                        );
                    }
                    return <Typography variant="body2" color="text.disabled">—</Typography>;
                },
            },

            // USERNAME (hanya child/account)
            {
                id: 'username',
                header: 'USERNAME',
                size: 200,
                Cell: ({ row }) => {
                    if (row.depth === 0) return <Typography variant="body2" color="text.disabled">—</Typography>;
                    const a = row.original as AccountChildRow;
                    return <Typography variant="body2" noWrap title={a.username ?? '—'}>{a.username ?? '—'}</Typography>;
                },
            },

            // STATUS (Active/Inactive hanya parent)
            {
                id: 'status',
                header: 'STATUS',
                size: 120,
                Cell: ({ row }) => {
                    if (row.depth === 0) {
                        const r = row.original as ShiftParentRow;
                        return (
                            <Chip
                                size="small"
                                label={r.status ? 'Active' : 'Inactive'}
                                color={r.status ? 'success' : 'default'}
                                variant="outlined"
                                sx={{ borderRadius: 2 }}
                            />
                        );
                    }
                    return <Typography variant="body2" color="text.disabled" textAlign="center">—</Typography>;
                },
                muiTableBodyCellProps: { align: 'center' },
                muiTableHeadCellProps: { align: 'center' },
                muiTableFooterCellProps: { align: 'center' },
            },
        ],
        [],
    );

    /* ========= MRT Instance (tree/subRows) ========= */
    const table = useMaterialReactTable({
        columns,
        data: rows as any, // parent = ShiftParentRow, child = AccountChildRow
        enableExpanding: true,
        enableExpandAll: false,
        filterFromLeafRows: true,
        getSubRows: (row: ShiftParentRow | AccountChildRow) => (row as ShiftParentRow).subRows as any,
        initialState: { density: 'comfortable' },
        paginateExpandedRows: false,

        // baseline template v2
        state: { showProgressBars: loading },
        columnFilterDisplayMode: 'popover',
        paginationDisplayMode: 'pages',
        positionToolbarAlertBanner: 'bottom',
        enableRowSelection: false,
        enableStickyHeader: true,
        muiTablePaperProps: { sx: { display: 'flex', flexDirection: 'column', flex: 1 } },
        muiTableContainerProps: { sx: { flex: 1 } },

        renderTopToolbarCustomActions: () => (
            <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ width: '100%', gap: 1 }}>
                <Box>
                    <Typography variant="overline" color="text.secondary">Config / Shifts</Typography>
                    {loading ? (
                        <Typography variant="body2" color="text.secondary">Loading…</Typography>
                    ) : error ? (
                        <Typography variant="body2" color="error.main">{error}</Typography>
                    ) : null}
                </Box>
                <Stack direction="row" spacing={1}>
                    <Button variant="outlined" onClick={fetchShifts}>Refresh</Button>
                    <Button variant="contained" startIcon={<AddRounded />} onClick={() => console.log('open create shift')}>
                        Tambah Shift
                    </Button>
                </Stack>
            </Stack>
        ),
    });

    return (
        <Paper variant="outlined" sx={{ p: 2, height: '100%', display: 'flex', flexDirection: 'column', minHeight: 0 }}>
            <Box sx={{ flex: 1, minHeight: 0, display: 'flex' }}>
                <MaterialReactTable table={table} />
            </Box>
        </Paper>
    );
}
