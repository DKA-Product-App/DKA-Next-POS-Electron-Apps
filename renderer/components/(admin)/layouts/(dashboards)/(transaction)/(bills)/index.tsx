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
    ListItemText,
    Popover,
    Stack,
    Typography,
} from '@mui/material';
import PrintRounded from '@mui/icons-material/PrintRounded';
import SettingsRounded from '@mui/icons-material/SettingsRounded';
import AddRounded from '@mui/icons-material/AddRounded';

import {
    DataTable,
    Column,
    useNonPassiveWheel,
} from './(components)/TablesLayoutConstructor';

/* ========= Types dari response ========= */
type ApiCorporation = {
    id: string;
    name: string;
    address?: string | null;
    phone?: string | null;
    email?: string | null;
    website?: string | null;
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
    reference?: any;
    corporation?: ApiCorporation;
};

type PrinterOptions = {
    mode?: 'USB' | 'SERIAL' | 'NETWORK' | string;
    port?: number;
    timeout?: number;
    ip_address?: string;
};

type ApiDevicePrinter = {
    id: string;
    name: string;
    description?: string | null;
    options?: PrinterOptions | null;
    time_created?: string;
    time_updated?: string;
    status?: boolean;
    reference?: any;
    branches?: ApiBranch[];
};

/* ========= Row type untuk DataTable ========= */
type RowDevicePrinter = {
    id: string;
    name: string;
    description?: string | null;
    branchName?: string | null;
    status: boolean;
    options?: PrinterOptions | null;
    deviceCell: React.ReactNode;
};

