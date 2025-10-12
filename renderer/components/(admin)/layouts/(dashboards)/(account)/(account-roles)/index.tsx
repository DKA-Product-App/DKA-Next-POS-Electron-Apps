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
import AdminPanelSettingsRounded from '@mui/icons-material/AdminPanelSettingsRounded';
import StorefrontRounded from '@mui/icons-material/StorefrontRounded';

import {
    MaterialReactTable,
    useMaterialReactTable,
    type MRT_ColumnDef,
} from 'material-react-table';
import {AccountsRole} from "../../../../../../types/account/accounts.roles.type";

/* ========= Types dari response ========= */
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
    branches?: ApiBranch[];
};

/* ========= Row types (tree) ========= */
type BranchChildRow = {
    kind: 'branch';
    id: string;
    name: string;
    address?: string | null;
    phone?: string | null;
    email?: string | null;
};

type RoleParentRow = {
    kind: 'role';
    id: string;
    code: string;
    name: string;
    description?: string | null;
    status: boolean;
    createdAt?: string | null;
    updatedAt?: string | null;
    branchesCount: number;
    subRows?: BranchChildRow[];
};

/* ========= Utils ========= */
const TZ = 'Asia/Makassar';
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

const hasSubRows = (row: unknown): row is RoleParentRow =>
    !!row && typeof row === 'object' && (row as RoleParentRow).kind === 'role' && Array.isArray((row as RoleParentRow).subRows);

