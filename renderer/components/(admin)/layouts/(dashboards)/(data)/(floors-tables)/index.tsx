'use client';

import * as React from 'react';
import {
    Avatar,
    Box,
    Button,
    Chip,
    Stack,
    Typography,
} from '@mui/material';
import TableRestaurantRounded from '@mui/icons-material/TableRestaurantRounded';
import AddRounded from '@mui/icons-material/AddRounded';

import {
    DataTable,
    Column,
} from './(components)/TablesLayoutConstructor';

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

/* ========= Row type untuk DataTable ========= */
type RowTable = {
    id: string;
    code: string;
    name: string;
    state?: string;
    status: boolean;
    floorCode?: string | null;
    floorName?: string | null;
    branchName?: string | null;
    shape?: string | null;
    capacity?: number | null;
    codeCell: React.ReactNode;
};

export default function Tables() {
    const [rows, setRows] = React.useState<RowTable[]>([]);
    const [loading, setLoading] = React.useState(false);
    const [error, setError] = React.useState<string | null>(null);

    const fetchTables = React.useCallback(() => {
        if (!window.api) {
            console.error('Failed Get Window Api Bridge');
            setError('Bridge tidak tersedia');
            return;
        }
        setLoading(true);
        window.api
            .invoke('api.config.data.floors.tables:read.all', {})
            .then((result: any) => {
                const data = (result?.data ?? []) as ApiTable[];
                const mapped: RowTable[] = data.map((t) => ({
                    id: t.id,
                    code: t.code,
                    name: t.name,
                    state: t.state ?? '—',
                    status: !!t.status,
                    floorCode: t.floor?.code ?? null,
                    floorName: t.floor?.name ?? null,
                    branchName: t.branches?.[0]?.name ?? null,
                    shape: t.shape ?? null,
                    capacity: Number.isFinite(t.capacity) ? t.capacity : null,
                    codeCell: (
                        <Stack direction="row" spacing={1.25} alignItems="center" sx={{ minWidth: 0 }}>
                            <Avatar variant="rounded" sx={{ width: 32, height: 32, borderRadius: 1 }}>
                                <TableRestaurantRounded fontSize="small" />
                            </Avatar>
                            <Box sx={{ minWidth: 0 }}>
                                <Typography variant="body2" fontWeight={600} noWrap title={t.code}>
                                    {t.code}
                                </Typography>
                                <Typography variant="caption" color="text.secondary" noWrap title={t.name}>
                                    {t.name}
                                </Typography>
                            </Box>
                        </Stack>
                    ),
                }));
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

    React.useEffect(() => {
        fetchTables();
    }, [fetchTables]);

    const columns: Column<RowTable>[] = [
        {
            key: 'codeCell',
            label: 'CODE / NAME',
            sortable: true,
            width: 320,
            minWidth: 220,
            headerFilter: { type: 'text' },
        },
        {
            key: 'floorName',
            label: 'FLOOR',
            sortable: true,
            width: 240,
            minWidth: 200,
            headerFilter: { type: 'text' },
            render: (r) => (
                <Typography variant="body2" color="text.secondary" noWrap title={`${r.floorCode ?? ''} — ${r.floorName ?? ''}`.trim()}>
                    {r.floorCode ? `${r.floorCode} — ${r.floorName ?? ''}` : (r.floorName ?? '—')}
                </Typography>
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
            key: 'shape',
            label: 'SHAPE • CAPACITY',
            sortable: true,
            width: 200,
            minWidth: 160,
            headerFilter: { type: 'text' },
            render: (r) => (
                <Typography variant="body2" noWrap title={`${r.shape ?? '—'} • ${r.capacity ?? '—'}`}>
                    <strong>{r.shape ?? '—'}</strong>{' '}•{' '}{r.capacity ?? '—'}
                </Typography>
            ),
        },
        {
            key: 'state',
            label: 'STATE',
            sortable: true,
            align: 'center',
            width: 140,
            minWidth: 120,
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
                        Config / Tables
                    </Typography>
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

            <DataTable<RowTable>
                columns={columns}
                rows={rows}
                initialRowsPerPage={15}
                enableSelection={false}
            />
        </Box>
    );
}
