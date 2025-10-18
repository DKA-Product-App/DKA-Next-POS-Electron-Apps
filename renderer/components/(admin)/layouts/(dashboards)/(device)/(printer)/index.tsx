'use client';

import * as React from 'react';
import { useState, useEffect, useMemo, useCallback } from 'react';
import {
    Box,
    Button,
    Chip,
    Divider, IconButton,
    List,
    ListItem,
    ListItemText,
    Paper,
    Popover,
    Stack,
    Tooltip,
    Typography,
} from '@mui/material';
import SettingsRounded from '@mui/icons-material/SettingsRounded';
import AddRounded from '@mui/icons-material/AddRounded';

import {
    MaterialReactTable,
    useMaterialReactTable,
    createMRTColumnHelper,
} from 'material-react-table';

import PerfectScrollbar from 'react-perfect-scrollbar';
import 'react-perfect-scrollbar/dist/css/styles.css';
import moment from 'moment-timezone';
import { DeleteModal } from './(components)/DeleteModal';
import {DevicePrinter} from "../../../../../../types/config/device/device.printer.type";
import {useGodModeProvider} from "../../../../context/GodModeProviderContext";
import NewModal from './(components)/NewModal';
import EditRounded from "@mui/icons-material/EditRounded";
import EditModal from "./(components)/EditModal";

/* ======================================================
 * DevicePrinters — disusun ulang mengikuti template table baseline
 * ====================================================== */
