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
    ListItemText,
    Popover,
    Stack,
    Typography,
} from '@mui/material';
import ReceiptLongRounded from '@mui/icons-material/ReceiptLongRounded';
import PrintRounded from '@mui/icons-material/PrintRounded';
import AddRounded from '@mui/icons-material/AddRounded';

import {
    DataTable,
    Column,
    useNonPassiveWheel,
} from './(components)/TablesLayoutConstructor';
import PerfectScrollbar from 'react-perfect-scrollbar';
import 'react-perfect-scrollbar/dist/css/styles.css';
import {useGodModeProvider} from "../../../../context/GodModeProviderContext";

/* =========================================================
 * Helpers
 * =======================================================*/
const toNum = (v?: string | number | null) => v == null ? 0 : (typeof v === 'number' ? v : Number(v));
const formatRupiahNoPrefix = (n: number) => new Intl.NumberFormat('id-ID', { maximumFractionDigits: 0 }).format(n);

/* =========================================================
 * API Types (disesuaikan dari response yang kamu kirim)
 * =======================================================*/
type ApiNameRef = { first_name?: string; last_name?: string };
type ApiAccountRef = {
    id: string;
    name?: ApiNameRef;
    username?: string;
    password?: string;
    time_created?: string;
    time_updated?: string;
};

type ApiPrinterOptions = { mode?: 'USB' | 'SERIAL' | 'NETWORK' | string; port?: number; timeout?: number; ip_address?: string };
type ApiPrinter = {
    id: string; name: string; description?: string | null; options?: ApiPrinterOptions | null;
    time_created?: string; time_updated?: string; status?: boolean;
};

type ApiCategory = {
    id: string; name: string; description?: string | null; status?: boolean;
    time_created?: string; time_updated?: string; printer?: ApiPrinter[];
};

type ApiProduct = {
    id: string; name: string; description?: string | null; image?: string | null; status?: boolean;
    time_created?: string; time_updated?: string; category?: ApiCategory[];
};

type ApiVariant = {
    id: string; code?: string; name?: string; description?: string | null; price?: string;
    time_created?: string; time_updated?: string;
};

type ApiTransactionItem = {
    id: string; qty: number; price: string; sub_total: string; note?: string | null;
    time_created?: string; time_updated?: string;
    reference?: ApiAccountRef;
    product?: ApiProduct;
    variant?: ApiVariant;
};

type ApiLineItem = {
    id: string; qty: number; price: string; sub_total: string;
    time_created?: string; time_updated?: string;
    branch?: any[];
    transactionItem: ApiTransactionItem;
};

type ApiShift = {
    id: string; name: string; start_time?: string; end_time?: string; status?: boolean;
    time_created?: string; time_updated?: string; reference?: ApiAccountRef;
};

type ApiOrderType = {
    id: string; code: string; name: string; icon?: string; description?: string; required_table_select?: boolean; status?: boolean;
    time_created?: string; time_updated?: string; reference?: ApiAccountRef;
};

type ApiBranchSlim = {
    id: string; name: string; address?: string | null; phone?: string | null; email?: string | null; website?: string | null;
    time_created?: string; time_updated?: string; reference?: ApiAccountRef;
};

type ApiTransaction = {
    id: string; invoice: string; time_created?: string; time_updated?: string; time_closed?: string | null;
    reference?: ApiAccountRef;
    branch?: ApiBranchSlim[];
    shift?: ApiShift;
    order_type?: ApiOrderType;
    table?: any | null;
    batches?: { id: string; batch: number; note?: string | null; time_created?: string; time_updated?: string; reference?: ApiAccountRef }[];
};

type ApiPaid = {
    id: string; status: boolean; tender: string;
    time_created?: string; time_updated?: string;
};

type ApiBranchRoot = ApiBranchSlim;

type ApiBill = {
    id: string;
    number: string;
    time_created?: string;
    time_updated?: string;
    is_hide?: boolean;
    reference?: ApiAccountRef;
    branch?: ApiBranchRoot[];
    transaction: ApiTransaction;
    items: ApiLineItem[];
    paid: ApiPaid;
};

type ApiBillsResponse = {
    status: boolean; code: number; msg: string; data: ApiBill[];
};

/* =========================================================
 * Row untuk DataTable
 * =======================================================*/
type RowTransactionBill = {
    id: string;
    number: string;
    invoice: string;
    branchName?: string | null;
    orderType?: string | null;

    itemsCount: number;
    total: number;       // sum(items[i].qty * price) atau sub_total
    grandTotal: number;  // sementara = total (hook pajak/discount gampang)
    paidStatus: boolean;
    paidTender: number;

    billCell: React.ReactNode;
    itemsCell: React.ReactNode;
    statusCell: React.ReactNode;

    _itemsRaw: ApiLineItem[];
};

/* =========================================================
 * Hook Popover Items (PerfectScrollbar + klik-able)
 * =======================================================*/
