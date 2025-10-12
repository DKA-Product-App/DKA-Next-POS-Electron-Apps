'use client';

import * as React from 'react';
import {
    Box,
    Button,
    Chip,
    Paper,
    Stack,
    Typography,
} from '@mui/material';
import AddRounded from '@mui/icons-material/AddRounded';
import StorefrontRounded from '@mui/icons-material/StorefrontRounded';
import AdminPanelSettingsRounded from '@mui/icons-material/AdminPanelSettingsRounded';
import PersonRounded from '@mui/icons-material/PersonRounded';
import AccessTimeRounded from '@mui/icons-material/AccessTimeRounded';

import {
    MaterialReactTable,
    useMaterialReactTable,
    type MRT_ColumnDef,
} from 'material-react-table';
import NewAccountModal from "./(components)/NewAccountModal";
import {ImgWithSkeleton} from "../../../../../utils/ImageProcessingIPC";

/* ========= Types dari response (disederhanakan untuk UI) ========= */
type ApiName = { first_name?: string; last_name?: string };
type ApiRef = {
    id: string;
    name?: ApiName;
    username?: string;
    password?: string;
    time_created?: string;
    time_updated?: string;
    time_deleted?: string | null;
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
    time_deleted?: string | null;
    corporation?: {
        id: string;
        name: string;
        address?: string | null;
        phone?: string | null;
        email?: string | null;
        website?: string | null;
        time_created?: string;
        time_updated?: string;
        time_deleted?: string | null;
    };
};
type ApiRole = {
    id: string;
    code: string;
    name: string;
    description?: string | null;
    status?: boolean;
    time_created?: string;
    time_updated?: string;
    time_deleted?: string | null;
    reference?: ApiRef;
};
type ApiShift = {
    id: string;
    name: string;
    start_time: string; // "HH:mm"
    end_time: string;   // "HH:mm"
    status?: boolean;
    time_created?: string;
    time_updated?: string;
    time_deleted?: string | null;
    reference?: ApiRef;
    branches?: ApiBranch[];
};

type ApiAccount = {
    id: string;
    name?: ApiName;
    username?: string;
    password?: string;
    time_created?: string;
    time_updated?: string;
    time_deleted?: string | null;
    reference?: ApiRef;
    branches?: ApiBranch[];
    roles?: ApiRole[];
    shift?: ApiShift | null;
    // image?: string; // kalau nanti ada foto user, tinggal aktifkan dan render ke ImgWithSkeleton
};

/* ========= Tree Row Types ========= */
type BranchChildRow = {
    kind: 'branch';
    id: string;
    name: string;
    address?: string | null;
    phone?: string | null;
    email?: string | null;
    corporation?: string | null;
};

type RoleChildRow = {
    kind: 'role';
    id: string;
    code: string;
    name: string;
    description?: string | null;
    status: boolean;
};

type ShiftChildRow = {
    kind: 'shift';
    id: string;
    name: string;
    start: string; // "HH:mm"
    end: string;   // "HH:mm"
    status: boolean;
    branches: string[]; // nama branch di shift
};

type AccountParentRow = {
    kind: 'account';
    id: string;
    fullName: string;
    username: string;
    createdAt?: string | null;
    branchesCount: number;
    rolesCount: number;
    hasShift: boolean;
    subRows?: Array<BranchChildRow | RoleChildRow | ShiftChildRow>;
};

/* ========= Utils ========= */
const TZ = 'Asia/Makassar';
const fullName = (n?: ApiName) =>
    [n?.first_name, n?.last_name].filter(Boolean).join(' ').trim() || '—';
const initials = (s?: string) => (s?.trim()?.[0] ?? 'A').toUpperCase();
const fmtDateTime = (iso?: string | null) => {
    if (!iso) return '—';
    const d = new Date(iso);
    return Number.isNaN(d.getTime())
        ? (iso || '—')
        : new Intl.DateTimeFormat('en-GB', {
            timeZone: TZ,
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            hour12: false,
        }).format(d);
};

