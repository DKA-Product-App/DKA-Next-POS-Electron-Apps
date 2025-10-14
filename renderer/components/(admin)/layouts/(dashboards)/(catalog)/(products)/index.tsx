'use client';

import * as React from 'react';
import {
    Box,
    Button,
    Chip,
    Divider,
    IconButton,
    Paper,
    Popover,
    Stack,
    Tooltip,
    Typography,
    Avatar,
    List,
    ListItem,
    ListItemText,
} from '@mui/material';
import AddRounded from '@mui/icons-material/AddRounded';
import EditRounded from '@mui/icons-material/EditRounded';
import DeleteOutlineRounded from '@mui/icons-material/DeleteOutlineRounded';

import {
    MaterialReactTable,
    useMaterialReactTable,
    createMRTColumnHelper,
    MRT_ColumnDef,
} from 'material-react-table';

import PerfectScrollbar from 'react-perfect-scrollbar';
import 'react-perfect-scrollbar/dist/css/styles.css';

/* ==== External Modals (tetap) ==== */
import NewProductModal from './(components)/NewProductModal';
import EditProductModal from './(components)/EditProductModal';
import DeleteProduct from './(components)/DeleteProduct';
import {ImgWithSkeleton} from "../../../../../../utils/ImageProcessingIPC";
import {useGodModeProvider} from "../../../../context/GodModeProviderContext";

/* ==== Types ==== */
type Variant = { id: string; code: string; name: string; price: string | number };
type ProductWithVariants = {
    id: string;
    name: string;
    description?: string;
    image?: string | null;
    category?: Array<{ id: string; name: string }>;
    variants?: Variant[];
    status?: boolean;
};

const toIDR = (v: string | number | null | undefined) =>
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 })
        .format(Number.isFinite(typeof v === 'string' ? Number(v) : (v ?? 0)) ? Number(typeof v === 'string' ? Number(v) : (v ?? 0)) : 0);