function useBillItemPopover() {
    const [anchor, setAnchor] = React.useState<HTMLElement | null>(null);
    const [ctx, setCtx] = React.useState<{ title: string; items: ApiLineItem[] } | null>(null);
    const ref = React.useRef<HTMLDivElement>(null);
    useNonPassiveWheel(ref);

    const open = (e: React.MouseEvent<HTMLElement>, title: string, items: ApiLineItem[]) => { setAnchor(e.currentTarget); setCtx({ title, items }); };
    const close = () => { setAnchor(null); setCtx(null); };

    const node = (
        <Popover
            open={Boolean(anchor)}
            anchorEl={anchor}
            onClose={close}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            transformOrigin={{ vertical: 'top', horizontal: 'center' }}
            PaperProps={{ sx: { width: 420, maxWidth: 'calc(100vw - 32px)', borderRadius: 2, overflow: 'hidden' } }}
        >
            <Box sx={{ px: 2, py: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: t => `1px solid ${t.palette.divider}` }}>
                <Typography variant="subtitle2">Items — {ctx?.title ?? ''}</Typography>
                <Chip size="small" variant="outlined" label={`${ctx?.items?.length ?? 0} item`} sx={{ borderRadius: 2 }} />
            </Box>

            <Box ref={ref} sx={{ maxHeight: 320, overflow: 'auto', p: 1, pt: 0.5, minWidth: 320, touchAction: 'pan-y', overscrollBehavior: 'contain' }}>
                {!ctx?.items?.length ? (
                    <Box sx={{ px: 2, py: 3 }}>
                        <Typography variant="body2" color="text.secondary">Tidak ada item.</Typography>
                    </Box>
                ) : (
                    <PerfectScrollbar options={{ suppressScrollX: true }}>
                        <List dense disablePadding>
                            {ctx.items.map((li, i) => {
                                const p = li.transactionItem?.product?.name ?? '—';
                                const v = li.transactionItem?.variant?.name ? ` · ${li.transactionItem?.variant?.name}` : '';
                                const qty = li.qty;
                                const price = toNum(li.price);
                                const sub = toNum(li.sub_total) || (price * qty);
                                return (
                                    <React.Fragment key={li.id}>
                                        <ListItem
                                            disableGutters
                                            onClick={() => console.log('click item', li)} // TODO: ganti ke aksi kamu
                                            sx={{ px: 1.5, py: 0.75, gap: 1.25, cursor: 'pointer', '&:hover': { backgroundColor: t => t.palette.action.hover } }}
                                        >
                                            <ListItemText
                                                primary={<Typography variant="body2" fontWeight={600} noWrap>{p}{v}</Typography>}
                                                secondary={<Typography variant="caption" color="text.secondary">{qty} × {formatRupiahNoPrefix(price)}</Typography>}
                                                sx={{ m: 0, pr: 1 }}
                                            />
                                            <Typography variant="body2">{formatRupiahNoPrefix(sub)}</Typography>
                                        </ListItem>
                                        {i < (ctx.items.length - 1) ? <Divider sx={{ mx: 1.5 }} /> : null}
                                    </React.Fragment>
                                );
                            })}
                        </List>
                    </PerfectScrollbar>
                )}
            </Box>

            <Box sx={{ px: 1.5, py: 1, textAlign: 'right' }}>
                <Button size="small" onClick={close}>Tutup</Button>
            </Box>
        </Popover>
    );

    return { node, open };
}

/* =========================================================
 * Mapper: Api → Row
 * =======================================================*/
const mapBillsToRows = (bills: ApiBill[]): RowTransactionBill[] =>
    (bills ?? []).map(b => {
        const branchName = b.branch?.[0]?.name ?? b.transaction?.branch?.[0]?.name ?? null;
        const orderType = b.transaction?.order_type?.name ?? null;
        const items = b.items ?? [];
        const itemsCount = items.length;

        // total = sum(qty * price) fallback ke sub_total kalo ada
        const total = items
            .map(it => (toNum(it.sub_total) || (toNum(it.price) * it.qty)))
            .reduce((acc, n) => acc + n, 0);

        const grandTotal = total; // hook pajak/discount tinggal disini
        const paidTender = toNum(b.paid?.tender);
        const paidStatus = !!b.paid?.status;

        return {
            id: b.id,
            number: b.number,
            invoice: b.transaction?.invoice ?? '—',
            branchName,
            orderType,
            itemsCount,
            total,
            grandTotal,
            paidStatus,
            paidTender,

            billCell: (
                <Stack direction="row" spacing={1.25} alignItems="center" sx={{ minWidth: 0 }}>
                    <Avatar variant="rounded" sx={{ width: 32, height: 32, borderRadius: 1 }}>
                        <PrintRounded fontSize="small" />
                    </Avatar>
                    <Box sx={{ minWidth: 0 }}>
                        <Typography variant="body2" fontWeight={600} noWrap title={`#${b.number} · Inv ${b.transaction?.invoice ?? ''}`}>
                            #{b.number}
                        </Typography>
                        <Typography variant="caption" color="text.secondary" noWrap title={orderType ?? ''}>
                            Inv {b.transaction?.invoice ?? '—'} · {orderType ?? '—'}
                        </Typography>
                    </Box>
                </Stack>
            ),

            itemsCell: <></>,
            statusCell: <></>,
            _itemsRaw: items,
        };
    });

