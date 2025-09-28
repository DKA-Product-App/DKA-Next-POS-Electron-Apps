'use client';

import * as React from 'react';
import {
    Avatar,
    Box,
    Button,
    Chip,
    Divider,
    List,
    ListItem,
    ListItemAvatar,
    ListItemText,
    Popover,
    Stack,
    Typography,
} from '@mui/material';
import AccessTimeRounded from '@mui/icons-material/AccessTimeRounded';
import GroupRounded from '@mui/icons-material/GroupRounded';
import AddRounded from '@mui/icons-material/AddRounded';

import {
    DataTable,
    Column,
    useNonPassiveWheel,
} from './(components)/TablesLayoutConstructor';

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

/* ========= Row type untuk DataTable ========= */
type RowShift = {
    id: string;
    name: string;
    start: string;
    end: string;
    timeRange: string;
    status: boolean;
    branchName?: string | null;
    accountsCount: number;
    accounts: ApiAccount[];
    isLiveNow: boolean;
    nameCell: React.ReactNode;
};
/* ===== Utils TZ Asia/Makassar ===== */
const TZ = 'Asia/Makassar';

// minutes sejak 00:00 di timezone tertentu
const nowMinutesInTz = (timeZone: string) => {
    const parts = new Intl.DateTimeFormat('en-GB', {
        timeZone,
        hour12: false,
        hour: '2-digit',
        minute: '2-digit',
    }).formatToParts(new Date());
    const h = Number(parts.find(p => p.type === 'hour')?.value ?? '0');
    const m = Number(parts.find(p => p.type === 'minute')?.value ?? '0');
    return (h * 60) + m;
};

const parseHHmmToMinutes = (hhmm?: string) => {
    if (!hhmm || !/^\d{2}:\d{2}$/.test(hhmm)) return 0;
    const [h, m] = hhmm.split(':').map(Number);
    return (h * 60) + m;
};

// true kalau now (di TZ) berada di dalam [start,end], handle wrap-midnight
const isNowBetween = (startHHmm: string, endHHmm: string, tz = TZ) => {
    const start = parseHHmmToMinutes(startHHmm);
    const end   = parseHHmmToMinutes(endHHmm);
    const now   = nowMinutesInTz(tz);
    return end >= start ? (now >= start && now <= end) : (now >= start || now <= end);
};

/* util kecil */
const initials = (s?: string) => (s?.trim()?.slice(0, 1) || 'S').toUpperCase();
const fullName = (n?: ApiName) => [n?.first_name, n?.last_name].filter(Boolean).join(' ').trim() || '—';

