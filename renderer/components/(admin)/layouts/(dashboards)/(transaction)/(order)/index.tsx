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
    DataTable,
    Column,
    useNonPassiveWheel,
} from './(components)/TablesLayoutConstructor';

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
        window.api
            .invoke('api.transaction:read.all', {})
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
                setError(null);
            })
            .catch((err: any) => {
                console.error(err);
                setRows([]);
                setError(err?.msg ?? 'Gagal memuat transaksi. Periksa Koneksi Jaringan / Server');
            })
            .finally(() => setLoading(false));
    }, []);

    React.useEffect(() => { fetchTxns(); }, [fetchTxns]);

    const columns: Column<RowTxn>[] = [
        {
            key: 'invoiceCell',
            label: 'INVOICE',
            sortable: true,
            width: 240,
            minWidth: 220,
            headerFilter: { type: 'text' },
        },
        {
            key: 'orderType',
            label: 'Info',
            sortable: true,
            width: 220,
            minWidth: 200,
            headerFilter: { type: 'text' },
            render: (r) => (
                <Typography variant="body2" noWrap title={`${r.orderType ?? ''}${r.tableCode ? ` • ${r.tableCode}` : ''}`}>
                    <strong>{r.orderType ?? '—'}</strong>{r.tableCode ? ` • ${r.tableCode}` : ''} •  {r.shiftName ?? '—'}
                </Typography>
            ),
        },
        {
            key: 'createdBy',
            label: 'KASIR',
            sortable: true,
            width: 180,
            minWidth: 160,
            headerFilter: { type: 'text' },
            render: (r) => (
                <Chip size="small" variant="outlined" label={r.createdBy ?? '—'} sx={{ borderRadius: 2, maxWidth: 160 }} />
            ),
        },
        /* ===== Status: dipisah kolom ===== */
        {
            key: 'closedAt',
            label: 'CLOSED AT',
            sortable: true,
            width: 190,
            minWidth: 160,
            render: (r) =>
                r.closedAt ? (
                    <Chip size="small" icon={<ScheduleRounded />} label={fmtDateTime(r.closedAt)} variant="outlined" sx={{ borderRadius: 2 }} />
                ) : (
                    <Typography variant="body2" color="text.secondary">—</Typography>
                ),
        },
        {
            key: 'paidState',
            label: 'PAID',
            sortable: false,
            align: 'center',
            width: 120,
            minWidth: 110,
            render: (r) => (
                <Chip
                    size="small"
                    icon={<PaidRounded />}
                    label={r.fullyPaid ? 'Paid' : 'Pending'}
                    color={r.fullyPaid ? 'success' : 'default'}
                    variant="outlined"
                    sx={{ borderRadius: 2 }}
                />
            ),
        },
        {
            key: 'successPaidCount',
            label: 'PAID',
            sortable: true,
            align: 'center',
            width: 110,
            minWidth: 100,
            render: (r) => (
                <Chip size="small" label={r.successPaidCount} color={r.successPaidCount ? 'success' : 'default'} variant="outlined" sx={{ borderRadius: 2 }} />
            ),
        },
        {
            key: 'pendingPaidCount',
            label: 'PAID ⏳',
            sortable: true,
            align: 'center',
            width: 150,
            minWidth: 130,
            render: (r) => (
                <Chip size="small" label={r.pendingPaidCount} color={r.pendingPaidCount ? 'warning' : 'default'} variant="outlined" sx={{ borderRadius: 2 }} />
            ),
        },
        {
            key: 'voidedCount',
            label: 'VOIDED',
            sortable: true,
            align: 'center',
            width: 110,
            minWidth: 100,
            render: (r) => (
                <Chip size="small" label={r.voidedCount} color={r.voidedCount ? 'error' : 'default'} variant="outlined" sx={{ borderRadius: 2 }} />
            ),
        },
        {
            key: 'pendingVoidCount',
            label: 'VOID ⏳',
            sortable: true,
            align: 'center',
            width: 140,
            minWidth: 120,
            render: (r) => (
                <Chip size="small" label={r.pendingVoidCount} color={r.pendingVoidCount ? 'warning' : 'default'} variant="outlined" sx={{ borderRadius: 2 }} />
            ),
        },
        {
            key: 'batchesCount',
            label: 'BATCHES',
            sortable: true,
            align: 'center',
            width: 120,
            minWidth: 110,
            render: (r) => (
                <Button
                    size="small"
                    variant="outlined"
                    onClick={(e) => openBatches(e, r.invoice, r.batches)}
                    sx={{ borderRadius: 2, minWidth: 0, px: 1.25 }}
                    startIcon={<LayersRounded />}
                >
                    {r.batchesCount}
                </Button>
            ),
        },
        {
            key: 'itemsCount',
            label: 'ITEMS',
            sortable: true,
            align: 'center',
            width: 110,
            minWidth: 100,
            render: (r) => (
                <Button
                    size="small"
                    variant="outlined"
                    onClick={(e) => openItems(e, r.invoice, r.batches, r.bills)}
                    sx={{ borderRadius: 2, minWidth: 0, px: 1.25 }}
                    startIcon={<ShoppingCartRounded />}
                    disabled={r.itemsCount === 0}
                >
                    {r.itemsCount}
                </Button>
            ),
        },
        {
            key: 'billsCount',
            label: 'BILLS',
            sortable: true,
            align: 'center',
            width: 90,
            minWidth: 80,
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
                <Stack direction="row" spacing={1}>
                    <Button variant="outlined" onClick={fetchTxns}>Refresh</Button>
                </Stack>
            </Stack>

            {/* Table */}
            <DataTable<RowTxn>
                columns={columns}
                rows={rows}
                initialRowsPerPage={15}
                enableSelection={false}
            />

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
