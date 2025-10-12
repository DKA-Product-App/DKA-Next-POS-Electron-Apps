'use client';

import * as React from 'react';
import {
    Box,
    Button,
    Chip,
    Typography,
    Stack,
    Avatar,
    Popover,
    List,
    ListItem,
    ListItemText,
    Divider,
} from '@mui/material';
import AddRounded from '@mui/icons-material/AddRounded';
import PrintRounded from '@mui/icons-material/PrintRounded';
import ReceiptLongRounded from '@mui/icons-material/ReceiptLongRounded';

import {
    MaterialReactTable,
    useMaterialReactTable,
    type MRT_ColumnDef,
} from 'material-react-table';

import PerfectScrollbar from 'react-perfect-scrollbar';
import 'react-perfect-scrollbar/dist/css/styles.css';
import { useGodModeProvider } from '../../../../context/GodModeProviderContext';

/* ================= Helpers ================= */
const toNum = (v?: string | number | null) =>
    v == null ? 0 : typeof v === 'number' ? v : Number(v);
const fmtID = (n: number) =>
    new Intl.NumberFormat('id-ID', { maximumFractionDigits: 0 }).format(n);

/* ================== API types ================== */
type ApiAccountRef = {
    id: string;
    name?: { first_name?: string; last_name?: string };
    username?: string;
};
type ApiPrinter = {
    id: string;
    name: string;
    options?: { mode?: string; port?: number; ip_address?: string; timeout?: number } | null;
    description?: string | null;
    status?: boolean;
};
type ApiCategory = {
    id: string;
    name: string;
    printer?: ApiPrinter[];
    description?: string | null;
    status?: boolean;
};
type ApiProduct = {
    id: string;
    name: string;
    image?: string | null;
    description?: string | null;
    status?: boolean;
    category?: ApiCategory[];
};
type ApiVariant = {
    id: string;
    code?: string;
    name?: string;
    description?: string | null;
    price?: string;
};
type ApiItem = {
    id: string;
    qty: number;
    price: string;
    sub_total: string;
    productVariant?: {
        id: string;
        code?: string;
        name?: string;
        price?: string;
        product?: ApiProduct;
    };
};
type ApiOrderType = { id: string; code: string; name: string };
type ApiShift = { id: string; name: string; start_time?: string; end_time?: string; status?: boolean };
type ApiBranch = { id: string; name: string };
type ApiTransaction = {
    id: string;
    invoice: string;
    branch?: ApiBranch[];
    shift?: ApiShift;
    order_type?: ApiOrderType;
};
type ApiPaid = { id: string; status: boolean; tender: string };
type ApiBill = {
    id: string;
    bill: string; // <-- number string
    tax: number;  // 0.1 = 10%
    time_created?: string;
    reference?: ApiAccountRef;
    branch?: ApiBranch[];
    transaction: ApiTransaction;
    items: ApiItem[];
    paid: ApiPaid;
};
type ApiBillsResponse = { status: boolean; code: number; msg: string; data: ApiBill[] };

/* ================= Popover for items ================= */
function useItemsPopover() {
    const [anchor, setAnchor] = React.useState<HTMLElement | null>(null);
    const [ctx, setCtx] = React.useState<{ title: string; items: ApiItem[] } | null>(null);

    const open = (e: React.MouseEvent<HTMLElement>, title: string, items: ApiItem[]) => {
        setAnchor(e.currentTarget);
        setCtx({ title, items });
    };
    const close = () => {
        setAnchor(null);
        setCtx(null);
    };

    const node = (
        <Popover
            open={Boolean(anchor)}
            anchorEl={anchor}
            onClose={close}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            transformOrigin={{ vertical: 'top', horizontal: 'center' }}
            PaperProps={{ sx: { width: 440, maxWidth: 'calc(100vw - 32px)', borderRadius: 2, overflow: 'hidden' } }}
        >
            <Box
                sx={{
                    px: 2,
                    py: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    borderBottom: (t) => `1px solid ${t.palette.divider}`,
                }}
            >
                <Typography variant="subtitle2">Items — {ctx?.title ?? ''}</Typography>
                <Chip size="small" variant="outlined" label={`${ctx?.items?.length ?? 0} item`} sx={{ borderRadius: 2 }} />
            </Box>

            <Box sx={{ maxHeight: 360 }}>
                <PerfectScrollbar options={{ suppressScrollX: true }}>
                    {!ctx?.items?.length ? (
                        <Box sx={{ px: 2, py: 3 }}>
                            <Typography variant="body2" color="text.secondary">
                                Tidak ada item.
                            </Typography>
                        </Box>
                    ) : (
                        <List dense disablePadding>
                            {ctx.items.map((it, i) => {
                                const p = it.productVariant?.product?.name ?? '—';
                                const v = it.productVariant?.name ? ` · ${it.productVariant?.name}` : '';
                                const qty = it.qty;
                                const price = toNum(it.price);
                                const sub = toNum(it.sub_total) || qty * price;
                                return (
                                    <React.Fragment key={it.id}>
                                        <ListItem
                                            disableGutters
                                            sx={{
                                                px: 1.5,
                                                py: 0.75,
                                                gap: 1.25,
                                                cursor: 'pointer',
                                                '&:hover': { bgcolor: (t) => t.palette.action.hover },
                                            }}
                                            onClick={() => console.log('item clicked', it)}
                                        >
                                            <ListItemText
                                                primary={
                                                    <Typography variant="body2" fontWeight={600} noWrap>
                                                        {p}
                                                        {v}
                                                    </Typography>
                                                }
                                                secondary={
                                                    <Typography variant="caption" color="text.secondary">
                                                        {qty} × {fmtID(price)}
                                                    </Typography>
                                                }
                                                sx={{ m: 0, pr: 1 }}
                                            />
                                            <Typography variant="body2">{fmtID(sub)}</Typography>
                                        </ListItem>
                                        {i < (ctx.items.length - 1) ? <Divider sx={{ mx: 1.5 }} /> : null}
                                    </React.Fragment>
                                );
                            })}
                        </List>
                    )}
                </PerfectScrollbar>
            </Box>

            <Box sx={{ px: 1.5, py: 1, textAlign: 'right' }}>
                <Button size="small" onClick={close}>
                    Tutup
                </Button>
            </Box>
        </Popover>
    );

    return { node, open };
}

