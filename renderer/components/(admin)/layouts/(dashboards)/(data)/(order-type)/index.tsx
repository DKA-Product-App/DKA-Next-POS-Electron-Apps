'use client';

import * as React from 'react';
import {
    Avatar,
    Box,
    Button,
    Chip,
    Divider,
    Icon,
    List,
    ListItem,
    ListItemAvatar,
    ListItemText,
    Popover,
    Stack,
    Typography,
} from '@mui/material';
import AddRounded from '@mui/icons-material/AddRounded';
import StorefrontRounded from '@mui/icons-material/StorefrontRounded';

import {
    DataTable,
    Column,
    useNonPassiveWheel,
} from './(components)/TablesLayoutConstructor';

/* ========= Types dari response ========= */
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

type ApiOrderType = {
    id: string;
    code: string;                 // e.g. DINE_IN
    name: string;                 // e.g. DINE IN
    icon?: string | null;         // e.g. "restaurant"
    description?: string | null;  // e.g. "Makan Di Tempat"
    required_table_select?: boolean;
    status?: boolean;
    time_created?: string;
    time_updated?: string;
    branches?: ApiBranch[];
};

/* ========= Row type untuk DataTable ========= */
type RowOrderType = {
    id: string;
    code: string;
    name: string;
    icon?: string | null;
    description?: string | null;
    requiredTable: boolean;
    status: boolean;
    branchesCount: number;
    branches: ApiBranch[];
    typeCell: React.ReactNode;
};


/* util kecil */
const initial = (s?: string | null) => (s?.trim()?.[0] ?? 'O').toUpperCase();