export default function CatalogProductsMRT() {
    /* ==== Data ==== */
    const [products, setProducts] = React.useState<ProductWithVariants[]>([]);
    const [loading, setLoading] = React.useState(false);
    const { godMode, setGodMode } = useGodModeProvider();
    const [error, setError] = React.useState<string | null>(null);

    const fetchProducts = React.useCallback(() => {
        if (window.api === undefined) {
            console.error('Failed Get Window Api Bridge');
            setError('Bridge tidak tersedia');
            setProducts([]);
            return;
        }
        setLoading(true);
        window.api
            .invoke('api.product:read.all', {
                god_mode: godMode,
            })
            .then((result: any) => {
                const data = (result?.data ?? []) as ProductWithVariants[];
                setProducts(Array.isArray(data) ? data : []);
                setError(null);
            })
            .catch((err: any) => {
                console.error(err);
                setProducts([]);
                setError(err?.msg ?? 'Gagal memuat produk. Periksa Koneksi Jaringan / Server');
            })
            .finally(() => setLoading(false));
    }, [godMode]);

    React.useEffect(() => { fetchProducts(); }, [fetchProducts]);

    /* ==== Popover Varian (anchored) ==== */
    const [anchorEl, setAnchorEl] = React.useState<HTMLElement | null>(null);
    const [variantTitle, setVariantTitle] = React.useState<string>('');
    const [variantList, setVariantList] = React.useState<Variant[]>([]);

    const openVariants = React.useCallback((anchor: HTMLElement, productName: string, variants: Variant[]) => {
        setAnchorEl(anchor);
        setVariantTitle(productName);
        setVariantList(variants ?? []);
    }, []);

    const closeVariants = React.useCallback(() => {
        setAnchorEl(null);
        setVariantTitle('');
        setVariantList([]);
    }, []);

    /* ==== Columns (MRT) ==== */
    const columnHelper = createMRTColumnHelper<ProductWithVariants>();

    const columns = React.useMemo<MRT_ColumnDef<ProductWithVariants>[]>(
        () => [
            columnHelper.accessor('name', {
                header: 'PRODUCT',
                size: 360,
                enableColumnFilter: true,
                Cell: ({ row }) => {
                    const p = row.original;
                    return (
                        <Stack direction="row" spacing={1.25} alignItems="center" sx={{ minWidth: 0 }}>
                            <Box sx={{ width: 32, height: 32, borderRadius: 1, overflow: 'hidden', bgcolor: 'background.neutral' }}>
                                <ImgWithSkeleton path={p.image} alt={p.name} />
                            </Box>
                            <Box sx={{ minWidth: 0 }}>
                                <Typography variant="body2" fontWeight={600} noWrap title={p.name}>
                                    {p.name}
                                </Typography>
                                <Typography variant="caption" color="text.secondary" noWrap title={p.description}>
                                    {p.description || ' '}
                                </Typography>
                            </Box>
                        </Stack>
                    );
                },
            }),
            columnHelper.accessor((p) => p.category?.[0]?.name ?? '-', {
                id: 'category',
                header: 'CATEGORY',
                size: 160,
                enableColumnFilter: true,
            }),
            columnHelper.accessor(
                (p) => Math.min(...(p.variants ?? []).map(v => Number(v.price)).filter(n => Number.isFinite(n as number)), Infinity),
                {
                    id: 'priceMin',
                    header: 'PRICE (MIN)',
                    size: 160,
                    enableColumnFilter: true,
                    sortingFn: 'basic',
                    Cell: ({ cell }) => {
                        const v = cell.getValue<number>();
                        return <Typography variant="body2" textAlign="right" fontWeight={600}>{Number.isFinite(v) ? toIDR(v) : toIDR(0)}</Typography>;
                    },
                    muiTableBodyCellProps: { align: 'right' },
                    muiTableHeadCellProps: { align: 'right' },
                    muiTableFooterCellProps: { align: 'right' },
                },
            ),
            columnHelper.accessor((p) => p.variants?.length ?? 0, {
                id: 'variantsCount',
                header: 'VARIANTS',
                size: 140,
                enableColumnFilter: false,
                sortingFn: 'basic',
                Cell: ({ row }) => {
                    const p = row.original;
                    const count = p.variants?.length ?? 0;
                    const onClick = (e: React.MouseEvent<HTMLDivElement>) => {
                        e.stopPropagation();
                        openVariants(e.currentTarget as HTMLElement, p.name, p.variants ?? []);
                    };
                    return (
                        <Tooltip title="Klik untuk melihat semua varian">
                            <Chip
                                size="small"
                                variant="outlined"
                                label={count}
                                onClick={onClick}
                                sx={{ cursor: 'pointer', borderRadius: 2, minWidth: 44, justifyContent: 'center' }}
                            />
                        </Tooltip>
                    );
                },
                muiTableBodyCellProps: { align: 'center' },
                muiTableHeadCellProps: { align: 'center' },
                muiTableFooterCellProps: { align: 'center' },
            }),
            columnHelper.display({
                id: 'actions',
                header: 'ACTIONS',
                size: 160,
                Cell: ({ row }) => {
                    const p = row.original;
                    return (
                        <Stack direction="row" spacing={1} justifyContent="center">
                            <EditProductModal
                                productId={p.id}
                                trigger={
                                    <Tooltip title="Edit">
                                        <IconButton size="small" color="primary"><EditRounded fontSize="small" /></IconButton>
                                    </Tooltip>
                                }
                                onUpdated={fetchProducts}
                            />
                            <DeleteProduct
                                productId={p.id}
                                productName={p.name}
                                onDeleted={fetchProducts}
                            />
                        </Stack>
                    );
                },
                muiTableBodyCellProps: { align: 'center' },
                muiTableHeadCellProps: { align: 'center' },
                muiTableFooterCellProps: { align: 'center' },
                enableColumnFilter: false,
                enableSorting: false,
            }),
        ],
        [columnHelper, fetchProducts, openVariants],
    );

    /* ==== MRT Table Instance ==== */
    const table = useMaterialReactTable({
        columns,
        data: products,
        state: { showProgressBars: loading },
        initialState: { density: 'comfortable' },
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
                    <Typography variant="overline" color="text.secondary">Catalog / Daftar Produk</Typography>
                    {loading ? (
                        <Typography variant="body2" color="text.secondary">Loading…</Typography>
                    ) : error ? (
                        <Typography variant="body2" color="error.main">{error}</Typography>
                    ) : null}
                </Box>
                <Stack direction="row" spacing={1}>
                    <Button variant="outlined" onClick={fetchProducts}>Refresh</Button>
                    <NewProductModal
                        triggerLabel="Tambah Produk"
                        triggerProps={{ color: 'primary', startIcon: <AddRounded /> }}
                        onCreated={fetchProducts}
                    />
                </Stack>
            </Stack>
        ),
    });

    /* ==== Render ==== */
    const popoverOpen = Boolean(anchorEl);
    const popId = popoverOpen ? 'popover-variants' : undefined;

    return (
        <Paper variant="outlined" sx={{ p: 2, height: '100%', display: 'flex', flexDirection: 'column', minHeight: 0 }}>
            <Box sx={{ flex: 1, minHeight: 0, display: 'flex' }}>
                <MaterialReactTable table={table} />
            </Box>

            {/* Popover Varian */}
            <Popover
                id={popId}
                open={popoverOpen}
                anchorEl={anchorEl}
                onClose={closeVariants}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
                transformOrigin={{ vertical: 'top', horizontal: 'center' }}
                slotProps={{ paper: { sx: { width: 460, maxWidth: 'calc(100vw - 32px)', borderRadius: 2, overflow: 'hidden' } } }}
            >
                <Box sx={{
                    px: 2, py: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    backgroundColor: (t) => t.palette.background.paper, borderBottom: (t) => `1px solid ${t.palette.divider}`,
                }}>
                    <Typography variant="subtitle2">Varian — {variantTitle || '—'}</Typography>
                    <Chip size="small" variant="outlined" label={`${variantList.length} item`} sx={{ borderRadius: 2 }} />
                </Box>

                <Box sx={{ height: 360, width: '100%' }}>
                    <PerfectScrollbar option={{ suppressScrollX: false }}>
                        {variantList.length === 0 ? (
                            <Box sx={{ px: 2, py: 3 }}>
                                <Typography variant="body2" color="text.secondary">Tidak ada varian.</Typography>
                            </Box>
                        ) : (
                            <List dense disablePadding>
                                <ListItem
                                    disableGutters
                                    sx={{
                                        px: 1.5, py: 0.75, position: 'sticky', top: 0, zIndex: 1,
                                        backgroundColor: (t) => t.palette.background.paper, borderBottom: (t) => `1px solid ${t.palette.divider}`,
                                    }}
                                >
                                    <Typography variant="caption" sx={{ flex: 1, fontWeight: 700, color: 'text.secondary' }}>
                                        Code / Name
                                    </Typography>
                                    <Typography variant="caption" sx={{ width: 140, textAlign: 'right', fontWeight: 700, color: 'text.secondary' }}>
                                        Price
                                    </Typography>
                                </ListItem>

                                {variantList.map((v) => (
                                    <React.Fragment key={v.id}>
                                        <ListItem
                                            disableGutters
                                            sx={{ px: 1.5, py: 0.75, gap: 1.5, '&:hover': { backgroundColor: (t) => t.palette.action.hover } }}
                                        >
                                            <ListItemText
                                                primary={
                                                    <Stack direction="row" spacing={1} alignItems="center" sx={{ minWidth: 0 }}>
                                                        <Chip size="small" label={v.code} variant="outlined" sx={{ borderRadius: 2 }} />
                                                        <Typography variant="body2" fontWeight={600} noWrap title={v.name}>{v.name}</Typography>
                                                    </Stack>
                                                }
                                                secondary={null}
                                                sx={{ m: 0, flex: 1, minWidth: 0 }}
                                            />
                                            <Typography variant="body2" sx={{ width: 140, textAlign: 'right', fontWeight: 600 }}>
                                                {toIDR(v.price)}
                                            </Typography>
                                        </ListItem>
                                        <Divider sx={{ mx: 1.5 }} />
                                    </React.Fragment>
                                ))}
                            </List>
                        )}
                    </PerfectScrollbar>
                </Box>

                <Box sx={{ px: 1.5, py: 1, textAlign: 'right' }}>
                    <Button size="small" onClick={closeVariants}>Tutup</Button>
                </Box>
            </Popover>
        </Paper>
    );
}
