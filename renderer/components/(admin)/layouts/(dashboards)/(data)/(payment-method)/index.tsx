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
    Icon,
} from '@mui/material';
import AddRounded from '@mui/icons-material/AddRounded';
import StorefrontRounded from '@mui/icons-material/StorefrontRounded';

import {
    MaterialReactTable,
    useMaterialReactTable,
    type MRT_ColumnDef,
} from 'material-react-table';

/* ========= Types dari response ========= */
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

type ApiPaymentMethod = {
    id: string;
    icon?: string | null;       // e.g. "takeout_dining" (Material Symbols)
    name: string;               // e.g. "QRIS"
    description?: string | null;
    need_tender?: boolean;
    time_created?: string;
    time_updated?: string;
    status?: boolean;
    branches?: ApiBranch[];
};

/* ========= Tree Row Types ========= */
type BranchChildRow = {
    kind: 'branch';
    id: string;
    name: string;
    address?: string | null;
    phone?: string | null;
    email?: string | null;
};

type MethodParentRow = {
    kind: 'method';
    id: string;
    icon?: string | null;
    name: string;
    description?: string | null;
    needTender: boolean;
    status: boolean;
    subRows?: BranchChildRow[];
};

/* kecil-kecil lucu */
const initial = (s?: string | null) => (s?.trim()?.[0] ?? 'P').toUpperCase();