export default function OrderTypes() {
    const [rows, setRows] = React.useState<RowOrderType[]>([]);
    const [loading, setLoading] = React.useState(false);
    const [error, setError] = React.useState<string | null>(null);

    // Popover Branches
    const [branchAnchor, setBranchAnchor] = React.useState<HTMLElement | null>(null);
    const [branchTitle, setBranchTitle] = React.useState<string>('');
    const [branchList, setBranchList] = React.useState<ApiBranch[]>([]);
    const listRef = React.useRef<HTMLDivElement>(null);
    useNonPassiveWheel(listRef);

    const openBranches = (e: React.MouseEvent<HTMLElement>, typeName: string, branches: ApiBranch[]) => {
        setBranchAnchor(e.currentTarget);
        setBranchTitle(typeName);
        setBranchList(branches ?? []);
    };
    const closeBranches = () => {
        setBranchAnchor(null);
        setBranchTitle('');
        setBranchList([]);
    };

    const fetchOrderTypes = React.useCallback(() => {
        if (!window.api) {
            console.error('Failed Get Window Api Bridge');
            setError('Bridge tidak tersedia');
            return;
        }
        setLoading(true);
        window.api
            .invoke('api.config.data.order.type:read.all', {})
            .then((result: any) => {
                const data = (result?.data ?? []) as ApiOrderType[];
                const mapped: RowOrderType[] = data.map((o) => ({
                    id: o.id,
                    code: o.code,
                    name: o.name,
                    icon: o.icon ?? null,
                    description: o.description ?? null,
                    requiredTable: !!o.required_table_select,
                    status: !!o.status,
                    branchesCount: o.branches?.length ?? 0,
                    branches: o.branches ?? [],
                    typeCell: (
                        <Stack direction="row" spacing={1.25} alignItems="center" sx={{ minWidth: 0 }}>
                            {o.icon ? (
                                <Avatar variant="rounded" sx={{ width: 32, height: 32, borderRadius: 1 }}>
                                    <Icon fontSize="small">{o.icon}</Icon>
                                </Avatar>
                            ) : (
                                <Avatar variant="rounded" sx={{ width: 32, height: 32, borderRadius: 1 }}>
                                    {initial(o.name)}
                                </Avatar>
                            )}
                            <Box sx={{ minWidth: 0 }}>
                                <Typography variant="body2" fontWeight={600} noWrap title={o.name}>
                                    {o.name}
                                </Typography>
                                <Typography variant="caption" color="text.secondary" noWrap title={o.code}>
                                    {o.code}
                                </Typography>
                            </Box>
                        </Stack>
                    ),
                }));
                setRows(mapped);
                setError(null);
            })
            .catch((err: any) => {
                console.error(err);
                setRows([]);
                setError(err?.msg ?? 'Gagal memuat order types. Periksa Koneksi Jaringan / Server');
            })
            .finally(() => setLoading(false));
    }, []);

    React.useEffect(() => { fetchOrderTypes(); }, [fetchOrderTypes]);

    const columns: Column<RowOrderType>[] = [
        {
            key: 'typeCell',
            label: 'ORDER TYPE',
            sortable: true,
            width: 320,
            minWidth: 240,
            headerFilter: { type: 'text' },
        },
        {
            key: 'description',
            label: 'DESCRIPTION',
            sortable: false,
            width: 420,
            minWidth: 260,
            headerFilter: { type: 'text' },
            render: (r) => (
                <Typography variant="body2" color="text.secondary" noWrap title={r.description ?? ''}>
                    {r.description ?? '—'}
                </Typography>
            ),
        },
        {
            key: 'requiredTable',
            label: 'REQUIRED TABLE',
            sortable: true,
            align: 'center',
            width: 160,
            minWidth: 130,
            render: (r) => (
                <Chip
                    size="small"
                    label={r.requiredTable ? 'Yes' : 'No'}
                    color={r.requiredTable ? 'warning' : 'default'}
                    variant="outlined"
                    sx={{ borderRadius: 2 }}
                />
            ),
        },
        {
            key: 'branchesCount',
            label: 'BRANCHES',
            sortable: true,
            align: 'center',
            width: 140,
            minWidth: 120,
            render: (r) => (
                <Button
                    size="small"
                    variant="outlined"
                    onClick={(e) => openBranches(e, r.name, r.branches)}
                    sx={{ borderRadius: 2, minWidth: 0, px: 1.25 }}
                    startIcon={<StorefrontRounded />}
                >
                    {r.branchesCount}
                </Button>
            ),
        },
        {
            key: 'status',
            label: 'STATUS',
            sortable: true,
            align: 'center',
            width: 120,
            minWidth: 110,
            render: (r) => (
                <Chip
                    size="small"
                    label={r.status ? 'Active' : 'Inactive'}
                    color={r.status ? 'success' : 'default'}
                    variant="outlined"
                    sx={{ borderRadius: 2 }}
                />
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
                    <Typography variant="overline" color="text.secondary">Config / Order Types</Typography>
                    {loading ? (
                        <Typography variant="body2" color="text.secondary">Loading…</Typography>
                    ) : error ? (
                        <Typography variant="body2" color="error.main">{error}</Typography>
                    ) : null}
                </Box>
                <Stack direction="row" spacing={1}>
                    <Button variant="outlined" onClick={fetchOrderTypes}>Refresh</Button>
                    <Button variant="contained" startIcon={<AddRounded />} onClick={() => console.log('open create order type')}>
                        Tambah Order Type
                    </Button>
                </Stack>
            </Stack>

            {/* DataTable */}
            <DataTable<RowOrderType>
                columns={columns}
                rows={rows}
                initialRowsPerPage={15}
                enableSelection={false}
            />

            {/* Popover Branches */}
            <Popover
                open={Boolean(branchAnchor)}
                anchorEl={branchAnchor}
                onClose={closeBranches}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
                transformOrigin={{ vertical: 'top', horizontal: 'center' }}
                PaperProps={{ sx: { width: 420, maxWidth: 'calc(100vw - 32px)', borderRadius: 2, overflow: 'hidden' } }}
            >
                {/* Header */}
                <Box
                    sx={{
                        px: 2, py: 1,
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        backgroundColor: (t) => t.palette.background.paper,
                        borderBottom: (t) => `1px solid ${t.palette.divider}`,
                    }}
                >
                    <Typography variant="subtitle2">Branches — {branchTitle}</Typography>
                    <Chip size="small" variant="outlined" label={`${branchList.length} item`} sx={{ borderRadius: 2 }} />
                </Box>

                {/* List */}
                <Box ref={listRef} sx={{ maxHeight: 360, overflow: 'auto', p: 1, pt: 0.5, minWidth: 320, touchAction: 'pan-y', overscrollBehavior: 'contain' }}>
                    {branchList.length === 0 ? (
                        <Box sx={{ px: 2, py: 3 }}>
                            <Typography variant="body2" color="text.secondary">Tidak ada branch.</Typography>
                        </Box>
                    ) : (
                        <List dense disablePadding>
                            <ListItem
                                disableGutters
                                sx={{
                                    px: 1.5, py: 0.75, position: 'sticky', top: 0, zIndex: 1,
                                    backgroundColor: (t) => t.palette.background.paper,
                                    borderBottom: (t) => `1px solid ${t.palette.divider}`,
                                }}
                            >
                                <Typography variant="caption" sx={{ flex: 1, fontWeight: 700, color: 'text.secondary' }}>
                                    Branch Name
                                </Typography>
                                <Typography variant="caption" sx={{ width: 220, textAlign: 'right', fontWeight: 700, color: 'text.secondary' }}>
                                    Contact
                                </Typography>
                            </ListItem>

                            {branchList.map((b) => (
                                <React.Fragment key={b.id}>
                                    <ListItem
                                        disableGutters
                                        sx={{ px: 1.5, py: 0.75, gap: 1.25, '&:hover': { backgroundColor: (t) => t.palette.action.hover } }}
                                    >
                                        <ListItemAvatar>
                                            <Avatar variant="rounded" sx={{ width: 28, height: 28, borderRadius: 1 }}>
                                                <StorefrontRounded fontSize="small" />
                                            </Avatar>
                                        </ListItemAvatar>
                                        <ListItemText
                                            primary={
                                                <Typography variant="body2" fontWeight={600} noWrap title={b.name}>
                                                    {b.name}
                                                </Typography>
                                            }
                                            secondary={
                                                <Typography variant="caption" color="text.secondary" noWrap title={b.address ?? ''}>
                                                    {b.address ?? '—'}
                                                </Typography>
                                            }
                                            sx={{ m: 0, flex: 1, minWidth: 0 }}
                                        />
                                        <Typography variant="body2" sx={{ width: 220, textAlign: 'right' }}>
                                            {[b.phone, b.email].filter(Boolean).join(' • ') || '—'}
                                        </Typography>
                                    </ListItem>
                                    <Divider sx={{ mx: 1.5 }} />
                                </React.Fragment>
                            ))}
                        </List>
                    )}
                </Box>

                <Box sx={{ px: 1.5, py: 1, textAlign: 'right' }}>
                    <Button size="small" onClick={closeBranches}>Tutup</Button>
                </Box>
            </Popover>
        </Box>
    );
}
