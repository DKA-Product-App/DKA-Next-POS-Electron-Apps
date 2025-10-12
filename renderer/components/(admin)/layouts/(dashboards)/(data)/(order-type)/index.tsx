'use client';

import * as React from 'react';
import {
    Avatar,
    Box,
    Button,
    Chip,
    Icon,
    Paper,
    Stack,
    Typography,
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

type ApiOrderType = {
    id: string;
    code: string;                 // e.g. DINE_IN
    name: string;                 // e.g. DINE IN
    icon?: string | null;         // e.g. "restaurant"
    description?: string | null;  // e.g. "Makan Di Tempat"
    required_table_select?: boolean;
    status?: boolean;
    time_created?: string;
    time_updated?: string;
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

type OrderTypeParentRow = {
    kind: 'type';
    id: string;
    code: string;
    name: string;
    icon?: string | null;
    description?: string | null;
    requiredTable: boolean;
    status: boolean;
    subRows?: BranchChildRow[];
};

/* util kecil */
const initial = (s?: string | null) => (s?.trim()?.[0] ?? 'O').toUpperCase();

export default function OrderTypesTree() {
    const [rows, setRows] = React.useState<OrderTypeParentRow[]>([]);
    const [loading, setLoading] = React.useState(false);
    const [error, setError] = React.useState<string | null>(null);

    const fetchOrderTypes = React.useCallback(() => {
        if (!window.api) {
            console.error('Failed Get Window Api Bridge');
            setError('Bridge tidak tersedia');
            setRows([]);
            return;
        }
        setLoading(true);
        window.api
            .invoke('api.config.data.order.type:read.all', {})
            .then((result: any) => {
                const data = (result?.data ?? []) as ApiOrderType[];
                const mapped: OrderTypeParentRow[] = data.map((o) => ({
                    kind: 'type',
                    id: o.id,
                    code: o.code,
                    name: o.name,
                    icon: o.icon ?? null,
                    description: o.description ?? null,
                    requiredTable: !!o.required_table_select,
                    status: !!o.status,
                    subRows: (o.branches ?? []).map<BranchChildRow>((b) => ({
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
                setError(err?.msg ?? 'Gagal memuat order types. Periksa Koneksi Jaringan / Server');
            })
            .finally(() => setLoading(false));
    }, []);

    React.useEffect(() => { fetchOrderTypes(); }, [fetchOrderTypes]);

    /* ========= Columns (parent vs child rendering) ========= */
    const columns = React.useMemo<MRT_ColumnDef<OrderTypeParentRow | BranchChildRow>[]>(
        () => [
            // ORDER TYPE / BRANCH
            {
                id: 'typeOrBranch',
                header: 'ORDER TYPE / BRANCH',
                size: 360,
                Cell: ({ row }) => {
                    if (row.depth === 0) {
                        const r = row.original as OrderTypeParentRow;
                        return (
                            <Stack direction="row" spacing={1.25} alignItems="center" sx={{ minWidth: 0 }}>
                                <Avatar variant="rounded" sx={{ width: 32, height: 32, borderRadius: 1 }}>
                                    {r.icon ? <Icon fontSize="small">{r.icon}</Icon> : initial(r.name)}
                                </Avatar>
                                <Box sx={{ minWidth: 0 }}>
                                    <Typography variant="body2" fontWeight={600} noWrap title={r.name}>
                                        {r.name}
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary" noWrap title={r.code}>
                                        {r.code}
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
                    const r = row.original as OrderTypeParentRow;
                    return (
                        <Typography variant="body2" color="text.secondary" noWrap title={r.description ?? ''}>
                            {r.description ?? '—'}
                        </Typography>
                    );
                },
            },

            // REQUIRED TABLE (parent) / CONTACT (child)
            {
                id: 'requiredOrContact',
                header: 'REQUIRED TABLE / CONTACT',
                size: 260,
                Cell: ({ row }) => {
                    if (row.depth === 0) {
                        const r = row.original as OrderTypeParentRow;
                        return (
                            <Chip
                                size="small"
                                label={r.requiredTable ? 'Yes' : 'No'}
                                color={r.requiredTable ? 'warning' : 'default'}
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
                size: 320,
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
                    const r = row.original as OrderTypeParentRow;
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
        data: rows as any, // parent = OrderTypeParentRow, child = BranchChildRow
        enableExpanding: true,
        enableExpandAll: false,
        filterFromLeafRows: true,
        getSubRows: (row: OrderTypeParentRow | BranchChildRow) => (row as OrderTypeParentRow).subRows as any,
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
                    <Typography variant="overline" color="text.secondary">Config / Order Types</Typography>
                    {loading ? (
                        <Typography variant="body2" color="text.secondary">Loading…</Typography>
                    ) : error ? (
                        <Typography variant="body2" color="error.main">{error}</Typography>
                    ) : null}
                </Box>
                <Stack direction="row" spacing={1}>
                    <Button variant="outlined" onClick={fetchOrderTypes}>Refresh</Button>
                    <Button variant="contained" startIcon={<AddRounded />} onClick={() => console.log('open create order type')}>
                        Tambah Order Type
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
