'use client';

import * as React from 'react';
import {
    Box,
    Button,
    Paper,
    Stack,
    Typography,
    Tooltip,
    IconButton,
} from '@mui/material';
import AddRounded from '@mui/icons-material/AddRounded';
import EditRounded from '@mui/icons-material/EditRounded';
import DeleteOutlineRounded from '@mui/icons-material/DeleteOutlineRounded';

import {
    MaterialReactTable,
    useMaterialReactTable,
    type MRT_ColumnDef,
} from 'material-react-table';
import { ImgWithSkeleton } from '../../../../../../utils/ImageProcessingIPC';
import { ProductsVariants } from '../../../../../../types/product/products.variants.type';
import { Products } from '../../../../../../types/product/products.type';
import DeleteModal from "./(components)/DeleteModal";
import EditProductModal from "../(products)/(components)/EditProductModal";
import EditModal from "./(components)/EditModal";

type ProductRow = {
    id: string;
    product: Products;
    description?: string | null;
    subRows?: ProductsVariants[];
};

/* ====== Props opsional buat integrasi modal/API kamu ======
   - onAddVariant(product) dipanggil pas klik "Tambah Varian" di parent row
   - onEditVariant(variant) & onDeleteVariant(variant) dipanggil di child row
*/
type Props = {
    onAddVariant?: (product: Products) => void;
    onEditVariant?: (variant: ProductsVariants) => void;
    onDeleteVariant?: (variant: ProductsVariants) => void;
};

/* ===== Utils ===== */
const toIDR = (v: string | number | null | undefined) => {
    const n = typeof v === 'string' ? Number(v) : v ?? 0;
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 })
        .format(Number.isFinite(n) ? (n as number) : 0);
};

/** Type guard: parent rows punya subRows */
const hasSubRows = (row: unknown): row is ProductRow =>
    !!row && typeof row === 'object' && Array.isArray((row as ProductRow).subRows);

/** Cek child (variant) berdasarkan adanya field price */
const isVariant = (row: unknown): row is ProductsVariants =>
    !!row && typeof row === 'object' && (row as any).price !== undefined;

/* ===== Komponen ===== */
export default function CatalogProductsTree({
                                                onAddVariant,
                                                onEditVariant,
                                                onDeleteVariant,
                                            }: Props) {
    const [variants, setVariants] = React.useState<ProductsVariants[]>([]);
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
            .invoke<any, { data: ProductsVariants[] }>('api.product.variant:read.all', {})
            .then(({ data }) => {
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
                price: String(Number.isFinite(priceNum) ? priceNum : 0),
                product: p,
            } as ProductsVariants);
        });
        setRows(Object.values(map));
    }, [variants]);

    /* Columns */
    const columns = React.useMemo<MRT_ColumnDef<ProductsVariants | ProductRow>[]>(
        () => [
            {
                id: 'productVariant',
                header: 'PRODUCT / VARIANT',
                size: 420,
                Cell: ({ row }) => {
                    const depth = row.depth; // 0 = product (parent), 1 = variant (child)
                    if (depth === 0) {
                        const pRow = row.original as ProductRow;
                        const p = pRow.product;
                        return (
                            <Stack direction="row" spacing={1.25} alignItems="center" sx={{ minWidth: 0 }}>
                                <Box sx={{ width: 32, height: 32, borderRadius: 1, overflow: 'hidden', bgcolor: 'background.neutral' }}>
                                    <ImgWithSkeleton path={p?.image || undefined} alt={p?.name || 'Product'} />
                                </Box>
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
                    const vRow = row.original as ProductsVariants;
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
                muiTableBodyCellProps: ({ row }) => row.depth === 0 ? {} : ({
                    sx: { borderLeft: (t) => `3px solid ${t.palette.divider}` },
                }),
            },
            {
                id: 'price',
                header: 'PRICE',
                size: 160,
                accessorFn: (row) => (isVariant(row) ? Number(row.price) : Number.NaN),
                Cell: ({ row, cell }) => {
                    if (row.depth === 0) return <Typography variant="body2" color="text.disabled" textAlign="right">—</Typography>;
                    const val = Number(cell.getValue<number>());
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
                    if (isVariant(row)) return row?.description ?? '—';
                    const p = (row as ProductRow)?.product;
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
        data: rows as unknown as (ProductRow | ProductsVariants)[],
        enableExpanding: true,
        enableExpandAll: false,
        filterFromLeafRows: true,
        getSubRows: (row) => hasSubRows(row) ? row.subRows : undefined,
        paginateExpandedRows: false,

        /* ⬇️⬇️⬇️ INI KUNCI BIAR KOLUM AKSI MUNCUL ⬇️⬇️⬇️ */
        enableRowActions: true,                 // ✅ WAJIB biar actions column nongol
        renderRowActions: ({ row }) => {
            if (row.depth === 0) {
                const p = (row.original as ProductRow).product;
                return (
                    <Tooltip title="Tambah Varian">
                        <Button variant="outlined" size="small" startIcon={<AddRounded />} onClick={() => onAddVariant?.(p)}>
                            Variant
                        </Button>
                    </Tooltip>
                );
            }
            const v = row.original as ProductsVariants;
            return (
                <Stack direction="row" spacing={0.5}>
                    <EditModal
                        variantId={v.id}
                        trigger={
                            <Tooltip title="Edit">
                                <IconButton size="small" color="primary"><EditRounded fontSize="small" /></IconButton>
                            </Tooltip>
                        }
                        onUpdated={fetchVariants}
                    />
                    <DeleteModal
                        id={v?.id}
                        name={`${v?.name} - ${v?.product?.name}`}
                        onDeleted={fetchVariants}
                    />
                </Stack>
            );
        },
        positionActionsColumn: 'last',          // ✅ taruh di paling kanan
        displayColumnDefOptions: {
            'mrt-row-actions': { size: 120, grow: false }, // ✅ tanpa columnOrder (TS2353)
        },
        // (opsional) pastikan urutan kolom eksplisit
        initialState: {
            density: 'comfortable',
            columnOrder: ['productVariant', 'price', 'description', 'mrt-row-actions'],
        },
        /* baseline v2 mu */
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
