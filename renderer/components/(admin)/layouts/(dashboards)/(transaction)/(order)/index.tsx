'use client';

import * as React from 'react';
import {
    Avatar,
    Box,
    Button,
    Chip,
    Divider,
    List,
    ListItem,
    ListItemAvatar,
    ListItemText,
    Popover,
    Stack,
    Typography,
} from '@mui/material';
import ReceiptLongRounded from '@mui/icons-material/ReceiptLongRounded';
import LayersRounded from '@mui/icons-material/LayersRounded';
import ShoppingCartRounded from '@mui/icons-material/ShoppingCartRounded';
import PaidRounded from '@mui/icons-material/PaidRounded';
import ScheduleRounded from '@mui/icons-material/ScheduleRounded';

import {
    MaterialReactTable,
    useMaterialReactTable,
    type MRT_ColumnDef,
} from 'material-react-table';

import {
    DataTable,
    Column,
    useNonPassiveWheel,
} from './(components)/TablesLayoutConstructor';

import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterMoment } from '@mui/x-date-pickers/AdapterMoment';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import moment from 'moment'; // Import moment for date handling

/* ========= Types dari response ========= */
type ApiName = { first_name?: string; last_name?: string };
type ApiRef = {
    id: string;
    name?: ApiName;
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
    reference?: ApiRef;
};

type ApiOrderType = {
    id: string;
    code: string;
    name: string;
    icon?: string | null;
    description?: string | null;
    required_table_select?: boolean;
    status?: boolean;
    time_created?: string;
    time_updated?: string;
};

type ApiFloor = { id: string; code: string; name: string; status?: boolean };
type TableCoordinate = { x: number; y: number };
type TableDimension = { width: number; height: number; rotate: number };

type ApiTable = {
    id: string;
    code: string;
    name: string;
    shape?: string;
    capacity?: number;
    coordinate?: TableCoordinate;
    dimension?: TableDimension;
    state?: string;
    status?: boolean;
    time_created?: string;
    time_updated?: string;
    reference?: ApiRef;
    floor?: ApiFloor;
};

type ApiCategoryPrinter = {
    id: string;
    name: string;
    description?: string | null;
    options?: any;
    status?: boolean;
};

type ApiCategory = {
    id: string;
    name: string;
    description?: string | null;
    status?: boolean;
    printer?: ApiCategoryPrinter[];
};

type ApiProduct = {
    id: string;
    name: string;
    description?: string | null;
    image?: string | null;
    status?: boolean;
    category?: ApiCategory[];
};

type ApiVariant = {
    id: string;
    code: string;
    name: string;
    description?: string | null;
    price: string | number;
    time_created?: string;
    time_updated?: string;
};

type ApiTxnItem = {
    id: string;
    qty: number;
    price: string;
    sub_total: string;
    note?: string | null;
    time_created?: string;
    time_updated?: string;
    void?: boolean | null;
    reference?: ApiRef;
    product: ApiProduct;
    variant: ApiVariant;
};

type ApiBatch = {
    id: string;
    batch: number;
    note?: string | null;
    time_created?: string;
    time_updated?: string;
    reference?: ApiRef;
    items: ApiTxnItem[];
};

type ApiBillItem = {
    id: string;
    qty: number;
    price: string;
    sub_total: string;
    time_created?: string;
    time_updated?: string;
    transactionItem: {
        id: string;
        qty: number;
        price: string;
        sub_total: string;
        note?: string | null;
        time_created?: string;
        time_updated?: string;
        void?: boolean | null;
    };
};

type ApiBill = {
    id: string;
    number: string;
    paid?: { time?: string; status?: boolean };
    time_created?: string;
    time_updated?: string;
    items: ApiBillItem[];
};

type ApiShift = {
    id: string;
    name: string;
    start_time: string;
    end_time: string;
    status?: boolean;
    reference?: ApiRef;
};

type ApiTransactionOrder = {
    id: string;
    invoice: string;
    time_created: string;
    time_updated: string;
    time_closed?: string | null;
    reference?: ApiRef;      // << pembuat transaksi
    branch?: ApiBranch[];
    shift?: ApiShift;
    order_type?: ApiOrderType;
    table?: ApiTable | null;
    batches?: ApiBatch[];
    bills?: ApiBill[];
};

