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
import TableRestaurantRounded from '@mui/icons-material/TableRestaurantRounded';
import AddRounded from '@mui/icons-material/AddRounded';

import {
    DataTable,
    Column,
    useNonPassiveWheel,
} from './(components)/TablesLayoutConstructor';

/* ====== API Types (disesuaikan dari response) ====== */
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

/* ====== Row type untuk DataTable ====== */
type RowFloor = {
    id: string;
    code: string;
    name: string;
    status: boolean;
    branchName?: string | null;
    tablesCount: number;
    tables: ApiTable[];
    codeCell: React.ReactNode;
};

export default function Floors() {
    const [rows, setRows] = React.useState<RowFloor[]>([]);
    const [loading, setLoading] = React.useState(false);
    const [error, setError] = React.useState<string | null>(null);

    // Popover tables
    const [tablesAnchor, setTablesAnchor] = React.useState<HTMLElement | null>(null);
    const [tablesTitle, setTablesTitle] = React.useState<string>('');
    const [tablesList, setTablesList] = React.useState<ApiTable[]>([]);
    const listRef = React.useRef<HTMLDivElement>(null);
    useNonPassiveWheel(listRef);

    const openTables = (e: React.MouseEvent<HTMLElement>, floorName: string, tables: ApiTable[]) => {
        setTablesAnchor(e.currentTarget);
        setTablesTitle(floorName);
        setTablesList(tables ?? []);
    };
    const closeTables = () => {
        setTablesAnchor(null);
        setTablesTitle('');
        setTablesList([]);
    };

    const fetchFloors = React.useCallback(() => {
        if (!window.api) {
            console.error('Failed Get Window Api Bridge');
            setError('Bridge tidak tersedia');
            return;
        }
        setLoading(true);
        window.api
            .invoke('api.config.data.floors:read.all', {})
            .then((result: any) => {
                const data = (result?.data ?? []) as ApiFloor[];
                const mapped: RowFloor[] = data.map((f) => {
                    const branchName = f.branches?.[0]?.name ?? null;
                    return {
                        id: f.id,
                        code: f.code,
                        name: f.name,
                        status: !!f.status,
                        branchName,
                        tablesCount: f.tables?.length ?? 0,
                        tables: f.tables ?? [],
                        codeCell: (
                            <Stack direction="row" spacing={1.25} alignItems="center" sx={{ minWidth: 0 }}>
                                <Avatar variant="rounded" sx={{ width: 32, height: 32, borderRadius: 1 }}>
                                    {f.code?.[0] ?? 'F'}
                                </Avatar>
                                <Box sx={{ minWidth: 0 }}>
                                    <Typography variant="body2" fontWeight={600} noWrap title={f.code}>
                                        {f.code}
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary" noWrap title={f.name}>
                                        {f.name}
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
                setError(err?.msg ?? 'Gagal memuat floors. Periksa Koneksi Jaringan / Server');
            })
            .finally(() => setLoading(false));
    }, []);

    React.useEffect(() => {
        fetchFloors();
    }, [fetchFloors]);

    const columns: Column<RowFloor>[] = [
        {
            key: 'codeCell',
            label: 'CODE / NAME',
            sortable: true,
            width: 320,
            minWidth: 220,
            headerFilter: { type: 'text' },
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
            key: 'tablesCount',
            label: 'TABLES',
            sortable: true,
            align: 'center',
            width: 140,
            minWidth: 120,
            render: (r) => (
                <Button
                    size="small"
                    variant="outlined"
                    onClick={(e) => openTables(e, `${r.code} — ${r.name}`, r.tables)}
                    sx={{ borderRadius: 2, minWidth: 0, px: 1.25 }}
                    startIcon={<TableRestaurantRounded />}
                >
                    {r.tablesCount}
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
                    <Typography variant="overline" color="text.secondary">
                        Config / Floors
                    </Typography>
                    {loading ? (
                        <Typography variant="body2" color="text.secondary">Loading…</Typography>
                    ) : error ? (
                        <Typography variant="body2" color="error.main">{error}</Typography>
                    ) : null}
                </Box>
                <Stack direction="row" spacing={1}>
                    <Button variant="outlined" onClick={fetchFloors}>Refresh</Button>
                    <Button variant="contained" startIcon={<AddRounded />} onClick={() => console.log('open create floor')}>
                        Tambah Floor
                    </Button>
                </Stack>
            </Stack>

            {/* Data Table */}
            <DataTable<RowFloor>
                columns={columns}
                rows={rows}
                initialRowsPerPage={15}
                enableSelection={false}
            />

            {/* Popover Tables */}
            <Popover
                open={Boolean(tablesAnchor)}
                anchorEl={tablesAnchor}
                onClose={closeTables}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
                transformOrigin={{ vertical: 'top', horizontal: 'center' }}
                PaperProps={{
                    sx: {
                        width: 560,
                        maxWidth: 'calc(100vw - 32px)',
                        borderRadius: 2,
                        overflow: 'hidden',
                    },
                }}
            >
                {/* Header Popover */}
                <Box
                    sx={{
                        px: 2,
                        py: 1,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        backgroundColor: (t) => t.palette.background.paper,
                        borderBottom: (t) => `1px solid ${t.palette.divider}`,
                    }}
                >
                    <Typography variant="subtitle2">Tables — {tablesTitle}</Typography>
                    <Chip size="small" variant="outlined" label={`${tablesList.length} item`} sx={{ borderRadius: 2 }} />
                </Box>

                {/* List Tables */}
                <Box
                    ref={listRef}
                    sx={{
                        maxHeight: 420,
                        overflow: 'auto',
                        p: 1,
                        pt: 0.5,
                        minWidth: 360,
                        touchAction: 'pan-y',
                        overscrollBehavior: 'contain',
                    }}
                >
                    {tablesList.length === 0 ? (
                        <Box sx={{ px: 2, py: 3 }}>
                            <Typography variant="body2" color="text.secondary">Tidak ada meja.</Typography>
                        </Box>
                    ) : (
                        <List dense disablePadding>
                            <ListItem
                                disableGutters
                                sx={{
                                    px: 1.5,
                                    py: 0.75,
                                    position: 'sticky',
                                    top: 0,
                                    zIndex: 1,
                                    backgroundColor: (t) => t.palette.background.paper,
                                    borderBottom: (t) => `1px solid ${t.palette.divider}`,
                                }}
                            >
                                <Typography variant="caption" sx={{ flex: 1, fontWeight: 700, color: 'text.secondary' }}>
                                    Code / Name
                                </Typography>
                                <Typography variant="caption" sx={{ width: 160, textAlign: 'right', fontWeight: 700, color: 'text.secondary' }}>
                                    Shape • Capacity
                                </Typography>
                                <Typography variant="caption" sx={{ width: 140, textAlign: 'right', fontWeight: 700, color: 'text.secondary' }}>
                                    State
                                </Typography>
                            </ListItem>

                            {tablesList.map((t) => {
                                const shape = t.shape ?? '—';
                                const capacity = Number.isFinite(t.capacity) ? t.capacity : '—';
                                const state = t.state ?? '—';
                                const coord =
                                    t.coordinate ? `(${t.coordinate.x}, ${t.coordinate.y})` : '';
                                const dim =
                                    t.dimension
                                        ? `${t.dimension.width}×${t.dimension.height}${Number.isFinite(t.dimension.rotate) && t.dimension.rotate !== 0 ? ` • rot ${t.dimension.rotate}°` : ''}`
                                        : '';

                                return (
                                    <React.Fragment key={t.id}>
                                        <ListItem
                                            disableGutters
                                            sx={{
                                                px: 1.5,
                                                py: 0.75,
                                                gap: 1.25,
                                                '&:hover': { backgroundColor: (th) => th.palette.action.hover },
                                            }}
                                        >
                                            <ListItemAvatar>
                                                <Avatar variant="rounded" sx={{ width: 28, height: 28, borderRadius: 1 }}>
                                                    <TableRestaurantRounded fontSize="small" />
                                                </Avatar>
                                            </ListItemAvatar>
                                            <ListItemText
                                                primary={
                                                    <Stack direction="row" spacing={1} alignItems="center" sx={{ minWidth: 0 }}>
                                                        <Typography variant="body2" fontWeight={600} noWrap title={t.code}>
                                                            {t.code}
                                                        </Typography>
                                                        <Typography variant="body2" color="text.secondary" noWrap title={t.name}>
                                                            — {t.name}
                                                        </Typography>
                                                    </Stack>
                                                }
                                                secondary={
                                                    (coord || dim) ? (
                                                        <Typography variant="caption" color="text.secondary" noWrap title={`${coord} ${dim}`.trim()}>
                                                            {coord}{coord && dim ? ' • ' : ''}{dim}
                                                        </Typography>
                                                    ) : null
                                                }
                                                sx={{ m: 0, flex: 1, minWidth: 0 }}
                                            />
                                            <Typography variant="body2" sx={{ width: 160, textAlign: 'right' }}>
                                                <strong>{shape}</strong>{' '}•{' '}{capacity}
                                            </Typography>
                                            <Typography variant="body2" sx={{ width: 140, textAlign: 'right' }}>
                                                {state}
                                            </Typography>
                                        </ListItem>
                                        <Divider sx={{ mx: 1.5 }} />
                                    </React.Fragment>
                                );
                            })}
                        </List>
                    )}
                </Box>

                <Box sx={{ px: 1.5, py: 1, textAlign: 'right' }}>
                    <Button size="small" onClick={closeTables}>Tutup</Button>
                </Box>
            </Popover>
        </Box>
    );
}
