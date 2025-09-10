'use client';

import * as React from 'react';
import {
    Box,
    Paper,
    Tabs,
    Tab,
    Stack,
    Typography,
    Button,
    TextField,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    IconButton,
} from '@mui/material';
import Grid2 from '@mui/material/Grid';
import { DataGrid, GridColDef } from '@mui/x-data-grid';
import AddRounded from '@mui/icons-material/AddRounded';
import CloseRounded from '@mui/icons-material/CloseRounded';
import SearchRounded from '@mui/icons-material/SearchRounded';

// ============================
// Types
// ============================
type ProductRow = {
    id: string;
    sku: string;
    name: string;
    category: string;
    price: number;
    stock: number;
};

type CategoryRow = {
    id: string;
    code: string;
    name: string;
    description?: string;
};

// ============================
// Helpers
// ============================
const uuid = () => (globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random()}`);

// ============================
// Main Component
// ============================
export default function ProductsContainer() {
    const [tab, setTab] = React.useState<'product' | 'category'>('product');

    // ------- Product state -------
    const [products, setProducts] = React.useState<ProductRow[]>([
        { id: uuid(), sku: 'PRD-001', name: 'Espresso', category: 'Beverage', price: 18000, stock: 24 },
        { id: uuid(), sku: 'PRD-002', name: 'Cappuccino', category: 'Beverage', price: 22000, stock: 12 },
        { id: uuid(), sku: 'PRD-003', name: 'Cheese Cake', category: 'Dessert', price: 28000, stock: 7 },
    ]);
    const [productQuery, setProductQuery] = React.useState('');

    // ------- Category state -------
    const [categories, setCategories] = React.useState<CategoryRow[]>([
        { id: uuid(), code: 'BEV', name: 'Beverage', description: 'Minuman panas/dingin' },
        { id: uuid(), code: 'DSR', name: 'Dessert', description: 'Kue & cemilan' },
    ]);
    const [categoryQuery, setCategoryQuery] = React.useState('');

    // ------- Dialogs -------
    const [openAddProduct, setOpenAddProduct] = React.useState(false);
    const [openAddCategory, setOpenAddCategory] = React.useState(false);

    // ------- Form states (simple) -------
    const [newProduct, setNewProduct] = React.useState<Partial<ProductRow>>({
        sku: '',
        name: '',
        category: '',
        price: 0,
        stock: 0,
    });
    const [newCategory, setNewCategory] = React.useState<Partial<CategoryRow>>({
        code: '',
        name: '',
        description: '',
    });

    // ============================
    // Columns
    // ============================
    const productColumns = React.useMemo<GridColDef<ProductRow>[]>(
        () => [
            { field: 'sku', headerName: 'SKU', flex: 1, minWidth: 120 },
            { field: 'name', headerName: 'Product', flex: 1.4, minWidth: 160 },
            { field: 'category', headerName: 'Category', flex: 1, minWidth: 140 },
            { field: 'price', headerName: 'Price', type: 'number', flex: 0.8, minWidth: 110, valueFormatter: ({ value } : any) => `Rp ${value?.toLocaleString('id-ID')}` },
            { field: 'stock', headerName: 'Stock', type: 'number', flex: 0.6, minWidth: 90 },
        ],
        []
    );

    const categoryColumns = React.useMemo<GridColDef<CategoryRow>[]>(
        () => [
            { field: 'code', headerName: 'Code', flex: 0.8, minWidth: 120 },
            { field: 'name', headerName: 'Category', flex: 1.2, minWidth: 160 },
            { field: 'description', headerName: 'Description', flex: 1.6, minWidth: 220 },
        ],
        []
    );

    // ============================
    // Derived rows (search filter)
    // ============================
    const filteredProducts = React.useMemo(
        () =>
            products.filter((p) =>
                [p.sku, p.name, p.category, String(p.price), String(p.stock)]
                    .join(' ')
                    .toLowerCase()
                    .includes(productQuery.toLowerCase())
            ),
        [products, productQuery]
    );

    const filteredCategories = React.useMemo(
        () =>
            categories.filter((c) =>
                [c.code, c.name, c.description]
                    .filter(Boolean)
                    .join(' ')
                    .toLowerCase()
                    .includes(categoryQuery.toLowerCase())
            ),
        [categories, categoryQuery]
    );

    // ============================
    // Handlers
    // ============================
    const handleAddProduct = () => {
        setProducts((prev) =>
            prev.concat({
                id: uuid(),
                sku: newProduct.sku?.trim() || `PRD-${prev.length + 1}`.padStart(7, '0'),
                name: newProduct.name?.trim() || 'Unnamed',
                category: newProduct.category?.trim() || 'Uncategorized',
                price: Number(newProduct.price ?? 0),
                stock: Number(newProduct.stock ?? 0),
            })
        );
        setOpenAddProduct(false);
        setNewProduct({ sku: '', name: '', category: '', price: 0, stock: 0 });
    };

    const handleAddCategory = () => {
        setCategories((prev) =>
            prev.concat({
                id: uuid(),
                code: newCategory.code?.trim().toUpperCase() || `CAT${prev.length + 1}`,
                name: newCategory.name?.trim() || 'Untitled',
                description: newCategory.description?.trim() || '',
            })
        );
        setOpenAddCategory(false);
        setNewCategory({ code: '', name: '', description: '' });
    };

    // ============================
    // UI
    // ============================
    return (
        <Paper elevation={0} sx={{ p: 2, borderRadius: 3, height: '100%', display: 'flex', flexDirection: 'column', gap: 2 }}>
            {/* Header */}
            <Stack direction="row" alignItems="center" justifyContent="space-between">
                <Typography variant="h6" fontWeight={800}>Products</Typography>
                <Tabs
                    value={tab}
                    onChange={(_, v) => setTab(v)}
                    sx={{
                        '& .MuiTab-root': { textTransform: 'none', fontWeight: 700, minHeight: 36 },
                    }}
                >
                    <Tab value="product" label="Product" />
                    <Tab value="category" label="Category" />
                </Tabs>
            </Stack>

            {/* Content */}
            <Box sx={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', gap: 2 }}>
                {/* Toolbar by tab */}
                {tab === 'product' ? (
                    <Grid2 container spacing={1} alignItems="center">
                        <Grid2 size={{ xs: 12, sm: 6 }}>
                            <Stack direction="row" spacing={1} alignItems="center">
                                <SearchRounded fontSize="small" />
                                <TextField
                                    size="small"
                                    placeholder="Cari product, sku, category..."
                                    fullWidth
                                    value={productQuery}
                                    onChange={(e) => setProductQuery(e.target.value)}
                                />
                            </Stack>
                        </Grid2>
                        <Grid2 size={{ xs: 12, sm: 6 }} sx={{ display: 'flex', justifyContent: { xs: 'stretch', sm: 'end' } }}>
                            <Button
                                startIcon={<AddRounded />}
                                variant="contained"
                                onClick={() => setOpenAddProduct(true)}
                            >
                                Add Product
                            </Button>
                        </Grid2>
                    </Grid2>
                ) : (
                    <Grid2 container spacing={1} alignItems="center">
                        <Grid2 size={{ xs: 12, sm: 6 }}>
                            <Stack direction="row" spacing={1} alignItems="center">
                                <SearchRounded fontSize="small" />
                                <TextField
                                    size="small"
                                    placeholder="Cari category..."
                                    fullWidth
                                    value={categoryQuery}
                                    onChange={(e) => setCategoryQuery(e.target.value)}
                                />
                            </Stack>
                        </Grid2>
                        <Grid2 size={{ xs: 12, sm: 6 }} sx={{ display: 'flex', justifyContent: { xs: 'stretch', sm: 'end' } }}>
                            <Button
                                startIcon={<AddRounded />}
                                variant="contained"
                                color="secondary"
                                onClick={() => setOpenAddCategory(true)}
                            >
                                Add Category
                            </Button>
                        </Grid2>
                    </Grid2>
                )}

                {/* Table */}
                <Box sx={{ flex: 1, minHeight: 0 }}>
                    {tab === 'product' ? (
                        <DataGrid
                            rows={filteredProducts}
                            columns={productColumns}
                            density="compact"
                            disableRowSelectionOnClick
                            pageSizeOptions={[5, 10, 25]}
                            initialState={{ pagination: { paginationModel: { pageSize: 10, page: 0 } } }}
                            sx={{
                                borderRadius: 2,
                                border: '1px solid',
                                borderColor: 'divider',
                                height: '100%',
                            }}
                        />
                    ) : (
                        <DataGrid
                            rows={filteredCategories}
                            columns={categoryColumns}
                            density="compact"
                            disableRowSelectionOnClick
                            pageSizeOptions={[5, 10, 25]}
                            initialState={{ pagination: { paginationModel: { pageSize: 10, page: 0 } } }}
                            sx={{
                                borderRadius: 2,
                                border: '1px solid',
                                borderColor: 'divider',
                                height: '100%',
                            }}
                        />
                    )}
                </Box>
            </Box>

            {/* Dialog: Add Product */}
            <Dialog open={openAddProduct} onClose={() => setOpenAddProduct(false)} fullWidth maxWidth="sm">
                <DialogTitle>
                    Add Product
                    <IconButton onClick={() => setOpenAddProduct(false)} sx={{ position: 'absolute', right: 8, top: 8 }}>
                        <CloseRounded />
                    </IconButton>
                </DialogTitle>
                <DialogContent dividers>
                    <Grid2 container spacing={2}>
                        <Grid2 size={{ xs: 12, sm: 6 }}>
                            <TextField
                                label="SKU"
                                value={newProduct.sku ?? ''}
                                onChange={(e) => setNewProduct((s) => ({ ...s, sku: e.target.value }))}
                                fullWidth
                            />
                        </Grid2>
                        <Grid2 size={{ xs: 12, sm: 6 }}>
                            <TextField
                                label="Category"
                                value={newProduct.category ?? ''}
                                onChange={(e) => setNewProduct((s) => ({ ...s, category: e.target.value }))}
                                fullWidth
                            />
                        </Grid2>
                        <Grid2 size={{ xs: 12 }}>
                            <TextField
                                label="Product Name"
                                value={newProduct.name ?? ''}
                                onChange={(e) => setNewProduct((s) => ({ ...s, name: e.target.value }))}
                                fullWidth
                            />
                        </Grid2>
                        <Grid2 size={{ xs: 12, sm: 6 }}>
                            <TextField
                                label="Price"
                                type="number"
                                value={newProduct.price ?? 0}
                                onChange={(e) => setNewProduct((s) => ({ ...s, price: Number(e.target.value || 0) }))}
                                fullWidth
                            />
                        </Grid2>
                        <Grid2 size={{ xs: 12, sm: 6 }}>
                            <TextField
                                label="Stock"
                                type="number"
                                value={newProduct.stock ?? 0}
                                onChange={(e) => setNewProduct((s) => ({ ...s, stock: Number(e.target.value || 0) }))}
                                fullWidth
                            />
                        </Grid2>
                    </Grid2>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpenAddProduct(false)}>Batal</Button>
                    <Button variant="contained" onClick={handleAddProduct}>Simpan</Button>
                </DialogActions>
            </Dialog>

            {/* Dialog: Add Category */}
            <Dialog open={openAddCategory} onClose={() => setOpenAddCategory(false)} fullWidth maxWidth="sm">
                <DialogTitle>
                    Add Category
                    <IconButton onClick={() => setOpenAddCategory(false)} sx={{ position: 'absolute', right: 8, top: 8 }}>
                        <CloseRounded />
                    </IconButton>
                </DialogTitle>
                <DialogContent dividers>
                    <Grid2 container spacing={2}>
                        <Grid2 size={{ xs: 12, sm: 6 }}>
                            <TextField
                                label="Code"
                                value={newCategory.code ?? ''}
                                onChange={(e) => setNewCategory((s) => ({ ...s, code: e.target.value }))}
                                fullWidth
                            />
                        </Grid2>
                        <Grid2 size={{ xs: 12, sm: 6 }}>
                            <TextField
                                label="Name"
                                value={newCategory.name ?? ''}
                                onChange={(e) => setNewCategory((s) => ({ ...s, name: e.target.value }))}
                                fullWidth
                            />
                        </Grid2>
                        <Grid2 size={{ xs: 12 }}>
                            <TextField
                                label="Description"
                                value={newCategory.description ?? ''}
                                onChange={(e) => setNewCategory((s) => ({ ...s, description: e.target.value }))}
                                fullWidth
                                multiline
                                minRows={2}
                            />
                        </Grid2>
                    </Grid2>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpenAddCategory(false)}>Batal</Button>
                    <Button variant="contained" onClick={handleAddCategory}>Simpan</Button>
                </DialogActions>
            </Dialog>
        </Paper>
    );
}