/* ================= Row type for MRT ================= */
type RowBill = {
    id: string;
    billNo: string;
    invoice: string;
    branch: string | null;
    orderType: string | null;
    itemsCount: number;
    total: number;
    taxRate: number;
    grandTotal: number;
    paid: boolean;
    tender: number;

    billCell: React.ReactNode;
    _itemsRaw: ApiItem[];
};

/* ================ Mapper ================ */
const mapToRows = (list: ApiBill[]): RowBill[] =>
    (list ?? []).map((b) => {
        const branch = b.branch?.[0]?.name ?? b.transaction?.branch?.[0]?.name ?? null;
        const orderType = b.transaction?.order_type?.name ?? null;
        const items = b.items ?? [];
        const total = items
            .map((it) => toNum(it.sub_total) || toNum(it.price) * it.qty)
            .reduce((a, n) => a + n, 0);
        const taxRate = Number.isFinite(b.tax) ? b.tax : 0;
        const grandTotal = Math.round(total + total * taxRate);
        const tender = toNum(b.paid?.tender);
        const paid = !!b.paid?.status;

        return {
            id: b.id,
            billNo: b.bill,
            invoice: b.transaction?.invoice ?? '—',
            branch,
            orderType,
            itemsCount: items.length,
            total,
            taxRate,
            grandTotal,
            paid,
            tender,
            billCell: (
                <Stack direction="row" spacing={1.25} alignItems="center" sx={{ minWidth: 0 }}>
                    <Avatar variant="rounded" sx={{ width: 32, height: 32, borderRadius: 1 }}>
                        <PrintRounded fontSize="small" />
                    </Avatar>
                    <Box sx={{ minWidth: 0 }}>
                        <Typography variant="body2" fontWeight={700} noWrap title={`#${b.bill} · Inv ${b.transaction?.invoice ?? ''}`}>
                            #{b.bill}
                        </Typography>
                        <Typography variant="caption" color="text.secondary" noWrap title={orderType ?? ''}>
                            Inv {b.transaction?.invoice ?? '—'} · {orderType ?? '—'}
                        </Typography>
                    </Box>
                </Stack>
            ),
            _itemsRaw: items,
        };
    });