export default function Shifts() {
    const [rows, setRows] = React.useState<RowShift[]>([]);
    const [loading, setLoading] = React.useState(false);
    const [error, setError] = React.useState<string | null>(null);

    // Popover accounts
    const [accAnchor, setAccAnchor] = React.useState<HTMLElement | null>(null);
    const [accTitle, setAccTitle] = React.useState<string>('');
    const [accList, setAccList] = React.useState<ApiAccount[]>([]);
    const listRef = React.useRef<HTMLDivElement>(null);
    useNonPassiveWheel(listRef);

    const openAccounts = (e: React.MouseEvent<HTMLElement>, shiftName: string, accounts: ApiAccount[]) => {
        setAccAnchor(e.currentTarget);
        setAccTitle(shiftName);
        setAccList(accounts ?? []);
    };
    const closeAccounts = () => {
        setAccAnchor(null);
        setAccTitle('');
        setAccList([]);
    };

    const fetchShifts = React.useCallback(() => {
        if (!window.api) {
            console.error('Failed Get Window Api Bridge');
            setError('Bridge tidak tersedia');
            return;
        }
        setLoading(true);
        window.api
            .invoke('api.config.data.shift:read.all', {})
            .then((result: any) => {
                const data = (result?.data ?? []) as ApiShift[];
                const mapped: RowShift[] = data.map((s) => {
                    const live = isNowBetween(s.start_time, s.end_time, TZ);
                    return {
                        id: s.id,
                        name: s.name,
                        start: s.start_time,
                        end: s.end_time,
                        timeRange: `${s.start_time} – ${s.end_time}`,
                        status: !!s.status,
                        branchName: s.branches?.[0]?.name ?? null,
                        accountsCount: s.accounts?.length ?? 0,
                        accounts: s.accounts ?? [],
                        isLiveNow: live,
                        nameCell: (
                            <Stack direction="row" spacing={1.25} alignItems="center" sx={{ minWidth: 0 }}>
                                <Avatar variant="rounded" sx={{ width: 32, height: 32, borderRadius: 1 }}>
                                    {initials(s.name)}
                                </Avatar>
                                <Box sx={{ minWidth: 0 }}>
                                    <Typography variant="body2" fontWeight={600} noWrap title={s.name}>
                                        {s.name}
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary" noWrap title={`${s.start_time} – ${s.end_time}`}>
                                        {s.start_time} – {s.end_time}
                                    </Typography>
                                </Box>
                            </Stack>
                        ),
                    };
                });
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

    // auto-refresh badge Live Now tiap menit biar real-time (ringan kok)
    React.useEffect(() => {
        const id = window.setInterval(() => {
            setRows(prev => prev.map(r => ({ ...r, isLiveNow: isNowBetween(r.start, r.end, TZ) })));
        }, 60_000);
        return () => window.clearInterval(id);
    }, []);

    const columns: Column<RowShift>[] = [
        {
            key: 'nameCell',
            label: 'SHIFT',
            sortable: true,
            width: 300,
            minWidth: 220,
            headerFilter: { type: 'text' },
        },
        {
            key: 'timeRange',
            label: 'TIME',
            sortable: true,
            width: 220,
            minWidth: 180,
            headerFilter: { type: 'text' },
            render: (r) => (
                <Stack direction="row" spacing={1} alignItems="center">
                    <Stack direction="row" spacing={0.75} alignItems="center">
                        <AccessTimeRounded fontSize="small" />
                        <Typography variant="body2" noWrap title={r.timeRange}>{r.timeRange}</Typography>
                    </Stack>
                    {r.isLiveNow ? (
                        <Chip size="small" color="success" label="Live Now" sx={{ borderRadius: 2 }} />
                    ) : null}
                </Stack>
            ),
        },
        {
            key: 'branchName',
            label: 'BRANCH',
            sortable: true,
            width: 260,
            minWidth: 200,
            headerFilter: { type: 'text' },
            render: (r) => (
                <Typography variant="body2" color="text.secondary" noWrap title={r.branchName ?? ''}>
                    {r.branchName ?? '—'}
                </Typography>
            ),
        },
        {
            key: 'accountsCount',
            label: 'ACCOUNTS',
            sortable: true,
            align: 'center',
            width: 140,
            minWidth: 120,
            render: (r) => (
                <Button
                    size="small"
                    variant="outlined"
                    onClick={(e) => openAccounts(e, r.name, r.accounts)}
                    sx={{ borderRadius: 2, minWidth: 0, px: 1.25 }}
                    startIcon={<GroupRounded />}
                >
                    {r.accountsCount}
                </Button>
            ),
        },
        {
            key: 'status',
            label: 'STATUS',
            sortable: true,
            align: 'center',
            width: 120,
            minWidth: 110,
            render: (r) => (
                <Chip
                    size="small"
                    label={r.status ? 'Active' : 'Inactive'}
                    color={r.status ? 'success' : 'default'}
                    variant="outlined"
                    sx={{ borderRadius: 2 }}
                />
            ),
        },
    ];

    return (
        <Box
            sx={{
                p: 2,
                display: 'grid',
                gap: 2,
                height: '100%',
                minHeight: 0,
                gridTemplateRows: 'auto 1fr',
            }}
        >
            {/* Header & CTA */}
            <Stack direction="row" alignItems="center" justifyContent="space-between">
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

            {/* DataTable */}
            <DataTable<RowShift>
                columns={columns}
                rows={rows}
                initialRowsPerPage={15}
                enableSelection={false}
            />

            {/* Popover Accounts */}
            <Popover
                open={Boolean(accAnchor)}
                anchorEl={accAnchor}
                onClose={closeAccounts}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
                transformOrigin={{ vertical: 'top', horizontal: 'center' }}
                PaperProps={{ sx: { width: 420, maxWidth: 'calc(100vw - 32px)', borderRadius: 2, overflow: 'hidden' } }}
            >
                {/* Header */}
                <Box
                    sx={{
                        px: 2, py: 1,
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        backgroundColor: (t) => t.palette.background.paper,
                        borderBottom: (t) => `1px solid ${t.palette.divider}`,
                    }}
                >
                    <Typography variant="subtitle2">Accounts — {accTitle}</Typography>
                    <Chip size="small" variant="outlined" label={`${accList.length} item`} sx={{ borderRadius: 2 }} />
                </Box>

                {/* List */}
                <Box ref={listRef} sx={{ maxHeight: 360, overflow: 'auto', p: 1, pt: 0.5, minWidth: 320, touchAction: 'pan-y', overscrollBehavior: 'contain' }}>
                    {accList.length === 0 ? (
                        <Box sx={{ px: 2, py: 3 }}>
                            <Typography variant="body2" color="text.secondary">Tidak ada akun.</Typography>
                        </Box>
                    ) : (
                        <List dense disablePadding>
                            <ListItem
                                disableGutters
                                sx={{
                                    px: 1.5, py: 0.75, position: 'sticky', top: 0, zIndex: 1,
                                    backgroundColor: (t) => t.palette.background.paper,
                                    borderBottom: (t) => `1px solid ${t.palette.divider}`,
                                }}
                            >
                                <Typography variant="caption" sx={{ flex: 1, fontWeight: 700, color: 'text.secondary' }}>
                                    Name
                                </Typography>
                                <Typography variant="caption" sx={{ width: 160, textAlign: 'right', fontWeight: 700, color: 'text.secondary' }}>
                                    Username
                                </Typography>
                            </ListItem>

                            {accList.map((a) => (
                                <React.Fragment key={a.id}>
                                    <ListItem
                                        disableGutters
                                        sx={{ px: 1.5, py: 0.75, gap: 1.25, '&:hover': { backgroundColor: (t) => t.palette.action.hover } }}
                                    >
                                        <ListItemAvatar>
                                            <Avatar variant="rounded" sx={{ width: 28, height: 28, borderRadius: 1 }}>
                                                {initials(fullName(a.name))}
                                            </Avatar>
                                        </ListItemAvatar>
                                        <ListItemText
                                            primary={
                                                <Typography variant="body2" fontWeight={600} noWrap title={fullName(a.name)}>
                                                    {fullName(a.name)}
                                                </Typography>
                                            }
                                            secondary={null}
                                            sx={{ m: 0, flex: 1, minWidth: 0 }}
                                        />
                                        <Typography variant="body2" sx={{ width: 160, textAlign: 'right' }}>
                                            {a.username ?? '—'}
                                        </Typography>
                                    </ListItem>
                                    <Divider sx={{ mx: 1.5 }} />
                                </React.Fragment>
                            ))}
                        </List>
                    )}
                </Box>

                <Box sx={{ px: 1.5, py: 1, textAlign: 'right' }}>
                    <Button size="small" onClick={closeAccounts}>Tutup</Button>
                </Box>
            </Popover>
        </Box>
    );
}