/** Type guard: parent rows punya subRows */
const hasSubRows = (row: unknown): row is AccountParentRow =>
    !!row && typeof row === 'object' && (row as AccountParentRow).kind === 'account' && Array.isArray((row as AccountParentRow).subRows);

/* ========= UI helpers (pengganti Avatar) ========= */
const IconBox: React.FC<{ size?: number; rounded?: number | string; children: React.ReactNode; title?: string }> = ({ size = 28, rounded = 8, children, title }) => (
    <Box title={title} sx={{ width: size, height: size, borderRadius: rounded, bgcolor: 'background.neutral', display: 'grid', placeItems: 'center', overflow: 'hidden' }}>
        {children}
    </Box>
);

const InitialsBox: React.FC<{ name: string; size?: number; rounded?: number | string }> = ({ name, size = 32, rounded = 8 }) => (
    <Box sx={{ width: size, height: size, borderRadius: rounded, bgcolor: 'background.neutral', display: 'grid', placeItems: 'center', fontWeight: 700 }}>
        {initials(name)}
    </Box>
);

export default function AccountsTree() {
    const [rows, setRows] = React.useState<AccountParentRow[]>([]);
    const [loading, setLoading] = React.useState(false);
    const [error, setError] = React.useState<string | null>(null);

    const fetchAccounts = React.useCallback(() => {
        if (!window.api) {
            console.error('Failed Get Window Api Bridge');
            setError('Bridge tidak tersedia');
            setRows([]);
            return;
        }
        setLoading(true);
        window.api
            .invoke<any, { data: ApiAccount[] }>('api.account:read.all', {})
            .then(({ data }) => {
                const mapped: AccountParentRow[] = (Array.isArray(data) ? data : []).map((a) => {
                    const shiftChild: ShiftChildRow[] =
                        a.shift
                            ? [{
                                kind: 'shift',
                                id: a.shift.id,
                                name: a.shift.name,
                                start: a.shift.start_time,
                                end: a.shift.end_time,
                                status: !!a.shift.status,
                                branches: (a.shift.branches ?? []).map(b => b.name).filter(Boolean),
                            }]
                            : [];

                    const branchChildren: BranchChildRow[] = (a.branches ?? []).map((b) => ({
                        kind: 'branch',
                        id: b.id,
                        name: b.name,
                        address: b.address ?? null,
                        phone: b.phone ?? null,
                        email: b.email ?? null,
                        corporation: b.corporation?.name ?? null,
                    }));

                    const roleChildren: RoleChildRow[] = (a.roles ?? []).map((r) => ({
                        kind: 'role',
                        id: r.id,
                        code: r.code,
                        name: r.name,
                        description: r.description ?? null,
                        status: !!r.status,
                    }));

                    return {
                        kind: 'account',
                        id: a.id,
                        fullName: fullName(a.name),
                        username: a.username ?? '—',
                        createdAt: a.time_created ?? null,
                        branchesCount: branchChildren.length,
                        rolesCount: roleChildren.length,
                        hasShift: !!a.shift,
                        // urutan: Shift → Branch → Role
                        subRows: [...shiftChild, ...branchChildren, ...roleChildren],
                    };
                });

                setRows(mapped);
                setError(null);
            })
            .catch((err: any) => {
                console.error(err);
                setRows([]);
                setError(err?.msg ?? 'Gagal memuat accounts. Periksa Koneksi Jaringan / Server');
            })
            .finally(() => setLoading(false));
    }, []);

    React.useEffect(() => { fetchAccounts(); }, [fetchAccounts]);

    /* ========= Columns (parent vs child rendering) ========= */
    type AnyRow = AccountParentRow | BranchChildRow | RoleChildRow | ShiftChildRow;

    const columns = React.useMemo<MRT_ColumnDef<AnyRow>[]>(
        () => [
            // ACCOUNT / DETAIL
            {
                id: 'accountOrDetail',
                header: 'ACCOUNT / DETAIL',
                size: 420,
                Cell: ({ row }) => {
                    const depth = row.depth;

                    if (depth === 0) {
                        const r = row.original as AccountParentRow;
                        return (
                            <Stack direction="row" spacing={1.25} alignItems="center" sx={{ minWidth: 0 }}>
                                {/* Ganti Avatar → InitialsBox; kalau nanti ada image: taruh ImgWithSkeleton di sini */}
                                <Box sx={{ width: 32, height: 32, borderRadius: 1, overflow: 'hidden', bgcolor: 'background.neutral' }}>
                                    <ImgWithSkeleton path={r.fullName} alt={r.fullName} />
                                </Box>
                                <Box sx={{ minWidth: 0 }}>
                                    <Typography variant="body2" fontWeight={700} noWrap title={r.fullName}>
                                        {r.fullName}
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary" noWrap title={r.username}>
                                        @{r.username}
                                    </Typography>
                                </Box>
                            </Stack>
                        );
                    }

                    const o = row.original as AnyRow;

                    if ((o as ShiftChildRow).kind === 'shift') {
                        const s = o as ShiftChildRow;
                        return (
                            <Stack direction="row" spacing={1.25} alignItems="center" sx={{ minWidth: 0 }}>
                                <IconBox title="Shift"><AccessTimeRounded fontSize="small" /></IconBox>
                                <Typography variant="body2" fontWeight={600} noWrap title={s.name}>
                                    Shift: {s.name}
                                </Typography>
                            </Stack>
                        );
                    }

                    if ((o as BranchChildRow).kind === 'branch') {
                        const b = o as BranchChildRow;
                        return (
                            <Stack direction="row" spacing={1.25} alignItems="center" sx={{ minWidth: 0 }}>
                                <IconBox title="Branch"><StorefrontRounded fontSize="small" /></IconBox>
                                <Typography variant="body2" fontWeight={600} noWrap title={b.name}>
                                    {b.name}
                                </Typography>
                            </Stack>
                        );
                    }

                    const r = o as RoleChildRow;
                    return (
                        <Stack direction="row" spacing={1.25} alignItems="center" sx={{ minWidth: 0 }}>
                            <IconBox title="Role"><AdminPanelSettingsRounded fontSize="small" /></IconBox>
                            <Typography variant="body2" fontWeight={600} noWrap title={r.name}>
                                {r.name}
                            </Typography>
                        </Stack>
                    );
                },
                muiTableBodyCellProps: ({ row }) =>
                    row.depth === 0 ? {} : ({ sx: { borderLeft: (t) => `3px solid ${t.palette.divider}` } }),
            },

            // DESCRIPTION (parent: created at; branch: address; role: description; shift: range + status)
            {
                id: 'description',
                header: 'DESCRIPTION',
                size: 360,
                Cell: ({ row }) => {
                    if (row.depth === 0) {
                        const r = row.original as AccountParentRow;
                        return (
                            <Typography variant="body2" color="text.secondary" noWrap title={fmtDateTime(r.createdAt)}>
                                Created: {fmtDateTime(r.createdAt)}
                            </Typography>
                        );
                    }
                    const o = row.original as AnyRow;

                    if ((o as ShiftChildRow).kind === 'shift') {
                        const s = o as ShiftChildRow;
                        return (
                            <Stack direction="row" spacing={1}>
                                <Chip size="small" variant="outlined" icon={<AccessTimeRounded />} label={`${s.start}–${s.end}`} sx={{ borderRadius: 2 }} />
                                <Chip size="small" label={s.status ? 'Active' : 'Inactive'} color={s.status ? 'success' : 'default'} variant="outlined" sx={{ borderRadius: 2 }} />
                            </Stack>
                        );
                    }

                    if ((o as BranchChildRow).kind === 'branch') {
                        const b = o as BranchChildRow;
                        return (
                            <Typography variant="body2" color="text.secondary" noWrap title={b.address ?? ''}>
                                {b.address ?? '—'}
                            </Typography>
                        );
                    }

                    const r = o as RoleChildRow;
                    return (
                        <Typography variant="body2" color="text.secondary" noWrap title={r.description ?? ''}>
                            {r.description ?? '—'}
                        </Typography>
                    );
                },
            },

            // COUNTS (parent) / CONTACT (branch) / CODE (role) / BRANCHES (shift)
            {
                id: 'countsOrContactOrCode',
                header: 'COUNTS / CONTACT / CODE',
                size: 360,
                Cell: ({ row }) => {
                    if (row.depth === 0) {
                        const r = row.original as AccountParentRow;
                        return (
                            <Stack direction="row" spacing={1}>
                                {r.hasShift && <Chip size="small" icon={<AccessTimeRounded />} variant="outlined" label="1 Shift" sx={{ borderRadius: 2 }} />}
                                <Chip size="small" icon={<StorefrontRounded />} variant="outlined" label={`${r.branchesCount} Branch`} sx={{ borderRadius: 2 }} />
                                <Chip size="small" icon={<PersonRounded />} variant="outlined" label={`${r.rolesCount} Role`} sx={{ borderRadius: 2 }} />
                            </Stack>
                        );
                    }
                    const o = row.original as AnyRow;

                    if ((o as ShiftChildRow).kind === 'shift') {
                        const s = o as ShiftChildRow;
                        const joined = s.branches.join(' • ') || '—';
                        return (
                            <Typography variant="body2" noWrap title={joined}>
                                {joined}
                            </Typography>
                        );
                    }

                    if ((o as BranchChildRow).kind === 'branch') {
                        const b = o as BranchChildRow;
                        const contact = [b.phone, b.email, b.corporation ? `(${b.corporation})` : ''].filter(Boolean).join(' • ') || '—';
                        return (
                            <Typography variant="body2" noWrap title={contact}>
                                {contact}
                            </Typography>
                        );
                    }

                    const r = o as RoleChildRow;
                    return <Chip size="small" variant="outlined" label={r.code} sx={{ borderRadius: 2 }} />;
                },
            },

            // STATUS (role only; shift status sudah di kolom description)
            {
                id: 'status',
                header: 'STATUS',
                size: 120,
                Cell: ({ row }) => {
                    if (row.depth === 0) return <Typography variant="body2" color="text.disabled" textAlign="center">—</Typography>;
                    const o = row.original as AnyRow;
                    if ((o as RoleChildRow).kind !== 'role') return <Typography variant="body2" color="text.disabled" textAlign="center">—</Typography>;
                    const r = o as RoleChildRow;
                    return (
                        <Chip
                            size="small"
                            label={r.status ? 'Active' : 'Inactive'}
                            color={r.status ? 'success' : 'default'}
                            variant="outlined"
                            sx={{ borderRadius: 2 }}
                        />
                    );
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
        data: rows as AnyRow[], // parent = AccountParentRow, child = BranchChildRow | RoleChildRow | ShiftChildRow
        enableExpanding: true,
        enableExpandAll: false,
        filterFromLeafRows: true,
        getSubRows: (row: AnyRow) => hasSubRows(row) ? row.subRows : undefined,
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
                    <Typography variant="overline" color="text.secondary">Config / Accounts</Typography>
                    {loading ? (
                        <Typography variant="body2" color="text.secondary">Loading…</Typography>
                    ) : error ? (
                        <Typography variant="body2" color="error.main">{error}</Typography>
                    ) : null}
                </Box>
                <Stack direction="row" spacing={1}>
                    <Button variant="outlined" onClick={fetchAccounts}>Refresh</Button>
                    <NewAccountModal
                        triggerLabel="Tambah Account"
                        onCreated={() => fetchAccounts()}
                    />
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
