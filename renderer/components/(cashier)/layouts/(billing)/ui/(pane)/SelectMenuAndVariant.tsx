'use client'

import React, {FC} from "react";
import Image, {ImageLoader} from 'next/image';
import {
    Box, Button, Chip, Divider, MenuItem, Paper, Select, Skeleton, Tab, Tabs,
    TextField, Typography, Stack, InputAdornment, IconButton
} from "@mui/material";
import AddRoundedIcon from '@mui/icons-material/AddRounded'
import LocalOfferRoundedIcon from '@mui/icons-material/LocalOfferRounded'
import CategoryRoundedIcon from '@mui/icons-material/CategoryRounded'
import SearchRoundedIcon from '@mui/icons-material/SearchRounded'
import ClearRoundedIcon from '@mui/icons-material/ClearRounded'
import TuneRoundedIcon from '@mui/icons-material/TuneRounded'
import PerfectScrollbar from 'react-perfect-scrollbar'
import 'react-perfect-scrollbar/dist/css/styles.css'

import {ProductsCategories} from "../../types/product.categories.type";
import {Products} from "../../types/products.type";
import {ProductsVariants} from "../../types/products.variants.type";
import { useCartActions } from "../../context/CartContext";

export interface SelectMenuAndVariantProps {
    product : Array<Products>;
    categories : readonly ProductsCategories[];
}

// ====== tokens dekorasi ======
const GRADIENT = "linear-gradient(90deg, #6366F1, #8B5CF6 35%, #EC4899)";