/* ================ Component ================ */
export default function TransactionBillsMRT() {
    const [rows, setRows] = React.useState<RowBill[]>([]);
    const [loading, setLoading] = React.useState(false);
    const [error, setError] = React.useState<string | null>(null);
    const { godMode } = useGodModeProvider();

    const { node: itemsPopover, open: openItems } = useItemsPopover();

    const fetchBills = React.useCallback(() => {
        if (!window?.api?.invoke) {
            setError('Bridge tidak tersedia');
            setRows([]);
            return;
        }
        setLoading(true);
        window.api
            .invoke<any, ApiBillsResponse>('api.transaction.bills:read.all', { is_hide: godMode })
            .then((res) => {
                const data = Array.isArray(res?.data) ? res.data : [];
                setRows(mapToRows(data));
                setError(null);
            })
            .catch((err: any) => {
                console.error(err);
                setRows([]);
                setError(err?.msg ?? 'Gagal memuat bills. Periksa Koneksi Jaringan/Server');
            })
            .finally(() => setLoading(false));
    }, [godMode]);

    React.useEffect(() => {
        fetchBills();
    }, [fetchBills]);

    /* ===== Columns ===== */
    const columns = React.useMemo<MRT_ColumnDef<RowBill>[]>(
        () => [
            {
                id: 'bill',
                header: 'BILL',
                size: 320,
                accessorFn: (r) => r.billNo,
                Cell: ({ row }) => row.original.billCell,
            },
            {
                id: 'branch',
                header: 'BRANCH',
                size: 220,
                accessorKey: 'branch',
                Cell: ({ cell }) => (
                    <Typography variant="body2" color="text.secondary" noWrap title={String(cell.getValue() ?? '')}>
                        {String(cell.getValue() ?? '—')}
                    </Typography>
                ),
            },
            {
                id: 'orderType',
                header: 'ORDER TYPE',
                size: 160,
                accessorKey: 'orderType',
                Cell: ({ cell }) => (
                    <Chip size="small" label={String(cell.getValue() ?? '—')} variant="outlined" sx={{ borderRadius: 2 }} />
                ),
            },
            {
                id: 'items',
                header: 'ITEMS',
                size: 120,
                accessorKey: 'itemsCount',
                muiTableBodyCellProps: { align: 'center' },
                muiTableHeadCellProps: { align: 'center' },
                Cell: ({ row }) => (
                    <Button
                        size="small"
                        variant="outlined"
                        startIcon={<ReceiptLongRounded />}
                        onClick={(e) => openItems(e, `#${row.original.billNo}`, row.original._itemsRaw)}
                        sx={{ borderRadius: 2, minWidth: 0, px: 1.25 }}
                    >
                        {row.original.itemsCount}
                    </Button>
                ),
            },
            {
                id: 'total',
                header: 'TOTAL',
                size: 140,
                accessorKey: 'total',
                muiTableBodyCellProps: { align: 'right' },
                muiTableHeadCellProps: { align: 'right' },
                Cell: ({ cell }) => <Typography variant="body2">{fmtID(toNum(cell.getValue() as number))}</Typography>,
            },
            {
                id: 'grandTotal',
                header: 'GRAND TOTAL',
                size: 160,
                accessorKey: 'grandTotal',
                muiTableBodyCellProps: { align: 'right' },
                muiTableHeadCellProps: { align: 'right' },
                Cell: ({ row }) => (
                    <Stack alignItems="flex-end">
                        <Typography variant="body2" fontWeight={700}>
                            {fmtID(row.original.grandTotal)}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                            Tax {Math.round(row.original.taxRate * 100)}%
                        </Typography>
                    </Stack>
                ),
            },
            {
                id: 'paid',
                header: 'PAID',
                size: 120,
                accessorKey: 'paid',
                muiTableBodyCellProps: { align: 'center' },
                muiTableHeadCellProps: { align: 'center' },
                Cell: ({ row }) => (
                    <Chip
                        size="small"
                        label={row.original.paid ? 'Paid' : 'Unpaid'}
                        color={row.original.paid ? 'success' : 'default'}
                        variant="outlined"
                        sx={{ borderRadius: 2 }}
                    />
                ),
            },
        ],
        [openItems]
    );

    const table = useMaterialReactTable({
        columns,
        data: rows,
        enableExpanding: false,
        state: { showProgressBars: loading },
        columnFilterDisplayMode: 'popover',
        paginationDisplayMode: 'pages',
        positionToolbarAlertBanner: 'bottom',
        enableRowSelection: false,
        enableStickyHeader: true,
        initialState: { density: 'comfortable', pagination: { pageSize: 15, pageIndex: 0 } },
        muiTablePaperProps: { sx: { display: 'flex', flexDirection: 'column', flex: 1 } },
        muiTableContainerProps: { sx: { flex: 1 } },
        renderTopToolbarCustomActions: () => (
            <Stack
                direction="row"
                alignItems="center"
                justifyContent="space-between"
                sx={{ width: '100%', gap: 1 }}
            >
                <Box>
                    <Typography variant="overline" color="text.secondary">
                        Transactions / Bills
                    </Typography>
                    {loading ? (
                        <Typography variant="body2" color="text.secondary">
                            Loading…
                        </Typography>
                    ) : error ? (
                        <Typography variant="body2" color="error.main">
                            {error}
                        </Typography>
                    ) : null}
                </Box>
                <Stack direction="row" spacing={1}>
                    <Button variant="outlined" onClick={fetchBills}>
                        Refresh
                    </Button>
                    <Button
                        variant="contained"
                        startIcon={<AddRounded />}
                        onClick={() => console.log('open create bill')}
                    >
                        Tambah Bill
                    </Button>
                </Stack>
            </Stack>
        ),
    });

    return (
        <Box sx={{ p: 2, height: '100%', display: 'flex', flexDirection: 'column', minHeight: 0 }}>
            <MaterialReactTable table={table} />
            {itemsPopover}
        </Box>
    );
}