/* ========= Component ========= */
export default function PaymentMethodsTree() {
    const [rows, setRows] = React.useState<MethodParentRow[]>([]);
    const [loading, setLoading] = React.useState(false);
    const [error, setError] = React.useState<string | null>(null);

    const fetchPaymentMethods = React.useCallback(() => {
        if (!window.api) {
            console.error('Failed Get Window Api Bridge');
            setError('Bridge tidak tersedia');
            setRows([]);
            return;
        }
        setLoading(true);
        window.api
            .invoke('api.config.data.payment.method:read.all', {})
            .then((result: any) => {
                const data = (result?.data ?? []) as ApiPaymentMethod[];
                const mapped: MethodParentRow[] = data.map((m) => ({
                    kind: 'method',
                    id: m.id,
                    icon: m.icon ?? null,
                    name: m.name,
                    description: m.description ?? null,
                    needTender: !!m.need_tender,
                    status: !!m.status,
                    subRows: (m.branches ?? []).map<BranchChildRow>((b) => ({
                        kind: 'branch',
                        id: b.id,
                        name: b.name,
                        address: b.address ?? null,
                        phone: b.phone ?? null,
                        email: b.email ?? null,
                    })),
                }));
                setRows(mapped);
                setError(null);
            })
            .catch((err: any) => {
                console.error(err);
                setRows([]);
                setError(err?.msg ?? 'Gagal memuat payment methods. Periksa Koneksi Jaringan / Server');
            })
            .finally(() => setLoading(false));
    }, []);

    React.useEffect(() => { fetchPaymentMethods(); }, [fetchPaymentMethods]);

    /* ========= Columns (parent vs child rendering) ========= */
    const columns = React.useMemo<MRT_ColumnDef<MethodParentRow | BranchChildRow>[]>(
        () => [
            // METHOD / BRANCH
            {
                id: 'methodOrBranch',
                header: 'METHOD / BRANCH',
                size: 360,
                Cell: ({ row }) => {
                    if (row.depth === 0) {
                        const r = row.original as MethodParentRow;
                        return (
                            <Stack direction="row" spacing={1.25} alignItems="center" sx={{ minWidth: 0 }}>
                                <Avatar variant="rounded" sx={{ width: 32, height: 32, borderRadius: 1 }}>
                                    {r.icon ? <Icon fontSize="small">{r.icon}</Icon> : initial(r.name)}
                                </Avatar>
                                <Box sx={{ minWidth: 0 }}>
                                    <Typography variant="body2" fontWeight={600} noWrap title={r.name}>
                                        {r.name}
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary" noWrap title={r.description ?? ''}>
                                        {r.description ?? '—'}
                                    </Typography>
                                </Box>
                            </Stack>
                        );
                    }
                    const b = row.original as BranchChildRow;
                    return (
                        <Stack direction="row" spacing={1.25} alignItems="center" sx={{ minWidth: 0 }}>
                            <Avatar variant="rounded" sx={{ width: 28, height: 28, borderRadius: 1 }}>
                                <StorefrontRounded fontSize="small" />
                            </Avatar>
                            <Typography variant="body2" fontWeight={600} noWrap title={b.name}>
                                {b.name}
                            </Typography>
                        </Stack>
                    );
                },
                // garis vertikal halus untuk anak biar terlihat satu grup
                muiTableBodyCellProps: ({ row }) =>
                    row.depth === 0 ? {} : ({ sx: { borderLeft: (t) => `3px solid ${t.palette.divider}` } }),
            },

            // DESCRIPTION (parent only)
            {
                id: 'description',
                header: 'DESCRIPTION',
                size: 360,
                Cell: ({ row }) => {
                    if (row.depth !== 0) return <Typography variant="body2" color="text.disabled">—</Typography>;
                    const r = row.original as MethodParentRow;
                    return (
                        <Typography variant="body2" color="text.secondary" noWrap title={r.description ?? ''}>
                            {r.description ?? '—'}
                        </Typography>
                    );
                },
            },

            // NEED TENDER (parent) / CONTACT (child)
            {
                id: 'needTenderOrContact',
                header: 'NEED TENDER / CONTACT',
                size: 240,
                Cell: ({ row }) => {
                    if (row.depth === 0) {
                        const r = row.original as MethodParentRow;
                        return (
                            <Chip
                                size="small"
                                label={r.needTender ? 'Yes' : 'No'}
                                color={r.needTender ? 'warning' : 'default'}
                                variant="outlined"
                                sx={{ borderRadius: 2 }}
                            />
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
                muiTableBodyCellProps: ({ row }) => (row.depth === 0 ? { align: 'center' } : {}),
                muiTableHeadCellProps: { align: 'center' },
                muiTableFooterCellProps: { align: 'center' },
            },

            // ADDRESS (child only)
            {
                id: 'address',
                header: 'ADDRESS',
                size: 300,
                Cell: ({ row }) => {
                    if (row.depth === 0) return <Typography variant="body2" color="text.disabled">—</Typography>;
                    const b = row.original as BranchChildRow;
                    return (
                        <Typography variant="body2" color="text.secondary" noWrap title={b.address ?? ''}>
                            {b.address ?? '—'}
                        </Typography>
                    );
                },
            },

            // STATUS (parent only)
            {
                id: 'status',
                header: 'STATUS',
                size: 120,
                Cell: ({ row }) => {
                    if (row.depth !== 0) return <Typography variant="body2" color="text.disabled" textAlign="center">—</Typography>;
                    const r = row.original as MethodParentRow;
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
        data: rows as any, // parent = MethodParentRow, child = BranchChildRow
        enableExpanding: true,
        enableExpandAll: false,
        filterFromLeafRows: true,
        getSubRows: (row: MethodParentRow | BranchChildRow) => (row as MethodParentRow).subRows as any,
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
                    <Typography variant="overline" color="text.secondary">Config / Payment Methods</Typography>
                    {loading ? (
                        <Typography variant="body2" color="text.secondary">Loading…</Typography>
                    ) : error ? (
                        <Typography variant="body2" color="error.main">{error}</Typography>
                    ) : null}
                </Box>
                <Stack direction="row" spacing={1}>
                    <Button variant="outlined" onClick={fetchPaymentMethods}>Refresh</Button>
                    <Button variant="contained" startIcon={<AddRounded />} onClick={() => console.log('open create payment method')}>
                        Tambah Method
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
