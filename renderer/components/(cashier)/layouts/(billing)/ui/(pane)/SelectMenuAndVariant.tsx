'use client'

import React, { FC, useEffect, useState } from "react";
import {
    Box, Chip, MenuItem, Paper, Select,
    TextField, Stack, InputAdornment, IconButton,
    Button, Typography
} from "@mui/material";
import SearchRoundedIcon from '@mui/icons-material/SearchRounded'
import ClearRoundedIcon from '@mui/icons-material/ClearRounded'
import TuneRoundedIcon from '@mui/icons-material/TuneRounded'
import ErrorOutlineRoundedIcon from '@mui/icons-material/ErrorOutlineRounded'
import RefreshRoundedIcon from '@mui/icons-material/RefreshRounded'
import PerfectScrollbar from 'react-perfect-scrollbar'
import 'react-perfect-scrollbar/dist/css/styles.css'
import { useCartActions } from "../../context/CartContext";

import ProductCardSkeleton from "../(loading)/ShimmerLoadingProductCard"
import dynamic from "next/dynamic";
import ShiummerLoadingProductCategory from "../(loading)/ShimmerLoadingProductCategory";

const GRADIENT = "linear-gradient(90deg, #6366F1, #8B5CF6 35%, #EC4899)";

const ProductCard = dynamic(() => import('./components/ProductCard'), {
    loading: () => <ProductCardSkeleton />,
    ssr: false,
})

const ProductCategory = dynamic(() => import('./components/ProductCategory'), {
    loading: () => <ShiummerLoadingProductCategory/>,
    ssr: false,
})

const catIds = (p: any): string[] => {
    const c = p?.category ?? p?.categories ?? [];
    if (Array.isArray(c)) return c.map((x) => x?.id).filter(Boolean);
    return c?.id ? [c.id] : [];
};

const priceOf = (p: any): number => {
    const raw = p?.variants?.[0]?.price ?? (p as any)?.price ?? 0;
    const n = typeof raw === 'string' ? parseFloat(raw) : Number(raw);
    return Number.isFinite(n) ? n : 0;
};

