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
import TableRestaurantRounded from '@mui/icons-material/TableRestaurantRounded';
import AddRounded from '@mui/icons-material/AddRounded';

import {
    MaterialReactTable,
    useMaterialReactTable,
    createMRTColumnHelper,
    type MRT_ColumnDef,
} from 'material-react-table';

/* ========= Types dari response ========= */
type ApiAccountRef = {
    id: string;
    name?: { first_name?: string; last_name?: string };
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
    reference?: ApiAccountRef;
};
type TableCoordinate = { x: number; y: number };
type TableDimension = { width: number; height: number; rotate: number };

type ApiFloorSlim = {
    id: string;
    code: string;
    name: string;
    status?: boolean;
    time_created?: string;
    time_updated?: string;
    reference?: ApiAccountRef;
};

type ApiTable = {
    id: string;
    code: string;
    name: string;
    shape: 'RECTANGLE' | 'CIRCLE' | 'ELLIPSE' | string;
    capacity: number;
    coordinate?: TableCoordinate;
    dimension?: TableDimension;
    state?: 'AVAILABLE' | 'OCCUPIED' | 'RESERVED' | string;
    status?: boolean;
    time_created?: string;
    time_updated?: string;
    reference?: ApiAccountRef;
    branches?: ApiBranch[];
    floor: ApiFloorSlim;
};

/* ========= Tree Row Types ========= */
/** Parent row: table */
type TableParentRow = {
    kind: 'table';
    id: string;
    code: string;
    name: string;
    state?: string;
    status: boolean;
    floorCode?: string | null;
    floorName?: string | null;
    branchName?: string | null;
    subRows?: TableChildRow[];
};
/** Child row: property details (coordinate, dimension, capacity, dll.) */
type TableChildRow = {
    kind: 'prop';
    id: string;
    label: 'Coordinate' | 'Dimension' | 'Capacity' | 'Shape' | 'Created' | 'Updated';
    value: string;
};

/* ========= Helpers ========= */
const fmtCoord = (c?: TableCoordinate) => (c ? `(${c.x}, ${c.y})` : '—');
const fmtDim = (d?: TableDimension) =>
    d ? `${d.width}×${d.height}${Number.isFinite(d.rotate) && d.rotate !== 0 ? ` • rot ${d.rotate}°` : ''}` : '—';

