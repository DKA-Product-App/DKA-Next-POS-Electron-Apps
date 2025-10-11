'use client';

import * as React from 'react';
import { useState, useEffect, useMemo, useCallback } from 'react';
import {
    Box,
    Button,
    Chip,
    Divider,
    List,
    ListItem,
    ListItemText,
    Paper,
    Popover,
    Stack,
    Tooltip,
    Typography,
} from '@mui/material';
import AddRounded from '@mui/icons-material/AddRounded';
import {
    MaterialReactTable,
    useMaterialReactTable,
    createMRTColumnHelper,
} from 'material-react-table';
import PerfectScrollbar from 'react-perfect-scrollbar';
import 'react-perfect-scrollbar/dist/css/styles.css';
import moment from 'moment-timezone';
import {ProductsCategories, ProductsCategoriesPrinters} from "../../../../../../types/product.categories.type";


const CatalogProductCategories = () => {
    const columnHelper = createMRTColumnHelper<ProductsCategories>();
    const [productCatalog, setProductCatalog] = useState<ProductsCategories[]>([]);

    // ==== Popover state (anchored to Chip) ====
    const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
    const [selectedPrinters, setSelectedPrinters] = useState<ProductsCategoriesPrinters[]>([]);
    const [selectedCategoryName, setSelectedCategoryName] = useState<string>('');

    const openPopover = useCallback((anchor: HTMLElement, row: ProductsCategories) => {
        setAnchorEl(anchor);
        setSelectedPrinters(row?.printer ?? []);
        setSelectedCategoryName(row?.name ?? '—');
    }, []);

    const closePopover = useCallback(() => {
        setAnchorEl(null);
        setSelectedPrinters([]);
        setSelectedCategoryName('');
    }, []);

    const fetchProducts = useCallback(() => {
        if (window.api === undefined) {
            console.error('Failed Get Window Api Bridge');
            setProductCatalog([]);
            return;
        }
        window.api
            .invoke<any, { data: ProductsCategories[] }>('api.product.category:read.all', {})
            .then(({ data }) => setProductCatalog(data ?? []))
            .catch((err: any) => {
                console.error(err);
                setProductCatalog([]);
            });
    }, []);

    useEffect(() => {
        fetchProducts();
    }, [fetchProducts]);

    const onAddCategory = useCallback(() => {
        // TODO: buka modal/form tambah kategori
        console.info('Tambah Kategori clicked');
    }, []);

    // ==== Columns ====
    const columns = useMemo(
        () => [
            columnHelper.accessor('name', { header: 'Name', size: 160 }),
            columnHelper.accessor('description', { header: 'Description', size: 220 }),
            columnHelper.accessor('time_created', {
                header: 'Created At',
                size: 200,
                sortingFn: 'datetime',
                Cell: ({ cell }) => {
                    const v = cell.getValue<string | Date | undefined>();
                    const m = v ? moment(v) : null;
                    return m?.isValid() ? m.format('HH:mm:ss DD MMM YYYY') : '—';
                },
            }),
            columnHelper.accessor('status', {
                header: 'Status',
                size: 100,
                Cell: ({ cell }) => (
                    <Chip
                        size="small"
                        variant="outlined"
                        color={cell.getValue<boolean>() ? 'success' : 'default'}
                        label={cell.getValue<boolean>() ? 'Active' : 'Inactive'}
                    />
                ),
            }),
            columnHelper.accessor('printer', {
                header: 'Printers',
                size: 120,
                enableSorting: false,
                enableColumnFilter: false,
                Cell: ({ row }) => {
                    const printers = row?.original?.printer ?? [];
                    const handleChipClick = (e: React.MouseEvent<HTMLDivElement>) => {
                        e.stopPropagation();
                        openPopover(e.currentTarget as HTMLElement, row.original);
                    };
                    return (
                        <Tooltip title="Klik untuk melihat detail printer">
                            <Chip
                                size="small"
                                variant="outlined"
                                label={`${printers.length} unit`}
                                onClick={handleChipClick}
                                sx={{ cursor: 'pointer' }}
                            />
                        </Tooltip>
                    );
                },
            }),
        ],
        [columnHelper, openPopover],
    );

    const table = useMaterialReactTable({
        columns,
        data: productCatalog,
        initialState: { density: 'comfortable' },
        enableRowSelection: true,
        columnFilterDisplayMode: 'popover',
        paginationDisplayMode: 'pages',
        positionToolbarAlertBanner: 'bottom',
        // ==== baseline full-height table (catatan template default) ====
        enableStickyHeader: true,
        muiTablePaperProps: { sx: { display: 'flex', flexDirection: 'column', flex: 1 } },
        muiTableContainerProps: { sx: { flex: 1 } },
        renderTopToolbarCustomActions: () => (
            <Stack direction="row" alignItems="center" justifyContent="flex-end" sx={{ mb: 1.5 }}>
                <Button variant="outlined" startIcon={<AddRounded />} onClick={onAddCategory}>
                    Tambah Kategori
                </Button>
            </Stack>
        ),
    });

    const popoverOpen = Boolean(anchorEl);
    const popId = popoverOpen ? 'popover-printers' : undefined;

    return (
        <Paper
            variant="outlined"
            sx={{ p: 2, height: '100%', display: 'flex', flexDirection: 'column', minHeight: 0 }}
        >
            <Box sx={{ flex: 1, minHeight: 0, display: 'flex' }}>
                <MaterialReactTable table={table} />
            </Box>

            <Popover
                id={popId}
                open={popoverOpen}
                anchorEl={anchorEl}
                onClose={closePopover}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                transformOrigin={{ vertical: 'top', horizontal: 'left' }}
                slotProps={{ paper: { sx: { width: 420, maxWidth: '90vw' } } }}
            >
                <Box sx={{ p: 2, pb: 1 }}>
                    <Typography variant="subtitle1" fontWeight={700}>
                        Printers — {selectedCategoryName || '—'}
                    </Typography>
                    <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                        {selectedPrinters.length ? `${selectedPrinters.length} device terhubung` : 'Tidak ada printer'}
                    </Typography>
                </Box>
                <Divider />
                <Box sx={{ height: 320, width: '100%' }}>
                    <PerfectScrollbar option={{ suppressScrollX: false }}>
                        <List dense sx={{ py: 0 }}>
                            {selectedPrinters.length
                                ? selectedPrinters.map((p) => {
                                    const mode = p?.options?.mode ?? '—';
                                    const ip = p?.options?.ip_address ?? '—';
                                    const port = p?.options?.port ?? '—';
                                    const status = p?.status ? 'Active' : 'Inactive';
                                    const createdAt = p?.time_created ? moment(p.time_created).format('DD MMM YYYY, HH:mm') : '—';
                                    return (
                                        <React.Fragment key={p.id}>
                                            <ListItem
                                                sx={{ alignItems: 'flex-start', py: 1.25 }}
                                                secondaryAction={
                                                    <Chip
                                                        size="small"
                                                        variant="outlined"
                                                        color={p.status ? 'success' : 'default'}
                                                        label={status}
                                                    />
                                                }
                                            >
                                                <ListItemText
                                                    primary={
                                                        <Stack direction="row" spacing={1} alignItems="center">
                                                            <Typography variant="body1" fontWeight={600}>{p.name}</Typography>
                                                            <Chip size="small" label={mode} />
                                                        </Stack>
                                                    }
                                                    secondary={
                                                        <Stack spacing={0.5} sx={{ mt: 0.5 }}>
                                                            <Typography variant="body2" color="text.secondary">
                                                                {p.description || '—'}
                                                            </Typography>
                                                            <Typography variant="caption" color="text.secondary">
                                                                IP/Port: {ip}:{port}
                                                            </Typography>
                                                            <Typography variant="caption" color="text.secondary">
                                                                Created: {createdAt}
                                                            </Typography>
                                                        </Stack>
                                                    }
                                                />
                                            </ListItem>
                                            <Divider component="li" />
                                        </React.Fragment>
                                    );
                                })
                                : (
                                    <ListItem>
                                        <ListItemText primary="Belum ada printer untuk kategori ini." />
                                    </ListItem>
                                )}
                        </List>
                    </PerfectScrollbar>
                </Box>
            </Popover>
        </Paper>
    );
};

export default CatalogProductCategories;