export const SelectMenuAndVariant: FC = () => {
    const { add } = useCartActions()

    const [q, setQ] = React.useState('')
    const [tab, setTab] = React.useState(0)
    const [sortBy, setSortBy] = React.useState<'name-asc' | 'price-asc' | 'price-desc'>('name-asc')
    const [openVariant, setOpenVariant] = React.useState<Record<string, string>>({})
    const searchRef = React.useRef<HTMLInputElement>(null);

    const [products, setProducts] = useState<Array<any>>([]);
    const [productsCategories, setProductsCategories] = useState<Array<any>>([]);
    const [prodError, setProdError] = useState<{ code?: number; msg?: string } | null>(null);

    const fetchProducts = () => {
        window.api.invoke("api.product:read.all", {})
            .then((result: any) => {
                setProducts(result.data);
                setProdError(null);
                console.log(result);
            })
            .catch((err: any) => {
                console.error(err);
                setProducts([]);
                setProdError({
                    code: err?.code ?? err?.status ?? 0,
                    msg: err?.msg ?? err?.message ?? "Gagal memuat produk. Internetnya lagi mood swing?"
                });
            });
    }
    const fetchProductsCategory = () => {
        window.api.invoke("api.product.category:read.all", {})
            .then((result: any) => {
                setProductsCategories(result.data);
                console.log(result);
            })
            .catch((error) => {
                setProductsCategories([]);
                console.error(error);
            })
    }

    useEffect(() => {
        fetchProductsCategory();
    }, []);

    useEffect(() => {
        fetchProducts();
    }, [tab]);

    React.useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
                e.preventDefault()
                searchRef.current?.focus()
            }
            if (e.altKey) {
                const n = Number(e.key)
                if (!Number.isNaN(n)) {
                    const idx = Math.max(1, Math.min(productsCategories.length + 1, n)) - 1
                    setTab(idx)
                }
            }
        }
        window.addEventListener('keydown', onKey)
        return () => window.removeEventListener('keydown', onKey)
    }, [productsCategories.length])

    const activeCategoryId: string | null = tab === 0 ? null : productsCategories[tab - 1]?.id ?? null

    const counts = React.useMemo(() => {
        const map = new Map<string, number>()
        products.forEach(p => {
            const ids = catIds(p)
            if (ids.length === 0) map.set('__unit', (map.get('__unit') ?? 0) + 1)
            else ids.forEach(id => map.set(id, (map.get(id) ?? 0) + 1))
        })
        return map
    }, [products])

    const filteredBase = React.useMemo(
        () =>
            products.filter(p => {
                const passCat = !activeCategoryId || catIds(p).includes(activeCategoryId)
                const passQ = q.trim() === '' || String(p.name ?? '').toLowerCase().includes(q.toLowerCase())
                return passCat && passQ
            }),
        [products, activeCategoryId, q, tab]
    )

    const filtered = React.useMemo(() => {
        const arr = [...filteredBase]
        if (sortBy === 'name-asc') arr.sort((a, b) => String(a.name ?? '').localeCompare(String(b.name ?? '')))
        else {
            arr.sort((a, b) => {
                const da = priceOf(a), db = priceOf(b)
                return sortBy === 'price-asc' ? da - db : db - da
            })
        }
        return arr
    }, [filteredBase, sortBy])

    return (
        <Paper sx={{ height: '100%', overflow: 'hidden', display: 'flex', flexDirection: 'column' }} elevation={0}>
            {/* ===== Sticky header: search + tabs + sort */}
            <Box
                sx={{
                    position: 'sticky',
                    top: 0,
                    zIndex: 1,
                    bgcolor: 'background.paper',
                    borderBottom: '1px solid',
                    borderColor: 'divider',
                    p: 1,
                }}
            >
                <Box sx={{ height: 4, mb: 1, borderRadius: 1.5, background: GRADIENT, opacity: 0.9 }} />

                <Stack direction="row" spacing={1} alignItems="center">
                    <TextField
                        inputRef={searchRef}
                        value={q}
                        onChange={e => setQ(e.target.value)}
                        placeholder="Cari menu / Pilih Pesanan…"
                        fullWidth
                        size="small"
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position="start">
                                    <SearchRoundedIcon fontSize="small" />
                                </InputAdornment>
                            ),
                            endAdornment: q ? (
                                <InputAdornment position="end">
                                    <IconButton size="small" onClick={() => setQ('')} aria-label="Clear search">
                                        <ClearRoundedIcon fontSize="small" />
                                    </IconButton>
                                </InputAdornment>
                            ) : undefined
                        }}
                    />

                    <Select
                        variant="outlined"
                        size="small"
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value as any)}
                        sx={{ minWidth: 180, display: 'flex', alignItems: 'center', gap: 1, pl: 1 }}
                        renderValue={(v) => (
                            <Stack direction="row" spacing={1} alignItems="center">
                                <TuneRoundedIcon sx={{ fontSize: 18 }} />
                                <span>{v === 'name-asc' ? 'Nama (A → Z)' : v === 'price-asc' ? 'Harga (Termurah)' : 'Harga (Termahal)'}</span>
                            </Stack>
                        )}
                    >
                        <MenuItem value="name-asc">Nama (A → Z)</MenuItem>
                        <MenuItem value="price-asc">Harga (Termurah)</MenuItem>
                        <MenuItem value="price-desc">Harga (Termahal)</MenuItem>
                    </Select>
                </Stack>

                <ProductCategory
                    value={tab}
                    onChange={setTab}
                    categories={productsCategories as any}
                    counts={counts}
                    total={products.length}
                    indicatorGradient={GRADIENT}
                />
            </Box>

            {/* ===== Grid / Error container */}
            <PerfectScrollbar options={{ suppressScrollX: true }}>
                <Box
                    sx={{
                        p: 2,
                        overflowX: 'hidden',
                        position: 'relative',
                        '&::before': {
                            content: '""',
                            position: 'absolute',
                            inset: 0,
                            background:
                                'radial-gradient(1200px 220px at -10% -30%, rgba(99,102,241,0.12), transparent 55%), radial-gradient(1000px 180px at 110% -25%, rgba(236,72,153,0.10), transparent 55%)',
                            pointerEvents: 'none',
                        },
                    }}
                >
                    {prodError ? (
                        <Box sx={{ minHeight: 260, display: 'grid', placeItems: 'center' }}>
                            <Stack spacing={1.2} alignItems="center" sx={{ textAlign: 'center' }}>
                                <ErrorOutlineRoundedIcon color="error" sx={{ fontSize: 40 }} />
                                <Typography variant="h6" sx={{ fontWeight: 800 }}>Gagal memuat produk</Typography>
                                <Typography variant="body2" color="text.secondary">
                                    {prodError.msg || 'Terjadi kesalahan tak terduga. Coba cek koneksi atau servernya.'}
                                </Typography>
                                <Stack direction="row" spacing={1} sx={{ pt: 0.5 }}>
                                    <Button onClick={() => {
                                        fetchProductsCategory();
                                        fetchProducts();
                                    }} variant="contained" startIcon={<RefreshRoundedIcon />}>
                                        Coba lagi
                                    </Button>
                                </Stack>
                            </Stack>
                        </Box>
                    ) : (
                        <Box
                            sx={{
                                display: 'grid',
                                gridTemplateColumns: {
                                    xs: 'repeat(auto-fill, minmax(150px, 1fr))',
                                    sm: 'repeat(auto-fill, minmax(170px, 1fr))',
                                    md: 'repeat(auto-fill, minmax(190px, 1fr))',
                                    lg: 'repeat(auto-fill, minmax(210px, 1fr))',
                                },
                                gap: { xs: 2, sm: 2.5, md: 3 },
                                alignItems: 'stretch',
                            }}
                        >
                            {filtered.length === 0 ? (
                                <Box sx={{ gridColumn: '1 / -1', py: 6, textAlign: 'center' }}>
                                    <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>Tidak ada produk ditemukan</Typography>
                                    <Typography variant="body2" color="text.secondary">Coba ubah pencarian atau kategori.</Typography>
                                </Box>
                            ) : (
                                filtered.map((p: any) => (
                                    <ProductCard
                                        key={p.id}
                                        product={p}
                                        variantId={openVariant[p.id] ?? p.variants?.[0]?.id}
                                        onSelectVariant={(pid: string, vid: string | number) =>
                                            setOpenVariant(s => ({ ...s, [pid]: String(vid) }))
                                        }
                                        onAdd={(prod: any, variant: any) => add(prod, variant)}
                                        uploadsLoader={({ src }) => src}
                                        gradient={GRADIENT}
                                    />
                                ))
                            )}
                        </Box>
                    )}
                </Box>
            </PerfectScrollbar>
        </Paper>
    )
}

export default SelectMenuAndVariant
