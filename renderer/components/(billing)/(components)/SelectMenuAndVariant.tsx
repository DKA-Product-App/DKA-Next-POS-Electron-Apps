'use client'

import React, {FC} from "react";
import Image from 'next/image';
import {Box, Button, Divider, MenuItem, Paper, Select, Skeleton, Tab, Tabs, TextField, Typography} from "@mui/material";
import PerfectScrollbar from 'react-perfect-scrollbar';
import 'react-perfect-scrollbar/dist/css/styles.css';
import {ProductsCategories} from "../types/product.categories.type";
import {Products} from "../types/products.type";
import {ProductsVariants} from "../types/products.variants.type";

export interface SelectMenuAndVariantProps {
    product : Array<Products>;
    categories : readonly ProductsCategories[]
    onAdd : (p: Products, v?: ProductsVariants) => void
}
export const SelectMenuAndVariant : FC<SelectMenuAndVariantProps> = ({product, categories, onAdd }) => {

    const [q, setQ] = React.useState('')
    const [tab, setTab] = React.useState(0)
    const [openVariant, setOpenVariant] = React.useState<Record<string, string>>({})
    const activeCategory = tab === 0 ? 'All' : categories[tab - 1]
    const filtered = React.useMemo(
        () => product.filter(p => (activeCategory === 'All' || p.category?.id === activeCategory.id) && (q.trim() === '' || p.name.toLowerCase().includes(q.toLowerCase()))),
        [product, activeCategory, q]
    )
    const rupiah = (n: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n)

    const ImgWithSkeleton: FC<{ src: string; alt: string; priority?: boolean }> = ({ src, alt, priority }) => {
        const [loaded, setLoaded] = React.useState(false);
        return (
            <Box sx={{ position: 'relative', width: '100%', aspectRatio: '4 / 3', bgcolor: 'action.hover', overflow: 'hidden' }}>
                {!loaded && <Skeleton variant="rectangular" sx={{ position: 'absolute', inset: 0 }} />}
                <Image
                    src={src}
                    alt={alt}
                    fill
                    loading={priority ? 'eager' : 'lazy'}
                    sizes="(max-width: 600px) 50vw, (max-width: 1200px) 25vw, 200px"
                    onLoad={() => setLoaded(true)}
                    style={{ objectFit: 'cover', opacity: loaded ? 1 : 0, transition: 'opacity .2s ease' }}
                />
            </Box>
        );
    };

    const placeholderOf = (p: Products) => p.image ?? `https://placehold.co/600x400/png?text=${encodeURIComponent(p.name)}`;
    return (
        <Paper sx={{ height: '100%', overflow: 'hidden', display: 'flex', flexDirection: 'column' }} elevation={0}>
            {/* Header */}
            <Box sx={{ p: 2 }}>
                <Typography variant="h6" fontWeight={700}>Pilih Pesanan</Typography>
                <TextField
                    value={q}
                    onChange={e => setQ(e.target.value)}
                    placeholder="Cari menu…"
                    fullWidth
                    size="small"
                    sx={{ mt: 1.5 }}
                />
                <Tabs
                    value={tab}
                    onChange={(_, v) => setTab(v)}
                    variant="scrollable"
                    allowScrollButtonsMobile
                    sx={{ mt: 1 }}
                >
                    <Tab label="All" />
                    {categories.map(c => <Tab key={c.id} label={c.name} />)}
                </Tabs>
            </Box>

            <Divider />
            <Box sx={{ p: 2, overflowY: 'auto', overflowX: 'hidden' }}>
                <Box
                    sx={{
                        display: 'grid',
                        // equal width, responsif, auto isi kolom
                        gridTemplateColumns: {
                            xs: 'repeat(auto-fill, minmax(140px, 1fr))',
                            sm: 'repeat(auto-fill, minmax(160px, 1fr))',
                            md: 'repeat(auto-fill, minmax(180px, 1fr))',
                            lg: 'repeat(auto-fill, minmax(200px, 1fr))',
                        },
                        gap: { xs: 2, sm: 2.5, md: 3 }, // jarak H+V
                        alignItems: 'stretch',
                    }}
                >
                    {filtered.map(p => {
                        const hasVar = !!p.variants?.length
                        const selectedVarId = openVariant[p.id] ?? p.variants?.[0]?.id
                        const selectedVar = p.variants?.find(v => v.id === selectedVarId)
                        const hasVariants = Array.isArray(p.variants) && p.variants.length > 0;
                        return (
                            <Paper
                                key={p.id}
                                variant="outlined"
                                sx={{
                                    // bikin square
                                    borderRadius: 2,
                                    overflow: 'hidden',
                                    transition: 'box-shadow .3s',
                                    '&:hover': { boxShadow: 2 },

                                    // layout isi
                                    display: 'flex',
                                    flexDirection: 'column',
                                    // padding dalam supaya konten nggak mepet
                                    p: 0,
                                }}
                            >

                                <ImgWithSkeleton src={placeholderOf(p)} alt={p.name} />

                                <Typography title={p.name} sx={{ p : 1}}>
                                    {p.name} ({p.category?.name})
                                </Typography>



                                <Box flex={1}/>

                                <Box sx={{ ml : 1, mr : 1}}>
                                    <Select
                                        size="small"
                                        variant="outlined"
                                        fullWidth
                                        value={hasVariants ? (selectedVarId ?? '') : ''} // kosong = tampilkan placeholder
                                        onChange={(e) =>
                                            setOpenVariant((s) => ({ ...s, [p.id]: String(e.target.value) }))
                                        }
                                        displayEmpty
                                        disabled={!hasVariants}
                                        renderValue={(selected) => {
                                            // placeholder saat kosong atau memang nggak ada varian
                                            if (!hasVariants || selected === '') {
                                                return <span style={{ color: 'rgba(0,0,0,0.6)' }}>Tidak ada varian</span>;
                                            }
                                            const v = p.variants!.find((x) => String(x.id) === String(selected));
                                            return v
                                                ? `${v.code} — ${rupiah(v.price)}`
                                                : 'Pilih variant';
                                        }}
                                        sx={{ mt: 1 }}
                                    >
                                        {hasVariants ? (
                                            p.variants!.map((v) => (
                                                <MenuItem key={v.id} value={v.id}>
                                                    {v.code} — {rupiah(v.price)}
                                                </MenuItem>
                                            ))
                                        ) : (
                                            // item dummy biar Select tetap bisa render, tapi tidak bisa dipilih
                                            <MenuItem disabled value="">
                                                Tidak ada varian
                                            </MenuItem>
                                        )}
                                    </Select>
                                </Box>
                                <Box sx={{ m: 1}}>
                                    <Button
                                        fullWidth
                                        size="small"
                                        variant="outlined"
                                        sx={{ mt : 1}}
                                        onClick={() => onAdd(p, hasVar ? selectedVar : undefined)}
                                    >
                                        Take It
                                    </Button>
                                </Box>
                            </Paper>
                        )
                    })}
                </Box>
            </Box>
        </Paper>
    )
}

export default SelectMenuAndVariant;