export default function DevicePrinters() {
    const [rows, setRows] = React.useState<RowDevicePrinter[]>([]);
    const [loading, setLoading] = React.useState(false);
    const [error, setError] = React.useState<string | null>(null);

    // Popover OPTIONS
    const [optAnchor, setOptAnchor] = React.useState<HTMLElement | null>(null);
    const [optTitle, setOptTitle] = React.useState<string>('');
    const [optData, setOptData] = React.useState<PrinterOptions | null | undefined>(null);
    const listRef = React.useRef<HTMLDivElement>(null);
    useNonPassiveWheel(listRef);

    const openOptions = (e: React.MouseEvent<HTMLElement>, name: string, options?: PrinterOptions | null) => {
        setOptAnchor(e.currentTarget);
        setOptTitle(name);
        setOptData(options ?? null);
    };
    const closeOptions = () => {
        setOptAnchor(null);
        setOptTitle('');
        setOptData(null);
    };

    const fetchPrinters = React.useCallback(() => {
        if (!window.api) {
            console.error('Failed Get Window Api Bridge');
            setError('Bridge tidak tersedia');
            return;
        }
        setLoading(true);
        window.api
            .invoke('api.config.device.printer:read.all', {})
            .then((result: any) => {
                const data = (result?.data ?? []) as ApiDevicePrinter[];
                const mapped: RowDevicePrinter[] = data.map((d) => ({
                    id: d.id,
                    name: d.name,
                    description: d.description ?? null,
                    branchName: d.branches?.[0]?.name ?? null,
                    status: !!d.status,
                    options: d.options ?? null,
                    deviceCell: (
                        <Stack direction="row" spacing={1.25} alignItems="center" sx={{ minWidth: 0 }}>
                            <Avatar variant="rounded" sx={{ width: 32, height: 32, borderRadius: 1 }}>
                                <PrintRounded fontSize="small" />
                            </Avatar>
                            <Box sx={{ minWidth: 0 }}>
                                <Typography variant="body2" fontWeight={600} noWrap title={d.name}>
                                    {d.name}
                                </Typography>
                                <Typography variant="caption" color="text.secondary" noWrap title={d.description ?? ''}>
                                    {d.description ?? '—'}
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
                setError(err?.msg ?? 'Gagal memuat device printers. Periksa Koneksi Jaringan / Server');
            })
            .finally(() => setLoading(false));
    }, []);

    React.useEffect(() => { fetchPrinters(); }, [fetchPrinters]);

    const columns: Column<RowDevicePrinter>[] = [
        {
            key: 'deviceCell',
            label: 'DEVICE',
            sortable: true,
            width: 320,
            minWidth: 240,
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
            key: 'options',
            label: 'OPTIONS',
            sortable: false,
            width: 180,
            minWidth: 150,
            align: 'center',
            render: (r) => {
                const label = r.options?.mode ?? '—';
                return (
                    <Button
                        size="small"
                        variant="outlined"
                        onClick={(e) => openOptions(e, r.name, r.options)}
                        sx={{ borderRadius: 2, minWidth: 0, px: 1.25 }}
                        startIcon={<SettingsRounded />}
                        disabled={!r.options}
                    >
                        {label}
                    </Button>
                );
            },
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
                    <Typography variant="overline" color="text.secondary">Devices / Printers</Typography>
                    {loading ? (
                        <Typography variant="body2" color="text.secondary">Loading…</Typography>
                    ) : error ? (
                        <Typography variant="body2" color="error.main">{error}</Typography>
                    ) : null}
                </Box>
                <Stack direction="row" spacing={1}>
                    <Button variant="outlined" onClick={fetchPrinters}>Refresh</Button>
                    <Button variant="contained" startIcon={<AddRounded />} onClick={() => console.log('open create device printer')}>
                        Tambah Printer
                    </Button>
                </Stack>
            </Stack>

            {/* DataTable */}
            <DataTable<RowDevicePrinter>
                columns={columns}
                rows={rows}
                initialRowsPerPage={15}
                enableSelection={false}
            />

            {/* Popover OPTIONS */}
            <Popover
                open={Boolean(optAnchor)}
                anchorEl={optAnchor}
                onClose={closeOptions}
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
                    <Typography variant="subtitle2">Options — {optTitle}</Typography>
                    <Chip
                        size="small"
                        variant="outlined"
                        label={optData?.mode ? String(optData.mode) : 'No Options'}
                        sx={{ borderRadius: 2 }}
                    />
                </Box>

                {/* Content */}
                <Box
                    ref={listRef}
                    sx={{ maxHeight: 320, overflow: 'auto', p: 1, pt: 0.5, minWidth: 320, touchAction: 'pan-y', overscrollBehavior: 'contain' }}
                >
                    {!optData ? (
                        <Box sx={{ px: 2, py: 3 }}>
                            <Typography variant="body2" color="text.secondary">Tidak ada opsi.</Typography>
                        </Box>
                    ) : (
                        <List dense disablePadding>
                            {[
                                { k: 'Mode', v: optData.mode ?? '—' },
                                { k: 'IP Address', v: optData.ip_address ?? '—' },
                                { k: 'Port', v: Number.isFinite(optData.port as number) ? String(optData.port) : '—' },
                                { k: 'Timeout (ms)', v: Number.isFinite(optData.timeout as number) ? String(optData.timeout) : '—' },
                            ].map((row, i) => (
                                <React.Fragment key={row.k}>
                                    <ListItem
                                        disableGutters
                                        sx={{ px: 1.5, py: 0.75, gap: 1.25, '&:hover': { backgroundColor: (t) => t.palette.action.hover } }}
                                    >
                                        <ListItemText
                                            primary={<Typography variant="body2" fontWeight={600}>{row.k}</Typography>}
                                            secondary={null}
                                            sx={{ m: 0 }}
                                        />
                                        <Typography variant="body2" sx={{ textAlign: 'right' }}>
                                            {row.v}
                                        </Typography>
                                    </ListItem>
                                    {i < 3 ? <Divider sx={{ mx: 1.5 }} /> : null}
                                </React.Fragment>
                            ))}
                        </List>
                    )}
                </Box>

                <Box sx={{ px: 1.5, py: 1, textAlign: 'right' }}>
                    <Button size="small" onClick={closeOptions}>Tutup</Button>
                </Box>
            </Popover>
        </Box>
    );
}
