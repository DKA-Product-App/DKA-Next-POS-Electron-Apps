'use client';

import * as React from 'react';
import {
    Avatar,
    Box,
    Button,
    Chip,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    FormControlLabel,
    IconButton,
    Paper,
    Stack,
    Switch,
    TextField,
    Tooltip,
    Typography,
} from '@mui/material';
import Grid2 from '@mui/material/Grid';
import AddRounded from '@mui/icons-material/AddRounded';
import EditRounded from '@mui/icons-material/EditRounded';
import DeleteOutlineRounded from '@mui/icons-material/DeleteOutlineRounded';
import TableRestaurantRounded from '@mui/icons-material/TableRestaurantRounded';

import {
    MaterialReactTable,
    useMaterialReactTable,
    createMRTColumnHelper,
    type MRT_ColumnDef,
} from 'material-react-table';
import SweetAlert2, { SweetAlert2Props } from 'react-sweetalert2';
import DeleteModal from './(components)/DeleteModal';
import {useGodModeProvider} from "../../../../context/GodModeProviderContext";

/* ====== API Types ====== */
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
};
type ApiFloor = {
    id: string;
    code: string;
    name: string;
    status?: boolean;
    time_created?: string;
    time_updated?: string;
    reference?: ApiAccountRef;
    branches?: ApiBranch[];
    tables?: ApiTable[];
};

/* ====== Tree Row Types ====== */
type TableRow = {
    kind: 'table';
    id: string;
    code: string;
    name: string;
    shape?: string | null;
    capacity?: number | null;
    state?: string | null;
    coordinate?: TableCoordinate;
    dimension?: TableDimension;
    status?: boolean;
};
type FloorRow = {
    kind: 'floor';
    id: string;
    code: string;
    name: string;
    status: boolean;
    branchName?: string | null;
    subRows?: TableRow[];
};

/* ====== Form ====== */
type FloorForm = { id?: string; code: string; name: string; status: boolean };
const emptyForm: FloorForm = { code: '', name: '', status: true };

