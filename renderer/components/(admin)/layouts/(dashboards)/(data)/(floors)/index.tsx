'use client';

import * as React from 'react';
import {
    Avatar,
    Box,
    Button,
    Chip,
    Divider,
    IconButton,
    List,
    ListItem,
    ListItemAvatar,
    ListItemText,
    Popover,
    Stack,
    Typography,
    Paper,
    Tooltip,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    Switch,
    FormControlLabel,
} from '@mui/material';
import Grid2 from '@mui/material/Grid';
import TableRestaurantRounded from '@mui/icons-material/TableRestaurantRounded';
import AddRounded from '@mui/icons-material/AddRounded';
import EditRounded from '@mui/icons-material/EditRounded';
import DeleteOutlineRounded from '@mui/icons-material/DeleteOutlineRounded';
import {
    MaterialReactTable,
    useMaterialReactTable,
    createMRTColumnHelper,
} from 'material-react-table';
import SweetAlert2, { SweetAlert2Props } from 'react-sweetalert2';

/* ====== API Types ====== */
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
    reference?: ApiAccountRef;
};
type TableCoordinate = { x: number; y: number };
type TableDimension = { width: number; height: number; rotate: number };
type ApiTable = {
    id: string;
    code: string;
    name: string;
    shape: 'RECTANGLE' | 'CIRCLE' | 'ELLIPSE' | string;
    capacity: number;
    coordinate?: TableCoordinate;
    dimension?: TableDimension;
    state?: 'AVAILABLE' | 'OCCUPIED' | 'RESERVED' | string;
    status?: boolean;
    time_created?: string;
    time_updated?: string;
};
type ApiFloor = {
    id: string;
    code: string;
    name: string;
    status?: boolean;
    time_created?: string;
    time_updated?: string;
    reference?: ApiAccountRef;
    branches?: ApiBranch[];
    tables?: ApiTable[];
};

/* ====== Row & Form ====== */
type RowFloor = {
    id: string;
    code: string;
    name: string;
    status: boolean;
    branchName?: string | null;
    tablesCount: number;
    tables: ApiTable[];
};
type FloorForm = { id?: string; code: string; name: string; status: boolean };
const emptyForm: FloorForm = { code: '', name: '', status: true };

