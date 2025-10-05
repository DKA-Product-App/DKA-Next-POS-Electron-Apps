'use client';

import * as React from 'react';
import {
    Avatar, Box, Button, Chip, Popover, Stack, Typography,
    List, ListItem, ListItemText, Divider, IconButton, Tooltip
} from '@mui/material';
import EditRounded from '@mui/icons-material/EditRounded';
import DeleteOutlineRounded from '@mui/icons-material/DeleteOutlineRounded';

import {
    DataTable,
    Column,
    useNonPassiveWheel,
} from './(components)/TablesLayoutConstructor';
import NewProductModal from './(components)/NewProductModal';
import EditProductModal from './(components)/EditProductModal';
import DeleteProduct from './(components)/DeleteProduct';

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

type RowProduct = {
    id: string;
    productName: string;
    productCell: React.ReactNode;
    category: string;
    priceMin: number;
    variantsCount: number;
    variants: Variant[];
};

const toIDR = (v: string | number | null | undefined) => {
    const n = typeof v === 'string' ? Number(v) : v ?? 0;
    return new Intl.NumberFormat('id-ID', {
        style: 'currency', currency: 'IDR', maximumFractionDigits: 0,
    }).format(Number.isFinite(n) ? (n as number) : 0);
};

export default function CatalogProducts() {
    const [rows, setRows] = React.useState<RowProduct[]>([]);
    const [loading, setLoading] = React.useState(false);
    const [error, setError] = React.useState<string | null>(null);

    // Popover varian
    const [variantAnchor, setVariantAnchor] = React.useState<HTMLElement | null>(null);
    const [variantTitle, setVariantTitle] = React.useState<string>('');
    const [variantList, setVariantList] = React.useState<Variant[]>([]);
    const listRef = React.useRef<HTMLDivElement>(null);
    useNonPassiveWheel(listRef);

    const openVariants = (e: React.MouseEvent<HTMLElement>, productName: string, variants: Variant[]) => {
        setVariantAnchor(e.currentTarget);
        setVariantTitle(productName);
        setVariantList(variants ?? []);
    };
    const closeVariants = () => {
        setVariantAnchor(null); setVariantTitle(''); setVariantList([]);
    };

    const fetchProducts = React.useCallback(() => {
        if (window.api === undefined) {
            console.error('Failed Get Window Api Bridge');
            setError('Bridge tidak tersedia');
            return;
        }
        setLoading(true);
        window.api
            .invoke('api.product:read.all', {})
            .then((result: any) => {
                const data = (result?.data ?? []) as ProductWithVariants[];
                const mapped: RowProduct[] = data.map((p) => {
                    const prices = (p.variants ?? []).map((v) => Number(v.price));
                    const min = prices.length ? Math.min(...prices) : 0;
                    const cat = p.category?.[0]?.name ?? '-';
                    return {
                        id: p.id,
                        productName: p.name,
                        productCell: (
                            <Stack direction="row" spacing={1.25} alignItems="center" sx={{ minWidth: 0 }}>
                                <Avatar
                                    src={p.image || undefined}
                                    variant="rounded"
                                    sx={{ width: 32, height: 32, borderRadius: 1, bgcolor: 'background.neutral' }}
                                >
                                    {p.name?.[0] ?? 'P'}
                                </Avatar>
                                <Box sx={{ minWidth: 0 }}>
                                    <Typography variant="body2" fontWeight={600} noWrap title={p.name}>
                                        {p.name}
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary" noWrap title={p.description}>
                                        {p.description || ' '}
                                    </Typography>
                                </Box>
                            </Stack>
                        ),
                        category: cat,
                        priceMin: min,
                        variantsCount: p.variants?.length ?? 0,
                        variants: p.variants ?? [],
                    };
                });
                setRows(mapped);
                setError(null);
            })
            .catch((err: any) => {
                console.error(err);
                setRows([]);
                setError(err?.msg ?? 'Gagal memuat produk. Periksa Koneksi Jaringan / Server');
            })
            .finally(() => setLoading(false));
    }, []);

    React.useEffect(() => { fetchProducts(); }, [fetchProducts]);

    const columns: Column<RowProduct>[] = [
        { key: 'productCell', label: 'PRODUCT', sortable: true, width: 360, minWidth: 240, headerFilter: { type: 'text' } },
        { key: 'category', label: 'CATEGORY', sortable: true, width: 160, minWidth: 140, headerFilter: { type: 'text' } },
        { key: 'priceMin', label: 'PRICE (MIN)', sortable: true, align: 'right', width: 160, minWidth: 140, headerFilter: { type: 'text' }, render: (r) => toIDR(r.priceMin) },
        {
            key: 'variantsCount',
            label: 'VARIANTS',
            sortable: true,
            align: 'center',
            width: 140,
            minWidth: 120,
            render: (r) => (
                <Button
                    size="small"
                    variant="outlined"
                    onClick={(e) => openVariants(e, r.productName, r.variants)}
                    sx={{ borderRadius: 2, minWidth: 0, px: 1.25 }}
                >
                    {r.variantsCount}
                </Button>
            ),
        },
        {
            key: 'actions',
            label: 'ACTIONS',
            width: 140,
            minWidth: 120,
            align: 'center',
            render: (r) => (
                <Stack direction="row" spacing={1} justifyContent="center">
                    <EditProductModal
                        productId={r.id}
                        trigger={
                            <Tooltip title="Edit">
                                <IconButton size="small" color="primary"><EditRounded fontSize="small" /></IconButton>
                            </Tooltip>
                        }
                        onUpdated={fetchProducts}
                    />
                    <DeleteProduct
                        productId={r.id}
                        productName={r.productName}
                        onDeleted={fetchProducts}
                        trigger={
                            <Tooltip title="Hapus">
                                <IconButton size="small" color="error"><DeleteOutlineRounded fontSize="small" /></IconButton>
                            </Tooltip>
                        }
                    />
                </Stack>
            )
        }
    ];

    return (
        <Box sx={{ p: 2, display: 'grid', gap: 2, height: '100%', minHeight: 0, gridTemplateRows: 'auto 1fr' }}>
            {/* Header & CTA */}
            <Stack direction="row" alignItems="center" justifyContent="space-between">
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
                        triggerProps={{ color: 'primary' }}
                        onCreated={fetchProducts}
                    />
                </Stack>
            </Stack>

            <DataTable<RowProduct>
                columns={columns}
                rows={rows}
                initialRowsPerPage={15}
                enableSelection={false}
            />

            {/* Popover Varian */}
            <Popover
                open={Boolean(variantAnchor)}
                anchorEl={variantAnchor}
                onClose={closeVariants}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
                transformOrigin={{ vertical: 'top', horizontal: 'center' }}
                PaperProps={{ sx: { width: 420, maxWidth: 'calc(100vw - 32px)', borderRadius: 2, overflow: 'hidden' } }}
            >
                <Box sx={{
                    px: 2, py: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    backgroundColor: (t) => t.palette.background.paper, borderBottom: (t) => `1px solid ${t.palette.divider}`,
                }}>
                    <Typography variant="subtitle2">Varian — {variantTitle}</Typography>
                    <Chip size="small" variant="outlined" label={`${variantList.length} item`} sx={{ borderRadius: 2 }} />
                </Box>

                <Box ref={listRef} sx={{ maxHeight: 360, overflow: 'auto', p: 1, pt: 0.5, minWidth: 320, touchAction: 'pan-y', overscrollBehavior: 'contain' }}>
                    {variantList.length === 0 ? (
                        <Box sx={{ px: 2, py: 3 }}><Typography variant="body2" color="text.secondary">Tidak ada varian.</Typography></Box>
                    ) : (
                        <List dense disablePadding>
                            <ListItem disableGutters sx={{
                                px: 1.5, py: 0.75, position: 'sticky', top: 0, zIndex: 1,
                                backgroundColor: (t) => t.palette.background.paper, borderBottom: (t) => `1px solid ${t.palette.divider}`,
                            }}>
                                <Typography variant="caption" sx={{ flex: 1, fontWeight: 700, color: 'text.secondary' }}>
                                    Code / Name
                                </Typography>
                                <Typography variant="caption" sx={{ width: 140, textAlign: 'right', fontWeight: 700, color: 'text.secondary' }}>
                                    Price
                                </Typography>
                            </ListItem>

                            {variantList.map((v) => (
                                <React.Fragment key={v.id}>
                                    <ListItem disableGutters sx={{ px: 1.5, py: 0.75, gap: 1.5, '&:hover': { backgroundColor: (t) => t.palette.action.hover } }}>
                                        <ListItemText
                                            primary={
                                                <Stack direction="row" spacing={1}>
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
                </Box>

                <Box sx={{ px: 1.5, py: 1, textAlign: 'right' }}>
                    <Button size="small" onClick={closeVariants}>Tutup</Button>
                </Box>
            </Popover>
        </Box>
    );
}
