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
import PrintRounded from '@mui/icons-material/PrintRounded';
import AddRounded from '@mui/icons-material/AddRounded';

import {
    DataTable,
    Column,
    useNonPassiveWheel,
} from './(components)/TablesLayoutConstructor';

/* ========= Types sesuai response ========= */
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
};

type ApiPrinter = {
    id: string;
    name: string;
    description?: string | null;
    options?: {
        mode?: 'USB' | 'SERIAL' | 'NETWORK';
        port?: number;
        timeout?: number;
        ip_address?: string;
        // field lain kalau ada nanti gampang ditambah
    };
    time_created?: string;
    time_updated?: string;
    status?: boolean;
};

type ApiCategory = {
    id: string;
    name: string;             // = Category
    description?: string;     // = Description
    time_created?: string;
    time_updated?: string;
    status?: boolean;
    reference?: ApiAccountRef;
    branches?: ApiBranch[];
    printer?: ApiPrinter[];   // daftar printer terkait kategori
};

/* ========= Row type untuk tabel ========= */
type RowCategory = {
    id: string;
    category: string;
    description?: string | null;
    printersCount: number;
    printers: ApiPrinter[];
};


export default function ProductCategory() {
    const [rows, setRows] = React.useState<RowCategory[]>([]);
    const [loading, setLoading] = React.useState(false);
    const [error, setError] = React.useState<string | null>(null);

    // Popover Printers
    const [printerAnchor, setPrinterAnchor] = React.useState<HTMLElement | null>(null);
    const [printerTitle, setPrinterTitle] = React.useState<string>('');
    const [printerList, setPrinterList] = React.useState<ApiPrinter[]>([]);
    const listRef = React.useRef<HTMLDivElement>(null);
    useNonPassiveWheel(listRef);

    const openPrinters = (e: React.MouseEvent<HTMLElement>, categoryName: string, printers: ApiPrinter[]) => {
        setPrinterAnchor(e.currentTarget);
        setPrinterTitle(categoryName);
        setPrinterList(printers ?? []);
    };
    const closePrinters = () => {
        setPrinterAnchor(null);
        setPrinterTitle('');
        setPrinterList([]);
    };

    const fetchCategories = React.useCallback(() => {
        if (!window.api) {
            console.error('Failed Get Window Api Bridge');
            setError('Bridge tidak tersedia');
            return;
        }
        setLoading(true);
        window.api
            .invoke('api.product.category:read.all', {})
            .then((result: any) => {
                const data = (result?.data ?? []) as ApiCategory[];
                const mapped: RowCategory[] = data.map((c) => ({
                    id: c.id,
                    category: c.name,
                    description: c.description ?? null,
                    printersCount: c.printer?.length ?? 0,
                    printers: c.printer ?? [],
                }));
                setRows(mapped);
                setError(null);
            })
            .catch((err: any) => {
                console.error(err);
                setRows([]);
                setError(err?.msg ?? 'Gagal memuat kategori. Periksa Koneksi Jaringan / Server');
            })
            .finally(() => setLoading(false));
    }, []);

    React.useEffect(() => {
        fetchCategories();
    }, [fetchCategories]);

    const columns: Column<RowCategory>[] = [
        {
            key: 'category',
            label: 'CATEGORY',
            sortable: true,
            width: 280,
            minWidth: 200,
            headerFilter: { type: 'text' },
            render: (r) => (
                <Stack direction="row" spacing={1.25} alignItems="center" sx={{ minWidth: 0 }}>
                    <Avatar variant="rounded" sx={{ width: 32, height: 32, borderRadius: 1 }}>
                        {r.category?.[0] ?? 'C'}
                    </Avatar>
                    <Typography variant="body2" fontWeight={600} noWrap title={r.category}>
                        {r.category}
                    </Typography>
                </Stack>
            ),
        },
        {
            key: 'description',
            label: 'DESCRIPTION',
            sortable: false,
            width: 420,
            minWidth: 240,
            headerFilter: { type: 'text' },
            render: (r) => (
                <Typography variant="body2" color="text.secondary" noWrap title={r.description ?? ''}>
                    {r.description ?? '—'}
                </Typography>
            ),
        },
        {
            key: 'printersCount',
            label: 'PRINTERS',
            sortable: true,
            align: 'center',
            width: 140,
            minWidth: 120,
            render: (r) => (
                <Button
                    size="small"
                    variant="outlined"
                    onClick={(e) => openPrinters(e, r.category, r.printers)}
                    sx={{ borderRadius: 2, minWidth: 0, px: 1.25 }}
                    startIcon={<PrintRounded />}
                >
                    {r.printersCount}
                </Button>
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
                        Catalog / Product Categories
                    </Typography>
                    {loading ? (
                        <Typography variant="body2" color="text.secondary">Loading…</Typography>
                    ) : error ? (
                        <Typography variant="body2" color="error.main">{error}</Typography>
                    ) : null}
                </Box>
                <Stack direction="row" spacing={1}>
                    <Button variant="outlined" onClick={fetchCategories}>Refresh</Button>
                    <Button variant="contained" startIcon={<AddRounded />} onClick={() => console.log('open create category')}>
                        Tambah Kategori
                    </Button>
                </Stack>
            </Stack>

            {/* Data Table */}
            <DataTable<RowCategory>
                columns={columns}
                rows={rows}
                initialRowsPerPage={15}
                enableSelection={false}
            />

            {/* Popover Printers */}
            <Popover
                open={Boolean(printerAnchor)}
                anchorEl={printerAnchor}
                onClose={closePrinters}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
                transformOrigin={{ vertical: 'top', horizontal: 'center' }}
                PaperProps={{
                    sx: {
                        width: 480,
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
                    <Typography variant="subtitle2">Printers — {printerTitle}</Typography>
                    <Chip size="small" variant="outlined" label={`${printerList.length} item`} sx={{ borderRadius: 2 }} />
                </Box>

                {/* List Printer */}
                <Box
                    ref={listRef}
                    sx={{
                        maxHeight: 360,
                        overflow: 'auto',
                        p: 1,
                        pt: 0.5,
                        minWidth: 320,
                        touchAction: 'pan-y',
                        overscrollBehavior: 'contain',
                    }}
                >
                    {printerList.length === 0 ? (
                        <Box sx={{ px: 2, py: 3 }}>
                            <Typography variant="body2" color="text.secondary">Tidak ada printer.</Typography>
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
                                    Name / Description
                                </Typography>
                                <Typography variant="caption" sx={{ width: 200, textAlign: 'right', fontWeight: 700, color: 'text.secondary' }}>
                                    Mode • Address
                                </Typography>
                            </ListItem>

                            {printerList.map((p) => {
                                const mode = p.options?.mode ?? '—';
                                const addr = p.options?.ip_address ? `${p.options.ip_address}${p.options?.port ? `:${p.options.port}` : ''}` : '—';
                                return (
                                    <React.Fragment key={p.id}>
                                        <ListItem
                                            disableGutters
                                            sx={{
                                                px: 1.5,
                                                py: 0.75,
                                                gap: 1.25,
                                                '&:hover': { backgroundColor: (t) => t.palette.action.hover },
                                            }}
                                        >
                                            <ListItemAvatar>
                                                <Avatar variant="rounded" sx={{ width: 28, height: 28, borderRadius: 1 }}>
                                                    <PrintRounded fontSize="small" />
                                                </Avatar>
                                            </ListItemAvatar>
                                            <ListItemText
                                                primary={
                                                    <Stack direction="row" spacing={1} alignItems="center">
                                                        <Typography variant="body2" fontWeight={600} noWrap title={p.name}>
                                                            {p.name}
                                                        </Typography>
                                                        <Chip
                                                            size="small"
                                                            label={p.status ? 'Active' : 'Inactive'}
                                                            color={p.status ? 'success' : 'default'}
                                                            variant="outlined"
                                                            sx={{ borderRadius: 2 }}
                                                        />
                                                    </Stack>
                                                }
                                                secondary={
                                                    <Typography variant="caption" color="text.secondary" noWrap title={p.description ?? ''}>
                                                        {p.description ?? '—'}
                                                    </Typography>
                                                }
                                                sx={{ m: 0, flex: 1, minWidth: 0 }}
                                            />
                                            <Typography variant="body2" sx={{ width: 200, textAlign: 'right' }}>
                                                <strong>{mode}</strong>{addr !== '—' ? ` • ${addr}` : ''}
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
                    <Button size="small" onClick={closePrinters}>Tutup</Button>
                </Box>
            </Popover>
        </Box>
    );
}