/* ========= Row model ========= */
type RowTxn = {
    id: string;
    invoice: string;
    branchName?: string | null;
    orderType?: string | null;
    tableCode?: string | null;
    shiftName?: string | null;
    createdAt: string;
    closedAt?: string | null;
    createdBy?: string | null;

    // counts
    batchesCount: number;
    itemsCount: number;
    billsCount: number;

    // status counters
    successPaidCount: number;
    pendingPaidCount: number;
    voidedCount: number;
    pendingVoidCount: number;
    fullyPaid: boolean;

    // raw
    batches: ApiBatch[];
    bills: ApiBill[];

    invoiceCell: React.ReactNode;
};

/* ===== Utils ===== */
const TZ = 'Asia/Makassar';
const fmtDateTime = (iso?: string | null) => {
    if (!iso) return '—';
    try {
        return new Intl.DateTimeFormat('en-GB', {
            timeZone: TZ,
            day: '2-digit', month: 'short', year: 'numeric',
            hour: '2-digit', minute: '2-digit',
            hour12: false,
        }).format(new Date(iso));
    } catch { return iso || '—'; }
};
const toIDR = (v: string | number | null | undefined) => {
    const n = typeof v === 'string' ? Number(v) : v ?? 0;
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 })
        .format(Number.isFinite(n as number) ? (n as number) : 0);
};
const fullName = (r?: ApiRef) =>
    [r?.name?.first_name, r?.name?.last_name].filter(Boolean).join(' ').trim() ||
    r?.username || '—';