export default function FloorsTree() {
    const column = createMRTColumnHelper<FloorRow | TableRow>();
    const { godMode } = useGodModeProvider();
    const [rows, setRows] = React.useState<FloorRow[]>([]);
    const [loading, setLoading] = React.useState(false);


    const fetchFloors = React.useCallback(() => {
        if (!window.api) {
            console.error('Failed Get Window Api Bridge');
            setRows([]);
            return;
        }
        setLoading(true);
        window.api
            .invoke('api.config.data.floors:read.all', {
                god_mode: godMode
            })
            .then((result: any) => {
                const data = (result?.data ?? []) as ApiFloor[];
                const mapped: FloorRow[] = data.map((f) => ({
                    kind: 'floor',
                    id: f.id,
                    code: f.code,
                    name: f.name,
                    status: !!f.status,
                    branchName: f.branches?.[0]?.name ?? null,
                    subRows: (f.tables ?? []).map<TableRow>((t) => ({
                        kind: 'table',
                        id: t.id,
                        code: t.code,
                        name: t.name,
                        shape: t.shape ?? null,
                        capacity: Number.isFinite(t.capacity) ? t.capacity : null,
                        state: t.state ?? null,
                        coordinate: t.coordinate,
                        dimension: t.dimension,
                        status: !!t.status,
                    })),
                }));
                setRows(mapped);
            })
            .catch((err: any) => {
                console.error(err);
                setRows([]);
            })
            .finally(() => setLoading(false));
    }, [godMode]);

    React.useEffect(() => {
        fetchFloors();
    }, [fetchFloors]);


    /* ====== Columns (Tree: Floor parent, Table child) ====== */
    const columns = React.useMemo<MRT_ColumnDef<FloorRow | TableRow>[]>(
        () => [
            // CODE / NAME (floor vs table)
            column.display({
                id: 'codeName',
                header: 'CODE / NAME',
                size: 360,
                Cell: ({ row }) => {
                    const depth = row.depth; // 0 floor, 1 table
                    if (depth === 0) {
                        const r = row.original as FloorRow;
                        return (
                            <Stack direction="row" spacing={1.25} alignItems="center" sx={{ minWidth: 0 }}>
                                <Avatar variant="rounded" sx={{ width: 32, height: 32, borderRadius: 1 }}>
                                    {r.code?.[0] ?? 'F'}
                                </Avatar>
                                <Box sx={{ minWidth: 0 }}>
                                    <Typography variant="body2" fontWeight={600} noWrap title={r.code}>{r.code}</Typography>
                                    <Typography variant="caption" color="text.secondary" noWrap title={r.name}>{r.name}</Typography>
                                </Box>
                            </Stack>
                        );
                    }
                    const t = row.original as TableRow;
                    const coord = t.coordinate ? `(${t.coordinate.x}, ${t.coordinate.y})` : '';
                    const dim = t.dimension ? `${t.dimension.width}×${t.dimension.height}${Number.isFinite(t.dimension.rotate) && t.dimension.rotate !== 0 ? ` • rot ${t.dimension.rotate}°` : ''}` : '';
                    return (
                        <Stack direction="row" spacing={1.25} alignItems="center" sx={{ minWidth: 0 }}>
                            <Avatar variant="rounded" sx={{ width: 28, height: 28, borderRadius: 1 }}>
                                <TableRestaurantRounded fontSize="small" />
                            </Avatar>
                            <Box sx={{ minWidth: 0 }}>
                                <Typography variant="body2" fontWeight={600} noWrap title={t.code}>{t.code}</Typography>
                                <Typography variant="caption" color="text.secondary" noWrap title={`${t.name}${coord || dim ? ` • ${coord}${coord && dim ? ' ' : ''}${dim}` : ''}`}>
                                    {t.name}{coord || dim ? <> • {coord}{coord && dim ? ' ' : ''}{dim}</> : null}
                                </Typography>
                            </Box>
                        </Stack>
                    );
                },
                muiTableBodyCellProps: ({ row }) =>
                    row.depth === 0 ? {} : { sx: { borderLeft: (t) => `3px solid ${t.palette.divider}` } },
            }),
            // BRANCH (only on floor)
            column.display({
                id: 'branch',
                header: 'BRANCH',
                size: 240,
                Cell: ({ row }) => {
                    if (row.depth === 0) {
                        const r = row.original as FloorRow;
                        return (
                            <Typography variant="body2" color="text.secondary" noWrap title={r.branchName ?? ''}>
                                {r.branchName ?? '—'}
                            </Typography>
                        );
                    }
                    return <Typography variant="body2" color="text.disabled">—</Typography>;
                },
            }),
            // SHAPE • CAPACITY (only table)
            column.display({
                id: 'shapeCap',
                header: 'SHAPE • CAPACITY',
                size: 180,
                Cell: ({ row }) => {
                    if (row.depth === 0) return <Typography variant="body2" color="text.disabled" textAlign="right">—</Typography>;
                    const t = row.original as TableRow;
                    const shape = t.shape ?? '—';
                    const cap = Number.isFinite(t.capacity as number) ? t.capacity : '—';
                    return <Typography variant="body2" textAlign="right"><strong>{shape}</strong>{' '}•{' '}{cap}</Typography>;
                },
                muiTableBodyCellProps: { align: 'right' },
                muiTableHeadCellProps: { align: 'right' },
                muiTableFooterCellProps: { align: 'right' },
            }),
            // STATUS / STATE
            column.display({
                id: 'statusState',
                header: 'STATUS / STATE',
                size: 160,
                Cell: ({ row }) => {
                    if (row.depth === 0) {
                        const r = row.original as FloorRow;
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
                    const t = row.original as TableRow;
                    return <Typography variant="body2" textAlign="center">{t.state ?? '—'}</Typography>;
                },
                muiTableBodyCellProps: { align: 'center' },
            }),
            // ACTIONS (only floor rows)
            column.display({
                id: 'actions',
                header: 'ACTIONS',
                size: 120,
                enableColumnFilter: false,
                enableSorting: false,
                Cell: ({ row }) => {
                    if (row.depth !== 0) return null;
                    const r = row.original as FloorRow;
                    return (
                        <Stack direction="row" spacing={0.5} justifyContent="flex-end">
                            <DeleteModal id={r.id} name={r.name} onDeleted={fetchFloors} />
                        </Stack>
                    );
                },
                muiTableBodyCellProps: { align: 'right' },
            }),
        ],
        [column],
    );

    /* ====== MRT (Tree with subRows) ====== */
    const table = useMaterialReactTable({
        columns,
        data: rows as any, // parent = FloorRow, child = TableRow
        enableExpanding: true,
        enableExpandAll: false,
        filterFromLeafRows: true,
        getSubRows: (row: FloorRow | TableRow) => (row as FloorRow).subRows as any,
        initialState: { expanded: true, density: 'compact' },
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
            <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ width: '100%', gap: 1, mb: 1.5 }}>
                <Box>
                    <Typography variant="overline" color="text.secondary">Config / Floors & Tables</Typography>
                </Box>
                <Stack direction="row" spacing={1}>
                    <Button variant="outlined" onClick={fetchFloors}>Refresh</Button>
                    { /** Create here **/}
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
