'use client';

import {
    MaterialReactTable,
    useMaterialReactTable,
    createMRTColumnHelper,
} from 'material-react-table';
import { useState, useEffect } from 'react';
import * as React from 'react';
import { Box, Button, Paper, Stack } from '@mui/material';
import AddRounded from '@mui/icons-material/AddRounded';
import { ProductsCategories } from '../../../../../(cashier)/layouts/(main)/(component)/(transaction)/types/product.categories.type';

const CatalogProductCategories = () => {
    const columnHelper = createMRTColumnHelper<ProductsCategories>();
    const [productCatalog, setProductCatalog] = useState<ProductsCategories[]>([]);

    const fetchProducts = React.useCallback(() => {
        if (window.api === undefined) {
            console.error('Failed Get Window Api Bridge');
            setProductCatalog([]);
            return;
        }
        window.api
            .invoke<any, { data: ProductsCategories[] }>('api.product.category:read.all', {})
            .then(({ data }) => setProductCatalog(data))
            .catch((err: any) => {
                console.error(err);
                setProductCatalog([]);
            });
    }, []);

    useEffect(() => {
        fetchProducts();
    }, [fetchProducts]);

    const onAddCategory = React.useCallback(() => {
        // TODO: buka modal/form tambah kategori di sini
        console.info('Tambah Kategori clicked');
    }, []);

    const table = useMaterialReactTable({
        columns: [
            columnHelper.accessor('name', { header: 'Name', size: 160 }),
            columnHelper.accessor('description', { header: 'Description', size: 220 }),
            columnHelper.accessor('time_created', { header: 'Created At', size: 200 }),
            columnHelper.accessor('status', { header: 'Status' }),
        ],
        data: productCatalog,
        initialState: { density: 'compact' },
        enableRowSelection: true,
        columnFilterDisplayMode: 'popover',
        paginationDisplayMode: 'pages',
        positionToolbarAlertBanner: 'bottom',
        // ==== penting buat full-height ====
        enableStickyHeader: true,
        muiTablePaperProps: { sx: { display: 'flex', flexDirection: 'column', flex: 1 } },
        muiTableContainerProps: { sx: { flex: 1 } },
        renderTopToolbarCustomActions: ({ table }) => (
            <Stack direction="row" alignItems="center" justifyContent="flex-end" sx={{ mb: 1.5 }}>
                <Button variant="outlined" startIcon={<AddRounded />} onClick={onAddCategory}>
                    Tambah Kategori
                </Button>
            </Stack>
        ),
    });

    return (
        <Paper
            variant="outlined"
            sx={{
                p: 2,
                height: '100%', // ganti ke '100vh' kalau mau full layar
                display: 'flex',
                flexDirection: 'column',
                minHeight: 0, // biar flex child bisa scroll
            }}
        >
            {/* wrapper flex biar MRT ngisi sisa tinggi */}
            <Box sx={{ flex: 1, minHeight: 0, display: 'flex' }}>
                <MaterialReactTable table={table} />
            </Box>
        </Paper>
    );
};

export default CatalogProductCategories;