export default function Floors() {
    const column = createMRTColumnHelper<RowFloor>();

    const [rows, setRows] = React.useState<RowFloor[]>([]);
    const [loading, setLoading] = React.useState(false);

    // Popover tables
    const [tablesAnchor, setTablesAnchor] = React.useState<HTMLElement | null>(null);
    const [tablesTitle, setTablesTitle] = React.useState<string>('');
    const [tablesList, setTablesList] = React.useState<ApiTable[]>([]);

    // Form modal (Add/Edit)
    const [formOpen, setFormOpen] = React.useState(false);
    const [formMode, setFormMode] = React.useState<'create' | 'edit'>('create');
    const [form, setForm] = React.useState<FloorForm>(emptyForm);
    const [saving, setSaving] = React.useState(false);

    // SweetAlert2 controlled props
    const [swalProps, setSwalProps] = React.useState<SweetAlert2Props>({});

    const openTables = (e: React.MouseEvent<HTMLElement>, floorName: string, tables: ApiTable[]) => {
        setTablesAnchor(e.currentTarget);
        setTablesTitle(floorName);
        setTablesList(tables ?? []);
    };
    const closeTables = () => {
        setTablesAnchor(null);
        setTablesTitle('');
        setTablesList([]);
    };

    const fetchFloors = React.useCallback(() => {
        if (!window.api) {
            console.error('Failed Get Window Api Bridge');
            setRows([]);
            return;
        }
        setLoading(true);
        window.api
            .invoke('api.config.data.floors:read.all', {})
            .then((result: any) => {
                const data = (result?.data ?? []) as ApiFloor[];
                const mapped: RowFloor[] = data.map((f) => ({
                    id: f.id,
                    code: f.code,
                    name: f.name,
                    status: !!f.status,
                    branchName: f.branches?.[0]?.name ?? null,
                    tablesCount: f.tables?.length ?? 0,
                    tables: f.tables ?? [],
                }));
                setRows(mapped);
            })
            .catch((err: any) => {
                console.error(err);
                setRows([]);
            })
            .finally(() => setLoading(false));
    }, []);

    React.useEffect(() => {
        fetchFloors();
    }, [fetchFloors]);

    /* ====== Add/Edit handlers ====== */
    const openCreate = React.useCallback(() => {
        setFormMode('create'); setForm(emptyForm); setFormOpen(true);
    }, []);
    const openEdit = React.useCallback((row: RowFloor) => {
        setFormMode('edit'); setForm({ id: row.id, code: row.code, name: row.name, status: row.status }); setFormOpen(true);
    }, []);
    const closeForm = React.useCallback(() => setFormOpen(false), []);

    const submitForm = React.useCallback(() => {
        if (!window.api) return;
        if (!form.code.trim() || !form.name.trim()) {
            setSwalProps({
                show: true,
                icon: 'warning',
                title: 'Lengkapi Data',
                text: 'Code dan Name wajib diisi.',
            });
            return;
        }
        setSaving(true);
        (formMode === 'create'
                ? window.api.invoke('api.config.data.floors:create', { code: form.code.trim(), name: form.name.trim(), status: !!form.status })
                : window.api.invoke('api.config.data.floors:update.one', { id: form.id, code: form.code.trim(), name: form.name.trim(), status: !!form.status })
        )
            .then(() => setSwalProps({ show: true, icon: 'success', title: formMode === 'create' ? 'Floor dibuat' : 'Floor diperbarui', timer: 1200, showConfirmButton: false }))
            .then(() => { setFormOpen(false); return fetchFloors(); })
            .catch((e: any) => setSwalProps({ show: true, icon: 'error', title: 'Gagal simpan', text: e?.msg ?? String(e) }))
            .finally(() => setSaving(false));
    }, [form, formMode, fetchFloors]);

    /* ====== Delete with SweetAlert2 (component) ====== */
    const onDelete = React.useCallback((row: RowFloor) => {
        setSwalProps({
            show: true,
            icon: 'warning',
            title: 'Hapus floor?',
            html: `<b>${row.code} — ${row.name}</b> akan dihapus permanen.`,
            showCancelButton: true,
            confirmButtonText: 'Ya, hapus',
            cancelButtonText: 'Batal',
            reverseButtons: true,
            // simpan id di "willOpen" dataset? lebih simpel: closure di onResolve:
            // (lihat di onResolve di bawah)
            // tidak perlu apa-apa di sini.
        });
        // simpan target row di ref state untuk diakses saat resolve:
        (onDelete as any)._target = row as RowFloor;
    }, []);
    // handler resolve swal (confirm/cancel)
    const handleSwalResolve = React.useCallback((result: any) => {
        if (!result?.isConfirmed) { setSwalProps({}); return; }
        const row: RowFloor | undefined = (onDelete as any)._target;
        if (!row || !window.api) { setSwalProps({}); return; }
        window.api
            .invoke('api.config.data.floors:delete.one', { id: row.id })
            .then(() => setSwalProps({ show: true, icon: 'success', title: 'Terhapus', timer: 1200, showConfirmButton: false }))
            .then(() => fetchFloors())
            .catch((e: any) => setSwalProps({ show: true, icon: 'error', title: 'Gagal menghapus', text: e?.msg ?? String(e) }))
            .finally(() => { (onDelete as any)._target = undefined; });
    }, [fetchFloors]);

    /* ====== Table ====== */
    const table = useMaterialReactTable({
        columns: [
            // CODE / NAME
            column.display({
                id: 'codeName',
                header: 'CODE / NAME',
                size: 320,
                Cell: ({ row }) => {
                    const r = row.original;
                    return (
                        <Stack direction="row" spacing={1.25} alignItems="center" sx={{ minWidth: 0 }}>
                            <Avatar variant="rounded" sx={{ width: 32, height: 32, borderRadius: 1 }}>
                                {r.code?.[0] ?? 'F'}
                            </Avatar>
                            <Box sx={{ minWidth: 0 }}>
                                <Typography variant="body2" fontWeight={600} noWrap title={r.code}>{r.code}</Typography>
                                <Typography variant="caption" color="text.secondary" noWrap title={r.name}>{r.name}</Typography>
                            </Box>
                        </Stack>
                    );
                },
            }),
            // BRANCH
            column.accessor('branchName', {
                header: 'BRANCH',
                size: 260,
                Cell: ({ renderedCellValue }) => (
                    <Typography variant="body2" color="text.secondary" noWrap title={String(renderedCellValue ?? '')}>
                        {renderedCellValue ?? '—'}
                    </Typography>
                ),
            }),
            // TABLES
            column.display({
                id: 'tables',
                header: 'TABLES',
                size: 140,
                Cell: ({ row }) => {
                    const r = row.original;
                    return (
                        <Button
                            size="small" variant="outlined"
                            onClick={(e) => openTables(e, `${r.code} — ${r.name}`, r.tables)}
                            sx={{ borderRadius: 2, minWidth: 0, px: 1.25 }}
                            startIcon={<TableRestaurantRounded />}
                        >
                            {r.tablesCount}
                        </Button>
                    );
                },
                muiTableBodyCellProps: { align: 'center' },
            }),
            // STATUS
            column.display({
                id: 'status',
                header: 'STATUS',
                size: 120,
                Cell: ({ row }) => {
                    const active = row.original.status;
                    return (
                        <Chip
                            size="small"
                            label={active ? 'Active' : 'Inactive'}
                            color={active ? 'success' : 'default'}
                            variant="outlined"
                            sx={{ borderRadius: 2 }}
                        />
                    );
                },
                muiTableBodyCellProps: { align: 'center' },
            }),
            // ACTIONS
            column.display({
                id: 'actions',
                header: 'ACTIONS',
                size: 120,
                Cell: ({ row }) => {
                    const r = row.original;
                    return (
                        <Stack direction="row" spacing={0.5} justifyContent="flex-end">
                            <Tooltip title="Edit">
                                <IconButton size="small" onClick={() => openEdit(r)}>
                                    <EditRounded fontSize="small" />
                                </IconButton>
                            </Tooltip>
                            <Tooltip title="Delete">
                                <IconButton size="small" color="error" onClick={() => onDelete(r)}>
                                    <DeleteOutlineRounded fontSize="small" />
                                </IconButton>
                            </Tooltip>
                        </Stack>
                    );
                },
                muiTableBodyCellProps: { align: 'right' },
                enableColumnFilter: false,
                enableSorting: false,
            }),
        ],
        data: rows,
        state: { isLoading: loading },
        initialState: { density: 'compact' },
        enableRowSelection: false,
        columnFilterDisplayMode: 'popover',
        paginationDisplayMode: 'pages',
        positionToolbarAlertBanner: 'bottom',
        enableStickyHeader: true,
        muiTablePaperProps: { sx: { display: 'flex', flexDirection: 'column', flex: 1 } },
        muiTableContainerProps: { sx: { flex: 1 } },
        renderTopToolbarCustomActions: () => (
            <Stack direction="row" alignItems="center" justifyContent="flex-end" sx={{ mb: 1.5, width: '100%' }}>
                <Button variant="outlined" startIcon={<AddRounded />} onClick={openCreate}>
                    Tambah Floor
                </Button>
            </Stack>
        ),
    });

    return (
        <Paper
            variant="outlined"
            sx={{ p: 2, height: '100%', display: 'flex', flexDirection: 'column', minHeight: 0 }}
        >
            <Box sx={{ flex: 1, minHeight: 0, display: 'flex' }}>
                <MaterialReactTable table={table} />
            </Box>

            {/* Popover Tables */}
            <Popover
                open={Boolean(tablesAnchor)}
                anchorEl={tablesAnchor}
                onClose={closeTables}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
                transformOrigin={{ vertical: 'top', horizontal: 'center' }}
                PaperProps={{ sx: { width: 560, maxWidth: 'calc(100vw - 32px)', borderRadius: 2, overflow: 'hidden' } }}
            >
                <Box sx={{ px: 2, py: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between', backgroundColor: (t) => t.palette.background.paper, borderBottom: (t) => `1px solid ${t.palette.divider}` }}>
                    <Typography variant="subtitle2">Tables — {tablesTitle}</Typography>
                    <Chip size="small" variant="outlined" label={`${tablesList.length} item`} sx={{ borderRadius: 2 }} />
                </Box>
                <Box sx={{ maxHeight: 420, overflow: 'auto', p: 1, pt: 0.5, minWidth: 360, touchAction: 'pan-y', overscrollBehavior: 'contain' }}>
                    {tablesList.length === 0 ? (
                        <Box sx={{ px: 2, py: 3 }}>
                            <Typography variant="body2" color="text.secondary">Tidak ada meja.</Typography>
                        </Box>
                    ) : (
                        <List dense disablePadding>
                            <ListItem disableGutters sx={{ px: 1.5, py: 0.75, position: 'sticky', top: 0, zIndex: 1, backgroundColor: (t) => t.palette.background.paper, borderBottom: (t) => `1px solid ${t.palette.divider}` }}>
                                <Typography variant="caption" sx={{ flex: 1, fontWeight: 700, color: 'text.secondary' }}>Code / Name</Typography>
                                <Typography variant="caption" sx={{ width: 160, textAlign: 'right', fontWeight: 700, color: 'text.secondary' }}>Shape • Capacity</Typography>
                                <Typography variant="caption" sx={{ width: 140, textAlign: 'right', fontWeight: 700, color: 'text.secondary' }}>State</Typography>
                            </ListItem>
                            {tablesList.map((t) => {
                                const shape = t.shape ?? '—';
                                const capacity = Number.isFinite(t.capacity) ? t.capacity : '—';
                                const state = t.state ?? '—';
                                const coord = t.coordinate ? `(${t.coordinate.x}, ${t.coordinate.y})` : '';
                                const dim = t.dimension ? `${t.dimension.width}×${t.dimension.height}${Number.isFinite(t.dimension.rotate) && t.dimension.rotate !== 0 ? ` • rot ${t.dimension.rotate}°` : ''}` : '';
                                return (
                                    <React.Fragment key={t.id}>
                                        <ListItem disableGutters sx={{ px: 1.5, py: 0.75, gap: 1.25, '&:hover': { backgroundColor: (th) => th.palette.action.hover } }}>
                                            <ListItemAvatar>
                                                <Avatar variant="rounded" sx={{ width: 28, height: 28, borderRadius: 1 }}>
                                                    <TableRestaurantRounded fontSize="small" />
                                                </Avatar>
                                            </ListItemAvatar>
                                            <ListItemText
                                                primary={
                                                    <Stack direction="row" spacing={1} alignItems="center" sx={{ minWidth: 0 }}>
                                                        <Typography variant="body2" fontWeight={600} noWrap title={t.code}>{t.code}</Typography>
                                                        <Typography variant="body2" color="text.secondary" noWrap title={t.name}>— {t.name}</Typography>
                                                    </Stack>
                                                }
                                                secondary={(coord || dim) ? (<Typography variant="caption" color="text.secondary" noWrap title={`${coord} ${dim}`.trim()}>{coord}{coord && dim ? ' • ' : ''}{dim}</Typography>) : null}
                                                sx={{ m: 0, flex: 1, minWidth: 0 }}
                                            />
                                            <Typography variant="body2" sx={{ width: 160, textAlign: 'right' }}><strong>{shape}</strong>{' '}•{' '}{capacity}</Typography>
                                            <Typography variant="body2" sx={{ width: 140, textAlign: 'right' }}>{state}</Typography>
                                        </ListItem>
                                        <Divider sx={{ mx: 1.5 }} />
                                    </React.Fragment>
                                );
                            })}
                        </List>
                    )}
                </Box>
                <Box sx={{ px: 1.5, py: 1, textAlign: 'right' }}>
                    <Button size="small" onClick={() => setTablesAnchor(null)}>Tutup</Button>
                </Box>
            </Popover>

            {/* SweetAlert2 (controlled) */}
            <SweetAlert2
                {...swalProps}
                didClose={() => setSwalProps({})}
                onResolve={handleSwalResolve}
            />

            {/* Dialog Add/Edit */}
            <Dialog open={formOpen} onClose={closeForm} fullWidth maxWidth="xl">
                <DialogTitle>{formMode === 'create' ? 'Tambah Floor' : 'Edit Floor'}</DialogTitle>
                <DialogContent dividers>
                    <Grid2 container spacing={2}>
                        <Grid2 size={{ xs: 12, sm: 6 }}>
                            <TextField label="Code" value={form.code} onChange={(e) => setForm((p) => ({ ...p, code: e.target.value }))} fullWidth />
                        </Grid2>
                        <Grid2 size={{ xs: 12, sm: 6 }}>
                            <TextField label="Name" value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} fullWidth />
                        </Grid2>
                        <Grid2 size={{ xs: 12, sm: 6 }}>
                            <FormControlLabel
                                control={<Switch checked={form.status} onChange={(e) => setForm((p) => ({ ...p, status: e.target.checked }))} />}
                                label="Active"
                            />
                        </Grid2>
                    </Grid2>
                </DialogContent>
                <DialogActions>
                    <Button onClick={closeForm}>Batal</Button>
                    <Button variant="contained" onClick={submitForm} disabled={saving}>
                        {formMode === 'create' ? 'Simpan' : 'Update'}
                    </Button>
                </DialogActions>
            </Dialog>
        </Paper>
    );
}
