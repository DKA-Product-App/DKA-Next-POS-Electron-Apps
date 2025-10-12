'use client';

import * as React from 'react';
import {
    Avatar,
    Box,
    Button,
    Paper,
    Stack,
    Typography,
} from '@mui/material';
import AddRounded from '@mui/icons-material/AddRounded';

import {
    MaterialReactTable,
    useMaterialReactTable,
    type MRT_ColumnDef,
} from 'material-react-table';

/* ===== Types dari API (tetap) ===== */
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

type ApiProductSlim = {
    id: string;
    name: string;
    description?: string | null;
    image?: string | null;
    status?: boolean;
    time_created?: string;
    time_updated?: string;
};

type ApiVariant = {
    id: string;
    code: string;
    name: string;
    description?: string | null;
    price: string | number;
    time_created?: string;
    time_updated?: string;
    reference?: ApiAccountRef;
    branches?: ApiBranch[];
    product: ApiProductSlim;
};

/* ===== Tree Types untuk MRT (parent Product -> subRows Variant) ===== */
type VariantRow = {
    id: string;
    code: string;
    name: string;
    description?: string | null;
    price: number;
};

type ProductRow = {
    id: string;
    product: ApiProductSlim;
    description?: string | null;
    subRows?: VariantRow[];
};

/* ===== Utils ===== */
const toIDR = (v: string | number | null | undefined) => {
    const n = typeof v === 'string' ? Number(v) : v ?? 0;
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 })
        .format(Number.isFinite(n) ? (n as number) : 0);
};