/* ========= Komponen ========= */
export default function AccountRolesTable() {
    const [rows, setRows] = React.useState<RoleParentRow[]>([]);
    const [loading, setLoading] = React.useState(false);
    const [error, setError] = React.useState<string | null>(null);

    const fetchRoles = React.useCallback(() => {
        if (!window?.api?.invoke) {
            setError('Bridge tidak tersedia');
            setRows([]);
            return;
        }
        setLoading(true);
        window.api
            .invoke<any, { data: AccountsRole[] }>('api.account.role:read.all', {})
            .then(({ data }) => {
                const mapped: RoleParentRow[] = (Array.isArray(data) ? data : []).map((r) => {
                    const branchChildren: BranchChildRow[] = (r.branches ?? []).map((b) => ({
                        kind: 'branch',
                        id: b.id,
                        name: b.name,
                        address: b.address ?? null,
                        phone: b.phone ?? null,
                        email: b.email ?? null,
                    }));

                    return {
                        kind: 'role',
                        id: r.id,
                        code: r.code,
                        name: r.name,
                        description: r.description ?? null,
                        status: !!r.status,
                        createdAt: r.time_created ?? null,
                        updatedAt: r.time_updated ?? null,
                        branchesCount: branchChildren.length,
                        subRows: branchChildren,
                    };
                });
                setRows(mapped);
                setError(null);
            })
            .catch((err: any) => {
                console.error(err);
                setRows([]);
                setError(err?.msg ?? 'Gagal memuat roles. Periksa Koneksi Jaringan / Server');
            })
            .finally(() => setLoading(false));
    }, []);

    React.useEffect(() => { fetchRoles(); }, [fetchRoles]);

    /* ========= Columns ========= */
    type AnyRow = RoleParentRow | BranchChildRow;

    const columns = React.useMemo<MRT_ColumnDef<AnyRow>[]>(
        () => [
            // ROLE / BRANCH
            {
                id: 'roleOrBranch',
                header: 'ROLE / BRANCH',
                size: 360,
                Cell: ({ row }) => {
                    if (row.depth === 0) {
                        const r = row.original as RoleParentRow;
                        return (
                            <Stack direction="row" spacing={1.25} alignItems="center" sx={{ minWidth: 0 }}>
                                <Box sx={{ width: 28, height: 28, borderRadius: 1, bgcolor: 'background.neutral', display: 'grid', placeItems: 'center' }}>
                                    <AdminPanelSettingsRounded fontSize="small" />
                                </Box>
                                <Box sx={{ minWidth: 0 }}>
                                    <Typography variant="body2" fontWeight={700} noWrap title={`${r.code} — ${r.name}`}>
                                        {r.code} — {r.name}
                                    </Typography>
                                    {r.description ? (
                                        <Typography variant="caption" color="text.secondary" noWrap title={r.description ?? ''}>
                                            {r.description}
                                        </Typography>
                                    ) : null}
                                </Box>
                            </Stack>
                        );
                    }

                    const b = row.original as BranchChildRow;
                    return (
                        <Stack direction="row" spacing={1.25} alignItems="center" sx={{ minWidth: 0 }}>
                            <Box sx={{ width: 28, height: 28, borderRadius: 1, bgcolor: 'background.neutral', display: 'grid', placeItems: 'center' }}>
                                <StorefrontRounded fontSize="small" />
                            </Box>
                            <Typography variant="body2" fontWeight={600} noWrap title={b.name}>
                                {b.name}
                            </Typography>
                        </Stack>
                    );
                },
                muiTableBodyCellProps: ({ row }) =>
                    row.depth === 0 ? {} : ({ sx: { borderLeft: (t) => `3px solid ${t.palette.divider}` } }),
            },

            // STATUS (role only)
            {
                id: 'status',
                header: 'STATUS',
                size: 120,
                Cell: ({ row }) => {
                    if (row.depth !== 0) {
                        return <Typography variant="body2" color="text.disabled" textAlign="center">—</Typography>;
                    }
                    const r = row.original as RoleParentRow;
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

            // BRANCHES / CONTACT
            {
                id: 'branchesOrContact',
                header: 'BRANCHES / CONTACT',
                size: 320,
                Cell: ({ row }) => {
                    if (row.depth === 0) {
                        const r = row.original as RoleParentRow;
                        return (
                            <Stack direction="row" spacing={1}>
                                <Chip size="small" icon={<StorefrontRounded />} variant="outlined" label={`${r.branchesCount} Branch`} sx={{ borderRadius: 2 }} />
                            </Stack>
                        );
                    }
                    const b = row.original as BranchChildRow;
                    const contact = [b.phone, b.email].filter(Boolean).join(' • ') || '—';
                    return (
                        <Typography variant="body2" noWrap title={contact}>
                            {contact}
                        </Typography>
                    );
                },
            },

            // CREATED / UPDATED (role only)
            {
                id: 'createdUpdated',
                header: 'CREATED / UPDATED',
                size: 260,
                Cell: ({ row }) => {
                    if (row.depth !== 0) return <Typography variant="body2" color="text.disabled">—</Typography>;
                    const r = row.original as RoleParentRow;
                    return (
                        <Stack spacing={0.25}>
                            <Typography variant="caption" color="text.secondary" noWrap title={fmtDateTime(r.createdAt)}>
                                Created: {fmtDateTime(r.createdAt)}
                            </Typography>
                            <Typography variant="caption" color="text.secondary" noWrap title={fmtDateTime(r.updatedAt)}>
                                Updated: {fmtDateTime(r.updatedAt)}
                            </Typography>
                        </Stack>
                    );
                },
                enableSorting: false,
            },
        ],
        [],
    );

    /* ========= MRT Instance ========= */
    const table = useMaterialReactTable({
        columns,
        data: rows as AnyRow[],
        enableExpanding: true,
        enableExpandAll: false,
        filterFromLeafRows: true,
        getSubRows: (row: AnyRow) => hasSubRows(row) ? row.subRows : undefined,
        initialState: { density: 'comfortable' },
        paginateExpandedRows: false,

        // baseline template
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
                    <Typography variant="overline" color="text.secondary">Config / Account Roles</Typography>
                    {loading ? (
                        <Typography variant="body2" color="text.secondary">Loading…</Typography>
                    ) : error ? (
                        <Typography variant="body2" color="error.main">{error}</Typography>
                    ) : null}
                </Box>
                <Stack direction="row" spacing={1}>
                    <Button variant="outlined" onClick={fetchRoles}>Refresh</Button>
                    <Button variant="contained" startIcon={<AddRounded />} onClick={() => console.log('open create role')}>
                        Tambah Role
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