/* ========= Component ========= */
export default function TablesTree() {
    const column = createMRTColumnHelper<TableParentRow | TableChildRow>();

    const [rows, setRows] = React.useState<TableParentRow[]>([]);
    const [loading, setLoading] = React.useState(false);
    const [error, setError] = React.useState<string | null>(null);

    const fetchTables = React.useCallback(() => {
        if (!window.api) {
            console.error('Failed Get Window Api Bridge');
            setError('Bridge tidak tersedia');
            setRows([]);
            return;
        }
        setLoading(true);
        window.api
            .invoke('api.config.data.floors.tables:read.all', {})
            .then((result: any) => {
                const data = (result?.data ?? []) as ApiTable[];
                const mapped: TableParentRow[] = data.map((t) => {
                    const shape = t.shape ?? '—';
                    const capacity = Number.isFinite(t.capacity) ? t.capacity : '—';
                    const created = t.time_created ? new Date(t.time_created).toLocaleString('id-ID') : '—';
                    const updated = t.time_updated ? new Date(t.time_updated).toLocaleString('id-ID') : '—';

                    const subRows: TableChildRow[] = [
                        { kind: 'prop', id: `${t.id}-p1`, label: 'Coordinate', value: fmtCoord(t.coordinate) },
                        { kind: 'prop', id: `${t.id}-p2`, label: 'Dimension', value: fmtDim(t.dimension) },
                        { kind: 'prop', id: `${t.id}-p3`, label: 'Capacity', value: String(capacity) },
                        { kind: 'prop', id: `${t.id}-p4`, label: 'Shape', value: String(shape) },
                        { kind: 'prop', id: `${t.id}-p5`, label: 'Created', value: created },
                        { kind: 'prop', id: `${t.id}-p6`, label: 'Updated', value: updated },
                    ];

                    return {
                        kind: 'table',
                        id: t.id,
                        code: t.code,
                        name: t.name,
                        state: t.state ?? '—',
                        status: !!t.status,
                        floorCode: t.floor?.code ?? null,
                        floorName: t.floor?.name ?? null,
                        branchName: t.branches?.[0]?.name ?? null,
                        subRows,
                    };
                });
                setRows(mapped);
                setError(null);
            })
            .catch((err: any) => {
                console.error(err);
                setRows([]);
                setError(err?.msg ?? 'Gagal memuat tables. Periksa Koneksi Jaringan / Server');
            })
            .finally(() => setLoading(false));
    }, []);

    React.useEffect(() => { fetchTables(); }, [fetchTables]);

    /* ========= Columns (parent vs child rendering) ========= */
    const columns = React.useMemo<MRT_ColumnDef<TableParentRow | TableChildRow>[]>(
        () => [
            // TABLE / PROPERTY
            column.display({
                id: 'tableOrProp',
                header: 'TABLE / PROPERTY',
                size: 360,
                Cell: ({ row }) => {
                    if (row.depth === 0) {
                        const r = row.original as TableParentRow;
                        return (
                            <Stack direction="row" spacing={1.25} alignItems="center" sx={{ minWidth: 0 }}>
                                <Avatar variant="rounded" sx={{ width: 32, height: 32, borderRadius: 1 }}>
                                    <TableRestaurantRounded fontSize="small" />
                                </Avatar>
                                <Box sx={{ minWidth: 0 }}>
                                    <Typography variant="body2" fontWeight={600} noWrap title={r.code}>
                                        {r.code}
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary" noWrap title={r.name}>
                                        {r.name}
                                    </Typography>
                                </Box>
                            </Stack>
                        );
                    }
                    const p = row.original as TableChildRow;
                    return (
                        <Typography variant="body2" fontWeight={600} noWrap title={p.label}>
                            {p.label}
                        </Typography>
                    );
                },
                // garis vertikal halus untuk anak biar terlihat satu grup
                muiTableBodyCellProps: ({ row }) => row.depth === 0 ? {} : ({ sx: { borderLeft: (t) => `3px solid ${t.palette.divider}` } }),
            }),

            // FLOOR (hanya parent)
            column.display({
                id: 'floor',
                header: 'FLOOR',
                size: 220,
                Cell: ({ row }) => {
                    if (row.depth === 0) {
                        const r = row.original as TableParentRow;
                        return (
                            <Typography variant="body2" color="text.secondary" noWrap title={`${r.floorCode ?? ''} — ${r.floorName ?? ''}`.trim()}>
                                {r.floorCode ? `${r.floorCode} — ${r.floorName ?? ''}` : (r.floorName ?? '—')}
                            </Typography>
                        );
                    }
                    return <Typography variant="body2" color="text.disabled">—</Typography>;
                },
            }),

            // BRANCH (hanya parent)
            column.display({
                id: 'branch',
                header: 'BRANCH',
                size: 240,
                Cell: ({ row }) => {
                    if (row.depth === 0) {
                        const r = row.original as TableParentRow;
                        return (
                            <Typography variant="body2" color="text.secondary" noWrap title={r.branchName ?? ''}>
                                {r.branchName ?? '—'}
                            </Typography>
                        );
                    }
                    return <Typography variant="body2" color="text.disabled">—</Typography>;
                },
            }),

            // DETAIL (nilai dari property untuk child; parent bisa tampil ringkas atau —)
            column.display({
                id: 'detail',
                header: 'DETAIL',
                size: 260,
                Cell: ({ row }) => {
                    if (row.depth === 0) {
                        // parent: tampil ringkas info utama (opsional), di sini biarkan '—'
                        return <Typography variant="body2" color="text.disabled">—</Typography>;
                    }
                    const p = row.original as TableChildRow;
                    return (
                        <Typography variant="body2" noWrap title={p.value}>
                            {p.value}
                        </Typography>
                    );
                },
            }),

            // STATE (hanya parent)
            column.display({
                id: 'state',
                header: 'STATE',
                size: 140,
                Cell: ({ row }) => {
                    if (row.depth === 0) {
                        const r = row.original as TableParentRow;
                        return <Typography variant="body2" textAlign="center">{r.state ?? '—'}</Typography>;
                    }
                    return <Typography variant="body2" color="text.disabled" textAlign="center">—</Typography>;
                },
                muiTableBodyCellProps: { align: 'center' },
                muiTableHeadCellProps: { align: 'center' },
                muiTableFooterCellProps: { align: 'center' },
            }),

            // STATUS (hanya parent)
            column.display({
                id: 'status',
                header: 'STATUS',
                size: 120,
                Cell: ({ row }) => {
                    if (row.depth === 0) {
                        const r = row.original as TableParentRow;
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
            }),
        ],
        [column],
    );

    /* ========= MRT Instance (tree/subRows) ========= */
    const table = useMaterialReactTable({
        columns,
        data: rows as any,                 // parent = TableParentRow, child = TableChildRow
        enableExpanding: true,
        enableExpandAll: false,
        filterFromLeafRows: true,
        getSubRows: (row: TableParentRow | TableChildRow) => (row as TableParentRow).subRows as any,
        initialState: { density: 'comfortable' }, // default collapsed biar hemat layar
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
                    <Typography variant="overline" color="text.secondary">Config / Tables</Typography>
                    {loading ? (
                        <Typography variant="body2" color="text.secondary">Loading…</Typography>
                    ) : error ? (
                        <Typography variant="body2" color="error.main">{error}</Typography>
                    ) : null}
                </Box>
                <Stack direction="row" spacing={1}>
                    <Button variant="outlined" onClick={fetchTables}>Refresh</Button>
                    <Button variant="contained" startIcon={<AddRounded />} onClick={() => console.log('open create table')}>
                        Tambah Table
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