export default function TransactionOrders() {
    const [rows, setRows] = React.useState<RowTxn[]>([]);
    const [loading, setLoading] = React.useState(false);
    const [error, setError] = React.useState<string | null>(null);

    // Pagination State
    const [pagination, setPagination] = React.useState({
        pageIndex: 0,
        pageSize: 15,
    });
    const [rowCount, setRowCount] = React.useState(0);

    // Date Filter State
    const [startDate, setStartDate] = React.useState<moment.Moment | null>(moment().startOf('day'));
    const [endDate, setEndDate] = React.useState<moment.Moment | null>(moment().endOf('day'));

    // Popover: Batches
    const [batchAnchor, setBatchAnchor] = React.useState<HTMLElement | null>(null);
    const [batchTitle, setBatchTitle] = React.useState<string>('');
    const [batchList, setBatchList] = React.useState<ApiBatch[]>([]);
    const batchListRef = React.useRef<HTMLDivElement>(null);
    useNonPassiveWheel(batchListRef);

    // Popover: Items (flatten)
    const [itemAnchor, setItemAnchor] = React.useState<HTMLElement | null>(null);
    const [itemTitle, setItemTitle] = React.useState<string>('');
    const [flatItems, setFlatItems] = React.useState<ApiTxnItem[]>([]);
    const [itemBillMap, setItemBillMap] = React.useState<Map<string, { paid: boolean; billIds: string[] }>>(new Map());
    const itemListRef = React.useRef<HTMLDivElement>(null);
    useNonPassiveWheel(itemListRef);

    const openBatches = (e: React.MouseEvent<HTMLElement>, invoice: string, batches: ApiBatch[]) => {
        setBatchAnchor(e.currentTarget);
        setBatchTitle(`Invoice ${invoice}`);
        setBatchList(batches ?? []);
    };
    const closeBatches = () => {
        setBatchAnchor(null);
        setBatchTitle('');
        setBatchList([]);
    };

    const openItems = (
        e: React.MouseEvent<HTMLElement>,
        invoice: string,
        batches: ApiBatch[],
        bills: ApiBill[]
    ) => {
        setItemAnchor(e.currentTarget);
        setItemTitle(`Invoice ${invoice}`);
        const items = (batches ?? []).flatMap(b => b.items ?? []);
        setFlatItems(items);

        // map transactionItemId -> paid boolean, bill ids
        const map = new Map<string, { paid: boolean; billIds: string[] }>();
        for (const bill of bills ?? []) {
            const paid = !!bill.paid?.status;
            for (const it of bill.items ?? []) {
                const tid = it.transactionItem?.id;
                if (!tid) continue;
                const prev = map.get(tid);
                if (!prev) map.set(tid, { paid, billIds: [bill.id] });
                else map.set(tid, { paid: prev.paid || paid, billIds: Array.from(new Set([...prev.billIds, bill.id])) });
            }
        }
        setItemBillMap(map);
    };
    const closeItems = () => {
        setItemAnchor(null);
        setItemTitle('');
        setFlatItems([]);
        setItemBillMap(new Map());
    };

    const fetchTxns = React.useCallback(() => {
        if (!window.api) {
            console.error('Failed Get Window Api Bridge');
            setError('Bridge tidak tersedia');
            return;
        }
        setLoading(true);

        const { pageIndex, pageSize } = pagination;
        const payload: any = {
            page: pageIndex + 1,
            limit: pageSize,
        };

        if (startDate && endDate) {
            payload.startAt = startDate.format('YYYY-MM-DD HH:mm:ss');
            payload.endAt = endDate.format('YYYY-MM-DD HH:mm:ss');
        }

        window.api
            .invoke('api.transaction:read.all', payload)
            .then((result: any) => {
                const data = (result?.data ?? []) as ApiTransactionOrder[];

                const mapped: RowTxn[] = data.map((t) => {
                    const branchName = t.branch?.[0]?.name ?? null;
                    const batches = t.batches ?? [];
                    const bills = t.bills ?? [];

                    const items = batches.flatMap(b => b.items ?? []);
                    const totalItems = items.length;

                    // Build bill-paid map
                    const paidMap = new Map<string, boolean>();
                    for (const bill of bills) {
                        const paid = !!bill.paid?.status;
                        for (const it of bill.items ?? []) {
                            const tid = it.transactionItem?.id;
                            if (!tid) continue;
                            paidMap.set(tid, (paidMap.get(tid) || false) || paid);
                        }
                    }

                    // Counters
                    let successPaid = 0, pendingPaid = 0, voided = 0, pendingVoid = 0;
                    for (const it of items) {
                        const isVoided = it.void === true;
                        const isPendingVoid = it.void === null; // null = pending void
                        const isPaid = paidMap.get(it.id) === true;

                        if (isVoided) voided++;
                        if (isPendingVoid) pendingVoid++;

                        if (!isVoided) {
                            if (isPaid) successPaid++;
                            else pendingPaid++;
                        }
                    }
                    const nonVoidedItems = totalItems - voided;
                    const fullyPaid = nonVoidedItems > 0 ? successPaid === nonVoidedItems : false;

                    return {
                        id: t.id,
                        invoice: t.invoice,
                        branchName,
                        orderType: t.order_type?.name ?? null,
                        tableCode: t.table?.code ?? null,
                        shiftName: t.shift?.name ?? null,
                        createdAt: t.time_created,
                        closedAt: t.time_closed ?? null,
                        createdBy: fullName(t.reference),

                        batchesCount: batches.length,
                        itemsCount: totalItems,
                        billsCount: bills.length,

                        successPaidCount: successPaid,
                        pendingPaidCount: pendingPaid,
                        voidedCount: voided,
                        pendingVoidCount: pendingVoid,
                        fullyPaid,

                        batches,
                        bills,

                        invoiceCell: (
                            <Stack direction="row" spacing={1.25} alignItems="center" sx={{ minWidth: 0 }}>
                                <Avatar variant="rounded" sx={{ width: 32, height: 32, borderRadius: 1 }}>
                                    <ReceiptLongRounded fontSize="small" />
                                </Avatar>
                                <Box sx={{ minWidth: 0 }}>
                                    <Typography variant="body2" fontWeight={600} noWrap title={t.invoice}>
                                        {t.invoice}
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary" noWrap title={fmtDateTime(t.time_created)}>
                                        {fmtDateTime(t.time_created)}
                                    </Typography>
                                </Box>
                            </Stack>
                        ),
                    };
                });

                setRows(mapped);

                // Handle pagination meta
                if (result?.meta?.total) {
                    setRowCount(result.meta.total);
                } else {
                    setRowCount(data.length);
                }

                setError(null);
            })
            .catch((err: any) => {
                console.error(err);
                setRows([]);
                setError(err?.msg ?? 'Gagal memuat transaksi. Periksa Koneksi Jaringan / Server');
            })
            .finally(() => setLoading(false));
    }, [pagination.pageIndex, pagination.pageSize, startDate, endDate]);

    React.useEffect(() => { fetchTxns(); }, [fetchTxns]);

    const columns = React.useMemo<MRT_ColumnDef<RowTxn>[]>(() => [
        {
            accessorKey: 'invoice',
            header: 'INVOICE',
            size: 180,
            Cell: ({ row }) => row.original.invoiceCell,
        },
        {
            accessorKey: 'branchName',
            header: 'BRANCH',
            size: 120,
            Cell: ({ cell }) => cell.getValue<string>() || '—',
        },
        {
            accessorKey: 'orderType',
            header: 'ORDER TYPE',
            size: 120,
            Cell: ({ cell }) => <Chip size="small" label={cell.getValue<string>() || '—'} variant="outlined" />,
        },
        {
            accessorKey: 'tableCode',
            header: 'TABLE',
            size: 100,
            Cell: ({ cell }) => <Chip size="small" label={cell.getValue<string>() || '—'} variant="filled" />,
        },
        {
            accessorKey: 'shiftName',
            header: 'SHIFT',
            size: 120,
            Cell: ({ cell }) => cell.getValue<string>() || '—',
        },
        {
            accessorKey: 'createdBy',
            header: 'CASHIER',
            size: 140,
            Cell: ({ cell }) => cell.getValue<string>() || '—',
        },
        {
            accessorKey: 'fullyPaid',
            header: 'STATUS',
            size: 120,
            Cell: ({ cell }) => (
                <Chip
                    size="small"
                    label={cell.getValue() ? 'PAID' : 'UNPAID'}
                    color={cell.getValue() ? 'success' : 'default'}
                    variant="filled"
                    sx={{ borderRadius: 2 }}
                />
            ),
        },
        {
            accessorKey: 'successPaidCount',
            header: 'PAID ✅',
            size: 100,
            muiTableBodyCellProps: { align: 'center' },
            Cell: ({ cell }) => (
                <Chip size="small" label={cell.getValue<number>()} color={cell.getValue() ? 'success' : 'default'} variant="outlined" sx={{ borderRadius: 2 }} />
            ),
        },
        {
            accessorKey: 'pendingPaidCount',
            header: 'PAID ⏳',
            size: 100,
            muiTableBodyCellProps: { align: 'center' },
            Cell: ({ cell }) => (
                <Chip size="small" label={cell.getValue<number>()} color={cell.getValue() ? 'warning' : 'default'} variant="outlined" sx={{ borderRadius: 2 }} />
            ),
        },
        {
            accessorKey: 'voidedCount',
            header: 'VOID ❌',
            size: 110,
            muiTableBodyCellProps: { align: 'center' },
            Cell: ({ cell }) => (
                <Chip size="small" label={cell.getValue<number>()} color={cell.getValue() ? 'error' : 'default'} variant="outlined" sx={{ borderRadius: 2 }} />
            ),
        },
        {
            accessorKey: 'pendingVoidCount',
            header: 'VOID ⏳',
            size: 140,
            muiTableBodyCellProps: { align: 'center' },
            Cell: ({ cell }) => (
                <Chip size="small" label={cell.getValue<number>()} color={cell.getValue() ? 'warning' : 'default'} variant="outlined" sx={{ borderRadius: 2 }} />
            ),
        },
        {
            accessorKey: 'batchesCount',
            header: 'BATCHES',
            size: 120,
            muiTableBodyCellProps: { align: 'center' },
            Cell: ({ row }) => (
                <Button
                    size="small"
                    variant="outlined"
                    onClick={(e) => openBatches(e, row.original.invoice, row.original.batches)}
                    sx={{ borderRadius: 2, minWidth: 0, px: 1.25 }}
                    startIcon={<LayersRounded />}
                >
                    {row.original.batchesCount}
                </Button>
            ),
        },
        {
            accessorKey: 'itemsCount',
            header: 'ITEMS',
            size: 110,
            muiTableBodyCellProps: { align: 'center' },
            Cell: ({ row }) => (
                <Button
                    size="small"
                    variant="outlined"
                    onClick={(e) => openItems(e, row.original.invoice, row.original.batches, row.original.bills)}
                    sx={{ borderRadius: 2, minWidth: 0, px: 1.25 }}
                    startIcon={<ShoppingCartRounded />}
                    disabled={row.original.itemsCount === 0}
                >
                    {row.original.itemsCount}
                </Button>
            ),
        },
        {
            accessorKey: 'billsCount',
            header: 'BILLS',
            size: 90,
            muiTableBodyCellProps: { align: 'center' },
        },
    ], [openBatches, openItems]);


    const table = useMaterialReactTable({
        columns,
        data: rows,
        initialState: { density: 'comfortable' },

        state: {
            showProgressBars: loading,
            pagination,
        },
        manualPagination: true,
        rowCount,
        onPaginationChange: setPagination,

        columnFilterDisplayMode: 'popover',
        paginationDisplayMode: 'pages',
        positionToolbarAlertBanner: 'bottom',
        enableRowSelection: false,
        enableStickyHeader: true,
        muiTablePaperProps: { sx: { display: 'flex', flexDirection: 'column', flex: 1 } },
        muiTableContainerProps: { sx: { flex: 1 } },
    });

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
            {/* Header */}
            <Stack direction="row" alignItems="center" justifyContent="space-between">
                <Box>
                    <Typography variant="overline" color="text.secondary">Transactions / Orders</Typography>
                    {loading ? (
                        <Typography variant="body2" color="text.secondary">Loading…</Typography>
                    ) : error ? (
                        <Typography variant="body2" color="error.main">{error}</Typography>
                    ) : null}
                </Box>

                <Stack direction="row" spacing={1} alignItems="center">
                    {/* Date Pickers */}
                    <LocalizationProvider dateAdapter={AdapterMoment}>
                        <Stack direction="row" spacing={1}>
                            <DatePicker
                                label="Start Date"
                                value={startDate}
                                onChange={(newValue) => {
                                    setStartDate(newValue);
                                    setPagination((prev) => ({ ...prev, pageIndex: 0 }));
                                }}
                                slotProps={{ textField: { size: 'small', sx: { width: 150 } } }}
                            />
                            <DatePicker
                                label="End Date"
                                value={endDate}
                                onChange={(newValue) => {
                                    setEndDate(newValue);
                                    setPagination((prev) => ({ ...prev, pageIndex: 0 }));
                                }}
                                slotProps={{ textField: { size: 'small', sx: { width: 150 } } }}
                            />
                        </Stack>
                    </LocalizationProvider>

                    <Button variant="outlined" onClick={fetchTxns}>Refresh</Button>
                </Stack>
            </Stack>

            {/* Table */}
            <MaterialReactTable table={table} />

            {/* Popover: Batches */}
            <Popover
                open={Boolean(batchAnchor)}
                anchorEl={batchAnchor}
                onClose={closeBatches}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
                transformOrigin={{ vertical: 'top', horizontal: 'center' }}
                PaperProps={{ sx: { width: 560, maxWidth: 'calc(100vw - 32px)', borderRadius: 2, overflow: 'hidden' } }}
            >
                <Box
                    sx={{
                        px: 2, py: 1,
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        backgroundColor: (t) => t.palette.background.paper,
                        borderBottom: (t) => `1px solid ${t.palette.divider}`,
                    }}
                >
                    <Typography variant="subtitle2">Batches — {batchTitle}</Typography>
                    <Chip size="small" variant="outlined" label={`${batchList.length} batch`} sx={{ borderRadius: 2 }} />
                </Box>

                <Box ref={batchListRef} sx={{ maxHeight: 460, overflow: 'auto', p: 1, pt: 0.5, minWidth: 400, touchAction: 'pan-y', overscrollBehavior: 'contain' }}>
                    {batchList.length === 0 ? (
                        <Box sx={{ px: 2, py: 3 }}>
                            <Typography variant="body2" color="text.secondary">Tidak ada batch.</Typography>
                        </Box>
                    ) : (
                        <List dense disablePadding>
                            <ListItem
                                disableGutters
                                sx={{ px: 1.5, py: 0.75, position: 'sticky', top: 0, zIndex: 1, backgroundColor: (t) => t.palette.background.paper, borderBottom: (t) => `1px solid ${t.palette.divider}` }}
                            >
                                <Typography variant="caption" sx={{ flex: 1, fontWeight: 700, color: 'text.secondary' }}>Batch • Created</Typography>
                                <Typography variant="caption" sx={{ width: 160, textAlign: 'right', fontWeight: 700, color: 'text.secondary' }}>Created By</Typography>
                                <Typography variant="caption" sx={{ width: 100, textAlign: 'right', fontWeight: 700, color: 'text.secondary' }}>Items</Typography>
                            </ListItem>

                            {batchList.map((b, i) => (
                                <React.Fragment key={b.id}>
                                    <ListItem disableGutters sx={{ px: 1.5, py: 0.75, gap: 1.25, '&:hover': { backgroundColor: (t) => t.palette.action.hover } }}>
                                        <ListItemAvatar>
                                            <Avatar variant="rounded" sx={{ width: 28, height: 28, borderRadius: 1 }}>
                                                <LayersRounded fontSize="small" />
                                            </Avatar>
                                        </ListItemAvatar>
                                        <ListItemText
                                            primary={
                                                <Stack direction="row" spacing={1} alignItems="center" sx={{ minWidth: 0 }}>
                                                    <Typography variant="body2" fontWeight={600} noWrap title={`Batch ${b.batch}`}>Batch {b.batch}</Typography>
                                                    <Chip size="small" variant="outlined" label={fmtDateTime(b.time_created)} sx={{ borderRadius: 2 }} />
                                                </Stack>
                                            }
                                            secondary={b.note ? <Typography variant="caption" color="text.secondary" noWrap title={b.note}>{b.note}</Typography> : null}
                                            sx={{ m: 0, flex: 1, minWidth: 0 }}
                                        />
                                        <Typography variant="body2" sx={{ width: 160, textAlign: 'right' }}>
                                            {fullName(b.reference)}
                                        </Typography>
                                        <Typography variant="body2" sx={{ width: 100, textAlign: 'right' }}>
                                            {b.items?.length ?? 0}
                                        </Typography>
                                    </ListItem>
                                    {i < batchList.length - 1 ? <Divider sx={{ mx: 1.5 }} /> : null}
                                </React.Fragment>
                            ))}
                        </List>
                    )}
                </Box>

                <Box sx={{ px: 1.5, py: 1, textAlign: 'right' }}>
                    <Button size="small" onClick={closeBatches}>Tutup</Button>
                </Box>
            </Popover>

            {/* Popover: Items */}
            <Popover
                open={Boolean(itemAnchor)}
                anchorEl={itemAnchor}
                onClose={closeItems}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
                transformOrigin={{ vertical: 'top', horizontal: 'center' }}
                PaperProps={{ sx: { width: 760, maxWidth: 'calc(100vw - 32px)', borderRadius: 2, overflow: 'hidden' } }}
            >
                <Box
                    sx={{
                        px: 2, py: 1,
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        backgroundColor: (t) => t.palette.background.paper,
                        borderBottom: (t) => `1px solid ${t.palette.divider}`,
                    }}
                >
                    <Typography variant="subtitle2">Items — {itemTitle}</Typography>
                    <Chip size="small" variant="outlined" label={`${flatItems.length} item`} sx={{ borderRadius: 2 }} />
                </Box>

                <Box ref={itemListRef} sx={{ maxHeight: 520, overflow: 'auto', p: 1, pt: 0.5, minWidth: 500, touchAction: 'pan-y', overscrollBehavior: 'contain' }}>
                    {flatItems.length === 0 ? (
                        <Box sx={{ px: 2, py: 3 }}>
                            <Typography variant="body2" color="text.secondary">Tidak ada item.</Typography>
                        </Box>
                    ) : (
                        <List dense disablePadding>
                            <ListItem
                                disableGutters
                                sx={{ px: 1.5, py: 0.75, position: 'sticky', top: 0, zIndex: 1, backgroundColor: (t) => t.palette.background.paper, borderBottom: (t) => `1px solid ${t.palette.divider}` }}
                            >
                                <Typography variant="caption" sx={{ flex: 1, fontWeight: 700, color: 'text.secondary' }}>Product / Variant</Typography>
                                <Typography variant="caption" sx={{ width: 130, textAlign: 'right', fontWeight: 700, color: 'text.secondary' }}>Created By</Typography>
                                <Typography variant="caption" sx={{ width: 70, textAlign: 'right', fontWeight: 700, color: 'text.secondary' }}>Qty</Typography>
                                <Typography variant="caption" sx={{ width: 120, textAlign: 'right', fontWeight: 700, color: 'text.secondary' }}>Price</Typography>
                                <Typography variant="caption" sx={{ width: 140, textAlign: 'right', fontWeight: 700, color: 'text.secondary' }}>Subtotal</Typography>
                            </ListItem>

                            {flatItems.map((it, idx) => {
                                const prod = it.product?.name ?? '—';
                                const variant = it.variant?.name ? `${it.variant.name} (${it.variant.code})` : '—';

                                // status per item via bill map
                                const paidInfo = itemBillMap.get(it.id);
                                const isPaid = paidInfo?.paid === true;
                                const isVoided = it.void === true;
                                const isPendingVoid = it.void === null;

                                return (
                                    <React.Fragment key={it.id}>
                                        <ListItem
                                            disableGutters
                                            sx={{ px: 1.5, py: 0.75, gap: 1.25, '&:hover': { backgroundColor: (t) => t.palette.action.hover } }}
                                        >
                                            <ListItemAvatar>
                                                <Avatar variant="rounded" sx={{ width: 28, height: 28, borderRadius: 1 }}>
                                                    <ShoppingCartRounded fontSize="small" />
                                                </Avatar>
                                            </ListItemAvatar>
                                            <ListItemText
                                                primary={
                                                    <Stack direction="row" spacing={1} alignItems="center" sx={{ minWidth: 0 }}>
                                                        <Typography variant="body2" fontWeight={600} noWrap title={prod}>{prod}</Typography>
                                                        <Typography variant="body2" color="text.secondary" noWrap title={variant}>— {variant}</Typography>
                                                        <Stack direction="row" spacing={0.5} alignItems="center" sx={{ flexWrap: 'wrap' }}>
                                                            {isPaid ? (
                                                                <Chip size="small" color="success" label="Paid" sx={{ borderRadius: 2 }} />
                                                            ) : (
                                                                <Chip size="small" label="Pending Paid" sx={{ borderRadius: 2 }} />
                                                            )}
                                                            {isVoided && <Chip size="small" color="error" label="Voided" sx={{ borderRadius: 2 }} />}
                                                            {(!isVoided && isPendingVoid) && <Chip size="small" color="warning" label="Pending Void" sx={{ borderRadius: 2 }} />}
                                                            {paidInfo?.billIds?.length ? (
                                                                <Chip size="small" variant="outlined" label={`Bills: ${paidInfo.billIds.length}`} sx={{ borderRadius: 2 }} />
                                                            ) : null}
                                                        </Stack>
                                                    </Stack>
                                                }
                                                secondary={null}
                                                sx={{ m: 0, flex: 1, minWidth: 0 }}
                                            />
                                            <Typography variant="body2" sx={{ width: 130, textAlign: 'right' }}>
                                                {fullName(it.reference)}
                                            </Typography>
                                            <Typography variant="body2" sx={{ width: 70, textAlign: 'right' }}>
                                                {it.qty}
                                            </Typography>
                                            <Typography variant="body2" sx={{ width: 120, textAlign: 'right' }}>
                                                {toIDR(it.price)}
                                            </Typography>
                                            <Typography variant="body2" sx={{ width: 140, textAlign: 'right' }}>
                                                {toIDR(it.sub_total)}
                                            </Typography>
                                        </ListItem>
                                        {idx < flatItems.length - 1 ? <Divider sx={{ mx: 1.5 }} /> : null}
                                    </React.Fragment>
                                );
                            })}
                        </List>
                    )}
                </Box>

                <Box sx={{ px: 1.5, py: 1, textAlign: 'right' }}>
                    <Button size="small" onClick={closeItems}>Tutup</Button>
                </Box>
            </Popover>
        </Box>
    );
}
