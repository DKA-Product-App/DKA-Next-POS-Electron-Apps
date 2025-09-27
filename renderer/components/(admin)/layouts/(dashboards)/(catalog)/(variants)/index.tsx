'use client';

import * as React from 'react';
import {
    Avatar,
    Box,
    Button,
    Stack,
    Typography,
} from '@mui/material';
import AddRounded from '@mui/icons-material/AddRounded';

import {
    DataTable,
    Column,
} from './(components)/TablesLayoutConstructor';

/* ===== Types: sesuai bentuk response ===== */
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

type RowVariant = {
    id: string;
    productName: string;
    productImage?: string | null;
    variantCode: string;
    variantName: string;
    description?: string | null;
    price: number;
    productCell: React.ReactNode;
};

const toIDR = (v: string | number | null | undefined) => {
    const n = typeof v === 'string' ? Number(v) : v ?? 0;
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        maximumFractionDigits: 0,
    }).format(Number.isFinite(n) ? (n as number) : 0);
};

export default function CatalogProducts() {
    const [rows, setRows] = React.useState<RowVariant[]>([]);
    const [loading, setLoading] = React.useState(false);
    const [error, setError] = React.useState<string | null>(null);

    const fetchVariants = React.useCallback(() => {
        if (window.api === undefined) {
            console.error('Failed Get Window Api Bridge');
            setError('Bridge tidak tersedia');
            return;
        }
        setLoading(true);
        // ✅ ganti endpoint ke varian: setiap item = 1 varian (punya product di dalamnya)
        window.api
            .invoke('api.product.variant:read.all', {})
            .then((result: any) => {
                const data = (result?.data ?? []) as ApiVariant[];
                const mapped: RowVariant[] = data.map((v) => {
                    const p = v.product;
                    const priceNum = Number(v.price);
                    return {
                        id: v.id,
                        productName: p?.name ?? '-',
                        productImage: p?.image ?? null,
                        variantCode: v.code,
                        variantName: v.name,
                        description: v.description ?? p?.description ?? null,
                        price: Number.isFinite(priceNum) ? priceNum : 0,
                        productCell: (
                            <Stack direction="row" spacing={1.25} alignItems="center" sx={{ minWidth: 0 }}>
                                <Avatar
                                    src={p?.image || undefined}
                                    variant="rounded"
                                    sx={{ width: 32, height: 32, borderRadius: 1, bgcolor: 'background.neutral' }}
                                >
                                    {(p?.name?.[0] ?? 'P')}
                                </Avatar>
                                <Box sx={{ minWidth: 0 }}>
                                    <Typography variant="body2" fontWeight={600} noWrap title={p?.name}>
                                        {p?.name ?? '-'}
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary" noWrap title={v.name}>
                                        {v.code} — {v.name}
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
                setError(err?.msg ?? 'Gagal memuat varian. Periksa Koneksi Jaringan / Server');
            })
            .finally(() => setLoading(false));
    }, []);

    React.useEffect(() => {
        fetchVariants();
    }, [fetchVariants]);

    const columns: Column<RowVariant>[] = [
        {
            key: 'productCell',
            label: 'PRODUCT',
            sortable: true,
            width: 360,
            minWidth: 240,
            headerFilter: { type: 'text' },
        },
        {
            key: 'variantName',
            label: 'VARIANT',
            sortable: true,
            width: 200,
            minWidth: 160,
            headerFilter: { type: 'text' },
            render: (r) => `${r.variantName} (${r.variantCode})`,
        },
        {
            key: 'price',
            label: 'PRICE',
            sortable: true,
            align: 'right',
            width: 160,
            minWidth: 140,
            headerFilter: { type: 'text' },
            render: (r) => toIDR(r.price),
        },
        {
            key: 'description',
            label: 'DESCRIPTION',
            sortable: false,
            width: 180,
            minWidth: 160,
            headerFilter: { type: 'text' },
            render: (r) => (
                <Typography variant="body2" color="text.secondary" noWrap title={r.description ?? ''}>
                    {r.description ?? '—'}
                </Typography>
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
                        Catalog / Daftar Varian Produk
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

            <DataTable<RowVariant>
                columns={columns}
                rows={rows}
                initialRowsPerPage={15}
                enableSelection={false}
            />
        </Box>
    );
}