/* ===== Komponen ===== */
export default function CatalogProductsTree() {
    const [variants, setVariants] = React.useState<ApiVariant[]>([]);
    const [rows, setRows] = React.useState<ProductRow[]>([]);
    const [loading, setLoading] = React.useState(false);
    const [error, setError] = React.useState<string | null>(null);

    const fetchVariants = React.useCallback(() => {
        if (window.api === undefined) {
            console.error('Failed Get Window Api Bridge');
            setError('Bridge tidak tersedia');
            setVariants([]);
            setRows([]);
            return;
        }
        setLoading(true);
        window.api
            .invoke('api.product.variant:read.all', {})
            .then((result: any) => {
                const data = (result?.data ?? []) as ApiVariant[];
                setVariants(Array.isArray(data) ? data : []);
                setError(null);
            })
            .catch((err: any) => {
                console.error(err);
                setVariants([]);
                setRows([]);
                setError(err?.msg ?? 'Gagal memuat varian. Periksa Koneksi Jaringan / Server');
            })
            .finally(() => setLoading(false));
    }, []);

    React.useEffect(() => { fetchVariants(); }, [fetchVariants]);

    /* Map flat variants -> tree (ProductRow with subRows of VariantRow) */
    React.useEffect(() => {
        const map: Record<string, ProductRow> = {};
        variants.forEach(v => {
            const p = v.product;
            if (!p?.id) return;
            if (!map[p.id]) map[p.id] = { id: p.id, product: p, description: p.description ?? undefined, subRows: [] };
            const priceNum = Number(v.price);
            map[p.id].subRows!.push({
                id: v.id,
                code: v.code,
                name: v.name,
                description: v.description ?? p.description ?? null,
                price: Number.isFinite(priceNum) ? priceNum : 0,
            });
        });
        setRows(Object.values(map));
    }, [variants]);

    /* Columns:
       - Kolom 1 "PRODUCT / VARIANT": parent= product card; child= code + name (dua bagian)
       - Kolom 2 "PRICE": hanya tampil angka di child; parent tampil '-'
       - Kolom 3 "DESCRIPTION": fallback ke product desc; parent/child keduanya bisa tampil
    */
    const columns = React.useMemo<MRT_ColumnDef<ProductRow | VariantRow>[]>(
        () => [
            {
                id: 'productVariant',
                header: 'PRODUCT / VARIANT',
                size: 420,
                Cell: ({ row, table }) => {
                    const depth = row.depth; // 0 = product (parent), 1 = variant (child)
                    if (depth === 0) {
                        const pRow = row.original as ProductRow;
                        const p = pRow.product;
                        return (
                            <Stack direction="row" spacing={1.25} alignItems="center" sx={{ minWidth: 0 }}>
                                <Avatar
                                    src={p?.image || undefined}
                                    variant="rounded"
                                    sx={{ width: 32, height: 32, borderRadius: 1, bgcolor: 'background.neutral' }}
                                >
                                    {(p?.name?.[0] ?? 'P')}
                                </Avatar>
                                <Box sx={{ minWidth: 0 }}>
                                    <Typography variant="body2" fontWeight={700} noWrap title={p?.name}>
                                        {p?.name ?? '-'}
                                    </Typography>
                                    {p?.description ? (
                                        <Typography variant="caption" color="text.secondary" noWrap title={p.description}>
                                            {p.description}
                                        </Typography>
                                    ) : null}
                                </Box>
                            </Stack>
                        );
                    }
                    // child row (variant)
                    const vRow = row.original as unknown as VariantRow;
                    return (
                        <Stack direction="row" spacing={1.25} alignItems="center" sx={{ minWidth: 0 }}>
                            <Typography variant="caption" sx={{ px: 1, py: 0.25, border: (t) => `1px solid ${t.palette.divider}`, borderRadius: 1.5 }}>
                                {vRow.code}
                            </Typography>
                            <Typography variant="body2" fontWeight={600} noWrap title={vRow.name}>
                                {vRow.name}
                            </Typography>
                        </Stack>
                    );
                },
                // garis vertikal tipis untuk child rows biar "terlihat satu product"
                muiTableBodyCellProps: ({ row }) => row.depth === 0 ? {} : ({
                    sx: { borderLeft: (t) => `3px solid ${t.palette.divider}` },
                }),
            },
            {
                id: 'price',
                header: 'PRICE',
                size: 160,
                accessorFn: (row) => {
                    // parent (ProductRow) tidak punya price → NaN supaya sorting/format aman
                    const isChild = (row as any).price !== undefined;
                    return isChild ? (row as VariantRow).price : Number.NaN;
                },
                Cell: ({ row, cell }) => {
                    const depth = row.depth;
                    if (depth === 0) return <Typography variant="body2" color="text.disabled" textAlign="right">—</Typography>;
                    const val = cell.getValue<number>();
                    return <Typography variant="body2" textAlign="right" fontWeight={600}>{toIDR(Number.isFinite(val) ? val : 0)}</Typography>;
                },
                muiTableBodyCellProps: { align: 'right' },
                muiTableHeadCellProps: { align: 'right' },
                muiTableFooterCellProps: { align: 'right' },
                enableColumnFilter: true,
                sortingFn: 'basic',
            },
            {
                id: 'description',
                header: 'DESCRIPTION',
                size: 260,
                accessorFn: (row) => {
                    const isChild = (row as any).price !== undefined;
                    if (isChild) return (row as VariantRow).description ?? '—';
                    const p = (row as ProductRow).product;
                    return p?.description ?? '—';
                },
                Cell: ({ cell }) => (
                    <Typography variant="body2" color="text.secondary" noWrap title={String(cell.getValue() ?? '')}>
                        {String(cell.getValue() ?? '—')}
                    </Typography>
                ),
                enableSorting: false,
                enableColumnFilter: true,
            },
        ],
        [],
    );

    /* MRT Table Instance — tree mode (subRows) */
    const table = useMaterialReactTable({
        columns,
        data: rows as any, // tree: ProductRow[] parent, VariantRow[] child
        enableExpanding: true,
        enableExpandAll: false,
        filterFromLeafRows: true,
        getSubRows: (row: ProductRow | VariantRow) => (row as ProductRow).subRows as any,
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
                    <Typography variant="overline" color="text.secondary">
                        Catalog / Daftar Varian Produk (Grouped by Product)
                    </Typography>
                    {loading ? (
                        <Typography variant="body2" color="text.secondary">Loading…</Typography>
                    ) : error ? (
                        <Typography variant="body2" color="error.main">{error}</Typography>
                    ) : null}
                </Box>
                <Stack direction="row" spacing={1}>
                    <Button variant="outlined" onClick={fetchVariants}>Refresh</Button>
                    <Button variant="contained" startIcon={<AddRounded />} onClick={() => console.log('open modal')}>
                        Tambah Produk/Varian
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