const DevicePrinters = () => {
    const columnHelper = createMRTColumnHelper<DevicePrinter>();
    const [printers, setPrinters] = useState<DevicePrinter[]>([]);
    const { godMode, setGodMode } = useGodModeProvider();
    // ==== Popover state (anchored to Chip) ====
    const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
    const [selectedPrinter, setSelectedPrinter] = useState<DevicePrinter | null>(null);

    const openPopover = useCallback((anchor: HTMLElement, row: DevicePrinter) => {
        setAnchorEl(anchor);
        setSelectedPrinter(row ?? null);
    }, []);

    const closePopover = useCallback(() => {
        setAnchorEl(null);
        setSelectedPrinter(null);
    }, []);

    const fetchPrinters = useCallback(() => {
        if (!window.api) {
            console.error('Failed Get Window Api Bridge');
            setPrinters([]);
            return;
        }
        window.api
            .invoke<any, { data: DevicePrinter[] }>('api.config.device.printer:read.all', {
                god_mode: godMode
            })
            .then(({ data }) => setPrinters(data ?? []))
            .catch((err: any) => {
                console.error(err);
                setPrinters([]);
            });
    }, [godMode]);

    useEffect(() => { fetchPrinters(); }, [fetchPrinters]);

    // ==== Columns ====
    const columns = useMemo(
        () => [
            columnHelper.accessor('name', { header: 'Name', size: 220 }),
            columnHelper.accessor('description', { header: 'Description', size: 260 }),
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
                size: 110,
                Cell: ({ cell }) => (
                    <Chip
                        size="small"
                        variant="outlined"
                        color={cell.getValue<boolean>() ? 'success' : 'default'}
                        label={cell.getValue<boolean>() ? 'Active' : 'Inactive'}
                    />
                ),
            }),
            columnHelper.display({
                id: 'options',
                header: 'Options',
                size: 140,
                enableColumnFilter: false,
                enableSorting: false,
                enableHiding: false,
                Cell: ({ row }) => {
                    const dev = row.original;
                    const label = dev?.options?.mode ?? '—';
                    const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
                        e.stopPropagation();
                        openPopover(e.currentTarget as HTMLElement, dev);
                    };
                    return (
                        <Tooltip title="Klik untuk melihat detail opsi">
                            <Chip
                                size="small"
                                variant="outlined"
                                onClick={handleClick}
                                icon={<SettingsRounded fontSize="small" />}
                                label={label}
                                sx={{ cursor: dev?.options ? 'pointer' : 'not-allowed' }}
                                disabled={!dev?.options}
                            />
                        </Tooltip>
                    );
                },
            }),
            // === contoh Actions (opsional): aktifkan kalau sudah ada Delete/Edit Modal untuk printers
            columnHelper.display({
              id: 'actions',
              header: 'Actions',
              size: 110,
              enableColumnFilter: false,
              enableSorting: false,
              enableHiding: false,
              Cell: ({ row }) => {
                const printer = row.original;
                return (
                  <Stack direction="row" spacing={0.5}>
                      <EditModal
                          device={printer}
                          triggerLabel={'Update'}
                          triggerProps={
                              <Tooltip title="Edit">
                                  <IconButton size="small" color="primary"><EditRounded fontSize="small" /></IconButton>
                              </Tooltip>
                          }
                          asIconButton={true}
                          onUpdated={fetchPrinters}
                      />
                      <DeleteModal
                          id={printer.id}
                          name={printer.name}
                          onDeleted={() => {
                              console.log('data dihapus')
                              fetchPrinters()
                          }}
                      />
                  </Stack>
                );
              },
            }),
        ],
        [columnHelper, openPopover],
    );

    const table = useMaterialReactTable({
        columns,
        data: printers,
        initialState: { density: 'comfortable' },
        enableRowSelection: true,
        columnFilterDisplayMode: 'popover',
        paginationDisplayMode: 'pages',
        positionToolbarAlertBanner: 'bottom',
        // ==== baseline full-height table ====
        enableStickyHeader: true,
        muiTablePaperProps: { sx: { display: 'flex', flexDirection: 'column', flex: 1 } },
        muiTableContainerProps: { sx: { flex: 1 } },
        renderTopToolbarCustomActions: () => (
            <Stack direction="row" alignItems="center" justifyContent="flex-end" sx={{ mb: 1.5 }} spacing={1}>
                <Button variant="outlined" onClick={fetchPrinters}>Refresh</Button>
                <NewModal
                    triggerLabel="Tambah printer"
                    triggerProps={{ color: 'primary', startIcon: <AddRounded /> }}
                    onCreated={fetchPrinters}
                />
            </Stack>
        ),
    });

    const popoverOpen = Boolean(anchorEl);
    const popId = popoverOpen ? 'popover-printer-options' : undefined;

    const opt = selectedPrinter?.options ?? null;
    const createdAt = selectedPrinter?.time_created ? moment(selectedPrinter.time_created).format('DD MMM YYYY, HH:mm') : '—';
    const branchName = selectedPrinter?.branches?.[0]?.name ?? '—';

    return (
        <Paper variant="outlined" sx={{ p: 2, height: '100%', display: 'flex', flexDirection: 'column', minHeight: 0 }}>
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
                        Options — {selectedPrinter?.name ?? '—'}
                    </Typography>
                    <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                        {opt ? 'Konfigurasi perangkat' : 'Tidak ada opsi'}
                    </Typography>
                </Box>
                <Divider />
                <Box sx={{ height: 320, width: '100%' }}>
                    <PerfectScrollbar option={{ suppressScrollX: false }}>
                        <List dense sx={{ py: 0 }}>
                            {opt ? (
                                <>
                                    {[
                                        { k: 'Mode', v: opt.mode ?? '—' },
                                        { k: 'IP Address', v: opt.ip_address ?? '—' },
                                        { k: 'Port', v: Number.isFinite(opt.port as number) ? String(opt.port) : '—' },
                                        { k: 'Timeout (ms)', v: Number.isFinite(opt.timeout as number) ? String(opt.timeout) : '—' },
                                        { k: 'Branch', v: branchName },
                                        { k: 'Created', v: createdAt },
                                        { k: 'Status', v: selectedPrinter?.status ? 'Active' : 'Inactive' },
                                        { k: 'Description', v: selectedPrinter?.description ?? '—' },
                                    ].map((row, i, arr) => (
                                        <React.Fragment key={row.k}>
                                            <ListItem
                                                sx={{ alignItems: 'flex-start', py: 1.0 }}
                                                secondaryAction={
                                                    <Typography variant="body2" sx={{ textAlign: 'right' }}>
                                                        {row.v}
                                                    </Typography>
                                                }
                                            >
                                                <ListItemText
                                                    primary={<Typography variant="body2" fontWeight={600}>{row.k}</Typography>}
                                                    secondary={null}
                                                    sx={{ m: 0 }}
                                                />
                                            </ListItem>
                                            {i < arr.length - 1 ? <Divider component="li" /> : null}
                                        </React.Fragment>
                                    ))}
                                </>
                            ) : (
                                <ListItem>
                                    <ListItemText primary="Tidak ada opsi untuk perangkat ini." />
                                </ListItem>
                            )}
                        </List>
                    </PerfectScrollbar>
                </Box>
            </Popover>
        </Paper>
    );
};

export default DevicePrinters;