/* =========================================================
 * Kolom DataTable
 * =======================================================*/
const makeColumns = (openItems: (e: React.MouseEvent<HTMLElement>, title: string, items: ApiLineItem[]) => void): Column<RowTransactionBill>[] => [
    {
        key: 'billCell',
        label: 'BILL',
        sortable: true,
        width: 320,
        minWidth: 240,
    },
    {
        key: 'branchName',
        label: 'BRANCH',
        sortable: true,
        width: 220,
        minWidth: 180,
        render: r => (
            <Typography variant="body2" color="text.secondary" noWrap title={r.branchName ?? ''}>
                {r.branchName ?? '—'}
            </Typography>
        ),
    },
    {
        key: 'orderType',
        label: 'ORDER TYPE',
        sortable: true,
        width: 160,
        minWidth: 140,
        render: r => <Chip size="small" label={r.orderType ?? '—'} variant="outlined" sx={{ borderRadius: 2 }} />,
    },
    {
        key: 'itemsCount',
        label: 'ITEMS',
        sortable: true,
        align: 'center',
        width: 120,
        minWidth: 100,
        render: r => (
            <Button
                size="small"
                variant="outlined"
                startIcon={<ReceiptLongRounded />}
                onClick={e => openItems(e, `#${r.number}`, r._itemsRaw)}
                sx={{ borderRadius: 2, minWidth: 0, px: 1.25 }}
            >
                {r.itemsCount}
            </Button>
        ),
    },
    {
        key: 'total',
        label: 'TOTAL',
        sortable: true,
        align: 'right',
        width: 140,
        minWidth: 120,
        render: r => <Typography variant="body2">{formatRupiahNoPrefix(r.total)}</Typography>,
    },
    {
        key: 'grandTotal',
        label: 'GRAND TOTAL',
        sortable: true,
        align: 'right',
        width: 160,
        minWidth: 140,
        render: r => <Typography variant="body2" fontWeight={700}>{formatRupiahNoPrefix(r.grandTotal)}</Typography>,
    },
    {
        key: 'paidStatus',
        label: 'PAID',
        sortable: true,
        align: 'center',
        width: 120,
        minWidth: 110,
        render: r => (
            <Chip
                size="small"
                label={r.paidStatus ? 'Paid' : 'Unpaid'}
                color={r.paidStatus ? 'success' : 'default'}
                variant="outlined"
                sx={{ borderRadius: 2 }}
            />
        ),
    },
];

/* =========================================================
 * Komponen Halaman
 * =======================================================*/
export default function TransactionBills() {
    const [rows, setRows] = React.useState<RowTransactionBill[]>([]);
    const [loading, setLoading] = React.useState(false);
    const [error, setError] = React.useState<string | null>(null);
    const { godMode, setGodMode } = useGodModeProvider();

    // Popover Items
    const { node: itemsPopover, open: openItems } = useBillItemPopover();

    // FETCH
    const fetchBills = React.useCallback(() => {
        if (!window.api) {
            console.error('Failed Get Window Api Bridge');
            setError('Bridge tidak tersedia');
            return;
        }
        setLoading(true);

        // TODO: sesuaikan channel IPC kamu di sini:
        // misal 'api.transaction.bill:read.all' atau 'api.resources.transaction.bill:read.all'
        window.api
            .invoke('api.transaction.bills:read.all', {
                is_hide: godMode
            })
            .then((result: ApiBillsResponse) => {
                const data = (result?.data ?? []) as ApiBill[];
                const mapped = mapBillsToRows(data);
                setRows(mapped);
                setError(null);
            })
            .catch((err: any) => {
                console.error(err);
                setRows([]);
                setError(err?.msg ?? 'Gagal memuat bills. Periksa Koneksi Jaringan / Server');
            })
            .finally(() => setLoading(false));
    }, [godMode]);

    React.useEffect(() => { fetchBills(); }, [fetchBills, godMode]);

    const columns = React.useMemo(() => makeColumns(openItems), [openItems]);

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
                    <Typography variant="overline" color="text.secondary">Transactions / Bills</Typography>
                    {loading ? (
                        <Typography variant="body2" color="text.secondary">Loading…</Typography>
                    ) : error ? (
                        <Typography variant="body2" color="error.main">{error}</Typography>
                    ) : null}
                </Box>
                <Stack direction="row" spacing={1}>
                    <Button variant="outlined" onClick={fetchBills}>Refresh</Button>
                    <Button variant="contained" startIcon={<AddRounded />} onClick={() => console.log('open create bill')}>
                        Tambah Bill
                    </Button>
                </Stack>
            </Stack>

            {/* DataTable */}
            <DataTable<RowTransactionBill>
                columns={columns}
                rows={rows}
                initialRowsPerPage={15}
                enableSelection={false}
            />

            {/* Popover Items */}
            {itemsPopover}
        </Box>
    );
}