export const SelectMenuAndVariant : FC<SelectMenuAndVariantProps> = ({product, categories }) => {
    const { add } = useCartActions()

    const [q, setQ] = React.useState('')
    const [tab, setTab] = React.useState(0)
    const [sortBy, setSortBy] = React.useState<'name-asc' | 'price-asc' | 'price-desc'>('name-asc')
    const [openVariant, setOpenVariant] = React.useState<Record<string, string>>({})
    const searchRef = React.useRef<HTMLInputElement>(null)

    React.useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
                e.preventDefault()
                searchRef.current?.focus()
            }
            if (e.altKey) {
                const n = Number(e.key)
                if (!Number.isNaN(n)) {
                    const idx = Math.max(1, Math.min(categories.length + 1, n)) - 1
                    setTab(idx)
                }
            }
        }
        window.addEventListener('keydown', onKey)
        return () => window.removeEventListener('keydown', onKey)
    }, [categories.length])

    const activeCategory = tab === 0 ? 'All' : categories[tab - 1]

    const counts = React.useMemo(() => {
        const map = new Map<string, number>()
        product.forEach(p => {
            const id = p.category?.id ?? '__uncat'
            map.set(id, (map.get(id) ?? 0) + 1)
        })
        return map
    }, [product])

    const filteredBase = React.useMemo(
        () =>
            product.filter(p =>
                (activeCategory === 'All' || p.category?.id === (activeCategory as ProductsCategories).id) &&
                (q.trim() === '' || p.name.toLowerCase().includes(q.toLowerCase()))
            ),
        [product, activeCategory, q]
    )

    const filtered = React.useMemo(() => {
        const arr = [...filteredBase]
        if (sortBy === 'name-asc') {
            arr.sort((a, b) => a.name.localeCompare(b.name))
        } else {
            const priceOf = (p: Products) => p.variants?.[0]?.price ?? (p as any).price ?? 0
            arr.sort((a, b) => {
                const da = priceOf(a)
                const db = priceOf(b)
                return sortBy === 'price-asc' ? da - db : db - da
            })
        }
        return arr
    }, [filteredBase, sortBy])

    const rupiah = (n: number) =>
        new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n)

    const toUploadUrl = (s?: string) => {
        if (!s) return undefined
        if (/^(uploads|http|https):\/\//i.test(s)) return s
        return `uploads:///${s.replace(/^\/+/, '')}`
    }
    const uploadsLoader: ImageLoader = ({ src }) => src

    const ImgWithSkeleton: FC<{ src: string; alt: string; priority?: boolean }> = ({ src, alt, priority }) => {
        const [loaded, setLoaded] = React.useState(false)
        const [err, setErr] = React.useState(false)
        const finalSrc = err ? 'https://placehold.co/600x400/png?text=No%20Image' : src

        return (
            <Box sx={{ position: 'relative', width: '100%', aspectRatio: '4 / 3', bgcolor: 'action.hover', overflow: 'hidden' }}>
                {!loaded && <Skeleton variant="rectangular" sx={{ position: 'absolute', inset: 0 }} />}
                <Image
                    loader={uploadsLoader}
                    src={finalSrc}
                    alt={alt}
                    fill
                    unoptimized
                    loading={priority ? 'eager' : 'lazy'}
                    sizes="(max-width: 600px) 50vw, (max-width: 1200px) 25vw, 200px"
                    onLoad={() => setLoaded(true)}
                    onError={() => { setErr(true); setLoaded(true) }}
                    style={{ objectFit: 'cover', opacity: loaded ? 1 : 0, transition: 'opacity .2s ease' }}
                />
                {/* vignette halus */}
                <Box
                    sx={{
                        position: 'absolute', inset: 0, pointerEvents: 'none',
                        background: (t) =>
                            `linear-gradient(to bottom, ${t.palette.action.hover}00 0%, ${t.palette.action.hover}40 70%, ${t.palette.action.hover}66 100%)`,
                    }}
                />
            </Box>
        )
    }

    const placeholderOf = (p: Products) => toUploadUrl(p.image) ?? `https://placehold.co/600x400/png?text=${encodeURIComponent(p.name)}`

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
                {/* accent strip tipis di atas header */}
                <Box sx={{ height: 4, mb: 1, borderRadius: 1.5, background: GRADIENT, opacity: 0.9 }} />

                {/* Search + Sort */}
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
                        startAdornment={<TuneRoundedIcon sx={{ fontSize: 18, mr: 1 }} />}
                        sx={{ minWidth: 160 }}
                    >
                        <MenuItem value="name-asc">Nama (A → Z)</MenuItem>
                        <MenuItem value="price-asc">Harga (Termurah)</MenuItem>
                        <MenuItem value="price-desc">Harga (Termahal)</MenuItem>
                    </Select>
                </Stack>

                {/* Tabs kategori */}
                <Tabs
                    value={tab}
                    onChange={(_, v) => setTab(v)}
                    variant="scrollable"
                    allowScrollButtonsMobile
                    sx={{
                        mt: 1,
                        '.MuiTabs-indicator': { height: 3, borderRadius: 3, background: GRADIENT }, // indicator gradient
                        '.MuiTab-root': {
                            textTransform: 'none',
                            fontWeight: 700,
                            minHeight: 36,
                            px: 1.25,
                            '&:not(.Mui-selected)': { opacity: 0.85 }
                        }
                    }}
                >
                    <Tab
                        label={
                            <Stack direction="row" spacing={1} alignItems="center">
                                <span>All</span>
                                <Chip size="small" variant="outlined" label={product.length} />
                            </Stack>
                        }
                    />
                    {categories.map(c => (
                        <Tab
                            key={c.id}
                            label={
                                <Stack direction="row" spacing={1} alignItems="center">
                                    <span>{c.name}</span>
                                    <Chip size="small" variant="outlined" label={counts.get(c.id) ?? 0} />
                                </Stack>
                            }
                        />
                    ))}
                </Tabs>
            </Box>

            {/* ===== Grid list */}
            <PerfectScrollbar options={{ suppressScrollX: true }}>
                <Box
                    sx={{
                        p: 2,
                        overflowX: 'hidden',
                        position: 'relative',
                        // radial glow dekoratif di area list (lembut)
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
                        {filtered.map(p => {
                            const hasVariants = Array.isArray(p.variants) && p.variants.length > 0
                            const selectedVarId = openVariant[p.id] ?? p.variants?.[0]?.id
                            const selectedVar = p.variants?.find(v => v.id === selectedVarId)
                            const price = selectedVar?.price ?? (p as any).price ?? 0

                            return (
                                <Paper
                                    key={p.id}
                                    variant="outlined"
                                    sx={{
                                        borderRadius: 2,
                                        overflow: 'hidden',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        transition: (t) =>
                                            t.transitions.create(['transform','box-shadow','border-color'], {
                                                duration: t.transitions.duration.shorter,
                                            }),
                                        borderColor: 'divider',
                                        position: 'relative',
                                        background: (t) =>
                                            t.palette.mode === 'dark'
                                                ? t.palette.background.paper
                                                : `linear-gradient(180deg, ${t.palette.background.paper} 0%, ${t.palette.background.default} 100%)`,

                                        // dekor glow disiapin tapi default invisible
                                        '&::after': {
                                            content: '""',
                                            position: 'absolute',
                                            inset: -1,
                                            borderRadius: 8,
                                            background: GRADIENT,
                                            filter: 'blur(12px)',
                                            opacity: 0,
                                            transition: 'opacity .18s ease',
                                            zIndex: -1,
                                        },

                                        // HOVER: glow ungu HANYA di dark mode
                                        '&:hover': (t) => ({
                                            transform: 'translateY(-1px)',
                                            boxShadow: 4,
                                            borderColor: 'primary.main',
                                            ...(t.palette.mode === 'dark'
                                                ? { '&::after': { opacity: 0.8 } } // 🔥 glow aktif di dark
                                                : { '&::after': { opacity: 0 } }), // 🌤️ light: no glow
                                        }),
                                    }}
                                >
                                    {/* ...isi card... */}
                                    <Box sx={{ position: 'relative' }}>
                                        <ImgWithSkeleton src={placeholderOf(p)} alt={p.name} />
                                        {/* price chip dengan gradient */}
                                        <Chip
                                            size="small"
                                            icon={<LocalOfferRoundedIcon sx={{ fontSize: 16, color: 'inherit' }} />}
                                            label={rupiah(price)}
                                            sx={{
                                                position: 'absolute',
                                                bottom: 8,
                                                left: 8,
                                                color: '#fff',
                                                background: GRADIENT,
                                                boxShadow: 1,
                                                '& .MuiChip-icon': { color: 'inherit' }
                                            }}
                                        />
                                    </Box>

                                    <Box sx={{ p: 1.25, display: 'grid', gap: 0.5, flexGrow: 1 }}>
                                        <Typography
                                            title={p.name}
                                            variant="subtitle2"
                                            sx={{
                                                fontWeight: 700,
                                                lineHeight: 1.2,
                                                display: '-webkit-box',
                                                WebkitLineClamp: 2,
                                                WebkitBoxOrient: 'vertical',
                                                overflow: 'hidden'
                                            }}
                                        >
                                            {p.name}
                                        </Typography>

                                        <Stack direction="row" alignItems="center" spacing={0.5} sx={{ color: 'text.secondary' }}>
                                            <CategoryRoundedIcon sx={{ fontSize: 16 }} />
                                            <Typography variant="caption" sx={{ lineHeight: 1.4 }}>
                                                {p.category?.name ?? 'Uncategorized'}
                                            </Typography>
                                        </Stack>

                                        <Box sx={{ flexGrow: 1 }} />

                                        <Select
                                            size="small"
                                            variant="outlined"
                                            fullWidth
                                            value={hasVariants ? (selectedVarId ?? '') : ''}
                                            onChange={(e) => setOpenVariant((s) => ({ ...s, [p.id]: String(e.target.value) }))}
                                            displayEmpty
                                            disabled={!hasVariants}
                                            renderValue={(selected) => {
                                                if (!hasVariants || selected === '') {
                                                    return <span style={{ opacity: 0.7 }}>Tidak ada varian</span>;
                                                }
                                                const v = p.variants!.find((x) => String(x.id) === String(selected));
                                                return v ? `${v.code} — ${rupiah(v.price)}` : 'Pilih varian';
                                            }}
                                            sx={{ mt: 0.5, '.MuiSelect-select': { py: 1 } }}
                                        >
                                            {hasVariants ? (
                                                p.variants!.map((v) => (
                                                    <MenuItem key={v.id} value={v.id}>
                                                        {v.code} — {rupiah(v.price)}
                                                    </MenuItem>
                                                ))
                                            ) : (
                                                <MenuItem disabled value="">
                                                    Tidak ada varian
                                                </MenuItem>
                                            )}
                                        </Select>

                                        <Button
                                            fullWidth
                                            size="small"
                                            variant="contained"
                                            endIcon={<AddRoundedIcon />}
                                            sx={{
                                                mt: 1,
                                                textTransform: 'none',
                                                fontWeight: 800,
                                                borderRadius: 1.5,
                                                boxShadow: 'none',
                                                background: GRADIENT,
                                                '&:hover': { boxShadow: 3 }
                                            }}
                                            onClick={() => add(p, hasVariants ? selectedVar : undefined)}
                                        >
                                            Tambah
                                        </Button>
                                    </Box>

                                    {/* strip accent tipis di bawah card */}
                                    <Box sx={{ height: 3, background: GRADIENT }} />
                                </Paper>
                            )
                        })}
                    </Box>
                </Box>
            </PerfectScrollbar>
        </Paper>
    )
}

export default SelectMenuAndVariant
